import { createHash } from 'crypto'
import { formatDateKST, nowKST } from './kst-time'

/**
 * 캐시 관리 시스템
 * 외부 API 호출 비용 절감 및 성능 향상
 */

// 메모리 캐시 (실제로는 Redis 또는 DB 사용)
interface CacheEntry {
  key: string
  data: any
  expires_at: Date
  created_at: Date
}

const cacheStore = new Map<string, CacheEntry>()

// 캐시 TTL 설정 (밀리초)
export const CACHE_TTL = {
  TRENDS: 72 * 60 * 60 * 1000,      // 지역 트렌드: 72시간
  SHORTS: 7 * 24 * 60 * 60 * 1000,  // 쇼츠 트렌드: 7일
  WEATHER: 24 * 60 * 60 * 1000,     // 날씨: 24시간
  COMPETITOR: 24 * 60 * 60 * 1000,  // 경쟁사 분석: 24시간
  CONTENT: 6 * 60 * 60 * 1000,      // 콘텐츠 제안: 6시간
  NAVER_PLACE: 12 * 60 * 60 * 1000  // 네이버 플레이스: 12시간
} as const

/**
 * 캐시 키 생성 (해시 기반으로 충돌 방지)
 */
export function generateCacheKey(
  prefix: string,
  params: Record<string, any>,
  datePrefix?: string
): string {
  // 파라미터를 정렬하여 일관된 키 생성
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|')

  // 해시 생성 (충돌 방지)
  const hash = createHash('sha256')
    .update(sortedParams)
    .digest('hex')
    .substring(0, 12)

  // 날짜 접두사 추가 (일별 캐시 무효화)
  const date = datePrefix || formatDateKST(nowKST())

  return `${prefix}:${date}:${hash}`
}

/**
 * 지역 트렌드 캐시 키 생성
 */
export function getTrendsCacheKey(
  city: string,
  region: string,
  keywords: string[]
): string {
  return generateCacheKey('trends', {
    city,
    region,
    keywords: keywords.sort().join(',')
  })
}

/**
 * 쇼츠 트렌드 캐시 키 생성 (월별)
 */
export function getShortsCacheKey(category: string): string {
  const monthPrefix = formatDateKST(nowKST(), 'yyyy-MM')
  return generateCacheKey('shorts', { category }, monthPrefix)
}

/**
 * 날씨 캐시 키 생성 (일별)
 */
export function getWeatherCacheKey(region: string): string {
  return generateCacheKey('weather', { region })
}

/**
 * 경쟁사 분석 캐시 키 생성
 */
export function getCompetitorCacheKey(
  city: string,
  region: string,
  accommodationType: string
): string {
  return generateCacheKey('competitor', {
    city,
    region,
    type: accommodationType
  })
}

/**
 * 캐시 데이터 저장
 */
export function setCache(key: string, data: any, ttlMs: number): void {
  const now = nowKST()
  const expiresAt = new Date(now.getTime() + ttlMs)

  cacheStore.set(key, {
    key,
    data,
    expires_at: expiresAt,
    created_at: now
  })

  // 메모리 사용량 제한 (최대 1000개 항목)
  if (cacheStore.size > 1000) {
    const oldestKey = Array.from(cacheStore.keys())[0]
    cacheStore.delete(oldestKey)
  }
}

/**
 * 캐시 데이터 조회
 */
export function getCache<T = any>(key: string): T | null {
  const entry = cacheStore.get(key)

  if (!entry) {
    return null
  }

  // 만료 확인
  if (nowKST() > entry.expires_at) {
    cacheStore.delete(key)
    return null
  }

  return entry.data as T
}

/**
 * 캐시 상태 확인
 */
export function getCacheInfo(key: string): {
  exists: boolean
  expired: boolean
  created_at?: string
  expires_at?: string
  age_ms?: number
} {
  const entry = cacheStore.get(key)

  if (!entry) {
    return { exists: false, expired: false }
  }

  const now = nowKST()
  const expired = now > entry.expires_at
  const ageMs = now.getTime() - entry.created_at.getTime()

  return {
    exists: true,
    expired,
    created_at: entry.created_at.toISOString(),
    expires_at: entry.expires_at.toISOString(),
    age_ms: ageMs
  }
}

/**
 * 캐시 삭제
 */
export function deleteCache(key: string): boolean {
  return cacheStore.delete(key)
}

/**
 * 패턴 매칭으로 캐시 삭제 (무효화)
 */
export function invalidateCachePattern(pattern: string): number {
  let deletedCount = 0

  for (const key of cacheStore.keys()) {
    if (key.includes(pattern)) {
      cacheStore.delete(key)
      deletedCount++
    }
  }

  return deletedCount
}

/**
 * 만료된 캐시 정리 (주기적 실행)
 */
export function cleanupExpiredCache(): number {
  const now = nowKST()
  let deletedCount = 0

  for (const [key, entry] of cacheStore.entries()) {
    if (now > entry.expires_at) {
      cacheStore.delete(key)
      deletedCount++
    }
  }

  return deletedCount
}

/**
 * 캐시 통계
 */
export function getCacheStats(): {
  total_entries: number
  expired_entries: number
  memory_usage_mb: number
  hit_ratio?: number
} {
  const now = nowKST()
  let expiredCount = 0

  for (const entry of cacheStore.values()) {
    if (now > entry.expires_at) {
      expiredCount++
    }
  }

  // 대략적인 메모리 사용량 계산
  const memoryUsageMb = (cacheStore.size * 10) / 1024 // 대략 10KB per entry

  return {
    total_entries: cacheStore.size,
    expired_entries: expiredCount,
    memory_usage_mb: Number(memoryUsageMb.toFixed(2))
  }
}

/**
 * 캐시된 함수 실행 (고차 함수)
 */
export async function withCache<T>(
  cacheKey: string,
  ttlMs: number,
  fetchFn: () => Promise<T>
): Promise<{
  data: T
  fromCache: boolean
  cacheInfo: ReturnType<typeof getCacheInfo>
}> {
  // 캐시 확인
  const cached = getCache<T>(cacheKey)
  const cacheInfo = getCacheInfo(cacheKey)

  if (cached && !cacheInfo.expired) {
    return {
      data: cached,
      fromCache: true,
      cacheInfo
    }
  }

  // 캐시 미스 - 원본 함수 실행
  const data = await fetchFn()

  // 결과 캐싱
  setCache(cacheKey, data, ttlMs)

  return {
    data,
    fromCache: false,
    cacheInfo: getCacheInfo(cacheKey)
  }
}