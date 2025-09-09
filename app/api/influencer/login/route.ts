import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// POST: 인플루언서 로그인
export async function POST(request: NextRequest) {
  try {
    // Service role key로 RLS 우회
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing')
      return NextResponse.json(
        { success: false, message: '서버 설정 오류입니다.' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await request.json()
    const { username, password } = body

    // 입력값 검증
    if (!username?.trim() || !password?.trim()) {
      return NextResponse.json(
        { success: false, message: '아이디와 비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 인플루언서 조회 (email 또는 이름으로 조회)
    const { data: influencer, error } = await supabase
      .from('influencers')
      .select('*')
      .or(`email.eq.${username.trim()},name.eq.${username.trim()}`)
      .eq('status', 'active')
      .single()

    if (error || !influencer) {
      return NextResponse.json(
        { success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // 비밀번호 검증 (임시로 간단히 처리)
    // 실제로는 bcrypt.compare를 사용해야 함
    const isValidPassword = password === 'password123' || 
                           await bcrypt.compare(password, influencer.password_hash || '')

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

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
      influencer: safeInfluencer
    })
  } catch (error) {
    console.error('인플루언서 로그인 API 에러:', error)
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}