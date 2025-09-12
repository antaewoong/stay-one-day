'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { browserSB } from '@/lib/supabase/client'

export function useSupabaseSessionSync() {
  const sb = browserSB()
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event)
      
      // ✅ 서버 쿠키에 세션 반영
      try {
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event, session }),
        })
        
        // 서버 컴포넌트/가드가 최신 세션을 보게 함
        router.refresh()
      } catch (error) {
        console.error('세션 동기화 실패:', error)
      }
    })
    
    return () => subscription.unsubscribe()
  }, [sb, router])
}