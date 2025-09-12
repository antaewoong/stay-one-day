import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { currentPassword, newPassword, userType } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: '현재 비밀번호와 새 비밀번호가 필요합니다' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: '새 비밀번호는 8자 이상이어야 합니다' },
        { status: 400 }
      )
    }

    // 1. 현재 세션 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    // 2. 현재 비밀번호 검증을 위해 재로그인 시도
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: session.user.email!,
      password: currentPassword
    })

    if (signInError) {
      return NextResponse.json(
        { error: '현재 비밀번호가 올바르지 않습니다' },
        { status: 400 }
      )
    }

    // 3. Supabase Auth 비밀번호 변경
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (updateError) {
      console.error('Supabase Auth 비밀번호 변경 실패:', updateError)
      return NextResponse.json(
        { error: '비밀번호 변경에 실패했습니다' },
        { status: 500 }
      )
    }

    // 4. 해당 사용자 테이블의 password_hash도 업데이트 (RLS 정책 준수)
    const userId = session.user.id
    let tableUpdateSuccess = false

    try {
      switch (userType) {
        case 'host':
          // RLS 정책: 호스트는 본인의 레코드만 업데이트 가능 (auth.uid() 체크)
          const { error: hostError } = await supabase
            .from('hosts')
            .update({ password_hash: newPassword })
            .eq('auth_user_id', userId)

          if (!hostError) {
            tableUpdateSuccess = true
            console.log('✅ 호스트 테이블 비밀번호 업데이트 성공 (RLS 준수)')
          } else {
            console.error('❌ 호스트 테이블 업데이트 실패:', hostError)
          }
          break

        case 'admin':
          // RLS 정책: 관리자는 본인의 레코드만 업데이트 가능
          const { error: adminError } = await supabase
            .from('admin_users')
            .update({ password_hash: newPassword })
            .eq('user_id', userId)

          if (!adminError) {
            tableUpdateSuccess = true
            console.log('✅ 관리자 테이블 비밀번호 업데이트 성공 (RLS 준수)')
          } else {
            console.error('❌ 관리자 테이블 업데이트 실패:', adminError)
          }
          break

        case 'influencer':
          // RLS 정책: 인플루언서는 본인의 레코드만 업데이트 가능 (이메일 매칭)
          const { error: influencerError } = await supabase
            .from('influencers')
            .update({ password_hash: newPassword })
            .eq('email', session.user.email)

          if (!influencerError) {
            tableUpdateSuccess = true
            console.log('✅ 인플루언서 테이블 비밀번호 업데이트 성공 (RLS 준수)')
          } else {
            console.error('❌ 인플루언서 테이블 업데이트 실패:', influencerError)
          }
          break

        default:
          // 일반 사용자의 경우 profiles 테이블 업데이트 (RLS 정책: 본인만 업데이트)
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', userId)

          if (!profileError) {
            tableUpdateSuccess = true
            console.log('✅ 프로필 테이블 업데이트 성공 (RLS 준수)')
          }
      }
    } catch (tableError) {
      console.error('❌ 테이블 업데이트 중 오류 (RLS 정책 위반 가능성):', tableError)
    }

    return NextResponse.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다',
      authUpdated: true,
      tableUpdated: tableUpdateSuccess
    })

  } catch (error) {
    console.error('비밀번호 변경 처리 중 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}