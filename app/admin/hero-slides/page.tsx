'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { SingleImageUpload } from '@/components/ui/single-image-upload'
import { apiFetch } from '@/lib/auth-helpers'
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
  image_url: string
  headline: string
  subheadline: string
  description?: string
  cta_text: string
  cta_link: string
  is_active: boolean
  sort_order: number
  created_at: string
}

export default function AdminHeroSlidesPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [error, setError] = useState('')
  const [newSlide, setNewSlide] = useState({
    headline: '',
    subheadline: '',
    description: '',
    image_url: '',
    cta_text: '지금 예약하기',
    cta_link: '/booking',
    is_active: true
  })

  useEffect(() => {
    loadSlides()
  }, [])

  const loadSlides = async () => {
    try {
      setLoading(true)
      const response = await apiFetch('/api/admin/hero-slides')
      if (response.ok) {
        setSlides(response.data || [])
      } else {
        setError('슬라이드 로드에 실패했습니다.')
      }
    } catch (error) {
      console.error('슬라이드 로드 실패:', error)
      setError('슬라이드 로드 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const addSlide = async () => {
    if (!newSlide.headline || !newSlide.image_url) {
      alert('제목과 이미지는 필수입니다.')
      return
    }

    try {
      setLoading(true)
      const response = await apiFetch('/api/admin/hero-slides', {
        method: 'POST',
        body: JSON.stringify({
          ...newSlide,
          sort_order: slides.length
        })
      })

      if (response.ok) {
        await loadSlides()
        setNewSlide({
          headline: '',
          subheadline: '',
          description: '',
          image_url: '',
          cta_text: '지금 예약하기',
          cta_link: '/booking',
          is_active: true
        })
        setShowAddDialog(false)
      } else {
        alert(response.error || '슬라이드 추가에 실패했습니다.')
      }
    } catch (error) {
      console.error('슬라이드 추가 실패:', error)
      alert('슬라이드 추가 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const updateSlide = async (updatedSlide: HeroSlide) => {
    try {
      setLoading(true)
      const response = await apiFetch(`/api/admin/hero-slides/${updatedSlide.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedSlide)
      })

      if (response.ok) {
        await loadSlides()
        setEditingSlide(null)
      } else {
        alert(response.error || '슬라이드 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('슬라이드 수정 실패:', error)
      alert('슬라이드 수정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const deleteSlide = async (id: string) => {
    if (!confirm('이 슬라이드를 삭제하시겠습니까?')) return

    try {
      setLoading(true)
      const response = await apiFetch(`/api/admin/hero-slides/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadSlides()
      } else {
        alert(response.error || '슬라이드 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('슬라이드 삭제 실패:', error)
      alert('슬라이드 삭제 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const toggleSlideActive = async (id: string) => {
    const slide = slides.find(s => s.id === id)
    if (!slide) return

    await updateSlide({ ...slide, is_active: !slide.is_active })
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

      {/* 오류 메시지 */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-red-800">
            {error}
          </CardContent>
        </Card>
      )}

      {/* 슬라이드 목록 */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>로딩 중...</p>
            </CardContent>
          </Card>
        ) : slides.length === 0 ? (
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
            <Card key={slide.id} className={`${!slide.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  {/* 슬라이드 이미지 */}
                  <div className="w-32 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {slide.image_url ? (
                      <img 
                        src={slide.image_url} 
                        alt={slide.headline}
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
                          <h3 className="text-lg font-semibold text-gray-900">{slide.headline}</h3>
                          <Badge 
                            className={`text-xs ${slide.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                          >
                            {slide.is_active ? '활성' : '비활성'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{slide.subheadline}</p>
                        {slide.description && (
                          <p className="text-xs text-gray-500 mb-1">{slide.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mb-3">CTA: {slide.cta_text} → {slide.cta_link}</p>
                        <p className="text-xs text-gray-400">순서: {slide.sort_order}</p>
                      </div>

                      {/* 컨트롤 버튼들 */}
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingSlide(slide)}
                          className="h-8 w-8 p-0"
                          disabled={loading}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleSlideActive(slide.id)}
                          className="h-8 w-8 p-0"
                          disabled={loading}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteSlide(slide.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          disabled={loading}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
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
            <DialogDescription>
              메인 페이지에 표시될 새로운 히어로 슬라이드를 추가합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="headline">제목 *</Label>
                <Input
                  id="headline"
                  value={newSlide.headline}
                  onChange={(e) => setNewSlide({...newSlide, headline: e.target.value})}
                  placeholder="슬라이드 제목"
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor="subheadline">부제목</Label>
                <Input
                  id="subheadline"
                  value={newSlide.subheadline}
                  onChange={(e) => setNewSlide({...newSlide, subheadline: e.target.value})}
                  placeholder="슬라이드 부제목"
                  autoComplete="off"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={newSlide.description}
                onChange={(e) => setNewSlide({...newSlide, description: e.target.value})}
                placeholder="슬라이드 설명 텍스트"
                rows={3}
              />
            </div>

            <SingleImageUpload
              value={newSlide.image_url}
              onChange={(url) => setNewSlide({...newSlide, image_url: url})}
              onError={(error) => alert(error)}
              label="이미지 *"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cta_text">CTA 버튼 텍스트</Label>
                <Input
                  id="cta_text"
                  value={newSlide.cta_text}
                  onChange={(e) => setNewSlide({...newSlide, cta_text: e.target.value})}
                  placeholder="지금 예약하기"
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor="cta_link">CTA 링크</Label>
                <Input
                  id="cta_link"
                  value={newSlide.cta_link}
                  onChange={(e) => setNewSlide({...newSlide, cta_link: e.target.value})}
                  placeholder="/booking"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={loading}>
                취소
              </Button>
              <Button onClick={addSlide} className="bg-green-600 hover:bg-green-700" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? '추가 중...' : '슬라이드 추가'}
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
              <DialogDescription>
                선택한 히어로 슬라이드의 내용을 수정합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-headline">제목 *</Label>
                  <Input
                    id="edit-headline"
                    value={editingSlide.headline}
                    onChange={(e) => setEditingSlide({...editingSlide, headline: e.target.value})}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-subheadline">부제목</Label>
                  <Input
                    id="edit-subheadline"
                    value={editingSlide.subheadline}
                    onChange={(e) => setEditingSlide({...editingSlide, subheadline: e.target.value})}
                    autoComplete="off"
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
                />
              </div>

              <SingleImageUpload
                value={editingSlide.image_url}
                onChange={(url) => setEditingSlide({...editingSlide, image_url: url})}
                onError={(error) => alert(error)}
                label="이미지 *"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-cta-text">CTA 버튼 텍스트</Label>
                  <Input
                    id="edit-cta-text"
                    value={editingSlide.cta_text}
                    onChange={(e) => setEditingSlide({...editingSlide, cta_text: e.target.value})}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-cta-link">CTA 링크</Label>
                  <Input
                    id="edit-cta-link"
                    value={editingSlide.cta_link}
                    onChange={(e) => setEditingSlide({...editingSlide, cta_link: e.target.value})}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingSlide(null)} disabled={loading}>
                  취소
                </Button>
                <Button onClick={() => updateSlide(editingSlide)} className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? '저장 중...' : '저장'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}