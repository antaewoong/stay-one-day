import { NextRequest, NextResponse } from 'next/server'
import { withHostAuth } from '@/middleware/withHostAuth'
import { getNaverDataLabClient } from '@/lib/naver-datalab'
import { getKeywordTargetingSystem } from '@/lib/keyword-targeting'
import { checkAndIncrementQuota, createQuotaExceededError } from '@/utils/quota-manager'
import {
  withCache,
  getTrendsCacheKey,
  CACHE_TTL
} from '@/utils/cache-manager'

export const GET = withHostAuth(async (req, db, { userId, host }) => {
  const startTime = Date.now()

  try {
    const { searchParams } = req.nextUrl
    const accommodationId = searchParams.get('accommodationId')
    const tempKeywords = searchParams.get('tempKeywords')?.split(',').filter(Boolean) || []

    if (!accommodationId) {
      return NextResponse.json({ error: '숙소 ID가 필요합니다' }, { status: 400 })
    }

    // 1. 표준화된 쿼터 확인
    const quotaCheck = checkAndIncrementQuota(userId, 'manual')
    if (!quotaCheck.success) {
      return NextResponse.json(quotaCheck.error, { status: quotaCheck.status })
    }

    // 2. 숙소 정보 및 선택된 키워드 조회
    const { data: accommodation, error: accomError } = await db
      .from('accommodations')
      .select('id, name, city, region, accommodation_type')
      .eq('id', accommodationId)
      .eq('host_id', userId)
      .single()

    if (accomError || !accommodation) {
      return NextResponse.json({ error: '숙소를 찾을 수 없습니다' }, { status: 404 })
    }

    // 3. 키워드 처리 (임시 키워드 우선, 없으면 선택된 키워드 사용)
    let selectedKeywords: string[] = []

    if (tempKeywords.length > 0) {
      const keywordSystem = getKeywordTargetingSystem()
      selectedKeywords = await keywordSystem.normalizeAndMapKeywords(tempKeywords)
    } else {
      // DB에서 선택된 키워드 조회 (Mock - 실제로는 accommodation_keywords 조인)
      selectedKeywords = ['kids-pool', 'bridal-party', 'pool-villa']
    }

    // 4. 캐시 확인 및 데이터 조회
    const cacheKey = getTrendsCacheKey(
      accommodation.city,
      accommodation.region,
      selectedKeywords
    )

    const { data: trendData, fromCache, cacheInfo } = await withCache(
      cacheKey,
      CACHE_TTL.TRENDS,
      async () => {
        const naverClient = getNaverDataLabClient()
        return await naverClient.getLocationTrends(
          accommodation.city,
          accommodation.region,
          accommodation.accommodation_type || '펜션',
          selectedKeywords
        )
      }
    )

    // 상위 10개 트렌드 키워드 선별
    const topTrends = trendData
      .sort((a, b) => b.searchVolume - a.searchVolume)
      .slice(0, 10)

    // 각 키워드별 패키지 제안 생성
    const packageSuggestions = await generatePackageSuggestions(topTrends, accommodation)

    // 5. 키워드 기반 인사이트 생성
    const keywordInsights = generateKeywordInsights(trendData, selectedKeywords)
    const competitiveAnalysis = analyzeKeywordCompetitiveness(trendData, selectedKeywords)
    const actionPlan = generateKeywordActionPlan(trendData, selectedKeywords, accommodation)

    // 6. 성능 로깅
    const duration = Date.now() - startTime
    console.log(`[LOCAL_TRENDS] accommodation_id=${accommodationId} keywords=${selectedKeywords.length} fromCache=${fromCache} duration=${duration}ms`)

    return NextResponse.json({
      success: true,
      accommodationName: accommodation.name,
      location: `${accommodation.city}, ${accommodation.region}`,

      // 키워드 컨텍스트
      keywordContext: {
        selectedKeywords,
        isTemporaryAnalysis: tempKeywords.length > 0,
        keywordBasedAnalysis: selectedKeywords.length > 0
      },

      // 트렌드 분석 결과
      trendAnalysis: {
        totalKeywords: trendData.length,
        highGrowthKeywords: trendData.filter(t => t.trend === 'up').length,
        averageGrowthRate: trendData.reduce((sum, t) => sum + t.growthRate, 0) / trendData.length,
        topPerformingKeyword: trendData.sort((a, b) => b.searchVolume - a.searchVolume)[0]?.keyword,
        marketOpportunities: identifyMarketOpportunities(trendData, selectedKeywords)
      },

      // 상세 트렌드 데이터
      trends: trendData.map((trend, index) => ({
        ...trend,
        id: `trend_${index}`,
        isTargetKeyword: selectedKeywords.some(kw => trend.keyword.includes(kw)),
        opportunityScore: calculateOpportunityScore(trend),
        actionPriority: getActionPriority(trend, selectedKeywords),
        marketingPotential: assessMarketingPotential(trend)
      })),

      // 키워드 인사이트
      keywordInsights,

      // 경쟁 우위 분석
      competitiveAnalysis: {
        advantages: competitiveAnalysis,
        marketGaps: identifyMarketGaps(trendData, selectedKeywords),
        positioningOpportunities: getPositioningOpportunities(trendData),
        recommendedFocus: getRecommendedFocus(trendData, selectedKeywords)
      },

      // 실행 계획
      actionPlan,

      // 성과 예측
      performancePredictions: {
        expectedTrafficIncrease: predictTrafficIncrease(trendData, selectedKeywords),
        revenueImpact: predictRevenueImpact(trendData),
        marketShareGrowth: predictMarketShare(trendData, selectedKeywords),
        timeToResults: estimateTimeToResults(selectedKeywords)
      },

      // 마케팅 제안
      marketingSuggestions: generateMarketingSuggestions(trendData, selectedKeywords, accommodation),

      // 메타데이터
      dataSource: fromCache ? 'cache' : 'naver_datalab_with_keywords',
      cacheInfo: {
        fromCache,
        cacheAge: cacheInfo.age_ms,
        cacheExpiry: cacheInfo.expires_at
      },
      quota_status: {
        used: quotaCheck.quota?.total_runs || 0,
        remaining: 2 - (quotaCheck.quota?.total_runs || 0),
        reset_date: quotaCheck.quota?.next_available
      },
      updateTime: new Date().toISOString()
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[LOCAL_TRENDS_ERROR] user_id=${userId} duration=${duration}ms error:`, error)

    // API 오류 시 쿼터 롤백 (실제 구현에서는 DB 트랜잭션 사용)
    console.warn(`쿼터 롤백 필요: ${userId}`)

    return NextResponse.json({
      error: '지역 트렌드 분석 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
})

// 계절별 키워드 생성
function getSeasonalKeywords(month: number, city: string) {
  const seasonal: Record<string, string[]> = {
    spring: ['벚꽃', '피크닉', '캠핑', '산책', '봄나들이'],
    summer: ['계곡', '수영', '바베큐', '시원한 곳', '여름휴가'],
    autumn: ['단풍', '등산', '힐링', '온천', '가을여행'],
    winter: ['스키', '눈', '온천', '겨울축제', '따뜻한 곳']
  }

  let season = 'spring'
  if (month >= 6 && month <= 8) season = 'summer'
  else if (month >= 9 && month <= 11) season = 'autumn'
  else if (month >= 12 || month <= 2) season = 'winter'

  return seasonal[season].map(keyword => `${city} ${keyword}`)
}

// Mock 트렌드 데이터 생성 (실제로는 네이버 DataLab API 사용)
async function generateMockTrendData(keywords: string[], accommodation: any) {
  return keywords.map((keyword, index) => ({
    keyword,
    searchVolume: Math.floor(Math.random() * 1000) + 100,
    trend: Math.random() > 0.5 ? 'up' : 'down',
    growthRate: (Math.random() - 0.5) * 100,
    competitionLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    relatedTerms: generateRelatedTerms(keyword)
  }))
}

// 관련 키워드 생성
function generateRelatedTerms(keyword: string) {
  const relatedSuffixes = ['추천', '맛집', '체험', '코스', '예약', '가격', '리뷰']
  return relatedSuffixes.slice(0, 3).map(suffix => `${keyword} ${suffix}`)
}

// 패키지 제안 생성
async function generatePackageSuggestions(trends: Array<{keyword: string, searchVolume: number, trend: string, competitionLevel: string}>, accommodation: any) {
  return trends.slice(0, 5).map(trend => {
    const packageType = getPackageType(trend.keyword)
    const price = calculateSuggestedPrice(packageType, accommodation)

    return {
      keyword: trend.keyword,
      packageTitle: generatePackageTitle(trend.keyword, accommodation.name),
      description: generatePackageDescription(trend.keyword, packageType),
      suggestedPrice: price,
      duration: getPackageDuration(packageType),
      targetAudience: getTargetAudience(trend.keyword),
      actionItems: generateActionItems(trend.keyword, packageType),
      estimatedDemand: trend.searchVolume
    }
  })
}

// 패키지 타입 결정
function getPackageType(keyword: string) {
  if (keyword.includes('바베큐') || keyword.includes('캠핑')) return 'outdoor'
  if (keyword.includes('카페') || keyword.includes('맛집')) return 'food'
  if (keyword.includes('체험') || keyword.includes('액티비티')) return 'activity'
  if (keyword.includes('힐링') || keyword.includes('온천')) return 'healing'
  return 'general'
}

// 패키지 제목 생성
function generatePackageTitle(keyword: string, accommodationName: string) {
  const templates = [
    `${keyword} 특별 패키지`,
    `${accommodationName}에서 즐기는 ${keyword}`,
    `${keyword} 완벽 체험`,
    `${keyword} 맞춤 상품`
  ]
  return templates[Math.floor(Math.random() * templates.length)]
}

// 패키지 설명 생성
function generatePackageDescription(keyword: string, packageType: string) {
  const descriptions: Record<string, string> = {
    outdoor: `${keyword}를 만끽할 수 있는 야외 체험 패키지입니다. 자연 속에서의 특별한 시간을 선사합니다.`,
    food: `${keyword} 관련 맛집 투어와 특별 식사가 포함된 미식 패키지입니다.`,
    activity: `${keyword}를 직접 체험할 수 있는 액티비티 중심 패키지입니다.`,
    healing: `${keyword}로 몸과 마음을 치유하는 힐링 중심 패키지입니다.`,
    general: `${keyword} 관련 다양한 체험을 즐길 수 있는 종합 패키지입니다.`
  }
  return descriptions[packageType] || descriptions.general
}

// 가격 제안 계산
function calculateSuggestedPrice(packageType: string, accommodation: any) {
  const basePrice = accommodation.base_price || 100000
  const multipliers: Record<string, number> = {
    outdoor: 1.3,
    food: 1.5,
    activity: 1.4,
    healing: 1.6,
    general: 1.2
  }
  return Math.floor(basePrice * (multipliers[packageType] || 1.2))
}

// 패키지 기간 제안
function getPackageDuration(packageType: string) {
  const durations: Record<string, string> = {
    outdoor: '1박 2일',
    food: '당일',
    activity: '1박 2일',
    healing: '2박 3일',
    general: '1박 2일'
  }
  return durations[packageType] || '1박 2일'
}

// 타겟 고객 분석
function getTargetAudience(keyword: string) {
  if (keyword.includes('가족') || keyword.includes('아이')) return '가족 고객'
  if (keyword.includes('데이트') || keyword.includes('커플')) return '커플 고객'
  if (keyword.includes('친구') || keyword.includes('모임')) return '친구 모임'
  if (keyword.includes('힐링') || keyword.includes('휴식')) return '개인/힐링 고객'
  return '일반 고객'
}

// 액션 아이템 생성
function generateActionItems(keyword: string, packageType: string) {
  const commonActions = [
    '숙소 소개글에 해당 키워드 추가',
    '관련 사진 업로드',
    '패키지 상품 등록'
  ]

  const specificActions: Record<string, string[]> = {
    outdoor: ['바베큐 시설 어필', '주변 자연경관 사진 추가'],
    food: ['지역 맛집 연계 협의', '식사 포함 패키지 구성'],
    activity: ['체험 프로그램 개발', '장비 대여 서비스 준비'],
    healing: ['힐링 공간 조성', '조용한 분위기 강조']
  }

  return [...commonActions, ...(specificActions[packageType] || [])]
}

// 다음 업데이트 시간 계산 (주 2회: 월, 목)
function getNextUpdateTime() {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0: 일요일, 1: 월요일, ...

  let daysToAdd = 0
  if (dayOfWeek < 1) { // 일요일
    daysToAdd = 1 // 다음 월요일
  } else if (dayOfWeek < 4) { // 월~수요일
    daysToAdd = 4 - dayOfWeek // 다음 목요일
  } else { // 목~토요일
    daysToAdd = 8 - dayOfWeek // 다다음 월요일
  }

  const nextUpdate = new Date(now)
  nextUpdate.setDate(nextUpdate.getDate() + daysToAdd)
  nextUpdate.setHours(9, 0, 0, 0) // 오전 9시

  return nextUpdate.toISOString()
}