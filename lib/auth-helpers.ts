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

// 서버에서 내부 API 호출용 (JSON 자동 파싱)
export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessTokenOrThrow()
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'API Error' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }
  
  return response.json()
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