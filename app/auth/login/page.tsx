'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import { ArrowLeft, Home, MessageCircle, Share2, Heart, Users } from 'lucide-react'
import Header from '@/components/header'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // 개인정보 동의 상태
  const [agreements, setAgreements] = useState({
    privacy: false,
    thirdParty: false
  })

  // 동의 체크박스 핸들러
  const handleAgreementChange = (type, checked) => {
    setAgreements(prev => ({
      ...prev,
      [type]: checked
    }))
  }

  const handleKakaoLogin = async () => {
    // 필수 동의 항목 확인
    if (!agreements.privacy) {
      setError('개인정보 처리방침에 동의해주세요.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        setError('카카오 로그인에 실패했습니다.')
        setLoading(false)
      }
    } catch (error) {
      setError('로그인 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <Header />

      {/* 메인 콘텐츠 */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12">
        <div className="w-full max-w-lg">
          
          {/* 로고 및 제목 */}
          <div className="text-center mb-12">
            <Link href="/" className="inline-block mb-8">
              <div className="text-3xl font-light text-gray-900 tracking-tight">
                stay<span className="font-medium">oneday</span>
              </div>
            </Link>
            <p className="text-gray-600 text-lg">
              시작하기
            </p>
          </div>

          {/* 오류 메시지 */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* 간단한 동의 */}
            <div className="space-y-4">
              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
                카카오 계정 정보(이메일, 닉네임)를 수집하여 서비스를 제공합니다.
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="privacy"
                    checked={agreements.privacy}
                    onCheckedChange={(checked) => handleAgreementChange('privacy', checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="privacy" className="text-sm text-gray-700 cursor-pointer">
                    개인정보 처리방침 동의 <span className="text-red-500">*</span>
                  </Label>
                  <Link href="/privacy" className="text-xs text-gray-500 underline">보기</Link>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="thirdParty"
                    checked={agreements.thirdParty}
                    onCheckedChange={(checked) => handleAgreementChange('thirdParty', checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="thirdParty" className="text-sm text-gray-700 cursor-pointer">
                    제3자 정보제공 동의 (선택)
                  </Label>
                  <Link href="/third-party-policy" className="text-xs text-gray-500 underline">보기</Link>
                </div>
              </div>
            </div>

            {/* 카카오 시작하기 버튼 */}
            <Button
              onClick={handleKakaoLogin}
              disabled={loading || !agreements.privacy}
              className="w-full h-12 text-black bg-yellow-300 hover:bg-yellow-400 border border-yellow-400 font-medium disabled:bg-gray-200 disabled:text-gray-500"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                  시작하는 중...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  카카오로 시작하기
                </>
              )}
            </Button>
          </div>

          {/* 하단 안내 */}
          <div className="text-center mt-12">
            <p className="text-xs text-gray-500 leading-relaxed">
              카카오 계정으로 간편하게 시작하세요
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}