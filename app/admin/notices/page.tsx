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
      
      // 실제 API 호출
      const response = await fetch('/api/admin/notices?limit=50')
      const result = await response.json()
      
      if (result.success && result.data) {
        setNotices(result.data.map((notice: any) => ({
          id: notice.id,
          title: notice.title,
          content: notice.content,
          author: notice.admin_id ? '관리자' : '시스템',
          views: notice.view_count || 0,
          status: notice.status === 'published' ? 'published' : 'draft',
          is_important: notice.is_pinned || notice.notice_type === 'urgent',
          created_at: notice.created_at,
          updated_at: notice.updated_at
        })))
      } else {
        console.log('공지사항이 없거나 API 호출 실패')
        setNotices([])
      }

    } catch (error) {
      console.error('공지사항 로드 실패:', error)
      setNotices([])
    } finally {
      setLoading(false)
    }
  }

  // 검색 시 재로드
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadNotices()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const filteredNotices = notices.filter(notice =>
    notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notice.author.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeleteSelected = async () => {
    if (selectedNotices.length === 0) return
    
    if (confirm(`선택한 ${selectedNotices.length}개의 공지사항을 삭제하시겠습니까?`)) {
      try {
        // 실제 삭제 API 호출
        for (const noticeId of selectedNotices) {
          await fetch(`/api/notices/${noticeId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            }
          })
        }
        
        await loadNotices()
        setSelectedNotices([])
      } catch (error) {
        console.error('공지사항 삭제 실패:', error)
        alert('공지사항 삭제에 실패했습니다.')
      }
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>공지사항 관리</span>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => window.location.href = '/admin/notices/create'}
            >
              <Plus className="mr-2 h-4 w-4" />
              새 공지사항 작성
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="공지사항 제목 또는 작성자 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              {selectedNotices.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  선택 삭제 ({selectedNotices.length})
                </Button>
              )}
              <Badge variant="outline">
                총 {filteredNotices.length}개
              </Badge>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>공지사항을 불러오는 중...</span>
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchQuery ? '검색 결과가 없습니다.' : '등록된 공지사항이 없습니다.'}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">
                      <input 
                        type="checkbox"
                        checked={selectedNotices.length === filteredNotices.length && filteredNotices.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedNotices(filteredNotices.map(notice => notice.id))
                          } else {
                            setSelectedNotices([])
                          }
                        }}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>제목</TableHead>
                    <TableHead className="w-32">작성자</TableHead>
                    <TableHead className="w-20">조회수</TableHead>
                    <TableHead className="w-24">상태</TableHead>
                    <TableHead className="w-32">작성일</TableHead>
                    <TableHead className="w-24">작업</TableHead>
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {notice.is_important && (
                            <Badge variant="destructive" className="text-xs">중요</Badge>
                          )}
                          <span className="font-medium">{notice.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{notice.author}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{notice.views}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={notice.status === 'published' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {notice.status === 'published' ? '공개' : '임시저장'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {new Date(notice.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.location.href = `/admin/notices/${notice.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.location.href = `/admin/notices/${notice.id}/edit`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}