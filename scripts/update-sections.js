const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fcmauibvdqbocwhloqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjbWF1aWJ2ZHFib2N3aGxvcW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTQ3NTgwNywiZXhwIjoyMDQxMDUxODA3fQ.fAqpWr42JyfTJH-kjDf5vVzHRHmPB7YB3b-QZCsHyKQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateSections() {
  console.log('섹션 업데이트 시작...')

  try {
    // 1. 독채형 → 독채
    await supabase
      .from('main_page_sections')
      .update({ title: '🏡 독채' })
      .eq('section_id', 'private')
    console.log('독채 섹션 제목 업데이트 완료')

    // 2. 키즈친화 → 키즈, category_filter 수정
    await supabase
      .from('main_page_sections')
      .update({ 
        title: '👶 키즈',
        category_filter: '키즈'
      })
      .eq('section_id', 'kids')
    console.log('키즈 섹션 제목 및 카테고리 필터 업데이트 완료')

    // 3. 파티전용 → 파티  
    await supabase
      .from('main_page_sections')
      .update({ title: '🎉 파티' })
      .eq('section_id', 'party')
    console.log('파티 섹션 제목 업데이트 완료')

    // 4. 신규스테이 → 신규
    await supabase
      .from('main_page_sections')
      .update({ title: '✨ 신규' })
      .eq('section_id', 'new')
    console.log('신규 섹션 제목 업데이트 완료')

    console.log('모든 섹션 업데이트 완료!')

    // 업데이트 결과 확인
    const { data } = await supabase
      .from('main_page_sections')
      .select('section_id, title, category_filter, auto_fill_by_category')
      .order('created_at')
    
    console.log('\n업데이트된 섹션들:')
    data.forEach(section => {
      console.log(`- ${section.section_id}: ${section.title}`)
      if (section.auto_fill_by_category) {
        console.log(`  카테고리 필터: ${section.category_filter}`)
      }
    })

  } catch (error) {
    console.error('섹션 업데이트 실패:', error)
  }
}

updateSections()