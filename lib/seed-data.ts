import { createClient } from '@/lib/supabase/client'

// 더미 숙소 데이터
export const accommodationsData = [
  {
    name: '청주 모던 하우스',
    description: '깔끔하고 모던한 인테리어의 독채형 펜션입니다. 넓은 거실과 완전한 주방시설을 갖추고 있어 가족 여행이나 소규모 모임에 최적입니다.',
    region: '청주',
    price_per_night: 160000,
    max_guests: 6,
    bedrooms: 3,
    bathrooms: 2,
    accommodation_type: '독채형',
    address: '충청북도 청주시 상당구 용암동 123-45',
    latitude: 36.6371,
    longitude: 127.4894,
    amenities: ['Wi-Fi', '주차장', '에어컨', '난방', '주방', 'TV', '세탁기', '냉장고'],
    images: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800'
    ],
    house_rules: '체크인: 15:00, 체크아웃: 11:00, 금연, 파티 금지',
    rating: 4.8,
    review_count: 45,
    status: 'active',
    category: '프라이빗 독채형'
  },
  {
    name: '세종 프라이빗 빌라',
    description: '세종시 중심부에 위치한 고급 빌라입니다. 개별 수영장과 바베큐 시설을 갖춘 완전한 프라이버시를 제공합니다.',
    region: '세종',
    price_per_night: 225000,
    max_guests: 8,
    bedrooms: 4,
    bathrooms: 3,
    accommodation_type: '빌라',
    address: '세종특별자치시 조치원읍 신안리 567-89',
    latitude: 36.4800,
    longitude: 127.2890,
    amenities: ['Wi-Fi', '전용 수영장', '바베큐 시설', '주차장', '에어컨', '난방', '주방', 'TV'],
    images: [
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'
    ],
    house_rules: '체크인: 16:00, 체크아웃: 11:00, 수영장 이용시간 09:00-22:00',
    rating: 4.7,
    review_count: 32,
    status: 'active',
    category: '물놀이 가능 풀빌라'
  },
  {
    name: '대전 풀빌라 스테이',
    description: '대전 유성구의 조용한 주택가에 위치한 풀빌라입니다. 온수 수영장과 함께 최대 10명까지 편안하게 머물 수 있습니다.',
    region: '대전',
    price_per_night: 340000,
    max_guests: 10,
    bedrooms: 5,
    bathrooms: 4,
    accommodation_type: '풀빌라',
    address: '대전광역시 유성구 궁동 234-56',
    latitude: 36.3504,
    longitude: 127.3845,
    amenities: ['Wi-Fi', '온수 수영장', '바베큐 시설', '주차장', '에어컨', '주방', '세탁기'],
    images: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
      'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800'
    ],
    house_rules: '체크인: 15:00, 체크아웃: 12:00, 금연, 소음 주의',
    rating: 4.9,
    review_count: 28,
    status: 'active',
    category: '물놀이 가능 풀빌라'
  },
  {
    name: '충북 자연 속 한옥',
    description: '전통 한옥을 현대적으로 리모델링한 특별한 숙소입니다. 아름다운 자연 속에서 힐링과 휴식을 즐기실 수 있습니다.',
    region: '충북',
    price_per_night: 180000,
    max_guests: 6,
    bedrooms: 3,
    bathrooms: 2,
    accommodation_type: '한옥',
    address: '충청북도 음성군 삼성면 용성리 345-67',
    latitude: 36.9441,
    longitude: 127.6925,
    amenities: ['Wi-Fi', '주차장', '난방', '주방', '마당', '전통체험', '자전거'],
    images: [
      'https://images.unsplash.com/photo-1590725175467-d3d4b68fbdee?w=800',
      'https://images.unsplash.com/photo-1445991842772-097fea258e7b?w=800',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'
    ],
    house_rules: '체크인: 15:00, 체크아웃: 11:00, 전통문화 체험 가능',
    rating: 4.6,
    review_count: 18,
    status: 'active',
    category: '자연 속 완벽한 휴식'
  },
  {
    name: '청주 반려견 동반 하우스',
    description: '반려견과 함께 편안하게 머물 수 있는 펫 프렌들리 숙소입니다. 울타리가 있는 개별 마당과 반려견 용품을 제공합니다.',
    region: '청주',
    price_per_night: 140000,
    max_guests: 4,
    bedrooms: 2,
    bathrooms: 1,
    accommodation_type: '독채형',
    address: '충청북도 청주시 흥덕구 강서동 456-78',
    latitude: 36.6424,
    longitude: 127.4519,
    amenities: ['Wi-Fi', '펫 용품', '울타리 마당', '주차장', '에어컨', '주방', '반려견 샤워시설'],
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=800',
      'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800'
    ],
    house_rules: '반려견 동반 필수, 예방접종 증명서 지참, 실내 배변 금지',
    rating: 4.7,
    review_count: 22,
    status: 'active',
    category: '반려견 동반 가능'
  },
  {
    name: '세종 키즈 전용 펜션',
    description: '아이들과 함께하는 가족 여행에 최적화된 키즈 전용 펜션입니다. 안전한 놀이시설과 아이 친화적인 시설을 갖추고 있습니다.',
    region: '세종',
    price_per_night: 190000,
    max_guests: 8,
    bedrooms: 3,
    bathrooms: 2,
    accommodation_type: '펜션',
    address: '세종특별자치시 연서면 월하리 678-90',
    latitude: 36.5184,
    longitude: 127.2734,
    amenities: ['Wi-Fi', '키즈 놀이터', '아기용품', '안전시설', '주차장', '에어컨', '주방'],
    images: [
      'https://images.unsplash.com/photo-1493663284031-b7e3aaa4c4bc?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-61dc36dc98c8?w=800'
    ],
    house_rules: '키즈 전용 시설, 성인 동반 필수, 안전수칙 준수',
    rating: 4.5,
    review_count: 35,
    status: 'active',
    category: '키즈 전용'
  },
  {
    name: '대전 도심 아파트',
    description: '대전 중구 중심가에 위치한 깔끔한 아파트입니다. 지하철역과 가까워 교통이 편리하고 맛집이 많은 지역입니다.',
    region: '대전',
    price_per_night: 120000,
    max_guests: 4,
    bedrooms: 2,
    bathrooms: 1,
    accommodation_type: '아파트',
    address: '대전광역시 중구 은행동 789-12',
    latitude: 36.3219,
    longitude: 127.4175,
    amenities: ['Wi-Fi', '지하철 근접', '주차장', '에어컨', '주방', 'TV', '세탁기'],
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1560448075-bb485b067938?w=800',
      'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800'
    ],
    house_rules: '체크인: 15:00, 체크아웃: 11:00, 금연, 조용히',
    rating: 4.4,
    review_count: 67,
    status: 'active',
    category: '배달음식 이용 편리'
  },
  {
    name: '충남 전원주택',
    description: '충남 천안의 조용한 전원지역에 위치한 독립주택입니다. 넓은 마당과 함께 자연 속에서 평온한 휴식을 취하실 수 있습니다.',
    region: '충남',
    price_per_night: 150000,
    max_guests: 6,
    bedrooms: 3,
    bathrooms: 2,
    accommodation_type: '주택',
    address: '충청남도 천안시 동남구 병천면 가정리 890-34',
    latitude: 36.7840,
    longitude: 127.1492,
    amenities: ['Wi-Fi', '넓은 마당', '바베큐 시설', '주차장', '에어컨', '주방', '자전거'],
    images: [
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800'
    ],
    house_rules: '체크인: 15:00, 체크아웃: 11:00, 바베큐 가능',
    rating: 4.3,
    review_count: 12,
    status: 'active',
    category: '자연 속 완벽한 휴식'
  }
]

// 더미 예약 데이터
export const reservationsData = [
  {
    reservation_number: 'RSV-2024-001',
    accommodation_id: 1,
    guest_name: '김민수',
    guest_phone: '010-1234-5678',
    guest_email: 'minsu@example.com',
    checkin_date: '2024-03-15',
    checkout_date: '2024-03-17',
    guest_count: 4,
    total_amount: 320000,
    payment_status: 'paid',
    status: 'confirmed',
    special_requests: '늦은 체크인 요청 (21시 예정)',
    created_at: '2024-02-20T10:30:00Z'
  },
  {
    reservation_number: 'RSV-2024-002',
    accommodation_id: 2,
    guest_name: '이영희',
    guest_phone: '010-9876-5432',
    guest_email: 'younghee@example.com',
    checkin_date: '2024-03-20',
    checkout_date: '2024-03-22',
    guest_count: 6,
    total_amount: 450000,
    payment_status: 'paid',
    status: 'confirmed',
    special_requests: '아이 동반, 아기침대 필요',
    created_at: '2024-02-25T15:20:00Z'
  },
  {
    reservation_number: 'RSV-2024-003',
    accommodation_id: 3,
    guest_name: '박지원',
    guest_phone: '010-5555-7777',
    guest_email: 'jiwon@example.com',
    checkin_date: '2024-03-25',
    checkout_date: '2024-03-27',
    guest_count: 8,
    total_amount: 680000,
    payment_status: 'pending',
    status: 'pending',
    special_requests: null,
    created_at: '2024-03-01T09:15:00Z'
  },
  {
    reservation_number: 'RSV-2024-004',
    accommodation_id: 4,
    guest_name: '최수현',
    guest_phone: '010-3333-9999',
    guest_email: 'suhyun@example.com',
    checkin_date: '2024-02-10',
    checkout_date: '2024-02-12',
    guest_count: 4,
    total_amount: 360000,
    payment_status: 'paid',
    status: 'completed',
    special_requests: '전통 체험 프로그램 신청',
    created_at: '2024-01-25T14:45:00Z'
  },
  {
    reservation_number: 'RSV-2024-005',
    accommodation_id: 5,
    guest_name: '정민호',
    guest_phone: '010-2222-8888',
    guest_email: 'minho@example.com',
    checkin_date: '2024-03-05',
    checkout_date: '2024-03-07',
    guest_count: 2,
    total_amount: 280000,
    payment_status: 'paid',
    status: 'completed',
    special_requests: '반려견 동반 (골든리트리버, 예방접종 완료)',
    created_at: '2024-02-15T11:30:00Z'
  }
]

// 더미 리뷰 데이터
export const reviewsData = [
  {
    accommodation_id: 1,
    guest_name: '김민수',
    rating: 5,
    comment: '정말 깨끗하고 편안한 숙소였습니다. 호스트님도 친절하시고 위치도 좋았어요. 다음에 청주 오면 또 이용하고 싶습니다.',
    created_at: '2024-02-22T16:20:00Z'
  },
  {
    accommodation_id: 1,
    guest_name: '조은지',
    rating: 4,
    comment: '시설이 깔끔하고 가족 여행하기 좋았습니다. 주차공간도 넉넉해서 편리했어요.',
    created_at: '2024-01-15T10:45:00Z'
  },
  {
    accommodation_id: 2,
    guest_name: '이영희',
    rating: 5,
    comment: '수영장이 정말 좋았어요! 아이들이 너무 즐거워했습니다. 바베큐 시설도 완벽하고 전체적으로 만족스러운 여행이었어요.',
    created_at: '2024-02-28T20:30:00Z'
  },
  {
    accommodation_id: 3,
    guest_name: '김태형',
    rating: 5,
    comment: '대전에서 이런 풀빌라를 만날 수 있어서 정말 좋았습니다. 친구들과 함께 최고의 추억을 만들었어요.',
    created_at: '2024-01-20T14:15:00Z'
  },
  {
    accommodation_id: 4,
    guest_name: '최수현',
    rating: 4,
    comment: '전통 한옥의 매력을 제대로 느낄 수 있었습니다. 조용하고 평화로운 분위기가 힐링에 도움이 되었어요.',
    created_at: '2024-02-14T09:25:00Z'
  },
  {
    accommodation_id: 5,
    guest_name: '정민호',
    rating: 5,
    comment: '반려견과 함께 머물기 정말 좋은 곳이에요. 마당도 넓고 반려견 시설이 잘 되어 있어서 안심하고 놀 수 있었습니다.',
    created_at: '2024-03-10T18:40:00Z'
  }
]

// 데이터베이스 시드 함수
export async function seedDatabase() {
  const supabase = createClient()
  
  try {
    console.log('🌱 데이터베이스 시드 시작...')

    // 1. 숙소 데이터 삽입
    console.log('📍 숙소 데이터 삽입 중...')
    for (const accommodation of accommodationsData) {
      // 숙소 기본 정보 삽입
      const { data: accommodationResult, error: accommodationError } = await supabase
        .from('accommodations')
        .insert({
          name: accommodation.name,
          description: accommodation.description,
          region: accommodation.region,
          address: accommodation.address,
          detailed_address: accommodation.address,
          max_capacity: accommodation.max_guests,
          bedrooms: accommodation.bedrooms,
          bathrooms: accommodation.bathrooms,
          accommodation_type: accommodation.accommodation_type,
          base_price: accommodation.price_per_night,
          weekend_price: accommodation.price_per_night * 1.2,
          checkin_time: '15:00',
          checkout_time: '11:00',
          is_featured: accommodation.rating >= 4.7,
          status: 'active'
        })
        .select()

      if (accommodationError) {
        console.error('숙소 삽입 오류:', accommodationError)
        continue
      }

      const accommodationId = accommodationResult[0].id

      // 편의시설 삽입
      for (const amenity of accommodation.amenities) {
        await supabase
          .from('accommodation_amenities')
          .insert({
            accommodation_id: accommodationId,
            amenity_type: 'facility',
            amenity_name: amenity,
            is_available: true
          })
      }

      // 이미지 삽입
      for (let i = 0; i < accommodation.images.length; i++) {
        await supabase
          .from('accommodation_images')
          .insert({
            accommodation_id: accommodationId,
            image_url: accommodation.images[i],
            alt_text: `${accommodation.name} 이미지 ${i + 1}`,
            display_order: i + 1
          })
      }

      // 카테고리 삽입
      await supabase
        .from('accommodation_categories')
        .insert({
          accommodation_id: accommodationId,
          category: accommodation.category
        })
    }

    // 2. 예약 데이터 삽입
    console.log('📋 예약 데이터 삽입 중...')
    for (const reservation of reservationsData) {
      const { error: reservationError } = await supabase
        .from('reservations')
        .insert(reservation)

      if (reservationError) {
        console.error('예약 삽입 오류:', reservationError)
      }
    }

    // 3. 리뷰 데이터 삽입
    console.log('⭐ 리뷰 데이터 삽입 중...')
    for (const review of reviewsData) {
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert(review)

      if (reviewError) {
        console.error('리뷰 삽입 오류:', reviewError)
      }
    }

    console.log('✅ 데이터베이스 시드 완료!')
    return { success: true, message: '데이터베이스가 성공적으로 채워졌습니다.' }
    
  } catch (error) {
    console.error('❌ 시드 과정에서 오류 발생:', error)
    return { success: false, message: '데이터베이스 시드 중 오류가 발생했습니다.' }
  }
}