import { NextResponse } from 'next/server'
import { withHostAuth } from '@/lib/auth/withHostAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withHostAuth(async ({ req, supabase, roleIds }) => {
  try {
    const hostId = roleIds.hostId!

    // 최근 예약 5건 + 숙소 수 요약
    const { data: recent, error: rErr } = await supabase
      .from('reservations')
      .select(`
        id, 
        checkin_date, 
        checkout_date, 
        status, 
        total_amount,
        accommodation:accommodations!inner(host_id)
      `)
      .eq('accommodation.host_id', hostId)
      .order('checkin_date', { ascending: false })
      .limit(5)

    if (rErr) return NextResponse.json({ ok: false, code: 'QUERY_ERROR', message: rErr.message }, { status: 500 })

    const { count: accCount, error: aErr } = await supabase
      .from('accommodations')
      .select('*', { count: 'exact', head: true })
      .eq('host_id', hostId)

    if (aErr) return NextResponse.json({ ok: false, code: 'QUERY_ERROR', message: aErr.message }, { status: 500 })

    // 오늘 날짜 KST
    const today = new Date()
    const todayKST = new Date(today.getTime() + (9 * 60 * 60 * 1000))
    const todayString = todayKST.toISOString().split('T')[0]

    // 오늘의 체크인/체크아웃 통계
    const { data: todayReservations, error: todayErr } = await supabase
      .from('reservations')
      .select(`
        id, 
        checkin_date,
        checkout_date,
        status,
        accommodation:accommodations!inner(host_id)
      `)
      .eq('accommodation.host_id', hostId)
      .or(`checkin_date.eq.${todayString},checkout_date.eq.${todayString}`)

    if (todayErr) {
      console.error('Today reservations query error:', todayErr)
    }

    const todayCheckins = todayReservations?.filter(r => r.checkin_date === todayString).length || 0
    const todayCheckouts = todayReservations?.filter(r => r.checkout_date === todayString).length || 0

    // 대기중인 예약
    const { count: pendingCount, error: pendingErr } = await supabase
      .from('reservations')
      .select(`
        id,
        accommodation:accommodations!inner(host_id)
      `, { count: 'exact', head: true })
      .eq('accommodation.host_id', hostId)
      .eq('status', 'pending')

    if (pendingErr) {
      console.error('Pending reservations query error:', pendingErr)
    }

    return NextResponse.json({ 
      ok: true, 
      data: { 
        recent, 
        accommodations_count: accCount ?? 0,
        today: {
          checkins: todayCheckins,
          checkouts: todayCheckouts,
          pendingBookings: pendingCount ?? 0
        }
      } 
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { ok: false, code: 'QUERY_ERROR', message: 'Failed to load dashboard data' },
      { status: 500 }
    )
  }
})