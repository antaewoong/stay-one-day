#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fcmauibvdqbocwhloqov.supabase.co'
const supabaseKey = '[REMOVED_SUPABASE_SERVICE_KEY]'

const supabase = createClient(supabaseUrl, supabaseKey)

async function getReviewsSample() {
  try {
    console.log('📋 Getting reviews table sample data...\n')
    
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .limit(1)
    
    if (reviewsError) {
      console.error('❌ Error:', reviewsError.message)
    } else {
      if (reviewsData && reviewsData.length > 0) {
        console.log('📊 Reviews table structure:')
        const sample = reviewsData[0]
        Object.entries(sample).forEach(([key, value]) => {
          console.log(`   ${key}: ${value} (${typeof value})`)
        })
      } else {
        console.log('📊 Reviews table exists but is empty')
        
        // 빈 테이블에 테스트 데이터 하나 추가해서 스키마 확인
        try {
          const { data: testData, error: testError } = await supabase
            .from('reviews')
            .insert([{
              user_name: 'Test User',
              rating: 5,
              comment: 'Test comment'
            }])
            .select()
            
          if (testError) {
            console.log('테스트 데이터 추가 실패:', testError.message)
            console.log('필요한 컬럼들을 확인해보겠습니다...')
          } else {
            console.log('✅ 테스트 데이터 추가 성공')
            
            // 테스트 데이터 조회
            const { data: newData } = await supabase
              .from('reviews')
              .select('*')
              .limit(1)
              
            if (newData && newData.length > 0) {
              console.log('📊 Reviews table structure (after test insert):')
              Object.entries(newData[0]).forEach(([key, value]) => {
                console.log(`   ${key}: ${value} (${typeof value})`)
              })
              
              // 테스트 데이터 삭제
              await supabase
                .from('reviews')
                .delete()
                .eq('user_name', 'Test User')
              
              console.log('🗑️ 테스트 데이터 삭제 완료')
            }
          }
        } catch (error) {
          console.error('테스트 중 오류:', error.message)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

getReviewsSample()