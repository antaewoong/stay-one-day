'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Users,
  MessageSquare,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { apiFetch } from '@/lib/auth-helpers'

interface Notice {
  id: string
  title: string
  content: string
  notice_type: 'collaboration' | 'announcement' | 'urgent'
  target_month?: number
  target_year?: number
  is_active: boolean
  view_count: number
  created_at: string
  updated_at: string
}

export default function InfluencerNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    notice_type: 'collaboration',
    target_month: new Date().getMonth() + 1,
    target_year: new Date().getFullYear(),
    is_active: true
  })

  useEffect(() => {
    loadNotices()
  }, [])

  const loadNotices = async () => {
    try {
      setLoading(true)
      const result = await apiFetch('/api/admin/influencer-notices')
      
      if (result.success) {
        setNotices(result.data)
      }
    } catch (error) {
      console.error('공지사항 로드 오류:', error)
      toast.error('공지사항을 불러올 수 없습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNotice = async () => {
    try {
      setCreateLoading(true)
      
      if (!newNotice.title.trim() || !newNotice.content.trim()) {
        toast.error('제목과 내용을 모두 입력해주세요')
        return
      }

      const result = await apiFetch('/api/admin/influencer-notices', {
        method: 'POST',
        body: JSON.stringify(newNotice)
      })
      
      if (result.success) {
        toast.success('공지사항이 작성되었습니다')
        setShowCreateModal(false)
        setNewNotice({
          title: '',
          content: '',
          notice_type: 'collaboration',
          target_month: new Date().getMonth() + 1,
          target_year: new Date().getFullYear(),
          is_active: true
        })
        loadNotices()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('공지사항 작성 오류:', error)
      toast.error('공지사항 작성에 실패했습니다')
    } finally {
      setCreateLoading(false)
    }
  }

  const toggleNoticeStatus = async (id: string, currentStatus: boolean) => {
    try {
      await apiFetch(`/api/admin/influencer-notices/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !currentStatus })
      })
        toast.success(currentStatus ? '공지사항을 비활성화했습니다' : '공지사항을 활성화했습니다')
        loadNotices()
      }
    } catch (error) {
      console.error('공지사항 상태 변경 오류:', error)
      toast.error('상태 변경에 실패했습니다')
    }
  }

  const getNoticeTypeLabel = (type: string) => {
    switch (type) {
      case 'collaboration': return '협업'
      case 'announcement': return '공지'
      case 'urgent': return '긴급'
      default: return type
    }
  }

  const getNoticeTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'collaboration': return 'bg-blue-100 text-blue-800'
      case 'announcement': return 'bg-green-100 text-green-800'
      case 'urgent': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/influencers" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              인플루언서 관리
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-7 h-7 text-blue-600" />
              협업 공지 관리
            </h1>
            <p className="text-gray-500">인플루언서를 위한 협업 공지사항을 관리합니다</p>
          </div>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          공지사항 작성
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">전체 공지</p>
                <p className="text-2xl font-bold text-gray-900">{notices.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">활성 공지</p>
                <p className="text-2xl font-bold text-green-600">
                  {notices.filter(n => n.is_active).length}
                </p>
              </div>
              <Eye className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">협업 공지</p>
                <p className="text-2xl font-bold text-blue-600">
                  {notices.filter(n => n.notice_type === 'collaboration').length}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 조회수</p>
                <p className="text-2xl font-bold text-purple-600">
                  {notices.reduce((sum, n) => sum + n.view_count, 0)}
                </p>
              </div>
              <Eye className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 공지사항 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>공지사항 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          ) : notices.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">작성된 공지사항이 없습니다</p>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                첫 공지사항 작성하기
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>제목</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>대상 월</TableHead>
                  <TableHead>조회수</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>작성일</TableHead>
                  <TableHead>관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.map((notice) => (
                  <TableRow key={notice.id}>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium truncate">{notice.title}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {notice.content.substring(0, 50)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getNoticeTypeBadgeColor(notice.notice_type)}>
                        {getNoticeTypeLabel(notice.notice_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {notice.target_year && notice.target_month ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {notice.target_year}년 {notice.target_month}월
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4 text-gray-400" />
                        {notice.view_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={notice.is_active ? 
                          'bg-green-100 text-green-800' : 
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {notice.is_active ? '활성' : '비활성'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(notice.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleNoticeStatus(notice.id, notice.is_active)}
                        >
                          {notice.is_active ? '비활성화' : '활성화'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 공지사항 작성 모달 */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl bg-white border shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">협업 공지사항 작성</DialogTitle>
            <DialogDescription>
              인플루언서들에게 전달할 협업 공지사항을 작성합니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  value={newNotice.title}
                  onChange={(e) => setNewNotice(prev => ({...prev, title: e.target.value}))}
                  placeholder="공지사항 제목을 입력하세요"
                  className="bg-white border"
                />
              </div>
              <div>
                <Label htmlFor="notice_type">공지 유형</Label>
                <Select 
                  value={newNotice.notice_type} 
                  onValueChange={(value: any) => setNewNotice(prev => ({...prev, notice_type: value}))}
                >
                  <SelectTrigger className="bg-white border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg">
                    <SelectItem value="collaboration">협업 공지</SelectItem>
                    <SelectItem value="announcement">일반 공지</SelectItem>
                    <SelectItem value="urgent">긴급 공지</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="target_year">대상 년도</Label>
                <Input
                  id="target_year"
                  type="number"
                  value={newNotice.target_year}
                  onChange={(e) => setNewNotice(prev => ({...prev, target_year: parseInt(e.target.value)}))}
                  className="bg-white border"
                />
              </div>
              <div>
                <Label htmlFor="target_month">대상 월</Label>
                <Select 
                  value={newNotice.target_month.toString()} 
                  onValueChange={(value) => setNewNotice(prev => ({...prev, target_month: parseInt(value)}))}
                >
                  <SelectTrigger className="bg-white border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg">
                    {Array.from({length: 12}, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1}월
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="content">내용 *</Label>
              <Textarea
                id="content"
                value={newNotice.content}
                onChange={(e) => setNewNotice(prev => ({...prev, content: e.target.value}))}
                placeholder="공지사항 내용을 입력하세요"
                className="bg-white border resize-none h-40"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCreateModal(false)}
              className="bg-white border"
            >
              취소
            </Button>
            <Button 
              onClick={handleCreateNotice}
              disabled={createLoading || !newNotice.title.trim() || !newNotice.content.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createLoading ? '작성 중...' : '작성하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}