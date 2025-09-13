import { NextRequest, NextResponse } from 'next/server'
import { withRoleAuth } from './withRoleAuth'

/**
 * 관리자 권한이 필요한 API 엔드포인트에 사용하는 미들웨어
 */
export function withAdminAuth(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return withRoleAuth('admin', async ({ req }) => {
    return handler(req)
  })
}