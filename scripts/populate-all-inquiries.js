#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fcmauibvdqbocwhloqov.supabase.co'
const supabaseKey = '[REMOVED_SUPABASE_SERVICE_KEY]'

const supabase = createClient(supabaseUrl, supabaseKey)

async function populateAllInquiries() {
  try {
    console.log('📝 Populating all inquiry tables with sample data...\n')
    
    // 1. 일반 문의사항 (inquiries)
    console.log('1. 일반 문의사항 테이블 데이터 추가...')
    const generalInquiries = [
      {
        user_name: '김철수',
        user_email: 'kimcs@example.com',
        user_phone: '010-1234-5678',
        inquiry_type: 'booking',
        title: '예약 취소 관련 문의',
        content: '예약했던 숙소를 취소하고 싶은데 환불 정책이 궁금합니다. 코로나로 인해 부득이하게 여행을 취소하게 되었습니다.',
        status: 'pending',
        priority: 'medium'
      },
      {
        user_name: '박영희',
        user_email: 'parkyh@example.com',
        user_phone: '010-9876-5432',
        inquiry_type: 'service',
        title: '숙소 시설 문제',
        content: '체크인했는데 온수가 나오지 않습니다. 빠른 조치 부탁드립니다.',
        status: 'in_progress',
        priority: 'high'
      },
      {
        user_name: '이민수',
        user_email: 'leems@example.com',
        user_phone: '010-5555-7777',
        inquiry_type: 'general',
        title: '결제 방법 문의',
        content: '현장에서 현금 결제가 가능한지 문의드립니다.',
        status: 'resolved',
        priority: 'low',
        admin_response: '현장 결제는 현금과 카드 모두 가능합니다. 다만, 온라인 결제 시 할인 혜택이 있으니 참고해 주세요.',
        responded_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1일 전
      },
      {
        user_name: '정수진',
        user_email: 'jungsj@example.com',
        user_phone: '010-3333-4444',
        inquiry_type: 'booking',
        title: '추가 인원 예약 가능 여부',
        content: '원래 4명으로 예약했는데 6명으로 변경이 가능한지 문의드립니다.',
        status: 'pending',
        priority: 'medium'
      },
      {
        user_name: '최현진',
        user_email: 'choihj@example.com',
        user_phone: '010-7777-8888',
        inquiry_type: 'complaint',
        title: '청소 상태 불만',
        content: '체크인했는데 청소가 제대로 되어있지 않았습니다. 개선 부탁드립니다.',
        status: 'resolved',
        priority: 'high',
        admin_response: '불편을 드려 죄송합니다. 청소팀에 재교육을 실시하겠으며, 보상 차원에서 다음 예약 시 20% 할인 쿠폰을 제공드리겠습니다.',
        responded_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2일 전
      }
    ]

    try {
      const { data: inquiriesData, error: inquiriesError } = await supabase
        .from('inquiries')
        .insert(generalInquiries)
        .select()

      if (inquiriesError) {
        console.error('   ❌ 일반 문의사항 추가 실패:', inquiriesError.message)
      } else {
        console.log(`   ✅ 일반 문의사항 ${inquiriesData.length}건 추가 성공`)
      }
    } catch (error) {
      console.error('   ❌ 일반 문의사항 테이블 접근 실패:', error.message)
    }

    // 2. 제휴 문의 (partnership_inquiries)
    console.log('\n2. 제휴 문의 테이블 데이터 추가...')
    const partnershipInquiries = [
      {
        company_name: '토스',
        contact_name: '이비즈',
        email: 'biz@toss.im',
        phone: '02-1234-5678',
        business_type: '핀테크',
        inquiry: '토스 앱 내에서 Stay OneDay 서비스를 연동하여 사용자들이 쉽게 독채 숙소를 예약할 수 있는 제휴를 논의하고 싶습니다. 결제 시스템 연동과 포인트 적립 등의 혜택도 함께 검토해보면 좋겠습니다.',
        status: 'pending',
        priority: 'high'
      },
      {
        company_name: '네이버',
        contact_name: '김파트너',
        email: 'partner@naver.com',
        phone: '02-2222-3333',
        business_type: '플랫폼',
        inquiry: '네이버 지도 및 검색에서 Stay OneDay 숙소들이 노출될 수 있도록 API 연동 및 마케팅 제휴를 진행하고자 합니다.',
        status: 'in_progress',
        priority: 'high',
        notes: '1차 미팅 완료, 기술 검토 진행중. 네이버 지도팀과 API 연동 일정 조율 필요.'
      },
      {
        company_name: '야놀자',
        contact_name: '박여행',
        email: 'business@yanolja.com',
        phone: '02-3333-4444',
        business_type: 'OTA',
        inquiry: '야놀자 플랫폼에서 Stay OneDay의 독채 상품을 판매하고 싶습니다. 수수료 구조와 예약 연동 방안에 대해 논의하고 싶습니다.',
        status: 'resolved',
        priority: 'medium',
        notes: '제휴 계약 체결 완료. 다음 주부터 상품 등록 시작 예정.'
      },
      {
        company_name: '카카오',
        contact_name: '정모빌리티',
        email: 'mobility@kakao.com',
        phone: '02-4444-5555',
        business_type: '플랫폼',
        inquiry: '카카오맵에서 Stay OneDay 숙소 정보를 제공하고, 카카오택시와의 연동을 통한 교통 편의 서비스 제휴를 제안합니다.',
        status: 'pending',
        priority: 'medium'
      }
    ]

    try {
      const { data: partnershipData, error: partnershipError } = await supabase
        .from('partnership_inquiries')
        .insert(partnershipInquiries)
        .select()

      if (partnershipError) {
        console.error('   ❌ 제휴 문의 추가 실패:', partnershipError.message)
      } else {
        console.log(`   ✅ 제휴 문의 ${partnershipData.length}건 추가 성공`)
      }
    } catch (error) {
      console.error('   ❌ 제휴 문의 테이블 접근 실패:', error.message)
    }

    // 3. 입점 문의 (partner_inquiries)
    console.log('\n3. 입점 문의 테이블 데이터 추가...')
    const partnerInquiries = [
      {
        business_name: '청주 힐사이드 펜션',
        contact_name: '김점주',
        phone: '010-1234-5678',
        email: 'hillside@example.com',
        website_url: 'https://hillside-pension.co.kr',
        location: '충청북도 청주시',
        space_type: '펜션',
        daily_rate: '300,000-500,000원',
        average_idle_days: '주중 2-3일',
        parking_spaces: '5대',
        amenities: 'BBQ 시설, 수영장, 족구장',
        notes: '가족 단위 고객이 많고, 주말 예약률이 높습니다.',
        privacy_consent: true,
        marketing_consent: true,
        status: 'pending',
        priority: 'medium'
      },
      {
        business_name: '제주 오션뷰 빌라',
        contact_name: '박바다',
        phone: '010-9876-5432',
        email: 'ocean@jeju.com',
        website_url: 'https://jeju-ocean-villa.com',
        location: '제주특별자치도 서귀포시',
        space_type: '독채펜션',
        daily_rate: '800,000-1,200,000원',
        average_idle_days: '주중 1-2일',
        parking_spaces: '3대',
        amenities: '오션뷰, 개별 수영장, 바베큐 시설, 넷플릭스',
        notes: '바다 전망이 좋아 인스타그램에서 인기가 높습니다.',
        privacy_consent: true,
        marketing_consent: true,
        status: 'resolved',
        priority: 'high',
        admin_notes: '입점 승인 완료. 사진 촬영 일정 조율중. 다음 주 월요일 오전 10시 현장 미팅 예정.'
      },
      {
        business_name: '강릉 바다소리 풀빌라',
        contact_name: '이바다',
        phone: '010-5555-7777',
        email: 'seasound@gangneung.com',
        website_url: 'https://seasound-villa.co.kr',
        location: '강원도 강릉시',
        space_type: '풀빌라',
        daily_rate: '600,000-900,000원',
        average_idle_days: '주중 3-4일',
        parking_spaces: '4대',
        amenities: '프라이빗 풀, 바베큐 시설, 스파, 사우나',
        notes: '커플과 소규모 그룹 고객층이 주 타겟입니다.',
        privacy_consent: true,
        status: 'in_progress',
        priority: 'medium',
        admin_notes: '서류 검토 중. 사업자등록증 재제출 필요.'
      },
      {
        business_name: '전주 한옥마을 게스트하우스',
        contact_name: '최전통',
        phone: '010-3333-4444',
        email: 'hanok@jeonju.com',
        location: '전라북도 전주시',
        space_type: '한옥',
        daily_rate: '200,000-350,000원',
        average_idle_days: '주중 4-5일',
        parking_spaces: '2대',
        amenities: '전통 한옥, 마루, 온돌, 전통차 서비스',
        notes: '외국인 관광객들에게 인기가 높습니다.',
        privacy_consent: true,
        marketing_consent: false,
        status: 'pending',
        priority: 'low'
      }
    ]

    try {
      const { data: partnerData, error: partnerError } = await supabase
        .from('partner_inquiries')
        .insert(partnerInquiries)
        .select()

      if (partnerError) {
        console.error('   ❌ 입점 문의 추가 실패:', partnerError.message)
      } else {
        console.log(`   ✅ 입점 문의 ${partnerData.length}건 추가 성공`)
      }
    } catch (error) {
      console.error('   ❌ 입점 문의 테이블 접근 실패:', error.message)
    }

    // 최종 상태 확인
    console.log('\n📊 최종 데이터 확인...')
    
    try {
      const { count: inquiriesCount } = await supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
      console.log(`   일반 문의사항: ${inquiriesCount}건`)
    } catch (error) {
      console.log('   일반 문의사항: 테이블 접근 불가')
    }

    try {
      const { count: partnershipCount } = await supabase
        .from('partnership_inquiries')
        .select('*', { count: 'exact', head: true })
      console.log(`   제휴 문의: ${partnershipCount}건`)
    } catch (error) {
      console.log('   제휴 문의: 테이블 접근 불가')
    }

    try {
      const { count: partnerCount } = await supabase
        .from('partner_inquiries')
        .select('*', { count: 'exact', head: true })
      console.log(`   입점 문의: ${partnerCount}건`)
    } catch (error) {
      console.log('   입점 문의: 테이블 접근 불가')
    }

    console.log('\n✅ 모든 문의사항 데이터 생성 완료!')
    console.log('\n⚠️  테이블이 없다는 오류가 발생하면:')
    console.log('   1. Supabase 대시보드 > SQL Editor로 이동')
    console.log('   2. scripts/create-inquiries-tables-supabase.sql 파일 내용을 복사하여 실행')
    console.log('   3. 다시 이 스크립트를 실행하세요')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

populateAllInquiries()