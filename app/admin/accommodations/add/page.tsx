'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Plus, Star } from 'lucide-react'

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
  selected_host_id: string
}

export default function AddAccommodationPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [mainImageIndex, setMainImageIndex] = useState<number>(0) // 대표 사진 인덱스
  // categories는 form.keywords로 대체됨
  const [amenities, setAmenities] = useState<{ type: string; name: string; available: boolean }[]>([])
  const [newKeyword, setNewKeyword] = useState('')
  const [newAmenity, setNewAmenity] = useState({ type: '', name: '' })
  const [optionProducts, setOptionProducts] = useState<{ name: string; price: number }[]>([])
  const [newOption, setNewOption] = useState({ name: '', price: 0 })
  const [hosts, setHosts] = useState<{ id: string; representative_name: string; phone: string }[]>([])
  const [hasSavedData, setHasSavedData] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // localStorage 키
  const STORAGE_KEY = 'accommodation-form-draft'

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
    selected_host_id: ''
  })

  const keywordSuggestions = ['풀빌라', '독채', '펜션', '루프탑', '글램핑', '캠핑', '게스트하우스', '모텔', '호텔', '바다뷰', '산뷰', '반려동물동반', '커플여행', '가족여행', '파티룸', '바베큐', '수영장', '온수풀', '스파', '사우나']
  const regions = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']
  const amenityTypes = ['수영장', '주차장', '에어컨', '와이파이', '애견동반가능', '세탁기', '건조기', '전자레인지', '취사시설', '음향시설', '제빙기', '숯불바베큐', '전기그릴', '가스그릴', '정수기', '스타일러', '공기청정기', '빔프로젝터', '비데', '키즈놀이시설', '젖병소독기', '유아의자', '자쿠지']

  // 클라이언트 마운트 완료 후 localStorage 접근
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 페이지 로드 시 저장된 폼 데이터 복원
  useEffect(() => {
    if (isClient) {
      const savedForm = localStorage.getItem(STORAGE_KEY)
      if (savedForm) {
        try {
          const parsedForm = JSON.parse(savedForm)
          // 데이터 무결성 확인
          if (parsedForm && typeof parsedForm === 'object') {
            // selected_host_id는 localStorage에서 복원하지 않음 (캐시된 잘못된 값 방지)
            const { selected_host_id, ...restForm } = parsedForm
            setForm(prev => ({
              ...prev,
              ...restForm,
              accommodation_types: Array.isArray(parsedForm.accommodation_types) ? parsedForm.accommodation_types : [],
              keywords: Array.isArray(parsedForm.keywords) ? parsedForm.keywords : [],
              selected_host_id: '' // 항상 빈 값으로 시작
            }))
            setHasSavedData(true)
          }
        } catch (error) {
          console.error('저장된 폼 데이터 복원 실패:', error)
          localStorage.removeItem(STORAGE_KEY) // 잘못된 데이터 삭제
        }
      }
    }
  }, [isClient])

  // 임시 저장 데이터 초기화
  const clearSavedData = () => {
    if (isClient) {
      localStorage.removeItem(STORAGE_KEY)
      setHasSavedData(false)
      // 폼을 초기 상태로 리셋
      setForm({
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
        selected_host_id: ''
      })
      setImages([])
      setMainImageIndex(0)
      setAmenities([])
      setOptionProducts([])
      setNewKeyword('')
    }
  }


  // 호스트 데이터 가져오기
  const fetchHosts = async () => {
    try {
      console.log('호스트 데이터 가져오기 시작...')
      
      
      const { data, error } = await supabase
        .from('hosts')
        .select('id, representative_name, phone')
        .order('representative_name')
      
      if (error) {
        console.error('호스트 데이터 가져오기 실패:', error)
        // 에러가 있어도 빈 배열로 설정
        setHosts([])
        return
      }
      
      console.log('호스트 데이터 로드됨:', data)
      setHosts(data || [])
      
      // 호스트가 없으면 경고
      if (!data || data.length === 0) {
        console.warn('호스트 데이터가 없습니다. /admin/hosts/add 에서 호스트를 먼저 등록하세요.')
      }
    } catch (error) {
      console.error('호스트 데이터 가져오기 에러:', error)
      setHosts([])
    }
  }

  useEffect(() => {
    fetchHosts()
  }, [])

  // 폼 데이터 변경 시 자동 저장 (selected_host_id 제외)
  useEffect(() => {
    if (isClient) {
      const timeoutId = setTimeout(() => {
        const { selected_host_id, ...formToSave } = form
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formToSave))
      }, 1000) // 1초 후 저장
      
      return () => clearTimeout(timeoutId)
    }
  }, [form, isClient])

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

      console.log('선택된 호스트 ID:', form.selected_host_id, 'typeof:', typeof form.selected_host_id)

      // 1. 이미지 업로드 (Supabase Storage) - 재시도 로직 포함
      const imageUrls: string[] = []
      
      // 이미지 업로드 재시도 함수
      const uploadImageWithRetry = async (file: File, fileName: string, maxRetries = 3) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`이미지 업로드 시도 ${attempt}/${maxRetries}: ${fileName}`)
            
            // 30초 타임아웃 설정
            const uploadPromise = supabase.storage
              .from('accommodation-images')
              .upload(fileName, file)
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('업로드 타임아웃 (30초)')), 30000)
            )
            
            const { data: uploadData, error: uploadError } = await Promise.race([
              uploadPromise,
              timeoutPromise
            ]) as any
            
            if (uploadError) {
              throw uploadError
            }
            
            // 성공시 공개 URL 생성
            const { data: urlData } = supabase.storage
              .from('accommodation-images')
              .getPublicUrl(fileName)
              
            console.log(`이미지 업로드 성공: ${fileName}`)
            return urlData.publicUrl
            
          } catch (error: any) {
            console.error(`업로드 시도 ${attempt} 실패:`, error)
            
            if (attempt === maxRetries) {
              throw new Error(`이미지 업로드 실패 (${maxRetries}회 시도 후): ${error.message}`)
            }
            
            // 재시도 전 대기 (점진적 증가: 2초, 4초, 6초)
            await new Promise(resolve => setTimeout(resolve, attempt * 2000))
          }
        }
      }
      
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const file = images[i]
          const timestamp = Date.now()
          const randomId = Math.random().toString(36).substring(2, 8)
          // 파일 확장자만 추출
          const fileExtension = file.name.split('.').pop() || 'jpg'
          // 안전한 파일명 생성 (타임스탬프 + 랜덤ID + 확장자)
          const fileName = `accommodation_${timestamp}_${randomId}.${fileExtension}`
          
          try {
            const publicUrl = await uploadImageWithRetry(file, fileName)
            imageUrls.push(publicUrl)
          } catch (error: any) {
            console.error('최종 이미지 업로드 실패:', error)
            alert(`이미지 업로드 실패: ${file.name}\n${error.message}\n\n다시 시도하시거나 이미지 크기를 줄여보세요.`)
            setLoading(false)
            return
          }
        }
      }

      // 2. 숙소 정보 등록 (accommodations 테이블)
      const { data: accommodation, error: accommodationError } = await supabase
        .from('accommodations')
        .insert([{
          name: form.name,
          description: form.description,
          accommodation_type: (() => {
            // 허용된 타입들
            const allowedTypes = ['풀빌라', '독채', '펜션']
            // 선택된 타입 중 허용된 것 찾기
            const validType = form.accommodation_types.find(type => allowedTypes.includes(type))
            return validType || '펜션'
          })(),
          accommodation_types: form.accommodation_types,
          keywords: [...form.keywords, ...form.accommodation_types],
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
          status: 'draft',
          is_featured: form.is_featured,
          is_new_open: form.is_new_open,
          host_id: form.selected_host_id,
          extra_options: optionProducts,
          images: imageUrls
        }])
        .select()
        .single()

      if (accommodationError) throw accommodationError

      // 3. 숙소 유형 정보 저장 (accommodation_types 테이블)
      if (form.accommodation_types && form.accommodation_types.length > 0) {
        const typeData = form.accommodation_types.map((typeName: string) => ({
          accommodation_id: accommodation.id,
          type_name: typeName
        }))

        const { error: typeError } = await supabase
          .from('accommodation_types')
          .insert(typeData)

        if (typeError) {
          console.error('숙소 유형 저장 실패:', typeError)
          // 숙소 유형 저장 실패해도 계속 진행
        }
      }

      // 4. 편의시설 정보 저장 (accommodation_amenities 테이블)
      if (amenities && amenities.length > 0) {
        const amenityData = amenities.map(amenity => ({
          accommodation_id: accommodation.id,
          amenity_type: amenity.type,
          amenity_name: amenity.name,
          is_available: amenity.available
        }))

        const { error: amenityError } = await supabase
          .from('accommodation_amenities')
          .insert(amenityData)

        if (amenityError) {
          console.error('편의시설 저장 실패:', amenityError)
          // 편의시설 저장 실패해도 숙소 등록은 성공으로 처리
        }
      }

      // 호스트 계정 생성은 실제로는 별도 테이블에서 관리해야 함
      // 여기서는 간단히 성공 메시지만 표시

      // 성공 시 저장된 임시 데이터 삭제
      if (isClient) {
        localStorage.removeItem(STORAGE_KEY)
      }
      
      alert('숙소가 성공적으로 등록되었습니다!')
      router.push('/admin/accommodations')

    } catch (error) {
      console.error('숙소 등록 실패:', error)
      alert('숙소 등록에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files)
      setImages(prev => {
        const combinedImages = [...prev, ...newImages]
        return combinedImages
      })
      
      // 첫 번째 업로드일 때만 대표 사진 인덱스 설정
      if (images.length === 0 && newImages.length > 0) {
        setMainImageIndex(0)
      }
    }
    
    // 파일 입력 초기화 (같은 파일 재선택 가능하도록)
    if (e.target) {
      e.target.value = ''
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    
    // 대표 사진 인덱스 조정
    if (mainImageIndex >= newImages.length) {
      setMainImageIndex(Math.max(0, newImages.length - 1))
    } else if (mainImageIndex === index && newImages.length > 0) {
      setMainImageIndex(0)
    }
  }

  const setAsMainImage = (index: number) => {
    setMainImageIndex(index)
  }

  const addKeyword = () => {
    if (newKeyword && !form.keywords.includes(newKeyword)) {
      if (form.keywords.length >= 5) {
        alert('키워드는 최대 5개까지 추가 가능합니다.')
        return
      }
      setForm(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword]
      }))
      setNewKeyword('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setForm(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }))
  }

  const addAmenity = () => {
    if (newAmenity.type && newAmenity.name) {
      setAmenities([...amenities, { ...newAmenity, available: true }])
      setNewAmenity({ type: '', name: '' })
    }
  }

  const removeAmenity = (index: number) => {
    setAmenities(amenities.filter((_, i) => i !== index))
  }

  const addOptionProduct = () => {
    if (newOption.name && newOption.price > 0) {
      setOptionProducts([...optionProducts, { ...newOption }])
      setNewOption({ name: '', price: 0 })
    }
  }

  const removeOptionProduct = (index: number) => {
    setOptionProducts(optionProducts.filter((_, i) => i !== index))
  }

  return (
    <div className="admin-page container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold text-gray-900">새 숙소 등록</h1>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={clearSavedData}
            className="text-red-600 hover:text-red-700"
          >
            폼 초기화
          </Button>
        </div>
        <p className="text-gray-600">새로운 숙소를 등록하고 호스트 정보를 설정하세요</p>
        
        {/* 디버그 정보 */}
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <strong>디버그:</strong> 호스트 수: {hosts.length}, 선택된 호스트: "{form.selected_host_id}" ({typeof form.selected_host_id})
          {hosts.length > 0 && (
            <div>사용 가능한 호스트: {hosts.map(h => `${h.representative_name}(${h.id})`).join(', ')}</div>
          )}
        </div>
        
        {isClient && hasSavedData && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
            이전에 작성하던 데이터가 복원되었습니다. 새로 시작하려면 '폼 초기화'를 클릭하세요.
          </div>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>스테이 정보</CardTitle>
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
                      <Label htmlFor={type} className="text-sm">{type}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="description">숙소 설명</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
              />
            </div>

            {/* 위치 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="region">지역 *</Label>
                <Select onValueChange={(value) => setForm({ ...form, region: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="지역 선택" />
                  </SelectTrigger>
                  <SelectContent className="!bg-white !border !border-gray-200 !shadow-lg">
                    {regions.map(region => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="city">시군구 *</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                  placeholder="예: 강남구, 제주시"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">주소 *</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
                placeholder="기본 주소를 입력해주세요"
              />
            </div>

            <div>
              <Label htmlFor="detailed_address">상세주소</Label>
              <Input
                id="detailed_address"
                value={form.detailed_address}
                onChange={(e) => setForm({ ...form, detailed_address: e.target.value })}
                placeholder="상세 주소를 입력해주세요"
              />
            </div>

            {/* 호스트 선택 */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">호스트 선택</h3>
              <div>
                <Label htmlFor="selected_host_id">등록된 호스트 선택 *</Label>
                <Select value={form.selected_host_id} onValueChange={(value) => setForm({ ...form, selected_host_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="호스트 선택" />
                  </SelectTrigger>
                  <SelectContent className="!bg-white !border !border-gray-200 !shadow-lg">
                    {hosts.length === 0 ? (
                      <SelectItem value="no-hosts" disabled>
                        호스트 데이터가 없습니다
                      </SelectItem>
                    ) : (
                      hosts.map((host) => (
                        <SelectItem key={host.id} value={host.id}>
                          {host.representative_name} - {host.phone}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">호스트가 없다면 호스트 관리 메뉴에서 먼저 등록해주세요.</p>
              </div>
            </div>

            {/* 기본 시설 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="base_capacity">기준 인원 *</Label>
                <Input
                  id="base_capacity"
                  type="number"
                  min="1"
                  value={form.base_capacity}
                  onChange={(e) => setForm({ ...form, base_capacity: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="max_capacity">최대 인원 *</Label>
                <Input
                  id="max_capacity"
                  type="number"
                  min="1"
                  value={form.max_capacity}
                  onChange={(e) => setForm({ ...form, max_capacity: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="bedrooms">침실 수</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="0"
                  value={form.bedrooms}
                  onChange={(e) => setForm({ ...form, bedrooms: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label htmlFor="bathrooms">욕실 수</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="0"
                  value={form.bathrooms}
                  onChange={(e) => setForm({ ...form, bathrooms: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            {/* 가격 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="base_price">기준 가격 (원) *</Label>
                <Input
                  id="base_price"
                  type="number"
                  min="0"
                  value={form.base_price}
                  onChange={(e) => setForm({ ...form, base_price: parseInt(e.target.value) || 0 })}
                  required
                  placeholder="기준 인원 기준 1박 요금"
                />
              </div>
              <div>
                <Label htmlFor="extra_person_fee">인원 추가 비용 (원)</Label>
                <Input
                  id="extra_person_fee"
                  type="number"
                  min="0"
                  value={form.extra_person_fee}
                  onChange={(e) => setForm({ ...form, extra_person_fee: parseInt(e.target.value) || 0 })}
                  placeholder="1인당 추가 요금"
                />
              </div>
            </div>

            {/* 체크인/체크아웃 시간 */}
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

            {/* 이미지 업로드 */}
            <div>
              <Label htmlFor="images">스테이 이미지</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label htmlFor="images" className="cursor-pointer flex flex-col items-center">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">클릭하여 이미지 선택 (여러 장 가능)</p>
                </label>
                {images.length > 0 && (
                  <p className="mt-2 text-sm text-gray-600">{images.length}개 파일 선택됨</p>
                )}
              </div>
              
              {/* 이미지 미리보기 및 대표 사진 선택 */}
              {images.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">업로드된 이미지 ({images.length}장)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`미리보기 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          
                          {/* 대표 사진 표시 */}
                          {mainImageIndex === index && (
                            <div className="absolute top-1 left-1 bg-yellow-500 text-white px-2 py-1 text-xs rounded flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current" />
                              대표
                            </div>
                          )}
                          
                          {/* 액션 버튼들 */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            {mainImageIndex !== index && (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => setAsMainImage(index)}
                                className="text-xs h-7"
                              >
                                <Star className="w-3 h-3 mr-1" />
                                대표로
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => removeImage(index)}
                              className="h-7 w-7 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-1 text-center truncate">
                          {image.name}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    * 이미지에 마우스를 올리면 대표 사진 설정 및 삭제 버튼이 나타납니다.
                  </p>
                </div>
              )}
            </div>

            {/* 키워드 */}
            <div>
              <Label>키워드 ({form.keywords.length}/5개)</Label>
              <p className="text-sm text-gray-500 mb-2">숙소의 특징을 나타내는 키워드를 최대 5개까지 입력해주세요</p>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="키워드 입력 (예: 바다뷰, 커플여행)"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                />
                <Button type="button" onClick={addKeyword} disabled={form.keywords.length >= 5}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.keywords.map(keyword => (
                  <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                    {keyword}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => removeKeyword(keyword)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* 편의시설 */}
            <div>
              <Label>편의시설 (중복 선택 가능)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
                {amenityTypes.map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`amenity-${type}`}
                      checked={amenities.some(a => a.type === type)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setAmenities(prev => [...prev, { type, name: type, available: true }])
                        } else {
                          setAmenities(prev => prev.filter(a => a.type !== type))
                        }
                      }}
                    />
                    <Label htmlFor={`amenity-${type}`} className="text-sm cursor-pointer">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
              
              {/* 선택된 편의시설 표시 */}
              {amenities.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">선택된 편의시설</h4>
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((amenity, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {amenity.type}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => removeAmenity(index)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 옵션 상품 */}
            <div>
              <Label>옵션 상품</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="옵션 상품명"
                  value={newOption.name}
                  onChange={(e) => setNewOption({ ...newOption, name: e.target.value })}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="가격"
                  value={newOption.price || ''}
                  onChange={(e) => setNewOption({ ...newOption, price: parseInt(e.target.value) || 0 })}
                  className="flex-1"
                  min="0"
                />
                <Button type="button" onClick={addOptionProduct}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {optionProducts.map((option, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <span className="text-sm flex-1">{option.name}</span>
                    <span className="text-sm font-medium">{option.price.toLocaleString()}원</span>
                    <X 
                      className="w-4 h-4 cursor-pointer text-red-500" 
                      onClick={() => removeOptionProduct(index)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 추천 숙소 및 신규 오픈 여부 */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_featured"
                  checked={form.is_featured}
                  onCheckedChange={(checked) => setForm({ ...form, is_featured: checked as boolean })}
                />
                <Label htmlFor="is_featured">추천 숙소로 설정</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_new_open"
                  checked={form.is_new_open}
                  onCheckedChange={(checked) => setForm({ ...form, is_new_open: checked as boolean })}
                />
                <Label htmlFor="is_new_open">신규 오픈 숙소로 설정</Label>
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? '등록 중...' : '숙소 등록'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                취소
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}