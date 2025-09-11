import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// POST: 인플루언서 로그인 (Supabase Auth 기반)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { username, password } = body

    // 입력값 검증
    if (!username?.trim() || !password?.trim()) {
      return NextResponse.json(
        { success: false, message: '아이디와 비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 사용자가 입력한 username이 이메일인지 확인
    let email = username.includes('@') ? username.trim() : null
    
    if (!email) {
      // username이 이메일이 아니면 influencers 테이블에서 이메일 찾기
      const { data: influencerData, error: findError } = await supabase
        .from('influencers')
        .select('email')
        .eq('name', username.trim())
        .eq('status', 'active')
        .single()
      
      if (findError || !influencerData) {
        return NextResponse.json(
          { success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' },
          { status: 401 }
        )
      }
      
      email = influencerData.email
    }
    
    console.log('🔐 인플루언서 로그인 시도:', { username: username.trim(), email })

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error || !data.user) {
      console.log('❌ Auth 로그인 실패:', error?.message)
      return NextResponse.json(
        { success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    console.log('✅ Auth 로그인 성공:', data.user.id)

    // user_roles에서 인플루언서 역할 확인
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .single()

    if (roleError || !userRole || userRole.role !== 'influencer') {
      console.log('❌ 인플루언서 권한 없음:', roleError?.message)
      await supabase.auth.signOut()
      return NextResponse.json(
        { success: false, message: '인플루언서 권한이 없습니다.' },
        { status: 401 }
      )
    }

    console.log('✅ 인플루언서 권한 확인 완료')

    // influencers 테이블에서 인플루언서 정보 조회
    const { data: influencer, error: influencerError } = await supabase
      .from('influencers')
      .select('*')
      .or(`name.eq.${username.trim()},email.eq.${username.trim()}`)
      .eq('status', 'active')
      .maybeSingle()

    if (influencerError || !influencer) {
      console.log('❌ 인플루언서 정보 조회 실패:', influencerError?.message)
      await supabase.auth.signOut()
      return NextResponse.json(
        { success: false, message: '인플루언서 정보를 찾을 수 없습니다.' },
        { status: 401 }
      )
    }

    console.log('✅ 인플루언서 정보 조회 성공:', influencer.name)

    // 로그인 시간 업데이트
    await supabase
      .from('influencers')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', influencer.id)

    // 민감한 정보 제거 후 반환
    const { password_hash, ...safeInfluencer } = influencer

    return NextResponse.json({
      success: true,
      message: '로그인 성공',
      influencer: {
        ...safeInfluencer,
        auth_user_id: data.user.id
      }
    })
  } catch (error) {
    console.error('인플루언서 로그인 API 에러:', error)
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}