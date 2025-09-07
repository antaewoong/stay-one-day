'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URL에서 인증 코드를 처리
        const { data, error } = await supabase.auth.getSession()
        
        console.log('콜백 세션 확인:', { data, error })
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/login')
          return
        }

        // 세션이 있으면 메인페이지로, 없으면 잠시 후 다시 확인
        if (data.session) {
          console.log('세션 확인됨, 메인페이지로 이동')
          router.push('/')
        } else {
          // 세션이 아직 설정되지 않았을 수 있으므로 잠시 대기 후 재시도
          console.log('세션 없음, 1초 후 재시도')
          setTimeout(() => {
            supabase.auth.getSession().then(({ data: sessionData }) => {
              if (sessionData.session) {
                router.push('/')
              } else {
                router.push('/login')
              }
            })
          }, 1000)
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        router.push('/login')
      }
    }

    handleAuthCallback()
  }, [router, supabase.auth])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  )
}