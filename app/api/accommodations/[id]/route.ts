import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 특정 숙소 상세 정보 조회 (GET)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const accommodationId = params.id

    // URL 쿼리 파라미터에서 날짜 확인 (예약 가능 여부 체크용)
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    // 숙소 정보 조회 (편의시설 정보 포함)
    const { data: accommodation, error } = await supabase
      .from('accommodations')
      .select(`
        *,
        accommodation_amenities(
          id,
          amenity_type,
          amenity_name,
          is_available,
          additional_info
        ),
        accommodation_types(
          id,
          type_name
        )
      `)
      .eq('id', accommodationId)
      .eq('status', 'active')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: '숙소를 찾을 수 없습니다.' }, { status: 404 })
      }
      console.error('숙소 조회 실패:', error)
      return NextResponse.json({ error: '숙소 조회에 실패했습니다.' }, { status: 500 })
    }

    // 해당 날짜의 예약 가능 여부 확인
    let is_available = true
    let availability_message = ''

    if (date) {
      const { data: existingReservations, error: reservationError } = await supabase
        .from('reservations')
        .select('id, status')
        .eq('accommodation_id', accommodationId)
        .eq('reservation_date', date)
        .in('status', ['pending', 'confirmed'])

      if (!reservationError && existingReservations && existingReservations.length > 0) {
        is_available = false
        availability_message = '선택한 날짜에 이미 예약이 있습니다.'
      }
    }

    // 최근 리뷰 5개 조회
    const { data: reviews } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        user_id
      `)
      .eq('accommodation_id', accommodationId)
      .order('created_at', { ascending: false })
      .limit(5)

    // 관련 숙소 추천 (같은 지역, 같은 타입)
    const regionKeyword = accommodation.region // 기존 DB의 region 컬럼 사용
    
    const { data: relatedAccommodations } = await supabase
      .from('accommodations')
      .select('id, name, address, accommodation_type, base_price')
      .eq('status', 'active')
      .neq('id', accommodationId)
      .or(`region.eq.${regionKeyword},accommodation_type.eq.${accommodation.accommodation_type}`)
      .limit(6)

    // 이미지 URL 정제
    let processedImages = []
    if (accommodation.images) {
      if (Array.isArray(accommodation.images)) {
        processedImages = accommodation.images
          .filter(img => img && typeof img === 'string' && (img.startsWith('http') || img.startsWith('/')))
          .slice(0, 10) // 최대 10개 이미지만
      }
    }

    // 기본 이미지가 없으면 Unsplash placeholder 추가
    if (processedImages.length === 0) {
      processedImages = [
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&crop=center',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop&crop=center',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop&crop=center'
      ]
    }

    return NextResponse.json({
      data: {
        ...accommodation,
        images: processedImages,
        is_available,
        availability_message,
        reviews: reviews || [],
        related_accommodations: relatedAccommodations || []
      }
    })

  } catch (error) {
    console.error('숙소 상세 조회 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 숙소 예약 가능 날짜 조회 (GET /api/accommodations/[id]/availability)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const accommodationId = params.id
    
    // 요청 데이터에서 날짜 범위 파싱
    const { start_date, end_date } = await request.json()
    
    if (!start_date || !end_date) {
      return NextResponse.json(
        { error: '시작 날짜와 종료 날짜를 제공해주세요.' },
        { status: 400 }
      )
    }

    // 숙소 존재 확인
    const { data: accommodation, error: accommodationError } = await supabase
      .from('accommodations')
      .select('id, name')
      .eq('id', accommodationId)
      .eq('status', 'active')
      .single()

    if (accommodationError || !accommodation) {
      return NextResponse.json({ error: '숙소를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 해당 기간의 예약 현황 조회
    const { data: reservations, error: reservationError } = await supabase
      .from('reservations')
      .select('reservation_date, status')
      .eq('accommodation_id', accommodationId)
      .gte('reservation_date', start_date)
      .lte('reservation_date', end_date)
      .in('status', ['pending', 'confirmed'])

    if (reservationError) {
      console.error('예약 현황 조회 실패:', reservationError)
      return NextResponse.json({ error: '예약 현황 조회에 실패했습니다.' }, { status: 500 })
    }

    // 예약된 날짜들 추출
    const bookedDates = reservations?.map(res => res.reservation_date) || []

    // 날짜 범위 생성
    const availableDates = []
    const unavailableDates = []
    
    const startDate = new Date(start_date)
    const endDate = new Date(end_date)
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0]
      
      if (bookedDates.includes(dateString)) {
        unavailableDates.push(dateString)
      } else {
        availableDates.push(dateString)
      }
    }

    return NextResponse.json({
      data: {
        accommodation_id: accommodationId,
        accommodation_name: accommodation.name,
        period: {
          start_date,
          end_date
        },
        available_dates: availableDates,
        unavailable_dates: unavailableDates,
        total_days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
        available_count: availableDates.length,
        unavailable_count: unavailableDates.length
      }
    })

  } catch (error) {
    console.error('예약 가능 날짜 조회 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 숙소 정보 수정 (PUT)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const accommodationId = params.id
    const body = await request.json()
    
    const {
      name,
      description,
      location,
      type,
      accommodation_types,
      base_price,
      base_guests,
      additional_guest_fee,
      max_guests,
      check_in_time,
      check_out_time,
      amenities,
      options,
      images,
      is_active,
      approval_status
    } = body

    // 숙소 존재 확인
    const { data: existingAccommodation, error: checkError } = await supabase
      .from('accommodations')
      .select('id, host_id')
      .eq('id', accommodationId)
      .single()

    if (checkError || !existingAccommodation) {
      return NextResponse.json({ error: '숙소를 찾을 수 없습니다.' }, { status: 404 })
    }

    const updateData: any = { updated_at: new Date().toISOString() }
    
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (location !== undefined) {
      updateData.address = location
      updateData.region = location.split(' ')[0] // 첫 번째 단어를 지역으로 사용
    }
    if (type !== undefined) updateData.accommodation_type = type
    if (base_price !== undefined) updateData.base_price = parseInt(base_price)
    if (base_guests !== undefined) updateData.base_capacity = parseInt(base_guests)
    if (additional_guest_fee !== undefined) updateData.additional_guest_fee = parseInt(additional_guest_fee)
    if (max_guests !== undefined) updateData.max_capacity = parseInt(max_guests)
    if (check_in_time !== undefined) updateData.checkin_time = check_in_time + (check_in_time.includes(':') && !check_in_time.includes(':', check_in_time.indexOf(':') + 1) ? ':00' : '')
    if (check_out_time !== undefined) updateData.checkout_time = check_out_time + (check_out_time.includes(':') && !check_out_time.includes(':', check_out_time.indexOf(':') + 1) ? ':00' : '')
    // amenities는 별도 테이블에서 관리하므로 accommodations 테이블에서 제거
    if (options !== undefined) updateData.extra_options = options
    if (images !== undefined) updateData.images = images
    if (is_active !== undefined) updateData.is_active = is_active
    if (approval_status !== undefined) updateData.status = approval_status

    const { data, error } = await supabase
      .from('accommodations')
      .update(updateData)
      .eq('id', accommodationId)
      .select()
      .single()

    if (error) {
      console.error('숙소 수정 오류:', error)
      return NextResponse.json(
        { error: '숙소 수정 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 숙소 유형 업데이트 (accommodation_types 테이블)
    if (accommodation_types !== undefined) {
      // 기존 숙소 유형 삭제
      await supabase
        .from('accommodation_types')
        .delete()
        .eq('accommodation_id', accommodationId)

      // 새로운 숙소 유형 추가
      if (accommodation_types && accommodation_types.length > 0) {
        const typeData = accommodation_types.map((typeName: string) => ({
          accommodation_id: accommodationId,
          type_name: typeName
        }))

        const { error: typeError } = await supabase
          .from('accommodation_types')
          .insert(typeData)

        if (typeError) {
          console.error('숙소 유형 업데이트 실패:', typeError)
        }
      }
    }

    // 편의시설 업데이트 (accommodation_amenities 테이블)
    if (amenities !== undefined) {
      // 기존 편의시설 삭제
      await supabase
        .from('accommodation_amenities')
        .delete()
        .eq('accommodation_id', accommodationId)

      // 새로운 편의시설 추가
      if (amenities && amenities.length > 0) {
        const amenityData = amenities.map((amenity: any) => ({
          accommodation_id: accommodationId,
          amenity_type: amenity.type || amenity.toLowerCase().replace(/\s+/g, '_'),
          amenity_name: amenity.name || amenity,
          is_available: amenity.available !== undefined ? amenity.available : true
        }))

        const { error: amenityError } = await supabase
          .from('accommodation_amenities')
          .insert(amenityData)

        if (amenityError) {
          console.error('편의시설 업데이트 실패:', amenityError)
        }
      }
    }

    return NextResponse.json({ data })

  } catch (error) {
    console.error('숙소 수정 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 숙소 삭제 (DELETE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const accommodationId = params.id

    // 숙소 존재 확인
    const { data: existingAccommodation, error: checkError } = await supabase
      .from('accommodations')
      .select('id, name')
      .eq('id', accommodationId)
      .single()

    if (checkError || !existingAccommodation) {
      return NextResponse.json({ error: '숙소를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 활성 예약이 있는지 확인
    const { data: activeReservations } = await supabase
      .from('reservations')
      .select('id')
      .eq('accommodation_id', accommodationId)
      .in('status', ['pending', 'confirmed'])
      .limit(1)

    if (activeReservations && activeReservations.length > 0) {
      return NextResponse.json(
        { error: '활성 예약이 있는 숙소는 삭제할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 소프트 삭제 (is_active = false로 설정)
    const { data, error } = await supabase
      .from('accommodations')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', accommodationId)
      .select()
      .single()

    if (error) {
      console.error('숙소 삭제 오류:', error)
      return NextResponse.json(
        { error: '숙소 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: '숙소가 성공적으로 삭제되었습니다.',
      data 
    })

  } catch (error) {
    console.error('숙소 삭제 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}