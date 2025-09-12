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
    const normalClient = createClient()
    const { data: { user }, error } = await normalClient.auth.getUser(token)
    
    if (error || !user) {
      return {
        isValid: false,
        isAdmin: false,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }
    
    // admin_accounts 테이블에서 관리자 확인 (RLS 정책 준수)
    const { data: adminUser, error: adminError } = await normalClient
      .from('admin_accounts')
      .select('role, email, is_active')
      .eq('auth_user_id', user.id)
      .eq('is_active', true)
      .single()
    
    if (adminError || !adminUser || !['admin', 'super_admin', 'manager'].includes(adminUser.role)) {
      return {
        isValid: false,
        isAdmin: false,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }
    
    return { 
      isValid: true,
      isAdmin: true,
      userId: user.id,
      email: adminUser.email
    }
  } catch (error) {
    return {
      isValid: false,
      isAdmin: false,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
}

export { supabaseService }