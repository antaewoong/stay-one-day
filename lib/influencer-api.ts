import { createClient } from '@/lib/supabase/client'

// 인플루언서 API 호출을 위한 공통 함수
export async function influencerApiCall(url: string, options: RequestInit = {}) {
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
export async function influencerGet(url: string) {
  return influencerApiCall(url, { method: 'GET' })
}

// POST 요청  
export async function influencerPost(url: string, data: any) {
  return influencerApiCall(url, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// PUT 요청
export async function influencerPut(url: string, data: any) {
  return influencerApiCall(url, {
    method: 'PUT', 
    body: JSON.stringify(data)
  })
}

// DELETE 요청
export async function influencerDelete(url: string) {
  return influencerApiCall(url, { method: 'DELETE' })
}