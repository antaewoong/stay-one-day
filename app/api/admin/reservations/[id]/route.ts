import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params

    const { data: reservation, error } = await supabase
      .from('reservations')
      .select(`
        *,
        accommodation:accommodations(
          id,
          name,
          accommodation_type,
          address,
          detailed_address,
          base_price,
          weekend_price,
          checkin_time,
          checkout_time,
          images,
          host:hosts(
            id,
            business_name,
            representative_name,
            phone,
            email
          )
        ),
        payments:payments(
          id,
          payment_key,
          order_id,
          amount,
          payment_method,
          status,
          approved_at,
          receipt_url
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('예약 상세 조회 실패:', error)
      return NextResponse.json({ error: '예약을 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ data: reservation })

  } catch (error) {
    console.error('예약 상세 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params
    const body = await request.json()
    
    const { 
      status, 
      payment_status, 
      special_requests,
      checkin_date,
      checkout_date,
      guest_count,
      guest_name,
      guest_phone,
      guest_email
    } = body

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status) updateData.status = status
    if (payment_status) updateData.payment_status = payment_status
    if (special_requests !== undefined) updateData.special_requests = special_requests
    if (checkin_date) updateData.checkin_date = checkin_date
    if (checkout_date) updateData.checkout_date = checkout_date
    if (guest_count) updateData.guest_count = guest_count
    if (guest_name) updateData.guest_name = guest_name
    if (guest_phone) updateData.guest_phone = guest_phone
    if (guest_email) updateData.guest_email = guest_email

    const { data: reservation, error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        accommodation:accommodations(
          id,
          name,
          accommodation_type,
          address,
          detailed_address,
          base_price,
          weekend_price,
          checkin_time,
          checkout_time,
          images,
          host:hosts(
            id,
            business_name,
            representative_name,
            phone,
            email
          )
        ),
        payments:payments(
          id,
          payment_key,
          order_id,
          amount,
          payment_method,
          status,
          approved_at,
          receipt_url
        )
      `)
      .single()

    if (error) {
      console.error('예약 업데이트 실패:', error)
      return NextResponse.json({ error: '예약 업데이트에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ data: reservation })

  } catch (error) {
    console.error('예약 업데이트 API 오러:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}