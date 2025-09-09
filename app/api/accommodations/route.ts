import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// 숙소 목록 조회 (GET)
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // URL 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const location = searchParams.get('location')
    const type = searchParams.get('type')
    const date = searchParams.get('date')
    const guests = parseInt(searchParams.get('guests') || '0')
    const min_price = searchParams.get('min_price')
    const max_price = searchParams.get('max_price')
    const amenities = searchParams.get('amenities')?.split(',')
    const rating = parseFloat(searchParams.get('rating') || '0')

    // 기본 쿼리 구성 (편의시설 정보 포함)
    let query = supabase
      .from('accommodations')
      .select(`
        *,
        accommodation_amenities(
          id,
          amenity_type,
          amenity_name,
          is_available,
          additional_info
        )
      `)
      .order('created_at', { ascending: false })

    // 필터 적용
    if (location) {
      query = query.or(`address.ilike.%${location}%,region.ilike.%${location}%`)
    }
    
    if (type) {
      query = query.eq('accommodation_type', type)
    }
    
    if (guests > 0) {
      query = query.gte('max_capacity', guests)
    }
    
    if (min_price) {
      query = query.gte('base_price', parseInt(min_price))
    }
    
    if (max_price) {
      query = query.lte('base_price', parseInt(max_price))
    }
    
    if (rating > 0) {
      query = query.gte('rating', rating)
    }

    // 기존 DB에는 amenities 컬럼이 없으므로 주석 처리
    // if (amenities && amenities.length > 0) {
    //   amenities.forEach(amenity => {
    //     query = query.contains('amenities', [amenity])
    //   })
    // }

    // 날짜별 예약 불가 체크 (해당 날짜에 이미 예약이 있는 숙소 제외)
    if (date) {
      const { data: bookedAccommodations } = await supabase
        .from('reservations')
        .select('accommodation_id')
        .eq('reservation_date', date)
        .in('status', ['pending', 'confirmed'])

      if (bookedAccommodations && bookedAccommodations.length > 0) {
        const bookedIds = bookedAccommodations.map(res => res.accommodation_id)
        query = query.not('id', 'in', `(${bookedIds.join(',')})`)
      }
    }

    // 페이지네이션
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    const { data: accommodations, error, count } = await query
      .select('*')
      .range(from, to)

    if (error) {
      console.error('숙소 조회 실패:', error)
      return NextResponse.json({ error: '숙소 조회에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      data: accommodations,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      },
      filters: {
        location,
        type,
        date,
        guests,
        min_price,
        max_price,
        amenities,
        rating
      }
    })

  } catch (error) {
    console.error('숙소 조회 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 숙소 생성 (POST) - 호스트 인증 필요
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 호스트 인증 확인 (Authorization 헤더가 있는 경우에만)
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '').replace(/\\!/g, '!') // 이스케이프된 !를 복구
      
      // 슈퍼 어드민 패스워드 체크 - 관리자도 숙소 등록 가능
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD
      if (token === adminPassword) {
        // 관리자 인증 성공
      } else {
        // JWT 토큰으로 호스트 권한 확인
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        
        if (authError || !user) {
          return NextResponse.json(
            { error: '인증이 필요합니다.' },
            { status: 401 }
          )
        }
      }
    }
    
    const body = await request.json()
    
    const {
      name,
      description,
      location,
      type,
      base_price,
      max_guests = 10,
      check_in_time = '15:00',
      check_out_time = '11:00',
      amenities,
      options,
      images,
      host_id
    } = body

    if (!name || !location || !type || !base_price || !host_id) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('accommodations')
      .insert({
        name,
        description,
        accommodation_type: type,
        address: location,
        region: location.split(' ')[0], // 첫 번째 단어를 지역으로 사용
        max_capacity: parseInt(max_guests),
        base_price: parseInt(base_price),
        checkin_time: check_in_time + ':00',
        checkout_time: check_out_time + ':00',
        extra_options: options || [],
        images: images || [],
        host_id,
        status: 'pending',
        is_featured: false,
        bedrooms: 1,
        bathrooms: 1,
        weekend_price: parseInt(base_price) * 1.2
      })
      .select()
      .single()

    if (error) {
      console.error('숙소 생성 오류:', error)
      return NextResponse.json(
        { error: '숙소를 생성하는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 편의시설 정보 저장 (accommodation_amenities 테이블)
    if (amenities && amenities.length > 0) {
      const amenityData = amenities.map((amenity: string) => ({
        accommodation_id: data.id,
        amenity_type: amenity.toLowerCase().replace(/\s+/g, '_'),
        amenity_name: amenity,
        is_available: true
      }))

      const { error: amenityError } = await supabase
        .from('accommodation_amenities')
        .insert(amenityData)

      if (amenityError) {
        console.error('편의시설 저장 실패:', amenityError)
        // 편의시설 저장 실패해도 숙소 등록은 성공으로 처리
      }
    }

    return NextResponse.json({ data }, { status: 201 })

  } catch (error) {
    console.error('숙소 생성 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}