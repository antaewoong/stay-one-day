import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  
  const token = authHeader.replace('Bearer ', '')
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD
  
  // 1. 슈퍼 어드민 패스워드 체크
  if (token === adminPassword) {
    console.log('슈퍼 어드민 인증 성공')
    return true
  }
  
  // 2. Supabase JWT 토큰 체크
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      console.log('Supabase 인증 실패:', error?.message)
      return false
    }
    
    // 관리자 권한 확인
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    if (adminError) {
      console.log('관리자 권한 조회 실패:', adminError.message)
      return false
    }
    
    if (adminUser?.role === 'admin' || adminUser?.role === 'super_admin' || adminUser?.role === 'manager') {
      console.log('관리자 인증 성공:', user.email, '역할:', adminUser.role)
      return true
    }
    
    console.log('관리자 권한 없음:', user.email, '역할:', adminUser?.role)
    return false
  } catch (error) {
    console.log('인증 오류:', error)
    return false
  }
}

export async function isHostRequest(request: NextRequest): Promise<{ isHost: boolean, hostId?: string }> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return { isHost: false }
  
  const token = authHeader.replace('Bearer ', '')
  
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      console.log('호스트 Supabase 인증 실패:', error?.message)
      return { isHost: false }
    }
    
    // 호스트 권한 확인
    const { data: hostUser, error: hostError } = await supabase
      .from('hosts')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()
    
    if (hostError) {
      console.log('호스트 권한 조회 실패:', hostError.message)
      return { isHost: false }
    }
    
    if (hostUser) {
      console.log('호스트 인증 성공:', user.email)
      return { isHost: true, hostId: hostUser.id }
    }
    
    console.log('호스트 권한 없음:', user.email)
    return { isHost: false }
  } catch (error) {
    console.log('호스트 인증 오류:', error)
    return { isHost: false }
  }
}