import { NextRequest } from 'next/server'
import { adminRoute, sb, ok, bad } from '../_kit'

export const dynamic = 'force-dynamic'

export const GET = adminRoute(async () => {
  const { data, error } = await sb().from('hero_texts').select('*').order('display_order', { ascending: true })
  if (error) return bad(error)
  return ok(data)
})

export const POST = adminRoute(async (req: NextRequest) => {
  const body = await req.json()
  const { english_phrase, main_text, sub_text, display_order, is_active } = body

  if (!main_text) return bad('메인 텍스트는 필수입니다', 400)

  const { data, error } = await sb().from('hero_texts').insert({
    english_phrase: english_phrase || '',
    main_text,
    sub_text: sub_text || '',
    display_order: display_order || 0,
    is_active: is_active !== undefined ? is_active : true
  }).select().single()

  if (error) return bad(error)
  return ok(data)
})

export const PUT = adminRoute(async (req: NextRequest) => {
  const body = await req.json()
  const { id, english_phrase, main_text, sub_text, display_order, is_active } = body

  if (!id || !main_text) return bad('ID와 메인 텍스트는 필수입니다', 400)

  const { data, error } = await sb().from('hero_texts').update({
    english_phrase: english_phrase || '',
    main_text,
    sub_text: sub_text || '',
    display_order: display_order || 0,
    is_active: is_active !== undefined ? is_active : true,
    updated_at: new Date().toISOString()
  }).eq('id', id).select().single()

  if (error) return bad(error)
  return ok(data)
})

export const DELETE = adminRoute(async (req: NextRequest) => {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return bad('id required', 400)
  const { error } = await sb().from('hero_texts').delete().eq('id', id)
  if (error) return bad(error)
  return ok(true)
})