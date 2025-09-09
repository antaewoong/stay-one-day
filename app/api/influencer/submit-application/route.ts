import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// POST: 인플루언서 협업 신청 제출
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { 
      influencer_id, 
      accommodation_id, 
      request_type, 
      proposed_rate, 
      message, 
      check_in_date, 
      check_out_date, 
      guest_count 
    } = body

    // 입력값 검증
    if (!influencer_id || !accommodation_id || !check_in_date || !check_out_date || !guest_count) {
      return NextResponse.json(
        { success: false, message: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    // 현재 협업 기간 확인
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1

    const { data: currentPeriod, error: periodError } = await supabase
      .from('collaboration_periods')
      .select('*')
      .eq('year', currentYear)
      .eq('month', currentMonth)
      .eq('is_open', true)
      .single()

    if (periodError || !currentPeriod) {
      return NextResponse.json(
        { success: false, message: '현재 협업 신청 기간이 아닙니다.' },
        { status: 400 }
      )
    }

    // 신청 기간 확인
    const now = new Date()
    const applicationStart = new Date(currentPeriod.application_start_date)
    const applicationEnd = new Date(currentPeriod.application_end_date)

    if (now < applicationStart || now > applicationEnd) {
      return NextResponse.json(
        { success: false, message: '협업 신청 기간이 아닙니다.' },
        { status: 400 }
      )
    }

    // 모집 인원 확인
    if (currentPeriod.current_applications >= currentPeriod.max_applications) {
      return NextResponse.json(
        { success: false, message: '모집 인원이 마감되었습니다.' },
        { status: 400 }
      )
    }

    // 숙소 정보 및 호스트 ID 조회
    const { data: accommodation, error: accommodationError } = await supabase
      .from('accommodations')
      .select('id, host_id, name')
      .eq('id', accommodation_id)
      .eq('status', 'active')
      .single()

    if (accommodationError || !accommodation) {
      return NextResponse.json(
        { success: false, message: '숙소를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 중복 신청 확인 (같은 월, 같은 숙소)
    const { data: existingRequest } = await supabase
      .from('influencer_collaboration_requests')
      .select('id')
      .eq('influencer_id', influencer_id)
      .eq('accommodation_id', accommodation_id)
      .gte('created_at', applicationStart.toISOString())
      .lte('created_at', applicationEnd.toISOString())
      .single()

    if (existingRequest) {
      return NextResponse.json(
        { success: false, message: '이미 이 숙소에 협업 신청을 하셨습니다.' },
        { status: 400 }
      )
    }

    // 날짜 검증 (협업 기간 내)
    const checkIn = new Date(check_in_date)
    const checkOut = new Date(check_out_date)
    const collabStart = new Date(currentPeriod.collaboration_start_date)
    const collabEnd = new Date(currentPeriod.collaboration_end_date)

    if (checkIn < collabStart || checkOut > collabEnd) {
      return NextResponse.json(
        { success: false, message: '협업 기간 내에서 날짜를 선택해주세요.' },
        { status: 400 }
      )
    }

    // 트랜잭션 시작: 협업 요청 생성 + 신청 수 증가
    const { data: collaborationRequest, error: createError } = await supabase
      .from('influencer_collaboration_requests')
      .insert({
        influencer_id,
        accommodation_id,
        host_id: accommodation.host_id,
        request_type,
        proposed_rate: proposed_rate || null,
        message: message || '',
        check_in_date,
        check_out_date,
        guest_count,
        status: 'pending',
        final_status: 'pending'
      })
      .select()
      .single()

    if (createError) {
      console.error('협업 요청 생성 에러:', createError)
      return NextResponse.json(
        { success: false, message: '협업 신청에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 현재 신청 수 증가
    const { error: updateError } = await supabase
      .from('collaboration_periods')
      .update({ 
        current_applications: currentPeriod.current_applications + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentPeriod.id)

    if (updateError) {
      console.error('신청 수 업데이트 에러:', updateError)
      // 이미 신청은 생성되었으므로 에러는 로그만 남김
    }

    return NextResponse.json({ 
      success: true, 
      message: `협업 신청이 완료되었습니다. ${accommodation.name} 호스트의 승인을 기다려주세요.`,
      request: collaborationRequest
    })
  } catch (error) {
    console.error('협업 신청 API 에러:', error)
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}