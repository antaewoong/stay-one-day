import { NextRequest, NextResponse } from 'next/server'
import { withHostAuth } from '@/middleware/withHostAuth'
import { getYouTubeApiClient } from '@/lib/youtube-api'
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

    // 키워드 기반 검색 쿼리 생성
    const keywordSystem = getKeywordTargetingSystem()
    const searchQueries = keywordSystem.generateAnalysisQueries({
      keywords: selectedKeywords,
      accommodationName: accommodation.name,
      city: accommodation.city,
      region: accommodation.region,
      accommodationType: accommodation.accommodation_type || '펜션'
    })

    // YouTube API 클라이언트로 쇼츠 분석 실행
    const youtubeClient = getYouTubeApiClient()
    const shortsAnalysis = await youtubeClient.analyzeShortsOpportunities(
      accommodation.city,
      accommodation.region,
      accommodation.accommodation_type || '펜션',
      selectedKeywords
    )

    // 키워드별 쇼츠 성과 분석
    const keywordPerformance = analyzeKeywordShortsPerformance(shortsAnalysis.trends, selectedKeywords)

    // 바이럴 잠재력 분석
    const viralPotential = assessViralPotential(shortsAnalysis.trends, selectedKeywords)

    // 콘텐츠 제작 가이드 생성
    const contentGuide = generateShortsContentGuide(selectedKeywords, accommodation)

    return NextResponse.json({
      success: true,
      accommodationName: accommodation.name,
      location: `${accommodation.city}, ${accommodation.region}`,

      // 키워드 컨텍스트
      keywordContext: {
        selectedKeywords,
        isTemporaryAnalysis: tempKeywords.length > 0,
        searchQueries: searchQueries.slice(0, 5), // 상위 5개 쿼리만 표시
        keywordBasedAnalysis: selectedKeywords.length > 0
      },

      // 쇼츠 트렌드 요약
      shortsOverview: {
        totalTrends: shortsAnalysis.trends.length,
        highViralPotential: shortsAnalysis.trends.filter(t => t.averageViews > 100000).length,
        keywordMatchingContent: shortsAnalysis.trends.filter(t =>
          selectedKeywords.some(kw => t.title.toLowerCase().includes(kw.toLowerCase()) ||
                                     t.tags.some(tag => tag.toLowerCase().includes(kw.toLowerCase())))
        ).length,
        averageEngagement: calculateAverageEngagement(shortsAnalysis.trends),
        topPerformingCategory: getTopPerformingCategory(shortsAnalysis.trends)
      },

      // 상세 트렌드 분석
      trends: shortsAnalysis.trends.map((trend, index) => ({
        ...trend,
        id: `shorts_trend_${index}`,
        keywordRelevance: calculateKeywordRelevance(trend, selectedKeywords),
        viralPotential: assessTrendViralPotential(trend),
        contentOpportunity: identifyContentOpportunity(trend, selectedKeywords),
        competitorAnalysis: analyzeCompetitorContent(trend),
        implementationDifficulty: assessImplementationDifficulty(trend)
      })),

      // 키워드별 성과 분석
      keywordPerformance,

      // 바이럴 잠재력
      viralOpportunities: viralPotential,

      // 콘텐츠 제작 가이드
      contentStrategy: {
        ...contentGuide,
        quickWins: identifyQuickWinContent(shortsAnalysis.trends, selectedKeywords),
        trendingtopics: extractTrendingTopics(shortsAnalysis.trends),
        hashtagStrategy: generateHashtagStrategy(selectedKeywords, accommodation.city)
      },

      // 경쟁 분석
      competitiveInsights: {
        gapAnalysis: identifyContentGaps(shortsAnalysis.trends, selectedKeywords),
        competitorBenchmarks: benchmarkCompetitors(shortsAnalysis.trends),
        uniqueOpportunities: findUniqueOpportunities(shortsAnalysis.trends, selectedKeywords),
        marketPositioning: suggestMarketPositioning(selectedKeywords)
      },

      // 성과 예측
      performancePredictions: {
        expectedViews: predictViewsFromKeywords(selectedKeywords, shortsAnalysis.trends),
        engagementRate: predictEngagementRate(selectedKeywords),
        followerGrowth: predictFollowerGrowth(selectedKeywords.length),
        conversionPotential: assessConversionPotential(selectedKeywords)
      },

      // 실행 로드맵
      executionRoadmap: {
        week1: generateWeeklyPlan(1, selectedKeywords, shortsAnalysis.trends),
        week2: generateWeeklyPlan(2, selectedKeywords, shortsAnalysis.trends),
        week3: generateWeeklyPlan(3, selectedKeywords, shortsAnalysis.trends),
        week4: generateWeeklyPlan(4, selectedKeywords, shortsAnalysis.trends),
        monthlyGoals: generateMonthlyGoals(selectedKeywords)
      },

      dataSource: 'youtube_api_with_keywords',
      quota_status: {
        used: quotaResult.total_runs,
        remaining: 2 - quotaResult.total_runs,
        reset_date: quotaResult.next_available
      },
      updateTime: new Date().toISOString()
    })

  } catch (error) {
    console.error('쇼츠 트렌드 분석 API 오류:', error)

    return NextResponse.json({
      error: '쇼츠 트렌드 분석 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
})

// 키워드별 쇼츠 성과 분석
function analyzeKeywordShortsPerformance(trends: any[], selectedKeywords: string[]) {
  return selectedKeywords.map(keyword => {
    const keywordTrends = trends.filter(trend =>
      trend.title.toLowerCase().includes(keyword.toLowerCase()) ||
      trend.description.toLowerCase().includes(keyword.toLowerCase()) ||
      trend.tags.some((tag: string) => tag.toLowerCase().includes(keyword.toLowerCase()))
    )

    const avgViews = keywordTrends.reduce((sum, t) => sum + t.averageViews, 0) / keywordTrends.length || 0
    const avgLikes = keywordTrends.reduce((sum, t) => sum + t.averageLikes, 0) / keywordTrends.length || 0

    return {
      keyword,
      matchingContent: keywordTrends.length,
      averageViews: Math.round(avgViews),
      averageLikes: Math.round(avgLikes),
      engagementRate: keywordTrends.length > 0 ? ((avgLikes / avgViews) * 100).toFixed(2) + '%' : '0%',
      viralPotential: avgViews > 100000 ? 'High' : avgViews > 50000 ? 'Medium' : 'Low',
      contentGap: keywordTrends.length < 5 ? 'Opportunity' : 'Competitive',
      recommendedAction: getKeywordAction(keywordTrends.length, avgViews)
    }
  })
}

// 바이럴 잠재력 평가
function assessViralPotential(trends: any[], selectedKeywords: string[]) {
  const keywordTrends = trends.filter(trend =>
    selectedKeywords.some(kw =>
      trend.title.toLowerCase().includes(kw.toLowerCase()) ||
      trend.tags.some((tag: string) => tag.toLowerCase().includes(kw.toLowerCase()))
    )
  )

  const highViralTrends = keywordTrends.filter(t => t.averageViews > 100000)
  const emergingTrends = keywordTrends.filter(t => t.averageViews > 50000 && t.averageViews < 100000)

  return {
    highPotential: highViralTrends.map(t => ({
      title: t.title,
      views: t.averageViews,
      engagement: ((t.averageLikes / t.averageViews) * 100).toFixed(1) + '%',
      keywords: selectedKeywords.filter(kw => t.title.toLowerCase().includes(kw.toLowerCase()))
    })),

    emerging: emergingTrends.map(t => ({
      title: t.title,
      views: t.averageViews,
      growthPotential: 'High',
      recommendedTiming: 'Create similar content within 1-2 weeks'
    })),

    viralFactors: identifyViralFactors(keywordTrends),
    contentFormats: extractSuccessfulFormats(keywordTrends),
    optimalTiming: suggestOptimalTiming(keywordTrends)
  }
}

// 쇼츠 콘텐츠 제작 가이드 생성
function generateShortsContentGuide(selectedKeywords: string[], accommodation: any) {
  return {
    contentIdeas: selectedKeywords.map(keyword => ({
      keyword,
      ideas: [
        `${keyword} 체험 하이라이트`,
        `${keyword} 비하인드 스토리`,
        `${keyword} 고객 반응`,
        `${keyword} 준비과정`,
        `${keyword} 특별한 순간들`
      ],
      hooks: [
        `${accommodation.city}에서 ${keyword}을 경험한다면?`,
        `${keyword} 전문가가 알려주는 꿀팁`,
        `${keyword} 실제 후기 모음`
      ]
    })),

    productionTips: [
      '첫 3초 안에 핵심 메시지 전달',
      '세로형 9:16 비율 최적화',
      '자막 활용으로 접근성 향상',
      '트렌딩 음악 및 효과음 활용',
      '콜투액션 명확히 설정'
    ],

    editingGuidelines: {
      duration: '15-30초 권장',
      transitions: '빠른 컷과 전환',
      textOverlay: '큰 글씨, 명확한 폰트',
      colorGrading: '밝고 생생한 색감',
      audioBalance: '음성 70%, 배경음악 30%'
    }
  }
}

// 유틸리티 함수들
function calculateAverageEngagement(trends: any[]): string {
  const avgEngagement = trends.reduce((sum, t) => {
    const engagement = (t.averageLikes / t.averageViews) * 100
    return sum + engagement
  }, 0) / trends.length

  return `${avgEngagement.toFixed(2)}%`
}

function getTopPerformingCategory(trends: any[]): string {
  const categories = trends.reduce((acc: any, trend) => {
    const category = trend.category || 'Entertainment'
    acc[category] = (acc[category] || 0) + trend.averageViews
    return acc
  }, {})

  return Object.entries(categories)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'Entertainment'
}

function calculateKeywordRelevance(trend: any, selectedKeywords: string[]): number {
  let relevance = 0

  selectedKeywords.forEach(keyword => {
    if (trend.title.toLowerCase().includes(keyword.toLowerCase())) relevance += 40
    if (trend.description.toLowerCase().includes(keyword.toLowerCase())) relevance += 20
    if (trend.tags.some((tag: string) => tag.toLowerCase().includes(keyword.toLowerCase()))) relevance += 20
  })

  return Math.min(100, relevance)
}

function assessTrendViralPotential(trend: any): 'High' | 'Medium' | 'Low' {
  const engagementRate = (trend.averageLikes / trend.averageViews) * 100

  if (trend.averageViews > 100000 && engagementRate > 5) return 'High'
  if (trend.averageViews > 50000 || engagementRate > 3) return 'Medium'
  return 'Low'
}

function identifyContentOpportunity(trend: any, selectedKeywords: string[]): string {
  const relevance = calculateKeywordRelevance(trend, selectedKeywords)

  if (relevance > 60) return 'Direct adaptation recommended'
  if (relevance > 30) return 'Inspired content opportunity'
  return 'Trend monitoring'
}

function analyzeCompetitorContent(trend: any): string {
  if (trend.averageViews > 200000) return 'High competition - differentiation needed'
  if (trend.averageViews > 50000) return 'Moderate competition - niche angle recommended'
  return 'Low competition - opportunity for dominance'
}

function assessImplementationDifficulty(trend: any): 'Easy' | 'Medium' | 'Hard' {
  // 간단한 휴리스틱 기반 평가
  if (trend.tags.includes('DIY') || trend.tags.includes('Tutorial')) return 'Medium'
  if (trend.title.includes('Professional') || trend.title.includes('Expert')) return 'Hard'
  return 'Easy'
}

function identifyQuickWinContent(trends: any[], selectedKeywords: string[]) {
  return trends
    .filter(trend => calculateKeywordRelevance(trend, selectedKeywords) > 50)
    .filter(trend => assessImplementationDifficulty(trend) === 'Easy')
    .slice(0, 3)
    .map(trend => ({
      title: trend.title,
      concept: `${selectedKeywords[0]} 버전으로 재해석`,
      effort: 'Low',
      expectedViews: Math.round(trend.averageViews * 0.7),
      timeline: '1-2일'
    }))
}

function extractTrendingTopics(trends: any[]): string[] {
  const topics = new Map()

  trends.forEach(trend => {
    trend.tags.forEach((tag: string) => {
      topics.set(tag, (topics.get(tag) || 0) + trend.averageViews)
    })
  })

  return Array.from(topics.entries())
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([topic]) => topic as string)
}

function generateHashtagStrategy(selectedKeywords: string[], city: string) {
  return {
    primary: selectedKeywords.map(kw => `#${kw.replace(/[-\s]/g, '')}`),
    local: [`#${city}`, `#${city}여행`, `#${city}숙소`],
    trending: ['#쇼츠', '#힐링', '#여행', '#감성숙소', '#인증샷'],
    niche: selectedKeywords.map(kw => `#${kw}전문`),
    usage: '해시태그는 영상 설명란에 5-8개 사용 권장'
  }
}

function identifyContentGaps(trends: any[], selectedKeywords: string[]): string[] {
  const gaps = []

  selectedKeywords.forEach(keyword => {
    const keywordContent = trends.filter(t => t.title.toLowerCase().includes(keyword.toLowerCase())).length
    if (keywordContent < 3) {
      gaps.push(`${keyword} 콘텐츠 부족 - 기회 영역`)
    }
  })

  return gaps.length > 0 ? gaps : ['경쟁이 치열한 시장 - 차별화 필요']
}

function benchmarkCompetitors(trends: any[]) {
  const topPerformers = trends.sort((a, b) => b.averageViews - a.averageViews).slice(0, 3)

  return topPerformers.map(trend => ({
    title: trend.title,
    views: trend.averageViews,
    engagement: ((trend.averageLikes / trend.averageViews) * 100).toFixed(1) + '%',
    successFactors: identifySuccessFactors(trend),
    learnings: extractLearnings(trend)
  }))
}

function findUniqueOpportunities(trends: any[], selectedKeywords: string[]): string[] {
  return [
    '키워드 조합 콘텐츠 (예: 키즈풀 + 브라이덜)',
    '지역 특색과 키워드 결합',
    '사계절 키워드 변주 콘텐츠'
  ]
}

function suggestMarketPositioning(selectedKeywords: string[]): string {
  if (selectedKeywords.length > 3) {
    return '다양한 경험 제공자 포지셔닝'
  }
  return `${selectedKeywords[0]} 전문 숙소 포지셔닝`
}

function predictViewsFromKeywords(selectedKeywords: string[], trends: any[]): string {
  const keywordTrends = trends.filter(t =>
    selectedKeywords.some(kw => t.title.toLowerCase().includes(kw.toLowerCase()))
  )

  const avgViews = keywordTrends.reduce((sum, t) => sum + t.averageViews, 0) / keywordTrends.length || 50000

  return `${Math.round(avgViews * 0.3)}-${Math.round(avgViews * 0.8)}회`
}

function predictEngagementRate(selectedKeywords: string[]): string {
  // 키워드 수가 많을수록 타겟이 분산되어 참여율 감소
  const baseRate = 3.5
  const keywordPenalty = Math.max(0, (selectedKeywords.length - 2) * 0.2)
  const estimatedRate = Math.max(2.0, baseRate - keywordPenalty)

  return `${estimatedRate.toFixed(1)}%`
}

function predictFollowerGrowth(keywordCount: number): string {
  if (keywordCount > 3) return '월 200-400명 증가'
  if (keywordCount > 1) return '월 300-600명 증가'
  return '월 400-800명 증가'
}

function assessConversionPotential(selectedKeywords: string[]): string {
  const businessKeywords = ['bridal-party', 'workshop-venue', 'conference-room']
  const hasBusinessKeywords = selectedKeywords.some(kw => businessKeywords.includes(kw))

  if (hasBusinessKeywords) return 'High - 비즈니스 키워드 보유'
  return 'Medium - 일반 고객 타겟'
}

function generateWeeklyPlan(week: number, selectedKeywords: string[], trends: any[]) {
  const keyword = selectedKeywords[(week - 1) % selectedKeywords.length]

  return {
    focus: `${keyword} 집중 주간`,
    contents: [
      `${keyword} 소개 영상`,
      `${keyword} 체험 과정`,
      `${keyword} 고객 반응`
    ],
    goal: week === 1 ? '브랜드 인지도 구축' :
          week === 2 ? '참여도 증대' :
          week === 3 ? '전환율 향상' : '커뮤니티 구축',
    kpi: week <= 2 ? '조회수 중심' : '참여율 중심'
  }
}

function generateMonthlyGoals(selectedKeywords: string[]) {
  return {
    month1: '키워드별 기본 콘텐츠 라이브러리 구축',
    month2: '바이럴 콘텐츠 1-2개 달성',
    month3: '팔로워 1,000명 돌파 및 브랜드 인지도 확립',
    kpi: [
      '총 조회수 10만회 이상',
      '평균 참여율 3% 이상',
      '팔로워 증가율 월 20% 이상'
    ]
  }
}

// 추가 유틸리티 함수들
function getKeywordAction(contentCount: number, avgViews: number): string {
  if (contentCount < 3 && avgViews > 50000) return '콘텐츠 대량 생산 권장'
  if (contentCount < 3) return '콘텐츠 제작 기회'
  if (avgViews > 100000) return '성공 포맷 반복 및 변주'
  return '차별화 전략 필요'
}

function identifyViralFactors(trends: any[]): string[] {
  return [
    '감정적 임팩트 (놀라움, 감동)',
    '실용적 정보 제공',
    '시각적 임팩트',
    '스토리텔링',
    '트렌딩 음악 활용'
  ]
}

function extractSuccessfulFormats(trends: any[]): string[] {
  return [
    'Before & After 형식',
    '타임랩스 영상',
    '리액션 영상',
    '튜토리얼 형식',
    'Q&A 형식'
  ]
}

function suggestOptimalTiming(trends: any[]): string {
  return '저녁 7-9시, 주말 오후 2-4시 업로드 권장'
}

function identifySuccessFactors(trend: any): string[] {
  const factors = []
  if (trend.averageViews > 100000) factors.push('강력한 훅')
  if ((trend.averageLikes / trend.averageViews) > 0.05) factors.push('높은 참여 유도')
  factors.push('트렌드 타이밍')
  return factors
}

function extractLearnings(trend: any): string[] {
  return [
    '첫 3초의 중요성',
    '명확한 메시지 전달',
    '시각적 임팩트'
  ]
}