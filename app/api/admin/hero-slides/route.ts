import { NextRequest } from 'next/server'
import { adminRoute, sb, ok, bad } from '../_kit'

export const dynamic = 'force-dynamic'

export const GET = adminRoute(async () => {
  const { data, error } = await sb().from('hero_slides').select('*').order('slide_order', { ascending: true })
  if (error) return bad(error)
  return ok(data)
})

export const POST = adminRoute(async (req: NextRequest) => {
  const slides = await req.json()
  
  // 기존 슬라이드 모두 삭제 후 새로 삽입
  const { error: deleteError } = await sb().from('hero_slides').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (deleteError) return bad(deleteError)
  
  const { data, error } = await sb().from('hero_slides').insert(slides).select()
  if (error) return bad(error)
  return ok(data)
})

export const DELETE = adminRoute(async (req: NextRequest) => {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return bad('id required', 400)
  const { error } = await sb().from('hero_slides').delete().eq('id', id)
  if (error) return bad(error)
  return ok(true)
})