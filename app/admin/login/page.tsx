'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { Lock, User, Shield, AlertTriangle } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // API를 통한 데이터베이스 인증
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: loginForm.username,
          password: loginForm.password
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // 세션에 관리자 정보 저장
        sessionStorage.setItem('adminUser', JSON.stringify({
          id: result.admin.id,
          username: result.admin.username,
          name: result.admin.name,
          email: result.admin.email,
          role: result.admin.role,
          loginTime: new Date().toISOString()
        }))

        // 쿠키 설정 (미들웨어에서 확인)
        if (result.admin.role === 'super_admin' && result.admin.id === 'env-admin') {
          // 환경변수 슈퍼 관리자
          const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD
          document.cookie = `admin-auth=${adminPassword}; path=/; max-age=86400; samesite=lax`
        } else {
          // 데이터베이스 관리자들을 위한 토큰
          document.cookie = `admin-auth=db-admin-${result.admin.id}; path=/; max-age=86400; samesite=lax`
        }

        // 호스트와 같은 방식으로 리다이렉트 처리
        console.log('관리자 로그인 성공, 대시보드로 이동 준비...')
        
        // 리다이렉트 처리 (호스트 방식과 동일)
        setTimeout(() => {
          console.log('대시보드로 이동 중...')
          // 1차: Next.js router 시도
          router.push('/admin')
          
          // 2차: 1초 후 강제 window.location 시도
          setTimeout(() => {
            console.log('강제 페이지 이동 시도...')
            window.location.replace('/admin')
          }, 1000)
        }, 1000)
      } else {
        setError(result.error || '로그인에 실패했습니다.')
      }
    } catch (error) {
      console.error('로그인 오류:', error)
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
                <Label htmlFor="username">관리자 아이디</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="username"
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="아이디를 입력하세요"
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
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="비밀번호를 입력하세요"
                    className="pl-10"
                    required
                  />
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