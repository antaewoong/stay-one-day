// YYYY-MM-DD (KST) 포맷터
export function formatKSTDate(d: Date) {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// KST 기준으로 Date 생성 (서버는 UTC여도 안전)
export function toKST(date = new Date()) {
  const utcMs = date.getTime()
  const KST_OFFSET = 9 * 60 * 60 * 1000
  return new Date(utcMs + KST_OFFSET)
}

// KST 기준 주 시작(월요일 00:00) 반환: YYYY-MM-DD
export function startOfWeekKST(date = new Date()): string {
  const kst = toKST(date)
  const day = kst.getUTCDay() // 0=일, 1=월 ...
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(kst)
  monday.setUTCDate(kst.getUTCDate() + mondayOffset)
  monday.setUTCHours(0, 0, 0, 0)
  return formatKSTDate(monday)
}

// 다음 주 월요일(다음 사용 가능일) YYYY-MM-DD
export function nextMondayKST(date = new Date()): string {
  const kst = toKST(date)
  const day = kst.getUTCDay() // 0=일
  const daysUntilNextMon = day === 0 ? 1 : 8 - day
  const nextMon = new Date(kst)
  nextMon.setUTCDate(kst.getUTCDate() + daysUntilNextMon)
  nextMon.setUTCHours(0, 0, 0, 0)
  return formatKSTDate(nextMon)
}