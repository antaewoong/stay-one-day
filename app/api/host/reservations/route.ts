import { NextRequest, NextResponse } from 'next/server'
import { withHostAuth } from '@/lib/auth/withHostAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withHostAuth(async ({ req, supabase, roleIds }) => {
  try {
    const hostId = roleIds.hostId!
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('payment_status')
    const search = searchParams.get('search')
    
    const offset = (page - 1) * limit

    let query = supabase
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
      .eq('accommodation.host_id', hostId)

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
      return NextResponse.json({ ok: false, code: 'QUERY_ERROR', message: error.message }, { status: 500 })
    }

    // 전체 카운트 조회
    let countQuery = supabase
      .from('reservations')
      .select('*, accommodation:accommodations!inner(host_id)', { count: 'exact', head: true })
      .eq('accommodation.host_id', hostId)

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
      ok: true,
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
    return NextResponse.json({ ok: false, code: 'QUERY_ERROR', message: 'Failed to load reservations data' }, { status: 500 })
  }
})

// 예약 상태 업데이트 (호스트용)
export const PUT = withHostAuth(async ({ req, supabase, roleIds }) => {
  try {
    const hostId = roleIds.hostId!
    const body = await req.json()
    const { id, status, special_requests } = body

    if (!id) {
      return NextResponse.json({ ok: false, code: 'MISSING_PARAM', message: '예약 ID가 필요합니다.' }, { status: 400 })
    }

    // 해당 예약이 호스트의 숙소인지 확인
    const { data: reservationCheck, error: checkError } = await supabase
      .from('reservations')
      .select(`
        id,
        accommodation:accommodations(host_id)
      `)
      .eq('id', id)
      .single()

    if (checkError || !reservationCheck) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: '예약을 찾을 수 없습니다.' }, { status: 404 })
    }

    if (reservationCheck.accommodation?.host_id !== hostId) {
      return NextResponse.json({ ok: false, code: 'FORBIDDEN', message: '권한이 없습니다.' }, { status: 403 })
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status) updateData.status = status
    if (special_requests !== undefined) updateData.special_requests = special_requests

    const { data, error } = await supabase
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
      return NextResponse.json({ ok: false, code: 'QUERY_ERROR', message: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data })

  } catch (error) {
    console.error('호스트 예약 업데이트 API 오류:', error)
    return NextResponse.json({ ok: false, code: 'QUERY_ERROR', message: 'Failed to update reservation' }, { status: 500 })
  }
})