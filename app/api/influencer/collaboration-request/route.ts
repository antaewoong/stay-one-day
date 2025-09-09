import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

// POST: 협업 신청 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { 
      token, 
      accommodation_id, 
      request_type, 
      proposed_rate, 
      message, 
      check_in_date, 
      check_out_date, 
      guest_count 
    } = body

    // 토큰 검증
    let influencerId: string
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { influencerId: string }
      influencerId = decoded.influencerId
    } catch (error) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 토큰입니다.' },
        { status: 400 }
      )
    }

    // 입력값 검증
    if (!accommodation_id || !check_in_date || !check_out_date || !guest_count) {
      return NextResponse.json(
        { success: false, message: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    // 숙소 정보 및 호스트 ID 조회
    const { data: accommodation, error: accommodationError } = await supabase
      .from('accommodations')
      .select('id, host_id')
      .eq('id', accommodation_id)
      .single()

    if (accommodationError || !accommodation) {
      return NextResponse.json(
        { success: false, message: '숙소를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 중복 신청 확인 (같은 날짜, 같은 숙소)
    const { data: existingRequest } = await supabase
      .from('influencer_collaboration_requests')
      .select('id')
      .eq('influencer_id', influencerId)
      .eq('accommodation_id', accommodation_id)
      .eq('check_in_date', check_in_date)
      .eq('status', 'pending')
      .single()

    if (existingRequest) {
      return NextResponse.json(
        { success: false, message: '이미 같은 날짜에 신청한 협업이 있습니다.' },
        { status: 400 }
      )
    }

    // 협업 요청 생성
    const { data: collaborationRequest, error } = await supabase
      .from('influencer_collaboration_requests')
      .insert({
        influencer_id: influencerId,
        accommodation_id,
        host_id: accommodation.host_id,
        request_type,
        proposed_rate: proposed_rate || null,
        message: message || '',
        check_in_date,
        check_out_date,
        guest_count,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('협업 요청 생성 에러:', error)
      return NextResponse.json(
        { success: false, message: '협업 신청에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: '협업 신청이 완료되었습니다.',
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