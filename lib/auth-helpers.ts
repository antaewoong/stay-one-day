// GPT 제안 - 안전한 토큰 전달 유틸 (Next.js App Router 기준)
import { createClient } from '@/lib/supabase/client'

export async function getAccessTokenOrThrow() {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session?.access_token) {
    throw new Error('AuthSessionMissing: access_token not found')
  }
  return data.session.access_token
}

const isJWT = (t?: string|null) =>
  !!t && /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(t)

// 관리자용 API 호출 헬퍼 (Bearer 토큰 자동 첨부)
export async function apiFetch(path: string, init: RequestInit = {}) {
  const sb = createClient()
  const { data: { session } } = await sb.auth.getSession()
  const headers = new Headers(init.headers || {})
  const at = session?.access_token || null
  
  if (!isJWT(at)) {
    console.error('❌ access_token not JWT. aborting request')
    throw new Error('No valid access token')
  }
  
  headers.set('Authorization', `Bearer ${at}`)
  headers.set('x-supabase-auth', at) // 문자열 그대로 (JSON.stringify 금지)
  headers.set('Content-Type', 'application/json')

  const res = await fetch(path, { 
    ...init, 
    headers, 
    credentials: 'include',
    cache: 'no-store'
  })
  
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('ADMIN 4xx/5xx >>>', path, body)

    // API 에러 메시지 파싱 시도
    try {
      const errorData = JSON.parse(body)
      return {
        ok: false,
        error: errorData.error || errorData.message || `HTTP ${res.status}`,
        status: res.status
      }
    } catch {
      return {
        ok: false,
        error: `HTTP ${res.status}`,
        status: res.status
      }
    }
  }

  const data = await res.json()
  return {
    ok: true,
    ...data
  }
}

// 관리자 세션 안전하게 가져오기
export async function getAdminSession() {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) throw new Error('AuthSessionMissing')

  // 토큰 갱신 필요시 처리
  if (data.session.expires_at && data.session.expires_at * 1000 < Date.now()) {
    const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession()
    if (refreshErr || !refreshed.session) throw new Error('SessionRefreshFailed')
    return refreshed.session
  }

  return data.session
}