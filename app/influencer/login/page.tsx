'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Users, Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function InfluencerLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.username.trim() || !formData.password.trim()) {
      toast.error('아이디와 비밀번호를 입력해주세요.')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/influencer/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      
      if (result.success) {
        // 인플루언서 정보를 세션에 저장
        sessionStorage.setItem('influencerUser', JSON.stringify(result.influencer))
        toast.success('로그인 성공!')
        
        // 호스트와 같은 방식으로 리다이렉트 처리
        console.log('인플루언서 로그인 성공, 대시보드로 이동 준비...')
        
        // 리다이렉트 처리 (호스트 방식과 동일)
        setTimeout(() => {
          console.log('대시보드로 이동 중...')
          // 1차: Next.js router 시도
          router.push('/influencer/dashboard')
          
          // 2차: 1초 후 강제 window.location 시도
          setTimeout(() => {
            console.log('강제 페이지 이동 시도...')
            window.location.replace('/influencer/dashboard')
          }, 1000)
        }, 1000)
      } else {
        toast.error(result.message || '로그인에 실패했습니다.')
      }
    } catch (error) {
      console.error('로그인 실패:', error)
      toast.error('서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12">
      <div className="max-w-md w-full mx-4">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">인플루언서 로그인</CardTitle>
            <p className="text-gray-600 mt-2">스테이 원데이 협업 플랫폼</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="username">아이디</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="아이디를 입력하세요"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="비밀번호를 입력하세요"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    로그인 중...
                  </>
                ) : (
                  '로그인'
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                계정이 없으신가요?{' '}
                <button 
                  onClick={() => toast.info('관리자에게 계정 생성을 요청해주세요.')}
                  className="text-blue-600 hover:underline"
                >
                  가입 문의
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 임시 테스트 계정 안내 */}
        <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-lg p-4 text-center">
          <h3 className="text-sm font-medium text-gray-800 mb-2">테스트 계정</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <div>아이디: 여행러버지은 / 비밀번호: password123</div>
            <div>아이디: 감성캠핑민수 / 비밀번호: password123</div>
          </div>
        </div>
      </div>
    </div>
  )
}