import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { serverSB } from '@/lib/supabase/server'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!

type AdminRow = { auth_user_id: string; role: string; is_active: boolean }

const dbg = (...args: any[]) => console.log('[withAdminAuth]', ...args)

export function withAdminAuth(
  handler: (req: NextRequest, db: ReturnType<typeof createClient>, ctx: { userId: string; admin: AdminRow }) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    console.log('⭐ withAdminAuth CALLED for:', req.nextUrl.pathname)
    dbg('phase=start', { path: req.nextUrl.pathname })

    // 1) 쿠키 기반 세션
    let supa = serverSB()
    let { data: { user }, error } = await supa.auth.getUser()
    dbg('cookieAuth', { userId: user?.id ?? null, err: error?.message ?? null })

    // 2) Bearer 토큰 시도 (쿠키 실패 or 명시적 토큰 우선)
    let accessToken: string | null = null
    const rawAuth = req.headers.get('authorization') ?? req.headers.get('Authorization') ?? ''
    if (!user || error) {
      if (rawAuth) dbg('authHeader:present')
      if (/^Bearer\s+/i.test(rawAuth)) {
        accessToken = rawAuth.replace(/^Bearer\s+/i, '').trim()
        dbg('bearer:found', accessToken ? `${accessToken.slice(0, 12)}…` : null)

        // 토큰 검증
        const tokenClient = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } })
        const { data: tokenUser, error: tokenErr } = await tokenClient.auth.getUser(accessToken)
        dbg('bearer:getUser', { userId: tokenUser?.user?.id ?? null, err: tokenErr?.message ?? null })

        if (!tokenErr && tokenUser?.user) {
          user = tokenUser.user
          error = null
          // 이후 RLS 쿼리에 토큰이 실리도록 헤더 바인딩된 클라이언트 사용
          supa = createClient(URL, ANON, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: { headers: { Authorization: `Bearer ${accessToken}` } },
          })
          dbg('bearer:clientBound')
        }
      } else if (rawAuth) {
        dbg('authHeader:invalidFormat', rawAuth.split(' ')[0]) // e.g. 'Token' 같은 오타 케이스
      }
    }

    // 3) 최종 인증 실패
    if (error || !user) {
      dbg('auth:fail')
      return NextResponse.json(
        { ok: false, stage: 'auth', error: 'Unauthorized (no valid cookie/bearer)' },
        { status: 401 },
      )
    }

    // 4) 관리자 확인 (SERVICE 키로 admin_accounts 조회)
    try {
      const adminDB = createClient(URL, SERVICE, { auth: { persistSession: false } })
      const { data: admin, error: aerr } = await adminDB
        .from('admin_accounts')
        .select('auth_user_id, role, is_active')
        .eq('auth_user_id', user.id)
        .eq('is_active', true)
        .single<AdminRow>()
      dbg('adminCheck', { userId: user.id, ok: !!admin, err: aerr?.message ?? null })

      if (aerr || !admin) {
        return NextResponse.json({ ok: false, stage: 'adminCheck', error: 'Forbidden' }, { status: 403 })
      }

      // 5) 통과
      return handler(req, supa, { userId: user.id, admin })
    } catch (e: any) {
      dbg('adminCheck:exception', e?.message ?? e)
      return NextResponse.json({ ok: false, stage: 'adminCheck', error: e?.message ?? 'error' }, { status: 500 })
    }
  }
}

// 사용 예시:
// export const POST = (req: NextRequest) => withAdminAuth(req, async (req, ctx) => {
//   // ctx.adminId, ctx.adminEmail 사용 가능
//   return NextResponse.json({ ok: true })
// })