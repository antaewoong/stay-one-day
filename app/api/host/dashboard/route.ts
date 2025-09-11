import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // 세션 쿠키에서 호스트 인증 토큰 확인
    const cookies = request.cookies
    const hostAuth = cookies.get('hostAuth')?.value === 'true'
    const sessionHostId = cookies.get('hostId')?.value

    if (!hostAuth || !sessionHostId) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const requestedHostId = searchParams.get('hostId')

    // URL 파라미터의 hostId와 세션의 hostId가 일치하는지 확인
    if (requestedHostId && requestedHostId !== sessionHostId) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    console.log('Dashboard API - 받은 sessionHostId:', sessionHostId)

    // 호스트 정보 가져오기 (인증된 세션 hostId로)
    const { data: host, error: hostError } = await supabaseAdmin
      .from('hosts')
      .select('*')
      .eq('id', sessionHostId)
      .single()

    console.log('Dashboard API - 찾은 호스트:', host)
    console.log('Dashboard API - 에러:', hostError)

    if (hostError || !host) {
      return NextResponse.json({ error: 'Host not found', debug: { sessionHostId, hostError } }, { status: 404 })
    }

    // 호스트의 숙소들 조회
    const { data: accommodations } = await supabaseAdmin
      .from('accommodations')
      .select('*')
      .eq('host_id', host.id)

    const accommodationIds = accommodations?.map(a => a.id) || []

    // 예약 데이터 조회 (최근 3개월)
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const { data: reservations } = await supabaseAdmin
      .from('reservations')
      .select(`
        *,
        accommodations!inner(name)
      `)
      .in('accommodation_id', accommodationIds)
      .gte('created_at', threeMonthsAgo.toISOString())
      .order('created_at', { ascending: false })

    // 리뷰 데이터 조회
    const { data: reviews } = await supabaseAdmin
      .from('reviews')
      .select(`
        *,
        accommodations!inner(name)
      `)
      .in('accommodation_id', accommodationIds)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10)

    // 통계 계산
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisYear = new Date(now.getFullYear(), 0, 1)

    const monthlyReservations = reservations?.filter(r => 
      new Date(r.created_at) >= thisMonth
    ) || []

    const yearlyReservations = reservations?.filter(r => 
      new Date(r.created_at) >= thisYear
    ) || []

    const totalEarnings = yearlyReservations.reduce((sum, r) => sum + r.total_amount, 0)
    const monthlyEarnings = monthlyReservations.reduce((sum, r) => sum + r.total_amount, 0)
    
    const averageRating = reviews?.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0

    const occupancyRate = accommodations?.length > 0 
      ? Math.floor((monthlyReservations.length / accommodations.length) * 30) // 대략적 계산
      : 0

    // 오늘 체크인/체크아웃
    const today = now.toISOString().split('T')[0]
    const todayCheckins = reservations?.filter(r => r.checkin_date === today).length || 0
    const todayCheckouts = reservations?.filter(r => r.checkout_date === today).length || 0
    const pendingReservations = reservations?.filter(r => r.status === 'confirmed').length || 0

    // 최근 예약 (상세 정보와 함께)
    const recentBookings = reservations?.slice(0, 10).map(r => ({
      id: r.id,
      guestName: r.guest_name,
      propertyName: r.accommodations?.name || '숙소명 없음',
      checkIn: r.checkin_date,
      checkOut: r.checkout_date,
      amount: r.total_amount,
      status: r.status
    })) || []

    // 최근 리뷰
    const recentReviews = reviews?.slice(0, 5).map(r => ({
      id: r.id,
      guestName: r.user_id, // 실제로는 users 테이블과 조인 필요
      propertyName: r.accommodations?.name || '숙소명 없음',
      rating: r.rating,
      comment: r.content,
      date: r.created_at.split('T')[0]
    })) || []

    const dashboardData = {
      host: {
        id: host.id,
        host_id: host.host_id,
        name: host.representative_name,
        business_name: host.business_name
      },
      stats: {
        totalEarnings,
        monthlyEarnings,
        totalBookings: yearlyReservations.length,
        monthlyBookings: monthlyReservations.length,
        averageRating: Math.round(averageRating * 10) / 10,
        occupancyRate: Math.min(occupancyRate, 100),
        totalProperties: accommodations?.length || 0,
        activeProperties: accommodations?.filter(a => a.status === 'active').length || 0
      },
      today: {
        checkins: todayCheckins,
        checkouts: todayCheckouts,
        pendingBookings: pendingReservations
      },
      recentBookings,
      recentReviews,
      accommodations: accommodations?.map(a => ({
        id: a.id,
        name: a.name,
        status: a.status === 'active' ? 'available' : 'blocked',
        accommodation_type: a.accommodation_type || '숙소',
        max_capacity: a.max_capacity || 0,
        base_price: a.base_price || 0
      })) || []
    }

    return NextResponse.json({
      success: true,
      data: dashboardData
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load dashboard data' },
      { status: 500 }
    )
  }
}