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
  Upload,
  X,
  MapPin,
  Users,
  Bed,
  Bath,
  Wifi,
  Car,
  Utensils,
  Waves,
  Zap,
  Shield,
  Camera
} from 'lucide-react'
import Image from 'next/image'

export default function NewAccommodationPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    accommodation_type: '펜션',
    region: '',
    address: '',
    detailed_address: '',
    max_capacity: 4,
    bedrooms: 2,
    bathrooms: 1,
    base_price: 100000,
    weekend_price: 120000,
    checkin_time: '15:00',
    checkout_time: '11:00',
    amenities: [] as string[]
  })

  // 편의시설 옵션들
  const amenitiesOptions = [
    { id: 'wifi', name: 'WiFi', icon: Wifi },
    { id: 'parking', name: '주차장', icon: Car },
    { id: 'kitchen', name: '주방/취사', icon: Utensils },
    { id: 'pool', name: '수영장', icon: Waves },
    { id: 'bbq', name: '바베큐', icon: Zap },
    { id: 'security', name: '보안시설', icon: Shield }
  ]

  // 숙소 타입 옵션들
  const typeOptions = [
    '펜션', '풀빌라', '독채형', '한옥', '글램핑', '리조트'
  ]

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAmenityToggle = (amenityId: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId]
    }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    // 실제로는 파일을 서버에 업로드하고 URL을 받아야 하지만
    // 여기서는 시연을 위해 로컬 이미지 경로를 사용
    Array.from(files).forEach((file, index) => {
      const imageUrl = `/images/90staycj/${uploadedImages.length + index + 1}.jpg`
      setUploadedImages(prev => [...prev, imageUrl])
    })
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
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
      if (!formData.name || !formData.description || !formData.region) {
        setError('필수 정보를 모두 입력해주세요.')
        return
      }

      // 숙소 정보 저장
      const { data: accommodation, error: insertError } = await supabase
        .from('accommodations')
        .insert([{
          name: formData.name,
          description: formData.description,
          accommodation_type: formData.accommodation_type,
          region: formData.region,
          address: formData.address,
          detailed_address: formData.detailed_address,
          max_capacity: formData.max_capacity,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          base_price: formData.base_price,
          weekend_price: formData.weekend_price,
          checkin_time: formData.checkin_time,
          checkout_time: formData.checkout_time,
          is_featured: false,
          status: 'pending', // 관리자 승인 대기
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // 이미지 정보 저장
      if (uploadedImages.length > 0 && accommodation) {
        const imageData = uploadedImages.map((url, index) => ({
          accommodation_id: accommodation.id,
          image_url: url,
          alt_text: `${formData.name} 이미지 ${index + 1}`,
          is_primary: index === 0
        }))

        const { error: imageError } = await supabase
          .from('accommodation_images')
          .insert(imageData)

        if (imageError) {
          console.error('이미지 저장 실패:', imageError)
        }
      }

      setSuccess(true)
      
      // 3초 후 대시보드로 이동
      setTimeout(() => {
        router.push('/host/dashboard')
      }, 3000)

    } catch (error: any) {
      console.error('숙소 등록 실패:', error)
      setError(error.message || '등록에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">숙소 등록</h1>
          <p className="text-gray-600">몇 분만 투자하면 숙소 등록이 완료됩니다</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              숙소 정보 입력
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* 기본 정보 */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">기본 정보</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name" className="text-gray-900 font-semibold">숙소명 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="예: 청주 힐스테이 펜션"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="type" className="text-gray-900 font-semibold">숙소 타입 *</Label>
                    <select
                      id="type"
                      value={formData.accommodation_type}
                      onChange={(e) => handleInputChange('accommodation_type', e.target.value)}
                      className="mt-1 w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white"
                    >
                      {typeOptions.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-gray-900 font-semibold">숙소 소개 *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="숙소의 특징과 매력을 소개해주세요"
                    rows={4}
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              {/* 사진 업로드 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">숙소 사진</h3>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">클릭하여 사진 업로드</p>
                    <p className="text-sm text-gray-500 mt-1">JPG, PNG 파일 (최대 10개)</p>
                  </label>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedImages.map((url, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={url}
                          alt={`업로드 이미지 ${index + 1}`}
                          width={200}
                          height={150}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                            대표사진
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 위치 정보 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">위치 정보</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="region" className="text-gray-900 font-semibold">지역 *</Label>
                    <Input
                      id="region"
                      value={formData.region}
                      onChange={(e) => handleInputChange('region', e.target.value)}
                      placeholder="예: 충청북도 청주시"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-gray-900 font-semibold">주소</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="시/군/구까지만 입력"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* 숙소 정보 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">숙소 정보</h3>
                
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <Label className="text-gray-900 font-semibold flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      최대 인원
                    </Label>
                    <Input
                      type="number"
                      value={formData.max_capacity}
                      onChange={(e) => handleInputChange('max_capacity', parseInt(e.target.value))}
                      min="1"
                      max="30"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-900 font-semibold flex items-center gap-2">
                      <Bed className="w-4 h-4" />
                      침실 수
                    </Label>
                    <Input
                      type="number"
                      value={formData.bedrooms}
                      onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value))}
                      min="1"
                      max="10"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-900 font-semibold flex items-center gap-2">
                      <Bath className="w-4 h-4" />
                      욕실 수
                    </Label>
                    <Input
                      type="number"
                      value={formData.bathrooms}
                      onChange={(e) => handleInputChange('bathrooms', parseInt(e.target.value))}
                      min="1"
                      max="10"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* 가격 설정 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">가격 설정</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="base_price" className="text-gray-900 font-semibold">평일 가격 (원) *</Label>
                    <Input
                      id="base_price"
                      type="number"
                      value={formData.base_price}
                      onChange={(e) => handleInputChange('base_price', parseInt(e.target.value))}
                      placeholder="100000"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="weekend_price" className="text-gray-900 font-semibold">주말 가격 (원)</Label>
                    <Input
                      id="weekend_price"
                      type="number"
                      value={formData.weekend_price}
                      onChange={(e) => handleInputChange('weekend_price', parseInt(e.target.value))}
                      placeholder="120000"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* 편의시설 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">편의시설</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {amenitiesOptions.map((amenity) => {
                    const IconComponent = amenity.icon
                    const isSelected = formData.amenities.includes(amenity.id)
                    
                    return (
                      <button
                        key={amenity.id}
                        type="button"
                        onClick={() => handleAmenityToggle(amenity.id)}
                        className={`p-4 rounded-lg border-2 text-center transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <IconComponent className={`w-6 h-6 mx-auto mb-2 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                        <span className="text-sm font-medium">{amenity.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 체크인/아웃 시간 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">이용 시간</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="checkin" className="text-gray-900 font-semibold">체크인 시간</Label>
                    <Input
                      id="checkin"
                      type="time"
                      value={formData.checkin_time}
                      onChange={(e) => handleInputChange('checkin_time', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="checkout" className="text-gray-900 font-semibold">체크아웃 시간</Label>
                    <Input
                      id="checkout"
                      type="time"
                      value={formData.checkout_time}
                      onChange={(e) => handleInputChange('checkout_time', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* 등록 안내 */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">📋 등록 안내</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 등록 후 관리자 승인이 필요합니다 (1-2 영업일 소요)</li>
                  <li>• 승인 완료 후 사이트에 숙소가 공개됩니다</li>
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
                    <p className="font-medium">숙소 등록이 완료되었습니다!</p>
                    <p className="text-sm">관리자 승인 후 사이트에 공개됩니다. 대시보드로 이동합니다...</p>
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
                  '숙소 등록하기'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}