import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/middleware/withAdminAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export const GET = withAdminAuth(async (_req, supabase, { userId, admin }) => {
  const { data, error } = await supabase
    .from('main_page_sections')
    .select('*')
    .order('position', { ascending: true })
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, userId, admin, data })
})

export const POST = withAdminAuth(async (req, supabase, { userId, admin }) => {
  const body = await req.json()
  const payload = {
    title: body.title?.trim(),
    slug: body.slug?.trim(),
    position: Number(body.position ?? 0),
    is_active: !!body.is_active,
  }
  const { data, error } = await supabase.from('main_page_sections').insert(payload).select().single()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, data })
})