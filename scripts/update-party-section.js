const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fcmauibvdqbocwhloqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjbWF1aWJ2ZHFib2N3aGxvcW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTQ3NTgwNywiZXhwIjoyMDQxMDUxODA3fQ.fAqpWr42JyfTJH-kjDf5vVzHRHmPB7YB3b-QZCsHyKQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function updatePartySection() {
  console.log('파티 섹션 업데이트 시작...')

  try {
    // 파티 섹션을 자동 필터링으로 변경
    const { data, error } = await supabase
      .from('main_page_sections')
      .update({ 
        auto_fill_by_category: true,
        category_filter: '파티',
        accommodation_ids: []  // 자동 필터링으로 변경하므로 수동 ID 목록 비우기
      })
      .eq('section_id', 'party')
      .select()
    
    if (error) throw error
    
    console.log('파티 섹션 업데이트 완료:', data)

    console.log('파티 섹션이 자동 필터링으로 설정되었습니다.')
    console.log('이제 숙소 유형에 "파티"를 선택한 숙소들이 자동으로 파티 섹션에 표시됩니다.')

  } catch (error) {
    console.error('파티 섹션 업데이트 실패:', error)
  }
}

updatePartySection()