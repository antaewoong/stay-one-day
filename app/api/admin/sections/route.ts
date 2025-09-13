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
    .order('section_id', { ascending: true })
  
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  
  return NextResponse.json({ ok: true, userId, admin, data })
})

export const PUT = withAdminAuth(async (req, supabase, { userId, admin }) => {
  const sections = await req.json()
  
  // 각 섹션을 개별적으로 업데이트
  for (const section of sections) {
    const { error } = await supabase
      .from('main_page_sections')
      .update({
        title: section.title,
        subtitle: section.subtitle,
        accommodation_ids: section.accommodationIds,
        max_items: section.maxItems,
        active: section.active,
        auto_fill_by_category: section.autoFillByCategory,
        category_filter: section.categoryFilter,
        updated_at: new Date().toISOString()
      })
      .eq('section_id', section.id)
    
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }
  }
  
  return NextResponse.json({ ok: true, message: '섹션이 성공적으로 업데이트되었습니다.' })
})