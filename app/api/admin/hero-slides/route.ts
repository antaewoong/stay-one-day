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
    cta_link: '/booking'
  }))

  return NextResponse.json({ ok: true, userId, admin, data: mappedData })
})

export const POST = withAdminAuth(async (req, supabase, { userId, admin }) => {
  // POST는 실수로 중복 생성하는 것을 방지하기 위해 완전 차단
  return NextResponse.json({
    ok: false,
    error: 'POST 메서드는 차단되었습니다. PUT 메서드를 사용하여 전체 슬라이드를 업데이트하세요.'
  }, { status: 405 })
})

// 멱등성이 보장되는 안전한 PUT 메서드: 전체 교체 방식
export const PUT = withAdminAuth(async (req, supabase, { userId, admin }) => {
  const body = await req.json()

  console.log('🔄 PUT: 히어로 슬라이드 전체 교체 시작')

  // 배열 검증
  if (!Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: '배열 형태의 데이터가 필요합니다.' }, { status: 400 })
  }

  try {
    // 1단계: 기존 모든 슬라이드 삭제 (Service Role 사용)
    await supabaseAdmin.from('hero_slides').delete().gte('id', '00000000-0000-0000-0000-000000000000')

    // 2단계: 새 슬라이드 일괄 삽입 (빈 값 허용하지 않음)
    if (body.length > 0) {
      const slidesToInsert = body.map((slide, index) => {
        // 필수 검증: image_url이 비어있으면 에러
        const imageUrl = slide.image_url || slide.image || ''
        if (!imageUrl.trim()) {
          throw new Error(`슬라이드 ${index + 1}번: 이미지 URL이 필수입니다.`)
        }

        return {
          image_url: imageUrl.trim(),
          title: slide.title || slide.headline || '',
          subtitle: slide.subtitle || slide.subheadline || '',
          cta_text: slide.cta_text || slide.cta || '',
          active: !!slide.active,
          slide_order: slide.slide_order ?? index,
        }
      })

      const { data, error } = await supabaseAdmin
        .from('hero_slides')
        .insert(slidesToInsert)
        .select()

      if (error) {
        console.error('삽입 실패:', error.message)
        return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
      }

      console.log(`✅ ${data.length}개 슬라이드 교체 완료`)

      // 프론트엔드 형식으로 매핑
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

    console.log('✅ 모든 슬라이드 삭제 완료 (빈 배열)')
    return NextResponse.json({ ok: true, data: [] })

  } catch (error) {
    console.error('PUT 실패:', error)
    return NextResponse.json({
      ok: false,
      error: error.message || '슬라이드 업데이트에 실패했습니다.'
    }, { status: 400 })
  }
})