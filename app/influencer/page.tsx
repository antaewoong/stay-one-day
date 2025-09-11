'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function InfluencerMainPage() {
  const router = useRouter()

  useEffect(() => {
    // /influencer로 접속하면 자동으로 대시보드로 리다이렉트
    router.replace('/influencer/dashboard')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">인플루언서 대시보드로 이동 중...</p>
      </div>
    </div>
  )
}