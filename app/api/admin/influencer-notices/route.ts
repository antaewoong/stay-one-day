import { NextRequest } from 'next/server'
import { adminRoute, sb, ok, bad } from '../_kit'

export const dynamic = 'force-dynamic'

export const GET = adminRoute(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'all'
  const type = searchParams.get('type') || 'all'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = (page - 1) * limit

  let query = sb().from('influencer_notices').select('*').order('created_at', { ascending: false })

  // 상태 필터링
  if (status === 'active') {
    query = query.eq('is_active', true)
  } else if (status === 'inactive') {
    query = query.eq('is_active', false)
  }

  // 타입 필터링
  if (type !== 'all') {
    query = query.eq('notice_type', type)
  }

  const { data: notices, error, count } = await query.range(offset, offset + limit - 1)

  if (error) return bad(error)

  return ok({
    notices: notices || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  })
})

export const POST = adminRoute(async (req: NextRequest, ctx: any) => {
  const body = await req.json()
  const {
    title,
    content,
    notice_type = 'collaboration',
    target_month,
    target_year,
    is_active = true
  } = body

  if (!title?.trim() || !content?.trim()) {
    return bad('제목과 내용은 필수입니다', 400)
  }

  const { data: notice, error } = await sb().from('influencer_notices').insert({
    title: title.trim(),
    content: content.trim(),
    notice_type,
    target_month: target_month || null,
    target_year: target_year || null,
    is_active,
    created_by: ctx.adminId
  }).select().single()

  if (error) return bad(error)
  return ok(notice)
})

export const DELETE = adminRoute(async (req: NextRequest) => {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return bad('id required', 400)
  const { error } = await sb().from('influencer_notices').delete().eq('id', id)
  if (error) return bad(error)
  return ok(true)
})