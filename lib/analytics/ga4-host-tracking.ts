// 🎯 호스트별 GA4 데이터 추적 시스템
// 각 숙소별로 개별 성과 데이터를 추적하고 분석

export interface HostAnalyticsData {
  accommodationId: string
  region: string
  hostId: string
  pageViews: number
  uniqueVisitors: number
  conversionRate: number
  averageSessionDuration: number
  bounceRate: number
  topReferrers: { source: string; sessions: number }[]
  searchKeywords: { keyword: string; impressions: number; clicks: number }[]
  geographicData: { city: string; sessions: number }[]
  deviceBreakdown: { device: string; percentage: number }[]
  timeAnalysis: {
    peakHours: number[]
    peakDays: string[]
    seasonalTrends: { month: string; bookings: number }[]
  }
}

export class HostGA4Tracker {
  private accommodationId: string
  private region: string
  
  constructor(accommodationId: string, region: string) {
    this.accommodationId = accommodationId
    this.region = region
  }

  // 🏠 숙소별 맞춤 이벤트 추적
  trackAccommodationView() {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'accommodation_view', {
        event_category: 'engagement',
        event_label: this.accommodationId,
        custom_parameters: {
          accommodation_id: this.accommodationId,
          region: this.region,
          page_type: 'accommodation_detail'
        }
      })
    }
  }

  trackBookingIntent() {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'booking_intent', {
        event_category: 'conversion',
        event_label: this.accommodationId,
        custom_parameters: {
          accommodation_id: this.accommodationId,
          region: this.region,
          funnel_step: 'booking_form_start'
        }
      })
    }
  }

  trackBookingComplete(bookingValue: number) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: `booking_${Date.now()}`,
        value: bookingValue,
        currency: 'KRW',
        items: [{
          item_id: this.accommodationId,
          item_name: `Accommodation in ${this.region}`,
          category: 'accommodation',
          quantity: 1,
          price: bookingValue
        }],
        custom_parameters: {
          accommodation_id: this.accommodationId,
          region: this.region
        }
      })
    }
  }

  // 📊 경쟁업체 비교 데이터 수집
  trackCompetitorAnalysis(competitorAction: string) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'competitor_analysis', {
        event_category: 'research',
        event_label: competitorAction,
        custom_parameters: {
          accommodation_id: this.accommodationId,
          region: this.region,
          action: competitorAction
        }
      })
    }
  }

  // 🎯 지역별 타겟팅 데이터
  trackRegionInterest(targetRegion: string) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'region_interest', {
        event_category: 'targeting',
        event_label: targetRegion,
        custom_parameters: {
          accommodation_id: this.accommodationId,
          host_region: this.region,
          interested_region: targetRegion
        }
      })
    }
  }
}

// 🔗 GA4 Reporting API 연동
export async function fetchHostAnalytics(
  accommodationId: string, 
  startDate: string, 
  endDate: string
): Promise<HostAnalyticsData | null> {
  try {
    // GA4 Reporting API 호출
    const response = await fetch('/api/analytics/ga4-host-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accommodationId,
        startDate,
        endDate,
        metrics: [
          'sessions',
          'users', 
          'pageviews',
          'bounceRate',
          'averageSessionDuration'
        ],
        dimensions: [
          'customEvent:accommodation_id',
          'city',
          'deviceType',
          'source',
          'medium'
        ]
      })
    })

    if (!response.ok) {
      throw new Error('Analytics data fetch failed')
    }

    return await response.json()
  } catch (error) {
    console.error('GA4 호스트 데이터 조회 실패:', error)
    return null
  }
}

// 🎨 호스트 대시보드용 차트 데이터 생성
export function prepareHostDashboardData(analyticsData: HostAnalyticsData) {
  return {
    // 성과 요약 카드
    performanceCards: [
      {
        title: '페이지 조회수',
        value: analyticsData.pageViews.toLocaleString(),
        change: '+12.5%',
        trend: 'up'
      },
      {
        title: '고유 방문자',
        value: analyticsData.uniqueVisitors.toLocaleString(),
        change: '+8.3%',
        trend: 'up'
      },
      {
        title: '예약 전환율',
        value: `${(analyticsData.conversionRate * 100).toFixed(1)}%`,
        change: '+2.1%',
        trend: 'up'
      },
      {
        title: '평균 체류시간',
        value: formatDuration(analyticsData.averageSessionDuration),
        change: '+15.2%',
        trend: 'up'
      }
    ],

    // 지역별 방문자 분포 차트
    regionChart: {
      type: 'pie',
      data: analyticsData.geographicData.map(geo => ({
        name: geo.city,
        value: geo.sessions
      }))
    },

    // 트래픽 소스 분석
    trafficSources: analyticsData.topReferrers.map(ref => ({
      source: ref.source,
      sessions: ref.sessions,
      percentage: (ref.sessions / analyticsData.pageViews * 100).toFixed(1)
    })),

    // 시간대별 성과 분석
    timeAnalysis: {
      peakHours: analyticsData.timeAnalysis.peakHours,
      peakDays: analyticsData.timeAnalysis.peakDays,
      recommendations: generateTimeBasedRecommendations(analyticsData.timeAnalysis)
    }
  }
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}분 ${remainingSeconds}초`
}

function generateTimeBasedRecommendations(timeData: any): string[] {
  const recommendations = []
  
  if (timeData.peakHours.includes(20) || timeData.peakHours.includes(21)) {
    recommendations.push('저녁 시간대 광고 집중 투자 권장')
  }
  
  if (timeData.peakDays.includes('Friday') || timeData.peakDays.includes('Saturday')) {
    recommendations.push('주말 프로모션 강화로 예약률 증대 가능')
  }
  
  return recommendations
}

// 🎯 맞춤형 타겟팅 오디언스 생성
export function createHostTargetingAudience(analyticsData: HostAnalyticsData) {
  return {
    demographicTargeting: {
      age: '25-45',
      gender: 'all',
      interests: ['여행', '휴양', '가족여행']
    },
    geographicTargeting: {
      primaryRegions: analyticsData.geographicData
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 3)
        .map(geo => geo.city),
      radius: '50km'
    },
    behavioralTargeting: {
      devicePreference: analyticsData.deviceBreakdown
        .sort((a, b) => b.percentage - a.percentage)[0].device,
      optimalTiming: {
        hours: analyticsData.timeAnalysis.peakHours,
        days: analyticsData.timeAnalysis.peakDays
      }
    },
    customAudiences: [
      `${analyticsData.region} 지역 숙박 관심고객`,
      '예약 의도 고객',
      '재방문 가능성 높은 고객'
    ]
  }
}