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

// 관리자용 API 호출 헬퍼 (Bearer 토큰 자동 첨부)
export async function apiFetch(path: string, init: RequestInit = {}) {
  const sb = createClient()
  const { data: { session } } = await sb.auth.getSession()
  const headers = new Headers(init.headers || {})
  
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }
  headers.set('Content-Type', 'application/json')

  const res = await fetch(path, { 
    ...init, 
    headers, 
    credentials: 'include',
    cache: 'no-store'
  })
  
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('API 4xx/5xx >>>', path, body) // ← stage/error 정보 포함
    throw new Error(`HTTP ${res.status}`)
  }
  
  return res.json()
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