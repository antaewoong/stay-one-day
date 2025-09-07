'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Plus, Star, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface AccommodationForm {
  name: string
  description: string
  accommodation_types: string[]
  keywords: string[]
  region: string
  city: string
  address: string
  detailed_address: string
  base_capacity: number
  max_capacity: number
  bedrooms: number
  bathrooms: number
  base_price: number
  extra_person_fee: number
  checkin_time: string
  checkout_time: string
  is_featured: boolean
  is_new_open: boolean
  status: string
  selected_host_id: string
  usage_guide: string
}

export default function EditAccommodationPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [images, setImages] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [mainImageIndex, setMainImageIndex] = useState<number>(0)
  const [existingMainImageIndex, setExistingMainImageIndex] = useState<number>(0)
  const [amenities, setAmenities] = useState<{ type: string; name: string; available: boolean }[]>([])
  const [newKeyword, setNewKeyword] = useState('')
  const [newAmenity, setNewAmenity] = useState({ type: '', name: '' })
  const [optionProducts, setOptionProducts] = useState<{ name: string; price: number }[]>([])
  const [newOption, setNewOption] = useState({ name: '', price: 0 })
  const [hosts, setHosts] = useState<{ id: string; representative_name: string; phone: string }[]>([])
  const [error, setError] = useState('')

  const [form, setForm] = useState<AccommodationForm>({
    name: '',
    description: '',
    accommodation_types: [],
    keywords: [],
    region: '',
    city: '',
    address: '',
    detailed_address: '',
    base_capacity: 2,
    max_capacity: 4,
    bedrooms: 1,
    bathrooms: 1,
    base_price: 100000,
    extra_person_fee: 20000,
    checkin_time: '15:00',
    checkout_time: '23:00',
    is_featured: false,
    is_new_open: false,
    status: 'draft',
    selected_host_id: '',
    usage_guide: ''
  })

  const keywordSuggestions = ['풀빌라', '독채', '펜션', '루프탑', '글램핑', '캠핑', '게스트하우스', '모텔', '호텔', '바다뷰', '산뷰', '반려동물동반', '커플여행', '가족여행', '파티룸', '바베큐', '수영장', '온수풀', '스파', '사우나']
  const regions = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']
  const amenityTypes = ['수영장', '주차장', '에어컨', '와이파이', '애견동반가능', '세탁기', '건조기', '전자레인지', '취사시설', '음향시설', '제빙기', '숯불바베큐', '전기그릴', '가스그릴', '정수기', '스타일러', '공기청정기', '빔프로젝터', '비데', '키즈놀이시설', '젖병소독기', '유아의자', '자쿠지']

  // 숙소 데이터 로드
  useEffect(() => {
    if (params.id) {
      loadAccommodationData()
      loadHosts()
    }
  }, [params.id])

  const loadAccommodationData = async () => {
    try {
      setInitialLoading(true)
      
      // 숙소 정보 + 편의시설 정보 + 숙소 유형 정보 조회
      const { data: accommodation, error } = await supabase
        .from('accommodations')
        .select(`
          *,
          accommodation_amenities(
            id,
            amenity_type,
            amenity_name,
            is_available
          ),
          accommodation_types(
            id,
            type_name
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error

      if (accommodation) {
        setForm({
          name: accommodation.name || '',
          description: accommodation.description || '',
          accommodation_types: (() => {
            // 1. 먼저 accommodations 테이블의 accommodation_types 배열 확인
            if (accommodation.accommodation_types && Array.isArray(accommodation.accommodation_types)) {
              // 문자열 배열인 경우
              if (accommodation.accommodation_types.every((item: any) => typeof item === 'string')) {
                console.log('accommodations 테이블에서 문자열 배열 로드:', accommodation.accommodation_types)
                return accommodation.accommodation_types
              }
            }
            
            // 2. accommodation_types 테이블에서 불러온 데이터 확인 (조인 결과)
            if (accommodation.accommodation_types && Array.isArray(accommodation.accommodation_types)) {
              // 객체 배열인 경우 type_name 추출
              const typeNames = accommodation.accommodation_types
                .filter((item: any) => item && typeof item === 'object' && item.type_name)
                .map((item: any) => item.type_name)
              
              if (typeNames.length > 0) {
                console.log('accommodation_types 테이블에서 객체 배열 로드:', typeNames)
                return typeNames
              }
            }
            
            // 3. 기본값으로 accommodation_type 사용
            const fallback = accommodation.accommodation_type ? [accommodation.accommodation_type] : []
            console.log('기본값으로 accommodation_type 사용:', fallback)
            return fallback
          })(),
          keywords: accommodation.keywords || [],
          region: accommodation.region || '',
          city: accommodation.city || '',
          address: accommodation.address || '',
          detailed_address: accommodation.detailed_address || '',
          base_capacity: accommodation.base_capacity || 2,
          max_capacity: accommodation.max_capacity || 4,
          bedrooms: accommodation.bedrooms || 1,
          bathrooms: accommodation.bathrooms || 1,
          base_price: accommodation.base_price || 100000,
          extra_person_fee: accommodation.extra_person_fee || 20000,
          checkin_time: accommodation.checkin_time ? accommodation.checkin_time.substring(0, 5) : '15:00',
          checkout_time: accommodation.checkout_time ? accommodation.checkout_time.substring(0, 5) : '23:00',
          is_featured: accommodation.is_featured || false,
          is_new_open: accommodation.is_new_open || false,
          status: accommodation.status || 'draft',
          selected_host_id: accommodation.host_id || '',
          usage_guide: accommodation.usage_guide || ''
        })

        setExistingImages(accommodation.images || [])
        setExistingMainImageIndex(0)
        
        // 편의시설 데이터를 올바른 형태로 변환
        const amenitiesFromDB = accommodation.accommodation_amenities || []
        const formattedAmenities = amenitiesFromDB.map((amenity: any) => ({
          type: amenity.amenity_type,
          name: amenity.amenity_name,
          available: amenity.is_available
        }))
        setAmenities(formattedAmenities)
        
        setOptionProducts(accommodation.extra_options || [])
      }
    } catch (error) {
      console.error('숙소 데이터 로드 실패:', error)
      setError('숙소 데이터를 불러올 수 없습니다.')
    } finally {
      setInitialLoading(false)
    }
  }

  const loadHosts = async () => {
    try {
      const { data, error } = await supabase
        .from('hosts')
        .select('id, representative_name, phone')
        .order('representative_name')

      if (error) throw error
      setHosts(data || [])
    } catch (error) {
      console.error('호스트 목록 로드 실패:', error)
    }
  }

  // 숙소 유형 중복 선택 핸들러  
  const toggleAccommodationType = (type: string) => {
    setForm(prev => ({
      ...prev,
      accommodation_types: prev.accommodation_types.includes(type)
        ? prev.accommodation_types.filter(t => t !== type)
        : [...prev.accommodation_types, type]
    }))
  }

  // 키워드 선택 핸들러 (최대 5개)
  const toggleKeyword = (keyword: string) => {
    setForm(prev => {
      const isSelected = prev.keywords.includes(keyword)
      if (isSelected) {
        return {
          ...prev,
          keywords: prev.keywords.filter(k => k !== keyword)
        }
      } else {
        if (prev.keywords.length >= 5) {
          alert('키워드는 최대 5개까지 선택 가능합니다.')
          return prev
        }
        return {
          ...prev,
          keywords: [...prev.keywords, keyword]
        }
      }
    })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files)
      setImages(prev => [...prev, ...newImages])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 필수 필드 검증
      if (!form.name || !form.region || !form.city || !form.address || form.accommodation_types.length === 0 || !form.base_price) {
        alert('필수 정보를 모두 입력해주세요.')
        setLoading(false)
        return
      }

      if (form.description.length > 500) {
        alert('숙소 설명은 500자를 초과할 수 없습니다.')
        setLoading(false)
        return
      }

      if (!form.selected_host_id) {
        alert('호스트를 선택해주세요.')
        setLoading(false)
        return
      }

      // 새로운 이미지 업로드 (기존 이미지는 유지)
      const imageUrls: string[] = [...existingImages]
      
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const file = images[i]
          const timestamp = Date.now()
          const randomId = Math.random().toString(36).substring(2, 8)
          // 파일 확장자만 추출
          const fileExtension = file.name.split('.').pop() || 'jpg'
          // 안전한 파일명 생성 (타임스탬프 + 랜덤ID + 확장자)
          const sanitizedFileName = `accommodation_${timestamp}_${randomId}.${fileExtension}`
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('accommodation-images')
            .upload(sanitizedFileName, file)
            
          if (uploadError) {
            console.error('이미지 업로드 실패:', uploadError)
            throw new Error(`이미지 업로드 실패: ${uploadError.message}`)
          }
          
          // 공개 URL 생성
          const { data: urlData } = supabase.storage
            .from('accommodation-images')
            .getPublicUrl(sanitizedFileName)
            
          imageUrls.push(urlData.publicUrl)
        }
      }

      // 대표 이미지를 맨 앞으로 이동
      const finalImages = [...imageUrls]
      let mainImageUrl = ''
      
      // 기존 이미지 중 대표 이미지가 선택된 경우
      if (existingMainImageIndex < existingImages.length) {
        mainImageUrl = existingImages[existingMainImageIndex]
      }
      // 새 이미지 중 대표 이미지가 선택된 경우  
      else if (mainImageIndex < images.length) {
        const newImageStartIndex = existingImages.length
        mainImageUrl = imageUrls[newImageStartIndex + mainImageIndex]
      }
      
      // 대표 이미지를 배열 맨 앞으로 이동
      if (mainImageUrl) {
        const mainIndex = finalImages.indexOf(mainImageUrl)
        if (mainIndex > 0) {
          finalImages.splice(mainIndex, 1) // 기존 위치에서 제거
          finalImages.unshift(mainImageUrl) // 맨 앞에 추가
        }
      }

      // 디버깅: 저장할 데이터 로그
      console.log('저장할 accommodation_types:', form.accommodation_types)
      const cleanTypes = form.accommodation_types.filter((type: any) => typeof type === 'string')
      console.log('필터링된 accommodation_types:', cleanTypes)
      
      // 숙소 정보 업데이트 (amenities는 별도 처리)
      const { data: accommodation, error: accommodationError } = await supabase
        .from('accommodations')
        .update({
          name: form.name,
          description: form.description,
          accommodation_type: (() => {
            // 허용된 타입들
            const allowedTypes = ['풀빌라', '독채', '펜션']
            // 선택된 타입 중 허용된 것 찾기
            const validType = form.accommodation_types.find(type => allowedTypes.includes(type))
            return validType || '펜션'
          })(),
          accommodation_types: cleanTypes, // 문자열만 저장
          keywords: form.keywords,
          region: form.region,
          city: form.city,
          address: form.address,
          detailed_address: form.detailed_address,
          base_capacity: form.base_capacity,
          max_capacity: form.max_capacity,
          bedrooms: form.bedrooms,
          bathrooms: form.bathrooms,
          base_price: form.base_price,
          extra_person_fee: form.extra_person_fee,
          checkin_time: form.checkin_time,
          checkout_time: form.checkout_time,
          status: form.status,
          is_featured: form.is_featured,
          is_new_open: form.is_new_open,
          host_id: form.selected_host_id,
          extra_options: optionProducts,
          images: finalImages,
          usage_guide: form.usage_guide,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .select()

      if (accommodationError) throw accommodationError

      console.log('저장 완료, 응답 데이터:', accommodation)

      // accommodation_types 별도 테이블도 업데이트 (중복 저장 방지를 위해 기존 것 삭제 후 추가)
      if (cleanTypes && cleanTypes.length > 0) {
        // 1. 기존 accommodation_types 삭제
        await supabase
          .from('accommodation_types')
          .delete()
          .eq('accommodation_id', params.id)

        // 2. 새로운 accommodation_types 추가
        const typeData = cleanTypes.map((typeName: string) => ({
          accommodation_id: params.id,
          type_name: typeName
        }))

        const { error: typeError } = await supabase
          .from('accommodation_types')
          .insert(typeData)

        if (typeError) {
          console.error('숙소 유형 저장 실패:', typeError)
          // 유형 저장 실패해도 숙소 업데이트는 계속 진행
        }
      }

      // 편의시설 업데이트 (별도 테이블)
      if (amenities.length > 0) {
        // 기존 편의시설 삭제
        await supabase
          .from('accommodation_amenities')
          .delete()
          .eq('accommodation_id', params.id)

        // 새로운 편의시설 추가
        const amenityData = amenities.map((amenity) => ({
          accommodation_id: params.id,
          amenity_type: amenity.type,
          amenity_name: amenity.name,
          is_available: amenity.available
        }))

        const { error: amenityError } = await supabase
          .from('accommodation_amenities')
          .insert(amenityData)

        if (amenityError) {
          console.error('편의시설 업데이트 실패:', amenityError)
          // 편의시설 실패해도 숙소 업데이트는 계속 진행
        }
      }

      alert('숙소 정보가 성공적으로 업데이트되었습니다!')
      router.push('/admin/accommodations')

    } catch (error) {
      console.error('숙소 업데이트 실패:', error)
      alert('숙소 업데이트에 실패했습니다: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // 편의시설 추가
  const addAmenity = () => {
    if (newAmenity.type && newAmenity.name) {
      setAmenities([...amenities, { ...newAmenity, available: true }])
      setNewAmenity({ type: '', name: '' })
    }
  }

  // 옵션 상품 추가
  const addOption = () => {
    if (newOption.name && newOption.price > 0) {
      setOptionProducts([...optionProducts, newOption])
      setNewOption({ name: '', price: 0 })
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>숙소 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button asChild>
            <Link href="/admin/accommodations">목록으로 돌아가기</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" asChild>
          <Link href="/admin/accommodations">
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">숙소 정보 수정</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>숙소 정보 수정</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">숙소명 *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>숙소 유형 * (중복 선택 가능)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['풀빌라', '독채', '펜션', '루프탑', '글램핑', '캠핑', '게스트하우스', '모텔', '호텔', '키즈', '파티', '애견동반', '기타'].map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={form.accommodation_types.includes(type)}
                        onCheckedChange={() => toggleAccommodationType(type)}
                      />
                      <Label htmlFor={type} className="text-sm cursor-pointer">{type}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 설명 */}
            <div>
              <Label htmlFor="description">숙소 설명 (최대 500자)</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                maxLength={500}
                placeholder="숙소의 특징과 매력을 소개해주세요..."
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {form.description.length}/500
              </div>
            </div>

            {/* 이용안내 */}
            <div>
              <Label htmlFor="usage_guide">이용안내</Label>
              <Textarea
                id="usage_guide"
                value={form.usage_guide}
                onChange={(e) => setForm({ ...form, usage_guide: e.target.value })}
                rows={6}
                placeholder={`체크인 및 체크아웃 시간, 시설 이용 방법, 주의사항 등을 안내해주세요.

예시:
• 체크인: ${form.checkin_time || '15:00'} / 체크아웃: ${form.checkout_time || '23:00'}
• 주차: 무료 주차 1대 가능
• 수영장 이용시간: 08:00 ~ 22:00
• 바베큐 그릴 사용 시 사전 요청 필요
• 금연 숙소입니다
• 반려동물 동반 불가`}
              />
              <div className="text-sm text-gray-500 mt-1">
                게스트들이 숙소를 더 편리하게 이용할 수 있도록 상세한 안내를 작성해주세요.
              </div>
            </div>

            {/* 위치 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">위치 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="region">지역 *</Label>
                  <Select value={form.region} onValueChange={(value) => setForm({ ...form, region: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="지역 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map(region => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="city">시/군/구 *</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="예: 청주시"
                    required
                  />
                </div>
                <div></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="address">주소 *</Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="예: 충북 청주시 상당구 ..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="detailed_address">상세 주소</Label>
                  <Input
                    id="detailed_address"
                    value={form.detailed_address}
                    onChange={(e) => setForm({ ...form, detailed_address: e.target.value })}
                    placeholder="예: 101동 201호"
                  />
                </div>
              </div>
            </div>

            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">기본 정보</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="base_capacity">기본 인원 *</Label>
                  <Input
                    id="base_capacity"
                    type="number"
                    value={form.base_capacity}
                    onChange={(e) => setForm({ ...form, base_capacity: parseInt(e.target.value) || 0 })}
                    min={1}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="max_capacity">최대 인원 *</Label>
                  <Input
                    id="max_capacity"
                    type="number"
                    value={form.max_capacity}
                    onChange={(e) => setForm({ ...form, max_capacity: parseInt(e.target.value) || 0 })}
                    min={1}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="bedrooms">침실 수</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={form.bedrooms}
                    onChange={(e) => setForm({ ...form, bedrooms: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
                <div>
                  <Label htmlFor="bathrooms">욕실 수</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={form.bathrooms}
                    onChange={(e) => setForm({ ...form, bathrooms: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
              </div>
            </div>

            {/* 가격 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">가격 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="base_price">기본 가격 (원) *</Label>
                  <Input
                    id="base_price"
                    type="number"
                    value={form.base_price}
                    onChange={(e) => setForm({ ...form, base_price: parseInt(e.target.value) || 0 })}
                    min={0}
                    step={1000}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="extra_person_fee">추가 인원비 (원)</Label>
                  <Input
                    id="extra_person_fee"
                    type="number"
                    value={form.extra_person_fee}
                    onChange={(e) => setForm({ ...form, extra_person_fee: parseInt(e.target.value) || 0 })}
                    min={0}
                    step={1000}
                  />
                </div>
              </div>
            </div>

            {/* 체크인/아웃 시간 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">체크인/아웃 시간</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="checkin_time">체크인 시간 *</Label>
                  <Input
                    id="checkin_time"
                    type="time"
                    value={form.checkin_time}
                    onChange={(e) => setForm({ ...form, checkin_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="checkout_time">체크아웃 시간 *</Label>
                  <Input
                    id="checkout_time"
                    type="time"
                    value={form.checkout_time}
                    onChange={(e) => setForm({ ...form, checkout_time: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* 호스트 선택 */}
            <div>
              <Label>호스트 선택 *</Label>
              <Select 
                value={form.selected_host_id} 
                onValueChange={(value) => setForm({ ...form, selected_host_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="호스트를 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  {hosts.map(host => (
                    <SelectItem key={host.id} value={host.id}>
                      {host.representative_name} ({host.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 상태 및 설정 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">상태 및 설정</h3>
              
              <div>
                <Label>숙소 상태</Label>
                <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">임시저장</SelectItem>
                    <SelectItem value="pending">승인대기</SelectItem>
                    <SelectItem value="active">활성</SelectItem>
                    <SelectItem value="inactive">비활성</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_featured"
                    checked={form.is_featured}
                    onCheckedChange={(checked) => setForm({ ...form, is_featured: Boolean(checked) })}
                  />
                  <Label htmlFor="is_featured" className="flex items-center cursor-pointer">
                    <Star className="w-4 h-4 mr-2" />
                    추천 숙소로 설정
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_new_open"
                    checked={form.is_new_open}
                    onCheckedChange={(checked) => setForm({ ...form, is_new_open: Boolean(checked) })}
                  />
                  <Label htmlFor="is_new_open" className="cursor-pointer">
                    신규 오픈 숙소로 표시
                  </Label>
                </div>
              </div>
            </div>

            {/* 기존 이미지 표시 */}
            {existingImages.length > 0 && (
              <div>
                <Label>기존 이미지</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  {existingImages.map((imageUrl, index) => (
                    <div key={index} className="relative">
                      <img
                        src={imageUrl}
                        alt={`기존 이미지 ${index + 1}`}
                        className={`w-full h-32 object-cover rounded border-2 ${
                          existingMainImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                        }`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300&h=200&fit=crop'
                        }}
                      />
                      {existingMainImageIndex === index && (
                        <div className="absolute top-1 left-1 bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
                          대표
                        </div>
                      )}
                      <div className="absolute bottom-1 left-1 flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs bg-white"
                          onClick={() => setExistingMainImageIndex(index)}
                        >
                          <Star className="w-3 h-3" />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1"
                        onClick={() => {
                          setExistingImages(prev => prev.filter((_, i) => i !== index))
                          // 삭제된 이미지가 대표 이미지였다면 첫 번째 이미지를 대표로 설정
                          if (existingMainImageIndex === index) {
                            setExistingMainImageIndex(0)
                          } else if (existingMainImageIndex > index) {
                            setExistingMainImageIndex(prev => prev - 1)
                          }
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 편의시설 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">편의시설 관리</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {amenityTypes.map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={amenity}
                      checked={amenities.some(a => a.name === amenity)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setAmenities([...amenities, { type: amenity.toLowerCase().replace(/\s+/g, '_'), name: amenity, available: true }])
                        } else {
                          setAmenities(amenities.filter(a => a.name !== amenity))
                        }
                      }}
                    />
                    <Label htmlFor={amenity} className="text-sm cursor-pointer">{amenity}</Label>
                  </div>
                ))}
              </div>
              
              {/* 현재 선택된 편의시설 표시 */}
              {amenities.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">선택된 편의시설</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {amenities.map((amenity, index) => (
                      <Badge key={index} variant="secondary">
                        {amenity.name}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-1 p-0 h-4 w-4"
                          onClick={() => setAmenities(amenities.filter((_, i) => i !== index))}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 새 이미지 업로드 */}
            <div>
              <Label htmlFor="images">새 이미지 추가</Label>
              <div className="mt-2">
                <input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('images')?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  이미지 선택 ({images.length}개 선택됨)
                </Button>
              </div>
              
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`새 이미지 ${index + 1}`}
                        className={`w-full h-32 object-cover rounded border-2 ${
                          existingImages.length === 0 && mainImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                        }`}
                      />
                      {existingImages.length === 0 && mainImageIndex === index && (
                        <div className="absolute top-1 left-1 bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
                          대표
                        </div>
                      )}
                      <div className="absolute bottom-1 left-1 flex gap-1">
                        {existingImages.length === 0 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs bg-white"
                            onClick={() => setMainImageIndex(index)}
                          >
                            <Star className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1"
                        onClick={() => {
                          setImages(prev => prev.filter((_, i) => i !== index))
                          // 삭제된 이미지가 대표 이미지였다면 첫 번째 이미지를 대표로 설정
                          if (mainImageIndex === index) {
                            setMainImageIndex(0)
                          } else if (mainImageIndex > index) {
                            setMainImageIndex(prev => prev - 1)
                          }
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/accommodations">취소</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    수정 중...
                  </>
                ) : (
                  '수정 완료'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}