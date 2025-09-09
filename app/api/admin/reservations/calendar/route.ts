import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())
    const accommodationId = searchParams.get('accommodation_id')

    // 해당 월의 시작과 끝 날짜 계산
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    let query = supabase
      .from('reservations')
      .select(`
        id,
        reservation_number,
        checkin_date,
        checkout_date,
        guest_count,
        guest_name,
        status,
        payment_status,
        total_amount,
        accommodation:accommodations(
          id,
          name,
          accommodation_type,
          host:hosts(
            id,
            business_name
          )
        )
      `)
      .or(`checkin_date.gte.${startDate},checkout_date.lte.${endDate}`)
      .eq('status', 'confirmed')

    if (accommodationId && accommodationId !== 'all') {
      query = query.eq('accommodation_id', accommodationId)
    }

    const { data: reservations, error } = await query
      .order('checkin_date', { ascending: true })

    if (error) {
      console.error('예약 캘린더 조회 실패:', error)
      return NextResponse.json({ error: '예약 캘린더 조회에 실패했습니다.' }, { status: 500 })
    }

    // 공휴일 정보 가져오기
    const holidays = await getHolidays(year, month)

    // 캘린더 데이터 구성
    const calendarData = {
      year,
      month,
      reservations: reservations || [],
      holidays: holidays || [],
      summary: {
        totalReservations: reservations?.length || 0,
        totalGuests: reservations?.reduce((sum, r) => sum + (r.guest_count || 0), 0) || 0,
        totalRevenue: reservations?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0,
        byStatus: {
          confirmed: reservations?.filter(r => r.status === 'confirmed').length || 0,
          cancelled: reservations?.filter(r => r.status === 'cancelled').length || 0,
          completed: reservations?.filter(r => r.status === 'completed').length || 0
        },
        byPaymentStatus: {
          paid: reservations?.filter(r => r.payment_status === 'paid').length || 0,
          pending: reservations?.filter(r => r.payment_status === 'pending').length || 0,
          cancelled: reservations?.filter(r => r.payment_status === 'cancelled').length || 0
        }
      }
    }

    return NextResponse.json({ data: calendarData })

  } catch (error) {
    console.error('예약 캘린더 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 공휴일 정보 가져오기 (한국천문연구원 API)
async function getHolidays(year: number, month: number) {
  try {
    const holidayApiKey = process.env.HOLIDAY_API_KEY
    if (!holidayApiKey) {
      console.log('공휴일 API 키가 설정되지 않았습니다.')
      return []
    }

    const monthStr = month.toString().padStart(2, '0')
    const url = `http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo`
    const params = new URLSearchParams({
      serviceKey: holidayApiKey,
      solYear: year.toString(),
      solMonth: monthStr,
      _type: 'json'
    })

    const response = await fetch(`${url}?${params}`)
    const data = await response.json()

    if (data.response?.body?.items?.item) {
      const items = Array.isArray(data.response.body.items.item) 
        ? data.response.body.items.item 
        : [data.response.body.items.item]
      
      return items.map((item: any) => ({
        date: item.locdate?.toString(),
        name: item.dateName,
        isHoliday: item.isHoliday === 'Y'
      }))
    }

    return []
  } catch (error) {
    console.error('공휴일 API 호출 실패:', error)
    return []
  }
}