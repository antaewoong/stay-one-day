'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft,
  Search,
  Calendar,
  Clock,
  Pin,
  AlertCircle,
  Loader2,
  Bell
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { influencerGet } from '@/lib/influencer-api'

interface Notice {
  id: string
  title: string
  content: string
  type: 'general' | 'important' | 'collaboration' | 'system'
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export default function InfluencerNoticesPage() {
  const router = useRouter()
  const [influencer, setInfluencer] = useState<any>(null)
  const [notices, setNotices] = useState<Notice[]>([])
  const [filteredNotices, setFilteredNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)

  useEffect(() => {
    // 인플루언서 로그인 체크
    const userData = sessionStorage.getItem('influencerUser')
    if (!userData) {
      router.push('/influencer/login')
      return
    }

    const influencerData = JSON.parse(userData)
    setInfluencer(influencerData)
    loadNotices()
  }, [router])

  useEffect(() => {
    // 검색 필터 적용
    if (searchQuery.trim()) {
      const filtered = notices.filter(notice => 
        notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notice.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredNotices(filtered)
    } else {
      setFilteredNotices(notices)
    }
  }, [notices, searchQuery])

  const loadNotices = async () => {
    try {
      const response = await influencerGet('/api/influencer/notices')
      const result = await response.json()
      
      if (result.success) {
        // 고정된 공지사항을 상단으로 정렬
        const sortedNotices = result.data.sort((a: Notice, b: Notice) => {
          if (a.is_pinned && !b.is_pinned) return -1
          if (!a.is_pinned && b.is_pinned) return 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
        setNotices(sortedNotices)
      } else {
        console.error('공지사항 로드 실패:', result.error)
      }
    } catch (error) {
      console.error('공지사항 로드 에러:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      important: { label: '중요', className: 'bg-red-600 hover:bg-red-700' },
      collaboration: { label: '협업', className: 'bg-blue-600 hover:bg-blue-700' },
      system: { label: '시스템', className: 'bg-gray-600 hover:bg-gray-700' },
      general: { label: '일반', className: 'bg-green-600 hover:bg-green-700' }
    }

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.general
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const handleNoticeClick = (notice: Notice) => {
    setSelectedNotice(notice)
  }

  const handleBackToList = () => {
    setSelectedNotice(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>로딩 중...</span>
        </div>
      </div>
    )
  }

  if (selectedNotice) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* 헤더 */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleBackToList}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Button>
            <div>
              <h1 className="text-2xl font-bold">공지사항</h1>
              <p className="text-gray-600">공지사항 상세 내용</p>
            </div>
          </div>

          {/* 공지사항 상세 */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {selectedNotice.is_pinned && (
                      <Pin className="w-5 h-5 text-red-500" />
                    )}
                    {getTypeBadge(selectedNotice.type)}
                  </div>
                  <CardTitle className="text-xl">{selectedNotice.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {format(new Date(selectedNotice.created_at), 'PPP pp', { locale: ko })}
                    </div>
                    {selectedNotice.updated_at !== selectedNotice.created_at && (
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        수정: {format(new Date(selectedNotice.updated_at), 'PPP', { locale: ko })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-gray max-w-none">
                <div 
                  className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: selectedNotice.content }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/influencer/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            대시보드
          </Button>
          <div>
            <h1 className="text-2xl font-bold">공지사항</h1>
            <p className="text-gray-600">중요한 소식과 업데이트를 확인하세요</p>
          </div>
        </div>

        {/* 검색 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="공지사항 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* 공지사항 목록 */}
        {filteredNotices.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">공지사항이 없습니다</h3>
              <p className="text-gray-600">
                {searchQuery ? '검색 조건에 맞는 공지사항이 없습니다' : '등록된 공지사항이 없습니다'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredNotices.map((notice) => (
              <Card 
                key={notice.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleNoticeClick(notice)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {notice.is_pinned && (
                          <Pin className="w-4 h-4 text-red-500" />
                        )}
                        {getTypeBadge(notice.type)}
                      </div>
                      
                      <h3 className="text-lg font-semibold mb-2 hover:text-blue-600 transition-colors">
                        {notice.title}
                      </h3>
                      
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {notice.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(new Date(notice.created_at), 'PPP', { locale: ko })}
                        </div>
                        {notice.updated_at !== notice.created_at && (
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            수정: {format(new Date(notice.updated_at), 'MMM dd', { locale: ko })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}