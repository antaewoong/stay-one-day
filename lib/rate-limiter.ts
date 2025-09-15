/**
 * Rate Limiting & Idempotency 시스템
 * 호스트/숙소/IP 기준 요청 제한 및 중복 요청 차단
 */

import { NextRequest } from 'next/server'
import { createHash } from 'crypto'

// Rate limiting 설정
interface RateLimitConfig {
  windowMs: number // 시간 창 (밀리초)
  maxRequests: number // 최대 요청 수
  keyGenerators: string[] // 키 생성 방식들
}

// 엔드포인트별 Rate limit 설정
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/video/jobs/create': {
    windowMs: 5 * 60 * 1000, // 5분
    maxRequests: 3, // 5분간 최대 3개
    keyGenerators: ['host', 'accommodation', 'ip']
  },
  '/api/video/validate-slots': {
    windowMs: 1 * 60 * 1000, // 1분
    maxRequests: 10, // 1분간 최대 10개
    keyGenerators: ['host', 'ip']
  },
  '/api/trends/collect': {
    windowMs: 10 * 60 * 1000, // 10분
    maxRequests: 5, // 10분간 최대 5개
    keyGenerators: ['ip']
  },
  '/api/prompts/tune': {
    windowMs: 30 * 60 * 1000, // 30분
    maxRequests: 2, // 30분간 최대 2개
    keyGenerators: ['ip']
  }
}

// Idempotency 설정
const IDEMPOTENCY_WINDOW_MS = 10 * 60 * 1000 // 10분

// 메모리 저장소 (프로덕션에서는 Redis 사용)
const rateLimitStore = new Map<string, { count: number, resetTime: number }>()
const idempotencyStore = new Map<string, { response: any, createdAt: number }>()

// 정리 주기 (1분마다 만료된 항목 정리)
setInterval(() => {
  const now = Date.now()

  // Rate limit 정리
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }

  // Idempotency 정리
  for (const [key, value] of idempotencyStore.entries()) {
    if (now - value.createdAt > IDEMPOTENCY_WINDOW_MS) {
      idempotencyStore.delete(key)
    }
  }
}, 60 * 1000)

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

export interface IdempotencyResult {
  isReplay: boolean
  cachedResponse?: any
  key: string
}

/**
 * Rate limiting 검사
 */
export async function checkRateLimit(
  request: NextRequest,
  endpoint: string,
  hostId?: string,
  accommodationId?: string
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[endpoint]
  if (!config) {
    // 설정이 없으면 허용
    return { allowed: true, remaining: Infinity, resetTime: 0 }
  }

  const now = Date.now()
  const resetTime = now + config.windowMs
  const clientIP = getClientIP(request)

  // 여러 기준으로 Rate limit 검사
  for (const keyType of config.keyGenerators) {
    const key = generateRateLimitKey(endpoint, keyType, clientIP, hostId, accommodationId)

    let bucket = rateLimitStore.get(key)
    if (!bucket || now > bucket.resetTime) {
      // 새로운 시간 창 시작
      bucket = { count: 0, resetTime }
      rateLimitStore.set(key, bucket)
    }

    bucket.count++

    if (bucket.count > config.maxRequests) {
      const retryAfter = Math.ceil((bucket.resetTime - now) / 1000)
      console.log(`[RATE_LIMIT] 제한됨 - ${keyType}:${key} (${bucket.count}/${config.maxRequests})`)

      return {
        allowed: false,
        remaining: 0,
        resetTime: bucket.resetTime,
        retryAfter
      }
    }

    console.log(`[RATE_LIMIT] 통과 - ${keyType}:${key} (${bucket.count}/${config.maxRequests})`)
  }

  return {
    allowed: true,
    remaining: config.maxRequests - (rateLimitStore.get(generateRateLimitKey(endpoint, 'host', clientIP, hostId))?.count || 0),
    resetTime
  }
}

/**
 * Idempotency 검사 (중복 요청 차단)
 */
export async function checkIdempotency(
  request: NextRequest,
  body: any,
  hostId?: string,
  accommodationId?: string
): Promise<IdempotencyResult> {
  try {
    const idempotencyKey = generateIdempotencyKey(request, body, hostId, accommodationId)
    const now = Date.now()

    const cached = idempotencyStore.get(idempotencyKey)
    if (cached && (now - cached.createdAt) < IDEMPOTENCY_WINDOW_MS) {
      console.log(`[IDEMPOTENCY] 중복 요청 감지: ${idempotencyKey}`)
      return {
        isReplay: true,
        cachedResponse: cached.response,
        key: idempotencyKey
      }
    }

    console.log(`[IDEMPOTENCY] 새로운 요청: ${idempotencyKey}`)
    return {
      isReplay: false,
      key: idempotencyKey
    }

  } catch (error) {
    console.error('[IDEMPOTENCY] 키 생성 실패:', error)
    // 오류 시에는 통과시킴 (안전장치)
    return {
      isReplay: false,
      key: 'error'
    }
  }
}

/**
 * Idempotency 응답 캐시
 */
export function cacheIdempotentResponse(key: string, response: any) {
  if (key === 'error') return

  idempotencyStore.set(key, {
    response,
    createdAt: Date.now()
  })

  console.log(`[IDEMPOTENCY] 응답 캐시됨: ${key}`)
}

/**
 * Rate limit 키 생성
 */
function generateRateLimitKey(
  endpoint: string,
  keyType: string,
  clientIP: string,
  hostId?: string,
  accommodationId?: string
): string {
  const baseKey = `ratelimit:${endpoint}:${keyType}`

  switch (keyType) {
    case 'host':
      return `${baseKey}:${hostId || 'anonymous'}`
    case 'accommodation':
      return `${baseKey}:${accommodationId || 'none'}`
    case 'ip':
      return `${baseKey}:${clientIP}`
    default:
      return `${baseKey}:unknown`
  }
}

/**
 * Idempotency 키 생성
 * 같은 호스트가 같은 이미지들로 같은 템플릿 요청 시 중복 차단
 */
function generateIdempotencyKey(
  request: NextRequest,
  body: any,
  hostId?: string,
  accommodationId?: string
): string {
  const url = request.nextUrl.pathname

  // 요청 내용으로 해시 생성
  const contentHash = createHash('sha256')
    .update(JSON.stringify({
      url,
      hostId: hostId || 'anonymous',
      accommodationId: accommodationId || 'none',
      // 핵심 내용만 해시에 포함
      archetype: body.archetype,
      templateId: body.templateId,
      manifest: body.manifest?.map((m: any) => ({ slot: m.slot, file: m.file })).sort(),
      // 이미지 체크섬들 (실제 파일 내용 기반)
      imageChecksums: body.uploadedImages?.map((img: any) => img.checksum || img.filename).sort()
    }))
    .digest('hex')
    .substring(0, 16) // 처음 16자리만 사용

  return `idempotency:${url}:${contentHash}`
}

/**
 * 클라이언트 IP 추출
 */
function getClientIP(request: NextRequest): string {
  // Vercel/CloudFlare 등에서 제공하는 헤더들 확인
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for')

  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim()
  }

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  // 기본값 (로컬 개발 환경)
  return '127.0.0.1'
}

/**
 * Rate limit 정보를 응답 헤더에 추가
 */
export function addRateLimitHeaders(
  response: Response,
  result: RateLimitResult
): Response {
  const headers = new Headers(response.headers)

  headers.set('X-RateLimit-Remaining', result.remaining.toString())
  headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString())

  if (result.retryAfter) {
    headers.set('Retry-After', result.retryAfter.toString())
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}