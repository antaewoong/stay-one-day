import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Service role client - RLS 우회 가능
const supabaseService = createServiceClient(supabaseUrl, supabaseServiceKey)

export async function validateAdminAuth(request: NextRequest): Promise<{ 
  isValid: boolean, 
  error?: NextResponse 
}> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return {
      isValid: false,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  
  // 토큰 추출 및 이스케이프 문자 복구
  const token = authHeader.replace('Bearer ', '').replace(/\\!/g, '!')
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD
  
  // 1. 슈퍼 어드민 패스워드 체크
  if (token === adminPassword) {
    return { isValid: true }
  }
  
  // 2. JWT 토큰으로 관리자 권한 확인
  try {
    const normalClient = createClient()
    const { data: { user }, error } = await normalClient.auth.getUser(token)
    
    if (error || !user) {
      return {
        isValid: false,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }
    
    const { data: adminUser, error: adminError } = await supabaseService
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    if (adminError || !adminUser || !['admin', 'super_admin', 'manager'].includes(adminUser.role)) {
      return {
        isValid: false,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }
    
    return { isValid: true }
  } catch (error) {
    return {
      isValid: false,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
}

export { supabaseService }