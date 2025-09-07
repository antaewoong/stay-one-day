import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    console.log('기존 데이터 삭제 중...')
    
    // 기존 데이터 삭제 (순서 중요 - 외래키 제약)
    await supabase.from('accommodation_images').delete().neq('id', 0)
    await supabase.from('accommodation_amenities').delete().neq('id', 0)
    await supabase.from('accommodation_categories').delete().neq('id', 0)
    await supabase.from('reviews').delete().neq('id', 0)
    await supabase.from('reservations').delete().neq('id', 0)
    await supabase.from('wishlists').delete().neq('id', 0)
    await supabase.from('accommodations').delete().neq('id', 0)

    console.log('새로운 숙소 데이터 삽입 중...')

    // 숙소 기본 데이터 (영어 타입으로 시도)
    const accommodationsData = [
      {
        name: '청주 힐스테이 프리미엄 풀빌라',
        description: '청주 외곽 조용한 언덕에 위치한 프라이빗 풀빌라입니다. 독립된 수영장과 넓은 테라스에서 특별한 당일여행을 만끽하실 수 있습니다.',
        accommodation_type: '풀빌라',
        region: '충청북도 청주시',
        address: '충청북도 청주시 청원구',
        detailed_address: '청주시 청원구 힐스테이로 123',
        max_capacity: 15,
        bedrooms: 3,
        bathrooms: 2,
        base_price: 180000,
        weekend_price: 220000,
        checkin_time: '15:00',
        checkout_time: '23:00',
        is_featured: true,
        status: 'active'
      },
      {
        name: '세종 모던하우스 독채형 펜션',
        description: '세종시 중심가 근처 모던한 독채형 펜션입니다. 깔끔한 인테리어와 완비된 시설로 프라이빗한 시간을 보내기 완벽합니다.',
        accommodation_type: '독채',
        region: '세종특별자치시',
        address: '세종특별자치시 조치원읍',
        detailed_address: '세종시 조치원읍 모던로 45',
        max_capacity: 12,
        bedrooms: 2,
        bathrooms: 2,
        base_price: 145000,
        weekend_price: 175000,
        checkin_time: '15:00',
        checkout_time: '23:00',
        is_featured: true,
        status: 'active'
      },
      {
        name: '대전 스카이라운지 루프탑 펜션',
        description: '대전 도심이 한눈에 보이는 스카이라운지 펜션입니다. 루프탑 테라스에서 도시 야경을 감상하며 로맨틱한 시간을 보내실 수 있습니다.',
        accommodation_type: '펜션',
        region: '대전광역시',
        address: '대전광역시 유성구',
        detailed_address: '대전시 유성구 스카이로 78',
        max_capacity: 10,
        bedrooms: 2,
        bathrooms: 1,
        base_price: 165000,
        weekend_price: 195000,
        checkin_time: '15:00',
        checkout_time: '23:00',
        is_featured: true,
        status: 'active'
      },
      {
        name: '천안 펫프렌들리 풀빌라',
        description: '반려견과 함께하는 특별한 풀빌라입니다. 애견 전용 시설과 울타리가 있는 안전한 마당에서 반려견과 함께 자유롭게 뛰어놀 수 있습니다.',
        accommodation_type: '풀빌라',
        region: '충청남도 천안시',
        address: '충청남도 천안시 동남구',
        detailed_address: '천안시 동남구 펫프렌드로 91',
        max_capacity: 12,
        bedrooms: 2,
        bathrooms: 2,
        base_price: 155000,
        weekend_price: 185000,
        checkin_time: '15:00',
        checkout_time: '23:00',
        is_featured: false,
        status: 'active'
      },
      {
        name: '청주 자연속 힐링하우스',
        description: '청주 근교 자연 속에 위치한 힐링 펜션입니다. 맑은 공기와 아름다운 자연경관 속에서 도시의 스트레스를 잊고 편안한 휴식을 취하실 수 있습니다.',
        accommodation_type: '펜션',
        region: '충청북도 청주시',
        address: '충청북도 청주시 상당구',
        detailed_address: '청주시 상당구 힐링로 234',
        max_capacity: 10,
        bedrooms: 2,
        bathrooms: 1,
        base_price: 125000,
        weekend_price: 155000,
        checkin_time: '15:00',
        checkout_time: '23:00',
        is_featured: false,
        status: 'active'
      },
      {
        name: '공주 전통한옥 스테이',
        description: '공주의 역사와 전통이 살아있는 한옥스테이입니다. 현대적 편의시설을 갖춘 전통 한옥에서 특별한 경험을 만들어보세요.',
        accommodation_type: '펜션',
        region: '충청남도 공주시',
        address: '충청남도 공주시 중동',
        detailed_address: '공주시 중동 전통로 567',
        max_capacity: 8,
        bedrooms: 2,
        bathrooms: 1,
        base_price: 140000,
        weekend_price: 170000,
        checkin_time: '15:00',
        checkout_time: '23:00',
        is_featured: false,
        status: 'active'
      }
    ]

    // 숙소 기본 정보 삽입
    const { data: accommodations, error: accError } = await supabase
      .from('accommodations')
      .insert(accommodationsData)
      .select()

    if (accError) {
      console.error('숙소 삽입 오류:', accError)
      return NextResponse.json({ error: accError.message }, { status: 500 })
    }

    console.log(`${accommodations.length}개 숙소 삽입 완료`)

    // 이미지 데이터 삽입
    const imagesData: any[] = []
    accommodations.forEach((acc, index) => {
      // 각 숙소별로 이미지 추가
      for (let i = 1; i <= 5; i++) {
        imagesData.push({
          accommodation_id: acc.id,
          image_url: `/images/90staycj/${(index * 5) + i}.jpg`,
          alt_text: `${acc.name} 이미지 ${i}`,
          is_primary: i === 1
        })
      }
    })

    const { error: imgError } = await supabase
      .from('accommodation_images')
      .insert(imagesData)

    if (imgError) {
      console.error('이미지 삽입 오류:', imgError)
    } else {
      console.log(`${imagesData.length}개 이미지 삽입 완료`)
    }

    // 편의시설 데이터 삽입
    const amenitiesData: any[] = []
    accommodations.forEach((acc) => {
      // 기본 편의시설
      const basicAmenities = [
        { type: '네트워크', name: 'WiFi', available: true },
        { type: '주차', name: '주차장', available: true },
        { type: '주방', name: '취사 가능', available: true },
        { type: '냉난방', name: '에어컨', available: true }
      ]
      
      // 숙소별 특별 편의시설
      if (acc.accommodation_type === '풀빌라') {
        basicAmenities.push(
          { type: '수영장', name: '프라이빗 풀', available: true },
          { type: '바베큐', name: '바베큐 시설', available: true }
        )
      }
      if (acc.accommodation_type === '독채') {
        basicAmenities.push(
          { type: '프라이빗', name: '완전 독립공간', available: true }
        )
      }
      
      basicAmenities.forEach(amenity => {
        amenitiesData.push({
          accommodation_id: acc.id,
          amenity_type: amenity.type,
          amenity_name: amenity.name,
          is_available: amenity.available
        })
      })
    })

    const { error: amenError } = await supabase
      .from('accommodation_amenities')
      .insert(amenitiesData)

    if (amenError) {
      console.error('편의시설 삽입 오류:', amenError)
    } else {
      console.log(`${amenitiesData.length}개 편의시설 삽입 완료`)
    }

    // 카테고리 데이터 삽입
    const categoriesData: any[] = []
    accommodations.forEach((acc) => {
      const categories = []
      
      if (acc.is_featured) categories.push('인기')
      if (acc.accommodation_type === '풀빌라') categories.push('풀빌라')
      if (acc.accommodation_type === '독채') categories.push('독채')
      if (acc.accommodation_type === '펜션') categories.push('펜션')
      if (acc.max_capacity >= 10) categories.push('대형')
      if (acc.name.includes('펫')) categories.push('애견동반')
      if (acc.name.includes('힐링') || acc.name.includes('자연')) categories.push('힐링')
      
      categories.forEach(category => {
        categoriesData.push({
          accommodation_id: acc.id,
          category: category
        })
      })
    })

    const { error: catError } = await supabase
      .from('accommodation_categories')
      .insert(categoriesData)

    if (catError) {
      console.error('카테고리 삽입 오류:', catError)
    } else {
      console.log(`${categoriesData.length}개 카테고리 삽입 완료`)
    }

    return NextResponse.json({ 
      success: true, 
      message: `${accommodations.length}개의 실제 숙소 데이터가 성공적으로 입력되었습니다.`,
      accommodations: accommodations.length,
      images: imagesData.length,
      amenities: amenitiesData.length,
      categories: categoriesData.length
    })

  } catch (error) {
    console.error('데이터 삽입 실패:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}