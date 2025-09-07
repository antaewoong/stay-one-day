import { createClient } from '@/lib/supabase/client'

export type UserRole = 'user' | 'host' | 'admin'

export const getUserRole = (email: string): UserRole => {
  const mainAdminEmails = ['admin@stayoneday.com', 'manager@stayoneday.com']
  const hostEmails = ['host1@example.com', 'host2@example.com', 'test@test.com']
  
  if (mainAdminEmails.includes(email)) {
    return 'admin'
  } else if (hostEmails.includes(email)) {
    return 'host'
  }
  return 'user'
}

export const checkUserAuth = async () => {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user?.email) {
    return { user: null, role: 'user' as UserRole, isAuthenticated: false }
  }
  
  const role = getUserRole(session.user.email)
  
  return {
    user: session.user,
    role,
    isAuthenticated: true
  }
}

export const hasAccess = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy = {
    'user': 0,
    'host': 1,
    'admin': 2
  }
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}