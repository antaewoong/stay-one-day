import { createClient } from '@/lib/supabase/client'

export type UserRole = 'customer' | 'host' | 'admin' | 'super_admin' | 'influencer'

export const getUserRole = async (userId: string): Promise<UserRole> => {
  const supabase = createClient()
  
  try {
    // user_roles 테이블에서 역할 조회
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()
    
    if (error || !data) {
      return 'customer' // 기본값
    }
    
    return data.role as UserRole
  } catch {
    return 'customer' // 에러 시 기본값
  }
}

export const checkUserAuth = async () => {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user?.id) {
    return { user: null, role: 'customer' as UserRole, isAuthenticated: false }
  }
  
  const role = await getUserRole(session.user.id)
  
  return {
    user: session.user,
    role,
    isAuthenticated: true
  }
}

export const hasAccess = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy = {
    'customer': 0,
    'influencer': 1,
    'host': 2,
    'admin': 3,
    'super_admin': 4
  }
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

// 페이지별 권한 체크 함수
export const canAccessPage = (userRole: UserRole, pagePath: string): boolean => {
  // Public pages - 모든 사용자 접근 가능
  const publicPages = ['/', '/spaces', '/terms', '/privacy', '/contact', '/login', '/auth']
  if (publicPages.some(page => pagePath.startsWith(page))) {
    return true
  }
  
  // Admin pages - 관리자만
  if (pagePath.startsWith('/admin')) {
    return hasAccess(userRole, 'admin')
  }
  
  // Host pages - 호스트 이상
  if (pagePath.startsWith('/host')) {
    return hasAccess(userRole, 'host')
  }
  
  // Influencer pages - 인플루언서만
  if (pagePath.startsWith('/influencer')) {
    return userRole === 'influencer' || hasAccess(userRole, 'admin')
  }
  
  // Customer pages - 로그인한 사용자
  if (['/profile', '/reservations', '/wishlist', '/payment'].some(page => pagePath.startsWith(page))) {
    return hasAccess(userRole, 'customer')
  }
  
  return false
}