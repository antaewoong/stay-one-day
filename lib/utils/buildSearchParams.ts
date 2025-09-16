/**
 * 검색 파라미터 빌더 유틸리티
 * header.tsx, UserHeader.tsx, page.tsx 등에서 공통으로 사용
 */

export interface SearchFilters {
  // 기본 검색 옵션
  location?: string
  region?: string
  date?: string
  guests?: string | number

  // 숙소 타입
  type?: string
  categories?: string[]

  // 가격 필터
  minPrice?: string | number
  maxPrice?: string | number

  // 기타 옵션
  isFavorite?: boolean
  sortBy?: 'price' | 'rating' | 'distance' | 'newest'
  sortOrder?: 'asc' | 'desc'
}

/**
 * 검색 필터 객체를 URLSearchParams로 변환
 */
export function buildSearchParams(filters: SearchFilters): URLSearchParams {
  const searchParams = new URLSearchParams()

  // 위치/지역
  if (filters.location) {
    searchParams.append('location', filters.location)
  }
  if (filters.region) {
    searchParams.append('region', filters.region)
  }

  // 날짜
  if (filters.date) {
    searchParams.append('date', filters.date)
  }

  // 인원수
  if (filters.guests) {
    searchParams.append('guests', filters.guests.toString())
  }

  // 숙소 타입
  if (filters.type) {
    searchParams.append('type', filters.type)
  }

  // 카테고리 (배열을 콤마로 구분된 문자열로 변환)
  if (filters.categories && filters.categories.length > 0) {
    searchParams.append('categories', filters.categories.join(','))
  }

  // 가격 범위
  if (filters.minPrice) {
    searchParams.append('minPrice', filters.minPrice.toString())
  }
  if (filters.maxPrice) {
    searchParams.append('maxPrice', filters.maxPrice.toString())
  }

  // 즐겨찾기
  if (filters.isFavorite) {
    searchParams.append('favorites', 'true')
  }

  // 정렬
  if (filters.sortBy) {
    searchParams.append('sortBy', filters.sortBy)
  }
  if (filters.sortOrder) {
    searchParams.append('sortOrder', filters.sortOrder)
  }

  return searchParams
}

/**
 * 검색 필터로 spaces 페이지 URL 생성
 */
export function buildSearchUrl(filters: SearchFilters, basePath: string = '/spaces'): string {
  const searchParams = buildSearchParams(filters)
  const queryString = searchParams.toString()

  return queryString ? `${basePath}?${queryString}` : basePath
}

/**
 * URLSearchParams를 SearchFilters 객체로 파싱
 * spaces 페이지에서 URL 파라미터를 읽을 때 사용
 */
export function parseSearchParams(searchParams: URLSearchParams): SearchFilters {
  const filters: SearchFilters = {}

  // 기본 옵션
  if (searchParams.has('location')) {
    filters.location = searchParams.get('location') || undefined
  }
  if (searchParams.has('region')) {
    filters.region = searchParams.get('region') || undefined
  }
  if (searchParams.has('date')) {
    filters.date = searchParams.get('date') || undefined
  }
  if (searchParams.has('guests')) {
    filters.guests = searchParams.get('guests') || undefined
  }

  // 숙소 타입
  if (searchParams.has('type')) {
    filters.type = searchParams.get('type') || undefined
  }

  // 카테고리 (콤마로 구분된 문자열을 배열로 변환)
  if (searchParams.has('categories')) {
    const categoriesStr = searchParams.get('categories')
    if (categoriesStr) {
      filters.categories = categoriesStr.split(',').filter(Boolean)
    }
  }

  // 가격 범위
  if (searchParams.has('minPrice')) {
    filters.minPrice = searchParams.get('minPrice') || undefined
  }
  if (searchParams.has('maxPrice')) {
    filters.maxPrice = searchParams.get('maxPrice') || undefined
  }

  // 즐겨찾기
  if (searchParams.has('favorites')) {
    filters.isFavorite = searchParams.get('favorites') === 'true'
  }

  // 정렬
  if (searchParams.has('sortBy')) {
    filters.sortBy = searchParams.get('sortBy') as SearchFilters['sortBy']
  }
  if (searchParams.has('sortOrder')) {
    filters.sortOrder = searchParams.get('sortOrder') as SearchFilters['sortOrder']
  }

  return filters
}