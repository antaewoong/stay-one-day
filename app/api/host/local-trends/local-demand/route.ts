import { NextRequest, NextResponse } from 'next/server'
import { withHostAuth } from '@/middleware/withHostAuth'
import { getNaverDataLabClient } from '@/lib/naver-datalab'
import { getKeywordTargetingSystem } from '@/lib/keyword-targeting'
import { tryIncrementQuota } from '@/utils/quota-manager'

export const GET = withHostAuth(async (req, db, { userId, host }) => {
  try {
    const { searchParams } = req.nextUrl
    const accommodationId = searchParams.get('accommodationId')
    const tempKeywords = searchParams.get('tempKeywords')?.split(',').filter(Boolean) || []

    if (!accommodationId) {
      return NextResponse.json({ error: '숙소 ID가 필요합니다' }, { status: 400 })
    }

    // 쿼터 확인
    const quotaResult = tryIncrementQuota(userId, 'manual')
    if (!quotaResult.incremented) {
      return NextResponse.json({
        error: 'quota_exceeded',
        message: '이번 주 분석 2회 모두 사용하셨습니다',
        next_available: quotaResult.next_available
      }, { status: 429 })
    }

    // 숙소 정보 조회
    const { data: accommodation, error: accomError } = await db
      .from('accommodations')
      .select('id, name, city, region, accommodation_type')
      .eq('id', accommodationId)
      .eq('host_id', host.id)
      .single()

    if (accomError || !accommodation) {
      return NextResponse.json({ error: '숙소를 찾을 수 없습니다' }, { status: 404 })
    }

    // 선택된 키워드 조회 (Mock 데이터 - 실제로는 accommodation_keywords에서 조회)
    let selectedKeywords = ['kids-pool', 'bridal-party', 'pool-villa'] // Mock

    // 임시 키워드가 있는 경우 우선 사용
    if (tempKeywords.length > 0) {
      const keywordSystem = getKeywordTargetingSystem()
      selectedKeywords = await keywordSystem.normalizeAndMapKeywords(tempKeywords)
    }

    // 트렌드 분석 실행
    const dataLabClient = getNaverDataLabClient()
    const trends = await dataLabClient.getLocationTrends(
      accommodation.city,
      accommodation.region,
      accommodation.accommodation_type || '펜션',
      selectedKeywords
    )

    // 키워드 기반 인사이트 생성
    const keywordInsights = generateKeywordInsights(trends, selectedKeywords)

    // 경쟁 우위 분석
    const competitiveAdvantages = analyzeKeywordCompetitiveness(trends, selectedKeywords)

    // 액션 계획 생성
    const actionPlan = generateKeywordActionPlan(trends, selectedKeywords, accommodation)

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
        totalKeywords: trends.length,
        highGrowthKeywords: trends.filter(t => t.trend === 'up').length,
        averageGrowthRate: trends.reduce((sum, t) => sum + t.growthRate, 0) / trends.length,
        topPerformingKeyword: trends.sort((a, b) => b.searchVolume - a.searchVolume)[0]?.keyword,
        marketOpportunities: identifyMarketOpportunities(trends, selectedKeywords)
      },

      // 상세 트렌드 데이터
      trends: trends.map((trend, index) => ({
        ...trend,
        id: `trend_${index}`,
        isTargetKeyword: selectedKeywords.includes(trend.keyword),
        opportunityScore: calculateOpportunityScore(trend),
        actionPriority: getActionPriority(trend, selectedKeywords),
        marketingPotential: assessMarketingPotential(trend)
      })),

      // 키워드 인사이트
      keywordInsights,

      // 경쟁 우위 분석
      competitiveAnalysis: {
        advantages: competitiveAdvantages,
        marketGaps: identifyMarketGaps(trends, selectedKeywords),
        positioningOpportunities: getPositioningOpportunities(trends),
        recommendedFocus: getRecommendedFocus(trends, selectedKeywords)
      },

      // 실행 계획
      actionPlan,

      // 성과 예측
      performancePredictions: {
        expectedTrafficIncrease: predictTrafficIncrease(trends, selectedKeywords),
        revenueImpact: predictRevenueImpact(trends),
        marketShareGrowth: predictMarketShare(trends, selectedKeywords),
        timeToResults: estimateTimeToResults(selectedKeywords)
      },

      // 마케팅 제안
      marketingSuggestions: generateMarketingSuggestions(trends, selectedKeywords, accommodation),

      dataSource: 'naver_datalab_with_keywords',
      quota_status: {
        used: quotaResult.total_runs,
        remaining: 2 - quotaResult.total_runs,
        reset_date: quotaResult.next_available
      },
      updateTime: new Date().toISOString()
    })

  } catch (error) {
    console.error('지역 수요 분석 API 오류:', error)

    return NextResponse.json({
      error: '지역 수요 분석 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
})

// 키워드 기반 인사이트 생성
function generateKeywordInsights(trends: any[], selectedKeywords: string[]) {
  const targetTrends = trends.filter(t => selectedKeywords.some(kw => t.keyword.includes(kw)))

  return {
    keywordPerformance: targetTrends.map(trend => ({
      keyword: trend.keyword,
      performance: trend.trend === 'up' ? 'Excellent' : trend.trend === 'stable' ? 'Good' : 'Needs Attention',
      growthRate: `${trend.growthRate > 0 ? '+' : ''}${trend.growthRate}%`,
      searchVolume: trend.searchVolume,
      competitionLevel: trend.competitionLevel,
      marketingOpportunity: trend.trend === 'up' && trend.competitionLevel === 'low' ? 'High' : 'Medium'
    })),

    overallInsights: {
      strongestKeyword: targetTrends.sort((a, b) => b.searchVolume - a.searchVolume)[0]?.keyword || '데이터 없음',
      emergingOpportunity: targetTrends.find(t => t.trend === 'up' && t.competitionLevel === 'low')?.keyword,
      focusRecommendation: targetTrends.length > 3 ? 'Top 3 키워드 집중 권장' : '모든 키워드 균형 발전'
    }
  }
}

// 키워드 경쟁력 분석
function analyzeKeywordCompetitiveness(trends: any[], selectedKeywords: string[]) {
  return selectedKeywords.map(keyword => {
    const relatedTrends = trends.filter(t => t.keyword.includes(keyword))
    const avgGrowth = relatedTrends.reduce((sum, t) => sum + t.growthRate, 0) / relatedTrends.length || 0

    return {
      keyword,
      competitiveStrength: avgGrowth > 20 ? 'Strong' : avgGrowth > 0 ? 'Moderate' : 'Weak',
      marketDemand: relatedTrends[0]?.searchVolume > 1000 ? 'High' : 'Medium',
      growthPotential: avgGrowth > 10 ? 'High' : avgGrowth > 0 ? 'Medium' : 'Low',
      recommendedAction: getKeywordRecommendation(avgGrowth, relatedTrends[0]?.competitionLevel)
    }
  })
}

// 키워드 액션 플랜 생성
function generateKeywordActionPlan(trends: any[], selectedKeywords: string[], accommodation: any) {
  const highPriorityKeywords = selectedKeywords.filter(kw => {
    const relatedTrend = trends.find(t => t.keyword.includes(kw))
    return relatedTrend && relatedTrend.trend === 'up'
  })

  return {
    immediate: highPriorityKeywords.slice(0, 2).map(keyword => ({
      action: `'${keyword}' 키워드 집중 마케팅 캠페인 시작`,
      timeline: '이번 주',
      expectedResult: '타겟 고객 유입 +30%',
      budget: '월 50-100만원',
      channels: ['네이버 블로그', '인스타그램', '구글 광고']
    })),

    shortTerm: selectedKeywords.slice(0, 3).map(keyword => ({
      action: `${keyword} 특화 콘텐츠 및 패키지 개발`,
      timeline: '1개월',
      expectedResult: '예약 전환율 +25%',
      requirements: ['콘텐츠 제작', '패키지 기획', '가격 전략']
    })),

    longTerm: [
      {
        action: '선택 키워드 기반 브랜드 포지셔닝 확립',
        timeline: '3-6개월',
        expectedResult: '브랜드 인지도 +50%',
        kpi: ['검색 순위', '브랜드 언급량', '직접 예약률']
      },
      {
        action: '키워드별 고객 여정 최적화',
        timeline: '6개월',
        expectedResult: '고객 생애가치 +40%',
        focus: '재방문율 및 추천율 향상'
      }
    ]
  }
}

// 유틸리티 함수들
function identifyMarketOpportunities(trends: any[], selectedKeywords: string[]): string[] {
  const opportunities = []

  const highGrowthLowCompetition = trends.filter(t =>
    t.trend === 'up' &&
    t.competitionLevel === 'low' &&
    selectedKeywords.some(kw => t.keyword.includes(kw))
  )

  if (highGrowthLowCompetition.length > 0) {
    opportunities.push('높은 성장, 낮은 경쟁 키워드 발견')
  }

  const emergingTrends = trends.filter(t =>
    t.growthRate > 50 &&
    selectedKeywords.some(kw => t.keyword.includes(kw))
  )

  if (emergingTrends.length > 0) {
    opportunities.push('급성장 트렌드 키워드 포착')
  }

  return opportunities.length > 0 ? opportunities : ['안정적인 키워드 성과 유지']
}

function calculateOpportunityScore(trend: any): number {
  let score = 50 // 기본 점수

  // 성장 추세 반영
  if (trend.trend === 'up') score += 30
  else if (trend.trend === 'down') score -= 20

  // 경쟁 수준 반영
  if (trend.competitionLevel === 'low') score += 20
  else if (trend.competitionLevel === 'high') score -= 15

  // 성장률 반영
  score += Math.min(trend.growthRate, 30)

  return Math.max(0, Math.min(100, score))
}

function getActionPriority(trend: any, selectedKeywords: string[]): 'High' | 'Medium' | 'Low' {
  const isTargetKeyword = selectedKeywords.some(kw => trend.keyword.includes(kw))

  if (isTargetKeyword && trend.trend === 'up') return 'High'
  if (isTargetKeyword || trend.trend === 'up') return 'Medium'
  return 'Low'
}

function assessMarketingPotential(trend: any): string {
  if (trend.trend === 'up' && trend.competitionLevel === 'low') {
    return 'Excellent - 즉시 투자 권장'
  }
  if (trend.trend === 'up') {
    return 'Good - 적극 마케팅 추천'
  }
  if (trend.trend === 'stable') {
    return 'Moderate - 꾸준한 관리'
  }
  return 'Low - 전략 재검토 필요'
}

function identifyMarketGaps(trends: any[], selectedKeywords: string[]): string[] {
  return [
    '키워드 기반 맞춤형 패키지 부족',
    '타겟 키워드 SEO 최적화 미흡',
    '키워드별 고객 세분화 필요'
  ]
}

function getPositioningOpportunities(trends: any[]): string[] {
  const opportunities = []
  const highGrowthKeywords = trends.filter(t => t.trend === 'up')

  if (highGrowthKeywords.length > 0) {
    opportunities.push('성장 트렌드 선도자 포지셔닝')
  }

  opportunities.push('키워드 전문가 브랜딩')
  opportunities.push('니치 마켓 리더 포지션')

  return opportunities
}

function getRecommendedFocus(trends: any[], selectedKeywords: string[]): string {
  const upTrends = trends.filter(t => t.trend === 'up' && selectedKeywords.some(kw => t.keyword.includes(kw)))

  if (upTrends.length > 0) {
    return `'${upTrends[0].keyword}' 키워드 집중 공략 권장`
  }

  return '선택된 키워드 균형적 발전'
}

function predictTrafficIncrease(trends: any[], selectedKeywords: string[]): string {
  const avgGrowth = trends
    .filter(t => selectedKeywords.some(kw => t.keyword.includes(kw)))
    .reduce((sum, t) => sum + t.growthRate, 0) / selectedKeywords.length

  if (avgGrowth > 20) return '+40-60%'
  if (avgGrowth > 0) return '+20-35%'
  return '+10-20%'
}

function predictRevenueImpact(trends: any[]): string {
  const highPerformingTrends = trends.filter(t => t.trend === 'up').length
  const totalTrends = trends.length

  const ratio = highPerformingTrends / totalTrends

  if (ratio > 0.6) return '월 매출 +30-50% 증가 예상'
  if (ratio > 0.3) return '월 매출 +15-30% 증가 예상'
  return '월 매출 +5-15% 증가 예상'
}

function predictMarketShare(trends: any[], selectedKeywords: string[]): string {
  if (selectedKeywords.length > 3) {
    return '다각화 전략으로 시장 점유율 +5-8% 증가'
  }
  return '집중 전략으로 니치 마켓 점유율 +10-15% 증가'
}

function estimateTimeToResults(selectedKeywords: string[]): string {
  if (selectedKeywords.length <= 2) return '2-4주'
  if (selectedKeywords.length <= 4) return '1-2개월'
  return '2-3개월'
}

function generateMarketingSuggestions(trends: any[], selectedKeywords: string[], accommodation: any) {
  return selectedKeywords.slice(0, 3).map((keyword, index) => ({
    keyword,
    campaignName: `${accommodation.name} ${keyword} 특화 캠페인`,
    channels: ['네이버 검색광고', '인스타그램 타겟광고', '블로그 콘텐츠'],
    budget: `월 ${50 + index * 30}-${100 + index * 50}만원`,
    expectedROI: `200-${300 + index * 50}%`,
    timeline: `${1 + index}주차 시작`
  }))
}

function getKeywordRecommendation(growth: number, competition: string): string {
  if (growth > 20 && competition === 'low') return '즉시 집중 투자'
  if (growth > 10) return '적극적 마케팅 추진'
  if (growth > 0) return '꾸준한 관리 및 모니터링'
  return '전략 재검토 필요'
}