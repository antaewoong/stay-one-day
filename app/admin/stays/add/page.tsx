'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Plus, X, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AccommodationForm {
  name: string
  description: string
  address: string
  latitude: number | null
  longitude: number | null
  base_price: number
  basic_occupancy: number
  max_occupancy: number
  category: string
  amenities: string[]
  check_in_time: string
  check_out_time: string
  images: string[]
  status: 'active' | 'inactive'
}

const CATEGORY_OPTIONS = [
  'villa',
  'pension',
  'hotel',
  'resort',
  'guesthouse',
  'camping'
]

const AMENITY_OPTIONS = [
  'wifi',
  'parking',
  'pool',
  'kitchen',
  'barbecue',
  'spa',
  'gym',
  'restaurant',
  'breakfast',
  'pet_friendly',
  'smoking_allowed',
  'wheelchair_accessible'
]

export default function AddAccommodationPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<AccommodationForm>({
    name: '',
    description: '',
    address: '',
    latitude: null,
    longitude: null,
    base_price: 0,
    basic_occupancy: 2,
    max_occupancy: 4,
    category: '',
    amenities: [],
    check_in_time: '15:00',
    check_out_time: '11:00',
    images: [],
    status: 'active'
  })
  
  const [imageUrl, setImageUrl] = useState('')

  const handleInputChange = (field: keyof AccommodationForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleAmenityToggle = (amenity: string) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }))
  }

  const addImage = () => {
    if (imageUrl.trim()) {
      setForm(prev => ({
        ...prev,
        images: [...prev.images, imageUrl.trim()]
      }))
      setImageUrl('')
    }
  }

  const removeImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.name || !form.address || !form.category) {
      alert('필수 정보를 모두 입력해주세요.')
      return
    }

    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('accommodations')
        .insert([{
          name: form.name,
          description: form.description,
          address: form.address,
          latitude: form.latitude,
          longitude: form.longitude,
          base_price: form.base_price,
          basic_occupancy: form.basic_occupancy,
          max_occupancy: form.max_occupancy,
          category: form.category,
          amenities: form.amenities,
          check_in_time: form.check_in_time,
          check_out_time: form.check_out_time,
          images: form.images,
          status: form.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()

      if (error) {
        console.error('숙소 추가 오류:', error)
        alert('숙소 추가 중 오류가 발생했습니다: ' + error.message)
        return
      }

      alert('숙소가 성공적으로 추가되었습니다!')
      router.push('/admin/stays')
    } catch (error) {
      console.error('숙소 추가 실패:', error)
      alert('숙소 추가에 실패했습니다.')
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-2xl font-bold">숙소 추가</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">숙소명 *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="숙소명을 입력해주세요"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">카테고리 *</Label>
                <Select value={form.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리를 선택해주세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="숙소 설명을 입력해주세요"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="address">주소 *</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="전체 주소를 입력해주세요"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">위도</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={form.latitude || ''}
                    onChange={(e) => handleInputChange('latitude', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="위도"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">경도</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={form.longitude || ''}
                    onChange={(e) => handleInputChange('longitude', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="경도"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 가격 및 수용인원 */}
          <Card>
            <CardHeader>
              <CardTitle>가격 및 수용인원</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="base_price">기본 가격 (1박)</Label>
                <Input
                  id="base_price"
                  type="number"
                  value={form.base_price}
                  onChange={(e) => handleInputChange('base_price', parseInt(e.target.value) || 0)}
                  placeholder="기본 가격을 입력해주세요"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="basic_occupancy">기준 인원</Label>
                  <Input
                    id="basic_occupancy"
                    type="number"
                    min="1"
                    value={form.basic_occupancy}
                    onChange={(e) => handleInputChange('basic_occupancy', parseInt(e.target.value) || 2)}
                  />
                </div>
                <div>
                  <Label htmlFor="max_occupancy">최대 인원</Label>
                  <Input
                    id="max_occupancy"
                    type="number"
                    min="1"
                    value={form.max_occupancy}
                    onChange={(e) => handleInputChange('max_occupancy', parseInt(e.target.value) || 4)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="check_in_time">체크인 시간</Label>
                  <Input
                    id="check_in_time"
                    type="time"
                    value={form.check_in_time}
                    onChange={(e) => handleInputChange('check_in_time', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="check_out_time">체크아웃 시간</Label>
                  <Input
                    id="check_out_time"
                    type="time"
                    value={form.check_out_time}
                    onChange={(e) => handleInputChange('check_out_time', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">상태</Label>
                <Select value={form.status} onValueChange={(value: 'active' | 'inactive') => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">활성</SelectItem>
                    <SelectItem value="inactive">비활성</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 편의시설 */}
          <Card>
            <CardHeader>
              <CardTitle>편의시설</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {AMENITY_OPTIONS.map(amenity => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={amenity}
                      checked={form.amenities.includes(amenity)}
                      onCheckedChange={() => handleAmenityToggle(amenity)}
                    />
                    <Label htmlFor={amenity} className="text-sm">
                      {amenity.replace('_', ' ').charAt(0).toUpperCase() + amenity.replace('_', ' ').slice(1)}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 이미지 */}
          <Card>
            <CardHeader>
              <CardTitle>이미지</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="이미지 URL을 입력해주세요"
                />
                <Button type="button" onClick={addImage}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {form.images.length > 0 && (
                <div className="space-y-2">
                  {form.images.map((image, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm truncate flex-1">{image}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
            {loading ? '저장 중...' : '숙소 추가'}
          </Button>
        </div>
      </form>
    </div>
  )
}