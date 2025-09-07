// Supabase 데이터베이스 타입 정의
// Stay One Day 플랫폼용

export interface Database {
  public: {
    Tables: {
      accommodations: {
        Row: {
          id: string
          business_id: string
          name: string
          description: string | null
          accommodation_type: '펜션' | '풀빌라' | '독채' | '글램핑' | '캠핑' | '기타'
          address: string
          detailed_address: string | null
          latitude: number | null
          longitude: number | null
          region: string
          max_capacity: number
          bedrooms: number
          bathrooms: number
          base_price: number
          weekend_price: number | null
          checkin_time: string
          checkout_time: string
          status: 'draft' | 'pending' | 'active' | 'inactive' | 'suspended'
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          description?: string | null
          accommodation_type: '펜션' | '풀빌라' | '독채' | '글램핑' | '캠핑' | '기타'
          address: string
          detailed_address?: string | null
          latitude?: number | null
          longitude?: number | null
          region: string
          max_capacity: number
          bedrooms?: number
          bathrooms?: number
          base_price: number
          weekend_price?: number | null
          checkin_time?: string
          checkout_time?: string
          status?: 'draft' | 'pending' | 'active' | 'inactive' | 'suspended'
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          description?: string | null
          accommodation_type?: '펜션' | '풀빌라' | '독채' | '글램핑' | '캠핑' | '기타'
          address?: string
          detailed_address?: string | null
          latitude?: number | null
          longitude?: number | null
          region?: string
          max_capacity?: number
          bedrooms?: number
          bathrooms?: number
          base_price?: number
          weekend_price?: number | null
          checkin_time?: string
          checkout_time?: string
          status?: 'draft' | 'pending' | 'active' | 'inactive' | 'suspended'
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      accommodation_images: {
        Row: {
          id: string
          accommodation_id: string
          image_url: string
          image_type: 'main' | 'general' | 'room' | 'bathroom' | 'kitchen' | 'outdoor' | 'amenity'
          display_order: number
          alt_text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          accommodation_id: string
          image_url: string
          image_type?: 'main' | 'general' | 'room' | 'bathroom' | 'kitchen' | 'outdoor' | 'amenity'
          display_order?: number
          alt_text?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          accommodation_id?: string
          image_url?: string
          image_type?: 'main' | 'general' | 'room' | 'bathroom' | 'kitchen' | 'outdoor' | 'amenity'
          display_order?: number
          alt_text?: string | null
          created_at?: string
        }
      }
      accommodation_amenities: {
        Row: {
          id: string
          accommodation_id: string
          amenity_type: string
          amenity_name: string
          is_available: boolean
          additional_info: string | null
        }
        Insert: {
          id?: string
          accommodation_id: string
          amenity_type: string
          amenity_name: string
          is_available?: boolean
          additional_info?: string | null
        }
        Update: {
          id?: string
          accommodation_id?: string
          amenity_type?: string
          amenity_name?: string
          is_available?: boolean
          additional_info?: string | null
        }
      }
      accommodation_categories: {
        Row: {
          id: string
          accommodation_id: string
          category: string
        }
        Insert: {
          id?: string
          accommodation_id: string
          category: string
        }
        Update: {
          id?: string
          accommodation_id?: string
          category?: string
        }
      }
      reservations: {
        Row: {
          id: string
          accommodation_id: string
          user_id: string | null
          reservation_number: string
          checkin_date: string
          checkout_date: string
          guest_count: number
          guest_name: string
          guest_phone: string
          guest_email: string
          base_amount: number
          additional_amount: number
          discount_amount: number
          total_amount: number
          payment_method: string | null
          payment_status: 'pending' | 'paid' | 'cancelled' | 'refunded' | 'partial_refund'
          paid_amount: number
          status: 'confirmed' | 'cancelled' | 'completed' | 'no_show'
          special_requests: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          accommodation_id: string
          user_id?: string | null
          reservation_number: string
          checkin_date: string
          checkout_date: string
          guest_count: number
          guest_name: string
          guest_phone: string
          guest_email: string
          base_amount: number
          additional_amount?: number
          discount_amount?: number
          total_amount: number
          payment_method?: string | null
          payment_status?: 'pending' | 'paid' | 'cancelled' | 'refunded' | 'partial_refund'
          paid_amount?: number
          status?: 'confirmed' | 'cancelled' | 'completed' | 'no_show'
          special_requests?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          accommodation_id?: string
          user_id?: string | null
          reservation_number?: string
          checkin_date?: string
          checkout_date?: string
          guest_count?: number
          guest_name?: string
          guest_phone?: string
          guest_email?: string
          base_amount?: number
          additional_amount?: number
          discount_amount?: number
          total_amount?: number
          payment_method?: string | null
          payment_status?: 'pending' | 'paid' | 'cancelled' | 'refunded' | 'partial_refund'
          paid_amount?: number
          status?: 'confirmed' | 'cancelled' | 'completed' | 'no_show'
          special_requests?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          reservation_id: string
          accommodation_id: string
          user_id: string | null
          rating: number
          title: string | null
          content: string
          cleanliness_rating: number | null
          location_rating: number | null
          value_rating: number | null
          service_rating: number | null
          status: 'active' | 'hidden' | 'reported'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reservation_id: string
          accommodation_id: string
          user_id?: string | null
          rating: number
          title?: string | null
          content: string
          cleanliness_rating?: number | null
          location_rating?: number | null
          value_rating?: number | null
          service_rating?: number | null
          status?: 'active' | 'hidden' | 'reported'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reservation_id?: string
          accommodation_id?: string
          user_id?: string | null
          rating?: number
          title?: string | null
          content?: string
          cleanliness_rating?: number | null
          location_rating?: number | null
          value_rating?: number | null
          service_rating?: number | null
          status?: 'active' | 'hidden' | 'reported'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// 숙소 상세 정보 (이미지, 편의시설, 카테고리, 리뷰 포함)
export type AccommodationDetail = Database['public']['Tables']['accommodations']['Row'] & {
  accommodation_images: Database['public']['Tables']['accommodation_images']['Row'][]
  accommodation_amenities: Database['public']['Tables']['accommodation_amenities']['Row'][]
  accommodation_categories: Database['public']['Tables']['accommodation_categories']['Row'][]
  reviews: (Database['public']['Tables']['reviews']['Row'] & {
    avg_rating?: number
    review_count?: number
  })[]
}

// 검색 필터 타입
export interface AccommodationFilters {
  region?: string
  checkin_date?: string
  checkout_date?: string
  guest_count?: number
  categories?: string[]
  price_min?: number
  price_max?: number
  accommodation_types?: string[]
  amenities?: string[]
  sort_by?: 'price_low' | 'price_high' | 'rating' | 'newest' | 'featured'
  page?: number
  limit?: number
}

// API 응답 타입
export interface AccommodationSearchResponse {
  data: AccommodationDetail[]
  total: number
  page: number
  limit: number
  total_pages: number
}