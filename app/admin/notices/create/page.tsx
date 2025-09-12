'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save } from 'lucide-react'
import { apiFetch } from '@/lib/auth-helpers'

export default function CreateNoticePage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isImportant, setIsImportant] = useState(false)
  const [targetAudience, setTargetAudience] = useState('all')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      alert('제목을 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      // 현재 관리자 정보 가져오기
      const adminUser = sessionStorage.getItem('adminUser')
      let authorName = '관리자'
      let authorRole = 'admin'
      
      if (adminUser) {
        const adminData = JSON.parse(adminUser)
        authorName = adminData.name || adminData.email || '관리자'
        authorRole = adminData.role || 'admin'
      }

      // API를 통해 공지사항 생성
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      // 관리자 세션 정보 추가
      if (adminUser) {
        headers['x-admin-session'] = adminUser
      }
      
      await apiFetch('/api/admin/notices', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          is_important: isImportant,
          target_audience: targetAudience,
          author_name: authorName,
          author_role: authorRole
        })
      })

      alert('공지사항이 성공적으로 작성되었습니다.')
      router.push('/admin/notices')
      
    } catch (error) {
      console.error('공지사항 저장 실패:', error)
      alert(error instanceof Error ? error.message : '공지사항 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">새 공지사항 작성</h1>
        </div>

        {/* 작성 폼 */}
        <Card>
          <CardHeader>
            <CardTitle>공지사항 작성</CardTitle>
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
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>저장 중...</>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      공지사항 저장
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