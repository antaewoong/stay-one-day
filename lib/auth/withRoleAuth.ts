import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type Role = 'admin' | 'super_admin' | 'host' | 'influencer'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getToken(req: NextRequest) {
  const hdr = req.headers.get('authorization')
  if (hdr?.startsWith('Bearer ')) return hdr.slice('Bearer '.length)
  return req.cookies.get('sb-access-token')?.value
}

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, code, message }, { status })
}

export function withRoleAuth<T extends Role>(
  required: T,
  handler: (ctx: {
    req: NextRequest
    supabase: ReturnType<typeof createClient>
    user: { id: string }
    roleIds: { hostId?: string; influencerId?: string; adminRole?: 'admin'|'super_admin' }
  }) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const token = getToken(req)
    if (!token) return jsonError(401, 'UNAUTHENTICATED', '로그인이 필요합니다.')

    // 사용자 JWT로 동작하는 클라이언트 (RLS 적용)
    const supabase = createClient(url, anon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData.user) return jsonError(401, 'UNAUTHENTICATED', '세션이 유효하지 않습니다.')

    const user = userData.user
    const roleIds: { hostId?: string; influencerId?: string; adminRole?: 'admin'|'super_admin' } = {}

    if (required === 'host') {
      const { data: host } = await supabase
        .from('hosts')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle()
      if (!host) return jsonError(403, 'FORBIDDEN', '호스트 권한이 없습니다.')
      roleIds.hostId = host.id
    }

    if (required === 'influencer') {
      const { data: inf } = await supabase
        .from('influencers')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle()
      if (!inf) return jsonError(403, 'FORBIDDEN', '인플루언서 권한이 없습니다.')
      roleIds.influencerId = inf.id
    }

    if (required === 'admin' || required === 'super_admin') {
      const { data: admin } = await supabase
        .from('admin_accounts')
        .select('role')
        .eq('auth_user_id', user.id)
        .maybeSingle()
      const ok =
        admin &&
        (required === 'admin' || (required === 'super_admin' && admin.role === 'super_admin'))
      if (!ok) return jsonError(403, 'FORBIDDEN', '관리자 권한이 없습니다.')
      roleIds.adminRole = admin!.role as 'admin' | 'super_admin'
    }

    return handler({ req, supabase, user: { id: user.id }, roleIds })
  }
}