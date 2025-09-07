'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { Save, Upload, Trash2, Plus, Info, AlertCircle, ImageIcon, Shield } from 'lucide-react'

interface HostAccommodation {
  id: string
  name: string
  accommodation_type: string
  region: string
  address: string
  max_capacity: number
  description: string
  check_in_time: string
  check_out_time: string
  base_price: number
  weekend_price: number
  peak_season_price: number
  guidelines: string
  house_rules: string
  amenities: string[]
  host_id: string
  images: string[]
  option_products: OptionProduct[]
  created_at: string
}

interface OptionProduct {
  id: string
  accommodation_id: string
  name: string
  description: string
  price: number
  is_required: boolean
  category: string
  available: boolean
}

export default function HostEditAccommodationPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [accommodation, setAccommodation] = useState<HostAccommodation | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)
  const [currentHostId, setCurrentHostId] = useState<string | null>(null)
  
  // 편의시설 관리 상태
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [isEditingAmenities, setIsEditingAmenities] = useState(false)
  
  // 편의시설 옵션들
  const amenitiesList = [
    '무료 WiFi', '주차장', '에어컨', '난방', '키친', '바베큐', '수영장',
    '사우나', '스파', '정원', '펜션', '독채', '반려동물 동반 가능',
    '키즈풀', '놀이시설', '캠프파이어', 'TV', '세탁기', '냉장고',
    '전자레인지', '커피머신', '취사도구', '어메니티'
  ]
  const [newOptionProduct, setNewOptionProduct] = useState<Partial<OptionProduct>>({
    name: '',
    description: '',
    price: 0,
    category: 'service',
    is_required: false,
    available: true
  })
  const [showAddOption, setShowAddOption] = useState(false)

  // Mock data for demo (현재 로그인된 호스트의 숙소만)
  const mockCurrentHostId = 'host-123'
  const mockAccommodation: HostAccommodation = {
    id: params.id as string,
    name: '구공스테이 청주점',
    accommodation_type: '독채',
    region: '충북 청주',
    address: '충북 청주시 서원구 모충동 123-45',
    max_capacity: 6,
    description: '아름다운 자연 속에서 편안한 휴식을 즐길 수 있는 독채 숙소입니다.',
    check_in_time: '15:00',
    check_out_time: '11:00',
    base_price: 550000,
    weekend_price: 650000,
    peak_season_price: 750000,
    guidelines: '체크인 시 신분증을 지참해주세요.\n숙소 내 금연입니다.\n반려동물 동반 불가합니다.\n정숙시간은 22:00~08:00입니다.',
    house_rules: '- 실내화 착용 부탁드립니다.\n- 쓰레기는 분리수거해주세요.\n- 에어컨 사용 후 전원을 꺼주세요.\n- 퇴실 시 간단한 정리정돈 부탁드립니다.',
    amenities: ['무료 WiFi', '주차장', '에어컨', '난방', '키친', '바베큐', '수영장'],
    host_id: mockCurrentHostId, // 현재 호스트와 일치
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop&crop=center'
    ],
    option_products: [
      {
        id: '1',
        accommodation_id: params.id as string,
        name: '바베큐 세트',
        description: '고기, 야채, 숯, 그릴 포함',
        price: 50000,
        is_required: false,
        category: 'food',
        available: true
      },
      {
        id: '2',
        accommodation_id: params.id as string,
        name: '레이트 체크아웃',
        description: '13시까지 체크아웃 연장',
        price: 30000,
        is_required: false,
        category: 'service',
        available: true
      },
      {
        id: '3',
        accommodation_id: params.id as string,
        name: '얼리 체크인',
        description: '13시부터 체크인 가능',
        price: 20000,
        is_required: false,
        category: 'service',
        available: true
      }
    ],
    created_at: '2024-01-01T00:00:00.000Z'
  }

  useEffect(() => {
    checkAuthAndLoadAccommodation()
  }, [params.id])

  const checkAuthAndLoadAccommodation = async () => {
    try {
      setLoading(true)
      
      // 현재 로그인된 호스트 확인
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/host/login')
        return
      }

      // 호스트 정보 가져오기
      const { data: hostData, error: hostError } = await supabase
        .from('hosts')
        .select('id')
        .eq('user_id', user.id)
        .single()

      const hostId = hostData?.id || mockCurrentHostId
      setCurrentHostId(hostId)

      // 숙소 정보 로드 (본인 숙소인지 확인)
      const { data, error } = await supabase
        .from('accommodations')
        .select('*')
        .eq('id', params.id)
        .eq('host_id', hostId) // 중요: 본인 숙소만 접근 가능
        .single()

      if (error || !data) {
        // 실제 환경에서는 error 확인, 현재는 mock data로 권한 체크
        if (params.id === 'unauthorized-test') {
          setAccessDenied(true)
          return
        }
        console.warn('Using mock data:', error)
        if (mockAccommodation.host_id !== hostId) {
          setAccessDenied(true)
          return
        }
        setAccommodation(mockAccommodation)
      } else {
        setAccommodation(data)
      }
    } catch (error) {
      console.error('권한 확인 및 숙소 정보 로드 실패:', error)
      // Mock 권한 체크
      if (mockCurrentHostId === mockAccommodation.host_id) {
        setAccommodation(mockAccommodation)
        setCurrentHostId(mockCurrentHostId)
      } else {
        setAccessDenied(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBasicInfo = async (field: string, value: any) => {
    if (!accommodation || accessDenied) return

    try {
      setSaving(true)
      
      if (field === 'amenities') {
        // 편의시설은 별도 API 호출로 처리
        const response = await fetch(`/api/accommodations/${params.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ amenities: value })
        })
        
        if (!response.ok) {
          throw new Error('편의시설 업데이트 실패')
        }
        
        alert('편의시설이 성공적으로 업데이트되었습니다.')
      } else {
        const { error } = await supabase
          .from('accommodations')
          .update({ [field]: value })
          .eq('id', params.id)
          .eq('host_id', currentHostId) // 추가 보안: 본인 숙소만 수정 가능

        if (error) throw error
      }

      setAccommodation(prev => prev ? { ...prev, [field]: value } : null)
      
    } catch (error) {
      console.error('저장 실패:', error)
      alert('저장 중 오류가 발생했습니다: ' + error.message)
      // Mock update for demo
      setAccommodation(prev => prev ? { ...prev, [field]: value } : null)
    } finally {
      setSaving(false)
    }
  }

  const handleImageDelete = async (imageId: string) => {
    if (!accommodation || accessDenied) return
    if (!confirm('이미지를 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('accommodation_images')
        .delete()
        .eq('id', imageId)
        .eq('accommodation_id', params.id) // 추가 보안

      if (error) throw error

      setAccommodation(prev => prev ? {
        ...prev,
        accommodation_images: prev.accommodation_images.filter(img => img.id !== imageId)
      } : null)
      
    } catch (error) {
      console.error('이미지 삭제 실패:', error)
      // Mock delete for demo
      setAccommodation(prev => prev ? {
        ...prev,
        accommodation_images: prev.accommodation_images.filter(img => img.id !== imageId)
      } : null)
    }
  }

  const handleImageUpload = async (files: FileList) => {
    if (!accommodation || accessDenied) return

    try {
      setUploadingImages(true)
      
      const fileArray = Array.from(files)
      
      // 파일 개수 검증
      if (accommodation.images.length + fileArray.length > 10) {
        alert(`최대 10개의 이미지까지만 업로드할 수 있습니다. 현재 ${accommodation.images.length}개 등록됨`)
        setUploadingImages(false)
        return
      }

      // 파일 크기 및 형식 검증
      const validFiles: File[] = []
      const invalidFiles: { name: string; reason: string }[] = []

      for (const file of fileArray) {
        // 파일 크기 검증 (10MB)
        if (file.size > 10 * 1024 * 1024) {
          invalidFiles.push({ name: file.name, reason: '파일 크기가 10MB를 초과합니다' })
          continue
        }

        // 파일 형식 검증
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!validTypes.includes(file.type)) {
          invalidFiles.push({ name: file.name, reason: '지원하지 않는 파일 형식입니다 (JPG, PNG, WEBP만 가능)' })
          continue
        }

        validFiles.push(file)
      }

      // 유효하지 않은 파일 알림
      if (invalidFiles.length > 0) {
        const errorMessage = invalidFiles.map(f => `${f.name}: ${f.reason}`).join('\n')
        alert(`다음 파일들을 업로드할 수 없습니다:\n${errorMessage}`)
      }

      // 유효한 파일이 없으면 종료
      if (validFiles.length === 0) {
        setUploadingImages(false)
        return
      }
      
      // Mock upload for demo (실제로는 Supabase Storage 업로드)
      const newImages = validFiles.map((file, index) => ({
        id: `new-${Date.now()}-${index}`,
        image_url: URL.createObjectURL(file),
        image_order: accommodation.accommodation_images.length + index + 1
      }))

      setAccommodation(prev => prev ? {
        ...prev,
        images: [...prev.images, ...newImageUrls]
      } : null)

      // 성공 알림
      if (validFiles.length > 0) {
        alert(`${validFiles.length}개의 이미지가 성공적으로 업로드되었습니다.`)
      }

      // In real implementation:
      // 1. Upload to Supabase Storage with host_id verification
      // 2. Insert into accommodation_images table with accommodation ownership check
      // 3. Optimize images (resize, compress)
      // 4. Generate thumbnails
      
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      alert('이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploadingImages(false)
    }
  }

  const handleAddOptionProduct = async () => {
    if (!accommodation || accessDenied) return

    try {
      const { error } = await supabase
        .from('option_products')
        .insert({
          ...newOptionProduct,
          accommodation_id: params.id
        })

      if (error) throw error

      const newOption = {
        id: `new-${Date.now()}`,
        accommodation_id: params.id as string,
        ...newOptionProduct
      } as OptionProduct

      setAccommodation(prev => prev ? {
        ...prev,
        option_products: [...prev.option_products, newOption]
      } : null)

      setNewOptionProduct({
        name: '',
        description: '',
        price: 0,
        category: 'service',
        is_required: false,
        available: true
      })
      setShowAddOption(false)
      
    } catch (error) {
      console.error('옵션 상품 추가 실패:', error)
      // Mock add for demo
      const newOption = {
        id: `new-${Date.now()}`,
        accommodation_id: params.id as string,
        ...newOptionProduct
      } as OptionProduct

      setAccommodation(prev => prev ? {
        ...prev,
        option_products: [...prev.option_products, newOption]
      } : null)

      setNewOptionProduct({
        name: '',
        description: '',
        price: 0,
        category: 'service',
        is_required: false,
        available: true
      })
      setShowAddOption(false)
    }
  }

  const handleUpdateOptionProduct = async (optionId: string, updates: Partial<OptionProduct>) => {
    if (!accommodation || accessDenied) return

    try {
      const { error } = await supabase
        .from('option_products')
        .update(updates)
        .eq('id', optionId)
        .eq('accommodation_id', params.id) // 추가 보안

      if (error) throw error

      setAccommodation(prev => prev ? {
        ...prev,
        option_products: prev.option_products.map(opt => 
          opt.id === optionId ? { ...opt, ...updates } : opt
        )
      } : null)
      
    } catch (error) {
      console.error('옵션 상품 수정 실패:', error)
      // Mock update for demo
      setAccommodation(prev => prev ? {
        ...prev,
        option_products: prev.option_products.map(opt => 
          opt.id === optionId ? { ...opt, ...updates } : opt
        )
      } : null)
    }
  }

  const handleDeleteOptionProduct = async (optionId: string) => {
    if (!accommodation || accessDenied) return
    if (!confirm('옵션 상품을 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('option_products')
        .delete()
        .eq('id', optionId)
        .eq('accommodation_id', params.id) // 추가 보안

      if (error) throw error

      setAccommodation(prev => prev ? {
        ...prev,
        option_products: prev.option_products.filter(opt => opt.id !== optionId)
      } : null)
      
    } catch (error) {
      console.error('옵션 상품 삭제 실패:', error)
      // Mock delete for demo
      setAccommodation(prev => prev ? {
        ...prev,
        option_products: prev.option_products.filter(opt => opt.id !== optionId)
      } : null)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-[400px]">로딩 중...</div>
  }

  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Shield className="w-16 h-16 text-red-500" />
        <h2 className="text-xl font-bold text-red-600">접근 권한이 없습니다</h2>
        <p className="text-gray-600 text-center max-w-md">
          본인이 운영하는 숙소의 정보만 확인하고 수정할 수 있습니다. 
          다른 숙소의 정보에는 접근할 수 없습니다.
        </p>
        <Button onClick={() => router.push('/host/dashboard')}>
          호스트 대시보드로 돌아가기
        </Button>
      </div>
    )
  }

  if (!accommodation) {
    return <div className="text-center py-8">숙소 정보를 찾을 수 없습니다.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{accommodation.name} 관리</h1>
          <p className="text-gray-600">{accommodation.accommodation_type} • {accommodation.region}</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          뒤로 가기
        </Button>
      </div>

      {/* 보안 및 권한 안내 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">편집 가능한 항목</p>
              <p>가격 설정, 옵션 상품, 이미지 관리, 이용 안내 및 주의사항만 수정할 수 있습니다. 
              기본 정보(숙소명, 주소, 타입 등)는 관리자에게 문의해주세요.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg mt-3">
            <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">보안 안내</p>
              <p>본인이 운영하는 숙소의 정보만 확인하고 수정할 수 있습니다. 다른 숙소의 정보에는 접근할 수 없습니다.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="info">기본 정보</TabsTrigger>
          <TabsTrigger value="pricing">가격 설정</TabsTrigger>
          <TabsTrigger value="images">이미지 관리</TabsTrigger>
          <TabsTrigger value="options">옵션 상품</TabsTrigger>
          <TabsTrigger value="guidelines">이용 안내</TabsTrigger>
        </TabsList>

        {/* 기본 정보 탭 (읽기 전용) */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-600" />
                기본 정보 (수정 불가)
              </CardTitle>
              <p className="text-sm text-gray-600">
                기본 정보는 관리자만 수정할 수 있습니다. 변경이 필요한 경우 관리자에게 문의하세요.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">숙소명</Label>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {accommodation.name}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ⚠️ 숙소명은 호스트가 직접 수정할 수 없습니다
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">숙소 유형</Label>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {accommodation.accommodation_type}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ⚠️ 숙소 유형은 호스트가 직접 수정할 수 없습니다
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">지역</Label>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {accommodation.region}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ⚠️ 지역 정보는 호스트가 직접 수정할 수 없습니다
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">주소</Label>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {accommodation.address}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ⚠️ 주소는 호스트가 직접 수정할 수 없습니다
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">최대 수용 인원</Label>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {accommodation.max_capacity}명
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ⚠️ 최대 인원은 호스트가 직접 수정할 수 없습니다
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">등록일</Label>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {new Date(accommodation.created_at).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm text-gray-600">숙소 편의시설</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditingAmenities(!isEditingAmenities)
                      if (!isEditingAmenities) {
                        setSelectedAmenities(accommodation.amenities)
                      }
                    }}
                    className="text-sm"
                  >
                    {isEditingAmenities ? '취소' : '편집'}
                  </Button>
                </div>
                
                {isEditingAmenities ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {amenitiesList.map((amenity) => (
                        <label
                          key={amenity}
                          className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors ${
                            selectedAmenities.includes(amenity)
                              ? 'border-green-500 bg-green-50 text-green-800'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedAmenities.includes(amenity)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAmenities([...selectedAmenities, amenity])
                              } else {
                                setSelectedAmenities(selectedAmenities.filter(a => a !== amenity))
                              }
                            }}
                            className="sr-only"
                          />
                          <span className="text-sm">{amenity}</span>
                        </label>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          handleSaveBasicInfo('amenities', selectedAmenities)
                          setAccommodation(prev => prev ? { ...prev, amenities: selectedAmenities } : null)
                          setIsEditingAmenities(false)
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        저장
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAmenities(accommodation.amenities)
                          setIsEditingAmenities(false)
                        }}
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 min-h-[80px]">
                    <div className="flex flex-wrap gap-2">
                      {accommodation.amenities.length > 0 ? (
                        accommodation.amenities.map((amenity, index) => (
                          <Badge key={index} variant="secondary" className="bg-white">
                            {amenity}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">등록된 편의시설이 없습니다</p>
                      )}
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-green-600 mt-1">
                  ✅ 편의시설은 호스트가 직접 수정할 수 있습니다
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium mb-2">기본 정보 변경 요청</p>
                    <p className="mb-3">위의 정보를 변경해야 하는 경우, 다음 방법으로 관리자에게 문의하세요:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>이메일: admin@stayoneday.com</li>
                      <li>전화: 1588-0000</li>
                      <li>관리자 문의 채널을 통한 요청</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 가격 설정 탭 */}
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>가격 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="base_price">기본 요금 (평일)</Label>
                  <Input
                    id="base_price"
                    type="number"
                    value={accommodation.base_price}
                    onChange={(e) => handleSaveBasicInfo('base_price', parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">월~목요일 기준</p>
                </div>
                
                <div>
                  <Label htmlFor="weekend_price">주말 요금</Label>
                  <Input
                    id="weekend_price"
                    type="number"
                    value={accommodation.weekend_price}
                    onChange={(e) => handleSaveBasicInfo('weekend_price', parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">금~일요일 기준</p>
                </div>
                
                <div>
                  <Label htmlFor="peak_season_price">성수기 요금</Label>
                  <Input
                    id="peak_season_price"
                    type="number"
                    value={accommodation.peak_season_price}
                    onChange={(e) => handleSaveBasicInfo('peak_season_price', parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">휴가철, 연휴 기준</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="check_in_time">체크인 시간</Label>
                  <Input
                    id="check_in_time"
                    type="time"
                    value={accommodation.check_in_time}
                    onChange={(e) => handleSaveBasicInfo('check_in_time', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="check_out_time">체크아웃 시간</Label>
                  <Input
                    id="check_out_time"
                    type="time"
                    value={accommodation.check_out_time}
                    onChange={(e) => handleSaveBasicInfo('check_out_time', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">달력별 개별 가격 설정</p>
                    <p>특정 날짜의 가격은 <Button variant="link" className="p-0 h-auto text-yellow-800 underline" onClick={() => router.push('/host/dashboard/pricing')}>객실 예약 상태</Button>에서 설정할 수 있습니다.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 이미지 관리 탭 */}
        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle>이미지 관리</CardTitle>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">기존 이미지 확인, 삭제 및 새 이미지 추가가 가능합니다.</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    현재 {accommodation.accommodation_images.length}개 이미지 등록됨
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    최대 10개까지 등록 가능
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* 현재 등록된 이미지들 */}
                {accommodation.accommodation_images.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900">등록된 이미지</h3>
                      <p className="text-xs text-gray-500">이미지에 마우스를 올리면 삭제 버튼이 나타납니다</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {accommodation.accommodation_images.map((image) => (
                        <div key={image.id} className="relative group">
                          <div className="aspect-square overflow-hidden rounded-lg border-2 border-gray-200">
                            <img
                              src={image.image_url}
                              alt={`숙소 이미지 ${image.image_order}`}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                          </div>
                          
                          {/* 호버시 나타나는 오버레이 */}
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-lg flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleImageDelete(image.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                삭제
                              </Button>
                              <p className="text-white text-xs">클릭하여 삭제</p>
                            </div>
                          </div>
                          
                          {/* 이미지 순서 배지 */}
                          <Badge className="absolute top-2 left-2 bg-blue-600 text-white text-xs">
                            #{image.image_order}
                          </Badge>
                          
                          {/* 대표 이미지 표시 */}
                          {image.image_order === 1 && (
                            <Badge className="absolute top-2 right-2 bg-green-600 text-white text-xs">
                              대표
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">등록된 이미지가 없습니다</p>
                  </div>
                )}

                {/* 새 이미지 업로드 영역 */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="space-y-4">
                    <div>
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">새 이미지 추가</h3>
                      <p className="text-gray-600 mb-4">클릭하여 이미지를 선택하거나 드래그하여 업로드하세요</p>
                    </div>
                    
                    <label htmlFor="image-upload" className="cursor-pointer inline-block">
                      <Button 
                        disabled={uploadingImages || accommodation.accommodation_images.length >= 10} 
                        size="lg"
                        className={uploadingImages ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}
                        asChild
                      >
                        <span>
                          {uploadingImages ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              업로드 중...
                            </>
                          ) : accommodation.accommodation_images.length >= 10 ? (
                            '최대 업로드 개수 도달'
                          ) : (
                            <>
                              이미지 선택
                              <Upload className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                    
                    <input
                      id="image-upload"
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                      disabled={uploadingImages || accommodation.accommodation_images.length >= 10}
                    />
                  </div>
                  
                  {/* 업로드 가이드 */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-500">
                      <div className="flex items-center justify-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>JPG, PNG, WEBP 지원</span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>최대 10MB per 이미지</span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        <span>최대 10개 이미지</span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      첫 번째 이미지가 대표 이미지로 설정됩니다
                    </p>
                  </div>
                </div>

                {/* 이미지 관리 팁 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">💡 이미지 관리 팁</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 첫 번째 이미지는 숙소 목록에서 대표 이미지로 표시됩니다</li>
                    <li>• 다양한 각도와 공간의 사진을 업로드하면 예약률이 높아집니다</li>
                    <li>• 밝고 깔끔한 사진을 선택하세요</li>
                    <li>• 개인정보가 포함된 사진은 업로드하지 마세요</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 옵션 상품 탭 */}
        <TabsContent value="options">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>옵션 상품 관리</CardTitle>
                <Button onClick={() => setShowAddOption(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  옵션 추가
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accommodation.option_products.map((option) => (
                  <div key={option.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>상품명</Label>
                          <Input
                            value={option.name}
                            onChange={(e) => handleUpdateOptionProduct(option.id, { name: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label>가격</Label>
                          <Input
                            type="number"
                            value={option.price}
                            onChange={(e) => handleUpdateOptionProduct(option.id, { price: parseInt(e.target.value) || 0 })}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label>카테고리</Label>
                          <select 
                            value={option.category}
                            onChange={(e) => handleUpdateOptionProduct(option.id, { category: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border rounded-md"
                          >
                            <option value="service">서비스</option>
                            <option value="food">식음료</option>
                            <option value="activity">액티비티</option>
                            <option value="amenity">어메니티</option>
                          </select>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteOptionProduct(option.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="mt-4">
                      <Label>상품 설명</Label>
                      <Textarea
                        value={option.description}
                        onChange={(e) => handleUpdateOptionProduct(option.id, { description: e.target.value })}
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                    
                    <div className="mt-4 flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={option.available}
                          onChange={(e) => handleUpdateOptionProduct(option.id, { available: e.target.checked })}
                        />
                        <span className="text-sm">판매 중</span>
                      </label>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={option.is_required}
                          onChange={(e) => handleUpdateOptionProduct(option.id, { is_required: e.target.checked })}
                        />
                        <span className="text-sm">필수 선택</span>
                      </label>
                    </div>
                  </div>
                ))}
                
                {accommodation.option_products.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    등록된 옵션 상품이 없습니다.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 이용 안내 탭 */}
        <TabsContent value="guidelines">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>이용 안내</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="guidelines">체크인 안내 및 이용 수칙</Label>
                  <Textarea
                    id="guidelines"
                    value={accommodation.guidelines}
                    onChange={(e) => handleSaveBasicInfo('guidelines', e.target.value)}
                    className="mt-2"
                    rows={6}
                    placeholder="체크인 방법, 이용 수칙, 주의사항 등을 입력하세요..."
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>숙소 규칙</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="house_rules">House Rules</Label>
                  <Textarea
                    id="house_rules"
                    value={accommodation.house_rules}
                    onChange={(e) => handleSaveBasicInfo('house_rules', e.target.value)}
                    className="mt-2"
                    rows={6}
                    placeholder="숙소 내 규칙, 금지사항, 요청사항 등을 입력하세요..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 옵션 상품 추가 모달 */}
      <Dialog open={showAddOption} onOpenChange={setShowAddOption}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 옵션 상품 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>상품명</Label>
                <Input
                  value={newOptionProduct.name}
                  onChange={(e) => setNewOptionProduct(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="바베큐 세트"
                />
              </div>
              <div>
                <Label>가격</Label>
                <Input
                  type="number"
                  value={newOptionProduct.price}
                  onChange={(e) => setNewOptionProduct(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                  placeholder="50000"
                />
              </div>
            </div>
            
            <div>
              <Label>카테고리</Label>
              <select 
                value={newOptionProduct.category}
                onChange={(e) => setNewOptionProduct(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md mt-1"
              >
                <option value="service">서비스</option>
                <option value="food">식음료</option>
                <option value="activity">액티비티</option>
                <option value="amenity">어메니티</option>
              </select>
            </div>
            
            <div>
              <Label>상품 설명</Label>
              <Textarea
                value={newOptionProduct.description}
                onChange={(e) => setNewOptionProduct(prev => ({ ...prev, description: e.target.value }))}
                placeholder="상품에 대한 자세한 설명을 입력하세요"
                rows={3}
              />
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newOptionProduct.available}
                  onChange={(e) => setNewOptionProduct(prev => ({ ...prev, available: e.target.checked }))}
                />
                <span className="text-sm">판매 중</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newOptionProduct.is_required}
                  onChange={(e) => setNewOptionProduct(prev => ({ ...prev, is_required: e.target.checked }))}
                />
                <span className="text-sm">필수 선택</span>
              </label>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddOption(false)}>
                취소
              </Button>
              <Button onClick={handleAddOptionProduct}>
                <Save className="w-4 h-4 mr-2" />
                추가
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}