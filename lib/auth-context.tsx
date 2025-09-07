'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  isHost: boolean
  isAdmin: boolean
  hostId: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signInHost: (hostId: string, password: string) => Promise<void>
  signInAdmin: (username: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isHost, setIsHost] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [hostId, setHostId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      // Check stored auth type
      const storedHostUser = sessionStorage.getItem('hostUser')
      const storedAdminUser = sessionStorage.getItem('adminUser')
      
      if (storedHostUser) {
        const hostData = JSON.parse(storedHostUser)
        setIsHost(true)
        setHostId(hostData.host_id)
      } else if (storedAdminUser) {
        setIsAdmin(true)
      }
      
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } finally {
      setLoading(false)
    }
  }

  const signInHost = async (hostId: string, password: string) => {
    setLoading(true)
    try {
      // API를 통한 데이터베이스 인증
      const response = await fetch('/api/host/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostId: hostId,
          password: password
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        const hostData = {
          id: result.host.id,
          host_id: result.host.host_id,
          name: result.host.name,
          email: result.host.email,
          business_name: result.host.business_name,
          status: result.host.status,
          authenticated_at: new Date().toISOString()
        }

        sessionStorage.setItem('hostUser', JSON.stringify(hostData))
        
        // 호스트용 쿠키 설정 (미들웨어에서 체크 가능)
        document.cookie = `host-auth=host-${result.host.id}; path=/; max-age=86400; samesite=lax`
        
        setIsHost(true)
        setHostId(hostId)
      } else {
        throw new Error(result.error || '로그인에 실패했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  const signInAdmin = async (username: string, password: string) => {
    setLoading(true)
    try {
      // This should be moved to server-side API
      const adminUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD
      
      if (username !== adminUsername || password !== adminPassword) {
        throw new Error('Invalid admin credentials')
      }

      const adminData = {
        id: 'admin',
        username,
        role: 'admin',
        authenticated_at: new Date().toISOString()
      }

      sessionStorage.setItem('adminUser', JSON.stringify(adminData))
      setIsAdmin(true)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      // Clear Supabase session
      await supabase.auth.signOut()
      
      // Clear all session storage
      sessionStorage.removeItem('hostUser')
      sessionStorage.removeItem('adminUser')
      
      // Clear all auth cookies
      document.cookie = 'admin-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'host-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      
      // Reset state
      setIsHost(false)
      setIsAdmin(false)
      setHostId(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isHost,
        isAdmin,
        hostId,
        signIn,
        signOut,
        signInHost,
        signInAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}