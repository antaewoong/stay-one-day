'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Bell, Pin, Calendar, ArrowLeft } from 'lucide-react'
import { hostGet } from '@/lib/host-api'
import Link from 'next/link'

interface Notice {
  id: string
  title: string
  content: string
  notice_type: string
  is_pinned: boolean
  created_at: string
  start_date: string | null
  end_date: string | null
}

export default function HostNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)

  useEffect(() => {
    loadNotices()
  }, [])

  const loadNotices = async () => {
    try {
      setLoading(true)
      const response = await hostGet('/api/host/notices?limit=50')
      const result = await response.json()

      if (result.success) {
        setNotices(result.data || [])
      } else {
        console.error('공지사항 로드 실패:', result.error)
      }
    } catch (error) {
      console.error('공지사항 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredNotices = notices.filter(notice =>
    notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notice.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getNoticeTypeText = (type: string) => {
    const typeMap = {
      'general': '일반',
      'maintenance': '점검',
      'policy': '정책',
      'event': '이벤트',
      'urgent': '긴급'
    }
    return typeMap[type as keyof typeof typeMap] || type
  }

  const getNoticeTypeColor = (type: string) => {
    const colorMap = {
      'general': 'bg-blue-100 text-blue-800',
      'maintenance': 'bg-orange-100 text-orange-800',
      'policy': 'bg-purple-100 text-purple-800',
      'event': 'bg-green-100 text-green-800',
      'urgent': 'bg-red-100 text-red-800'
    }
    return colorMap[type as keyof typeof colorMap] || 'bg-gray-100 text-gray-800'
  }

  if (selectedNotice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedNotice(null)}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">공지사항</h1>
        </div>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {selectedNotice.is_pinned && (
                    <Pin className="w-4 h-4 text-red-500" />
                  )}
                  <CardTitle className="text-xl">{selectedNotice.title}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getNoticeTypeColor(selectedNotice.notice_type)}>
                    {getNoticeTypeText(selectedNotice.notice_type)}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(selectedNotice.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div
              className="prose max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: selectedNotice.content.replace(/\n/g, '<br />')
              }}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">공지사항</h1>
          <p className="text-sm text-gray-600 mt-1">
            호스트 전용 공지사항 및 안내사항
          </p>
        </div>
      </div>

      {/* 검색 */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="공지사항 제목이나 내용으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 공지사항 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            공지사항 목록 ({filteredNotices.length}개)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">공지사항을 불러오는 중...</p>
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? '검색 결과가 없습니다' : '등록된 공지사항이 없습니다'}
              </h3>
              <p className="text-gray-500">
                {searchQuery ? '다른 검색어로 시도해보세요' : '새로운 공지사항이 있을 때 알려드리겠습니다'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedNotice(notice)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {notice.is_pinned && (
                          <Pin className="w-4 h-4 text-red-500" />
                        )}
                        <h3 className="font-medium text-gray-900 line-clamp-1">
                          {notice.title}
                        </h3>
                        <Badge className={`${getNoticeTypeColor(notice.notice_type)} text-xs`}>
                          {getNoticeTypeText(notice.notice_type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {notice.content.replace(/\n/g, ' ').substring(0, 100)}
                        {notice.content.length > 100 && '...'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(notice.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}