#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fcmauibvdqbocwhloqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjbWF1aWJ2ZHFib2N3aGxvcW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjgwODY3OCwiZXhwIjoyMDcyMzg0Njc4fQ.vwEr3cyiQSWBabAgoodWUzBSewrVTco3kFg_w-ae1D0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  try {
    console.log('현재 accommodations 테이블 데이터 확인...')
    
    const { data, error } = await supabase
      .from('accommodations')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('테이블 조회 오류:', error.message)
    } else {
      if (data && data.length > 0) {
        console.log('기존 데이터 컬럼:', Object.keys(data[0]))
        console.log('첫 번째 레코드:', data[0])
      } else {
        console.log('테이블이 비어있습니다.')
      }
    }
    
    // 테이블 삭제하고 새로 생성해보자
    console.log('\n테이블 구조 정보 확인 시도...')
    
    const { data: tableInfo, error: infoError } = await supabase
      .rpc('get_table_info', { table_name: 'accommodations' })
    
    if (infoError) {
      console.log('테이블 정보 조회 실패:', infoError.message)
    } else {
      console.log('테이블 정보:', tableInfo)
    }
    
  } catch (error) {
    console.error('스키마 확인 실패:', error.message)
  }
}

checkSchema()