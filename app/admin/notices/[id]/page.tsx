'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Eye } from 'lucide-react'
import { adminGet } from '@/lib/admin-api'

interface Notice {
  id: string
  title: string
  content: string
  notice_type: string
  target_audience: string
  is_pinned: boolean
  status: string
  view_count: number
  created_at: string
  updated_at: string
}

export default function NoticeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [notice, setNotice] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(true)

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
        setNotice(result.data)
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => router.push('/admin/notices')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              목록으로
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">공지사항 상세</h1>
          </div>
          <Button
            onClick={() => router.push(`/admin/notices/${notice.id}/edit`)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Edit className="w-4 h-4 mr-2" />
            수정
          </Button>
        </div>

        {/* 공지사항 상세 */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{notice.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {notice.is_pinned && (
                    <Badge variant="destructive" className="text-xs">중요</Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {notice.target_audience === 'all' ? '전체' : 
                     notice.target_audience === 'hosts' ? '호스트' : '관리자'}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{notice.view_count || 0}회 조회</span>
                  </div>
                </div>
              </div>
              <Badge 
                variant={notice.status === 'published' ? 'default' : 'secondary'}
              >
                {notice.status === 'published' ? '공개' : '임시저장'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700">
                {notice.content || '내용이 없습니다.'}
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500 space-y-1">
                <div>작성일: {new Date(notice.created_at).toLocaleString('ko-KR')}</div>
                <div>수정일: {new Date(notice.updated_at).toLocaleString('ko-KR')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}