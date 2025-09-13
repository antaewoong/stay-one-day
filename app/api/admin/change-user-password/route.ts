import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/middleware/withAdminAuth'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// 관리자 비밀번호 변경 (server-role 사용: 서버 한정)
// 주의: 서비스키는 서버에서만. 라우트 접근은 withAdminAuth로 추가 방어.
export const POST = withAdminAuth(async (request: NextRequest, supabase: any, ctx: any) => {
  const { userId, userEmail, newPassword, userType } = await request.json()
  
  if (!userId && !userEmail) {
    return NextResponse.json({ 
      ok: false, 
      error: 'userId 또는 userEmail 필요' 
    }, { status: 400 })
  }

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ 
      ok: false, 
      error: '새 비밀번호는 8자 이상이어야 합니다' 
    }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // 서버 전용 (절대 클라 노출 금지)
  )

  // userId가 없으면 이메일로 사용자 조회
  let targetUserId = userId
  if (!targetUserId && userEmail) {
    const { data: authUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail(userEmail)
    
    if (getUserError || !authUser.user) {
      return NextResponse.json({ 
        ok: false, 
        error: '사용자를 찾을 수 없습니다' 
      }, { status: 404 })
    }
    
    targetUserId = authUser.user.id
  }

  // Supabase Auth Admin API로 비밀번호 변경
  const { data: updateResult, error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, { 
    password: newPassword 
  })
  
  if (error) {
    return NextResponse.json({ 
      ok: false, 
      error: error.message 
    }, { status: 400 })
  }

  // 해당 사용자 테이블의 password_hash도 업데이트
  let tableUpdated = false
  try {
    switch (userType) {
      case 'host':
        await supabaseAdmin.from('hosts').update({ 
          password_hash: newPassword,
          updated_at: new Date().toISOString()
        }).eq('auth_user_id', targetUserId)
        tableUpdated = true
        break
      case 'admin':
        await supabaseAdmin.from('admin_accounts').update({ 
          password_hash: newPassword,
          updated_at: new Date().toISOString()
        }).eq('auth_user_id', targetUserId)
        tableUpdated = true
        break
      case 'influencer':
        await supabaseAdmin.from('influencers').update({ 
          password_hash: newPassword,
          updated_at: new Date().toISOString()
        }).eq('email', updateResult.user.email)
        tableUpdated = true
        break
    }
  } catch (tableError) {
    console.error('테이블 업데이트 실패:', tableError)
  }

  // 관리자 활동 로그 기록
  try {
    await supabaseAdmin.from('admin_activity_logs').insert({
      admin_id: ctx.admin?.auth_user_id,
      action: 'password_change',
      target_user_id: targetUserId,
      target_user_type: userType,
      details: {
        target_email: updateResult.user.email,
        success: true,
        table_updated: tableUpdated
      }
    })
  } catch (logError) {
    console.error('관리자 활동 로그 기록 실패:', logError)
  }
  
  return NextResponse.json({ 
    ok: true,
    message: '비밀번호가 성공적으로 변경되었습니다',
    user: {
      id: updateResult.user.id,
      email: updateResult.user.email,
      updated_at: updateResult.user.updated_at
    },
    authUpdated: true,
    tableUpdated
  })
})