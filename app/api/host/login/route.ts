import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Service role client - RLS 우회 가능
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
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
      // 데이터베이스에서 호스트 계정 조회
      const { data: hostAccount, error } = await supabase
        .from('hosts')
        .select('*')
        .eq('host_id', hostId)
        .eq('status', 'active') // 활성 상태인 호스트만
        .single()

      if (error || !hostAccount) {
        return NextResponse.json(
          { error: '존재하지 않거나 비활성화된 호스트 계정입니다.' },
          { status: 401 }
        )
      }

      // 비밀번로 확인 (실제로는 bcrypt 해시 비교해야 함)
      if (!hostAccount.password_hash || hostAccount.password_hash !== password) {
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
          host_id: hostAccount.host_id,
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