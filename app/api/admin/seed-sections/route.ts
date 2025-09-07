import { NextRequest, NextResponse } from 'next/server'
import { validateAdminAuth, supabaseService } from '@/lib/auth/admin-service'

// 새로운 섹션들의 기본 데이터
const newSections = [
  {
    section_id: 'kids',
    name: '키즈친화',
    title: '키즈친화',
    subtitle: '아이들과 함께하는 안전하고 즐거운 공간',
    accommodation_ids: [],
    max_items: 6,
    active: true,
    auto_fill_by_category: true,
    category_filter: '키즈 전용'
  },
  {
    section_id: 'party',
    name: '파티전용',
    title: '파티전용',
    subtitle: '특별한 모임과 파티를 위한 완벽한 공간',
    accommodation_ids: [],
    max_items: 6,
    active: true,
    auto_fill_by_category: false,
    category_filter: null
  },
  {
    section_id: 'new',
    name: '신규 스테이',
    title: '신규 스테이',
    subtitle: '새롭게 추가된 특별한 공간들',
    accommodation_ids: [],
    max_items: 6,
    active: true,
    auto_fill_by_category: false,
    category_filter: null
  }
]

export async function POST(request: NextRequest) {
  // 관리자 인증 확인
  const authResult = await validateAdminAuth(request)
  if (!authResult.isValid) {
    return authResult.error!
  }

  try {
    console.log('새로운 섹션 추가 시작...')

    // 기존 섹션들이 있는지 확인
    const { data: existingSections, error: checkError } = await supabaseService
      .from('main_page_sections')
      .select('section_id')
      .in('section_id', ['kids', 'party', 'new'])

    if (checkError) {
      console.error('기존 섹션 확인 오류:', checkError)
      throw new Error('Failed to check existing sections')
    }

    console.log('기존 섹션:', existingSections)

    // 아직 없는 섹션들만 필터링
    const existingSectionIds = existingSections?.map(s => s.section_id) || []
    const sectionsToAdd = newSections.filter(section => !existingSectionIds.includes(section.section_id))

    console.log('추가할 섹션들:', sectionsToAdd.map(s => s.section_id))

    if (sectionsToAdd.length === 0) {
      return NextResponse.json({ 
        message: 'All sections already exist',
        existingSections: existingSectionIds
      })
    }

    // 새 섹션들 추가
    const { data: insertedSections, error: insertError } = await supabaseService
      .from('main_page_sections')
      .insert(sectionsToAdd)
      .select()

    if (insertError) {
      console.error('섹션 추가 오류:', insertError)
      throw new Error('Failed to insert new sections')
    }

    console.log('섹션 추가 성공:', insertedSections)

    return NextResponse.json({
      message: `Successfully added ${sectionsToAdd.length} new sections`,
      addedSections: sectionsToAdd.map(s => s.section_id),
      data: insertedSections
    })

  } catch (error) {
    console.error('새 섹션 추가 실패:', error)
    return NextResponse.json({ 
      error: 'Failed to add new sections',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}