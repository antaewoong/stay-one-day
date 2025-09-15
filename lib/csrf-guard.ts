/**
 * CSRF/Origin 가드 라이브러리
 * Cross-Site Request Forgery 공격 방지 및 Origin 검증
 */

import { NextRequest } from 'next/server'

interface CSRFConfig {
  allowedOrigins: string[]
  trustedHosts: string[]
  cookieName: string
  headerName: string
  tokenLength: number
  maxAge: number // seconds
}

const DEFAULT_CONFIG: CSRFConfig = {
  allowedOrigins: [
    'https://stayoneday.co.kr',
    'https://stay-oneday-clean.vercel.app',
    'http://localhost:3000'
  ],
  trustedHosts: [
    'stayoneday.co.kr',
    'stay-oneday-clean.vercel.app',
    'localhost',
    'localhost:3000'
  ],
  cookieName: 'csrf_token',
  headerName: 'x-csrf-token',
  tokenLength: 32,
  maxAge: 60 * 60 * 2 // 2시간
}

export interface CSRFValidationResult {
  isValid: boolean
  reason?: 'missing_origin' | 'invalid_origin' | 'missing_token' | 'invalid_token' | 'token_mismatch'
  shouldRefresh?: boolean
}

/**
 * CSRF 토큰 생성 (Node.js runtime)
 */
export function generateCSRFToken(): string {
  if (typeof window === 'undefined') {
    // Server-side: Node.js crypto
    const crypto = require('crypto')
    return crypto.randomBytes(DEFAULT_CONFIG.tokenLength).toString('hex')
  } else {
    // Client-side: Web Crypto API
    const array = new Uint8Array(DEFAULT_CONFIG.tokenLength)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
}

/**
 * CSRF 토큰 해시 생성 (저장용) - Node.js runtime
 */
export async function hashToken(token: string, salt: string): Promise<string> {
  if (typeof window === 'undefined') {
    // Server-side: Node.js crypto
    const crypto = require('crypto')
    const hash = crypto.createHash('sha256')
    hash.update(token + salt)
    return hash.digest('hex')
  } else {
    // Client-side: Web Crypto API
    const data = new TextEncoder().encode(token + salt)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = new Uint8Array(hashBuffer)
    return Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('')
  }
}

/**
 * Origin 헤더 검증
 */
export function validateOrigin(request: NextRequest, config: CSRFConfig = DEFAULT_CONFIG): CSRFValidationResult {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  // Origin이 없으면 Referer로 체크 (일부 브라우저에서 Origin 생략)
  const requestOrigin = origin || (referer ? new URL(referer).origin : null)

  if (!requestOrigin) {
    return {
      isValid: false,
      reason: 'missing_origin'
    }
  }

  // 허용된 Origin인지 확인
  const isAllowed = config.allowedOrigins.some(allowed => {
    // 정확한 매치 또는 서브도메인 허용
    return requestOrigin === allowed ||
           requestOrigin.endsWith('.' + allowed.replace(/^https?:\/\//, ''))
  })

  if (!isAllowed) {
    return {
      isValid: false,
      reason: 'invalid_origin'
    }
  }

  return { isValid: true }
}

/**
 * CSRF 토큰 검증 (상태 변경 요청용)
 */
export function validateCSRFToken(
  request: NextRequest,
  config: CSRFConfig = DEFAULT_CONFIG
): CSRFValidationResult {
  // GET, HEAD, OPTIONS는 CSRF 토큰 불필요
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return { isValid: true }
  }

  // 먼저 Origin 검증
  const originResult = validateOrigin(request, config)
  if (!originResult.isValid) {
    return originResult
  }

  // CSRF 토큰 검증
  const tokenFromHeader = request.headers.get(config.headerName)
  const tokenFromCookie = request.cookies.get(config.cookieName)?.value

  if (!tokenFromHeader) {
    return {
      isValid: false,
      reason: 'missing_token'
    }
  }

  if (!tokenFromCookie) {
    return {
      isValid: false,
      reason: 'missing_token',
      shouldRefresh: true
    }
  }

  // 간단한 토큰 매치 (실제 구현에서는 HMAC 등 사용 권장)
  if (tokenFromHeader !== tokenFromCookie) {
    return {
      isValid: false,
      reason: 'token_mismatch'
    }
  }

  return { isValid: true }
}

/**
 * Host 헤더 검증 (Host Header Injection 방지)
 */
export function validateHost(request: NextRequest, config: CSRFConfig = DEFAULT_CONFIG): CSRFValidationResult {
  const hostHeader = request.headers.get('host')

  if (!hostHeader) {
    return {
      isValid: false,
      reason: 'missing_origin'
    }
  }

  // 신뢰할 수 있는 호스트인지 확인
  const isValid = config.trustedHosts.some(trustedHost => {
    return hostHeader === trustedHost ||
           hostHeader.endsWith('.' + trustedHost)
  })

  if (!isValid) {
    return {
      isValid: false,
      reason: 'invalid_origin'
    }
  }

  return { isValid: true }
}

/**
 * 종합적인 보안 검증
 */
export function validateRequestSecurity(
  request: NextRequest,
  config: CSRFConfig = DEFAULT_CONFIG
): CSRFValidationResult & {
  hostValid: boolean
  originValid: boolean
  csrfValid: boolean
} {
  const hostResult = validateHost(request, config)
  const originResult = validateOrigin(request, config)
  const csrfResult = validateCSRFToken(request, config)

  return {
    isValid: hostResult.isValid && originResult.isValid && csrfResult.isValid,
    reason: csrfResult.reason || originResult.reason || hostResult.reason,
    shouldRefresh: csrfResult.shouldRefresh,
    hostValid: hostResult.isValid,
    originValid: originResult.isValid,
    csrfValid: csrfResult.isValid
  }
}

/**
 * API 엔드포인트별 보안 설정
 */
export const API_SECURITY_CONFIG: Record<string, { requireCSRF: boolean, requireOrigin: boolean }> = {
  // 비디오 관련 API - 높은 보안
  '/api/video/jobs/create': { requireCSRF: true, requireOrigin: true },
  '/api/video/validate-slots': { requireCSRF: true, requireOrigin: true },

  // 트렌드/프롬프트 관련 - 중간 보안
  '/api/trends/collect': { requireCSRF: true, requireOrigin: true },
  '/api/prompts/tune': { requireCSRF: true, requireOrigin: true },

  // 인증 관련 - 높은 보안
  '/api/auth': { requireCSRF: true, requireOrigin: true },

  // 관리자 API - 중간 보안 (로그인한 상태에서만 접근)
  '/api/admin/marketing-analytics': { requireCSRF: false, requireOrigin: false },
  '/api/admin/hero-slides': { requireCSRF: false, requireOrigin: false },
  '/api/admin/sections': { requireCSRF: false, requireOrigin: false },
  '/api/admin/notices': { requireCSRF: false, requireOrigin: false },

  // 읽기 전용 - 낮은 보안
  '/api/video/templates': { requireCSRF: false, requireOrigin: true },
  '/api/hero-slides': { requireCSRF: false, requireOrigin: false },
  '/api/site/hero-slides': { requireCSRF: false, requireOrigin: false },
  '/api/accommodations': { requireCSRF: false, requireOrigin: false },
  '/api/analytics/journey': { requireCSRF: false, requireOrigin: false },
  '/api/analytics/sessions': { requireCSRF: false, requireOrigin: false }
}

/**
 * 특정 API 엔드포인트에 대한 보안 검증
 */
export function validateAPIEndpointSecurity(
  request: NextRequest,
  endpoint: string
): CSRFValidationResult {
  const securityConfig = API_SECURITY_CONFIG[endpoint]

  if (!securityConfig) {
    // 기본적으로 Origin만 검증
    return validateOrigin(request)
  }

  if (securityConfig.requireCSRF) {
    return validateRequestSecurity(request)
  } else if (securityConfig.requireOrigin) {
    return validateOrigin(request)
  }

  return { isValid: true }
}

/**
 * 보안 헤더 설정 (응답용)
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'none';",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  }
}

/**
 * CSRF 토큰 쿠키 설정 옵션
 */
export function getCSRFCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: DEFAULT_CONFIG.maxAge,
    path: '/'
  }
}