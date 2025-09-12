import { NextRequest } from 'next/server'
import { adminRoute, sb, ok, bad } from '../_kit'

export const dynamic = 'force-dynamic'

export const GET = adminRoute(async () => {
  const { data, error } = await sb().from('main_page_sections').select('*').order('created_at', { ascending: true })
  if (error) return bad(error)
  return ok(data)
})

export const POST = adminRoute(async (req: NextRequest) => {
  const sections = await req.json()
  
  if (Array.isArray(sections)) {
    // 다중 섹션 업데이트
    const updatePromises = sections.map(section => 
      sb().from('main_page_sections').update({
        title: section.title,
        subtitle: section.subtitle,
        accommodation_ids: section.accommodationIds,
        max_items: section.maxItems,
        active: section.active,
        auto_fill_by_category: section.autoFillByCategory,
        category_filter: section.categoryFilter,
        updated_at: new Date().toISOString()
      }).eq('section_id', section.id)
    )

    const results = await Promise.all(updatePromises)
    const errors = results.filter(result => result.error)
    
    if (errors.length > 0) {
      return bad(`Failed to update ${errors.length} sections`)
    }

    return ok({ message: 'All sections updated successfully' })
  } else {
    // 단일 섹션 생성/업데이트
    const { data, error } = await sb().from('main_page_sections').insert(sections).select().single()
    if (error) return bad(error)
    return ok(data)
  }
})

export const PUT = adminRoute(async (req: NextRequest) => {
  const sections = await req.json()
  
  if (Array.isArray(sections)) {
    // 다중 섹션 업데이트
    const updatePromises = sections.map(section => 
      sb().from('main_page_sections').update({
        title: section.title,
        subtitle: section.subtitle,
        accommodation_ids: section.accommodationIds,
        max_items: section.maxItems,
        active: section.active,
        auto_fill_by_category: section.autoFillByCategory,
        category_filter: section.categoryFilter,
        updated_at: new Date().toISOString()
      }).eq('section_id', section.id)
    )

    const results = await Promise.all(updatePromises)
    const errors = results.filter(result => result.error)
    
    if (errors.length > 0) {
      return bad(`Failed to update ${errors.length} sections`)
    }

    return ok({ message: 'All sections updated successfully' })
  } else {
    // 단일 섹션 업데이트
    const { sectionId, ...updateData } = sections
    const { data, error } = await sb().from('main_page_sections').update(updateData).eq('section_id', sectionId).select().single()
    if (error) return bad(error)
    return ok(data)
  }
})

export const DELETE = adminRoute(async (req: NextRequest) => {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return bad('id required', 400)
  const { error } = await sb().from('main_page_sections').delete().eq('section_id', id)
  if (error) return bad(error)
  return ok(true)
})