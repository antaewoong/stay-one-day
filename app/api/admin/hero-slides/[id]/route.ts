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
    .select('id,image_url,title,subtitle,cta_text,active,slide_order,created_at')
    .eq('id', id)
    .single()
    
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  
  // Map to expected field names
  const mappedData = data ? {
    ...data,
    headline: data.title,
    subheadline: data.subtitle,
    is_active: data.active,
    sort_order: data.slide_order,
    cta_link: '/booking'
  } : null
  
  return NextResponse.json({ ok: true, userId, admin, data: mappedData })
})

export const PUT = withAdminAuth(async (req, supabase, { userId, admin }) => {
  const { pathname } = new URL(req.url)
  const id = pathname.split('/').pop()

  console.log('🔥 PUT 히어로 슬라이드 수정 시작 - ID:', id)

  if (!id) {
    return NextResponse.json({ ok: false, error: 'ID가 필요합니다.' }, { status: 400 })
  }

  const body = await req.json()
  console.log('🔥 받은 데이터:', JSON.stringify(body, null, 2))

  // 업데이트할 필드만 포함 (빈 값은 제외)
  const payload: any = {}

  if (body.image_url?.trim()) {
    payload.image_url = body.image_url.trim()
  }

  if (body.headline?.trim()) {
    payload.title = body.headline.trim()
  }

  if (body.subheadline !== undefined) {
    payload.subtitle = body.subheadline?.trim() ?? ''
  }

  if (body.cta_text !== undefined) {
    payload.cta_text = body.cta_text?.trim() ?? ''
  }

  if (body.is_active !== undefined) {
    payload.active = !!body.is_active
  }

  if (body.sort_order !== undefined) {
    payload.slide_order = Number(body.sort_order ?? 0)
  }

  // 업데이트할 내용이 없으면 에러
  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ ok: false, error: '수정할 내용이 없습니다.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('hero_slides')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
    
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