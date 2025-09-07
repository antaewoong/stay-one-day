'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Save, 
  Eye, 
  ArrowUp, 
  ArrowDown,
  Image as ImageIcon,
  Monitor
} from 'lucide-react'

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

export default function AdminHeroSlidesPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
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

  useEffect(() => {
    loadSlides()
  }, [])

  const loadSlides = () => {
    try {
      const savedSlides = localStorage.getItem('adminHeroSlides')
      if (savedSlides) {
        const parsedSlides = JSON.parse(savedSlides)
        setSlides(parsedSlides.map((slide: any, index: number) => ({
          ...slide,
          id: slide.id || `slide-${index}`,
          order: slide.order || index,
          active: slide.active !== false
        })))
      }
    } catch (error) {
      console.error('슬라이드 로드 실패:', error)
    }
  }

  const saveSlides = (newSlides: HeroSlide[]) => {
    try {
      localStorage.setItem('adminHeroSlides', JSON.stringify(newSlides))
      setSlides(newSlides)
    } catch (error) {
      console.error('슬라이드 저장 실패:', error)
      alert('슬라이드 저장에 실패했습니다.')
    }
  }

  const addSlide = () => {
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
      order: slides.length,
      active: true
    }

    saveSlides([...slides, slide])
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

  const updateSlide = (updatedSlide: HeroSlide) => {
    const updatedSlides = slides.map(slide => 
      slide.id === updatedSlide.id ? updatedSlide : slide
    )
    saveSlides(updatedSlides)
    setEditingSlide(null)
  }

  const deleteSlide = (id: string) => {
    if (confirm('이 슬라이드를 삭제하시겠습니까?')) {
      const updatedSlides = slides.filter(slide => slide.id !== id)
      saveSlides(updatedSlides)
    }
  }

  const moveSlide = (id: string, direction: 'up' | 'down') => {
    const slideIndex = slides.findIndex(slide => slide.id === id)
    if (slideIndex === -1) return

    const newSlides = [...slides]
    const targetIndex = direction === 'up' ? slideIndex - 1 : slideIndex + 1

    if (targetIndex >= 0 && targetIndex < slides.length) {
      [newSlides[slideIndex], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[slideIndex]]
      newSlides.forEach((slide, index) => { slide.order = index })
      saveSlides(newSlides)
    }
  }

  const toggleSlideActive = (id: string) => {
    const updatedSlides = slides.map(slide => 
      slide.id === id ? { ...slide, active: !slide.active } : slide
    )
    saveSlides(updatedSlides)
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">메인 페이지 히어로 슬라이드 관리</h1>
          <p className="text-gray-600 mt-1">메인 페이지 상단에 표시되는 슬라이드를 관리합니다</p>
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
          <Button onClick={() => setShowAddDialog(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            슬라이드 추가
          </Button>
        </div>
      </div>

      {/* 슬라이드 목록 */}
      <div className="space-y-4">
        {slides.length === 0 ? (
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
          slides.map((slide, index) => (
            <Card key={slide.id} className={`${!slide.active ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  {/* 슬라이드 이미지 */}
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

                  {/* 슬라이드 정보 */}
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
                          <span>평점: {slide.stats.avgRating}</span>
                          <span>예약: {slide.stats.bookings}</span>
                          <span>가격: {slide.stats.price}</span>
                        </div>
                      </div>

                      {/* 컨트롤 버튼들 */}
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveSlide(slide.id, 'up')}
                            disabled={index === 0}
                            className="h-8 w-8 p-0"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveSlide(slide.id, 'down')}
                            disabled={index === slides.length - 1}
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
                            onClick={() => toggleSlideActive(slide.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteSlide(slide.id)}
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
      </div>

      {/* 슬라이드 추가 다이얼로그 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>새 히어로 슬라이드 추가</DialogTitle>
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
              <Input
                id="image"
                value={newSlide.image || ''}
                onChange={(e) => setNewSlide({...newSlide, image: e.target.value})}
                placeholder="https://example.com/image.jpg"
              />
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

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="rating">평점</Label>
                <Input
                  id="rating"
                  value={newSlide.stats?.avgRating || ''}
                  onChange={(e) => setNewSlide({...newSlide, stats: {...newSlide.stats, avgRating: e.target.value}})}
                  placeholder="4.8"
                />
              </div>
              <div>
                <Label htmlFor="bookings">예약 수</Label>
                <Input
                  id="bookings"
                  value={newSlide.stats?.bookings || ''}
                  onChange={(e) => setNewSlide({...newSlide, stats: {...newSlide.stats, bookings: e.target.value}})}
                  placeholder="100+"
                />
              </div>
              <div>
                <Label htmlFor="price">가격</Label>
                <Input
                  id="price"
                  value={newSlide.stats?.price || ''}
                  onChange={(e) => setNewSlide({...newSlide, stats: {...newSlide.stats, price: e.target.value}})}
                  placeholder="150,000원"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                취소
              </Button>
              <Button onClick={addSlide} className="bg-green-600 hover:bg-green-700">
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>슬라이드 편집</DialogTitle>
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
                  value={editingSlide.description}
                  onChange={(e) => setEditingSlide({...editingSlide, description: e.target.value})}
                  rows={3}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-cta">CTA 버튼 텍스트</Label>
                  <Input
                    id="edit-cta"
                    value={editingSlide.cta}
                    onChange={(e) => setEditingSlide({...editingSlide, cta: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-badge">배지 텍스트</Label>
                  <Input
                    id="edit-badge"
                    value={editingSlide.badge}
                    onChange={(e) => setEditingSlide({...editingSlide, badge: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingSlide(null)}>
                  취소
                </Button>
                <Button onClick={() => updateSlide(editingSlide)} className="bg-blue-600 hover:bg-blue-700">
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