#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fcmauibvdqbocwhloqov.supabase.co'
const supabaseKey = '[REMOVED_SUPABASE_SERVICE_KEY]'

const supabase = createClient(supabaseUrl, supabaseKey)

async function populateNoticesFixed() {
  try {
    console.log('📝 Populating notices table with valid data...\n')
    
    // 실제 공지사항 데이터 (올바른 제약조건으로)
    const notices = [
      {
        title: '시설가격 모니터링 팀장 요청',
        content: '시설 가격 모니터링 관련 업무 조율이 필요합니다. 각 숙소별 가격 변동 사항을 점검해 주시기 바랍니다.',
        notice_type: 'general', // ✅ 허용값
        target_audience: 'users', // ✅ 허용값 (호스트들 의미)
        is_pinned: false,
        is_popup: false,
        status: 'published',
        view_count: 10
      },
      {
        title: '[공지] 대기업 대상 10% 할인율로 홍보준비',
        content: '대기업 고객 대상 특별 할인 프로모션을 준비 중입니다. 관련 숙소 등록 및 준비사항을 확인해 주세요.',
        notice_type: 'urgent', // ✅ 허용값
        target_audience: 'all', // ✅ 허용값
        is_pinned: true,
        is_popup: true,
        status: 'published',
        view_count: 17
      },
      {
        title: '[공지] 월 정기 점검 안내',
        content: '매월 정기 시스템 점검이 예정되어 있습니다. 점검 시간 동안 서비스 이용에 제한이 있을 수 있습니다.',
        notice_type: 'maintenance', // ✅ 허용값
        target_audience: 'all', // ✅ 허용값
        is_pinned: true,
        is_popup: false,
        status: 'published',
        view_count: 14
      },
      {
        title: '[시스템] 새로운 예약 관리 기능 업데이트',
        content: '예약 관리 시스템에 새로운 기능이 추가되었습니다. 대시보드에서 확인해 보세요.',
        notice_type: 'update', // ✅ 허용값
        target_audience: 'users', // ✅ 허용값
        is_pinned: false,
        is_popup: false,
        status: 'published',
        view_count: 8
      },
      {
        title: '고객 문의 응답 가이드라인 변경',
        content: '고객 문의 응답 시 새로운 가이드라인이 적용됩니다. 첨부된 매뉴얼을 참고해 주세요.',
        notice_type: 'general', // ✅ 허용값
        target_audience: 'users', // ✅ 허용값
        is_pinned: false,
        is_popup: false,
        status: 'published',
        view_count: 12
      }
    ]
    
    console.log(`Inserting ${notices.length} notices...`)
    
    const { data, error } = await supabase
      .from('notices')
      .insert(notices)
      .select()
    
    if (error) {
      console.error('❌ Insert error:', error.message)
      return
    }
    
    console.log('✅ Successfully inserted notices:')
    data.forEach((notice, index) => {
      console.log(`   ${index + 1}. ${notice.title} (${notice.view_count} views)`)
    })
    
    console.log('\n📊 Checking total notices count...')
    
    const { count } = await supabase
      .from('notices')
      .select('*', { count: 'exact', head: true })
    
    console.log(`   Total notices in database: ${count}`)
    
    // 샘플 데이터 조회
    console.log('\n📋 Sample notices from database:')
    const { data: sampleNotices } = await supabase
      .from('notices')
      .select('title, notice_type, target_audience, view_count, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(3)
    
    if (sampleNotices) {
      sampleNotices.forEach((notice, index) => {
        console.log(`   ${index + 1}. ${notice.title}`)
        console.log(`      Type: ${notice.notice_type} | Target: ${notice.target_audience} | Views: ${notice.view_count}`)
      })
    }
    
    console.log('\n✅ Notices population completed successfully!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

populateNoticesFixed()