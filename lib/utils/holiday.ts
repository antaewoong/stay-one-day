import { Holiday, HolidayApiResponse } from '@/lib/types/holiday'

/**
 * 공휴일 정보를 가져오는 함수
 * @param year 연도 (기본값: 현재 연도)
 * @param month 월 (선택사항, 1-12)
 * @returns Promise<Holiday[]>
 */
export async function fetchHolidays(year?: number, month?: number): Promise<Holiday[]> {
  try {
    const currentYear = year || new Date().getFullYear()
    let apiUrl = `/api/holidays?year=${currentYear}`
    
    if (month) {
      apiUrl += `&month=${month}`
    }

    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: HolidayApiResponse = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || '공휴일 정보를 가져오는데 실패했습니다.')
    }

    return result.data
  } catch (error) {
    console.error('공휴일 정보 가져오기 실패:', error)
    return []
  }
}

/**
 * 특정 날짜가 공휴일인지 확인하는 함수
 * @param date Date 객체 또는 YYYYMMDD 형식 문자열
 * @param holidays 공휴일 배열
 * @returns Holiday 객체 또는 null
 */
export function getHolidayInfo(date: Date | string, holidays: Holiday[]): Holiday | null {
  const dateStr = typeof date === 'string' 
    ? date 
    : formatDateToYYYYMMDD(date)

  return holidays.find(holiday => holiday.date === dateStr) || null
}

/**
 * Date 객체를 YYYYMMDD 형식 문자열로 변환
 * @param date Date 객체
 * @returns YYYYMMDD 형식 문자열
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}${month}${day}`
}

/**
 * YYYYMMDD 형식 문자열을 Date 객체로 변환
 * @param dateStr YYYYMMDD 형식 문자열
 * @returns Date 객체
 */
export function parseYYYYMMDD(dateStr: string): Date {
  const year = parseInt(dateStr.substring(0, 4))
  const month = parseInt(dateStr.substring(4, 6)) - 1 // Date의 월은 0부터 시작
  const day = parseInt(dateStr.substring(6, 8))
  return new Date(year, month, day)
}

/**
 * 주말인지 확인하는 함수
 * @param date Date 객체
 * @returns boolean (토요일: 6, 일요일: 0)
 */
export function isWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay()
  return dayOfWeek === 0 || dayOfWeek === 6
}

/**
 * 공휴일 유형에 따른 색상 클래스 반환
 * @param type 공휴일 유형
 * @returns Tailwind CSS 색상 클래스
 */
export function getHolidayColorClass(type: string): string {
  switch (type) {
    case '국경일':
      return 'text-red-600 bg-red-50'
    case '기념일':
      return 'text-blue-600 bg-blue-50'
    case '24절기':
      return 'text-green-600 bg-green-50'
    case '잡절':
      return 'text-purple-600 bg-purple-50'
    default:
      return 'text-orange-600 bg-orange-50'
  }
}