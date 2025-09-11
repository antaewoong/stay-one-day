import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export const dynamic = 'force-dynamic'

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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('payment_status')
    const search = searchParams.get('search')
    const requestedHostId = searchParams.get('host_id')
    
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
    
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('reservations')
      .select(`
        *,
        accommodation:accommodations!inner(
          id,
          name,
          accommodation_type,
          address,
          host_id
        )
      `)
      .eq('accommodation.host_id', host.id)

    // 필터 적용
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    
    if (paymentStatus && paymentStatus !== 'all') {
      query = query.eq('payment_status', paymentStatus)
    }

    // 검색 (예약번호, 게스트명, 이메일, 전화번호)
    if (search) {
      query = query.or(`
        reservation_number.ilike.%${search}%,
        guest_name.ilike.%${search}%,
        guest_email.ilike.%${search}%,
        guest_phone.ilike.%${search}%
      `)
    }

    // 정렬 및 페이징
    const { data: reservations, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('호스트 예약 조회 실패:', error)
      return NextResponse.json({ error: '예약 조회에 실패했습니다.' }, { status: 500 })
    }

    // 전체 카운트 조회
    let countQuery = supabaseAdmin
      .from('reservations')
      .select('*, accommodation:accommodations!inner(host_id)', { count: 'exact', head: true })
      .eq('accommodation.host_id', host.id)

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status)
    }
    
    if (paymentStatus && paymentStatus !== 'all') {
      countQuery = countQuery.eq('payment_status', paymentStatus)
    }

    if (search) {
      countQuery = countQuery.or(`
        reservation_number.ilike.%${search}%,
        guest_name.ilike.%${search}%,
        guest_email.ilike.%${search}%,
        guest_phone.ilike.%${search}%
      `)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('호스트 예약 카운트 조회 실패:', countError)
    }

    return NextResponse.json({
      data: reservations || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('호스트 예약 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 예약 상태 업데이트 (호스트용)
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
    const { id, status, special_requests, hostId } = body

    if (!id) {
      return NextResponse.json({ error: '예약 ID가 필요합니다.' }, { status: 400 })
    }

    // 세션 hostId와 요청 hostId 일치 확인
    if (hostId && hostId !== sessionHostId) {
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

    // 해당 예약이 호스트의 숙소인지 확인
    const { data: reservationCheck, error: checkError } = await supabaseAdmin
      .from('reservations')
      .select(`
        id,
        accommodation:accommodations(host_id)
      `)
      .eq('id', id)
      .single()

    if (checkError || !reservationCheck) {
      return NextResponse.json({ error: '예약을 찾을 수 없습니다.' }, { status: 404 })
    }

    if (reservationCheck.accommodation?.host_id !== host.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status) updateData.status = status
    if (special_requests !== undefined) updateData.special_requests = special_requests

    const { data, error } = await supabaseAdmin
      .from('reservations')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        accommodation:accommodations(
          id,
          name,
          accommodation_type,
          address
        )
      `)
      .single()

    if (error) {
      console.error('호스트 예약 업데이트 실패:', error)
      return NextResponse.json({ error: '예약 업데이트에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ data })

  } catch (error) {
    console.error('호스트 예약 업데이트 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}