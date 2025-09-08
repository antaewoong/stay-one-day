export interface Holiday {
  date: string // YYYYMMDD 형식
  name: string // 공휴일명
  type: string // 공휴일 유형 (국경일, 기념일, 24절기, 잡절)
  isHoliday: boolean
}

export interface HolidayApiResponse {
  success: boolean
  data: Holiday[]
  totalCount: number
  error?: string
}