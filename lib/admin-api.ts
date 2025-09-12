import { createClient } from '@/lib/supabase/client'

// 관리자 API 호출을 위한 공통 함수
export async function adminApiCall(url: string, options: RequestInit = {}) {
  const supabase = createClient()
  
  // 현재 세션에서 토큰 가져오기
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    throw new Error('인증 토큰이 없습니다. 다시 로그인해주세요.')
  }

  // Authorization 헤더 추가
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    ...options.headers
  }

  return fetch(url, {
    ...options,
    headers
  })
}

// GET 요청
export async function adminGet(url: string) {
  return adminApiCall(url, { method: 'GET' })
}

// POST 요청  
export async function adminPost(url: string, data: any) {
  return adminApiCall(url, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// PUT 요청
export async function adminPut(url: string, data: any) {
  return adminApiCall(url, {
    method: 'PUT', 
    body: JSON.stringify(data)
  })
}

// DELETE 요청
export async function adminDelete(url: string) {
  return adminApiCall(url, { method: 'DELETE' })
}