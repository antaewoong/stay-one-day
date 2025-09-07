// =============================================
// 예약 시스템 타입 정의
// =============================================

export interface Accommodation {
  id: string
  business_id: string
  name: string
  description?: string
  accommodation_type: string
  address: string
  detailed_address?: string
  latitude: string
  longitude: string
  region: string
  max_capacity: number
  bedrooms: number
  bathrooms: number
  base_price: number
  weekend_price: number
  checkin_time: string
  checkout_time: string
  status: string
  is_featured: boolean
  created_at: string
  updated_at: string
  
  // 계산된 필드들 (UI용)
  amenities?: string[]
  options?: AccommodationOption[]
  images?: string[]
  usage_guide?: string
  refund_policy?: string
  seller_info?: string
  special_notes?: string
  extra_options?: Array<{
    name: string
    description?: string
    price: number
  }>
  rating?: number
  review_count?: number
}

export interface AccommodationOption {
  name: string
  price: number
  description?: string
}

export interface Reservation {
  id: string
  user_id: string
  accommodation_id: string
  accommodation?: Accommodation
  reservation_date: string
  guest_count: number
  selected_options: string[] // 선택된 옵션 이름들
  base_price: number
  additional_guest_cost: number
  options_cost: number
  total_price: number
  guest_name: string
  guest_phone: string
  guest_email?: string
  special_requests?: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_status: 'pending' | 'paid' | 'refunded'
  payment_method?: string
  payment_id?: string
  created_at: string
  updated_at: string
}

export interface CreateReservationData {
  accommodation_id: string
  reservation_date: string
  guest_count: number
  selected_options: string[]
  guest_name: string
  guest_phone: string
  guest_email?: string
  special_requests?: string
}

export interface ReservationCalculation {
  base_price: number
  additional_guest_cost: number
  options_cost: number
  total_price: number
  price_breakdown: {
    base: { guests: number; price: number }
    additional_guests: { count: number; price_per_guest: number; total: number }
    options: Array<{ name: string; price: number }>
  }
}

export interface Wishlist {
  id: string
  user_id: string
  accommodation_id: string
  accommodation?: Accommodation
  created_at: string
}

export interface Review {
  id: string
  user_id: string
  accommodation_id: string
  reservation_id: string
  rating: number
  comment?: string
  images?: string[]
  created_at: string
  updated_at: string
  user_name?: string
}

// 예약 폼 데이터
export interface ReservationFormData {
  reservationDate: string
  guestCount: number
  selectedOptions: string[]
  guestName: string
  guestPhone: string
  guestEmail: string
  specialRequests: string
}

// 결제 데이터
export interface PaymentData {
  reservation_id: string
  amount: number
  method: string
  toss_payment_key?: string
  toss_order_id?: string
}

// 검색 필터
export interface AccommodationFilter {
  location?: string
  type?: string
  date?: string
  guests?: number
  min_price?: number
  max_price?: number
  amenities?: string[]
  rating?: number
}

// API 응답 타입
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// 페이지네이션
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}