'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { Lock, User, Shield, AlertTriangle, Eye, EyeOff } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!loginForm.username || !loginForm.password) {
        setError('이메일과 비밀번호를 모두 입력해주세요.')
        return
      }

      console.log('🔐 관리자 로그인 시도:', loginForm.username)

      // Supabase Auth를 통한 인증
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.username, // username을 email로 사용
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
        return
      }

      if (!data.user || !data.session) {
        console.error('사용자 또는 세션 데이터 없음')
        setError('로그인 처리 중 문제가 발생했습니다.')
        return
      }

      console.log('✅ 사용자 인증 성공:', data.user.id)

      // admin_accounts 테이블에서 관리자 확인 (RLS 정책에 의해 자동으로 본인만 조회됨)
      const { data: admin, error: adminError } = await supabase
        .from('admin_accounts')
        .select('*')
        .eq('email', data.user.email)
        .eq('is_active', true)
        .single()

      console.log('👤 관리자 정보 조회 결과:', { admin: admin?.name || 'null', error: adminError?.message })

      if (adminError || !admin) {
        console.error('관리자 정보 조회 실패')
        setError('관리자 권한이 없습니다.')
        await supabase.auth.signOut()
        return
      }

      console.log('✅ 관리자 정보 조회 성공:', admin.name)

      // 세션에 관리자 정보 저장
      sessionStorage.setItem('adminUser', JSON.stringify({
        id: admin.id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        loginTime: new Date().toISOString()
      }))

      console.log('✅ 로그인 성공, 대시보드로 이동...')
      
      // 세션이 완전히 저장될 때까지 잠시 대기 후 페이지 이동
      setTimeout(() => {
        console.log('대시보드로 이동 중...')
        router.push('/admin')
      }, 1000)

    } catch (error) {
      console.error('💥 로그인 처리 중 예외:', error)
      setError('로그인 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Stay One Day 관리자 로그인
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            관리자 계정으로 로그인하세요
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">관리자 인증</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username">이메일</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="username"
                    type="email"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="관리자 이메일을 입력하세요"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="비밀번호를 입력하세요"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? '로그인 중...' : '관리자 로그인'}
              </Button>
            </form>

          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/')}
            className="text-sm text-gray-600"
          >
            ← 메인 페이지로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  )
}