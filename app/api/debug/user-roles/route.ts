import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/auth/admin-service'

export const dynamic = 'force-dynamic'

/**
 * 디버그용 API: user_roles 테이블 데이터 확인
 * admin@stayoneday.com이 user_roles에 있는지 확인
 */
export async function GET(request: NextRequest) {
  try {
    // admin@stayoneday.com 사용자 정보 확인
    const { data: authUser, error: authError } = await supabaseService.auth.admin.listUsers()
    
    if (authError) {
      return NextResponse.json({ error: 'Auth users 조회 실패', details: authError })
    }

    const adminUser = authUser.users.find(u => u.email === 'admin@stayoneday.com')
    
    if (!adminUser) {
      return NextResponse.json({ error: 'admin@stayoneday.com 사용자를 찾을 수 없음' })
    }

    // user_roles 테이블에서 해당 사용자 확인
    const { data: userRoles, error: rolesError } = await supabaseService
      .from('user_roles')
      .select('*')
      .eq('user_id', adminUser.id)

    // admin_accounts 테이블에서도 확인
    const { data: adminAccounts, error: adminError } = await supabaseService
      .from('admin_accounts')
      .select('*')
      .eq('user_id', adminUser.id)

    return NextResponse.json({
      success: true,
      data: {
        auth_user: {
          id: adminUser.id,
          email: adminUser.email,
          created_at: adminUser.created_at
        },
        user_roles: userRoles || [],
        admin_accounts: adminAccounts || [],
        user_roles_error: rolesError,
        admin_accounts_error: adminError
      }
    })

  } catch (error) {
    console.error('디버그 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류', details: error instanceof Error ? error.message : error },
      { status: 500 }
    )
  }
}