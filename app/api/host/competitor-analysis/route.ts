import { NextRequest, NextResponse } from 'next/server'
import { withHostAuth } from '@/middleware/withHostAuth'
import { getCompetitorAnalyzer } from '@/lib/competitor-analyzer'
import { tryIncrementQuota } from '@/utils/quota-manager'

export const GET = withHostAuth(async (req, db, { userId, host }) => {
  try {
    const { searchParams } = req.nextUrl
    const accommodationId = searchParams.get('accommodationId')

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
      .select('id, name, city, region, accommodation_type, latitude, longitude')
      .eq('id', accommodationId)
      .eq('host_id', host.id)
      .single()

    if (accomError || !accommodation) {
      return NextResponse.json({ error: '숙소를 찾을 수 없습니다' }, { status: 404 })
    }

    // 경쟁사 분석 실행
    const analyzer = getCompetitorAnalyzer()
    const analysisResult = await analyzer.analyzeCompetitors(
      accommodationId,
      accommodation.city,
      accommodation.region,
      accommodation.accommodation_type || '펜션',
      accommodation.latitude,
      accommodation.longitude
    )

    // 실행 우선순위 매트릭스 생성
    const competitiveInsights = generateCompetitiveInsights(analysisResult)

    // 시장 기회 분석
    const marketOpportunities = identifyMarketOpportunities(analysisResult)

    // 경쟁 우위 실행 계획
    const actionPlan = createActionPlan(analysisResult.competitiveAdvantages)

    return NextResponse.json({
      success: true,
      accommodationName: accommodation.name,
      location: `${accommodation.city}, ${accommodation.region}`,

      // 경쟁사 현황 요약
      competitorOverview: {
        totalCompetitors: analysisResult.competitors.length,
        directCompetitors: analysisResult.competitors.filter(c => c.type === 'direct').length,
        indirectCompetitors: analysisResult.competitors.filter(c => c.type === 'indirect').length,
        averageRating: (analysisResult.competitors.reduce((sum, c) => sum + c.rating, 0) / analysisResult.competitors.length).toFixed(1),
        averagePrice: Math.round(analysisResult.competitors.reduce((sum, c) => sum + c.averagePrice, 0) / analysisResult.competitors.length),
        topPerformer: analysisResult.competitors.sort((a, b) => b.occupancyRate - a.occupancyRate)[0]?.name
      },

      // 경쟁사 상세 정보
      competitors: analysisResult.competitors.map((competitor, index) => ({
        ...competitor,
        competitiveGap: calculateCompetitiveGap(competitor),
        opportunityScore: calculateOpportunityScore(competitor),
        threatLevel: assessThreatLevel(competitor, accommodation)
      })),

      // 가격 분석
      priceAnalysis: {
        ...analysisResult.priceAnalysis,
        pricePositioning: determinePricePositioning(analysisResult.priceAnalysis, accommodation),
        recommendedPricing: generatePricingRecommendations(analysisResult.priceAnalysis)
      },

      // 시장 분석
      marketAnalysis: {
        ...analysisResult.marketAnalysis,
        marketShare: estimateMarketShare(analysisResult.competitors, accommodation),
        growthOpportunities: identifyGrowthOpportunities(analysisResult.marketAnalysis)
      },

      // 경쟁 우위 분석
      competitiveAdvantages: analysisResult.competitiveAdvantages.map((advantage, index) => ({
        ...advantage,
        id: `advantage_${index}`,
        timelineEstimate: estimateImplementationTimeline(advantage),
        resourceRequirement: assessResourceRequirement(advantage),
        riskLevel: evaluateImplementationRisk(advantage)
      })),

      // 추천사항
      recommendations: {
        ...analysisResult.recommendations,
        prioritizedActions: prioritizeActions(analysisResult.recommendations.immediate_actions),
        competitiveStrategy: developCompetitiveStrategy(analysisResult),
        differentiation: suggestDifferentiation(analysisResult.competitors, accommodation)
      },

      // 포지셔닝 맵
      positioningMap: {
        ...analysisResult.positioningMap,
        strategicInsights: generateStrategicInsights(analysisResult.positioningMap),
        moveRecommendations: suggestPositioningMoves(analysisResult.positioningMap)
      },

      // 경쟁사 인사이트
      competitiveInsights,

      // 시장 기회
      marketOpportunities,

      // 실행 계획
      actionPlan,

      // 성과 예측
      performanceProjections: {
        marketShareGain: '5-8%',
        revenueIncrease: '20-35%',
        competitiveAdvantageStrength: 'Medium-High',
        timeToSeeResults: '2-3개월'
      },

      // 모니터링 지표
      monitoringKPIs: [
        '시장 점유율',
        '예약율 vs 경쟁사',
        '평균 가격 대비 성과',
        '고객 만족도 점수',
        '브랜드 인지도'
      ],

      dataSource: 'competitor_analysis_system',
      quota_status: {
        used: quotaResult.total_runs,
        remaining: 2 - quotaResult.total_runs,
        reset_date: quotaResult.next_available
      },
      updateTime: new Date().toISOString()
    })

  } catch (error) {
    console.error('경쟁사 분석 API 오류:', error)

    return NextResponse.json({
      error: '경쟁사 분석 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
})

// 경쟁사 인사이트 생성
function generateCompetitiveInsights(analysisResult: any) {
  const { competitors, priceAnalysis } = analysisResult

  return {
    marketLeader: competitors.reduce((leader: any, comp: any) =>
      comp.marketShare > leader.marketShare ? comp : leader
    ),
    pricingTrends: {
      averageWeekdayPrice: Math.round(priceAnalysis.reduce((sum: number, p: any) => sum + p.weekdayPrice, 0) / priceAnalysis.length),
      averageWeekendPrice: Math.round(priceAnalysis.reduce((sum: number, p: any) => sum + p.weekendPrice, 0) / priceAnalysis.length),
      priceSpread: `${Math.min(...priceAnalysis.map((p: any) => p.weekdayPrice)).toLocaleString()}원 - ${Math.max(...priceAnalysis.map((p: any) => p.weekdayPrice)).toLocaleString()}원`
    },
    strengthsAnalysis: extractCommonStrengths(competitors),
    weaknessesAnalysis: extractCommonWeaknesses(competitors),
    marketGaps: identifyMarketGaps(competitors)
  }
}

// 시장 기회 식별
function identifyMarketOpportunities(analysisResult: any) {
  const { competitors, marketAnalysis } = analysisResult

  return {
    underservedSegments: marketAnalysis.customerSegments
      .filter((segment: any) => !isSegmentWellServed(segment, competitors))
      .map((segment: any) => ({
        segment: segment.segment,
        opportunity: `${segment.preferences.join(', ')} 특화 서비스`,
        potentialRevenue: '월 200-400만원 추가 수익'
      })),

    pricingOpportunities: [
      {
        opportunity: '동적 가격 정책 도입',
        description: '경쟁사 대비 10-15% 가격 최적화',
        expectedGain: '+25% 수익성'
      },
      {
        opportunity: '패키지 상품 다양화',
        description: '경쟁사가 제공하지 않는 독특한 패키지',
        expectedGain: '+30% 예약율'
      }
    ],

    serviceGaps: competitors
      .map((comp: any) => comp.weaknesses)
      .flat()
      .filter((weakness: string, index: number, arr: string[]) =>
        arr.indexOf(weakness) === index // 중복 제거
      )
      .map((weakness: string) => ({
        gap: weakness,
        solution: generateSolutionForWeakness(weakness),
        competitiveAdvantage: 'High'
      }))
  }
}

// 실행 계획 생성
function createActionPlan(advantages: any[]) {
  return {
    quickWins: advantages
      .filter(adv => adv.implementationDifficulty === 'easy' && adv.potentialImpact === 'high')
      .map(adv => ({
        action: adv.title,
        timeline: '1-2주',
        resources: getRequiredResources(adv.category),
        expectedResult: adv.actionableInsight
      })),

    strategicInitiatives: advantages
      .filter(adv => adv.implementationDifficulty === 'hard' && adv.potentialImpact === 'high')
      .map(adv => ({
        initiative: adv.title,
        timeline: '1-3개월',
        investment: estimateInvestment(adv),
        roi: '200-400%'
      })),

    continuousImprovements: advantages
      .filter(adv => adv.potentialImpact === 'medium')
      .map(adv => ({
        improvement: adv.title,
        timeline: '지속적',
        effort: 'Medium',
        benefit: adv.description
      }))
  }
}

// 유틸리티 함수들
function calculateCompetitiveGap(competitor: any): string {
  const gapScore = competitor.occupancyRate - 70 // 기준점 70%
  return gapScore > 10 ? 'High Performance' :
         gapScore > -10 ? 'Similar Performance' : 'Underperforming'
}

function calculateOpportunityScore(competitor: any): number {
  let score = 50
  if (competitor.rating < 4.2) score += 20
  if (competitor.occupancyRate < 75) score += 15
  if (competitor.weaknesses.length > 2) score += 15
  return Math.min(100, score)
}

function assessThreatLevel(competitor: any, accommodation: any): 'High' | 'Medium' | 'Low' {
  const distance = competitor.distance
  const ratingDiff = competitor.rating - 4.0 // 가정된 내 숙소 평점

  if (distance < 3 && competitor.rating > 4.5 && competitor.occupancyRate > 85) return 'High'
  if (distance < 5 && competitor.rating > 4.2 && competitor.occupancyRate > 75) return 'Medium'
  return 'Low'
}

function determinePricePositioning(priceAnalysis: any[], accommodation: any): string {
  const avgPrice = priceAnalysis.reduce((sum, p) => sum + p.weekdayPrice, 0) / priceAnalysis.length
  const assumedMyPrice = avgPrice * 0.9 // 가정: 우리가 평균보다 10% 저렴

  if (assumedMyPrice > avgPrice * 1.2) return '프리미엄 포지셔닝'
  if (assumedMyPrice < avgPrice * 0.8) return '가성비 포지셔닝'
  return '중간가 포지셔닝'
}

function generatePricingRecommendations(priceAnalysis: any[]): any[] {
  return [
    {
      strategy: '주중/주말 차등 요금제',
      description: '주말 30% 프리미엄 적용',
      expectedIncrease: '+20% 수익'
    },
    {
      strategy: '성수기 동적 가격',
      description: '수요 예측 기반 가격 조정',
      expectedIncrease: '+15% 수익'
    }
  ]
}

function estimateMarketShare(competitors: any[], accommodation: any): string {
  const totalMarketShare = competitors.reduce((sum, c) => sum + c.marketShare, 0)
  const remainingShare = 100 - totalMarketShare
  return `추정 ${Math.max(5, remainingShare / 3).toFixed(1)}%`
}

function identifyGrowthOpportunities(marketAnalysis: any): string[] {
  return [
    `${marketAnalysis.growth}에 따른 시장 확대`,
    '신규 고객 세그먼트 진입',
    '서비스 차별화를 통한 점유율 증가'
  ]
}

function estimateImplementationTimeline(advantage: any): string {
  switch (advantage.implementationDifficulty) {
    case 'easy': return '1-2주'
    case 'medium': return '1-2개월'
    case 'hard': return '3-6개월'
    default: return '1개월'
  }
}

function assessResourceRequirement(advantage: any): string {
  switch (advantage.category) {
    case 'price': return '마케팅팀, 수익관리시스템'
    case 'location': return '마케팅팀, 지역 파트너십'
    case 'amenities': return '시설팀, 투자 예산'
    case 'service': return 'IT팀, 직원 교육'
    case 'marketing': return '마케팅팀, 광고 예산'
    default: return '일반 운영팀'
  }
}

function evaluateImplementationRisk(advantage: any): 'Low' | 'Medium' | 'High' {
  return advantage.implementationDifficulty === 'hard' ? 'High' :
         advantage.implementationDifficulty === 'medium' ? 'Medium' : 'Low'
}

function prioritizeActions(actions: any[]): any[] {
  return actions
    .sort((a, b) => {
      const priorityScore = { High: 3, Medium: 2, Low: 1 }
      return priorityScore[b.priority] - priorityScore[a.priority]
    })
    .slice(0, 3)
}

function developCompetitiveStrategy(analysisResult: any): string {
  const { competitors } = analysisResult
  const strongCompetitors = competitors.filter((c: any) => c.rating > 4.3).length

  if (strongCompetitors > 3) {
    return '차별화 전략: 독특한 가치 제안으로 니치 시장 공략'
  } else {
    return '직접 경쟁 전략: 가격과 서비스 경쟁력 강화'
  }
}

function suggestDifferentiation(competitors: any[], accommodation: any): string[] {
  const commonAmenities = competitors
    .map((c: any) => c.amenities)
    .flat()
    .filter((amenity: string, index: number, arr: string[]) =>
      arr.filter(a => a === amenity).length > competitors.length / 2
    )

  const uncommonAmenities = ['온천', '글램핑', '반려동물 놀이터', '워케이션 존', '프라이빗 풀']
    .filter(amenity => !commonAmenities.includes(amenity))

  return uncommonAmenities.slice(0, 3)
}

function generateStrategicInsights(positioningMap: any): string[] {
  return [
    `현재 ${positioningMap.recommendations.currentGaps.length}개 포지셔닝 갭 존재`,
    '이상적 포지션은 합리적 가격 + 높은 서비스',
    '경쟁사 대비 차별화된 위치 확보 필요'
  ]
}

function suggestPositioningMoves(positioningMap: any): any[] {
  return [
    {
      direction: positioningMap.recommendations.moveDirection,
      reason: '가치 제공형 포지셔닝으로 수익성 개선',
      timeline: '3-6개월',
      expectedResult: '프리미엄 가격 정당화'
    }
  ]
}

function extractCommonStrengths(competitors: any[]): string[] {
  return competitors
    .map(c => c.strengths)
    .flat()
    .filter((strength, index, arr) =>
      arr.filter(s => s === strength).length > 1
    )
    .filter((strength, index, arr) => arr.indexOf(strength) === index)
}

function extractCommonWeaknesses(competitors: any[]): string[] {
  return competitors
    .map(c => c.weaknesses)
    .flat()
    .filter((weakness, index, arr) =>
      arr.filter(w => w === weakness).length > 1
    )
    .filter((weakness, index, arr) => arr.indexOf(weakness) === index)
}

function identifyMarketGaps(competitors: any[]): string[] {
  return [
    '개인화된 서비스 부족',
    'AI 기반 추천 시스템 미흡',
    '지속가능한 숙박 옵션 제한'
  ]
}

function isSegmentWellServed(segment: any, competitors: any[]): boolean {
  return competitors.some(c =>
    c.strengths.some((strength: string) =>
      segment.preferences.some((pref: string) =>
        strength.toLowerCase().includes(pref.toLowerCase())
      )
    )
  )
}

function generateSolutionForWeakness(weakness: string): string {
  const solutions: { [key: string]: string } = {
    '시설 노후화': '시설 현대화 투자',
    '마케팅 부족': '디지털 마케팅 강화',
    '예약 시스템 불편': 'UX 개선 및 모바일 최적화',
    '서비스 일관성': '직원 교육 및 매뉴얼 표준화',
    '소음 관리': '방음 시설 개선 및 조용한 시간 정책',
    '높은 가격': '가성비 패키지 개발'
  }

  return solutions[weakness] || '맞춤형 솔루션 개발'
}

function getRequiredResources(category: string): string[] {
  const resources: { [key: string]: string[] } = {
    'price': ['수익관리 도구', '시장 분석가'],
    'location': ['마케팅 매니저', '지역 파트너십'],
    'amenities': ['시설 관리팀', '인테리어 디자이너'],
    'service': ['고객서비스팀', '교육 프로그램'],
    'marketing': ['디지털 마케터', '콘텐츠 크리에이터']
  }

  return resources[category] || ['일반 운영팀']
}

function estimateInvestment(advantage: any): string {
  switch (advantage.category) {
    case 'amenities': return '500만-1,500만원'
    case 'service': return '200만-800만원'
    case 'marketing': return '300만-1,000만원'
    default: return '100만-500만원'
  }
}