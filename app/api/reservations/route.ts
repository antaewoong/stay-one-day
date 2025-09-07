import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  validateReservationForm, 
  calculateReservationPrice,
  formatPhoneNumber 
} from '@/lib/utils/reservation'
import { CreateReservationData } from '@/lib/types/reservation'

// 예약 목록 조회 (GET)
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // URL 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const accommodation_id = searchParams.get('accommodation_id')

    // 기본 쿼리 구성
    let query = supabase
      .from('reservations')
      .select(`
        *,
        accommodations (
          id,
          name,
          location,
          type,
          images
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // 필터 적용
    if (status) {
      query = query.eq('status', status)
    }
    
    if (accommodation_id) {
      query = query.eq('accommodation_id', accommodation_id)
    }

    // 페이지네이션
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    const { data: reservations, error, count } = await query
      .select('*')
      .range(from, to)

    if (error) {
      console.error('예약 조회 실패:', error)
      return NextResponse.json({ error: '예약 조회에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      data: reservations,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('예약 조회 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 새 예약 생성 (POST)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 요청 데이터 파싱
    const reservationData: CreateReservationData = await request.json()

    // 숙소 정보 조회
    const { data: accommodation, error: accommodationError } = await supabase
      .from('accommodations')
      .select('*')
      .eq('id', reservationData.accommodation_id)
      .eq('is_active', true)
      .single()

    if (accommodationError || !accommodation) {
      return NextResponse.json(
        { error: '존재하지 않거나 이용할 수 없는 숙소입니다.' },
        { status: 404 }
      )
    }

    // 폼 유효성 검사
    const validation = validateReservationForm(reservationData, accommodation)
    if (!validation.valid) {
      return NextResponse.json(
        { error: '입력 정보를 확인해주세요.', errors: validation.errors },
        { status: 400 }
      )
    }

    // 예약 날짜 중복 체크 (같은 숙소, 같은 날짜)
    const { data: existingReservations } = await supabase
      .from('reservations')
      .select('id')
      .eq('accommodation_id', reservationData.accommodation_id)
      .eq('reservation_date', reservationData.reservation_date)
      .in('status', ['pending', 'confirmed'])

    if (existingReservations && existingReservations.length > 0) {
      return NextResponse.json(
        { error: '해당 날짜에 이미 예약이 있습니다.' },
        { status: 409 }
      )
    }

    // 가격 계산
    const priceCalculation = calculateReservationPrice(
      accommodation,
      reservationData.guest_count,
      reservationData.selected_options
    )

    // 예약 데이터 생성
    const newReservation = {
      user_id: user.id,
      accommodation_id: reservationData.accommodation_id,
      reservation_date: reservationData.reservation_date,
      guest_count: reservationData.guest_count,
      selected_options: reservationData.selected_options,
      base_price: priceCalculation.base_price,
      additional_guest_cost: priceCalculation.additional_guest_cost,
      options_cost: priceCalculation.options_cost,
      total_price: priceCalculation.total_price,
      guest_name: reservationData.guest_name.trim(),
      guest_phone: formatPhoneNumber(reservationData.guest_phone),
      guest_email: reservationData.guest_email?.trim() || null,
      special_requests: reservationData.special_requests?.trim() || null,
      status: 'pending',
      payment_status: 'pending'
    }

    // 데이터베이스에 예약 저장
    const { data: savedReservation, error: saveError } = await supabase
      .from('reservations')
      .insert(newReservation)
      .select(`
        *,
        accommodations (
          id,
          name,
          location,
          type,
          images,
          check_in_time,
          check_out_time
        )
      `)
      .single()

    if (saveError) {
      console.error('예약 저장 실패:', saveError)
      return NextResponse.json(
        { error: '예약 저장에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 성공 응답
    return NextResponse.json({
      message: '예약이 성공적으로 생성되었습니다.',
      data: {
        reservation: savedReservation,
        price_breakdown: priceCalculation.price_breakdown
      }
    }, { status: 201 })

  } catch (error) {
    console.error('예약 생성 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}