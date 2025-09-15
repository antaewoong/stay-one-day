'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Settings, Lock, Eye, EyeOff, CheckCircle, AlertTriangle, Users, Edit2, Save } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

export default function InfluencerSettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [influencer, setInfluencer] = useState<any>(null)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [profileData, setProfileData] = useState({
    name: '',
    instagram_handle: '',
    youtube_handle: '',
    blog_url: '',
    follower_count: '',
    content_category: [] as string[],
    bio: '',
    phone: '',
    preferred_regions: [] as string[]
  })

  useEffect(() => {
    loadInfluencerProfile()
  }, [])

  const loadInfluencerProfile = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push('/influencer/login')
        return
      }

      const { data: influencerData, error: influencerError } = await supabase
        .from('influencers')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (influencerError || !influencerData) {
        console.error('인플루언서 정보 로드 실패:', influencerError)
        return
      }

      setInfluencer(influencerData)
      setProfileData({
        name: influencerData.name || '',
        instagram_handle: influencerData.instagram_handle || '',
        youtube_handle: influencerData.youtube_handle || '',
        blog_url: influencerData.blog_url || '',
        follower_count: influencerData.follower_count?.toString() || '',
        content_category: influencerData.content_category || [],
        bio: influencerData.bio || '',
        phone: influencerData.phone || '',
        preferred_regions: influencerData.preferred_regions || []
      })
    } catch (error) {
      console.error('프로필 로드 중 오류:', error)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)

    try {
      if (!influencer) {
        toast.error('인플루언서 정보를 찾을 수 없습니다')
        return
      }

      const updatedData = {
        name: profileData.name,
        instagram_handle: profileData.instagram_handle,
        youtube_handle: profileData.youtube_handle,
        blog_url: profileData.blog_url,
        follower_count: profileData.follower_count ? parseInt(profileData.follower_count) : null,
        content_category: profileData.content_category,
        bio: profileData.bio,
        phone: profileData.phone,
        preferred_regions: profileData.preferred_regions,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('influencers')
        .update(updatedData)
        .eq('id', influencer.id)

      if (error) {
        console.error('프로필 업데이트 실패:', error)
        toast.error('프로필 업데이트에 실패했습니다')
        return
      }

      toast.success('프로필이 성공적으로 업데이트되었습니다')
      loadInfluencerProfile() // 최신 데이터로 새로고침
    } catch (error) {
      console.error('프로필 업데이트 중 오류:', error)
      toast.error('서버 오류가 발생했습니다')
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)

    try {
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        toast.error('모든 필드를 입력해주세요')
        return
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error('새 비밀번호가 일치하지 않습니다')
        return
      }

      if (passwordData.newPassword.length < 8) {
        toast.error('새 비밀번호는 8자 이상이어야 합니다')
        return
      }

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          userType: 'influencer'
        })
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(true)
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        toast.success('인플루언서 비밀번호가 성공적으로 변경되었습니다')
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

  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleProfileInputChange = (field: string, value: string | string[]) => {
    setProfileData(prev => ({
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 페이지 헤더 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-800 to-pink-800 bg-clip-text text-transparent">
            인플루언서 계정 설정
          </h1>
          <p className="text-slate-600 mt-2">인플루언서 비밀번호 및 계정 정보를 관리하세요</p>
        </div>

        {/* 성공 알림 */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              인플루언서 비밀번호가 성공적으로 변경되었습니다. Supabase Auth와 인플루언서 데이터베이스가 모두 업데이트되었습니다.
            </AlertDescription>
          </Alert>
        )}

        {/* 프로필 편집 카드 */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent flex items-center">
              <Edit2 className="w-6 h-6 mr-3 text-blue-600" />
              프로필 정보 수정
            </CardTitle>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-slate-700">이름</Label>
                  <Input
                    id="name"
                    type="text"
                    value={profileData.name}
                    onChange={(e) => handleProfileInputChange('name', e.target.value)}
                    className="border-slate-200 focus:border-blue-400 focus:ring-blue-500"
                    placeholder="실명을 입력해주세요"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-slate-700">연락처</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => handleProfileInputChange('phone', e.target.value)}
                    className="border-slate-200 focus:border-blue-400 focus:ring-blue-500"
                    placeholder="010-0000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram_handle" className="text-sm font-medium text-slate-700">Instagram 핸들</Label>
                  <Input
                    id="instagram_handle"
                    type="text"
                    value={profileData.instagram_handle}
                    onChange={(e) => handleProfileInputChange('instagram_handle', e.target.value)}
                    className="border-slate-200 focus:border-blue-400 focus:ring-blue-500"
                    placeholder="@your_instagram"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtube_handle" className="text-sm font-medium text-slate-700">YouTube 채널</Label>
                  <Input
                    id="youtube_handle"
                    type="text"
                    value={profileData.youtube_handle}
                    onChange={(e) => handleProfileInputChange('youtube_handle', e.target.value)}
                    className="border-slate-200 focus:border-blue-400 focus:ring-blue-500"
                    placeholder="@your_youtube"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="blog_url" className="text-sm font-medium text-slate-700">블로그/웹사이트</Label>
                  <Input
                    id="blog_url"
                    type="url"
                    value={profileData.blog_url}
                    onChange={(e) => handleProfileInputChange('blog_url', e.target.value)}
                    className="border-slate-200 focus:border-blue-400 focus:ring-blue-500"
                    placeholder="https://your-blog.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="follower_count" className="text-sm font-medium text-slate-700">팔로워 수</Label>
                  <Input
                    id="follower_count"
                    type="number"
                    value={profileData.follower_count}
                    onChange={(e) => handleProfileInputChange('follower_count', e.target.value)}
                    className="border-slate-200 focus:border-blue-400 focus:ring-blue-500"
                    placeholder="10000"
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium text-slate-700">소개</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => handleProfileInputChange('bio', e.target.value)}
                  className="border-slate-200 focus:border-blue-400 focus:ring-blue-500 min-h-[100px]"
                  placeholder="자신을 소개해주세요..."
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={profileLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-6 rounded-xl shadow-lg transform transition hover:scale-105"
                >
                  {profileLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      프로필 업데이트 중...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      프로필 업데이트
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 비밀번호 변경 카드 */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-800 to-pink-800 bg-clip-text text-transparent flex items-center">
              <Users className="w-6 h-6 mr-3 text-purple-600" />
              인플루언서 비밀번호 변경
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
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                    placeholder="현재 비밀번호를 입력하세요"
                    className="pr-12 border-slate-300 focus:border-purple-500 focus:ring-purple-500"
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
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                    placeholder="새 비밀번호를 입력하세요 (8자 이상)"
                    className="pr-12 border-slate-300 focus:border-purple-500 focus:ring-purple-500"
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
                {passwordData.newPassword && passwordData.newPassword.length < 8 && (
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
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                    placeholder="새 비밀번호를 다시 입력하세요"
                    className="pr-12 border-slate-300 focus:border-purple-500 focus:ring-purple-500"
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
                {passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
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
                    !passwordData.currentPassword ||
                    !passwordData.newPassword ||
                    !passwordData.confirmPassword ||
                    passwordData.newPassword !== passwordData.confirmPassword ||
                    passwordData.newPassword.length < 8
                  }
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      비밀번호 변경 중...
                    </div>
                  ) : (
                    '비밀번호 변경'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 인플루언서 보안 알림 */}
        <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Users className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-slate-600 space-y-2">
                <p className="font-semibold text-purple-800">인플루언서 보안 정보</p>
                <ul className="space-y-1">
                  <li>• 인플루언서 계정은 안전한 비밀번호(8자 이상)를 사용해야 합니다</li>
                  <li>• 변경된 비밀번호는 Supabase Auth와 인플루언서 데이터베이스에 모두 적용됩니다</li>
                  <li>• 협업 파트너십을 위해 계정 보안을 철저히 관리해주세요</li>
                  <li>• <span className="font-semibold text-purple-700">모든 비밀번호 변경 사항은 RLS 정책을 준수하여 처리됩니다</span></li>
                  <li>• 비밀번호 변경 후 다음 로그인부터 새 비밀번호를 사용해주세요</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}