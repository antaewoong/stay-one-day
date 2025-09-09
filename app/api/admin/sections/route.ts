import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('main_page_sections')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // 간단한 관리자 인증 (원래 로직 대신)
  const supabase = createClient()

  try {
    const sections = await request.json()
    console.log('받은 섹션 데이터:', sections)

    // 배열인지 확인하여 처리
    if (Array.isArray(sections)) {
      // 다중 섹션 업데이트
      const updatePromises = sections.map(section => 
        supabase
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
      )

      const results = await Promise.all(updatePromises)
      const errors = results.filter(result => result.error)
      
      console.log('업데이트 결과:', results.map(r => ({ error: r.error, status: r.status })))
      
      if (errors.length > 0) {
        console.error('업데이트 오류:', errors)
        throw new Error(`Failed to update ${errors.length} sections`)
      }

      return NextResponse.json({ message: 'All sections updated successfully' })
    } else {
      // 단일 섹션 업데이트 (기존 로직)
      const { sectionId, ...updateData } = sections

      const { data, error } = await supabase
        .from('main_page_sections')
        .update(updateData)
        .eq('section_id', sectionId)

      if (error) throw error
      return NextResponse.json({ data })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update section' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  // 관리자 인증 확인
  const authResult = await validateAdminAuth(request)
  if (!authResult.isValid) {
    return authResult.error!
  }

  try {
    const sections = await request.json()
    console.log('받은 섹션 데이터:', sections)

    // 배열인지 확인하여 처리
    if (Array.isArray(sections)) {
      // 다중 섹션 업데이트
      const updatePromises = sections.map(section => 
        supabase
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
      )

      const results = await Promise.all(updatePromises)
      const errors = results.filter(result => result.error)
      
      console.log('업데이트 결과:', results.map(r => ({ error: r.error, status: r.status })))
      
      if (errors.length > 0) {
        console.error('업데이트 오류:', errors)
        throw new Error(`Failed to update ${errors.length} sections`)
      }

      return NextResponse.json({ message: 'All sections updated successfully' })
    } else {
      // 단일 섹션 업데이트 (기존 로직)
      const { sectionId, ...updateData } = sections

      const { data, error } = await supabase
        .from('main_page_sections')
        .update(updateData)
        .eq('section_id', sectionId)

      if (error) throw error
      return NextResponse.json({ data })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update section' }, { status: 500 })
  }
}