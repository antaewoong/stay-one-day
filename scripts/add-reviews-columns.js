#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fcmauibvdqbocwhloqov.supabase.co'
const supabaseKey = '[REMOVED_SUPABASE_SERVICE_KEY]'

const supabase = createClient(supabaseUrl, supabaseKey)

async function addReviewsColumns() {
  try {
    console.log('🛠️ Adding columns to reviews table...\n')
    
    // 먼저 현재 테이블 구조 확인
    console.log('🔍 Checking current table structure...')
    
    // 컬럼들을 하나씩 추가
    const columns = [
      { name: 'user_name', type: 'TEXT' },
      { name: 'accommodation_id', type: 'UUID' },
      { name: 'rating', type: 'INTEGER' },
      { name: 'content', type: 'TEXT' },
      { name: 'user_email', type: 'TEXT' },
      { name: 'is_verified', type: 'BOOLEAN DEFAULT false' },
      { name: 'host_response', type: 'TEXT' },
      { name: 'host_response_date', type: 'TIMESTAMPTZ' },
      { name: 'helpful_count', type: 'INTEGER DEFAULT 0' },
      { name: 'is_visible', type: 'BOOLEAN DEFAULT true' }
    ]
    
    // 컬럼이 존재하는지 확인하고 없으면 추가
    for (const column of columns) {
      console.log(`📝 Checking column: ${column.name}`)
      
      try {
        // 테스트 쿼리로 컬럼 존재 확인
        const { error: testError } = await supabase
          .from('reviews')
          .select(`${column.name}`)
          .limit(1)
        
        if (testError && testError.message.includes('does not exist')) {
          console.log(`  ➕ Adding column: ${column.name}`)
          
          // 컬럼 추가는 Supabase Dashboard에서 수행해야 함
          console.log(`  ⚠️  Column ${column.name} needs to be added manually in Supabase Dashboard`)
          console.log(`     SQL: ALTER TABLE reviews ADD COLUMN ${column.name} ${column.type};`)
        } else if (testError) {
          console.log(`  ❌ Error checking ${column.name}:`, testError.message)
        } else {
          console.log(`  ✅ Column ${column.name} exists`)
        }
      } catch (error) {
        console.log(`  ❌ Error with ${column.name}:`, error.message)
      }
    }
    
    console.log('\n🎯 Manual SQL commands to run in Supabase Dashboard:')
    console.log('=' .repeat(60))
    
    for (const column of columns) {
      console.log(`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};`)
    }
    
    console.log('=' .repeat(60))
    console.log('\n⚡ After adding columns manually, run: node scripts/populate-simple-reviews.js')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

addReviewsColumns()