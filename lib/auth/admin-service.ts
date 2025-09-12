import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Service role client - RLS 우회 가능
const supabaseService = createServiceClient(supabaseUrl, supabaseServiceKey)

export async function validateAdminAuth(request: NextRequest): Promise<{ 
  isValid: boolean,
  isAdmin: boolean,
  userId?: string,
  email?: string,
  error?: NextResponse 
}> {
  const authHeader = request.headers.get('authorization')
  console.log('🔍 validateAdminAuth - Authorization header:', authHeader)
  
  if (!authHeader) {
    console.log('❌ validateAdminAuth - No authorization header')
    return {
      isValid: false,
      isAdmin: false,
      error: NextResponse.json({ error: 'Unauthorized - No authorization header' }, { status: 401 })
    }
  }
  
  // 토큰 추출 및 이스케이프 문자 복구
  const token = authHeader.replace('Bearer ', '').replace(/\\!/g, '!')
  
  // JWT 토큰으로 관리자 권한 확인
  try {
    // 서버 사이드에서는 service role을 사용해야 함
    const { data: { user }, error } = await supabaseService.auth.getUser(token)
    
    if (error || !user) {
      console.log('❌ validateAdminAuth - 토큰으로 유저 조회 실패:', error)
      return {
        isValid: false,
        isAdmin: false,
        error: NextResponse.json({ error: '유효하지 않거나 만료된 토큰입니다' }, { status: 401 })
      }
    }
    
    console.log('✅ validateAdminAuth - 유저 확인:', user.id, user.email)
    
    // admin_accounts 테이블에서 관리자 확인 (service role 사용으로 RLS 우회)
    const { data: adminUser, error: adminError } = await supabaseService
      .from('admin_accounts')
      .select('role, email, is_active')
      .eq('auth_user_id', user.id)
      .eq('is_active', true)
      .single()
    
    console.log('🔍 validateAdminAuth - 관리자 계정 조회:', { adminUser, adminError })
    
    if (adminError || !adminUser || !['admin', 'super_admin', 'manager'].includes(adminUser.role)) {
      console.log('❌ validateAdminAuth - 관리자 권한 없음')
      return {
        isValid: false,
        isAdmin: false,
        error: NextResponse.json({ error: '관리자 권한이 없습니다' }, { status: 403 })
      }
    }
    
    console.log('✅ validateAdminAuth - 관리자 인증 성공:', user.email, adminUser.role)
    
    return { 
      isValid: true,
      isAdmin: true,
      userId: user.id,
      email: adminUser.email
    }
  } catch (error) {
    console.error('❌ validateAdminAuth - 예외 발생:', error)
    return {
      isValid: false,
      isAdmin: false,
      error: NextResponse.json({ error: '인증 처리 중 오류가 발생했습니다' }, { status: 500 })
    }
  }
}

export { supabaseService }