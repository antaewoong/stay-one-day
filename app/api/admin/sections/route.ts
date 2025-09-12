import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/middleware/withAdminAuth'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0
export const runtime = 'nodejs'

export const GET = (req: NextRequest) => withAdminAuth(req, async (_req, sb) => {
  const { data, error } = await sb()
    .from('main_page_sections')
    .select('id,title,slug,position,is_active,created_at')
    .order('position', { ascending: true })
  if (error) return NextResponse.json({ ok:false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok:true, data })
})

export const POST = (req: NextRequest) => withAdminAuth(req, async (_req, sb) => {
  const body = await _req.json()
  const payload = {
    title: body.title?.trim(),
    slug: body.slug?.trim(),
    position: Number(body.position ?? 0),
    is_active: !!body.is_active,
  }
  const { data, error } = await sb().from('main_page_sections').insert(payload).select().single()
  if (error) return NextResponse.json({ ok:false, error: error.message }, { status: 400 })
  return NextResponse.json({ ok:true, data })
})