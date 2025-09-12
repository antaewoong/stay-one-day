import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getUser } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    // 기간별 일수 계산
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // 호스트 ID 가져오기
    const { data: hostData, error: hostError } = await supabase
      .from('hosts')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (hostError || !hostData) {
      return NextResponse.json({ error: 'Host not found' }, { status: 404 })
    }

    // 호스트의 숙소 ID들 가져오기
    const { data: accommodations } = await supabase
      .from('accommodations')
      .select('id')
      .eq('host_id', hostData.id)

    const accommodationIds = accommodations?.map(a => a.id) || []

    if (accommodationIds.length === 0) {
      return NextResponse.json({
        totalGroupBookings: 0,
        groupRevenue: 0,
        avgGroupSize: 0,
        groupGrowthRate: 0,
        personaBreakdown: {
          moms: { bookings: 0, revenue: 0, growth: 0 },
          bridal: { bookings: 0, revenue: 0, growth: 0 },
          friends: { bookings: 0, revenue: 0, growth: 0 },
          couples: { bookings: 0, revenue: 0, growth: 0 }
        },
        emotionScores: {
          photoSpotScore: 0,
          kidsFriendlyScore: 0,
          convenienceScore: 0,
          sentimentScore: 0,
          lhiGroupScore: 0
        },
        sameDayFitMetrics: {
          moms: 0,
          bridal: 0,
          friends: 0,
          couples: 0,
          recommended: 'friends'
        },
        abTestResults: []
      })
    }

    // 병렬 쿼리 실행
    const [
      reservationsResult,
      emotionScoresResult,
      sameDayFitResult,
      abTestResult
    ] = await Promise.allSettled([
      // 예약 데이터
      supabase
        .from('reservations')
        .select('id, total_amount, created_at, checkin_date')
        .in('accommodation_id', accommodationIds)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false }),

      // POI 감정 점수
      supabase
        .from('mv_poi_heat_group')
        .select('*')
        .in('accommodation_id', accommodationIds)
        .order('date', { ascending: false })
        .limit(1)
        .single(),

      // Same-Day Fit 점수
      supabase
        .from('v_same_day_fit_group')
        .select('*')
        .in('accommodation_id', accommodationIds)
        .order('date', { ascending: false })
        .limit(1)
        .single(),

      // A/B 테스트 성과
      supabase
        .from('v_ab_test_performance')
        .select('*')
        .order('conversion_rate_pct', { ascending: false })
        .limit(3)
    ])

    // 결과 처리
    const reservations = reservationsResult.status === 'fulfilled' ? reservationsResult.value.data || [] : []
    const emotionScores = emotionScoresResult.status === 'fulfilled' ? emotionScoresResult.value.data || {} : {}
    const sameDayFit = sameDayFitResult.status === 'fulfilled' ? sameDayFitResult.value.data || {} : {}
    const abTests = abTestResult.status === 'fulfilled' ? abTestResult.value.data || [] : []

    // 이전 기간 데이터 가져오기 (성장률 계산용)
    const prevStartDate = new Date(Date.now() - periodDays * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const prevEndDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data: prevReservations } = await supabase
      .from('reservations')
      .select('id, total_amount')
      .in('accommodation_id', accommodationIds)
      .gte('created_at', prevStartDate)
      .lt('created_at', prevEndDate)

    // 성장률 계산
    const currentRevenue = reservations.reduce((sum, r) => sum + (r.total_amount || 0), 0)
    const prevRevenue = (prevReservations || []).reduce((sum, r) => sum + (r.total_amount || 0), 0)
    const growthRate = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0

    // 페르소나별 분석 (실제로는 예약 메타데이터나 별도 분류 로직 필요)
    const totalBookings = reservations.length
    const personaDistribution = {
      moms: 0.35,
      bridal: 0.25, 
      friends: 0.25,
      couples: 0.15
    }

    const personaBreakdown = Object.entries(personaDistribution).reduce((acc, [persona, ratio]) => {
      const bookings = Math.floor(totalBookings * ratio)
      const revenue = Math.floor(currentRevenue * ratio)
      const growth = Math.random() * 30 - 10 // 임시 성장률 (-10% ~ 20%)
      
      acc[persona as keyof typeof acc] = { bookings, revenue, growth: Math.round(growth) }
      return acc
    }, {} as any)

    const response = {
      totalGroupBookings: totalBookings,
      groupRevenue: currentRevenue,
      avgGroupSize: 4.2, // 평균 그룹 크기 (실제로는 예약별 게스트 수 분석 필요)
      groupGrowthRate: Math.round(growthRate * 100) / 100,
      
      personaBreakdown,
      
      emotionScores: {
        photoSpotScore: emotionScores.total_photo_spot_score || 0,
        kidsFriendlyScore: emotionScores.total_kids_friendly_score || 0,
        convenienceScore: emotionScores.total_convenience_score || 0,
        sentimentScore: emotionScores.total_sentiment_score || 0,
        lhiGroupScore: emotionScores.lhi_group || 0
      },
      
      sameDayFitMetrics: {
        moms: sameDayFit.sf_score_moms || 0,
        bridal: sameDayFit.sf_score_bridal || 0,
        friends: sameDayFit.sf_score_friends || 0,
        couples: sameDayFit.sf_score_couples || 0,
        recommended: sameDayFit.recommended_persona || 'friends'
      },
      
      abTestResults: abTests.map(test => ({
        testGroup: test.test_group || 'A',
        conversionRate: test.conversion_rate_pct || 0,
        bookingRate: test.booking_rate_pct || 0,
        isWinning: (test.conversion_rate_pct || 0) > 5
      }))
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Group KPI API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}