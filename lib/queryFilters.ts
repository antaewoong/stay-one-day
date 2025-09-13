import 'server-only'

export interface InfluencerFilters {
  status?: string
  category?: string
  search?: string
}

export interface HostFilters {
  status?: string
  search?: string
}

export interface NoticeFilters {
  target?: string
  status?: string
}

export interface InquiryFilters {
  userType?: string
  status?: string
}

// 인플루언서 필터 적용
export function applyInfluencerFilters<T>(query: T, filters: InfluencerFilters): T {
  let q = query as any
  
  if (filters.status && filters.status !== 'all') {
    q = q.eq('status', filters.status)
  }
  
  if (filters.category && filters.category !== 'all') {
    q = q.contains('content_category', [filters.category])
  }
  
  if (filters.search) {
    q = q.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,instagram_handle.ilike.%${filters.search}%`)
  }
  
  return q
}

// 호스트 필터 적용
export function applyHostFilters<T>(query: T, filters: HostFilters): T {
  let q = query as any
  
  if (filters.status && filters.status !== 'all') {
    q = q.eq('status', filters.status)
  }
  
  if (filters.search) {
    q = q.or(`representative_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,business_name.ilike.%${filters.search}%`)
  }
  
  return q
}

// 공지사항 필터 적용
export function applyNoticeFilters<T>(query: T, filters: NoticeFilters): T {
  let q = query as any
  
  if (filters.status && filters.status !== 'all') {
    q = q.eq('status', filters.status)
  }
  
  if (filters.target && filters.target !== 'all') {
    q = q.or(`target_audience.eq.all,target_audience.eq.${filters.target}`)
  }
  
  return q
}

// 문의사항 필터 적용
export function applyInquiryFilters<T>(query: T, filters: InquiryFilters): T {
  let q = query as any
  
  if (filters.userType && filters.userType !== 'all') {
    q = q.eq('user_type', filters.userType)
  }
  
  if (filters.status && filters.status !== 'all') {
    q = q.eq('status', filters.status)
  }
  
  return q
}

// 페이지네이션 유틸
export interface PaginationOptions {
  page: number
  limit: number
}

export function calculatePagination(options: PaginationOptions) {
  const { page, limit } = options
  const from = (page - 1) * limit
  const to = from + limit - 1
  
  return { from, to, offset: from }
}

export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1
  }
}