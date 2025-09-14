// 클라이언트 사이드 캐싱 유틸리티

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // milliseconds
}

class ClientCache {
  private cache = new Map<string, CacheEntry<any>>()

  // 데이터 설정
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  // 데이터 가져오기
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // TTL 확인
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  // 데이터 삭제
  delete(key: string): void {
    this.cache.delete(key)
  }

  // 전체 캐시 삭제
  clear(): void {
    this.cache.clear()
  }

  // 만료된 캐시 정리
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // 캐시 상태 확인
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }
}

// 전역 캐시 인스턴스
const globalCache = new ClientCache()

// 주기적 정리 (5분마다)
if (typeof window !== 'undefined') {
  setInterval(() => {
    globalCache.cleanup()
  }, 5 * 60 * 1000)
}

// API 관련 캐싱 함수들
export const cacheKeys = {
  HERO_SLIDES: 'hero_slides',
  ACCOMMODATIONS: 'accommodations',
  SECTIONS: 'sections',
  RATINGS: 'ratings'
} as const

// 히어로 슬라이드 캐싱
export const heroSlideCache = {
  set: (data: any[]) => globalCache.set(cacheKeys.HERO_SLIDES, data, 5 * 60 * 1000),
  get: () => globalCache.get<any[]>(cacheKeys.HERO_SLIDES),
  has: () => globalCache.has(cacheKeys.HERO_SLIDES)
}

// 숙소 데이터 캐싱
export const accommodationCache = {
  set: (data: any[]) => globalCache.set(cacheKeys.ACCOMMODATIONS, data, 3 * 60 * 1000),
  get: () => globalCache.get<any[]>(cacheKeys.ACCOMMODATIONS),
  has: () => globalCache.has(cacheKeys.ACCOMMODATIONS)
}

// 섹션 데이터 캐싱
export const sectionCache = {
  set: (data: any[]) => globalCache.set(cacheKeys.SECTIONS, data, 60 * 1000),
  get: () => globalCache.get<any[]>(cacheKeys.SECTIONS),
  has: () => globalCache.has(cacheKeys.SECTIONS)
}

// 평점 데이터 캐싱
export const ratingsCache = {
  set: (data: Record<string, any>) => globalCache.set(cacheKeys.RATINGS, data, 10 * 60 * 1000),
  get: () => globalCache.get<Record<string, any>>(cacheKeys.RATINGS),
  has: () => globalCache.has(cacheKeys.RATINGS)
}

// 캐시된 fetch 함수
export async function cachedFetch<T>(
  url: string,
  cacheKey: string,
  ttl: number = 5 * 60 * 1000,
  options?: RequestInit
): Promise<T | null> {
  // 캐시에서 먼저 확인
  const cached = globalCache.get<T>(cacheKey)
  if (cached) {
    return cached
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Cache-Control': 'max-age=300',
        'Accept': 'application/json',
        ...options?.headers
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    const data = result.data || result

    // 캐시에 저장
    globalCache.set(cacheKey, data, ttl)

    return data
  } catch (error) {
    console.error(`캐시된 fetch 실패 (${url}):`, error)
    return null
  }
}

export default globalCache