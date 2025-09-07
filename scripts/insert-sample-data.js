#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fcmauibvdqbocwhloqov.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjbWF1aWJ2ZHFib2N3aGxvcW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjgwODY3OCwiZXhwIjoyMDcyMzg0Njc4fQ.vwEr3cyiQSWBabAgoodWUzBSewrVTco3kFg_w-ae1D0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function insertSampleData() {
  try {
    console.log('샘플 숙소 데이터 삽입 중...')
    
    const accommodations = [
      {
        name: '구공스테이 청주 프라이빗 풀빌라',
        description: '청주에서 가장 인기 있는 프라이빗 풀빌라입니다. 독립적인 수영장과 바베큐 시설, 그리고 넓은 거실에서 편안한 시간을 보내실 수 있습니다. 애견 동반도 가능합니다.',
        location: '충북 청주시 청원구',
        type: '풀빌라',
        base_price: 180000,
        base_guests: 4,
        additional_guest_fee: 20000,
        max_guests: 10,
        check_in_time: '15:00',
        check_out_time: '11:00',
        amenities: ["수영장", "바베큐시설", "주차장", "에어컨", "와이파이", "애견동반가능", "세탁기", "건조기", "냉장고", "전자레인지"],
        options: [{"name": "숯불 바베큐 세트", "price": 30000}, {"name": "튜브 대여", "price": 10000}, {"name": "애견용품 세트", "price": 15000}],
        images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800", "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800", "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800"],
        rating: 4.9,
        review_count: 147,
        is_active: true,
        host_id: 'host-1',
        host_name: '김호스트',
        host_business_name: '구공스테이',
        approval_status: 'approved'
      },
      {
        name: '구공스테이 세종 힐링 독채 펜션',
        description: '자연 속에서 힐링할 수 있는 독채형 펜션입니다. 조용한 환경과 깨끗한 시설로 가족단위나 커플들에게 인기가 높습니다.',
        location: '세종특별자치시 연기면',
        type: '독채',
        base_price: 120000,
        base_guests: 2,
        additional_guest_fee: 15000,
        max_guests: 8,
        check_in_time: '15:00',
        check_out_time: '11:00',
        amenities: ["주차장", "에어컨", "와이파이", "취사시설", "냉장고", "전자레인지", "세탁기", "바베큐시설"],
        options: [{"name": "바베큐 세트", "price": 25000}, {"name": "캠프파이어", "price": 20000}],
        images: ["https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800", "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800", "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800"],
        rating: 4.7,
        review_count: 89,
        is_active: true,
        host_id: 'host-1',
        host_name: '김호스트',
        host_business_name: '구공스테이',
        approval_status: 'approved'
      },
      {
        name: '스테이도고 대전 스카이뷰 루프탑',
        description: '대전 시내가 한눈에 내려다보이는 루프탑 펜션입니다. 로맨틱한 분위기와 도시적 감각이 조화된 공간입니다.',
        location: '대전광역시 유성구',
        type: '루프탑',
        base_price: 160000,
        base_guests: 2,
        additional_guest_fee: 18000,
        max_guests: 6,
        check_in_time: '15:00',
        check_out_time: '11:00',
        amenities: ["루프탑", "시티뷰", "주차장", "에어컨", "와이파이", "취사시설", "냉장고", "음향시설"],
        options: [{"name": "샴페인 세트", "price": 50000}, {"name": "케이크 주문", "price": 35000}, {"name": "플라워 데코", "price": 40000}],
        images: ["https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800", "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800", "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800"],
        rating: 4.8,
        review_count: 67,
        is_active: true,
        host_id: 'host-2',
        host_name: '박호스트',
        host_business_name: '스테이도고',
        approval_status: 'approved'
      },
      {
        name: '마담아네뜨 천안 프렌치 풀빌라',
        description: '프렌치 감성이 물씬 느껴지는 풀빌라입니다. 인스타그래머들이 선택하는 감성적인 공간으로 유명합니다.',
        location: '충남 천안시 동남구',
        type: '풀빌라',
        base_price: 200000,
        base_guests: 4,
        additional_guest_fee: 25000,
        max_guests: 8,
        check_in_time: '15:00',
        check_out_time: '11:00',
        amenities: ["수영장", "감성 인테리어", "주차장", "에어컨", "와이파이", "바베큐시설", "취사시설", "세탁기", "건조기"],
        options: [{"name": "프렌치 브런치", "price": 45000}, {"name": "와인 세트", "price": 80000}, {"name": "사진 촬영 소품", "price": 20000}],
        images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800", "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", "https://images.unsplash.com/photo-1520637836862-4d197d17c36a?w=800"],
        rating: 4.9,
        review_count: 112,
        is_active: true,
        host_id: 'host-3',
        host_name: '이호스트',
        host_business_name: '마담아네뜨',
        approval_status: 'approved'
      }
    ]
    
    for (let i = 0; i < accommodations.length; i++) {
      const accommodation = accommodations[i]
      console.log(`${i + 1}/${accommodations.length}: ${accommodation.name} 삽입 중...`)
      
      const { data, error } = await supabase
        .from('accommodations')
        .upsert([accommodation], { onConflict: 'name' })
        .select()
      
      if (error) {
        console.error(`오류 발생 (${accommodation.name}):`, error.message)
      } else {
        console.log(`✅ 성공: ${accommodation.name}`)
      }
    }
    
    console.log('\n🎉 모든 샘플 데이터가 성공적으로 삽입되었습니다!')
    
  } catch (error) {
    console.error('❌ 샘플 데이터 삽입 실패:', error.message)
    process.exit(1)
  }
}

insertSampleData()