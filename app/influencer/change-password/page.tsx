'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import { Shield, AlertTriangle, Eye, EyeOff, CheckCircle } from 'lucide-react'

function ChangePasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8
    const maxLength = password.length <= 128
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>~`\-_+=\[\]\\;'/]/.test(password)
    const noCommonPatterns = !(/123456|password|qwerty|abc123|admin/i.test(password))
    const noRepeating = !/(.)\1{2,}/.test(password) // 같은 문자 3번 이상 반복 금지

    return {
      valid: minLength && maxLength && hasUppercase && hasLowercase && hasNumber && hasSpecial && noCommonPatterns && noRepeating,
      requirements: [
        { text: '8자 이상 128자 이하', met: minLength && maxLength },
        { text: '대문자 포함', met: hasUppercase },
        { text: '소문자 포함', met: hasLowercase },
        { text: '숫자 포함', met: hasNumber },
        { text: '특수문자 포함 (!@#$%^&* 등)', met: hasSpecial },
        { text: '일반적인 패턴 사용 금지', met: noCommonPatterns },
        { text: '동일 문자 연속 3회 이상 사용 금지', met: noRepeating }
      ]
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const { currentPassword, newPassword, confirmPassword } = passwordForm

      if (!currentPassword || !newPassword || !confirmPassword) {
        setError('모든 필드를 입력해주세요.')
        return
      }

      if (newPassword !== confirmPassword) {
        setError('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.')
        return
      }

      if (currentPassword === newPassword) {
        setError('새 비밀번호는 현재 비밀번호와 달라야 합니다.')
        return
      }

      // 이메일 주소가 비밀번호에 포함되는지 확인
      const email = searchParams.get('email') || ''
      const emailPrefix = email.split('@')[0].toLowerCase()
      if (newPassword.toLowerCase().includes(emailPrefix)) {
        setError('비밀번호에 이메일 주소의 일부를 포함할 수 없습니다.')
        return
      }

      const passwordValidation = validatePassword(newPassword)
      if (!passwordValidation.valid) {
        const unmetRequirements = passwordValidation.requirements
          .filter(req => !req.met)
          .map(req => req.text)
          .join(', ')
        setError(`비밀번호 보안 요구사항: ${unmetRequirements}`)
        return
      }

      console.log('🔐 비밀번호 변경 시도...')

      // 현재 비밀번호로 인증 확인
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: searchParams.get('email') || '',
        password: currentPassword
      })

      if (authError || !authData.user) {
        setError('현재 비밀번호가 올바르지 않습니다.')
        return
      }

      // 새 비밀번호로 업데이트
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        console.error('비밀번호 업데이트 실패:', updateError)
        setError('비밀번호 변경에 실패했습니다. 다시 시도해주세요.')
        return
      }

      // influencers 테이블의 first_login 업데이트 (첫 로그인 완료 표시)
      const { error: influencerError } = await supabase
        .from('influencers')
        .update({
          first_login: false, // 첫 로그인 완료 표시
          updated_at: new Date().toISOString()
        })
        .eq('email', authData.user.email)

      if (influencerError) {
        console.error('인플루언서 정보 업데이트 실패:', influencerError)
        // 이 에러는 치명적이지 않으므로 로그만 남김
      }

      console.log('✅ 비밀번호 변경 성공')

      setSuccess('비밀번호가 성공적으로 변경되었습니다. 잠시 후 대시보드로 이동합니다.')

      // 3초 후 대시보드로 이동
      setTimeout(() => {
        router.push('/influencer/dashboard')
      }, 3000)

    } catch (error) {
      console.error('💥 비밀번호 변경 중 예외:', error)
      setError('비밀번호 변경 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const passwordValidation = validatePassword(passwordForm.newPassword)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6 md:pb-8">
            <div className="mx-auto w-12 md:w-16 h-12 md:h-16 bg-orange-600 rounded-full flex items-center justify-center mb-3 md:mb-4">
              <Shield className="w-6 md:w-8 h-6 md:h-8 text-white" />
            </div>
            <CardTitle className="text-xl md:text-2xl font-bold">비밀번호 변경 필수</CardTitle>
            <p className="text-gray-600 mt-2 text-sm md:text-base">
              보안을 위해 첫 로그인 시 비밀번호를 변경해주세요
            </p>
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

            {success && (
              <Alert className="border-green-200 bg-green-50 mb-4 md:mb-6">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 text-sm">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} method="post" className="space-y-4 md:space-y-6">
              <div>
                <Label htmlFor="currentPassword" className="text-sm md:text-base">현재 비밀번호</Label>
                <div className="relative mt-1">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={handleInputChange}
                    placeholder="임시 비밀번호를 입력하세요"
                    required
                    className="pr-10 h-11 md:h-10 text-base md:text-sm"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={loading}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="newPassword" className="text-sm md:text-base">새 비밀번호</Label>
                <div className="relative mt-1">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={handleInputChange}
                    placeholder="새 비밀번호를 입력하세요"
                    required
                    className="pr-10 h-11 md:h-10 text-base md:text-sm"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={loading}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* 비밀번호 요구사항 표시 */}
                {passwordForm.newPassword && (
                  <div className="mt-2 space-y-1">
                    {passwordValidation.requirements.map((req, index) => (
                      <div key={index} className={`flex items-center text-xs ${req.met ? 'text-green-600' : 'text-gray-500'}`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${req.met ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        {req.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-sm md:text-base">새 비밀번호 확인</Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="새 비밀번호를 다시 입력하세요"
                    required
                    className="pr-10 h-11 md:h-10 text-base md:text-sm"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !passwordValidation.valid}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 h-12 md:h-10 text-base md:text-sm"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    비밀번호 변경 중...
                  </div>
                ) : (
                  '비밀번호 변경하기'
                )}
              </Button>
            </form>

            <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                🔒 보안을 위해 비밀번호는 안전하게 보관하세요
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function InfluencerChangePasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center"><div className="text-lg">로딩 중...</div></div>}>
      <ChangePasswordContent />
    </Suspense>
  )
}