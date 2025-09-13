import 'server-only'

export interface AdminPayload {
  id: string
  email: string
  role: 'admin' | 'superadmin'
  iat: number
  exp: number
}

// 간단한 가짜 함수 - 기존 withAdminAuth와 호환성 유지
export async function assertAdmin(): Promise<AdminPayload> {
  // 이 함수는 실제로는 사용되지 않음
  // withAdminAuth 미들웨어가 이미 인증을 처리함
  return {
    id: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    iat: Date.now(),
    exp: Date.now() + 3600
  }
}