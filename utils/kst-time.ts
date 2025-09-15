/**
 * KST 시간 계산 유틸리티
 * 한국 시간 기준으로 주차 계산 및 날짜 처리
 */

import { addDays, startOfWeek, format, parseISO } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

const KST_TIMEZONE = 'Asia/Seoul'

/**
 * 현재 KST 시간 반환
 */
export function nowKST(): Date {
  return new Date()
}

/**
 * KST 기준 주의 시작일(월요일) 반환
 * @param date KST 날짜 (선택사항, 기본값은 현재 시간)
 */
export function startOfWeekKST(date?: Date): Date {
  const kstDate = date || nowKST()
  return startOfWeek(kstDate, { weekStartsOn: 1 }) // 월요일 시작
}

/**
 * 다음 주 월요일 KST 반환 (쿼터 리셋 날짜)
 * @param date KST 날짜 (선택사항, 기본값은 현재 시간)
 */
export function nextMondayKST(date?: Date): Date {
  const currentWeekStart = startOfWeekKST(date)
  return addDays(currentWeekStart, 7)
}

/**
 * KST 날짜를 YYYY-MM-DD 형식으로 포맷
 */
export function formatDateKST(date: Date, formatStr: string = 'yyyy-MM-dd'): string {
  return formatInTimeZone(date, KST_TIMEZONE, formatStr)
}

/**
 * UTC 시간을 KST로 변환
 */
export function toKST(utcDate: Date): Date {
  return utcDate
}

/**
 * KST 시간을 UTC로 변환
 */
export function fromKST(kstDate: Date): Date {
  return kstDate
}

/**
 * 현재 KST 기준 주차 정보 반환
 */
export function getCurrentWeekInfo() {
  const now = nowKST()
  const weekStart = startOfWeekKST(now)
  const nextWeek = nextMondayKST(now)

  return {
    current: now,
    weekStart,
    nextWeekStart: nextWeek,
    weekStartFormatted: formatDateKST(weekStart),
    nextWeekFormatted: formatDateKST(nextWeek)
  }
}

/**
 * 두 KST 날짜가 같은 주인지 확인
 */
export function isSameWeekKST(date1: Date, date2: Date): boolean {
  const week1Start = startOfWeekKST(date1)
  const week2Start = startOfWeekKST(date2)
  return formatDateKST(week1Start) === formatDateKST(week2Start)
}