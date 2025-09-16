'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

type UserRole = 'user' | 'host' | 'admin'

interface AuthSession {
  user: User | null
  role: UserRole
  isLoading: boolean
  signOut: () => Promise<void>
}

/**
 * 통합 인증 세션 훅
 * header.tsx, UserHeader.tsx, page.tsx 등에서 공통으로 사용
 */
export function useAuthSession(): AuthSession {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole>('user')
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  // 사용자 역할 체크 함수 메모화
  const checkUserRole = useCallback((email: string): UserRole => {
    const mainAdminEmails = ['admin@stayoneday.com', 'manager@stayoneday.com']
    const hostEmails = ['host1@example.com', 'host2@example.com', 'test@test.com']

    if (mainAdminEmails.includes(email)) {
      return 'admin'
    } else if (hostEmails.includes(email)) {
      return 'host'
    }
    return 'user'
  }, [])

  // 로그아웃 함수
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('로그아웃 실패:', error)
      } else {
        setUser(null)
        setRole('user')
      }
    } catch (error) {
      console.error('로그아웃 중 오류:', error)
    }
  }, [supabase.auth])

  useEffect(() => {
    let mounted = true

    // 초기 세션 확인
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          setUser(null)
          setRole('user')
        } else {
          setUser(session?.user || null)
          if (session?.user?.email) {
            setRole(checkUserRole(session.user.email))
          }
        }
        setIsLoading(false)
      } catch (error) {
        if (mounted) {
          setUser(null)
          setRole('user')
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return

      setUser(session?.user || null)

      if (session?.user?.email) {
        setRole(checkUserRole(session.user.email))
      } else {
        setRole('user')
      }

      setIsLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [checkUserRole, supabase.auth])

  return {
    user,
    role,
    isLoading,
    signOut
  }
}