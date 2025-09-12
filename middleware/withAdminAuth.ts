import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { serverSB } from '@/lib/supabase/server'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!

type AdminRow = { auth_user_id: string; role: string; is_active: boolean }
const dbg = (...a: any[]) => console.log('[withAdminAuth]', ...a)

export function withAdminAuth(
  handler: (req: NextRequest, db: ReturnType<typeof createClient>, ctx: { userId: string; admin: AdminRow }) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    dbg('start', req.nextUrl.pathname)

    // 0) 우선 쿠키 기반
    let db = serverSB()
    let { data: { user }, error } = await db.auth.getUser()
    dbg('cookieAuth', { userId: user?.id ?? null, err: error?.message ?? null })

    // 1) 헤더에서 토큰 확보 (Authorization 또는 x-supabase-auth)
    const h = req.headers
    const hAuth = h.get('authorization') ?? h.get('Authorization') ?? ''
    const hAlt = h.get('x-supabase-auth') ?? h.get('X-Supabase-Auth') ?? ''
    let accessToken: string | null = null

    const pickToken = (raw: string) => {
      if (!raw) return null
      if (/^Bearer\s+/i.test(raw)) return raw.replace(/^Bearer\s+/i, '').trim()
      // 대체 헤더는 토큰이 그대로 온다고 가정
      return raw.trim()
    }

    if (!user || error) {
      accessToken = pickToken(hAuth) || pickToken(hAlt)
      dbg('headerToken', accessToken ? accessToken.slice(0, 12) + '…' : null)

      if (accessToken) {
        const tokenClient = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } })
        const { data: tu, error: te } = await tokenClient.auth.getUser(accessToken)
        dbg('getUserByToken', { userId: tu?.user?.id ?? null, err: te?.message ?? null })

        if (!te && tu?.user) {
          user = tu.user
          error = null
          db = createClient(URL, ANON, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: { headers: { Authorization: `Bearer ${accessToken}` } },
          })
          dbg('dbBoundWithToken')
        }
      }
    }

    if (error || !user) {
      dbg('auth:fail')
      return NextResponse.json({ ok: false, stage: 'auth', error: 'Unauthorized' }, { status: 401 })
    }

    // 2) 관리자 확인은 서비스키로
    const adminDB = createClient(URL, SERVICE, { auth: { persistSession: false } })
    const { data: admin, error: aerr } = await adminDB
      .from('admin_accounts')
      .select('auth_user_id, role, is_active')
      .eq('auth_user_id', user.id)
      .eq('is_active', true)
      .single<AdminRow>()
    dbg('adminCheck', { ok: !!admin, err: aerr?.message ?? null })

    if (aerr || !admin) {
      return NextResponse.json({ ok: false, stage: 'adminCheck', error: 'Forbidden' }, { status: 403 })
    }

    return handler(req, db, { userId: user.id, admin })
  }
}

// 사용 예시:
// export const POST = (req: NextRequest) => withAdminAuth(req, async (req, ctx) => {
//   // ctx.adminId, ctx.adminEmail 사용 가능
//   return NextResponse.json({ ok: true })
// })