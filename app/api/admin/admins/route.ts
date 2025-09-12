import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/middleware/withAdminAuth'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export const GET = (req: NextRequest) =>
  withAdminAuth(req, async (request: NextRequest, ctx: any) => {
    try {
      console.log('✅ 관리자 인증 성공:', ctx.adminEmail)
      
      // Service role client 사용 (GPT 권장)
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: admins, error } = await supabaseAdmin
        .from('admin_accounts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('관리자 목록 조회 에러:', error)
        return NextResponse.json({ error: '관리자 목록 조회에 실패했습니다' }, { status: 500 })
      }

      return NextResponse.json({ admins })
    } catch (error) {
      console.error('관리자 목록 조회 에러:', error)
      return NextResponse.json({ error: '관리자 목록 조회에 실패했습니다' }, { status: 500 })
    }
  })

export const POST = (req: NextRequest) =>
  withAdminAuth(req, async (request: NextRequest, ctx: any) => {
    try {
      console.log('✅ 관리자 인증 성공:', ctx.adminEmail)
      
      // Service role client 사용 (GPT 권장)
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const body = await request.json()
      const { username, password, name, email, role = 'admin' } = body

      if (!username || !password || !name) {
        return NextResponse.json(
          { error: '필수 필드를 모두 입력해주세요.' },
          { status: 400 }
        )
      }

      const { data, error } = await supabaseAdmin
        .from('admin_accounts')
        .insert({
          username,
          password_hash: password, // 실제로는 bcrypt 해시화 필요
          name,
          email,
          role,
          is_active: true
        })
        .select()

      if (error) {
        console.error('관리자 생성 에러:', error)
        return NextResponse.json(
          { error: error.message || '관리자 생성에 실패했습니다' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, admin: data[0] })
    } catch (error) {
      console.error('관리자 생성 에러:', error)
      return NextResponse.json(
        { error: '관리자 생성에 실패했습니다' },
        { status: 500 }
      )
    }
  })