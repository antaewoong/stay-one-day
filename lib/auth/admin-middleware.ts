import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseOnEdge } from '@/lib/supabase-edge'

function adminMiddleware(handler: Function) {
  return async function(req: NextRequest, context?: any) {
    const { supabase } = createSupabaseOnEdge(req)

    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 역할 확인 (관리자만)
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!userRole || !['admin', 'super_admin'].includes(userRole.role)) {
      return new NextResponse(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 원래 핸들러 실행
    return handler(req, context)
  }
}

export default adminMiddleware
export { adminMiddleware as withAdminAuth }