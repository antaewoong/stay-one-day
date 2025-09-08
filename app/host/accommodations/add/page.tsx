'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, X, Upload } from 'lucide-react'
import Link from 'next/link'

export default function AddAccommodationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    type: '',
    base_price: '',
    base_guests: '2',
    additional_guest_fee: '0',
    max_guests: '10',
    check_in_time: '15:00',
    check_out_time: '23:00',
    amenities: [] as string[],
    images: [] as string[]
  })

  const [options, setOptions] = useState<{name: string, price: string}[]>([])
  const [currentOption, setCurrentOption] = useState({ name: '', price: '' })

  const amenitiesList = [
    '수영장', '바베큐시설', '주차장', '에어컨', '와이파이', '애견동반가능',
    '세탁기', '건조기', '냉장고', '전자레인지', '취사시설', '넓은 거실',
    '루프탑', '시티뷰', '감성 인테리어', '음향시설', '애견놀이터', '애견샤워장',
    '아이놀이방', '마당', '캠프파이어', '튜브 대여'
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }))
  }

  const handleAddOption = () => {
    if (currentOption.name && currentOption.price) {
      setOptions(prev => [...prev, currentOption])
      setCurrentOption({ name: '', price: '' })
    }
  }

  const handleRemoveOption = (index: number) => {
    setOptions(prev => prev.filter((_, i) => i !== index))
  }

  const handleAddImage = () => {
    const url = prompt('이미지 URL을 입력하세요:')
    if (url) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, url]
      }))
    }
  }

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const hostUser = sessionStorage.getItem('hostUser')
      if (!hostUser) {
        alert('로그인이 필요합니다.')
        router.push('/host/login')
        return
      }

      const hostData = JSON.parse(hostUser)
      
      const payload = {
        ...formData,
        base_price: parseInt(formData.base_price),
        base_guests: parseInt(formData.base_guests),
        additional_guest_fee: parseInt(formData.additional_guest_fee),
        max_guests: parseInt(formData.max_guests),
        options: options.map(opt => ({ ...opt, price: parseInt(opt.price) })),
        host_id: hostData.host_id || 'host-1',
        host_name: hostData.name || '호스트',
        host_business_name: hostData.business_name || '사업자명'
      }

      const response = await fetch('/api/accommodations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('숙소 등록에 실패했습니다.')
      }

      alert('숙소가 성공적으로 등록되었습니다! 관리자 승인 후 노출됩니다.')
      router.push('/host/accommodations')
    } catch (error) {
      console.error('등록 실패:', error)
      alert('숙소 등록에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/host/accommodations">
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">새 숙소 등록</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <Card className="border shadow-sm">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-gray-900">기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                숙소명 <span className="text-red-500">*</span>
              </label>
              <Input
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="예: 청주 프라이빗 풀빌라"
                className="border-gray-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                숙소 설명
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="숙소에 대한 자세한 설명을 입력해주세요..."
                rows={4}
                className="border-gray-200"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  위치 <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="예: 충북 청주시 청원구"
                  className="border-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  숙소 유형 <span className="text-red-500">*</span>
                </label>
                <Select required value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger className="border-gray-200">
                    <SelectValue placeholder="숙소 유형 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="풀빌라">풀빌라</SelectItem>
                    <SelectItem value="독채">독채</SelectItem>
                    <SelectItem value="펜션">펜션</SelectItem>
                    <SelectItem value="루프탑">루프탑</SelectItem>
                    <SelectItem value="글램핑">글램핑</SelectItem>
                    <SelectItem value="캠핑">캠핑</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 가격 및 인원 정보 */}
        <Card className="border shadow-sm">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-gray-900">가격 및 인원 정보</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  기본 가격 <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  type="number"
                  value={formData.base_price}
                  onChange={(e) => handleInputChange('base_price', e.target.value)}
                  placeholder="180000"
                  className="border-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  기본 인원
                </label>
                <Input
                  type="number"
                  value={formData.base_guests}
                  onChange={(e) => handleInputChange('base_guests', e.target.value)}
                  className="border-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  추가 인원비
                </label>
                <Input
                  type="number"
                  value={formData.additional_guest_fee}
                  onChange={(e) => handleInputChange('additional_guest_fee', e.target.value)}
                  className="border-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  최대 인원
                </label>
                <Input
                  type="number"
                  value={formData.max_guests}
                  onChange={(e) => handleInputChange('max_guests', e.target.value)}
                  className="border-gray-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  입실 시간
                </label>
                <Input
                  type="time"
                  value={formData.check_in_time}
                  onChange={(e) => handleInputChange('check_in_time', e.target.value)}
                  className="border-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  퇴실 시간
                </label>
                <Input
                  type="time"
                  value={formData.check_out_time}
                  onChange={(e) => handleInputChange('check_out_time', e.target.value)}
                  className="border-gray-200"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 편의시설 */}
        <Card className="border shadow-sm">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-gray-900">편의시설</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {amenitiesList.map((amenity) => (
                <div
                  key={amenity}
                  onClick={() => handleAmenityToggle(amenity)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.amenities.includes(amenity)
                      ? 'border-green-500 bg-green-50 text-green-800'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-sm">{amenity}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 추가 옵션 */}
        <Card className="border shadow-sm">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-gray-900">추가 옵션</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="옵션명 (예: 바베큐 세트)"
                value={currentOption.name}
                onChange={(e) => setCurrentOption(prev => ({ ...prev, name: e.target.value }))}
                className="border-gray-200"
              />
              <Input
                placeholder="가격"
                type="number"
                value={currentOption.price}
                onChange={(e) => setCurrentOption(prev => ({ ...prev, price: e.target.value }))}
                className="border-gray-200 w-32"
              />
              <Button type="button" onClick={handleAddOption} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {options.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {options.map((option, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="border-green-200 text-green-800 px-3 py-1"
                  >
                    {option.name} - ₩{parseInt(option.price).toLocaleString()}
                    <X
                      className="w-3 h-3 ml-2 cursor-pointer"
                      onClick={() => handleRemoveOption(index)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 이미지 */}
        <Card className="border shadow-sm">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-gray-900">숙소 이미지</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <Button type="button" onClick={handleAddImage} variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
              <Upload className="w-4 h-4 mr-2" />
              이미지 URL 추가
            </Button>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`숙소 이미지 ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 w-6 h-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 제출 버튼 */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/host/accommodations">취소</Link>
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? '등록 중...' : '숙소 등록'}
          </Button>
        </div>
      </form>
    </div>
  )
}