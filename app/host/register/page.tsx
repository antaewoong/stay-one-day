'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Building2,
  User,
  Phone,
  Mail,
  MapPin
} from 'lucide-react'

export default function HostRegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    business_name: '',
    host_name: '',
    phone: '',
    email: '',
    business_address: '',
    business_registration_number: '',
    description: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setError('')
      setSuccess(false)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('로그인이 필요합니다.')
        return
      }

      // 필수 필드 검증
      if (!formData.business_name || !formData.host_name || !formData.phone) {
        setError('필수 정보를 모두 입력해주세요.')
        return
      }

      // 호스트 정보 저장
      const { error: insertError } = await supabase
        .from('hosts')
        .insert([{
          user_id: user.id,
          business_name: formData.business_name,
          host_name: formData.host_name,
          phone: formData.phone,
          email: formData.email || user.email,
          business_address: formData.business_address,
          business_registration_number: formData.business_registration_number,
          description: formData.description,
          commission_rate: 5.0, // 기본 수수료율 5%
          status: 'active', // 활성 상태
          created_at: new Date().toISOString()
        }])

      if (insertError) {
        throw insertError
      }

      setSuccess(true)
      
      // 3초 후 대시보드로 이동
      setTimeout(() => {
        router.push('/host/dashboard')
      }, 3000)

    } catch (error: any) {
      console.error('호스트 등록 실패:', error)
      setError(error.message || '등록에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">호스트 등록</h1>
          <p className="text-gray-600">Stay One Day 호스트로 등록하여 숙소를 운영해보세요</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              호스트 정보 등록
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 기본 정보 */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="business_name" className="text-gray-700 font-medium">사업장명 *</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => handleInputChange('business_name', e.target.value)}
                    placeholder="예: 청주 힐스테이 펜션"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="host_name" className="text-gray-700 font-medium">담당자명 *</Label>
                  <Input
                    id="host_name"
                    value={formData.host_name}
                    onChange={(e) => handleInputChange('host_name', e.target.value)}
                    placeholder="담당자 이름을 입력하세요"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="text-gray-700 font-medium">연락처 *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="010-1234-5678"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-gray-700 font-medium">이메일</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="example@email.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="business_address" className="text-gray-700 font-medium">사업장 주소</Label>
                  <Input
                    id="business_address"
                    value={formData.business_address}
                    onChange={(e) => handleInputChange('business_address', e.target.value)}
                    placeholder="사업장 주소를 입력하세요"
                  />
                </div>

                <div>
                  <Label htmlFor="business_registration_number" className="text-gray-700 font-medium">사업자 등록번호</Label>
                  <Input
                    id="business_registration_number"
                    value={formData.business_registration_number}
                    onChange={(e) => handleInputChange('business_registration_number', e.target.value)}
                    placeholder="000-00-00000"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-gray-700 font-medium">사업 소개</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="운영하시는 숙소나 사업에 대해 간단히 소개해주세요"
                    rows={4}
                  />
                </div>
              </div>

              {/* 약관 및 안내 */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">📋 호스트 등록 안내</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 기존 OTA대비 월등히 저렴한 수수료</li>
                  <li>• 등록 후 관리자 승인이 필요합니다 (1-2 영업일 소요)</li>
                  <li>• 승인 완료 후 숙소 등록 및 운영이 가능합니다</li>
                  <li>• 문의사항: info@nuklags.com</li>
                </ul>
              </div>

              {/* 에러/성공 메시지 */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {success && (
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div className="text-green-800">
                    <p className="font-medium">등록이 완료되었습니다!</p>
                    <p className="text-sm">잠시 후 대시보드로 이동합니다...</p>
                  </div>
                </div>
              )}

              {/* 제출 버튼 */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    등록 중...
                  </>
                ) : (
                  '호스트 등록하기'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}