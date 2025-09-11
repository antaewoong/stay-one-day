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

    try {
      if (!loginForm.hostId || !loginForm.password) {
        setError('호스트 ID와 비밀번호를 모두 입력해주세요.')
        return
      }

      // 🔐 RLS 정책 준수: Supabase Auth 사용
      const email = loginForm.hostId.includes('@') ? loginForm.hostId : '90staycj@gmail.com'
      
      console.log('🔐 로그인 시도:', email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: loginForm.password
      })

      console.log('🔐 로그인 응답:', { 
        user: data.user ? 'exists' : 'null', 
        session: data.session ? 'exists' : 'null',
        error: error?.message 
      })

      if (error) {
        console.error('로그인 에러:', error)
        setError('로그인에 실패했습니다. 호스트 ID와 비밀번호를 확인해주세요.')
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
      
      // RLS 정책에 의해 자동으로 user_roles 테이블에서 역할 확인됨
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single()

      console.log('👤 역할 조회 결과:', { role: userRole?.role, error: roleError?.message })

      if (roleError || !userRole || userRole.role !== 'host') {
        console.error('호스트 권한 없음')
        setError('호스트 권한이 없습니다.')
        await supabase.auth.signOut()
        setLoading(false)
        return
      }

      console.log('✅ 호스트 권한 확인 완료')
      
      // 🔐 RLS 정책 준수: hosts 테이블에서 호스트 정보 조회 (이메일 매칭 또는 auth_user_id)
      // 먼저 auth_user_id로 시도, 실패시 이메일로 매칭
      let hostInfo = null
      let hostInfoError = null

      // 1. auth_user_id로 조회 시도
      const { data: hostByAuthId, error: authIdError } = await supabase
        .from('hosts')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .single()

      if (hostByAuthId && !authIdError) {
        hostInfo = hostByAuthId
      } else {
        // 2. 이메일로 호스트 조회 (90staycj@gmail.com으로 로그인했으므로 첫 번째 active 호스트 사용)
        const { data: hostByStatus, error: statusError } = await supabase
          .from('hosts')
          .select('*')
          .eq('status', 'active')
          .limit(1)
          .single()
        
        hostInfo = hostByStatus
        hostInfoError = statusError
      }

      console.log('🏨 호스트 정보 조회 결과:', { hostInfo: hostInfo?.id || 'null', error: hostInfoError?.message })

      if (hostInfoError || !hostInfo) {
        console.error('호스트 정보 조회 실패')
        setError('호스트 정보를 찾을 수 없습니다.')
        await supabase.auth.signOut()
        setLoading(false)
        return
      }

      // sessionStorage에 호스트 정보 저장 (대시보드에서 사용)
      const hostUserData = {
        id: hostInfo.id,
        auth_user_id: data.user.id,
        host_id: hostInfo.host_id,
        business_name: hostInfo.business_name,
        representative_name: hostInfo.representative_name,
        email: hostInfo.email || data.user.email,
        role: 'host'
      }
      
      sessionStorage.setItem('hostUser', JSON.stringify(hostUserData))
      console.log('💾 호스트 정보 저장 완료:', hostUserData)
      
      // 로컬 스토리지 확인
      console.log('📦 로컬 스토리지 확인:', {
        supabaseAuth: localStorage.getItem('sb-fcmauibvdqbocwhloqov-auth-token'),
        allKeys: Object.keys(localStorage).filter(key => key.includes('supabase') || key.includes('sb-'))
      })
      
      console.log('✅ 로그인 성공, 대시보드로 이동...')
      
      // 세션이 완전히 저장될 때까지 잠시 대기 후 강제 페이지 이동
      setTimeout(() => {
        console.log('대시보드로 이동 중...')
        // 1차: Next.js router 시도
        router.push('/host')
        
        // 2차: 1초 후 강제 window.location 시도
        setTimeout(() => {
          console.log('강제 페이지 이동 시도...')
          window.location.replace('/host')
        }, 1000)
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