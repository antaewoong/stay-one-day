import { NextResponse } from 'next/server'
import { withHostAuth } from '@/lib/auth/withHostAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withHostAuth(async ({ req, supabase, roleIds }) => {
  try {
    const hostId = roleIds.hostId!

    // 오늘 날짜 구하기 (KST)
    const today = new Date()
    const todayKST = new Date(today.getTime() + (9 * 60 * 60 * 1000)) // UTC + 9
    const todayString = todayKST.toISOString().split('T')[0]

    // 오늘의 예약 통계 (accommodation을 통해 조인)
    const { data: todayReservations, error: reservationError } = await supabase
      .from('reservations')
      .select(`
        id, 
        total_amount, 
        status,
        accommodation:accommodations!inner(host_id)
      `)
      .eq('accommodation.host_id', hostId)
      .gte('checkin_date', todayString)
      .lt('checkin_date', todayString + 'T23:59:59')

    if (reservationError) {
      console.error('예약 통계 조회 실패:', reservationError)
      return NextResponse.json({ 
        ok: false, 
        code: 'QUERY_ERROR', 
        message: reservationError.message 
      }, { status: 500 })
    }

    // 오늘의 문의 통계
    const { data: todayInquiries, error: inquiryError } = await supabase
      .from('inquiries')
      .select('id, status')
      .eq('user_type', 'host')
      .eq('user_id', hostId)
      .gte('created_at', todayString)
      .lt('created_at', todayString + 'T23:59:59')

    if (inquiryError) {
      console.error('문의 통계 조회 실패:', inquiryError)
      return NextResponse.json({ 
        ok: false, 
        code: 'QUERY_ERROR', 
        message: inquiryError.message 
      }, { status: 500 })
    }

    // 통계 계산
    const stats = {
      today_reservations: todayReservations?.length || 0,
      today_revenue: todayReservations?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0,
      today_inquiries: todayInquiries?.length || 0,
      pending_inquiries: todayInquiries?.filter(i => i.status === 'pending').length || 0
    }

    return NextResponse.json({
      ok: true,
      data: stats
    })

  } catch (error) {
    console.error('호스트 통계 API 에러:', error)
    return NextResponse.json(
      { ok: false, code: 'QUERY_ERROR', message: 'Failed to load host stats' },
      { status: 500 }
    )
  }
})
