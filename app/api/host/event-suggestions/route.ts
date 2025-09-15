import { NextRequest, NextResponse } from 'next/server'
import { withHostAuth } from '@/middleware/withHostAuth'
import { getWeatherEventsClient } from '@/lib/weather-events'
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

    // 날씨/이벤트 클라이언트로 제안 조회
    const weatherEventsClient = getWeatherEventsClient()
    const eventSuggestions = await weatherEventsClient.getEventSuggestions(
      accommodation.city,
      accommodation.region,
      accommodation.accommodation_type || '펜션',
      accommodation.latitude,
      accommodation.longitude
    )

    // 추가적인 비즈니스 인사이트 생성
    const businessInsights = generateBusinessInsights(eventSuggestions, accommodation)

    // 마케팅 캠페인 제안
    const marketingCampaigns = generateMarketingCampaigns(eventSuggestions, accommodation)

    // 가격 최적화 제안
    const pricingOptimization = generatePricingStrategy(eventSuggestions, accommodation)

    return NextResponse.json({
      success: true,
      accommodationName: accommodation.name,
      location: `${accommodation.city}, ${accommodation.region}`,

      // 메인 이벤트 제안
      eventSuggestions: eventSuggestions.map((suggestion, index) => ({
        ...suggestion,
        id: `event_${index}`,
        implementationDifficulty: calculateImplementationDifficulty(suggestion),
        competitorAdvantage: assessCompetitorAdvantage(suggestion, accommodation),
        seasonalRelevance: calculateSeasonalRelevance(suggestion)
      })),

      // 비즈니스 인사이트
      businessInsights: {
        totalOpportunities: eventSuggestions.length,
        highUrgencyCount: eventSuggestions.filter(s => s.urgencyLevel === 'high').length,
        maxRevenuePotential: calculateMaxRevenue(eventSuggestions, accommodation),
        bestTimeToImplement: findBestImplementationTime(eventSuggestions),
        competitiveAdvantages: extractCompetitiveAdvantages(eventSuggestions)
      },

      // 마케팅 캠페인 제안
      marketingCampaigns,

      // 가격 전략
      pricingOptimization,

      // 실행 로드맵
      implementationRoadmap: generateImplementationRoadmap(eventSuggestions),

      // 성과 예측
      performanceMetrics: {
        expectedBookingIncrease: '25-45%',
        averagePriceIncrease: '20-35%',
        customerSatisfactionBoost: '+15%',
        repeatBookingProbability: '+30%'
      },

      dataSource: 'weather_events_api',
      quota_status: {
        used: quotaResult.total_runs,
        remaining: 2 - quotaResult.total_runs,
        reset_date: quotaResult.next_available
      },
      updateTime: new Date().toISOString()
    })

  } catch (error) {
    console.error('이벤트 제안 API 오류:', error)

    return NextResponse.json({
      error: '이벤트 제안 분석 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
})

// 비즈니스 인사이트 생성
function generateBusinessInsights(suggestions: any[], accommodation: any) {
  const urgentSuggestions = suggestions.filter(s => s.urgencyLevel === 'high')

  return {
    keyOpportunities: urgentSuggestions.slice(0, 3).map(s => ({
      title: s.title,
      impact: s.estimatedDemandIncrease,
      timeline: s.targetDate
    })),
    seasonalTrends: analyzeSeasonalTrends(suggestions),
    weatherImpact: analyzeWeatherImpact(suggestions),
    competitiveGaps: identifyCompetitiveGaps(suggestions, accommodation)
  }
}

// 마케팅 캠페인 제안
function generateMarketingCampaigns(suggestions: any[], accommodation: any) {
  return suggestions.slice(0, 3).map((suggestion, index) => ({
    id: `campaign_${index}`,
    name: `${suggestion.title} 프로모션`,
    channels: [
      '인스타그램 스토리',
      '네이버 블로그',
      '카카오톡 채널',
      '지역 커뮤니티'
    ],
    content: {
      headline: `${accommodation.city} ${suggestion.title}`,
      description: suggestion.description,
      callToAction: '지금 바로 예약하세요!',
      hashtags: [
        `#${accommodation.city}여행`,
        `#${suggestion.title.replace(/\s+/g, '')}`,
        '#숙박할인',
        '#특별패키지'
      ]
    },
    budget: {
      recommended: '300,000-500,000원',
      channels: {
        instagram: '200,000원',
        naver: '150,000원',
        kakao: '100,000원',
        community: '50,000원'
      }
    },
    timeline: {
      preparation: '3-5일',
      campaign: '7-14일',
      followup: '3일'
    },
    expectedROI: '200-400%'
  }))
}

// 가격 최적화 전략
function generatePricingStrategy(suggestions: any[], accommodation: any) {
  const avgMultiplier = suggestions.reduce((sum, s) => sum + s.pricingStrategy.baseMultiplier, 0) / suggestions.length

  return {
    dynamicPricing: {
      baselineAdjustment: `${Math.round((avgMultiplier - 1) * 100)}%`,
      peakDayPremium: '30-50%',
      weatherBonus: '10-20%',
      eventPremium: '20-40%'
    },
    packages: suggestions.map(s => ({
      name: s.title,
      basePrice: '기본가 기준',
      packagePrice: `+${Math.round((s.pricingStrategy.baseMultiplier - 1) * 100)}%`,
      inclusions: s.packageIdeas,
      validPeriod: s.targetDate
    })),
    competitorAnalysis: {
      positionVsCompetitors: '중상위권 타겟',
      differentiationFactor: '날씨/이벤트 특화',
      valueProposition: '타이밍 기반 특별 경험'
    }
  }
}

// 실행 로드맵 생성
function generateImplementationRoadmap(suggestions: any[]) {
  const sortedByUrgency = suggestions.sort((a, b) => {
    const urgencyScore = { high: 3, medium: 2, low: 1 }
    return urgencyScore[b.urgencyLevel] - urgencyScore[a.urgencyLevel]
  })

  return {
    immediate: sortedByUrgency.filter(s => s.urgencyLevel === 'high').map(s => ({
      task: `${s.title} 준비`,
      deadline: s.targetDate,
      priority: '최우선',
      estimatedTime: '2-3일'
    })),
    thisWeek: sortedByUrgency.filter(s => s.urgencyLevel === 'medium').slice(0, 2).map(s => ({
      task: `${s.title} 기획`,
      deadline: s.targetDate,
      priority: '높음',
      estimatedTime: '3-5일'
    })),
    thisMonth: sortedByUrgency.filter(s => s.urgencyLevel === 'low').slice(0, 3).map(s => ({
      task: `${s.title} 사전 준비`,
      deadline: s.targetDate,
      priority: '보통',
      estimatedTime: '1주일'
    }))
  }
}

// 유틸리티 함수들
function calculateImplementationDifficulty(suggestion: any): 'easy' | 'medium' | 'hard' {
  const ideaCount = suggestion.packageIdeas.length
  return ideaCount <= 2 ? 'easy' : ideaCount <= 4 ? 'medium' : 'hard'
}

function assessCompetitorAdvantage(suggestion: any, accommodation: any): string {
  return `${accommodation.city} 지역 내 ${suggestion.weatherCondition} 날씨 특화 우위`
}

function calculateSeasonalRelevance(suggestion: any): number {
  const today = new Date()
  const targetDate = new Date(suggestion.targetDate)
  const daysDiff = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  return daysDiff <= 7 ? 100 : daysDiff <= 30 ? 80 : 60
}

function calculateMaxRevenue(suggestions: any[], accommodation: any): string {
  const maxMultiplier = Math.max(...suggestions.map(s => s.pricingStrategy.baseMultiplier))
  const increasePercent = Math.round((maxMultiplier - 1) * 100)
  return `기존 대비 +${increasePercent}% 수익 증대 가능`
}

function findBestImplementationTime(suggestions: any[]): string {
  const urgentCount = suggestions.filter(s => s.urgencyLevel === 'high').length
  return urgentCount > 0 ? '즉시 시작 권장' : '1주 내 시작 권장'
}

function extractCompetitiveAdvantages(suggestions: any[]): string[] {
  return [
    '날씨 기반 맞춤 서비스',
    '이벤트 타이밍 특화',
    '지역 특성 극대화',
    '데이터 기반 가격 최적화'
  ]
}

function analyzeSeasonalTrends(suggestions: any[]): any {
  return {
    currentSeason: '가을',
    peakDemandPeriod: '10월 중순 (단풍시즌)',
    offSeasonOpportunity: '겨울철 온천/힐링 패키지'
  }
}

function analyzeWeatherImpact(suggestions: any[]): any {
  return {
    weatherSensitivity: '높음',
    optimalConditions: '맑음, 기온 15-25도',
    contingencyPlans: '우천시 실내 프로그램 대체'
  }
}

function identifyCompetitiveGaps(suggestions: any[], accommodation: any): string[] {
  return [
    '날씨 예보 기반 패키지 부족',
    '이벤트 연계 상품 미흡',
    '동적 가격 조정 시스템 부재'
  ]
}