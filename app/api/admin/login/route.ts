import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// App Router에서 createServerClient(@supabase/ssr) 사용 시 쿠키 자동 세팅됩니다.
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요' },
        { status: 400 }
      )
    }

    // 클라이언트용 (쿠키 기반)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 401 })
    }

    // JWT role=admin 여부는 RLS/미들웨어에서 계속 검증
    return NextResponse.json({ ok: true, user: data.user })

  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Login failed' }, { status: 500 })
  }
}