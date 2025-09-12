import { NextRequest } from 'next/server'
import { adminRoute, sb, ok, bad } from '../_kit'

export const dynamic = 'force-dynamic'

export const GET = adminRoute(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') // pending, approved, rejected
  const type = searchParams.get('type') // accommodation, user, etc

  let query = sb().from('delete_requests').select(`
    id,
    request_type,
    target_id,
    reason,
    status,
    host_id,
    created_at,
    processed_at,
    admin_notes,
    hosts!inner(
      name,
      email,
      phone
    ),
    accommodations!inner(
      name,
      address,
      accommodation_type
    )
  `).order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  if (type) {
    query = query.eq('request_type', type)
  }

  const { data, error } = await query

  if (error) return bad(error)
  return ok(data)
})

export const POST = adminRoute(async (req: NextRequest) => {
  const body = await req.json()
  const {
    request_type, // 'accommodation', 'user', etc
    target_id,    // 삭제할 대상의 ID
    reason,       // 삭제 사유
    host_id       // 요청자 호스트 ID
  } = body

  // 필수 필드 검증
  if (!request_type || !target_id || !reason || !host_id) {
    return bad('모든 필드를 입력해주세요', 400)
  }

  // 이미 삭제 요청이 있는지 확인
  const { data: existingRequest } = await sb()
    .from('delete_requests')
    .select('id')
    .eq('request_type', request_type)
    .eq('target_id', target_id)
    .eq('status', 'pending')
    .single()

  if (existingRequest) {
    return bad('이미 처리 중인 삭제 요청이 있습니다', 400)
  }

  // 권한 확인 (본인의 것만 삭제 요청 가능)
  if (request_type === 'accommodation') {
    const { data: accommodation, error: checkError } = await sb()
      .from('accommodations')
      .select('host_id')
      .eq('id', target_id)
      .single()

    if (checkError || !accommodation || accommodation.host_id !== host_id) {
      return bad('본인의 숙소만 삭제 요청할 수 있습니다', 403)
    }
  }

  // 삭제 요청 생성
  const { data, error } = await sb().from('delete_requests').insert({
    request_type,
    target_id,
    reason,
    host_id,
    status: 'pending',
    created_at: new Date().toISOString()
  }).select().single()

  if (error) return bad(error)
  return ok(data)
})

export const PUT = adminRoute(async (req: NextRequest) => {
  const body = await req.json()
  const { id, status, admin_notes } = body

  if (!id || !status) {
    return bad('id와 status는 필수입니다', 400)
  }

  const updateData: any = {
    status,
    processed_at: new Date().toISOString()
  }

  if (admin_notes) {
    updateData.admin_notes = admin_notes
  }

  const { data, error } = await sb()
    .from('delete_requests')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) return bad(error)
  return ok(data)
})

export const DELETE = adminRoute(async (req: NextRequest) => {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return bad('id required', 400)
  const { error } = await sb().from('delete_requests').delete().eq('id', id)
  if (error) return bad(error)
  return ok(true)
})