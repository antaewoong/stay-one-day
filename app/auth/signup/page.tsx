'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SignUpPage() {
  const router = useRouter()
  
  useEffect(() => {
    // 회원가입은 카카오 로그인과 통합되어 있으므로 로그인 페이지로 리다이렉트
    router.replace('/auth/login')
  }, [router])

  return null
}