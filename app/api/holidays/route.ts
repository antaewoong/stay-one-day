import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface HolidayItem {
  dateKind: string // 01: 국경일, 02: 기념일, 03: 24절기, 04: 잡절
  dateName: string // 공휴일명
  locdate: string  // 날짜 (YYYYMMDD)
  isHoliday: string // Y: 공휴일, N: 평일
}

interface ApiResponse {
  response: {
    header: {
      resultCode: string
      resultMsg: string
    }
    body: {
      items?: {
        item: HolidayItem[]
      }
      totalCount: number
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year') || new Date().getFullYear().toString()
    const month = searchParams.get('month')
    
    // 한국천문연구원 특일정보 API
    const serviceKey = process.env.HOLIDAY_API_KEY
    if (!serviceKey) {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 })
    }

    let apiUrl = `http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo`
    apiUrl += `?serviceKey=${serviceKey}`
    apiUrl += `&solYear=${year}`
    
    if (month) {
      const monthStr = month.padStart(2, '0')
      apiUrl += `&solMonth=${monthStr}`
    }
    
    apiUrl += `&_type=json`
    apiUrl += `&numOfRows=50`

    console.log('공휴일 API 호출:', apiUrl.replace(serviceKey, '[API_KEY]'))

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`)
    }

    const data: ApiResponse = await response.json()
    
    if (data.response.header.resultCode !== '00') {
      throw new Error(`API 오류: ${data.response.header.resultMsg}`)
    }

    const holidays = data.response.body.items?.item || []
    
    // 공휴일만 필터링하고 포맷팅
    const processedHolidays = holidays
      .filter(holiday => holiday.isHoliday === 'Y')
      .map(holiday => ({
        date: holiday.locdate.toString(), // 문자열로 변환
        name: holiday.dateName,
        type: getHolidayType(holiday.dateKind),
        isHoliday: true
      }))

    return NextResponse.json({
      success: true,
      data: processedHolidays,
      totalCount: processedHolidays.length
    })

  } catch (error) {
    console.error('공휴일 API 오류:', error)
    return NextResponse.json(
      { 
        error: '공휴일 정보를 가져오는데 실패했습니다.', 
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      }, 
      { status: 500 }
    )
  }
}

function getHolidayType(dateKind: string): string {
  switch (dateKind) {
    case '01':
      return '국경일'
    case '02':
      return '기념일'
    case '03':
      return '24절기'
    case '04':
      return '잡절'
    default:
      return '공휴일'
  }
}

// 개발용 목업 데이터 (API 키가 없을 때 사용)
function getMockHolidays(year: string, month?: string) {
  const mockData = [
    { date: '20250101', name: '신정', type: '국경일', isHoliday: true },
    { date: '20250128', name: '설날 연휴', type: '국경일', isHoliday: true },
    { date: '20250129', name: '설날', type: '국경일', isHoliday: true },
    { date: '20250130', name: '설날 연휴', type: '국경일', isHoliday: true },
    { date: '20250301', name: '삼일절', type: '국경일', isHoliday: true },
    { date: '20250505', name: '어린이날', type: '기념일', isHoliday: true },
    { date: '20250506', name: '대체공휴일', type: '기념일', isHoliday: true },
    { date: '20250515', name: '부처님오신날', type: '기념일', isHoliday: true },
    { date: '20250606', name: '현충일', type: '기념일', isHoliday: true },
    { date: '20250815', name: '광복절', type: '국경일', isHoliday: true },
    { date: '20251003', name: '개천절', type: '국경일', isHoliday: true },
    { date: '20251006', name: '대체공휴일', type: '국경일', isHoliday: true },
    { date: '20251009', name: '한글날', type: '국경일', isHoliday: true },
    { date: '20251225', name: '크리스마스', type: '기념일', isHoliday: true }
  ]

  return mockData.filter(holiday => {
    if (month) {
      return holiday.date.startsWith(`${year}${month.padStart(2, '0')}`)
    }
    return holiday.date.startsWith(year)
  })
}