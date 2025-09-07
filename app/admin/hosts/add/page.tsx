'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, User, Building, Mail, Phone, MapPin } from 'lucide-react'

interface HostForm {
  name: string
  email: string
  phone: string
  business_name: string
  business_number: string
  address: string
  status: string
  password: string
  confirmPassword: string
}

export default function AddHostPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  
  const [form, setForm] = useState<HostForm>({
    name: '',
    email: '',
    phone: '',
    business_name: '',
    business_number: '',
    address: '',
    status: 'pending',
    password: '',
    confirmPassword: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 간단한 검증
    if (!form.name || !form.email || !form.phone || !form.password) {
      alert('필수 정보를 모두 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      // 직접 Supabase 접근 (RLS 정책으로 관리자 권한 확인)
      const hostData = {
        business_name: form.business_name || form.name,
        business_number: form.business_number || null,
        representative_name: form.name,
        phone: form.phone,
        email: form.email,
        password: form.password,
        address: form.address || '',
        status: form.status || 'pending',
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('hosts')
        .insert(hostData)
        .select()

      if (error) {
        console.error('호스트 등록 오류:', error)
        throw new Error(error.message)
      }

      console.log('호스트 등록 성공:', data)
      alert('새 호스트가 성공적으로 등록되었습니다!')
      router.push('/admin/hosts')
      
    } catch (error) {
      console.error('호스트 등록 실패:', error)
      alert(error instanceof Error ? error.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof HostForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 3) {
      return numbers
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
    }
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value)
    setForm(prev => ({ ...prev, phone: formatted }))
  }

  const formatBusinessNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 3) {
      return numbers
    } else if (numbers.length <= 5) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`
    }
  }

  const handleBusinessNumberChange = (value: string) => {
    const formatted = formatBusinessNumber(value)
    setForm(prev => ({ ...prev, business_number: formatted }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로가기
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">새 호스트 등록</h1>
            <p className="text-gray-600 mt-1">새로운 숙소 호스트를 등록합니다</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                기본 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">호스트명 *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="김호스트"
                  className="placeholder:text-gray-400"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">이메일 *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="host@example.com"
                  className="placeholder:text-gray-400"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">연락처 *</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="010-1234-5678"
                  className="placeholder:text-gray-400"
                  maxLength={13}
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">비밀번호 *</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="호스트 로그인용 비밀번호"
                  className="placeholder:text-gray-400"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">호스트가 이메일로 로그인할 수 있습니다</p>
              </div>

              <div>
                <Label htmlFor="status">상태</Label>
                <Select value={form.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="pending">승인 대기</SelectItem>
                    <SelectItem value="approved">승인</SelectItem>
                    <SelectItem value="rejected">거절</SelectItem>
                    <SelectItem value="suspended">정지</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 사업자 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                사업자 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="business_name">업체명</Label>
                <Input
                  id="business_name"
                  value={form.business_name}
                  onChange={(e) => handleInputChange('business_name', e.target.value)}
                  placeholder="구공스테이"
                  className="placeholder:text-gray-400"
                />
              </div>

              <div>
                <Label htmlFor="business_number">사업자번호</Label>
                <Input
                  id="business_number"
                  value={form.business_number}
                  onChange={(e) => handleBusinessNumberChange(e.target.value)}
                  placeholder="123-45-67890"
                  className="placeholder:text-gray-400"
                  maxLength={12}
                />
              </div>

              <div>
                <Label htmlFor="address">주소</Label>
                <Textarea
                  id="address"
                  value={form.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="충북 청주시 서원구..."
                  className="placeholder:text-gray-400"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            취소
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? '등록 중...' : '호스트 등록'}
          </Button>
        </div>
      </form>

      {/* 안내사항 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">등록 안내사항</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• 필수 정보: 호스트명, 이메일, 연락처는 반드시 입력해야 합니다.</p>
            <p>• 이메일 중복: 이미 등록된 이메일로는 호스트를 등록할 수 없습니다.</p>
            <p>• 연락처 형식: 010-1234-5678 형식으로 입력해주세요.</p>
            <p>• 사업자번호 형식: 123-45-67890 형식으로 입력해주세요.</p>
            <p>• 상태 설정: 기본적으로 '승인 대기' 상태로 등록되며, 필요시 변경 가능합니다.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}