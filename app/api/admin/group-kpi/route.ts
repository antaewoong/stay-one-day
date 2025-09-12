import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/middleware/withAdminAuth'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export const GET = (req: NextRequest) =>
  withAdminAuth(req, async (request: NextRequest, ctx: any) => {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || '30d'
    const accommodationId = searchParams.get('accommodationId')

    // 기간별 날짜 범위 계산
    const getDateRange = () => {
      const now = new Date()
      const start = new Date(now)
      
      switch (period) {
        case '7d':
          start.setDate(start.getDate() - 7)
          break
        case '30d':
          start.setDate(start.getDate() - 30)
          break
        case '90d':
          start.setDate(start.getDate() - 90)
          break
        default:
          start.setDate(start.getDate() - 30)
      }
      
      return {
        start: start.toISOString(),
        end: now.toISOString()
      }
    }

    const { start, end } = getDateRange()

    // 숙소 필터링 조건
    let accommodationFilter = {}
    if (accommodationId && accommodationId !== 'all') {
      accommodationFilter = { accommodation_id: accommodationId }
    }

    console.log('✅ 관리자 인증 성공:', ctx.adminEmail)

    // Service role client 사용 (GPT 권장)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 예약 데이터 조회 (전체 또는 특정 숙소)
    let query = supabaseAdmin
      .from('reservations')
      .select(`
        *,
        accommodations!inner(id, name, location)
      `)
      .gte('created_at', start)
      .lte('created_at', end)
      .eq('status', 'confirmed')
      .gte('guest_count', 2)

    // 숙소 필터링 적용
    if (accommodationId && accommodationId !== 'all') {
      query = query.eq('accommodation_id', accommodationId)
    }

    const { data: reservations, error } = await query

    // 기본 통계 계산
    const totalGroupBookings = reservations?.length || 0
    const groupRevenue = reservations?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0
    const totalGuests = reservations?.reduce((sum, r) => sum + (r.guest_count || 0), 0) || 0
    const avgGroupSize = totalGroupBookings > 0 ? totalGuests / totalGroupBookings : 0

    // 이전 기간과 비교하여 성장률 계산
    const prevStart = new Date(start)
    const prevEnd = new Date(end)
    const periodDiff = new Date(end).getTime() - new Date(start).getTime()
    prevStart.setTime(prevStart.getTime() - periodDiff)
    prevEnd.setTime(prevEnd.getTime() - periodDiff)

    let prevQuery = supabaseAdmin
      .from('reservations')
      .select('*')
      .gte('created_at', prevStart.toISOString())
      .lte('created_at', prevEnd.toISOString())
      .eq('status', 'confirmed')
      .gte('guest_count', 2)

    // 숙소 필터링 적용
    if (accommodationId && accommodationId !== 'all') {
      prevQuery = prevQuery.eq('accommodation_id', accommodationId)
    }

    const { data: prevReservations } = await prevQuery

    const prevGroupBookings = prevReservations?.length || 0
    const groupGrowthRate = prevGroupBookings > 0 
      ? ((totalGroupBookings - prevGroupBookings) / prevGroupBookings) * 100 
      : 0

    // 페르소나별 분류 (간단한 로직 - 실제로는 더 복잡한 AI 분류 사용)
    const classifyPersona = (reservation: any) => {
      const guestCount = reservation.guest_count || 0
      const hasKids = reservation.has_children || false
      const guestName = reservation.guest_name?.toLowerCase() || ''
      
      if (hasKids || guestName.includes('엄마') || guestName.includes('맘')) return 'moms'
      if (guestName.includes('웨딩') || guestName.includes('신부') || guestName.includes('브라이덜')) return 'bridal'
      if (guestCount >= 4) return 'friends'
      return 'couples'
    }

    // 페르소나별 통계
    const personaStats = {
      moms: { bookings: 0, revenue: 0, growth: 0 },
      bridal: { bookings: 0, revenue: 0, growth: 0 },
      friends: { bookings: 0, revenue: 0, growth: 0 },
      couples: { bookings: 0, revenue: 0, growth: 0 }
    }

    reservations?.forEach(reservation => {
      const persona = classifyPersona(reservation)
      personaStats[persona].bookings += 1
      personaStats[persona].revenue += reservation.total_amount || 0
    })

    // 감정 기반 점수 (실제로는 AI/ML 모델에서 계산)
    const emotionScores = {
      photoSpotScore: Math.random() * 100 + 50, // 50-150
      kidsFriendlyScore: Math.random() * 80 + 40, // 40-120
      convenienceScore: Math.random() * 90 + 60, // 60-150
      sentimentScore: Math.random() * 70 + 80, // 80-150
      lhiGroupScore: 0
    }
    emotionScores.lhiGroupScore = (emotionScores.photoSpotScore + emotionScores.kidsFriendlyScore + 
                                   emotionScores.convenienceScore + emotionScores.sentimentScore) / 4

    // Same-Day Fit 지표 (실제로는 복잡한 알고리즘)
    const sameDayFitMetrics = {
      moms: Math.random() * 30 + 70, // 70-100
      bridal: Math.random() * 40 + 60, // 60-100
      friends: Math.random() * 35 + 65, // 65-100
      couples: Math.random() * 25 + 75, // 75-100
      recommended: 'moms' as string
    }

    // 최고 점수 페르소나 찾기
    const maxPersona = Object.entries(sameDayFitMetrics)
      .filter(([key]) => key !== 'recommended')
      .reduce((max, [persona, score]) => 
        (score as number) > (max[1] as number) ? [persona, score] : max
      )
    sameDayFitMetrics.recommended = maxPersona[0]

    // A/B 테스트 결과 (실제로는 실험 플랫폼에서 가져옴)
    const abTestResults = [
      {
        testGroup: 'A',
        conversionRate: Math.random() * 10 + 15, // 15-25%
        bookingRate: Math.random() * 5 + 8, // 8-13%
        isWinning: true
      },
      {
        testGroup: 'B',
        conversionRate: Math.random() * 8 + 12, // 12-20%
        bookingRate: Math.random() * 4 + 6, // 6-10%
        isWinning: false
      }
    ].sort((a, b) => b.conversionRate - a.conversionRate)

    const response = {
      totalGroupBookings,
      groupRevenue,
      avgGroupSize: Math.round(avgGroupSize * 10) / 10,
      groupGrowthRate: Math.round(groupGrowthRate * 10) / 10,
      personaBreakdown: personaStats,
      emotionScores,
      sameDayFitMetrics,
      abTestResults
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Admin Group KPI API 오류:', error)
    return NextResponse.json(
      { error: 'KPI 데이터를 가져오는데 실패했습니다.', details: error },
      { status: 500 }
    )
  }
})