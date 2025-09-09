'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import { Lock, User, Building, AlertTriangle, Eye, EyeOff } from 'lucide-react'

export default function SecureHostLoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginForm, setLoginForm] = useState({
    hostId: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    let result: any = null

    try {
      if (!loginForm.hostId || !loginForm.password) {
        setError('호스트 ID와 비밀번호를 모두 입력해주세요.')
        return
      }

      // API 호출을 통한 호스트 인증
      const response = await fetch('/api/host/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostId: loginForm.hostId,
          password: loginForm.password
        })
      })

      result = await response.json()
      console.log('Login response:', result)

      if (result.success && result.host) {
        // 세션 저장
        console.log('Login successful, redirecting...')
        sessionStorage.setItem('hostUser', JSON.stringify(result.host))
        
        // 쿠키 설정 (미들웨어가 체크하는 쿠키)
        document.cookie = `host-auth=host-${result.host.id}; path=/; max-age=86400`
        
        // 세션 저장 확인 후 강제 리다이렉트
        console.log('Cookie and session set, redirecting...')
        window.location.replace('/host')
        return // 성공시 함수 종료 (finally 블록의 setLoading 방지)
      } else {
        console.log('Login failed:', result)
        setError(result.error || '로그인에 실패했습니다. 호스트 ID와 비밀번호를 확인해주세요.')
      }
    } catch (error) {
      console.error('Host login error:', error)
      setError('로그인 처리 중 오류가 발생했습니다.')
    } finally {
      // 성공한 경우가 아닐 때만 로딩 상태 해제
      if (!result?.success) {
        setLoading(false)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLoginForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Building className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              호스트 로그인
            </CardTitle>
            <p className="text-gray-600 text-sm mt-2">
              Stay One Day 호스트 전용 관리 시스템
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hostId" className="text-sm font-medium text-gray-700">
                  호스트 ID
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="hostId"
                    name="hostId"
                    type="text"
                    value={loginForm.hostId}
                    onChange={handleInputChange}
                    placeholder="호스트 ID를 입력하세요"
                    className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  비밀번호
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={loginForm.password}
                    onChange={handleInputChange}
                    placeholder="비밀번호를 입력하세요"
                    className="pl-10 pr-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 transition-colors"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    로그인 중...
                  </div>
                ) : (
                  '로그인'
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-gray-200">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">
                  로그인에 문제가 있으신가요?
                </p>
                <p className="text-xs text-gray-400">
                  관리자에게 문의: admin@stayoneday.com
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center px-3 py-2 bg-blue-50 rounded-full">
            <Lock className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-xs text-blue-700">
              보안 연결로 안전하게 보호됩니다
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}