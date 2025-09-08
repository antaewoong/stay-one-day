#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fcmauibvdqbocwhloqov.supabase.co'
const supabaseKey = '[REMOVED_SUPABASE_SERVICE_KEY]'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixNoticesTable() {
  try {
    console.log('🔧 Fixing notices table structure...\n')
    
    // 1. admin_settings 테이블 생성 먼저 시도
    console.log('1. Creating admin_settings table...')
    
    // 2. notices 테이블에 샘플 데이터 추가 (기존 컬럼으로)
    console.log('2. Adding sample notices data...')
    
    // 먼저 기존 notices 테이블 구조 확인
    const { data: existingNotices, error: checkError } = await supabase
      .from('notices')
      .select('*')
      .limit(1)
    
    if (checkError && checkError.code === 'PGRST116') {
      console.log('   ❌ Notices table does not exist')
      return
    }
    
    console.log('   ✅ Notices table exists')
    
    // 기본적인 notices 데이터 추가 (기존 스키마에 맞춰서)
    const sampleNotices = [
      {
        title: '시설가격 모니터링 팀장 요청',
        content: '시설 가격 모니터링 관련 업무 조율이 필요합니다. 각 숙소별 가격 변동 사항을 점검해 주시기 바랍니다.',
        author: '구공-박소정', // author_name 대신 author 사용
        views: 10,
        is_published: true
      },
      {
        title: '[공지] 대기업 대상 10% 할인율로 홍보준비',
        content: '대기업 고객 대상 특별 할인 프로모션을 준비 중입니다. 관련 숙소 등록 및 준비사항을 확인해 주세요.',
        author: '구공-관리자',
        views: 17,
        is_published: true
      },
      {
        title: '[공지] 월 정기 점검 안내',
        content: '매월 정기 시스템 점검이 예정되어 있습니다. 점검 시간 동안 서비스 이용에 제한이 있을 수 있습니다.',
        author: '구공-관리자',
        views: 14,
        is_published: true
      },
      {
        title: '[시스템] 새로운 예약 관리 기능 업데이트',
        content: '예약 관리 시스템에 새로운 기능이 추가되었습니다. 대시보드에서 확인해 보세요.',
        author: '구공-관리자',
        views: 8,
        is_published: true
      }
    ]
    
    // 먼저 하나씩 테스트해서 어떤 컬럼이 있는지 확인
    try {
      const testNotice = {
        title: 'Test Notice',
        content: 'Test content'
      }
      
      const { data, error } = await supabase
        .from('notices')
        .insert([testNotice])
        .select()
      
      if (error) {
        console.log('   ⚠️  Basic insert error:', error.message)
        
        // 다른 컬럼명들 시도
        const testNotice2 = {
          title: 'Test Notice 2'
        }
        
        const { data: data2, error: error2 } = await supabase
          .from('notices')
          .insert([testNotice2])
          .select()
        
        if (error2) {
          console.log('   ⚠️  Title only insert error:', error2.message)
        } else {
          console.log('   ✅ Title only insert successful:', data2)
          // 테스트 데이터 삭제
          await supabase.from('notices').delete().eq('title', 'Test Notice 2')
        }
      } else {
        console.log('   ✅ Basic insert successful:', data)
        // 테스트 데이터 삭제
        await supabase.from('notices').delete().eq('title', 'Test Notice')
      }
    } catch (testError) {
      console.log('   ❌ Test insert failed:', testError.message)
    }
    
    console.log('\n✅ Table structure check completed!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

fixNoticesTable()