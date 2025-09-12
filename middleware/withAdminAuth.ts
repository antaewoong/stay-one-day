// GPT 제안 - 서버 라우트 인증 미들웨어 (Authorization 필수)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function withAdminAuth(
  req: NextRequest,
  handler: (req: NextRequest, ctx?: any) => Promise<NextResponse>
) {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') 
                || data.session?.access_token

  if (!token) {
    return NextResponse.json({ ok: false, error: 'No authorization header' }, { status: 403 })
  }

  try {
    // 토큰 디코드해서 role 확인
    const payload = JSON.parse(Buffer.from(token.split('.')[1] || '', 'base64').toString() || '{}')
    
    // 관리자 권한 확인
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data: adminAccount } = await supabaseAdmin
      .from('admin_accounts')
      .select('id, email, is_active')
      .eq('auth_user_id', payload.sub)
      .eq('is_active', true)
      .single()
    
    if (!adminAccount) {
      return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 })
    }
    
    // 관리자 정보를 컨텍스트에 추가
    const ctx = {
      adminId: adminAccount.id,
      adminEmail: adminAccount.email,
      userId: payload.sub
    }
    
    return handler(req, ctx)
  } catch (error) {
    console.error('Admin auth validation error:', error)
    return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 })
  }
}

// 사용 예시:
// export const POST = (req: NextRequest) => withAdminAuth(req, async (req, ctx) => {
//   // ctx.adminId, ctx.adminEmail 사용 가능
//   return NextResponse.json({ ok: true })
// })