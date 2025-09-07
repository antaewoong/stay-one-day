const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateKidsSectionFilter() {
  try {
    console.log('키즈 섹션의 category_filter를 "키즈"로 업데이트 중...')
    
    const { data, error } = await supabase
      .from('sections')
      .update({ 
        auto_fill_by_category: false,
        category_filter: null
      })
      .eq('section_id', 'kids')
      .select()
    
    if (error) {
      console.error('업데이트 실패:', error)
      return
    }
    
    console.log('키즈 섹션 업데이트 완료:', data)
    
  } catch (error) {
    console.error('오류 발생:', error)
  }
}

updateKidsSectionFilter()