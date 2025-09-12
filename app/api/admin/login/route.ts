import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    let username, password
    
    try {
      const body = await request.json()
      username = body.username
      password = body.password
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다.' },
        { status: 400 }
      )
    }

    if (!username || !password) {
      return NextResponse.json(
        { error: '아이디와 비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 먼저 환경변수 계정 체크 (fallback)
    const adminUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD
    
    if (username === adminUsername && password === adminPassword) {
      console.log('✅ 환경변수 관리자 로그인 성공')
      
      // 환경변수 관리자용 임시 토큰 (실제 admin 계정의 auth_user_id 사용)
      const tempToken = `admin-314ec1cd-a4af-4583-8d72-6f9d22e4d729`

      return NextResponse.json({
        success: true,
        admin: {
          id: 'env-admin',
          username: username,
          name: '메인 관리자',
          email: 'admin@stayoneday.com',
          role: 'super_admin',
          access_token: tempToken
        }
      })
    }

    // Service role key로 RLS 우회
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing:', { 
        hasUrl: !!supabaseUrl, 
        hasServiceKey: !!supabaseServiceKey 
      })
      return NextResponse.json(
        { error: '서버 설정 오류입니다.' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
      // 데이터베이스에서 관리자 계정 조회
      const { data: adminAccount, error } = await supabase
        .from('admin_accounts')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single()

      if (error || !adminAccount) {
        return NextResponse.json(
          { error: '존재하지 않는 관리자 계정입니다.' },
          { status: 401 }
        )
      }

      // 비밀번호 확인 (실제로는 bcrypt 해시 비교해야 함)
      if (adminAccount.password_hash !== password) {
        return NextResponse.json(
          { error: '비밀번호가 일치하지 않습니다.' },
          { status: 401 }
        )
      }

      // 최근 로그인 시간 업데이트
      await supabase
        .from('admin_accounts')
        .update({ last_login: new Date().toISOString() })
        .eq('id', adminAccount.id)

      // 정상적인 Supabase Auth 로그인
      const serverClient = createServerClient()
      const { data: authData, error: authError } = await serverClient.auth.signInWithPassword({
        email: adminAccount.email,
        password: password
      })

      if (authError || !authData.session) {
        console.error('❌ Supabase Auth 로그인 실패:', authError?.message)
        return NextResponse.json(
          { error: 'Supabase Auth 로그인에 실패했습니다. 비밀번호를 확인해주세요.' },
          { status: 401 }
        )
      }

      console.log('✅ Supabase Auth 로그인 성공')

      // 정상적인 JWT 토큰과 함께 로그인 성공 응답
      return NextResponse.json({
        success: true,
        admin: {
          id: adminAccount.id,
          username: adminAccount.username,
          name: adminAccount.name,
          email: adminAccount.email,
          role: adminAccount.role,
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token
        }
      })
    } catch (dbError) {
      console.error('Database error, falling back to env variables:', dbError)
      return NextResponse.json(
        { error: '존재하지 않는 관리자 계정입니다.' },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}