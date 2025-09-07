// 숙소 관련 Supabase 쿼리 함수들
import { createClient } from './client'
import type { Database, AccommodationDetail, AccommodationFilters, AccommodationSearchResponse } from './database.types'

type Accommodation = Database['public']['Tables']['accommodations']['Row']
type AccommodationImage = Database['public']['Tables']['accommodation_images']['Row']
type AccommodationAmenity = Database['public']['Tables']['accommodation_amenities']['Row']
type AccommodationCategory = Database['public']['Tables']['accommodation_categories']['Row']
type Review = Database['public']['Tables']['reviews']['Row']

/**
 * 숙소 목록을 필터와 함께 조회
 */
export async function getAccommodations(filters: AccommodationFilters = {}): Promise<AccommodationSearchResponse> {
  const supabase = createClient()
  
  let query = supabase
    .from('accommodations')
    .select(`
      *,
      accommodation_images!inner(*),
      accommodation_amenities(*),
      accommodation_categories(*),
      reviews(rating)
    `)
    .eq('status', 'active')

  // 필터 적용
  if (filters.region) {
    query = query.eq('region', filters.region)
  }

  if (filters.guest_count) {
    query = query.gte('max_capacity', filters.guest_count)
  }

  if (filters.accommodation_types && filters.accommodation_types.length > 0) {
    query = query.in('accommodation_type', filters.accommodation_types)
  }

  if (filters.price_min) {
    query = query.gte('base_price', filters.price_min)
  }

  if (filters.price_max) {
    query = query.lte('base_price', filters.price_max)
  }

  // 카테고리 필터 (조인을 통해)
  if (filters.categories && filters.categories.length > 0) {
    query = query.in('accommodation_categories.category', filters.categories)
  }

  // 정렬
  switch (filters.sort_by) {
    case 'price_low':
      query = query.order('base_price', { ascending: true })
      break
    case 'price_high':
      query = query.order('base_price', { ascending: false })
      break
    case 'newest':
      query = query.order('created_at', { ascending: false })
      break
    case 'featured':
      query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false })
      break
    default:
      query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false })
  }

  // 페이지네이션
  const page = filters.page || 1
  const limit = filters.limit || 12
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await query.range(from, to)

  if (error) {
    console.error('Error fetching accommodations:', error)
    throw new Error('숙소 데이터를 불러오는데 실패했습니다.')
  }

  // 평균 평점 계산 및 데이터 변환
  const accommodationsWithRating: AccommodationDetail[] = (data || []).map((accommodation: any) => {
    const ratings = accommodation.reviews?.map((review: any) => review.rating) || []
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length 
      : 0

    return {
      ...accommodation,
      reviews: accommodation.reviews ? [{
        ...accommodation.reviews[0],
        avg_rating: Number(avgRating.toFixed(1)),
        review_count: ratings.length
      }] : []
    }
  })

  const totalPages = Math.ceil((count || 0) / limit)

  return {
    data: accommodationsWithRating,
    total: count || 0,
    page,
    limit,
    total_pages: totalPages
  }
}

/**
 * 특정 숙소 상세 정보 조회
 */
export async function getAccommodationById(id: string): Promise<AccommodationDetail | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('accommodations')
    .select(`
      *,
      accommodation_images(*),
      accommodation_amenities(*),
      accommodation_categories(*),
      reviews(
        id,
        rating,
        title,
        content,
        cleanliness_rating,
        location_rating,
        value_rating,
        service_rating,
        created_at
      )
    `)
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (error) {
    console.error('Error fetching accommodation:', error)
    return null
  }

  if (!data) return null

  // 평균 평점 계산
  const ratings = data.reviews?.map((review: any) => review.rating) || []
  const avgRating = ratings.length > 0 
    ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length 
    : 0

  return {
    ...data,
    reviews: data.reviews ? [{
      ...data.reviews[0],
      avg_rating: Number(avgRating.toFixed(1)),
      review_count: ratings.length
    }] : []
  } as AccommodationDetail
}

/**
 * 추천 숙소 목록 조회 (featured)
 */
export async function getFeaturedAccommodations(limit: number = 6): Promise<AccommodationDetail[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('accommodations')
    .select(`
      *,
      accommodation_images!inner(*),
      accommodation_amenities(*),
      accommodation_categories(*),
      reviews(rating)
    `)
    .eq('status', 'active')
    .eq('is_featured', true)
    .limit(limit)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching featured accommodations:', error)
    return []
  }

  // 평균 평점 계산
  return (data || []).map((accommodation: any) => {
    const ratings = accommodation.reviews?.map((review: any) => review.rating) || []
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length 
      : 0

    return {
      ...accommodation,
      reviews: accommodation.reviews ? [{
        ...accommodation.reviews[0],
        avg_rating: Number(avgRating.toFixed(1)),
        review_count: ratings.length
      }] : []
    }
  }) as AccommodationDetail[]
}

/**
 * 지역별 숙소 개수 조회
 */
export async function getAccommodationCountByRegion(): Promise<Record<string, number>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('accommodations')
    .select('region')
    .eq('status', 'active')

  if (error) {
    console.error('Error fetching accommodation counts:', error)
    return {}
  }

  // 지역별 개수 계산
  const counts: Record<string, number> = {}
  data?.forEach(item => {
    counts[item.region] = (counts[item.region] || 0) + 1
  })

  return counts
}

/**
 * 검색 자동완성을 위한 숙소명/지역 목록
 */
export async function getSearchSuggestions(query: string): Promise<string[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('accommodations')
    .select('name, region, address')
    .eq('status', 'active')
    .or(`name.ilike.%${query}%,region.ilike.%${query}%,address.ilike.%${query}%`)
    .limit(10)

  if (error) {
    console.error('Error fetching search suggestions:', error)
    return []
  }

  const suggestions: string[] = []
  data?.forEach(item => {
    if (item.name.toLowerCase().includes(query.toLowerCase())) {
      suggestions.push(item.name)
    }
    if (item.region.toLowerCase().includes(query.toLowerCase()) && !suggestions.includes(item.region)) {
      suggestions.push(item.region)
    }
  })

  return Array.from(new Set(suggestions)) // 중복 제거
}