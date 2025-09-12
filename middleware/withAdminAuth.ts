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

    const isJWT = (t?: string|null) =>
      !!t && /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(t)

    const decode = (t: string) => JSON.parse(Buffer.from(t.split('.')[1], 'base64').toString())
    const SUPA_ISS = `${URL}/auth/v1`

    const pickToken = (raw: string|null) => {
      if (!raw) return null
      const v = raw.trim()
      return /^Bearer\s+/i.test(v) ? v.replace(/^Bearer\s+/i,'').trim() : v
    }

    // 1) 헤더에서 토큰 확보 (Authorization 또는 x-supabase-auth)
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
    const altHeader  = req.headers.get('x-supabase-auth') || req.headers.get('X-Supabase-Auth')
    let token = pickToken(authHeader) || pickToken(altHeader)

    if (!user || error) {
      if (token && !isJWT(token)) {
        dbg('tokenFormat:bad', token?.slice(0,12))
        return NextResponse.json({ ok:false, stage:'auth:tokenFormat', error:'invalid token format' }, { status: 401 })
      }

      if (token) {
        // Issuer 체크
        try {
          const payload = decode(token!)
          if (payload?.iss !== SUPA_ISS) {
            dbg('issuerMismatch', { tokenIss: payload?.iss, expectedIss: SUPA_ISS })
            return NextResponse.json({
              ok: false,
              stage: 'auth:issuerMismatch',
              error: `token.iss=${payload?.iss} expected=${SUPA_ISS}`
            }, { status: 401 })
          }
        } catch (decodeErr) {
          dbg('decode:fail', decodeErr)
          return NextResponse.json({ ok: false, stage: 'auth:decode', error: 'cannot decode token' }, { status: 401 })
        }

        dbg('headerToken', token.slice(0, 12) + '…')
        const tokenClient = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } })
        const { data: tu, error: te } = await tokenClient.auth.getUser(token)
        dbg('getUserByToken', { userId: tu?.user?.id ?? null, err: te?.message ?? null })

        if (te || !tu?.user) {
          dbg('getUser fail', te?.message)
          return NextResponse.json({ ok:false, stage:'auth:getUser', error: te?.message || 'invalid token' }, { status: 401 })
        }

        user = tu.user
        error = null
        db = createClient(URL, ANON, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${token}` } },
        })
        dbg('dbBoundWithToken')
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