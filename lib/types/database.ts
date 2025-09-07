export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          profile_image: string | null
          kakao_id: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          profile_image?: string | null
          kakao_id?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          profile_image?: string | null
          kakao_id?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      hosts: {
        Row: {
          id: string
          user_id: string | null
          business_name: string
          business_number: string | null
          representative_name: string
          phone: string
          address: string
          bank_name: string | null
          account_number: string | null
          account_holder: string | null
          status: 'pending' | 'approved' | 'rejected' | 'suspended'
          commission_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          business_name: string
          business_number?: string | null
          representative_name: string
          phone: string
          address: string
          bank_name?: string | null
          account_number?: string | null
          account_holder?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'suspended'
          commission_rate?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          business_name?: string
          business_number?: string | null
          representative_name?: string
          phone?: string
          address?: string
          bank_name?: string | null
          account_number?: string | null
          account_holder?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'suspended'
          commission_rate?: number
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
      }
      stays: {
        Row: {
          id: string
          host_id: string | null
          category_id: string | null
          name: string
          description: string | null
          short_description: string | null
          address: string
          latitude: number | null
          longitude: number | null
          base_capacity: number
          max_capacity: number
          base_price: number
          extra_person_fee: number
          check_in_time: string
          check_out_time: string
          amenities: any
          rules: string | null
          cancellation_policy: any | null
          status: 'draft' | 'review' | 'active' | 'inactive' | 'suspended'
          rating: number
          review_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          host_id?: string | null
          category_id?: string | null
          name: string
          description?: string | null
          short_description?: string | null
          address: string
          latitude?: number | null
          longitude?: number | null
          base_capacity?: number
          max_capacity?: number
          base_price: number
          extra_person_fee?: number
          check_in_time?: string
          check_out_time?: string
          amenities?: any
          rules?: string | null
          cancellation_policy?: any | null
          status?: 'draft' | 'review' | 'active' | 'inactive' | 'suspended'
          rating?: number
          review_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          host_id?: string | null
          category_id?: string | null
          name?: string
          description?: string | null
          short_description?: string | null
          address?: string
          latitude?: number | null
          longitude?: number | null
          base_capacity?: number
          max_capacity?: number
          base_price?: number
          extra_person_fee?: number
          check_in_time?: string
          check_out_time?: string
          amenities?: any
          rules?: string | null
          cancellation_policy?: any | null
          status?: 'draft' | 'review' | 'active' | 'inactive' | 'suspended'
          rating?: number
          review_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      stay_images: {
        Row: {
          id: string
          stay_id: string | null
          image_url: string
          alt_text: string | null
          sort_order: number
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          stay_id?: string | null
          image_url: string
          alt_text?: string | null
          sort_order?: number
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          stay_id?: string | null
          image_url?: string
          alt_text?: string | null
          sort_order?: number
          is_primary?: boolean
          created_at?: string
        }
      }
      stay_options: {
        Row: {
          id: string
          stay_id: string | null
          name: string
          description: string | null
          price: number
          option_type: string
          is_included: boolean
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          stay_id?: string | null
          name: string
          description?: string | null
          price?: number
          option_type: string
          is_included?: boolean
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          stay_id?: string | null
          name?: string
          description?: string | null
          price?: number
          option_type?: string
          is_included?: boolean
          is_active?: boolean
          created_at?: string
        }
      }
      reservations: {
        Row: {
          id: string
          reservation_number: string
          user_id: string | null
          stay_id: string | null
          check_in_date: string
          usage_start_time: string
          usage_end_time: string
          guest_count: number
          base_price: number
          extra_fee: number
          option_fee: number
          total_price: number
          special_requests: string | null
          status: 'confirmed' | 'in_use' | 'completed' | 'cancelled' | 'no_show'
          customer_name: string
          customer_phone: string
          customer_email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reservation_number: string
          user_id?: string | null
          stay_id?: string | null
          check_in_date: string
          usage_start_time?: string
          usage_end_time?: string
          guest_count: number
          base_price: number
          extra_fee?: number
          option_fee?: number
          total_price: number
          special_requests?: string | null
          status?: 'confirmed' | 'in_use' | 'completed' | 'cancelled' | 'no_show'
          customer_name: string
          customer_phone: string
          customer_email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reservation_number?: string
          user_id?: string | null
          stay_id?: string | null
          check_in_date?: string
          usage_start_time?: string
          usage_end_time?: string
          guest_count?: number
          base_price?: number
          extra_fee?: number
          option_fee?: number
          total_price?: number
          special_requests?: string | null
          status?: 'confirmed' | 'in_use' | 'completed' | 'cancelled' | 'no_show'
          customer_name?: string
          customer_phone?: string
          customer_email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          reservation_id: string | null
          amount: number
          payment_method: 'card' | 'kakaopay' | 'transfer'
          payment_provider: string | null
          card_number: string | null
          approval_number: string | null
          payment_key: string | null
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          fee_amount: number
          actual_amount: number
          paid_at: string | null
          refunded_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reservation_id?: string | null
          amount: number
          payment_method: 'card' | 'kakaopay' | 'transfer'
          payment_provider?: string | null
          card_number?: string | null
          approval_number?: string | null
          payment_key?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          fee_amount?: number
          actual_amount: number
          paid_at?: string | null
          refunded_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reservation_id?: string | null
          amount?: number
          payment_method?: 'card' | 'kakaopay' | 'transfer'
          payment_provider?: string | null
          card_number?: string | null
          approval_number?: string | null
          payment_key?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          fee_amount?: number
          actual_amount?: number
          paid_at?: string | null
          refunded_at?: string | null
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          reservation_id: string | null
          user_id: string | null
          stay_id: string | null
          rating: number
          title: string | null
          content: string
          images: any
          host_reply: string | null
          host_reply_at: string | null
          status: 'pending' | 'published' | 'hidden' | 'reported'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reservation_id?: string | null
          user_id?: string | null
          stay_id?: string | null
          rating: number
          title?: string | null
          content: string
          images?: any
          host_reply?: string | null
          host_reply_at?: string | null
          status?: 'pending' | 'published' | 'hidden' | 'reported'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reservation_id?: string | null
          user_id?: string | null
          stay_id?: string | null
          rating?: number
          title?: string | null
          content?: string
          images?: any
          host_reply?: string | null
          host_reply_at?: string | null
          status?: 'pending' | 'published' | 'hidden' | 'reported'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}