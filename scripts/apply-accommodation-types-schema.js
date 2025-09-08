const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = 'https://fcmauibvdqbocwhloqov.supabase.co'
const supabaseKey = '[REMOVED_SUPABASE_SERVICE_KEY]'

const supabase = createClient(supabaseUrl, supabaseKey)

async function applySchema() {
  try {
    console.log('스키마 변경을 시작합니다...')
    
    // SQL 파일 읽기
    const sqlContent = fs.readFileSync('./add-accommodation-types-array.sql', 'utf8')
    
    // SQL 실행 (Supabase에서는 rpc를 통해 실행)
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent })
    
    if (error) {
      console.error('스키마 변경 실패:', error)
      return
    }
    
    console.log('스키마 변경 완료!')
    
    // 변경 확인
    const { data: accommodations, error: selectError } = await supabase
      .from('accommodations')
      .select('id, name, accommodation_type, accommodation_types')
      .limit(5)
    
    if (selectError) {
      console.error('데이터 조회 실패:', selectError)
    } else {
      console.log('변경된 데이터 확인:')
      console.table(accommodations)
    }
    
  } catch (error) {
    console.error('스크립트 실행 실패:', error)
  }
}

applySchema()