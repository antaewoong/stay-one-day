import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function withAdminAuth(req: NextRequest, handler: (req: NextRequest) => Promise<NextResponse>) {
  const cookieStore = cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 })
  }

  // JWT role or profile-based role 확인
  const role = (user.app_metadata as any)?.role ?? 'user'
  if (role !== 'admin' && role !== 'super_admin') {
    // RLS로 admin 권한 확인
    const { data: adminAccount } = await supabase
      .from('admin_accounts')
      .select('id, email, is_active')
      .eq('auth_user_id', user.id)
      .eq('is_active', true)
      .single()
    
    if (!adminAccount) {
      return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 })
    }
  }

  return handler(req)
}

// 사용 예시:
// export const POST = (req: NextRequest) => withAdminAuth(req, async (req, ctx) => {
//   // ctx.adminId, ctx.adminEmail 사용 가능
//   return NextResponse.json({ ok: true })
// })