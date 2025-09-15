import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseOnEdge } from '@/lib/supabase-edge'

function withHostAuth(handler: Function) {
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

    // 역할 확인
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!userRole || !['host', 'admin', 'super_admin'].includes(userRole.role)) {
      return new NextResponse(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 호스트 정보 조회 (역할이 host인 경우)
    let hostId = null
    if (userRole.role === 'host') {
      const { data: hostData } = await supabase
        .from('hosts')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      hostId = hostData?.id
    }

    // 원래 핸들러 실행 (roleIds 객체와 함께)
    return handler({
      req,
      supabase,
      roleIds: { hostId },
      user,
      userRole: userRole.role
    })
  }
}

export default withHostAuth
export { withHostAuth }