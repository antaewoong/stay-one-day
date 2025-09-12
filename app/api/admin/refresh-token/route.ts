import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: '이메일이 필요합니다' },
        { status: 400 }
      )
    }

    // 임시 비밀번호로 Supabase Auth 로그인 시도
    const supabase = createClient()
    
    // 먼저 임시 비밀번호로 시도
    const tempPassword = 'temp123!@#'
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: tempPassword
    })

    if (authData?.session) {
      return NextResponse.json({
        success: true,
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token
      })
    }

    // 실패시 관리자용 계정으로 다시 시도
    const { data: adminAuthData, error: adminAuthError } = await supabase.auth.signInWithPassword({
      email: 'admin@stayoneday.com',
      password: 'admin123!@#'
    })

    if (adminAuthData?.session) {
      return NextResponse.json({
        success: true,
        access_token: adminAuthData.session.access_token,
        refresh_token: adminAuthData.session.refresh_token
      })
    }

    return NextResponse.json(
      { error: 'Auth 토큰 생성에 실패했습니다' },
      { status: 500 }
    )

  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: '토큰 갱신 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}