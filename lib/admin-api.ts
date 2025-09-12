import { createClient } from '@/lib/supabase/client'

// 관리자 API 호출을 위한 공통 함수
export async function adminApiCall(url: string, options: RequestInit = {}) {
  const supabase = createClient()
  
  try {
    // 먼저 현재 유저 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('사용자 인증이 필요합니다. 다시 로그인해주세요.')
    }

    // 세션에서 토큰 가져오기
    let { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.access_token) {
      // 세션이 없으면 새로고침 시도
      const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError || !refreshedSession.session?.access_token) {
        throw new Error('인증 토큰을 갱신할 수 없습니다. 다시 로그인해주세요.')
      }
      
      // 갱신된 세션 사용
      session = refreshedSession.session
    }

    // Authorization 헤더 추가 (이스케이프 문자 처리)
    const token = session.access_token.replace(/!/g, '\\!')
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }

    return fetch(url, {
      ...options,
      headers
    })
  } catch (error) {
    console.error('adminApiCall 에러:', error)
    throw error
  }
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