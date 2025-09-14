'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Eye, 
  ArrowUp, 
  ArrowDown,
  Image as ImageIcon,
  Monitor,
  Star,
  Award,
  Zap,
  Shield,
  Building2,
  Upload,
  Heart,
  Music,
  Sparkles
} from 'lucide-react'
import { apiFetch } from '@/lib/auth-helpers'
import { createClient } from '@/lib/supabase/client'

interface HeroSlide {
  id: string
  title: string
  subtitle: string
  description: string
  image: string
  cta: string
  badge: string
  stats: {
    avgRating?: string
    bookings?: string
    price?: string
  }
  order: number
  active: boolean
}

interface SectionConfig {
  id: string
  name: string
  title: string
  subtitle?: string
  accommodationIds: string[]
  maxItems: number
  active: boolean
  autoFillByCategory?: boolean
  categoryFilter?: string
}

interface Accommodation {
  id: string
  name: string
  accommodation_type: string
  region: string
  base_price: number
  images: string[]
  is_featured: boolean
}

export default function MainPageManagementPage() {
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([])
  const [sections, setSections] = useState<SectionConfig[]>([])
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('hero')
  
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [editingSection, setEditingSection] = useState<SectionConfig | null>(null)
  
  const [newSlide, setNewSlide] = useState<Partial<HeroSlide>>({
    title: '',
    subtitle: '',
    description: '',
    image: '',
    cta: '지금 예약하기',
    badge: '추천',
    stats: { avgRating: '4.8', bookings: '100+', price: '150,000원' },
    active: true
  })

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await Promise.all([
      loadHeroSlides(),
      loadSections(),
      loadAccommodations()
    ])
  }

  const loadHeroSlides = async () => {
    try {
      const result = await apiFetch('/api/admin/hero-slides')
      const data = result.data || []

      setHeroSlides(data.map((slide: any) => ({
        id: slide.id,
        title: slide.title,
        subtitle: slide.subtitle,
        description: slide.description,
        image: slide.image_url,
        cta: slide.cta_text,
        badge: slide.badge,
        stats: slide.stats,
        order: slide.slide_order,
        active: slide.active
      })))
    } catch (error) {
      console.error('히어로 슬라이드 로드 실패:', error)
    }
  }

  const loadSections = async () => {
    try {
      const result = await apiFetch('/api/admin/sections')
      const data = result.data || []

      setSections(data.map((section: any) => ({
        id: section.section_id,
        name: section.name,
        title: section.title,
        subtitle: section.subtitle,
        accommodationIds: section.accommodation_ids || [],
        maxItems: section.max_items,
        active: section.active,
        autoFillByCategory: section.auto_fill_by_category,
        categoryFilter: section.category_filter
      })))
    } catch (error) {
      console.error('섹션 로드 실패:', error)
    }
  }

  const loadAccommodations = async () => {
    try {
      const response = await fetch('/api/accommodations?limit=1000')
      if (response.ok) {
        const result = await response.json()
        setAccommodations(result.data || [])
      }
    } catch (error) {
      console.error('숙소 목록 로드 실패:', error)
    }
  }

  const saveHeroSlides = async (newSlides: HeroSlide[]) => {
    try {
      setLoading(true)

      // 안전한 데이터 검증 및 전송
      const slidesToInsert = newSlides.map((slide, index) => {
        // 필수 필드 검증: image_url이 반드시 있어야 함
        const imageUrl = slide.image || slide.image_url || ''
        if (!imageUrl.trim()) {
          throw new Error(`슬라이드 ${index + 1}번: 이미지가 필수입니다. 이미지를 업로드해주세요.`)
        }

        return {
          title: slide.title || '',
          subtitle: slide.subtitle || '',
          description: slide.description || '',
          image_url: imageUrl,  // 반드시 값이 있음이 보장됨
          cta_text: slide.cta || '',
          badge: slide.badge || '',
          stats: slide.stats || {},
          slide_order: index,
          active: slide.active ?? true
        }
      })

      console.log('🔄 히어로 슬라이드 저장:', slidesToInsert.length, '개')

      const result = await apiFetch('/api/admin/hero-slides', {
        method: 'PUT',
        body: JSON.stringify(slidesToInsert)
      })

      if (!result.ok) {
        throw new Error(result.error || '저장에 실패했습니다.')
      }
      
      setHeroSlides(newSlides)
      await loadHeroSlides() // 다시 로드해서 동기화
    } catch (error) {
      console.error('히어로 슬라이드 저장 실패:', error)
      alert('히어로 슬라이드 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const saveSections = async (newSections: SectionConfig[]) => {
    try {
      setLoading(true)
      
      await apiFetch('/api/admin/sections', {
        method: 'PUT',
        body: JSON.stringify(newSections)
      })
      
      console.log('섹션 저장 성공')
    } catch (error) {
      console.error('섹션 저장 실패:', error)
      alert('섹션 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const addHeroSlide = () => {
    if (!newSlide.title || !newSlide.image) {
      alert('제목과 이미지는 필수입니다.')
      return
    }

    const slide: HeroSlide = {
      id: `slide-${Date.now()}`,
      title: newSlide.title!,
      subtitle: newSlide.subtitle || '',
      description: newSlide.description || '',
      image: newSlide.image!,
      cta: newSlide.cta || '지금 예약하기',
      badge: newSlide.badge || '추천',
      stats: newSlide.stats || { avgRating: '4.8', bookings: '100+', price: '150,000원' },
      order: heroSlides.length,
      active: true
    }

    saveHeroSlides([...heroSlides, slide])
    setNewSlide({
      title: '',
      subtitle: '',
      description: '',
      image: '',
      cta: '지금 예약하기',
      badge: '추천',
      stats: { avgRating: '4.8', bookings: '100+', price: '150,000원' },
      active: true
    })
    setShowAddDialog(false)
  }

  const deleteHeroSlide = (id: string) => {
    if (confirm('이 슬라이드를 삭제하시겠습니까?')) {
      const updatedSlides = heroSlides.filter(slide => slide.id !== id)
      saveHeroSlides(updatedSlides)
    }
  }

  const moveHeroSlide = (id: string, direction: 'up' | 'down') => {
    const slideIndex = heroSlides.findIndex(slide => slide.id === id)
    if (slideIndex === -1) return

    const newSlides = [...heroSlides]
    const targetIndex = direction === 'up' ? slideIndex - 1 : slideIndex + 1

    if (targetIndex >= 0 && targetIndex < heroSlides.length) {
      [newSlides[slideIndex], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[slideIndex]]
      newSlides.forEach((slide, index) => { slide.order = index })
      saveHeroSlides(newSlides)
    }
  }

  const updateSection = (sectionId: string, updates: Partial<SectionConfig>) => {
    const updatedSections = sections.map(section => 
      section.id === sectionId ? { ...section, ...updates } : section
    )
    setSections(updatedSections)
    saveSections(updatedSections)
  }

  const addAccommodationToSection = (sectionId: string, accommodationId: string) => {
    const section = sections.find(s => s.id === sectionId)
    if (!section) return

    if (section.accommodationIds.includes(accommodationId)) {
      alert('이미 추가된 숙소입니다.')
      return
    }

    if (section.accommodationIds.length >= section.maxItems) {
      alert(`최대 ${section.maxItems}개까지만 추가할 수 있습니다.`)
      return
    }

    // 로컬 상태만 업데이트 (저장은 저장 버튼으로)
    const updatedSections = sections.map(s => 
      s.id === sectionId 
        ? { ...s, accommodationIds: [...s.accommodationIds, accommodationId] }
        : s
    )
    setSections(updatedSections)
    console.log('숙소 추가됨 (로컬 상태만)')
  }

  const removeAccommodationFromSection = (sectionId: string, accommodationId: string) => {
    const section = sections.find(s => s.id === sectionId)
    if (!section) return

    // 로컬 상태만 업데이트 (저장은 저장 버튼으로)
    const updatedSections = sections.map(s => 
      s.id === sectionId 
        ? { ...s, accommodationIds: s.accommodationIds.filter(id => id !== accommodationId) }
        : s
    )
    setSections(updatedSections)
    console.log('숙소 제거됨 (로컬 상태만)')
  }

  const getAccommodationById = (id: string) => {
    return accommodations.find(acc => acc.id === id)
  }

  const getSectionIcon = (sectionId: string) => {
    switch (sectionId) {
      case 'recommended': return <Award className="w-4 h-4" />
      case 'poolvilla': return <Zap className="w-4 h-4" />
      case 'private': return <Shield className="w-4 h-4" />
      case 'kids': return <Heart className="w-4 h-4" />
      case 'party': return <Music className="w-4 h-4" />
      case 'new': return <Sparkles className="w-4 h-4" />
      default: return <Building2 className="w-4 h-4" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">메인 페이지 관리</h1>
          <p className="text-gray-600 mt-1">메인 페이지의 모든 섹션을 관리합니다</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => window.open('/', '_blank')}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Monitor className="w-4 h-4 mr-2" />
            미리보기
          </Button>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="hero">히어로 슬라이드</TabsTrigger>
          <TabsTrigger value="recommended">추천 스테이</TabsTrigger>
          <TabsTrigger value="poolvilla">풀빌라</TabsTrigger>
          <TabsTrigger value="private">독채</TabsTrigger>
          <TabsTrigger value="kids">키즈</TabsTrigger>
          <TabsTrigger value="party">파티</TabsTrigger>
          <TabsTrigger value="new">신규</TabsTrigger>
        </TabsList>

        {/* 히어로 슬라이드 탭 */}
        <TabsContent value="hero" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">히어로 슬라이드 관리</h3>
            <div className="flex gap-2">
              <Button onClick={() => document.getElementById('bulk-upload')?.click()} className="bg-blue-600 hover:bg-blue-700">
                <Upload className="w-4 h-4 mr-2" />
                이미지 일괄 업로드 (최대 10개)
              </Button>
              <Button onClick={() => setShowAddDialog(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                개별 추가
              </Button>
            </div>
            <input
              id="bulk-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.target.files || [])
                if (files.length === 0) return
                
                if (files.length > 10) {
                  alert('최대 10개까지만 업로드할 수 있습니다.')
                  return
                }

                try {
                  setLoading(true)
                  const uploadedSlides = []

                  for (let index = 0; index < files.length; index++) {
                    const file = files[index]
                    const fileExt = file.name.split('.').pop()
                    const fileName = `hero_${Date.now()}_${index}.${fileExt}`
                    
                    const { data, error } = await supabase.storage
                      .from('accommodation-images')
                      .upload(fileName, file)

                    if (error) throw error

                    const imageUrl = `https://fcmauibvdqbocwhloqov.supabase.co/storage/v1/object/public/accommodation-images/${fileName}`
                    
                    const slide = {
                      id: `slide-${Date.now()}-${index}`,
                      title: `슬라이드 ${heroSlides.length + index + 1}`,
                      subtitle: '특별한 스테이',
                      description: '편안하고 아름다운 공간에서 특별한 시간을 보내세요',
                      image: imageUrl,
                      cta: '지금 예약하기',
                      badge: '추천',
                      stats: { avgRating: '4.8', bookings: '100+', price: '150,000원' },
                      order: heroSlides.length + index,
                      active: true
                    }
                    uploadedSlides.push(slide)
                  }

                  saveHeroSlides([...heroSlides, ...uploadedSlides])
                  alert(`${files.length}개의 슬라이드가 추가되었습니다!`)
                } catch (error) {
                  console.error('일괄 업로드 실패:', error)
                  alert('이미지 업로드에 실패했습니다.')
                } finally {
                  setLoading(false)
                  e.target.value = '' // 파일 입력 초기화
                }
              }}
            />
          </div>

          {heroSlides.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 슬라이드가 없습니다</h3>
                <p className="text-gray-500 mb-4">첫 번째 히어로 슬라이드를 등록해보세요!</p>
                <Button onClick={() => setShowAddDialog(true)} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  슬라이드 추가
                </Button>
              </CardContent>
            </Card>
          ) : (
            heroSlides.map((slide, index) => (
              <Card key={slide.id} className={`${!slide.active ? 'opacity-60' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="w-32 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {slide.image ? (
                        <img 
                          src={slide.image} 
                          alt={slide.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{slide.title}</h3>
                            <Badge 
                              className={`text-xs ${slide.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                            >
                              {slide.active ? '활성' : '비활성'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">{slide.badge}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{slide.subtitle}</p>
                          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{slide.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>평점: {slide.stats?.avgRating || '4.8'}</span>
                            <span>예약: {slide.stats?.bookings || '100+'}</span>
                            <span>가격: {slide.stats?.price || '150,000원'}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moveHeroSlide(slide.id, 'up')}
                              disabled={index === 0}
                              className="h-8 w-8 p-0"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moveHeroSlide(slide.id, 'down')}
                              disabled={index === heroSlides.length - 1}
                              className="h-8 w-8 p-0"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingSlide(slide)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteHeroSlide(slide.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* 섹션 관리 탭들 */}
        {sections.map(section => (
          <TabsContent key={section.id} value={section.id} className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                {getSectionIcon(section.id)}
                <div>
                  <h3 className="text-lg font-semibold">{section.title}</h3>
                  <p className="text-sm text-gray-600">{section.subtitle}</p>
                </div>
                <Badge className={section.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {section.active ? '활성' : '비활성'}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => saveSections(sections)}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  저장
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateSection(section.id, { active: !section.active })}
                  className={section.active ? 'border-red-200 text-red-700' : 'border-green-200 text-green-700'}
                >
                  {section.active ? '비활성화' : '활성화'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingSection(section)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  편집
                </Button>
              </div>
            </div>

            {/* 현재 선택된 숙소들 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    선택된 숙소 ({section.accommodationIds.length}/{section.maxItems})
                  </CardTitle>
                  {section.accommodationIds.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm('선택된 모든 숙소를 제거하시겠습니까?')) {
                          const updatedSections = sections.map(s => 
                            s.id === section.id 
                              ? { ...s, accommodationIds: [] }
                              : s
                          )
                          setSections(updatedSections)
                        }
                      }}
                      disabled={loading}
                      className="border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      전체 삭제
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {section.accommodationIds.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>선택된 숙소가 없습니다</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {section.accommodationIds.map(accommodationId => {
                      const accommodation = getAccommodationById(accommodationId)
                      if (!accommodation) return null

                      return (
                        <Card key={accommodationId} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                {accommodation.images?.[0] ? (
                                  <img 
                                    src={accommodation.images[0]}
                                    alt={accommodation.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{accommodation.name}</h4>
                                <p className="text-xs text-gray-500">{accommodation.region}</p>
                                <p className="text-xs text-gray-600 mt-1">
                                  ₩{accommodation.base_price.toLocaleString()}
                                </p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => !loading && removeAccommodationFromSection(section.id, accommodationId)}
                                  disabled={loading}
                                  className="h-6 px-2 mt-1 text-red-600 hover:text-red-700 disabled:opacity-50"
                                >
                                  제거
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 숙소 추가 */}
            {section.accommodationIds.length < section.maxItems && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">숙소 추가</CardTitle>
                  {section.id !== 'recommended' && section.id !== 'new' && (
                    <p className="text-xs text-gray-500 mt-1">
                      {section.id === 'poolvilla' && '풀빌라 유형의 숙소만 표시됩니다'}
                      {section.id === 'private' && '독채 유형의 숙소만 표시됩니다'}
                      {section.id === 'kids' && '키즈 유형의 숙소만 표시됩니다'}
                      {section.id === 'party' && '파티 유형의 숙소만 표시됩니다'}
                    </p>
                  )}
                  {section.id === 'recommended' && (
                    <p className="text-xs text-gray-500 mt-1">모든 유형의 숙소를 선택할 수 있습니다</p>
                  )}
                  {section.id === 'new' && (
                    <p className="text-xs text-gray-500 mt-1">모든 유형의 숙소를 선택할 수 있습니다</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {accommodations
                      .filter(acc => {
                        // 이미 선택된 숙소는 제외
                        if (section.accommodationIds.includes(acc.id)) return false
                        
                        // 추천 스테이는 모든 숙소 표시
                        if (section.id === 'recommended') return true
                        
                        // 각 섹션별로 해당 유형의 숙소만 표시
                        const sectionTypeMap = {
                          'poolvilla': '풀빌라',
                          'private': '독채', 
                          'kids': '키즈',
                          'party': '파티',
                          'new': null // 신규는 모든 숙소 표시 가능
                        }
                        
                        const requiredType = sectionTypeMap[section.id]
                        if (!requiredType) return true // 매핑되지 않은 섹션은 모든 숙소 표시
                        
                        // accommodation_types 배열에 해당 유형이 포함되어 있는지 확인
                        return acc.accommodation_types?.includes(requiredType) || 
                               acc.accommodation_type === requiredType
                      })
                      .map(accommodation => (
                        <Card key={accommodation.id} className={`border hover:border-blue-300 cursor-pointer transition-all ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                              onClick={() => !loading && addAccommodationToSection(section.id, accommodation.id)}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                {accommodation.images?.[0] ? (
                                  <img 
                                    src={accommodation.images[0]}
                                    alt={accommodation.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{accommodation.name}</h4>
                                <p className="text-xs text-gray-500">{accommodation.region}</p>
                                <p className="text-xs text-gray-600 mt-1">
                                  ₩{accommodation.base_price.toLocaleString()}
                                </p>
                                <Badge className="text-xs mt-1" variant="outline">
                                  {accommodation.accommodation_type}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* 슬라이드 추가 다이얼로그 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-sm border-white/20">
          <DialogHeader>
            <DialogTitle>새 히어로 슬라이드 추가</DialogTitle>
            <DialogDescription>
              메인 페이지에 표시될 새로운 히어로 슬라이드를 추가합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  value={newSlide.title || ''}
                  onChange={(e) => setNewSlide({...newSlide, title: e.target.value})}
                  placeholder="슬라이드 제목"
                />
              </div>
              <div>
                <Label htmlFor="subtitle">부제목</Label>
                <Input
                  id="subtitle"
                  value={newSlide.subtitle || ''}
                  onChange={(e) => setNewSlide({...newSlide, subtitle: e.target.value})}
                  placeholder="슬라이드 부제목"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={newSlide.description || ''}
                onChange={(e) => setNewSlide({...newSlide, description: e.target.value})}
                placeholder="슬라이드 설명"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="image">이미지 URL *</Label>
              <div className="space-y-2">
                <Input
                  id="image"
                  value={newSlide.image || ''}
                  onChange={(e) => setNewSlide({...newSlide, image: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">또는</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    이미지 업로드
                  </Button>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        try {
                          setLoading(true)
                          const fileExt = file.name.split('.').pop()
                          const fileName = `hero_${Date.now()}.${fileExt}`
                          
                          const { data, error } = await supabase.storage
                            .from('accommodation-images')
                            .upload(fileName, file)

                          if (error) throw error

                          const imageUrl = `https://fcmauibvdqbocwhloqov.supabase.co/storage/v1/object/public/accommodation-images/${fileName}`
                          setNewSlide({...newSlide, image: imageUrl})
                        } catch (error) {
                          console.error('이미지 업로드 실패:', error)
                          alert('이미지 업로드에 실패했습니다.')
                        } finally {
                          setLoading(false)
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cta">CTA 버튼 텍스트</Label>
                <Input
                  id="cta"
                  value={newSlide.cta || ''}
                  onChange={(e) => setNewSlide({...newSlide, cta: e.target.value})}
                  placeholder="지금 예약하기"
                />
              </div>
              <div>
                <Label htmlFor="badge">배지 텍스트</Label>
                <Input
                  id="badge"
                  value={newSlide.badge || ''}
                  onChange={(e) => setNewSlide({...newSlide, badge: e.target.value})}
                  placeholder="추천"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                취소
              </Button>
              <Button onClick={addHeroSlide} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                슬라이드 추가
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 슬라이드 편집 다이얼로그 */}
      {editingSlide && (
        <Dialog open={!!editingSlide} onOpenChange={() => setEditingSlide(null)}>
          <DialogContent className="max-w-2xl bg-white">
            <DialogHeader>
              <DialogTitle>슬라이드 편집</DialogTitle>
              <DialogDescription>
                선택한 히어로 슬라이드의 내용을 수정합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-title">제목 *</Label>
                  <Input
                    id="edit-title"
                    value={editingSlide.title}
                    onChange={(e) => setEditingSlide({...editingSlide, title: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-subtitle">부제목</Label>
                  <Input
                    id="edit-subtitle"
                    value={editingSlide.subtitle}
                    onChange={(e) => setEditingSlide({...editingSlide, subtitle: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description">설명</Label>
                <Textarea
                  id="edit-description"
                  value={editingSlide.description || ''}
                  onChange={(e) => setEditingSlide({...editingSlide, description: e.target.value})}
                  placeholder="슬라이드 설명 텍스트"
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div>
                <Label htmlFor="edit-image">이미지 URL *</Label>
                <Input
                  id="edit-image"
                  value={editingSlide.image}
                  onChange={(e) => setEditingSlide({...editingSlide, image: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingSlide(null)}>
                  취소
                </Button>
                <Button onClick={() => {
                  const updatedSlides = heroSlides.map(slide => 
                    slide.id === editingSlide.id ? editingSlide : slide
                  )
                  saveHeroSlides(updatedSlides)
                  setEditingSlide(null)
                }} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  저장
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 섹션 편집 다이얼로그 */}
      {editingSection && (
        <Dialog open={!!editingSection} onOpenChange={() => setEditingSection(null)}>
          <DialogContent className="max-w-lg bg-white">
            <DialogHeader>
              <DialogTitle>섹션 편집</DialogTitle>
              <DialogDescription>
                메인 페이지 섹션의 설정을 수정합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="section-title">섹션 제목</Label>
                <Input
                  id="section-title"
                  value={editingSection.title}
                  onChange={(e) => setEditingSection({...editingSection, title: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="section-subtitle">섹션 부제목</Label>
                <Input
                  id="section-subtitle"
                  value={editingSection.subtitle || ''}
                  onChange={(e) => setEditingSection({...editingSection, subtitle: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="section-max">최대 표시 개수</Label>
                <Input
                  id="section-max"
                  type="number"
                  min="1"
                  max="20"
                  value={editingSection.maxItems}
                  onChange={(e) => setEditingSection({...editingSection, maxItems: parseInt(e.target.value) || 6})}
                />
              </div>

              {/* 자동 필터링 설정 */}
              <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">자동 필터링 설정</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    editingSection.autoFillByCategory 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {editingSection.autoFillByCategory ? 'ON' : 'OFF'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-fill" className="text-sm font-medium">
                      자동 카테고리 필터링
                    </Label>
                    <p className="text-sm text-gray-500">
                      {editingSection.autoFillByCategory 
                        ? '✅ 카테고리별로 숙소를 자동으로 선별합니다' 
                        : '❌ 수동으로 선택한 숙소들만 표시됩니다'
                      }
                    </p>
                  </div>
                  <Switch
                    id="auto-fill"
                    checked={editingSection.autoFillByCategory || false}
                    onCheckedChange={(checked) => setEditingSection({
                      ...editingSection, 
                      autoFillByCategory: checked,
                      categoryFilter: checked ? editingSection.categoryFilter : null
                    })}
                    className="data-[state=checked]:bg-green-600"
                  />
                </div>

                {editingSection.autoFillByCategory && (
                  <div>
                    <Label htmlFor="category-filter">카테고리 필터</Label>
                    <Select
                      value={editingSection.categoryFilter || ''}
                      onValueChange={(value) => setEditingSection({
                        ...editingSection, 
                        categoryFilter: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="카테고리를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200">
                        <SelectItem value="풀빌라" className="bg-white hover:bg-gray-100">풀빌라</SelectItem>
                        <SelectItem value="독채" className="bg-white hover:bg-gray-100">독채</SelectItem>
                        <SelectItem value="펜션" className="bg-white hover:bg-gray-100">펜션</SelectItem>
                        <SelectItem value="키즈" className="bg-white hover:bg-gray-100">키즈</SelectItem>
                        <SelectItem value="파티" className="bg-white hover:bg-gray-100">파티</SelectItem>
                        <SelectItem value="애견동반" className="bg-white hover:bg-gray-100">애견동반</SelectItem>
                        <SelectItem value="루프탑" className="bg-white hover:bg-gray-100">루프탑</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingSection(null)}>
                  취소
                </Button>
                <Button onClick={() => {
                  updateSection(editingSection.id, editingSection)
                  setEditingSection(null)
                }} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  저장
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}