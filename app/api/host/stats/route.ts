import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const hostId = searchParams.get('host_id')

    if (!hostId) {
      return NextResponse.json(
        { error: '호스트 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // Service role key로 RLS 우회
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing')
      return NextResponse.json(
        { error: '서버 설정 오류입니다.' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const today = new Date().toISOString().split('T')[0]

    try {
      // 호스트 정보 가져오기
      const { data: hostData } = await supabase
        .from('hosts')
        .select('id')
        .eq('host_id', hostId)
        .single()

      if (!hostData) {
        return NextResponse.json(
          { error: '호스트를 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      // 호스트의 숙소들 가져오기
      const { data: accommodations } = await supabase
        .from('accommodations')
        .select('id')
        .eq('host_id', hostData.id)

      if (!accommodations || accommodations.length === 0) {
        return NextResponse.json({
          success: true,
          stats: {
            checkins: 0,
            checkouts: 0,
            reservations: 0
          }
        })
      }

      const accommodationIds = accommodations.map(acc => acc.id)

      // 병렬로 통계 데이터 가져오기
      const [todayCheckins, todayCheckouts, todayReservations] = await Promise.all([
        // 오늘의 체크인 예약
        supabase
          .from('reservations')
          .select('id')
          .in('accommodation_id', accommodationIds)
          .eq('checkin_date', today)
          .eq('status', 'confirmed'),
        
        // 오늘의 체크아웃 예약
        supabase
          .from('reservations')
          .select('id')
          .in('accommodation_id', accommodationIds)
          .eq('checkout_date', today)
          .eq('status', 'confirmed'),
        
        // 오늘의 신규 예약
        supabase
          .from('reservations')
          .select('id')
          .in('accommodation_id', accommodationIds)
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`)
      ])

      return NextResponse.json({
        success: true,
        stats: {
          checkins: todayCheckins.data?.length || 0,
          checkouts: todayCheckouts.data?.length || 0,
          reservations: todayReservations.data?.length || 0
        }
      })

    } catch (error) {
      console.error('Host stats error:', error)
      return NextResponse.json(
        { error: '통계 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Host stats API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}