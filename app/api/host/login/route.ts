import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables:', { supabaseUrl: !!supabaseUrl, supabaseServiceKey: !!supabaseServiceKey })
      return NextResponse.json(
        { error: '서버 설정 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // Service role client - RLS 우회 가능
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let hostId, password
    
    try {
      const body = await request.json()
      hostId = body.hostId
      password = body.password
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다.' },
        { status: 400 }
      )
    }

    if (!hostId || !password) {
      return NextResponse.json(
        { error: '호스트 ID와 비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    try {
      // 데이터베이스에서 호스트 계정 조회 (host_id 또는 email로)
      let { data: hostAccounts, error } = await supabase
        .from('hosts')
        .select('*')
        .eq('status', 'active')
        .eq('host_id', hostId)

      // host_id로 찾지 못했으면 email로 시도
      if (!hostAccounts || hostAccounts.length === 0) {
        const result = await supabase
          .from('hosts')
          .select('*')
          .eq('status', 'active')
          .eq('email', hostId)
        hostAccounts = result.data
        error = result.error
      }

      if (error || !hostAccounts || hostAccounts.length === 0) {
        return NextResponse.json(
          { error: '존재하지 않거나 비활성화된 호스트 계정입니다.' },
          { status: 401 }
        )
      }

      const hostAccount = hostAccounts[0]

      // password_hash가 null인 경우 대체 비밀번호 처리
      let validPassword = false
      if (hostAccount.password_hash) {
        validPassword = hostAccount.password_hash === password
      } else {
        // password_hash가 null인 경우 임시 비밀번호 사용
        const tempPasswords = {
          'gongan87@naver.com': 'gongan87pass!',
          'sunstone@gmail.com': 'sunstone2024!'
        }
        const tempPassword = tempPasswords[hostAccount.email] || tempPasswords[hostAccount.host_id]
        validPassword = tempPassword && tempPassword === password
      }

      if (!validPassword) {
        return NextResponse.json(
          { error: '비밀번호가 일치하지 않습니다.' },
          { status: 401 }
        )
      }

      // 최근 로그인 시간 업데이트
      await supabase
        .from('hosts')
        .update({ last_login: new Date().toISOString() })
        .eq('id', hostAccount.id)

      // 로그인 성공 응답
      return NextResponse.json({
        success: true,
        host: {
          id: hostAccount.id,
          host_id: hostAccount.host_id || hostAccount.email, // host_id가 null이면 email 사용
          name: hostAccount.representative_name,
          email: hostAccount.email,
          business_name: hostAccount.business_name,
          status: hostAccount.status
        }
      })

    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: '호스트 계정을 찾을 수 없습니다.' },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('Host login error:', error)
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}