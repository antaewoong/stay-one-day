import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

function serverSB() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          try { cookieStore.set({ name, value, ...options }) } catch {}
        },
        remove: (name, options) => {
          try { cookieStore.delete({ name, ...options }) } catch {}
        },
      },
    }
  )
}

export async function withAdminAuth(
  req: NextRequest,
  handler: (req: NextRequest, supabase: ReturnType<typeof serverSB>) => Promise<NextResponse>
) {
  const supabase = serverSB()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ ok:false, error:'Unauthorized' }, { status: 401 })
  }
  const role = (user.app_metadata as any)?.role ?? 'user'
  if (role !== 'admin' && role !== 'super_admin') {
    return NextResponse.json({ ok:false, error:'Forbidden' }, { status: 403 })
  }
  return handler(req, supabase)
}

// 사용 예시:
// export const POST = (req: NextRequest) => withAdminAuth(req, async (req, ctx) => {
//   // ctx.adminId, ctx.adminEmail 사용 가능
//   return NextResponse.json({ ok: true })
// })