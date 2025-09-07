// =============================================
// 예약 시스템 유틸리티 함수들
// =============================================

import { 
  Accommodation, 
  ReservationCalculation, 
  CreateReservationData,
  AccommodationOption 
} from '@/lib/types/reservation'

/**
 * 예약 총 가격 계산
 */
export function calculateReservationPrice(
  accommodation: Accommodation,
  guestCount: number,
  selectedOptions: string[] = []
): ReservationCalculation {
  // 기존 DB 스키마에는 base_price만 있으므로 간단하게 계산
  const base_price = accommodation.base_price
  
  // 기존 DB에는 추가 인원 비용 필드가 없으므로 0으로 설정
  const additional_guest_cost = 0
  
  // 기존 DB에는 options 필드가 없으므로 0으로 설정
  const options_cost = 0
  
  // 총 가격
  const total_price = base_price
  
  // 상세 내역
  const price_breakdown = {
    base: {
      guests: guestCount,
      price: base_price
    },
    additional_guests: {
      count: 0,
      price_per_guest: 0,
      total: 0
    },
    options: []
  }
  
  return {
    base_price,
    additional_guest_cost,
    options_cost,
    total_price,
    price_breakdown
  }
}

/**
 * 예약 날짜 유효성 검사
 */
export function validateReservationDate(date: string): { valid: boolean; error?: string } {
  const reservationDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // 과거 날짜 체크
  if (reservationDate < today) {
    return { valid: false, error: '과거 날짜는 선택할 수 없습니다.' }
  }
  
  // 너무 먼 미래 (1년 후) 체크
  const oneYearFromNow = new Date()
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
  if (reservationDate > oneYearFromNow) {
    return { valid: false, error: '예약은 1년 이내로만 가능합니다.' }
  }
  
  return { valid: true }
}

/**
 * 인원수 유효성 검사
 */
export function validateGuestCount(
  guestCount: number, 
  accommodation: Accommodation
): { valid: boolean; error?: string } {
  if (guestCount < 1) {
    return { valid: false, error: '최소 1명 이상 선택해주세요.' }
  }
  
  // 기존 DB 스키마의 max_capacity 사용
  if (guestCount > accommodation.max_capacity) {
    return { 
      valid: false, 
      error: `최대 ${accommodation.max_capacity}명까지만 이용 가능합니다.` 
    }
  }
  
  return { valid: true }
}

/**
 * 전화번호 형식 검증
 */
export function validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
  // 한국 휴대폰 번호 패턴 (010-1234-5678, 01012345678 등)
  const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/
  
  if (!phone) {
    return { valid: false, error: '전화번호를 입력해주세요.' }
  }
  
  // 하이픈 제거 후 검증
  const cleanPhone = phone.replace(/-/g, '')
  if (!phoneRegex.test(cleanPhone)) {
    return { valid: false, error: '올바른 전화번호 형식이 아닙니다.' }
  }
  
  return { valid: true }
}

/**
 * 이메일 형식 검증
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) return { valid: true } // 이메일은 선택사항
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: '올바른 이메일 형식이 아닙니다.' }
  }
  
  return { valid: true }
}

/**
 * 예약 폼 전체 유효성 검사
 */
export function validateReservationForm(
  data: CreateReservationData,
  accommodation: Accommodation
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  
  // 날짜 검증
  const dateValidation = validateReservationDate(data.reservation_date)
  if (!dateValidation.valid) {
    errors.reservation_date = dateValidation.error!
  }
  
  // 인원수 검증
  const guestValidation = validateGuestCount(data.guest_count, accommodation)
  if (!guestValidation.valid) {
    errors.guest_count = guestValidation.error!
  }
  
  // 예약자 이름 검증
  if (!data.guest_name.trim()) {
    errors.guest_name = '예약자 이름을 입력해주세요.'
  }
  
  // 전화번호 검증
  const phoneValidation = validatePhoneNumber(data.guest_phone)
  if (!phoneValidation.valid) {
    errors.guest_phone = phoneValidation.error!
  }
  
  // 이메일 검증
  if (data.guest_email) {
    const emailValidation = validateEmail(data.guest_email)
    if (!emailValidation.valid) {
      errors.guest_email = emailValidation.error!
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * 전화번호 포맷팅 (하이픈 추가)
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '')
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
  }
  
  return phone
}

/**
 * 가격 포맷팅 (천 단위 콤마)
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR').format(price)
}

/**
 * 날짜 포맷팅 (YYYY-MM-DD -> YYYY년 MM월 DD일)
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  })
}

/**
 * 시간 포맷팅 (24시간 -> 12시간)
 */
export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? '오후' : '오전'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  
  return `${ampm} ${displayHour}:${minutes}`
}

/**
 * 예약 상태 한글 변환
 */
export function getReservationStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': '예약 대기',
    'confirmed': '예약 확정',
    'cancelled': '예약 취소',
    'completed': '이용 완료'
  }
  
  return statusMap[status] || status
}

/**
 * 결제 상태 한글 변환
 */
export function getPaymentStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': '결제 대기',
    'paid': '결제 완료',
    'refunded': '환불 완료'
  }
  
  return statusMap[status] || status
}

/**
 * 취소 가능 여부 확인
 */
export function canCancelReservation(
  reservation_date: string,
  status: string
): { canCancel: boolean; reason?: string } {
  if (status !== 'pending' && status !== 'confirmed') {
    return { canCancel: false, reason: '이미 취소되었거나 완료된 예약입니다.' }
  }
  
  const reservationDate = new Date(reservation_date)
  const now = new Date()
  const hoursUntilReservation = (reservationDate.getTime() - now.getTime()) / (1000 * 60 * 60)
  
  if (hoursUntilReservation < 24) {
    return { 
      canCancel: false, 
      reason: '예약 일자 24시간 전까지만 취소 가능합니다.' 
    }
  }
  
  return { canCancel: true }
}

/**
 * 리뷰 작성 가능 여부 확인
 */
export function canWriteReview(
  reservation_date: string,
  status: string
): { canReview: boolean; reason?: string } {
  if (status !== 'completed') {
    return { canReview: false, reason: '이용 완료된 예약에만 리뷰를 작성할 수 있습니다.' }
  }
  
  const reservationDate = new Date(reservation_date)
  const now = new Date()
  const daysSinceReservation = (now.getTime() - reservationDate.getTime()) / (1000 * 60 * 60 * 24)
  
  if (daysSinceReservation > 30) {
    return { 
      canReview: false, 
      reason: '리뷰는 이용일로부터 30일 이내에만 작성 가능합니다.' 
    }
  }
  
  return { canReview: true }
}