'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Settings, Lock, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function HostSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)

    try {
      if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
        toast.error('모든 필드를 입력해주세요')
        return
      }

      if (formData.newPassword !== formData.confirmPassword) {
        toast.error('새 비밀번호가 일치하지 않습니다')
        return
      }

      if (formData.newPassword.length < 8) {
        toast.error('새 비밀번호는 8자 이상이어야 합니다')
        return
      }

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          userType: 'host'
        })
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(true)
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        toast.success('비밀번호가 성공적으로 변경되었습니다')
      } else {
        toast.error(result.error || '비밀번호 변경에 실패했습니다')
      }
    } catch (error) {
      console.error('비밀번호 변경 중 오류:', error)
      toast.error('서버 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 페이지 헤더 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent">
            계정 설정
          </h1>
          <p className="text-slate-600 mt-2">비밀번호 및 계정 정보를 관리하세요</p>
        </div>

        {/* 성공 알림 */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              비밀번호가 성공적으로 변경되었습니다. Supabase Auth와 호스트 데이터베이스가 모두 업데이트되었습니다.
            </AlertDescription>
          </Alert>
        )}

        {/* 비밀번호 변경 카드 */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent flex items-center">
              <Lock className="w-6 h-6 mr-3 text-blue-600" />
              비밀번호 변경
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handlePasswordChange} className="space-y-6">
              {/* 현재 비밀번호 */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm font-semibold text-slate-700">
                  현재 비밀번호
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? 'text' : 'password'}
                    value={formData.currentPassword}
                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    placeholder="현재 비밀번호를 입력하세요"
                    className="pr-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    disabled={loading}
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* 새 비밀번호 */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-semibold text-slate-700">
                  새 비밀번호
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    placeholder="새 비밀번호를 입력하세요 (8자 이상)"
                    className="pr-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    disabled={loading}
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formData.newPassword && formData.newPassword.length < 8 && (
                  <p className="text-sm text-amber-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    비밀번호는 8자 이상이어야 합니다
                  </p>
                )}
              </div>

              {/* 새 비밀번호 확인 */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">
                  새 비밀번호 확인
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="새 비밀번호를 다시 입력하세요"
                    className="pr-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    disabled={loading}
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    비밀번호가 일치하지 않습니다
                  </p>
                )}
              </div>

              {/* 변경 버튼 */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={loading || 
                    !formData.currentPassword || 
                    !formData.newPassword || 
                    !formData.confirmPassword ||
                    formData.newPassword !== formData.confirmPassword ||
                    formData.newPassword.length < 8
                  }
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      변경 중...
                    </div>
                  ) : (
                    '비밀번호 변경'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 보안 알림 */}
        <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Settings className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-slate-600 space-y-2">
                <p className="font-semibold text-slate-800">보안 정보</p>
                <ul className="space-y-1">
                  <li>• 비밀번호는 8자 이상으로 설정해주세요</li>
                  <li>• 변경된 비밀번호는 Supabase Auth와 호스트 데이터베이스에 모두 적용됩니다</li>
                  <li>• 비밀번호 변경 후 다음 로그인부터 새 비밀번호를 사용해주세요</li>
                  <li>• 정기적으로 비밀번호를 변경하여 계정 보안을 강화하세요</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}