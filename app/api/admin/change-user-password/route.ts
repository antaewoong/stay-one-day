import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { validateAdminAuth, supabaseService } from '@/lib/auth/admin-service'

export const dynamic = 'force-dynamic'

/**
 * 관리자가 다른 사용자의 비밀번호를 변경하는 API
 * Supabase Auth Admin API를 사용하여 직접 사용자 비밀번호 변경
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 관리자 인증 확인
    const adminAuth = await validateAdminAuth(request)
    if (!adminAuth.isValid || !adminAuth.isAdmin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, userEmail, newPassword, userType } = body

    if (!userId && !userEmail) {
      return NextResponse.json(
        { error: '사용자 ID 또는 이메일이 필요합니다' },
        { status: 400 }
      )
    }

    if (!newPassword) {
      return NextResponse.json(
        { error: '새 비밀번호가 필요합니다' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: '새 비밀번호는 8자 이상이어야 합니다' },
        { status: 400 }
      )
    }

    // 2. 사용자 정보 조회 (userId가 없으면 이메일로 조회)
    let targetUserId = userId
    if (!targetUserId && userEmail) {
      const { data: authUser, error: getUserError } = await supabaseService.auth.admin.getUserByEmail(userEmail)
      
      if (getUserError || !authUser.user) {
        console.error('사용자 조회 실패:', getUserError)
        return NextResponse.json(
          { error: '사용자를 찾을 수 없습니다' },
          { status: 404 }
        )
      }
      
      targetUserId = authUser.user.id
    }

    // 3. Supabase Auth Admin API를 사용하여 비밀번호 변경
    const { data: updateResult, error: updateError } = await supabaseService.auth.admin.updateUserById(
      targetUserId,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Supabase Auth 비밀번호 변경 실패:', updateError)
      return NextResponse.json(
        { error: '비밀번호 변경에 실패했습니다' },
        { status: 500 }
      )
    }

    console.log('✅ Supabase Auth 비밀번호 변경 성공:', updateResult.user.email)

    // 4. 해당 사용자 테이블의 password_hash도 업데이트 (Admin Service 사용으로 RLS 우회)
    let tableUpdateSuccess = false

    try {
      switch (userType) {
        case 'host':
          const { error: hostError } = await supabaseService
            .from('hosts')
            .update({ 
              password_hash: newPassword,
              updated_at: new Date().toISOString()
            })
            .eq('auth_user_id', targetUserId)

          if (!hostError) {
            tableUpdateSuccess = true
            console.log('✅ 호스트 테이블 비밀번호 업데이트 성공')
          } else {
            console.error('❌ 호스트 테이블 업데이트 실패:', hostError)
          }
          break

        case 'admin':
          const { error: adminError } = await supabaseService
            .from('admin_accounts')
            .update({ 
              password_hash: newPassword,
              updated_at: new Date().toISOString()
            })
            .eq('auth_user_id', targetUserId)

          if (!adminError) {
            tableUpdateSuccess = true
            console.log('✅ 관리자 테이블 비밀번호 업데이트 성공')
          } else {
            console.error('❌ 관리자 테이블 업데이트 실패:', adminError)
          }
          break

        case 'influencer':
          const { error: influencerError } = await supabaseService
            .from('influencers')
            .update({ 
              password_hash: newPassword,
              updated_at: new Date().toISOString()
            })
            .eq('email', updateResult.user.email)

          if (!influencerError) {
            tableUpdateSuccess = true
            console.log('✅ 인플루언서 테이블 비밀번호 업데이트 성공')
          } else {
            console.error('❌ 인플루언서 테이블 업데이트 실패:', influencerError)
          }
          break

        default:
          // 일반 사용자의 경우 profiles 테이블만 updated_at 갱신
          const { error: profileError } = await supabaseService
            .from('profiles')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', targetUserId)

          if (!profileError) {
            tableUpdateSuccess = true
            console.log('✅ 프로필 테이블 업데이트 성공')
          }
      }
    } catch (tableError) {
      console.error('❌ 테이블 업데이트 중 오류:', tableError)
    }

    // 5. 관리자 활동 로그 기록
    try {
      await supabaseService
        .from('admin_activity_logs')
        .insert({
          admin_id: adminAuth.userId,
          action: 'password_change',
          target_user_id: targetUserId,
          target_user_type: userType,
          details: {
            target_email: updateResult.user.email,
            success: true,
            table_updated: tableUpdateSuccess
          },
          created_at: new Date().toISOString()
        })
    } catch (logError) {
      console.error('관리자 활동 로그 기록 실패:', logError)
      // 로그 실패는 전체 작업을 실패시키지 않음
    }

    return NextResponse.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다',
      user: {
        id: updateResult.user.id,
        email: updateResult.user.email,
        updated_at: updateResult.user.updated_at
      },
      authUpdated: true,
      tableUpdated: tableUpdateSuccess
    })

  } catch (error) {
    console.error('관리자 비밀번호 변경 처리 중 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}