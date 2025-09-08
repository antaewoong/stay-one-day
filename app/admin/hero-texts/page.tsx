'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  ArrowUp, 
  ArrowDown,
  Type,
  MessageSquare
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface HeroText {
  id: string
  english_phrase?: string
  main_text: string
  sub_text?: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function HeroTextsManagementPage() {
  const [heroTexts, setHeroTexts] = useState<HeroText[]>([])
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingText, setEditingText] = useState<HeroText | null>(null)
  
  const [form, setForm] = useState({
    english_phrase: '',
    main_text: '',
    sub_text: '',
    display_order: 0,
    is_active: true
  })

  const supabase = createClient()

  useEffect(() => {
    loadHeroTexts()
  }, [])

  const loadHeroTexts = async () => {
    try {
      const response = await fetch('/api/admin/hero-texts')
      if (!response.ok) throw new Error('Failed to fetch hero texts')
      
      const result = await response.json()
      setHeroTexts(result.data || [])
    } catch (error) {
      console.error('히어로 텍스트 로드 실패:', error)
    }
  }

  const saveHeroText = async () => {
    try {
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || process.env.NEXT_PUBLIC_ADMIN_PASSWORD
      
      const url = editingText ? '/api/admin/hero-texts' : '/api/admin/hero-texts'
      const method = editingText ? 'PUT' : 'POST'
      const body = editingText ? 
        { id: editingText.id, ...form } : 
        { ...form, display_order: heroTexts.length + 1 }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      await loadHeroTexts()
      resetForm()
      setShowDialog(false)
    } catch (error) {
      console.error('히어로 텍스트 저장 실패:', error)
      alert('히어로 텍스트 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const deleteHeroText = async (id: string) => {
    if (!confirm('이 히어로 텍스트를 삭제하시겠습니까?')) return
    
    try {
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || process.env.NEXT_PUBLIC_ADMIN_PASSWORD
      
      const response = await fetch(`/api/admin/hero-texts?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      await loadHeroTexts()
    } catch (error) {
      console.error('히어로 텍스트 삭제 실패:', error)
      alert('히어로 텍스트 삭제에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const moveText = async (id: string, direction: 'up' | 'down') => {
    const textIndex = heroTexts.findIndex(text => text.id === id)
    if (textIndex === -1) return

    const targetIndex = direction === 'up' ? textIndex - 1 : textIndex + 1
    if (targetIndex < 0 || targetIndex >= heroTexts.length) return

    const newTexts = [...heroTexts]
    ;[newTexts[textIndex], newTexts[targetIndex]] = [newTexts[targetIndex], newTexts[textIndex]]
    
    // display_order 업데이트
    newTexts.forEach((text, index) => {
      text.display_order = index + 1
    })

    try {
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || process.env.NEXT_PUBLIC_ADMIN_PASSWORD

      // 순서가 변경된 두 항목만 업데이트
      await Promise.all([
        fetch('/api/admin/hero-texts', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            id: newTexts[textIndex].id,
            english_phrase: newTexts[textIndex].english_phrase,
            main_text: newTexts[textIndex].main_text,
            sub_text: newTexts[textIndex].sub_text,
            display_order: newTexts[textIndex].display_order,
            is_active: newTexts[textIndex].is_active
          })
        }),
        fetch('/api/admin/hero-texts', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            id: newTexts[targetIndex].id,
            english_phrase: newTexts[targetIndex].english_phrase,
            main_text: newTexts[targetIndex].main_text,
            sub_text: newTexts[targetIndex].sub_text,
            display_order: newTexts[targetIndex].display_order,
            is_active: newTexts[targetIndex].is_active
          })
        })
      ])

      await loadHeroTexts()
    } catch (error) {
      console.error('순서 변경 실패:', error)
      alert('순서 변경에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm({
      english_phrase: '',
      main_text: '',
      sub_text: '',
      display_order: 0,
      is_active: true
    })
    setEditingText(null)
  }

  const openDialog = (text?: HeroText) => {
    if (text) {
      setEditingText(text)
      setForm({
        english_phrase: text.english_phrase || '',
        main_text: text.main_text,
        sub_text: text.sub_text || '',
        display_order: text.display_order,
        is_active: text.is_active
      })
    } else {
      resetForm()
    }
    setShowDialog(true)
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">히어로 텍스트 관리</h1>
          <p className="text-gray-600 mt-1">메인 페이지 히어로 섹션의 감성 문구와 서브 텍스트를 관리합니다</p>
        </div>
        <Button onClick={() => openDialog()} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          텍스트 추가
        </Button>
      </div>

      {/* 텍스트 목록 */}
      <div className="space-y-4">
        {heroTexts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Type className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 히어로 텍스트가 없습니다</h3>
              <p className="text-gray-500 mb-4">첫 번째 감성 문구를 등록해보세요!</p>
              <Button onClick={() => openDialog()} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                텍스트 추가
              </Button>
            </CardContent>
          </Card>
        ) : (
          heroTexts.map((text, index) => (
            <Card key={text.id} className={`${!text.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Type className="w-6 h-6 text-purple-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={text.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {text.is_active ? '활성' : '비활성'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          순서: {text.display_order}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveText(text.id, 'up')}
                          disabled={index === 0 || loading}
                          className="h-8 w-8 p-0"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveText(text.id, 'down')}
                          disabled={index === heroTexts.length - 1 || loading}
                          className="h-8 w-8 p-0"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDialog(text)}
                          disabled={loading}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteHeroText(text.id)}
                          disabled={loading}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {text.english_phrase && (
                      <p className="text-sm font-medium text-purple-600 mb-1 italic">
                        {text.english_phrase}
                      </p>
                    )}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{text.main_text}</h3>
                    {text.sub_text && (
                      <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {text.sub_text}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      생성: {new Date(text.created_at).toLocaleString('ko-KR')}
                      {text.updated_at !== text.created_at && (
                        <> · 수정: {new Date(text.updated_at).toLocaleString('ko-KR')}</>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 추가/편집 다이얼로그 */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>
              {editingText ? '히어로 텍스트 편집' : '새 히어로 텍스트 추가'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="english_phrase">영문 감성 문구</Label>
              <Input
                id="english_phrase"
                value={form.english_phrase}
                onChange={(e) => setForm({...form, english_phrase: e.target.value})}
                placeholder="Escape the Ordinary"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="main_text">메인 텍스트 (한글 감성 문구) *</Label>
              <Input
                id="main_text"
                value={form.main_text}
                onChange={(e) => setForm({...form, main_text: e.target.value})}
                placeholder="일상에서 벗어나, 특별한 공간에서"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="sub_text">서브 텍스트 (할인/이벤트 정보)</Label>
              <Textarea
                id="sub_text"
                value={form.sub_text}
                onChange={(e) => setForm({...form, sub_text: e.target.value})}
                placeholder="첫 예약 시 10% 할인 혜택"
                rows={2}
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm({...form, is_active: checked})}
                />
                <Label htmlFor="is_active">활성화</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                취소
              </Button>
              <Button 
                onClick={saveHeroText} 
                disabled={loading || !form.main_text}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingText ? '수정' : '추가'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}