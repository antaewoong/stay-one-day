// GPT 제안대로 withAdminAuth 미들웨어 사용하여 완전 재작성
import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/middleware/withAdminAuth'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// GPT 제안: 미들웨어를 사용한 POST 핸들러
export const POST = (req: NextRequest) =>
  withAdminAuth(req, async (req: NextRequest, ctx: any) => {
    try {
      console.log('✅ 관리자 인증 성공:', ctx)
      
      const body = await req.json()
      const { targetAdminEmail } = body

      if (!targetAdminEmail) {
        return NextResponse.json(
          { error: '관리자 이메일이 필요합니다' },
          { status: 400 }
        )
      }

      // Service role client 사용 (GPT 제안대로 RLS 우회)
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // 대상 관리자 확인
      const { data: targetAdmin, error: targetError } = await supabaseAdmin
        .from('admin_accounts')
        .select('id, email, is_active')
        .eq('email', targetAdminEmail.toLowerCase())
        .eq('is_active', true)
        .single()

      if (targetError || !targetAdmin) {
        console.error('대상 관리자 확인 실패:', targetError)
        return NextResponse.json(
          { error: '대상 관리자를 찾을 수 없습니다' },
          { status: 400 }
        )
      }

      // 토큰 생성
      const token = `STAY_ADMIN_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

      // Service Role로 직접 삽입 (RLS 우회)
      const { data: tokenData, error: tokenError } = await supabaseAdmin
        .from('telegram_registration_tokens')
        .insert({
          token,
          admin_email: targetAdminEmail.toLowerCase(),
          created_by_admin_id: ctx.adminId, // 미들웨어에서 제공된 관리자 ID
          expires_at: expiresAt
        })
        .select()
        .single()

      if (tokenError) {
        console.error('토큰 저장 실패:', tokenError)
        return NextResponse.json(
          { error: '토큰 저장에 실패했습니다', details: tokenError },
          { status: 500 }
        )
      }

      console.log(`✅ 텔레그램 등록 토큰 생성: ${targetAdminEmail} by ${ctx.adminEmail}`)

      return NextResponse.json({
        success: true,
        data: {
          token,
          adminEmail: targetAdminEmail,
          expiresAt,
          instructions: [
            '1. 텔레그램에서 Stay OneDay Bot 검색',
            '2. /start 명령어로 봇 시작',
            `3. /register_token ${token} 명령어 입력`,
            '4. 등록 완료 (토큰은 1시간 후 만료)'
          ]
        }
      })

    } catch (error) {
      console.error('텔레그램 등록 토큰 생성 실패:', error)
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다', details: error },
        { status: 500 }
      )
    }
  })

// GPT 제안: 미들웨어를 사용한 GET 핸들러 (활성 세션 조회)
export const GET = (req: NextRequest) =>
  withAdminAuth(req, async (req: NextRequest, ctx: any) => {
    try {
      // Service role client로 활성 세션 조회
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: sessions, error } = await supabaseAdmin
        .from('telegram_sessions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('세션 조회 실패:', error)
        return NextResponse.json(
          { error: '세션 조회에 실패했습니다' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          totalSessions: sessions?.length || 0,
          sessions: sessions || []
        }
      })

    } catch (error) {
      console.error('텔레그램 세션 조회 실패:', error)
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다' },
        { status: 500 }
      )
    }
  })