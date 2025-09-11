import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// GET: 호스트의 협업 요청 목록 조회
export async function GET(request: NextRequest) {
  try {
    // 세션 쿠키에서 호스트 인증 토큰 확인
    const cookies = request.cookies
    const hostAuth = cookies.get('hostAuth')?.value === 'true'
    const sessionHostId = cookies.get('hostId')?.value

    if (!hostAuth || !sessionHostId) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }
    
    // 호스트 인증 확인 (세션 또는 쿼리 파라미터로 host_id 전달)
    const { searchParams } = new URL(request.url)
    const requestedHostId = searchParams.get('host_id')
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // URL 파라미터의 hostId와 세션의 hostId가 일치하는지 확인
    if (requestedHostId && requestedHostId !== sessionHostId) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    // 호스트 존재 여부 및 auth_user_id 확인
    const { data: host, error: hostError } = await supabaseAdmin
      .from('hosts')
      .select('id, auth_user_id')
      .eq('id', sessionHostId)
      .single()

    if (hostError || !host || !host.auth_user_id) {
      return NextResponse.json({ error: '호스트를 찾을 수 없습니다' }, { status: 404 })
    }

    // 협업 요청 조회 (인플루언서 및 숙소 정보 포함)
    let query = supabaseAdmin
      .from('influencer_collaboration_requests')
      .select(`
        *,
        influencer:influencers!inner(
          id,
          name,
          email,
          phone,
          instagram_handle,
          youtube_channel,
          tiktok_handle,
          follower_count,
          engagement_rate,
          content_category,
          profile_image_url,
          location
        ),
        accommodation:accommodations!inner(
          id,
          name,
          address,
          base_price,
          images
        )
      `)
      .eq('host_id', host.id)
      .order('created_at', { ascending: false })

    // 상태 필터링
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: requests, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('협업 요청 조회 에러:', error)
      return NextResponse.json(
        { error: '협업 요청을 불러올 수 없습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: requests || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('협업 요청 API 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// PUT: 협업 요청 상태 업데이트 (승인/거부)
export async function PUT(request: NextRequest) {
  try {
    // 세션 쿠키에서 호스트 인증 토큰 확인
    const cookies = request.cookies
    const hostAuth = cookies.get('hostAuth')?.value === 'true'
    const sessionHostId = cookies.get('hostId')?.value

    if (!hostAuth || !sessionHostId) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { request_id, status, host_notes, host_id } = body

    // 입력값 검증
    if (!request_id || !status) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      )
    }

    // 세션 hostId와 요청 hostId 일치 확인
    if (host_id && host_id !== sessionHostId) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    // 호스트 존재 여부 및 auth_user_id 확인
    const { data: host, error: hostError } = await supabaseAdmin
      .from('hosts')
      .select('id, auth_user_id')
      .eq('id', sessionHostId)
      .single()

    if (hostError || !host || !host.auth_user_id) {
      return NextResponse.json({ error: '호스트를 찾을 수 없습니다' }, { status: 404 })
    }

    if (!['accepted', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태입니다' },
        { status: 400 }
      )
    }

    // 협업 요청 존재 및 권한 확인
    const { data: existingRequest, error: fetchError } = await supabaseAdmin
      .from('influencer_collaboration_requests')
      .select('*, accommodation:accommodations!inner(host_id)')
      .eq('id', request_id)
      .eq('status', 'pending')
      .single()

    if (fetchError || !existingRequest) {
      return NextResponse.json(
        { error: '협업 요청을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 호스트 권한 확인
    if (existingRequest.accommodation.host_id !== host.id) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    // 상태 업데이트
    const { data: updatedRequest, error: updateError } = await supabaseAdmin
      .from('influencer_collaboration_requests')
      .update({
        status,
        admin_notes: host_notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', request_id)
      .select()
      .single()

    if (updateError) {
      console.error('협업 요청 상태 업데이트 에러:', updateError)
      return NextResponse.json(
        { error: '상태 업데이트에 실패했습니다' },
        { status: 500 }
      )
    }

    // 승인된 경우 자동 예약 생성
    if (status === 'accepted') {
      try {
        const { error: bookingError } = await supabaseAdmin
          .from('bookings')
          .insert({
            host_id: host.id,
            accommodation_id: existingRequest.accommodation_id,
            guest_name: `[인플루언서] ${existingRequest.influencer?.name || ''}`,
            guest_email: existingRequest.influencer?.email || '',
            guest_phone: existingRequest.influencer?.phone || '',
            check_in_date: existingRequest.check_in_date,
            check_out_date: existingRequest.check_out_date,
            guest_count: existingRequest.guest_count,
            total_amount: existingRequest.proposed_rate || 0,
            booking_type: 'influencer_collaboration',
            status: 'confirmed',
            special_requests: existingRequest.message || ''
          })

        if (bookingError) {
          console.error('자동 예약 생성 에러:', bookingError)
          // 예약 생성 실패해도 협업 요청은 승인됨 (별도 처리 필요)
        }
      } catch (bookingError) {
        console.error('예약 생성 중 예외:', bookingError)
      }
    }

    return NextResponse.json({
      success: true,
      message: status === 'accepted' ? '협업 요청이 승인되었습니다' : '협업 요청이 거부되었습니다',
      data: updatedRequest
    })
  } catch (error) {
    console.error('협업 요청 상태 업데이트 API 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}