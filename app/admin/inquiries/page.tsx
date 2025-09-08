'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Search, 
  Eye, 
  MessageSquare, 
  CheckCircle,
  User,
  Calendar,
  Mail,
  Phone,
  Loader2
} from 'lucide-react'

interface Inquiry {
  id: string
  title: string
  content: string
  category: string
  inquirer_name: string
  inquirer_email: string
  inquirer_phone?: string
  status: 'pending' | 'answered' | 'resolved'
  priority: 'normal' | 'high' | 'urgent'
  created_at: string
  updated_at: string
  inquiry_replies?: Array<{
    id: string
    content: string
    author_name: string
    is_admin_reply: boolean
    created_at: string
  }>
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sendingReply, setSendingReply] = useState(false)

  useEffect(() => {
    loadInquiries()
  }, [statusFilter, categoryFilter])

  const loadInquiries = async () => {
    try {
      setLoading(true)
      
      let url = '/api/inquiries?limit=100'
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`
      }
      if (categoryFilter !== 'all') {
        url += `&category=${categoryFilter}`
      }
      
      const response = await fetch(url)
      const result = await response.json()
      
      if (result.success && result.data) {
        setInquiries(result.data)
      } else {
        console.log('문의사항이 없거나 API 호출 실패')
        setInquiries([])
      }

    } catch (error) {
      console.error('문의사항 로드 실패:', error)
      setInquiries([])
    } finally {
      setLoading(false)
    }
  }

  const filteredInquiries = inquiries.filter(inquiry =>
    inquiry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inquiry.inquirer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inquiry.inquirer_email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleViewInquiry = async (inquiry: Inquiry) => {
    try {
      // 문의 상세 정보와 답변 조회
      const response = await fetch(`/api/inquiries/${inquiry.id}`)
      const result = await response.json()
      
      if (result.success) {
        setSelectedInquiry(result.data)
      } else {
        setSelectedInquiry(inquiry)
      }
    } catch (error) {
      console.error('문의 상세 조회 실패:', error)
      setSelectedInquiry(inquiry)
    }
  }

  const handleSendReply = async () => {
    if (!selectedInquiry || !replyContent.trim()) return

    try {
      setSendingReply(true)
      
      const response = await fetch(`/api/inquiries/${selectedInquiry.id}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent,
          authorId: 'admin-001', // 실제로는 로그인한 관리자 ID
          authorName: '관리자',
          isAdminReply: true
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setReplyContent('')
        // 문의사항 목록 새로고침
        await loadInquiries()
        // 선택된 문의 다시 조회
        await handleViewInquiry(selectedInquiry)
        alert('답변이 전송되었습니다.')
      } else {
        alert('답변 전송에 실패했습니다.')
      }

    } catch (error) {
      console.error('답변 전송 실패:', error)
      alert('답변 전송에 실패했습니다.')
    } finally {
      setSendingReply(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="destructive">대기중</Badge>
      case 'answered':
        return <Badge variant="default">답변완료</Badge>
      case 'resolved':
        return <Badge variant="outline">해결완료</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive" className="text-xs">긴급</Badge>
      case 'high':
        return <Badge variant="default" className="text-xs">높음</Badge>
      default:
        return null
    }
  }

  const getCategoryName = (category: string) => {
    const categories: Record<string, string> = {
      'general': '일반',
      'reservation': '예약',
      'payment': '결제',
      'host': '호스트',
      'technical': '기술',
      'partnership': '제휴'
    }
    return categories[category] || category
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>문의사항 관리</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 필터 및 검색 */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="제목, 이름, 이메일 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">모든 상태</option>
              <option value="pending">대기중</option>
              <option value="answered">답변완료</option>
              <option value="resolved">해결완료</option>
            </select>

            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">모든 카테고리</option>
              <option value="general">일반</option>
              <option value="reservation">예약</option>
              <option value="payment">결제</option>
              <option value="host">호스트</option>
              <option value="technical">기술</option>
            </select>
            
            <Badge variant="outline">
              총 {filteredInquiries.length}개
            </Badge>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>문의사항을 불러오는 중...</span>
            </div>
          ) : filteredInquiries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchQuery ? '검색 결과가 없습니다.' : '문의사항이 없습니다.'}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>제목</TableHead>
                    <TableHead className="w-32">문의자</TableHead>
                    <TableHead className="w-24">카테고리</TableHead>
                    <TableHead className="w-24">상태</TableHead>
                    <TableHead className="w-32">문의일</TableHead>
                    <TableHead className="w-20">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInquiries.map((inquiry) => (
                    <TableRow key={inquiry.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(inquiry.priority)}
                          <span className="font-medium">{inquiry.title}</span>
                          {inquiry.inquiry_replies && inquiry.inquiry_replies.length > 0 && (
                            <MessageSquare className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{inquiry.inquirer_name}</div>
                          <div className="text-gray-500">{inquiry.inquirer_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getCategoryName(inquiry.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(inquiry.status)}
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {new Date(inquiry.created_at).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewInquiry(inquiry)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 문의 상세 모달 */}
      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{selectedInquiry?.title}</span>
              {selectedInquiry && getStatusBadge(selectedInquiry.status)}
            </DialogTitle>
          </DialogHeader>
          
          {selectedInquiry && (
            <div className="space-y-6">
              {/* 문의자 정보 */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">{selectedInquiry.inquirer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{selectedInquiry.inquirer_email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{new Date(selectedInquiry.created_at).toLocaleString('ko-KR')}</span>
                </div>
                {selectedInquiry.inquirer_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{selectedInquiry.inquirer_phone}</span>
                  </div>
                )}
              </div>

              {/* 문의 내용 */}
              <div>
                <h4 className="font-medium mb-2">문의 내용</h4>
                <div className="p-4 bg-white border rounded-lg whitespace-pre-wrap">
                  {selectedInquiry.content}
                </div>
              </div>

              {/* 기존 답변들 */}
              {selectedInquiry.inquiry_replies && selectedInquiry.inquiry_replies.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">답변 내역</h4>
                  <div className="space-y-3">
                    {selectedInquiry.inquiry_replies.map((reply) => (
                      <div key={reply.id} className={`p-4 rounded-lg ${reply.is_admin_reply ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-sm">
                            {reply.author_name} {reply.is_admin_reply && <Badge variant="default" className="text-xs ml-2">관리자</Badge>}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(reply.created_at).toLocaleString('ko-KR')}
                          </span>
                        </div>
                        <div className="text-sm whitespace-pre-wrap">{reply.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 답변 작성 */}
              <div>
                <h4 className="font-medium mb-2">답변 작성</h4>
                <Textarea
                  placeholder="답변을 입력하세요..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={5}
                  className="mb-3"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedInquiry(null)}>
                    닫기
                  </Button>
                  <Button 
                    onClick={handleSendReply} 
                    disabled={!replyContent.trim() || sendingReply}
                  >
                    {sendingReply ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        전송 중...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        답변 전송
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}