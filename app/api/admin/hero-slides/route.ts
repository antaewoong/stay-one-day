import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/middleware/withAdminAuth'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

  // POST는 단일 슬라이드 생성만 처리 (image_url 필수)
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

export const PUT = withAdminAuth(async (req, supabase, { userId, admin }) => {
  const body = await req.json()

  // PUT은 배열로 받아서 기존 슬라이드들의 텍스트/순서만 일괄 업데이트 (image_url 불필요)
  if (!Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: '배열 형태의 데이터가 필요합니다.' }, { status: 400 })
  }

  console.log('🔥 PUT 방식 히어로 슬라이드 일괄 업데이트:', body.length, '개')

  // Service Role로 RLS 우회하여 기존 슬라이드 모두 삭제
  await supabaseAdmin.from('hero_slides').delete().neq('id', '')

  // 새 슬라이드들 삽입 (image_url 허용, 빈 값도 허용)
  const slidesToInsert = body.map((slide, index) => ({
    image_url: slide.image_url || slide.image || '', // 빈 값 허용
    title: slide.title || slide.headline || '',
    subtitle: slide.subtitle || slide.subheadline || '',
    cta_text: slide.cta_text || slide.cta || '',
    active: !!slide.active,
    slide_order: slide.slide_order ?? index,
  }))

  if (slidesToInsert.length > 0) {
    const { data, error } = await supabaseAdmin.from('hero_slides').insert(slidesToInsert).select()
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })

    // Map to expected field names
    const mappedData = data?.map(item => ({
      ...item,
      headline: item.title,
      subheadline: item.subtitle,
      is_active: item.active,
      sort_order: item.slide_order,
      cta_link: '/booking'
    }))

    return NextResponse.json({ ok: true, data: mappedData })
  }

  return NextResponse.json({ ok: true, data: [] })
})