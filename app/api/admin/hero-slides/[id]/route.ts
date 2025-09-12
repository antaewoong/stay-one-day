import { NextResponse, NextRequest } from 'next/server'
import { withAdminAuth } from '@/middleware/withAdminAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export const GET = withAdminAuth(async (req, supabase, { userId, admin }) => {
  const { pathname } = new URL(req.url)
  const id = pathname.split('/').pop()
  
  if (!id) {
    return NextResponse.json({ ok: false, error: 'ID가 필요합니다.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('hero_slides')
    .select('id,image_url,headline,subheadline,cta_text,cta_link,is_active,sort_order,created_at')
    .eq('id', id)
    .single()
    
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, userId, admin, data })
})

export const PUT = withAdminAuth(async (req, supabase, { userId, admin }) => {
  const { pathname } = new URL(req.url)
  const id = pathname.split('/').pop()
  
  if (!id) {
    return NextResponse.json({ ok: false, error: 'ID가 필요합니다.' }, { status: 400 })
  }

  const body = await req.json()
  const payload = {
    image_url: body.image_url?.trim(),
    headline: body.headline?.trim() ?? '',
    subheadline: body.subheadline?.trim() ?? '',
    cta_text: body.cta_text?.trim() ?? '',
    cta_link: body.cta_link?.trim() ?? '',
    is_active: !!body.is_active,
    sort_order: Number(body.sort_order ?? 0),
  }

  const { data, error } = await supabase
    .from('hero_slides')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
    
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, data })
})

export const DELETE = withAdminAuth(async (req, supabase, { userId, admin }) => {
  const { pathname } = new URL(req.url)
  const id = pathname.split('/').pop()
  
  if (!id) {
    return NextResponse.json({ ok: false, error: 'ID가 필요합니다.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('hero_slides')
    .delete()
    .eq('id', id)
    
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
})