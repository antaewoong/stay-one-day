import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(req: NextRequest) {
  try {
    const conversionData = await req.json()

    // 전환 데이터 저장
    const { error: conversionError } = await supabaseAdmin
      .from('booking_conversions')
      .insert({
        reservation_id: conversionData.reservationId,
        session_id: conversionData.sessionId,
        user_id: conversionData.userId,
        accommodation_id: conversionData.accommodationId,
        booking_amount: conversionData.bookingAmount,
        booking_at: conversionData.bookingAt,
        journey_duration_minutes: conversionData.journeyDurationMinutes,
        ga_transaction_id: `txn_${conversionData.reservationId}`
      })

    if (conversionError) {
      throw conversionError
    }

    // 세션을 전환됨으로 업데이트
    const { error: sessionError } = await supabaseAdmin
      .from('web_sessions')
      .update({
        converted: true,
        conversion_value: conversionData.bookingAmount
      })
      .eq('session_id', conversionData.sessionId)

    if (sessionError) {
      console.error('세션 업데이트 실패:', sessionError)
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('전환 추적 실패:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}