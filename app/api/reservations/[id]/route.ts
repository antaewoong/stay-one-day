import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canCancelReservation } from '@/lib/utils/reservation'

// 특정 예약 조회 (GET)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const reservationId = params.id

    // 예약 정보 조회
    const { data: reservation, error } = await supabase
      .from('reservations')
      .select(`
        *,
        accommodations (
          id,
          name,
          description,
          location,
          type,
          images,
          amenities,
          options,
          check_in_time,
          check_out_time,
          rating,
          review_count
        )
      `)
      .eq('id', reservationId)
      .eq('user_id', user.id) // 본인 예약만 조회 가능
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: '예약을 찾을 수 없습니다.' }, { status: 404 })
      }
      console.error('예약 조회 실패:', error)
      return NextResponse.json({ error: '예약 조회에 실패했습니다.' }, { status: 500 })
    }

    // 취소 가능 여부 확인
    const cancelInfo = canCancelReservation(reservation.reservation_date, reservation.status)

    return NextResponse.json({
      data: {
        ...reservation,
        can_cancel: cancelInfo.canCancel,
        cancel_reason: cancelInfo.reason
      }
    })

  } catch (error) {
    console.error('예약 조회 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 예약 수정 (PATCH)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const reservationId = params.id
    const updates = await request.json()

    // 기존 예약 정보 조회
    const { data: existingReservation, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingReservation) {
      return NextResponse.json({ error: '예약을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 수정 가능한 상태인지 확인
    if (existingReservation.status !== 'pending') {
      return NextResponse.json(
        { error: '대기 중인 예약만 수정할 수 있습니다.' },
        { status: 400 }
      )
    }

    // 수정 가능한 필드만 허용
    const allowedFields = ['guest_name', 'guest_phone', 'guest_email', 'special_requests']
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key]
        return obj
      }, {} as any)

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: '수정할 수 있는 필드가 없습니다.' }, { status: 400 })
    }

    // 전화번호 포맷팅
    if (filteredUpdates.guest_phone) {
      const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/
      const cleanPhone = filteredUpdates.guest_phone.replace(/-/g, '')
      
      if (!phoneRegex.test(cleanPhone)) {
        return NextResponse.json(
          { error: '올바른 전화번호 형식이 아닙니다.' },
          { status: 400 }
        )
      }
      
      filteredUpdates.guest_phone = cleanPhone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
    }

    // 이메일 유효성 검사
    if (filteredUpdates.guest_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(filteredUpdates.guest_email)) {
        return NextResponse.json(
          { error: '올바른 이메일 형식이 아닙니다.' },
          { status: 400 }
        )
      }
    }

    // 예약 수정
    const { data: updatedReservation, error: updateError } = await supabase
      .from('reservations')
      .update({
        ...filteredUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', reservationId)
      .eq('user_id', user.id)
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
      .single()

    if (updateError) {
      console.error('예약 수정 실패:', updateError)
      return NextResponse.json({ error: '예약 수정에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      message: '예약이 성공적으로 수정되었습니다.',
      data: updatedReservation
    })

  } catch (error) {
    console.error('예약 수정 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 예약 취소 (DELETE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const reservationId = params.id

    // 기존 예약 정보 조회
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !reservation) {
      return NextResponse.json({ error: '예약을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 취소 가능 여부 확인
    const cancelInfo = canCancelReservation(reservation.reservation_date, reservation.status)
    if (!cancelInfo.canCancel) {
      return NextResponse.json(
        { error: cancelInfo.reason },
        { status: 400 }
      )
    }

    // 예약 취소 처리 (상태만 변경, 데이터는 보존)
    const { data: cancelledReservation, error: cancelError } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', reservationId)
      .eq('user_id', user.id)
      .select(`
        *,
        accommodations (
          id,
          name,
          location,
          type
        )
      `)
      .single()

    if (cancelError) {
      console.error('예약 취소 실패:', cancelError)
      return NextResponse.json({ error: '예약 취소에 실패했습니다.' }, { status: 500 })
    }

    // TODO: 결제가 완료된 예약의 경우 환불 처리 로직 추가
    if (reservation.payment_status === 'paid') {
      // 토스페이먼트 환불 API 호출 로직을 여기에 추가
      console.log('환불 처리 필요:', reservationId)
    }

    return NextResponse.json({
      message: '예약이 성공적으로 취소되었습니다.',
      data: cancelledReservation
    })

  } catch (error) {
    console.error('예약 취소 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}