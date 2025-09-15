'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import { Users, AlertTriangle, Eye, EyeOff } from 'lucide-react'

export default function InfluencerLoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!loginForm.email || !loginForm.password) {
        setError('이메일과 비밀번호를 모두 입력해주세요.')
        return
      }

      console.log('🔐 인플루언서 로그인 시도:', loginForm.email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password
      })

      console.log('🔐 로그인 응답:', { 
        user: data.user ? 'exists' : 'null', 
        session: data.session ? 'exists' : 'null',
        error: error?.message 
      })

      if (error) {
        console.error('로그인 에러:', error)
        setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.')
        setLoading(false)
        return
      }

      if (!data.user || !data.session) {
        console.error('사용자 또는 세션 데이터 없음')
        setError('로그인 처리 중 문제가 발생했습니다.')
        setLoading(false)
        return
      }

      console.log('✅ 사용자 인증 성공:', data.user.id)

      // influencers 테이블에서 인플루언서 정보 조회 (auth_user_id로 조회)
      const { data: influencer, error: influencerError } = await supabase
        .from('influencers')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .eq('status', 'active')
        .single()

      console.log('👤 인플루언서 정보 조회 결과:', { influencer: influencer?.name || 'null', error: influencerError?.message })

      if (influencerError || !influencer) {
        console.error('인플루언서 정보 조회 실패:', influencerError)
        setError('인플루언서 정보를 찾을 수 없습니다. 관리자에게 문의해주세요.')
        await supabase.auth.signOut()
        setLoading(false)
        return
      }

      console.log('✅ 인플루언서 정보 조회 성공:', influencer.name)
      console.log('✅ 로그인 성공, 대시보드로 이동...')
      
      // 세션이 완전히 저장될 때까지 잠시 대기 후 페이지 이동
      setTimeout(() => {
        console.log('대시보드로 이동 중...')
        router.push('/influencer/dashboard')
      }, 1000)

    } catch (error) {
      console.error('💥 로그인 처리 중 예외:', error)
      setError('로그인 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6 md:pb-8">
            <div className="mx-auto w-12 md:w-16 h-12 md:h-16 bg-blue-600 rounded-full flex items-center justify-center mb-3 md:mb-4">
              <Users className="w-6 md:w-8 h-6 md:h-8 text-white" />
            </div>
            <CardTitle className="text-xl md:text-2xl font-bold">인플루언서 로그인</CardTitle>
            <p className="text-gray-600 mt-2 text-sm md:text-base">스테이 원데이 협업 플랫폼</p>
          </CardHeader>
          
          <CardContent className="px-4 md:px-6">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 mb-4 md:mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-800 text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} method="post" className="space-y-4 md:space-y-6">
              <div>
                <Label htmlFor="email" className="text-sm md:text-base">이메일</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={loginForm.email}
                  onChange={handleInputChange}
                  placeholder="이메일을 입력하세요"
                  required
                  className="mt-1 h-11 md:h-10 text-base md:text-sm"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm md:text-base">비밀번호</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={handleInputChange}
                    placeholder="비밀번호를 입력하세요"
                    required
                    className="pr-10 h-11 md:h-10 text-base md:text-sm"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 h-12 md:h-10 text-base md:text-sm"
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

            <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                계정이 없으신가요?{' '}
                <button 
                  onClick={() => alert('관리자에게 계정 생성을 요청해주세요.')}
                  className="text-blue-600 hover:underline"
                >
                  가입 문의
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}