'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, Plus, Eye, Edit, Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Notice {
  id: string
  title: string
  content: string | null
  author: string
  views: number
  status: 'published' | 'draft'
  is_important: boolean
  created_at: string
  updated_at: string
}

export default function NoticesPage() {
  const supabase = createClient()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNotices, setSelectedNotices] = useState<string[]>([])

  useEffect(() => {
    loadNotices()
  }, [])

  const loadNotices = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false })

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('공지사항 로드 실패:', error)
        // 에러시 목업 데이터 사용
        setNotices(mockNotices)
        return
      }

      setNotices(data || [])
    } catch (error) {
      console.error('공지사항 로드 실패:', error)
      // 에러시 목업 데이터 사용
      setNotices(mockNotices)
    } finally {
      setLoading(false)
    }
  }

  // 검색시 재로드
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadNotices()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // 목업 데이터 (테이블이 없는 경우 대비)
  const mockNotices: Notice[] = [
    {
      id: '43',
      title: 'Stay One Day 플랫폼 오픈 안내',
      content: 'Stay One Day 서비스가 정식으로 오픈되었습니다.',
      views: 45,
      author: 'Stay One Day 관리자',
      created_at: '2025-01-15T09:00:00+09:00',
      updated_at: '2025-01-15T09:00:00+09:00',
      status: 'published',
      is_important: true
    },
    {
      id: '42',
      title: '[공지] 2월 프로모션 이벤트',
      content: '2월 한 달간 모든 숙소 10% 할인 이벤트를 진행합니다.',
      views: 67,
      author: 'Stay One Day 관리자',
      created_at: '2025-02-01T14:00:00+09:00',
      updated_at: '2025-02-01T14:00:00+09:00',
      status: 'published',
      is_important: true
    },
    {
      id: '41',
      title: '신규 숙소 등록 프로세스 변경 안내',
      content: '호스트 숙소 등록 절차가 간소화되었습니다.',
      views: 28,
      author: 'Stay One Day 관리자',
      created_at: '2025-02-01T10:00:00+09:00',
      updated_at: '2025-02-01T10:00:00+09:00',
      status: 'published',
      is_important: false
    },
    {
      id: '40',
      title: '[공지] 서비스 점검 안내',
      content: '2월 28일 02:00~06:00 서비스 점검이 진행됩니다.',
      views: 89,
      author: 'Stay One Day 관리자',
      created_at: '2025-02-25T16:00:00+09:00',
      updated_at: '2025-02-25T16:00:00+09:00',
      status: 'published',
      is_important: true
    },
    {
      id: '39',
      title: '정산 주기 변경 안내',
      content: '호스트 정산 주기가 월 1회에서 주 1회로 변경됩니다.',
      views: 34,
      author: 'Stay One Day 관리자',
      created_at: '2025-02-15T11:00:00+09:00',
      updated_at: '2025-02-15T11:00:00+09:00',
      status: 'published',
      is_important: false
    }
  ]

  const filteredNotices = notices.filter(notice =>
    notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notice.author.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`'${title}' 공지사항을 정말 삭제하시겠습니까?`)) return

    try {
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('공지사항이 삭제되었습니다.')
      loadNotices()
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  const incrementViews = async (noticeId: string) => {
    try {
      const { error } = await supabase.rpc('increment_notice_views', {
        notice_id: noticeId
      })
      if (!error) {
        loadNotices() // 뷰 카운트 업데이트 후 새로고침
      }
    } catch (error) {
      console.error('조회수 업데이트 실패:', error)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNotices(filteredNotices.map(notice => notice.id))
    } else {
      setSelectedNotices([])
    }
  }

  const handleSelectNotice = (id: string) => {
    setSelectedNotices(prev => 
      prev.includes(id) 
        ? prev.filter(noticeId => noticeId !== id)
        : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">점주 공지사항</h1>
          <p className="text-gray-600">Stay One Day 운영 관련 공지사항을 관리합니다.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          공지 작성
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>공지사항 목록</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="제목, 작성자 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              {selectedNotices.length > 0 && (
                <Button variant="outline" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  선택 삭제 ({selectedNotices.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p>로딩 중...</p>
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedNotices.length === filteredNotices.length && filteredNotices.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded"
                  />
                </TableHead>
                <TableHead className="w-16">#</TableHead>
                <TableHead>제목</TableHead>
                <TableHead className="w-20">조회수</TableHead>
                <TableHead className="w-32">작성자</TableHead>
                <TableHead className="w-32">작성일</TableHead>
                <TableHead className="w-20">상태</TableHead>
                <TableHead className="w-32">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotices.map((notice) => (
                <TableRow key={notice.id} className="hover:bg-gray-50">
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedNotices.includes(notice.id)}
                      onChange={() => handleSelectNotice(notice.id)}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{notice.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {notice.is_important && (
                        <Badge variant="destructive" className="text-xs">
                          공지
                        </Badge>
                      )}
                      <span className={notice.is_important ? 'text-red-600 font-medium' : ''}>
                        {notice.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{notice.views}</TableCell>
                  <TableCell>{notice.author}</TableCell>
                  <TableCell>{new Date(notice.created_at).toLocaleDateString('ko-KR')}</TableCell>
                  <TableCell>
                    <Badge variant={notice.status === 'published' ? 'default' : 'secondary'}>
                      {notice.status === 'published' ? '게시됨' : '임시저장'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => incrementViews(notice.id)}
                        title="조회수 증가"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="편집">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(notice.id, notice.title)}
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}

          {!loading && filteredNotices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? '검색 결과가 없습니다.' : '등록된 공지사항이 없습니다.'}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button variant="outline" size="sm" disabled>
              이전
            </Button>
            <div className="flex gap-1">
              <Button variant="default" size="sm" className="w-8">1</Button>
              <Button variant="outline" size="sm" className="w-8">2</Button>
              <Button variant="outline" size="sm" className="w-8">3</Button>
            </div>
            <Button variant="outline" size="sm">
              다음
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}