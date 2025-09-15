import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * 예약 확정 웹훅 - ROI 추적용
 * 외부 시스템(예약 플랫폼)에서 예약 발생시 호출
 * POST /api/webhook/bookings
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const {
      booking_id,
      accommodation_id,
      amount,
      currency = 'KRW',
      status = 'confirmed',
      occurred_at,
      utm_source,
      utm_medium,
      utm_campaign,
      referrer,
      session_id,
      click_id,
      guest_info
    } = body

    // 필수 필드 검증
    if (!booking_id || !accommodation_id || !amount || !occurred_at) {
      return NextResponse.json({
        error: 'Missing required fields',
        required: ['booking_id', 'accommodation_id', 'amount', 'occurred_at']
      }, { status: 400 })
    }

    const supabase = createClient()

    // 1. 숙소 존재 확인
    const { data: accommodation, error: accomError } = await supabase
      .from('accommodations')
      .select('id, name, host_id')
      .eq('id', accommodation_id)
      .single()

    if (accomError || !accommodation) {
      return NextResponse.json({
        error: 'Accommodation not found',
        accommodation_id
      }, { status: 404 })
    }

    // 2. 스마트 링크 연결 확인 (click_id가 있는 경우)
    let smartLinkId = null
    if (click_id) {
      const { data: clickLog } = await supabase
        .from('smart_link_clicks')
        .select('smart_link_id')
        .eq('session_id', session_id)
        .order('clicked_at', { ascending: false })
        .limit(1)
        .single()

      if (clickLog) {
        smartLinkId = clickLog.smart_link_id
      }
    }

    // 3. 예약 정보 저장/업데이트 (중복 처리)
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('id', booking_id)
      .single()

    let bookingResult

    if (existingBooking) {
      // 기존 예약 업데이트
      bookingResult = await supabase
        .from('bookings')
        .update({
          accommodation_id,
          amount: parseFloat(amount.toString()),
          currency,
          status,
          occurred_at: new Date(occurred_at).toISOString(),
          utm_source,
          utm_medium,
          utm_campaign,
          referrer,
          session_id,
          smart_link_id: smartLinkId,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking_id)
        .select()
        .single()
    } else {
      // 새 예약 생성
      bookingResult = await supabase
        .from('bookings')
        .insert({
          id: booking_id,
          accommodation_id,
          amount: parseFloat(amount.toString()),
          currency,
          status,
          occurred_at: new Date(occurred_at).toISOString(),
          utm_source,
          utm_medium,
          utm_campaign,
          referrer,
          session_id,
          smart_link_id: smartLinkId,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
    }

    if (bookingResult.error) {
      console.error('예약 저장 실패:', bookingResult.error)
      return NextResponse.json({
        error: 'Failed to save booking',
        details: bookingResult.error.message
      }, { status: 500 })
    }

    // 4. ROI 계산 및 캐시 무효화
    if (status === 'confirmed' && smartLinkId) {
      // 스마트 링크의 전환 수 증가
      await supabase
        .from('smart_links')
        .update({
          conversion_count: supabase.raw('(conversion_count || 0) + 1'),
          total_revenue: supabase.raw(`(total_revenue || 0) + ${parseFloat(amount.toString())}`),
          last_converted_at: new Date().toISOString()
        })
        .eq('id', smartLinkId)

      // 호스트 리포트 캐시 무효화 (다음 조회시 새 ROI 반영)
      await supabase
        .from('host_reports')
        .update({ is_stale: true })
        .eq('accommodation_id', accommodation_id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // 7일 이내
    }

    // 5. 성능 로깅
    const duration = Date.now() - startTime
    console.log(`[BOOKING_WEBHOOK] booking_id=${booking_id} accommodation_id=${accommodation_id} amount=${amount} smart_link_id=${smartLinkId} duration=${duration}ms`)

    // 6. 응답 반환
    return NextResponse.json({
      success: true,
      booking_id,
      accommodation_id,
      accommodation_name: accommodation.name,
      host_id: accommodation.host_id,
      amount: parseFloat(amount.toString()),
      currency,
      status,
      smart_link_connected: !!smartLinkId,
      processed_at: new Date().toISOString()
    }, { status: 200 })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[BOOKING_WEBHOOK_ERROR] duration=${duration}ms error:`, error)

    return NextResponse.json({
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * GET: 웹훅 상태 확인 (헬스체크)
 */
export async function GET() {
  return NextResponse.json({
    service: 'booking_webhook',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
}

/**
 * 웹훅 서명 검증 (보안 강화용)
 * 실제 운영시에는 HMAC 서명 검증 추가 권장
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // const crypto = require('crypto')
  // const expectedSignature = crypto
  //   .createHmac('sha256', secret)
  //   .update(payload)
  //   .digest('hex')
  // return crypto.timingSafeEqual(
  //   Buffer.from(signature),
  //   Buffer.from(`sha256=${expectedSignature}`)
  // )

  // 임시: 모든 요청 허용 (개발용)
  return true
}