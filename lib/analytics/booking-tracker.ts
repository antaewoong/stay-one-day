// 🎯 실제 예약 완료 이벤트 DB 추적 시스템
import { createClient } from '@/lib/supabase/client'
import { trackBookingComplete, trackBookingStart } from './ga4-setup'
import { getTracker, trackBookingConversion } from './tracking'

interface BookingEventData {
  reservationId: string
  accommodationId: string
  accommodationName: string
  hostId: string
  userId?: string
  guestName: string
  guestEmail: string
  guestPhone: string
  totalAmount: number
  checkInDate: string
  checkOutDate: string
  guestCount: number
  location: string
  // 마케팅 데이터
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmTerm?: string
  utmContent?: string
  referrer?: string
  landingPage?: string
  sessionId?: string
  // 여정 데이터
  firstVisitAt?: Date
  bookingAt: Date
  journeyDurationMinutes?: number
  touchpointsCount?: number
}

class BookingEventTracker {
  private supabase = createClient()

  // 🎯 예약 시작 추적
  async trackBookingStartEvent(data: {
    accommodationId: string
    accommodationName: string
    checkInDate: string
    checkOutDate: string
    guestCount: number
    sessionId?: string
  }) {
    try {
      // 1. 세션 정보 수집
      const sessionData = this.collectSessionData()
      
      // 2. GA4 이벤트 전송
      trackBookingStart(data.accommodationId, data.accommodationName, data.checkInDate, data.checkOutDate)
      
      // 3. 마케팅 이벤트 테이블에 기록
      const eventData = {
        session_id: data.sessionId || sessionData.sessionId,
        event_name: 'booking_start',
        event_category: 'ecommerce',
        event_action: 'begin_checkout',
        event_label: data.accommodationName,
        page_url: window.location.href,
        page_title: document.title,
        custom_parameters: {
          accommodation_id: data.accommodationId,
          accommodation_name: data.accommodationName,
          check_in_date: data.checkInDate,
          check_out_date: data.checkOutDate,
          guest_count: data.guestCount,
          nights: this.calculateNights(data.checkInDate, data.checkOutDate),
          estimated_value: this.estimateBookingValue(data.accommodationId, data.checkInDate, data.checkOutDate)
        }
      }

      const { error } = await this.supabase
        .from('marketing_events')
        .insert(eventData)

      if (error) {
        console.error('예약 시작 이벤트 기록 실패:', error)
      }

      // 4. 세션 데이터 업데이트
      await this.updateSessionProgress('booking_started')

    } catch (error) {
      console.error('예약 시작 추적 실패:', error)
    }
  }

  // 🎯 예약 완료 추적 (메인 함수)
  async trackBookingCompleteEvent(bookingData: BookingEventData): Promise<void> {
    try {
      console.log('📊 예약 완료 추적 시작:', bookingData.reservationId)

      // 1. 세션 정보 수집
      const sessionData = this.collectSessionData()
      const utmData = this.collectUTMData()

      // 2. 여정 분석 데이터
      const journeyData = await this.analyzeCustomerJourney(sessionData.sessionId)

      // 3. 통합 추적 데이터 구성
      const completeTrackingData = {
        ...bookingData,
        ...utmData,
        sessionId: sessionData.sessionId,
        referrer: sessionData.referrer,
        landingPage: sessionData.landingPage,
        firstVisitAt: journeyData.firstVisit,
        journeyDurationMinutes: journeyData.durationMinutes,
        touchpointsCount: journeyData.touchpoints
      }

      // 4. 병렬 처리로 모든 추적 시스템에 전송
      await Promise.all([
        this.saveToBookingConversions(completeTrackingData),
        this.sendToGA4(completeTrackingData),
        this.updateMarketingEvents(completeTrackingData),
        this.updateCampaignPerformance(completeTrackingData),
        this.triggerWebhooks(completeTrackingData)
      ])

      console.log('✅ 예약 완료 추적 성공:', bookingData.reservationId)

    } catch (error) {
      console.error('❌ 예약 완료 추적 실패:', error)
      // 에러 로깅하되 사용자 경험에는 영향 없도록
      this.logTrackingError(error, bookingData)
    }
  }

  // 📊 DB에 예약 전환 데이터 저장
  private async saveToBookingConversions(data: BookingEventData) {
    const conversionData = {
      reservation_id: data.reservationId,
      session_id: data.sessionId,
      user_id: data.userId,
      accommodation_id: data.accommodationId,
      host_id: data.hostId,
      booking_amount: data.totalAmount,
      guest_email: data.guestEmail,
      guest_phone: data.guestPhone,
      guest_name: data.guestName,
      
      // 유입 정보
      utm_source: data.utmSource,
      utm_medium: data.utmMedium,
      utm_campaign: data.utmCampaign,
      utm_term: data.utmTerm,
      utm_content: data.utmContent,
      referrer: data.referrer,
      
      // 여정 정보
      first_visit_at: data.firstVisitAt,
      booking_at: data.bookingAt,
      journey_duration_minutes: data.journeyDurationMinutes,
      touchpoints_count: data.touchpointsCount,
      
      // GA4 연동 정보
      ga_transaction_id: `txn_${data.reservationId}`,
      ga_client_id: this.getGAClientId()
    }

    const { error } = await this.supabase
      .from('booking_conversions')
      .insert(conversionData)

    if (error) {
      console.error('예약 전환 DB 저장 실패:', error)
      throw error
    }

    return conversionData
  }

  // 📈 GA4로 전환 이벤트 전송
  private async sendToGA4(data: BookingEventData) {
    // GA4 구매 완료 이벤트
    trackBookingComplete({
      reservationId: data.reservationId,
      accommodationId: data.accommodationId,
      accommodationName: data.accommodationName,
      totalAmount: data.totalAmount,
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      guestCount: data.guestCount,
      location: data.location
    })

    // 추가 GA4 맞춤 이벤트
    if (typeof window !== 'undefined' && window.gtag) {
      // 전환 가치 이벤트
      window.gtag('event', 'conversion', {
        send_to: `${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}/booking_complete`,
        value: data.totalAmount,
        currency: 'KRW',
        transaction_id: data.reservationId
      })

      // 호스트별 성과 이벤트
      window.gtag('event', 'host_booking', {
        host_id: data.hostId,
        accommodation_id: data.accommodationId,
        booking_value: data.totalAmount,
        event_category: 'host_performance',
        event_label: data.hostId
      })
    }
  }

  // 📊 마케팅 이벤트 테이블 업데이트
  private async updateMarketingEvents(data: BookingEventData) {
    const eventData = {
      session_id: data.sessionId,
      user_id: data.userId,
      event_name: 'booking_complete',
      event_category: 'ecommerce',
      event_action: 'purchase',
      event_label: data.accommodationName,
      event_value: data.totalAmount,
      page_url: window.location.href,
      page_title: document.title,
      custom_parameters: {
        reservation_id: data.reservationId,
        accommodation_id: data.accommodationId,
        host_id: data.hostId,
        total_amount: data.totalAmount,
        guest_count: data.guestCount,
        nights: this.calculateNights(data.checkInDate, data.checkOutDate),
        location: data.location,
        utm_source: data.utmSource,
        utm_medium: data.utmMedium,
        utm_campaign: data.utmCampaign
      }
    }

    await this.supabase
      .from('marketing_events')
      .insert(eventData)
  }

  // 📈 캠페인 성과 업데이트
  private async updateCampaignPerformance(data: BookingEventData) {
    if (!data.utmSource || !data.utmMedium) return

    const today = new Date().toISOString().split('T')[0]
    
    // 기존 데이터 조회
    const { data: existingData } = await this.supabase
      .from('campaign_performance')
      .select('*')
      .eq('date', today)
      .eq('utm_source', data.utmSource)
      .eq('utm_medium', data.utmMedium)
      .eq('utm_campaign', data.utmCampaign || '')
      .single()

    const updateData = {
      date: today,
      utm_source: data.utmSource,
      utm_medium: data.utmMedium,
      utm_campaign: data.utmCampaign || '',
      conversions: (existingData?.conversions || 0) + 1,
      revenue: (existingData?.revenue || 0) + data.totalAmount,
      conversion_rate: this.calculateConversionRate(data.utmSource, data.utmMedium, today),
      updated_at: new Date().toISOString()
    }

    await this.supabase
      .from('campaign_performance')
      .upsert(updateData, {
        onConflict: 'date,utm_source,utm_medium,utm_campaign'
      })
  }

  // 🔔 웹훅 트리거 (Slack 알림 등)
  private async triggerWebhooks(data: BookingEventData) {
    try {
      // Slack 웹훅 (즉시 알림)
      if (process.env.SLACK_WEBHOOK_URL) {
        const slackMessage = {
          text: `🎉 새로운 예약이 완료되었습니다!`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*숙소:* ${data.accommodationName}\n*예약자:* ${data.guestName}\n*금액:* ${data.totalAmount.toLocaleString()}원\n*일정:* ${data.checkInDate} ~ ${data.checkOutDate}`
              }
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*유입경로:* ${data.utmSource || 'Direct'} / ${data.utmMedium || 'None'}\n*캠페인:* ${data.utmCampaign || 'N/A'}`
              }
            }
          ]
        }

        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackMessage)
        })
      }

      // 기타 웹훅 (CRM, 이메일 마케팅 등)
      const webhookData = {
        event: 'booking_complete',
        timestamp: new Date().toISOString(),
        data: data
      }

      // 예: 이메일 마케팅 플랫폼 연동
      if (process.env.EMAIL_MARKETING_WEBHOOK) {
        await fetch(process.env.EMAIL_MARKETING_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData)
        })
      }

    } catch (error) {
      console.error('웹훅 전송 실패:', error)
      // 웹훅 실패는 중요하지 않으므로 에러를 throw하지 않음
    }
  }

  // 🔍 고객 여정 분석
  private async analyzeCustomerJourney(sessionId: string) {
    const { data: sessionData } = await this.supabase
      .from('web_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    const { data: events } = await this.supabase
      .from('marketing_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    const firstVisit = sessionData?.created_at ? new Date(sessionData.created_at) : new Date()
    const now = new Date()
    const durationMinutes = Math.round((now.getTime() - firstVisit.getTime()) / (1000 * 60))

    return {
      firstVisit,
      durationMinutes,
      touchpoints: events?.length || 0,
      pageViews: sessionData?.page_views || 1,
      referrer: sessionData?.referrer
    }
  }

  // 유틸리티 함수들
  private collectSessionData() {
    return {
      sessionId: sessionStorage.getItem('session_id') || `session_${Date.now()}`,
      referrer: document.referrer,
      landingPage: sessionStorage.getItem('landing_page') || window.location.href
    }
  }

  private collectUTMData() {
    return {
      utmSource: sessionStorage.getItem('utm_source'),
      utmMedium: sessionStorage.getItem('utm_medium'),
      utmCampaign: sessionStorage.getItem('utm_campaign'),
      utmTerm: sessionStorage.getItem('utm_term'),
      utmContent: sessionStorage.getItem('utm_content')
    }
  }

  private calculateNights(checkIn: string, checkOut: string): number {
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  private async estimateBookingValue(accommodationId: string, checkIn: string, checkOut: string): Promise<number> {
    // 숙소 기본 가격 조회
    const { data: accommodation } = await this.supabase
      .from('accommodations')
      .select('base_price, weekend_price')
      .eq('id', accommodationId)
      .single()

    if (!accommodation) return 0

    const nights = this.calculateNights(checkIn, checkOut)
    return accommodation.base_price * nights
  }

  private async updateSessionProgress(progress: string) {
    const sessionId = sessionStorage.getItem('session_id')
    if (!sessionId) return

    await this.supabase
      .from('web_sessions')
      .update({ 
        updated_at: new Date().toISOString(),
        // 세션 진행 상태 업데이트 로직
      })
      .eq('session_id', sessionId)
  }

  private async calculateConversionRate(utmSource: string, utmMedium: string, date: string): Promise<number> {
    const { data: sessionCount } = await this.supabase
      .from('web_sessions')
      .select('id', { count: 'exact' })
      .eq('utm_source', utmSource)
      .eq('utm_medium', utmMedium)
      .gte('created_at', `${date}T00:00:00Z`)
      .lte('created_at', `${date}T23:59:59Z`)

    const { data: conversionCount } = await this.supabase
      .from('booking_conversions')
      .select('id', { count: 'exact' })
      .eq('utm_source', utmSource)
      .eq('utm_medium', utmMedium)
      .gte('booking_at', `${date}T00:00:00Z`)
      .lte('booking_at', `${date}T23:59:59Z`)

    if (!sessionCount?.length) return 0
    return ((conversionCount?.length || 0) / sessionCount.length) * 100
  }

  private getGAClientId(): string | null {
    try {
      if (typeof window !== 'undefined' && window.gtag) {
        return window.gtag('get', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, 'client_id')
      }
    } catch (error) {
      console.error('GA 클라이언트 ID 가져오기 실패:', error)
    }
    return null
  }

  private logTrackingError(error: any, bookingData: BookingEventData) {
    // 에러 로깅 시스템 (Sentry, LogRocket 등)
    console.error('예약 추적 에러:', {
      error: error.message,
      reservationId: bookingData.reservationId,
      timestamp: new Date().toISOString()
    })
  }
}

// 싱글톤 인스턴스 생성
const bookingTracker = new BookingEventTracker()

// 편의 함수들 export
export const trackBookingStarted = (data: any) => bookingTracker.trackBookingStartEvent(data)
export const trackBookingCompleted = (data: BookingEventData) => bookingTracker.trackBookingCompleteEvent(data)

export default bookingTracker