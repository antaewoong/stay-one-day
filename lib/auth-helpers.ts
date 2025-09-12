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
  const token = session?.access_token
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
    headers.set('x-supabase-auth', token) // 🔁 백업 헤더
  }
  headers.set('Content-Type', 'application/json')

  // 절대 URL 쓰지 말고 상대 경로 유지 (/api/...)
  const res = await fetch(path, { 
    ...init, 
    headers, 
    credentials: 'include',
    cache: 'no-store'
  })
  
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('ADMIN 4xx/5xx >>>', path, body)
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