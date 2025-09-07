'use client'

import { useState, useEffect } from 'react'
import CookieConsent from '@/components/cookie-consent'

interface CookiePreferences {
  essential: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [cookieConsent, setCookieConsent] = useState<CookiePreferences | null>(null)

  useEffect(() => {
    // 쿠키 동의 상태 로드
    const saved = localStorage.getItem('cookie-consent')
    if (saved) {
      setCookieConsent(JSON.parse(saved))
    }
  }, [])

  const handleAcceptCookies = (preferences: CookiePreferences) => {
    setCookieConsent(preferences)
    
    // Google Analytics 설정
    if (preferences.analytics) {
      // GA4 설정 (실제 환경에서는 환경변수 사용)
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('consent', 'update', {
          analytics_storage: 'granted'
        })
      }
    }

    // 마케팅 쿠키 설정
    if (preferences.marketing) {
      // 마케팅 관련 쿠키 활성화
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('consent', 'update', {
          ad_storage: 'granted'
        })
      }
    }

    // 기능 쿠키 설정
    if (preferences.functional) {
      // 채팅, 비디오 등 기능 쿠키 활성화
      console.log('Functional cookies enabled')
    }
  }

  const handleRejectCookies = () => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false
    }
    setCookieConsent(essentialOnly)
    
    // 모든 선택적 쿠키 비활성화
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied'
      })
    }
  }

  return (
    <>
      {children}
      
      {/* 쿠키 동의 배너 */}
      {cookieConsent === null && (
        <CookieConsent
          onAccept={handleAcceptCookies}
          onReject={handleRejectCookies}
        />
      )}
    </>
  )
}