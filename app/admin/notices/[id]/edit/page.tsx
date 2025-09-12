'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save } from 'lucide-react'
import { adminGet, adminPut } from '@/lib/admin-api'

interface Notice {
  id: string
  title: string
  content: string
  notice_type: string
  target_audience: string
  is_pinned: boolean
  status: string
  created_at: string
}

export default function EditNoticePage() {
  const params = useParams()
  const router = useRouter()
  const [notice, setNotice] = useState<Notice | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isImportant, setIsImportant] = useState(false)
  const [targetAudience, setTargetAudience] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadNotice()
    }
  }, [params.id])

  const loadNotice = async () => {
    try {
      setLoading(true)
      const response = await adminGet(`/api/admin/notices/${params.id}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('공지사항 조회 실패:', errorData.error)
        alert('공지사항을 불러오는데 실패했습니다.')
        router.push('/admin/notices')
        return
      }
      
      const result = await response.json()
      if (result.success) {
        const noticeData = result.data
        setNotice(noticeData)
        setTitle(noticeData.title || '')
        setContent(noticeData.content || '')
        setIsImportant(noticeData.is_pinned || false)
        setTargetAudience(noticeData.target_audience || 'all')
      } else {
        alert('공지사항을 찾을 수 없습니다.')
        router.push('/admin/notices')
      }
    } catch (error) {
      console.error('공지사항 조회 실패:', error)
      alert('공지사항을 불러오는데 실패했습니다.')
      router.push('/admin/notices')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      alert('제목을 입력해주세요.')
      return
    }

    setSaving(true)

    try {
      const response = await adminPut(`/api/admin/notices/${params.id}`, {
        title: title.trim(),
        content: content.trim(),
        is_important: isImportant,
        target_audience: targetAudience
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '공지사항 수정에 실패했습니다.')
      }

      alert('공지사항이 성공적으로 수정되었습니다.')
      router.push(`/admin/notices/${params.id}`)
      
    } catch (error) {
      console.error('공지사항 수정 실패:', error)
      alert(error instanceof Error ? error.message : '공지사항 수정에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">공지사항을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!notice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">공지사항을 찾을 수 없습니다.</p>
          <Button 
            onClick={() => router.push('/admin/notices')}
            className="mt-4"
          >
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push(`/admin/notices/${params.id}`)}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">공지사항 수정</h1>
        </div>

        {/* 수정 폼 */}
        <Card>
          <CardHeader>
            <CardTitle>공지사항 수정</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 제목 */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  제목 *
                </label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="공지사항 제목을 입력하세요"
                  required
                />
              </div>

              {/* 내용 */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  내용
                </label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="공지사항 내용을 입력하세요"
                  rows={10}
                />
              </div>

              {/* 옵션들 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 중요 공지 체크박스 */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="important"
                    checked={isImportant}
                    onCheckedChange={(checked) => setIsImportant(checked as boolean)}
                  />
                  <label
                    htmlFor="important"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    중요 공지사항으로 설정
                  </label>
                </div>

                {/* 대상 설정 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    공지 대상
                  </label>
                  <Select value={targetAudience} onValueChange={setTargetAudience}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="hosts">호스트</SelectItem>
                      <SelectItem value="admins">관리자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 버튼들 */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/admin/notices/${params.id}`)}
                  disabled={saving}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? (
                    <>수정 중...</>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      수정 완료
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}