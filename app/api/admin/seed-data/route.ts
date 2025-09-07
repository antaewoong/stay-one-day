import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check if user has admin privileges
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // Read the sample data SQL file
    const sqlPath = join(process.cwd(), 'lib', 'sample-accommodations.sql')
    const sqlContent = readFileSync(sqlPath, 'utf8')
    
    // Execute the SQL script
    try {
      // For Supabase, we need to split and execute the commands differently
      // Let's use a direct approach by inserting the data via the JavaScript client
      
      // First, ensure we have a host
      const { data: existingHost } = await supabase
        .from('hosts')
        .select('id')
        .eq('email', 'host@stay-oneday.com')
        .single()

      let hostId = existingHost?.id

      if (!hostId) {
        const { data: newHost, error: hostError } = await supabase
          .from('hosts')
          .insert({
            business_name: 'Stay One Day 파트너',
            host_name: '김호스트',
            phone: '010-1234-5678',
            email: 'host@stay-oneday.com'
          })
          .select('id')
          .single()

        if (hostError) {
          console.error('호스트 생성 실패:', hostError)
          return NextResponse.json({ error: '호스트 생성에 실패했습니다.' }, { status: 500 })
        }
        
        hostId = newHost.id
      }

      // Sample accommodations data
      const accommodations = [
        {
          name: '구공스테이 청주 메인홀',
          description: '충북 청주시에 위치한 프리미엄 풀빌라입니다. 넓은 실내와 프라이빗 풀장, 바베큐 시설을 갖추어 가족 및 단체 모임에 최적화된 공간입니다.',
          accommodation_type: '풀빌라',
          address: '충북 청주시 청원구 오창읍 각리2길 123',
          region: '충북',
          base_price: 180000,
          max_capacity: 20,
          checkin_time: '15:00:00',
          checkout_time: '11:00:00',
          amenities: [
            {"name": "프라이빗 풀", "icon": "pool"}, 
            {"name": "바베큐 시설", "icon": "bbq"}, 
            {"name": "주차장", "icon": "parking"}, 
            {"name": "WiFi", "icon": "wifi"}
          ],
          images: [
            "/images/90staycj/1.jpg", "/images/90staycj/2.jpg", "/images/90staycj/3.jpg", 
            "/images/90staycj/4.jpg", "/images/90staycj/5.jpg"
          ],
          rating: 4.9,
          review_count: 147,
          status: 'active',
          is_featured: true,
          bedrooms: 4,
          bathrooms: 3,
          weekend_price: 220000,
          host_id: hostId,
          business_id: '123-45-67890',
          extra_options: [
            {"name": "바베큐 세트", "price": 30000, "description": "숯, 그릴, 기본 양념 포함"}
          ]
        },
        {
          name: '스카이뷰 루프탑 펜션',
          description: '경기도 가평의 아름다운 자연 속에 위치한 독채형 펜션입니다. 루프탑 테라스에서 바라보는 도시 전망이 일품입니다.',
          accommodation_type: '독채형',
          address: '경기도 가평군 가평읍 달전리 456-78',
          region: '경기',
          base_price: 160000,
          max_capacity: 12,
          checkin_time: '15:00:00',
          checkout_time: '11:00:00',
          amenities: [
            {"name": "루프탑 테라스", "icon": "terrace"}, 
            {"name": "도시뷰", "icon": "view"}, 
            {"name": "주방시설", "icon": "kitchen"}
          ],
          images: [
            "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
          ],
          rating: 4.8,
          review_count: 89,
          status: 'active',
          is_featured: true,
          bedrooms: 3,
          bathrooms: 2,
          weekend_price: 200000,
          host_id: hostId,
          business_id: '123-45-67891',
          extra_options: [
            {"name": "루프탑 BBQ 세트", "price": 40000, "description": "루프탑에서 즐기는 바베큐 세트"}
          ]
        },
        {
          name: '오션뷰 글램핑',
          description: '강원도 양양의 바닷가에 위치한 글램핑장입니다. 파도소리를 들으며 잠들고, 아침에는 일출을 감상할 수 있습니다.',
          accommodation_type: '글램핑',
          address: '강원도 양양군 현북면 하조대길 789',
          region: '강원',
          base_price: 140000,
          max_capacity: 6,
          checkin_time: '15:00:00',
          checkout_time: '11:00:00',
          amenities: [
            {"name": "오션뷰", "icon": "ocean"}, 
            {"name": "캠프파이어", "icon": "fire"}, 
            {"name": "바베큐", "icon": "bbq"}
          ],
          images: [
            "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
          ],
          rating: 4.7,
          review_count: 234,
          status: 'active',
          is_featured: false,
          bedrooms: 1,
          bathrooms: 1,
          weekend_price: 180000,
          host_id: hostId,
          business_id: '123-45-67892',
          extra_options: [
            {"name": "캠프파이어 세트", "price": 20000, "description": "장작, 마시멜로우 포함"}
          ]
        },
        {
          name: '힐링 포레스트 하우스',
          description: '전남 순천의 울창한 숲 속에 자리잡은 독채형 펜션입니다. 도시의 소음에서 벗어나 자연 속에서 진정한 힐링을 경험할 수 있습니다.',
          accommodation_type: '독채형',
          address: '전남 순천시 송광면 송광로 321',
          region: '전남',
          base_price: 120000,
          max_capacity: 8,
          checkin_time: '15:00:00',
          checkout_time: '11:00:00',
          amenities: [
            {"name": "숲뷰", "icon": "forest"}, 
            {"name": "온수 욕조", "icon": "jacuzzi"}, 
            {"name": "반려견 동반", "icon": "pet"}
          ],
          images: [
            "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1520637736862-4d197d17c93a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
          ],
          rating: 4.6,
          review_count: 78,
          status: 'active',
          is_featured: false,
          bedrooms: 2,
          bathrooms: 1,
          weekend_price: 150000,
          host_id: hostId,
          business_id: '123-45-67893',
          extra_options: [
            {"name": "반려견 동반", "price": 10000, "description": "소형견 1마리당"}
          ]
        },
        {
          name: '어반 시티 로프트',
          description: '서울 강남의 중심가에 위치한 도심형 로프트입니다. 지하철역과 가까워 접근성이 뛰어나며, 비즈니스 미팅에 최적화된 공간입니다.',
          accommodation_type: '게스트하우스',
          address: '서울시 강남구 테헤란로 123',
          region: '서울',
          base_price: 190000,
          max_capacity: 4,
          checkin_time: '15:00:00',
          checkout_time: '11:00:00',
          amenities: [
            {"name": "지하철 5분", "icon": "subway"}, 
            {"name": "24시간 체크인", "icon": "24h"}, 
            {"name": "업무공간", "icon": "workspace"}
          ],
          images: [
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
          ],
          rating: 4.9,
          review_count: 167,
          status: 'active',
          is_featured: true,
          bedrooms: 1,
          bathrooms: 1,
          weekend_price: 230000,
          host_id: hostId,
          business_id: '123-45-67894',
          extra_options: [
            {"name": "주차권", "price": 15000, "description": "1일 주차권"}
          ]
        },
        {
          name: '팜스테이 힐하우스',
          description: '경북 안동의 전통 한옥을 현대적으로 개조한 특별한 숙소입니다. 한국의 전통 문화를 체험할 수 있습니다.',
          accommodation_type: '한옥',
          address: '경북 안동시 풍천면 하회마을길 456',
          region: '경북',
          base_price: 130000,
          max_capacity: 10,
          checkin_time: '15:00:00',
          checkout_time: '11:00:00',
          amenities: [
            {"name": "한옥 체험", "icon": "hanok"}, 
            {"name": "농촌 체험", "icon": "farm"}, 
            {"name": "전통차", "icon": "tea"}
          ],
          images: [
            "https://images.unsplash.com/photo-1520637836862-4d197d17c93a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1505577058444-a3dab90d4253?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
          ],
          rating: 4.8,
          review_count: 92,
          status: 'active',
          is_featured: false,
          bedrooms: 3,
          bathrooms: 2,
          weekend_price: 160000,
          host_id: hostId,
          business_id: '123-45-67895',
          extra_options: [
            {"name": "전통차 체험", "price": 10000, "description": "1인당 전통차 시음"}
          ]
        }
      ]

      // Insert accommodations
      const { data: insertedAccommodations, error: insertError } = await supabase
        .from('accommodations')
        .insert(accommodations)
        .select('id, name')

      if (insertError) {
        console.error('숙소 데이터 삽입 실패:', insertError)
        return NextResponse.json({ 
          error: '숙소 데이터 삽입에 실패했습니다.',
          details: insertError.message 
        }, { status: 500 })
      }

      return NextResponse.json({
        message: '샘플 데이터가 성공적으로 추가되었습니다.',
        data: {
          hostId,
          accommodationsCount: insertedAccommodations?.length || 0,
          accommodations: insertedAccommodations
        }
      })

    } catch (sqlError) {
      console.error('SQL 실행 오류:', sqlError)
      return NextResponse.json(
        { error: 'SQL 실행 중 오류가 발생했습니다.', details: sqlError },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('샘플 데이터 생성 오류:', error)
    return NextResponse.json(
      { error: '샘플 데이터 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}