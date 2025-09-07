'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { X, Cookie, Settings, Info, Shield } from 'lucide-react'
import Link from 'next/link'

interface CookieConsentProps {
  onAccept: (preferences: CookiePreferences) => void
  onReject: () => void
}

interface CookiePreferences {
  essential: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
}

export default function CookieConsent({ onAccept, onReject }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,    // 필수 쿠키는 항상 활성화
    analytics: false,
    marketing: false,
    functional: false
  })

  useEffect(() => {
    // 쿠키 동의 여부 확인
    const cookieConsent = localStorage.getItem('cookie-consent')
    if (!cookieConsent) {
      // 5초 후에 쿠키 배너 표시
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    const accepted = {
      essential: true,
      analytics: true,
      marketing: false,
      functional: true
    }
    localStorage.setItem('cookie-consent', JSON.stringify(accepted))
    onAccept(accepted)
    setIsVisible(false)
  }

  const handleReject = () => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false
    }
    localStorage.setItem('cookie-consent', JSON.stringify(essentialOnly))
    onReject()
    setIsVisible(false)
  }

  const handlePreferenceChange = (key: keyof CookiePreferences, value: boolean) => {
    if (key === 'essential') return // 필수 쿠키는 변경 불가
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              더 나은 서비스를 위해 쿠키를 사용합니다. 
              <Link href="/privacy" className="text-blue-600 hover:text-blue-800 underline ml-1">
                자세히 보기
              </Link>
            </p>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              onClick={handleAccept}
              className="flex-1 sm:flex-none bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 text-sm"
            >
              동의
            </Button>
            <Button
              onClick={handleReject}
              variant="outline"
              className="flex-1 sm:flex-none px-4 py-2 text-sm"
            >
              거부
            </Button>
            <button
              onClick={handleReject}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}