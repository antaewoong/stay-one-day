import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET: 현재 협업 기간 정보 조회
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1

    // 현재 월의 협업 기간 정보 조회
    const { data: currentPeriod, error } = await supabase
      .from('collaboration_periods')
      .select('*')
      .eq('year', currentYear)
      .eq('month', currentMonth)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('현재 협업 기간 조회 에러:', error)
      return NextResponse.json(
        { success: false, error: '협업 기간 정보를 불러올 수 없습니다' },
        { status: 500 }
      )
    }

    // 현재 월 데이터가 없으면 다음 월 데이터 조회
    if (!currentPeriod) {
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear

      const { data: nextPeriod, error: nextError } = await supabase
        .from('collaboration_periods')
        .select('*')
        .eq('year', nextYear)
        .eq('month', nextMonth)
        .single()

      if (nextError && nextError.code !== 'PGRST116') {
        console.error('다음 협업 기간 조회 에러:', nextError)
        return NextResponse.json(
          { success: false, error: '협업 기간 정보를 불러올 수 없습니다' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        period: nextPeriod || null
      })
    }

    return NextResponse.json({
      success: true,
      period: currentPeriod
    })
  } catch (error) {
    console.error('현재 협업 기간 API 에러:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}