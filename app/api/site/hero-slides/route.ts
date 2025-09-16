import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const dynamic = 'force-dynamic'
export const revalidate = 10

export async function GET() {
  // ENV 가드: 없으면 500 대신 친절 메시지
  if (!url || !anonKey) {
    console.error('[site/hero-slides] Missing env: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return NextResponse.json(
      { ok: false, error: 'Missing Supabase env. Check NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY' },
      { status: 500 }
    )
  }

  try {
    const supabase = createClient(url, anonKey)
    const { data, error } = await supabase
      .from('hero_slides')
      .select('id,image_url,title,subtitle,description,cta_text,active,slide_order,created_at,public_url,inline_data_uri,width,height,file_hash,published_at')
      .eq('active', true)
      .order('slide_order', { ascending: true })

    if (error) {
      console.error('[site/hero-slides] Supabase error:', error.message)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    const mapped = (data ?? []).map(x => ({
      id: x.id,
      // 출판 파이프라인: public_url 우선, 없으면 기존 image_url 정리
      image_url: x.public_url || x.image_url?.replace(/\n/g, '').replace(/\s+/g, ''),
      public_url: x.public_url,
      inline_data_uri: x.inline_data_uri,
      width: x.width || 2560,
      height: x.height || 1440,
      file_hash: x.file_hash,
      published_at: x.published_at,
      title: x.title,
      subtitle: x.subtitle,
      description: x.description,
      headline: x.title,
      subheadline: x.subtitle,
      cta_text: x.cta_text ?? '지금 예약하기',
      cta_link: '/booking',
      active: x.active,
      sort_order: x.slide_order,
      slide_order: x.slide_order,
      created_at: x.created_at,
    }))

    return NextResponse.json({ ok: true, data: mapped }, { status: 200 })
  } catch (e: any) {
    console.error('[site/hero-slides] Handler error:', e?.message || e)
    return NextResponse.json({ ok: false, error: e?.message || 'Unknown error' }, { status: 500 })
  }
}