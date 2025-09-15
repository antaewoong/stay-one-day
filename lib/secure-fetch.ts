/**
 * CSRF 토큰을 자동으로 포함하는 보안 HTTP 클라이언트
 * 클라이언트 사이드에서 안전한 API 호출용
 */

interface SecureFetchOptions extends RequestInit {
  skipCSRF?: boolean
}

/**
 * 쿠키에서 CSRF 토큰 추출
 */
function getCSRFToken(): string | null {
  if (typeof window === 'undefined') return null

  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'csrf_token') {
      return decodeURIComponent(value)
    }
  }
  return null
}

/**
 * 보안 fetch - CSRF 토큰을 자동으로 포함
 */
export async function secureFetch(url: string, options: SecureFetchOptions = {}): Promise<Response> {
  const { skipCSRF = false, headers = {}, ...restOptions } = options

  // 기본 헤더 설정
  const secureHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers as Record<string, string>
  }

  // POST, PUT, PATCH, DELETE 요청에 CSRF 토큰 추가
  if (!skipCSRF && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || 'GET')) {
    const csrfToken = getCSRFToken()

    if (csrfToken) {
      (secureHeaders as Record<string, string>)['x-csrf-token'] = csrfToken
    } else {
      console.warn('[SECURE_FETCH] CSRF 토큰이 없습니다. 요청이 실패할 수 있습니다.')
    }
  }

  return fetch(url, {
    ...restOptions,
    headers: secureHeaders,
    credentials: 'same-origin' // 쿠키 포함
  })
}

/**
 * 보안 GET 요청
 */
export async function secureGet<T = any>(url: string, options: Omit<SecureFetchOptions, 'method'> = {}): Promise<T> {
  const response = await secureFetch(url, {
    ...options,
    method: 'GET'
  })

  if (!response.ok) {
    throw new Error(`GET 요청 실패: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * 보안 POST 요청
 */
export async function securePost<T = any>(
  url: string,
  data?: any,
  options: Omit<SecureFetchOptions, 'method' | 'body'> = {}
): Promise<T> {
  const response = await secureFetch(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`POST 요청 실패: ${response.status} ${errorData.message || response.statusText}`)
  }

  return response.json()
}

/**
 * 보안 PUT 요청
 */
export async function securePut<T = any>(
  url: string,
  data?: any,
  options: Omit<SecureFetchOptions, 'method' | 'body'> = {}
): Promise<T> {
  const response = await secureFetch(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`PUT 요청 실패: ${response.status} ${errorData.message || response.statusText}`)
  }

  return response.json()
}

/**
 * 보안 DELETE 요청
 */
export async function secureDelete<T = any>(
  url: string,
  options: Omit<SecureFetchOptions, 'method'> = {}
): Promise<T> {
  const response = await secureFetch(url, {
    ...options,
    method: 'DELETE'
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`DELETE 요청 실패: ${response.status} ${errorData.message || response.statusText}`)
  }

  return response.json()
}

/**
 * 파일 업로드용 보안 FormData 전송
 */
export async function secureUpload<T = any>(
  url: string,
  formData: FormData,
  options: Omit<SecureFetchOptions, 'method' | 'body' | 'headers'> = {}
): Promise<T> {
  // FormData 사용 시 Content-Type 헤더를 설정하지 않음 (브라우저가 자동 설정)
  const csrfToken = getCSRFToken()
  const headers: HeadersInit = {}

  if (csrfToken) {
    (headers as Record<string, string>)['x-csrf-token'] = csrfToken
  }

  const response = await fetch(url, {
    ...options,
    method: 'POST',
    body: formData,
    headers,
    credentials: 'same-origin'
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`파일 업로드 실패: ${response.status} ${errorData.message || response.statusText}`)
  }

  return response.json()
}

/**
 * CSRF 토큰 새로고침
 */
export async function refreshCSRFToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'same-origin'
    })

    if (response.ok) {
      const token = response.headers.get('X-CSRF-Token')
      return token
    }
  } catch (error) {
    console.error('[SECURE_FETCH] CSRF 토큰 새로고침 실패:', error)
  }

  return null
}

/**
 * 보안 오류 핸들러
 */
export class SecurityError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number
  ) {
    super(message)
    this.name = 'SecurityError'
  }
}

/**
 * API 응답 오류를 SecurityError로 변환
 */
export function handleSecurityError(response: Response): never {
  const status = response.status

  if (status === 403) {
    throw new SecurityError('CSRF_TOKEN_INVALID', 'CSRF 토큰이 유효하지 않습니다', status)
  } else if (status === 400) {
    throw new SecurityError('INVALID_ORIGIN', '허용되지 않은 출처에서의 요청입니다', status)
  } else {
    throw new SecurityError('SECURITY_ERROR', '보안 검증에 실패했습니다', status)
  }
}