import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/middleware/withAdminAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export const GET = withAdminAuth(async (_req, supabase, { userId, admin }) => {
  const { data, error } = await supabase
    .from('hero_slides')
    .select('id,image_url,title,subtitle,cta_text,active,slide_order,created_at')
    .order('slide_order', { ascending: true })
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  
  // Map to expected field names for frontend
  const mappedData = data?.map(item => ({
    ...item,
    headline: item.title,
    subheadline: item.subtitle,
    is_active: item.active,
    sort_order: item.slide_order,
    cta_link: '/booking' // default value if missing
  }))
  
  return NextResponse.json({ ok: true, userId, admin, data: mappedData })
})

export const POST = withAdminAuth(async (req, supabase, { userId, admin }) => {
  const body = await req.json()

  // Validate required fields
  if (!body.image_url?.trim()) {
    return NextResponse.json({ ok: false, error: '이미지 URL은 필수입니다.' }, { status: 400 })
  }

  if (!body.headline?.trim()) {
    return NextResponse.json({ ok: false, error: '제목은 필수입니다.' }, { status: 400 })
  }

  const payload = {
    image_url: body.image_url.trim(),
    title: body.headline.trim(),
    subtitle: body.subheadline?.trim() ?? '',
    cta_text: body.cta_text?.trim() ?? '',
    active: !!body.is_active,
    slide_order: Number(body.sort_order ?? 0),
  }
  const { data, error } = await supabase.from('hero_slides').insert(payload).select().single()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  
  // Map back to expected field names
  const mappedData = data ? {
    ...data,
    headline: data.title,
    subheadline: data.subtitle,
    is_active: data.active,
    sort_order: data.slide_order,
    cta_link: '/booking'
  } : null
  
  return NextResponse.json({ ok: true, data: mappedData })
})