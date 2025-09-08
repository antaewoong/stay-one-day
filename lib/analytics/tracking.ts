// 실제 마케팅 추적 시스템
import { createClient } from '@/lib/supabase/client'

export interface UTMParams {
  utm_source?: string
  utm_medium?: string 
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
}

export interface SessionData {
  sessionId: string
  userId?: string
  utmParams: UTMParams
  referrer: string
  landingPage: string
  deviceInfo: {
    deviceType: string
    browser: string
    os: string
    userAgent: string
  }
  location?: {
    country: string
    city: string
    ip: string
  }
}

class MarketingTracker {
  private sessionId: string
  private userId?: string
  private sessionStartTime: number
  private pageViews: number = 0
  private supabase = createClient()

  constructor() {
    this.sessionId = this.generateSessionId()
    this.sessionStartTime = Date.now()
    this.initializeSession()
  }

  // 세션 ID 생성
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // 세션 초기화 및 추적 시작
  async initializeSession() {
    try {
      const sessionData = await this.collectSessionData()
      
      // 세션 데이터를 Supabase에 저장
      const { error } = await this.supabase
        .from('web_sessions')
        .insert({
          session_id: this.sessionId,
          user_id: this.userId,
          utm_source: sessionData.utmParams.utm_source,
          utm_medium: sessionData.utmParams.utm_medium,
          utm_campaign: sessionData.utmParams.utm_campaign,
          utm_term: sessionData.utmParams.utm_term,
          utm_content: sessionData.utmParams.utm_content,
          referrer: sessionData.referrer,
          landing_page: sessionData.landingPage,
          device_type: sessionData.deviceInfo.deviceType,
          browser: sessionData.deviceInfo.browser,
          os: sessionData.deviceInfo.os,
          user_agent: sessionData.deviceInfo.userAgent,
          country: sessionData.location?.country,
          city: sessionData.location?.city,
          ip_address: sessionData.location?.ip,
          ga_client_id: this.getGAClientId(),
          ga_session_id: this.getGASessionId()
        })

      if (error) {
        console.error('세션 추적 실패:', error)
      }

      // GA4에 세션 시작 이벤트 전송
      this.sendGA4Event('session_start', {
        session_id: this.sessionId,
        utm_source: sessionData.utmParams.utm_source,
        utm_medium: sessionData.utmParams.utm_medium,
        utm_campaign: sessionData.utmParams.utm_campaign
      })

      // 페이지뷰 추적 시작
      this.trackPageView()

    } catch (error) {
      console.error('세션 초기화 실패:', error)
    }
  }

  // 세션 데이터 수집
  private async collectSessionData(): Promise<SessionData> {
    const urlParams = new URLSearchParams(window.location.search)
    const utmParams: UTMParams = {
      utm_source: urlParams.get('utm_source') || this.getStoredUTM('utm_source'),
      utm_medium: urlParams.get('utm_medium') || this.getStoredUTM('utm_medium'),
      utm_campaign: urlParams.get('utm_campaign') || this.getStoredUTM('utm_campaign'),
      utm_term: urlParams.get('utm_term') || this.getStoredUTM('utm_term'),
      utm_content: urlParams.get('utm_content') || this.getStoredUTM('utm_content')
    }

    // UTM 파라미터를 세션 스토리지에 저장 (세션 동안 유지)
    this.storeUTMParams(utmParams)

    const deviceInfo = this.getDeviceInfo()
    const location = await this.getLocationInfo()

    return {
      sessionId: this.sessionId,
      userId: this.userId,
      utmParams,
      referrer: document.referrer,
      landingPage: window.location.href,
      deviceInfo,
      location
    }
  }

  // UTM 파라미터 저장
  private storeUTMParams(utmParams: UTMParams) {
    Object.entries(utmParams).forEach(([key, value]) => {
      if (value) {
        sessionStorage.setItem(key, value)
      }
    })
  }

  // 저장된 UTM 파라미터 가져오기
  private getStoredUTM(param: string): string | null {
    return sessionStorage.getItem(param)
  }

  // 디바이스 정보 수집
  private getDeviceInfo() {
    const userAgent = navigator.userAgent
    let deviceType = 'Desktop'
    let browser = 'Unknown'
    let os = 'Unknown'

    // 디바이스 타입 감지
    if (/Mobi|Android/i.test(userAgent)) {
      deviceType = 'Mobile'
    } else if (/Tablet|iPad/i.test(userAgent)) {
      deviceType = 'Tablet'
    }

    // 브라우저 감지
    if (userAgent.includes('Chrome')) browser = 'Chrome'
    else if (userAgent.includes('Firefox')) browser = 'Firefox'
    else if (userAgent.includes('Safari')) browser = 'Safari'
    else if (userAgent.includes('Edge')) browser = 'Edge'

    // OS 감지
    if (userAgent.includes('Windows')) os = 'Windows'
    else if (userAgent.includes('Mac')) os = 'macOS'
    else if (userAgent.includes('Linux')) os = 'Linux'
    else if (userAgent.includes('Android')) os = 'Android'
    else if (userAgent.includes('iOS')) os = 'iOS'

    return { deviceType, browser, os, userAgent }
  }

  // 위치 정보 수집 (IP 기반)
  private async getLocationInfo() {
    try {
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      return {
        country: data.country_name,
        city: data.city,
        ip: data.ip
      }
    } catch (error) {
      console.error('위치 정보 수집 실패:', error)
      return undefined
    }
  }

  // GA4 클라이언트 ID 가져오기
  private getGAClientId(): string | null {
    try {
      // gtag를 사용하여 GA4 클라이언트 ID 가져오기
      if (typeof gtag !== 'undefined') {
        return gtag('get', 'GA_MEASUREMENT_ID', 'client_id')
      }
    } catch (error) {
      console.error('GA4 클라이언트 ID 가져오기 실패:', error)
    }
    return null
  }

  // GA4 세션 ID 가져오기
  private getGASessionId(): string | null {
    try {
      if (typeof gtag !== 'undefined') {
        return gtag('get', 'GA_MEASUREMENT_ID', 'session_id')
      }
    } catch (error) {
      console.error('GA4 세션 ID 가져오기 실패:', error)
    }
    return null
  }

  // 페이지뷰 추적
  trackPageView(pageTitle?: string) {
    this.pageViews++
    
    const eventData = {
      session_id: this.sessionId,
      user_id: this.userId,
      event_name: 'page_view',
      event_category: 'engagement',
      event_action: 'view',
      page_url: window.location.href,
      page_title: pageTitle || document.title,
      custom_parameters: {
        page_views_in_session: this.pageViews
      }
    }

    // Supabase에 이벤트 저장
    this.supabase
      .from('marketing_events')
      .insert(eventData)
      .then(({ error }) => {
        if (error) console.error('페이지뷰 추적 실패:', error)
      })

    // GA4에 페이지뷰 전송
    this.sendGA4Event('page_view', {
      page_title: pageTitle || document.title,
      page_location: window.location.href
    })

    // 세션 데이터 업데이트
    this.updateSessionData()
  }

  // 사용자 정의 이벤트 추적
  trackEvent(eventName: string, parameters: any = {}) {
    const eventData = {
      session_id: this.sessionId,
      user_id: this.userId,
      event_name: eventName,
      event_category: parameters.category || 'custom',
      event_action: parameters.action || eventName,
      event_label: parameters.label,
      event_value: parameters.value,
      page_url: window.location.href,
      page_title: document.title,
      custom_parameters: parameters
    }

    // Supabase에 이벤트 저장
    this.supabase
      .from('marketing_events')
      .insert(eventData)
      .then(({ error }) => {
        if (error) console.error('이벤트 추적 실패:', error)
      })

    // GA4에 이벤트 전송
    this.sendGA4Event(eventName, parameters)
  }

  // 예약 전환 추적
  async trackBookingConversion(reservationData: {
    reservationId: string
    accommodationId: string
    bookingAmount: number
    guestEmail: string
    guestPhone: string
    guestName: string
  }) {
    const utmParams = this.getCurrentUTMParams()
    
    const conversionData = {
      reservation_id: reservationData.reservationId,
      session_id: this.sessionId,
      user_id: this.userId,
      utm_source: utmParams.utm_source,
      utm_medium: utmParams.utm_medium,
      utm_campaign: utmParams.utm_campaign,
      utm_term: utmParams.utm_term,
      utm_content: utmParams.utm_content,
      referrer: sessionStorage.getItem('initial_referrer'),
      accommodation_id: reservationData.accommodationId,
      booking_amount: reservationData.bookingAmount,
      guest_email: reservationData.guestEmail,
      guest_phone: reservationData.guestPhone,
      guest_name: reservationData.guestName,
      first_visit_at: new Date(this.sessionStartTime),
      booking_at: new Date(),
      journey_duration_minutes: Math.round((Date.now() - this.sessionStartTime) / 1000 / 60),
      touchpoints_count: this.pageViews,
      ga_transaction_id: `txn_${reservationData.reservationId}`,
      ga_client_id: this.getGAClientId()
    }

    // Supabase에 전환 데이터 저장
    const { error } = await this.supabase
      .from('booking_conversions')
      .insert(conversionData)

    if (error) {
      console.error('예약 전환 추적 실패:', error)
    }

    // GA4에 구매 이벤트 전송
    this.sendGA4Event('purchase', {
      transaction_id: conversionData.ga_transaction_id,
      value: reservationData.bookingAmount,
      currency: 'KRW',
      items: [{
        item_id: reservationData.accommodationId,
        item_name: '숙소 예약',
        category: '예약',
        quantity: 1,
        price: reservationData.bookingAmount
      }]
    })

    // 세션을 전환됨으로 업데이트
    await this.supabase
      .from('web_sessions')
      .update({
        converted: true,
        conversion_value: reservationData.bookingAmount
      })
      .eq('session_id', this.sessionId)

    return conversionData
  }

  // GA4 이벤트 전송
  private sendGA4Event(eventName: string, parameters: any = {}) {
    try {
      if (typeof gtag !== 'undefined') {
        gtag('event', eventName, {
          ...parameters,
          session_id: this.sessionId,
          custom_session_id: this.sessionId
        })
      }
    } catch (error) {
      console.error('GA4 이벤트 전송 실패:', error)
    }
  }

  // 현재 UTM 파라미터 가져오기
  private getCurrentUTMParams(): UTMParams {
    return {
      utm_source: sessionStorage.getItem('utm_source'),
      utm_medium: sessionStorage.getItem('utm_medium'),
      utm_campaign: sessionStorage.getItem('utm_campaign'),
      utm_term: sessionStorage.getItem('utm_term'),
      utm_content: sessionStorage.getItem('utm_content')
    }
  }

  // 세션 데이터 업데이트
  private async updateSessionData() {
    const duration = Math.round((Date.now() - this.sessionStartTime) / 1000)
    const bounced = this.pageViews === 1 && duration < 10 // 10초 미만이면 바운스

    await this.supabase
      .from('web_sessions')
      .update({
        page_views: this.pageViews,
        duration_seconds: duration,
        bounced,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', this.sessionId)
  }

  // 사용자 ID 설정 (로그인 시)
  setUserId(userId: string) {
    this.userId = userId
    
    // 세션 데이터 업데이트
    this.supabase
      .from('web_sessions')
      .update({ user_id: userId })
      .eq('session_id', this.sessionId)

    // GA4에 사용자 ID 설정
    if (typeof gtag !== 'undefined') {
      gtag('config', 'GA_MEASUREMENT_ID', {
        user_id: userId
      })
    }
  }

  // 세션 종료 처리
  endSession() {
    this.updateSessionData()
    
    // GA4에 세션 종료 이벤트 전송
    this.sendGA4Event('session_end', {
      session_duration: Math.round((Date.now() - this.sessionStartTime) / 1000)
    })
  }
}

// 글로벌 트래커 인스턴스
let tracker: MarketingTracker | null = null

// 트래커 초기화
export const initializeTracker = (): MarketingTracker => {
  if (!tracker && typeof window !== 'undefined') {
    tracker = new MarketingTracker()
    
    // 페이지 이탈 시 세션 종료
    window.addEventListener('beforeunload', () => {
      tracker?.endSession()
    })

    // 페이지 가시성 변화 추적
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        tracker?.endSession()
      }
    })
  }
  
  return tracker!
}

// 트래커 가져오기
export const getTracker = (): MarketingTracker | null => {
  return tracker
}

// 편의 함수들
export const trackPageView = (pageTitle?: string) => {
  tracker?.trackPageView(pageTitle)
}

export const trackEvent = (eventName: string, parameters?: any) => {
  tracker?.trackEvent(eventName, parameters)
}

export const trackBookingConversion = (reservationData: any) => {
  return tracker?.trackBookingConversion(reservationData)
}

export const setUserId = (userId: string) => {
  tracker?.setUserId(userId)
}

// 예약 관련 이벤트 추적 함수들
export const trackAccommodationView = (accommodationId: string, accommodationName: string) => {
  trackEvent('view_item', {
    category: 'ecommerce',
    action: 'view',
    item_id: accommodationId,
    item_name: accommodationName
  })
}

export const trackBookingStart = (accommodationId: string) => {
  trackEvent('begin_checkout', {
    category: 'ecommerce',
    action: 'begin_checkout',
    item_id: accommodationId
  })
}

export const trackBookingStep = (step: string, accommodationId: string) => {
  trackEvent('checkout_progress', {
    category: 'ecommerce',
    action: 'checkout_step',
    checkout_step: step,
    item_id: accommodationId
  })
}

export const trackSearchQuery = (query: string, resultsCount: number) => {
  trackEvent('search', {
    category: 'site_search',
    action: 'search',
    search_term: query,
    results_count: resultsCount
  })
}

// 캠페인 성과 집계 함수 (관리자용)
export const aggregateCampaignPerformance = async (date: string) => {
  const supabase = createClient()
  
  // 해당 날짜의 세션 데이터 집계
  const { data: sessionData } = await supabase
    .from('web_sessions')
    .select('*')
    .gte('created_at', `${date}T00:00:00Z`)
    .lt('created_at', `${date}T23:59:59Z`)

  if (!sessionData) return

  // UTM 소스별로 그룹화
  const campaignGroups = sessionData.reduce((acc, session) => {
    const key = `${session.utm_source || 'direct'}_${session.utm_medium || 'none'}_${session.utm_campaign || ''}`
    
    if (!acc[key]) {
      acc[key] = {
        utm_source: session.utm_source || 'direct',
        utm_medium: session.utm_medium || 'none',
        utm_campaign: session.utm_campaign || '',
        sessions: 0,
        users: new Set(),
        page_views: 0,
        bounces: 0,
        total_duration: 0,
        conversions: 0,
        revenue: 0
      }
    }
    
    acc[key].sessions++
    acc[key].users.add(session.user_id || session.session_id)
    acc[key].page_views += session.page_views
    if (session.bounced) acc[key].bounces++
    acc[key].total_duration += session.duration_seconds
    if (session.converted) {
      acc[key].conversions++
      acc[key].revenue += session.conversion_value || 0
    }
    
    return acc
  }, {} as any)

  // 캠페인 성과 데이터로 변환 및 저장
  for (const [key, data] of Object.entries(campaignGroups)) {
    const performanceData = {
      date,
      utm_source: data.utm_source,
      utm_medium: data.utm_medium,
      utm_campaign: data.utm_campaign,
      sessions: data.sessions,
      users: data.users.size,
      page_views: data.page_views,
      bounce_rate: data.sessions > 0 ? (data.bounces / data.sessions * 100) : 0,
      avg_session_duration: data.sessions > 0 ? Math.round(data.total_duration / data.sessions) : 0,
      conversions: data.conversions,
      conversion_rate: data.sessions > 0 ? (data.conversions / data.sessions * 100) : 0,
      revenue: data.revenue
    }

    await supabase
      .from('campaign_performance')
      .upsert(performanceData, {
        onConflict: 'date,utm_source,utm_medium,utm_campaign'
      })
  }
}

declare global {
  function gtag(...args: any[]): void
}