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
  Loader2,
  Building2,
  CreditCard,
  Clock,
  AlertTriangle,
  Filter
} from 'lucide-react'

interface Inquiry {
  id: string
  title: string
  content: string
  inquiry_type: string
  user_name: string
  user_email: string
  user_phone?: string
  status: 'pending' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  accommodation_id?: string
  accommodation_name?: string
  host_name?: string
  admin_response?: string
  admin_id?: string
  admin_name?: string
  responded_at?: string
  created_at: string
  updated_at: string
  response_time_hours?: number
}

interface InquiryStats {
  total: number
  pending: number
  in_progress: number
  resolved: number
  closed: number
  avg_response_time: number
  overdue: number
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [sendingReply, setSendingReply] = useState(false)
  const [stats, setStats] = useState<InquiryStats>({
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
    avg_response_time: 0,
    overdue: 0
  })

  useEffect(() => {
    loadInquiries()
  }, [statusFilter, typeFilter, priorityFilter])

  const loadInquiries = async () => {
    try {
      setLoading(true)
      
      let url = '/api/admin/inquiries?limit=100'
      if (statusFilter !== 'all') url += `&status=${statusFilter}`
      if (typeFilter !== 'all') url += `&type=${typeFilter}`
      if (priorityFilter !== 'all') url += `&priority=${priorityFilter}`
      
      const response = await fetch(url)
      const result = await response.json()
      
      if (result.success && result.data) {
        setInquiries(result.data)
        calculateStats(result.data)
      } else {
        setInquiries([])
        setStats({
          total: 0, pending: 0, in_progress: 0, resolved: 0, closed: 0,
          avg_response_time: 0, overdue: 0
        })
      }

    } catch (error) {
      console.error('문의사항 로드 실패:', error)
      setInquiries([])
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data: Inquiry[]) => {
    const total = data.length
    const pending = data.filter(i => i.status === 'pending').length
    const in_progress = data.filter(i => i.status === 'in_progress').length
    const resolved = data.filter(i => i.status === 'resolved').length
    const closed = data.filter(i => i.status === 'closed').length
    
    // 평균 응답 시간 계산 (시간 단위)
    const responseTimes = data
      .filter(i => i.responded_at)
      .map(i => {
        const created = new Date(i.created_at).getTime()
        const responded = new Date(i.responded_at!).getTime()
        return (responded - created) / (1000 * 60 * 60)
      })
    const avg_response_time = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0

    // 24시간 이상 응답 없는 문의사항
    const now = new Date().getTime()
    const overdue = data.filter(i => {
      if (i.status !== 'pending') return false
      const created = new Date(i.created_at).getTime()
      return (now - created) / (1000 * 60 * 60) > 24
    }).length

    setStats({
      total, pending, in_progress, resolved, closed,
      avg_response_time, overdue
    })
  }

  const filteredInquiries = inquiries.filter(inquiry =>
    inquiry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inquiry.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inquiry.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inquiry.accommodation_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inquiry.host_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleViewInquiry = async (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry)
  }

  const handleSendReply = async () => {
    if (!selectedInquiry || !replyContent.trim()) return

    try {
      setSendingReply(true)
      
      // 관리자 세션 정보 가져오기
      const adminUser = sessionStorage.getItem('adminUser')
      let adminName = '관리자'
      let adminId = null
      
      if (adminUser) {
        const adminData = JSON.parse(adminUser)
        adminName = adminData.name || adminData.email || '관리자'
        adminId = adminData.id
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (adminUser) {
        headers['x-admin-session'] = adminUser
      }

      const response = await fetch(`/api/admin/inquiries/${selectedInquiry.id}/reply`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          admin_response: replyContent,
          admin_name: adminName,
          admin_id: adminId
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setReplyContent('')
        await loadInquiries()
        setSelectedInquiry(null)
        alert('답변이 전송되었습니다.')
      } else {
        alert(result.error || '답변 전송에 실패했습니다.')
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
        return <Badge variant="destructive" className="text-xs">대기중</Badge>
      case 'in_progress':
        return <Badge variant="default" className="text-xs">처리중</Badge>
      case 'resolved':
        return <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">해결완료</Badge>
      case 'closed':
        return <Badge variant="secondary" className="text-xs">종료</Badge>
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">높음</Badge>
      case 'medium':
        return <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200">보통</Badge>
      case 'low':
        return <Badge variant="outline" className="text-xs">낮음</Badge>
      default:
        return null
    }
  }

  const getTypeName = (type: string) => {
    const types: Record<string, string> = {
      'booking': '예약 문의',
      'service': '서비스 문의',
      'complaint': '불만사항',
      'general': '일반 문의',
      'payment': '결제 문제',
      'accommodation': '숙소 관련',
      'host': '호스트 문의',
      'technical': '기술 문제'
    }
    return types[type] || type
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking':
      case 'accommodation':
        return <Building2 className="h-3 w-3" />
      case 'payment':
        return <CreditCard className="h-3 w-3" />
      case 'complaint':
        return <AlertTriangle className="h-3 w-3" />
      default:
        return <MessageSquare className="h-3 w-3" />
    }
  }

  const isOverdue = (inquiry: Inquiry) => {
    if (inquiry.status !== 'pending') return false
    const now = new Date().getTime()
    const created = new Date(inquiry.created_at).getTime()
    return (now - created) / (1000 * 60 * 60) > 24
  }

  const getResponseTime = (inquiry: Inquiry) => {
    if (!inquiry.responded_at) return null
    const created = new Date(inquiry.created_at).getTime()
    const responded = new Date(inquiry.responded_at).getTime()
    const hours = Math.round((responded - created) / (1000 * 60 * 60))
    
    if (hours < 1) return '1시간 미만'
    if (hours < 24) return `${hours}시간`
    const days = Math.floor(hours / 24)
    return `${days}일 ${hours % 24}시간`
  }

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500">전체</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.pending}</div>
            <div className="text-xs text-gray-500">대기중</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.in_progress}</div>
            <div className="text-xs text-gray-500">처리중</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-xs text-gray-500">해결</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
            <div className="text-xs text-gray-500">종료</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.avg_response_time}h</div>
            <div className="text-xs text-gray-500">평균응답</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.overdue}</div>
            <div className="text-xs text-gray-500">지연</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            문의사항 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 필터 및 검색 */}
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="제목, 이름, 이메일, 숙소명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">모든 상태</option>
                <option value="pending">대기중</option>
                <option value="in_progress">처리중</option>
                <option value="resolved">해결완료</option>
                <option value="closed">종료</option>
              </select>

              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">모든 유형</option>
                <option value="booking">예약 문의</option>
                <option value="payment">결제 문제</option>
                <option value="accommodation">숙소 관련</option>
                <option value="host">호스트 문의</option>
                <option value="service">서비스 문의</option>
                <option value="complaint">불만사항</option>
                <option value="technical">기술 문제</option>
                <option value="general">일반 문의</option>
              </select>

              <select 
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">모든 우선순위</option>
                <option value="high">높음</option>
                <option value="medium">보통</option>
                <option value="low">낮음</option>
              </select>
              
              <Badge variant="outline" className="text-xs">
                {filteredInquiries.length}개
              </Badge>
            </div>
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
                  <TableRow className="bg-gray-50 border-b-2 border-gray-200">
                    <TableHead className="font-semibold">문의 정보</TableHead>
                    <TableHead className="font-semibold w-32">문의자</TableHead>
                    <TableHead className="font-semibold w-32">숙소/호스트</TableHead>
                    <TableHead className="font-semibold w-24">유형</TableHead>
                    <TableHead className="font-semibold w-24">상태</TableHead>
                    <TableHead className="font-semibold w-28">응답시간</TableHead>
                    <TableHead className="font-semibold w-32">문의일</TableHead>
                    <TableHead className="font-semibold w-20 text-center">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInquiries.map((inquiry) => (
                    <TableRow 
                      key={inquiry.id} 
                      className={`hover:bg-gray-50 border-b ${isOverdue(inquiry) ? 'bg-red-50' : ''}`}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getPriorityBadge(inquiry.priority)}
                            {isOverdue(inquiry) && (
                              <Badge variant="destructive" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                지연
                              </Badge>
                            )}
                            <span className="font-medium text-sm">{inquiry.title}</span>
                          </div>
                          <div className="text-xs text-gray-500 line-clamp-1">
                            {inquiry.content.substring(0, 60)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div className="font-medium">{inquiry.user_name}</div>
                          <div className="text-gray-500 text-xs">{inquiry.user_email}</div>
                          {inquiry.user_phone && (
                            <div className="text-gray-500 text-xs">{inquiry.user_phone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {inquiry.accommodation_name && (
                            <div className="font-medium text-xs">{inquiry.accommodation_name}</div>
                          )}
                          {inquiry.host_name && (
                            <div className="text-gray-500 text-xs">호스트: {inquiry.host_name}</div>
                          )}
                          {!inquiry.accommodation_name && !inquiry.host_name && (
                            <div className="text-gray-400 text-xs">-</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getTypeIcon(inquiry.inquiry_type)}
                          <Badge variant="outline" className="text-xs">
                            {getTypeName(inquiry.inquiry_type)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(inquiry.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {inquiry.admin_response ? (
                            <div className="space-y-1">
                              <div className="text-green-600 font-medium">
                                {getResponseTime(inquiry)}
                              </div>
                              <div className="text-gray-500">
                                by {inquiry.admin_name || '관리자'}
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-400">미응답</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-gray-600">
                          {new Date(inquiry.created_at).toLocaleDateString('ko-KR', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewInquiry(inquiry)}
                          className="h-8 w-8 p-0"
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {selectedInquiry && getTypeIcon(selectedInquiry.inquiry_type)}
                <span>{selectedInquiry?.title}</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedInquiry && getPriorityBadge(selectedInquiry.priority)}
                {selectedInquiry && getStatusBadge(selectedInquiry.status)}
                {selectedInquiry && isOverdue(selectedInquiry) && (
                  <Badge variant="destructive" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    지연
                  </Badge>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedInquiry && (
            <div className="space-y-6">
              {/* 문의자 정보 */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">{selectedInquiry.user_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{selectedInquiry.user_email}</span>
                  </div>
                  {selectedInquiry.user_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{selectedInquiry.user_phone}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{new Date(selectedInquiry.created_at).toLocaleString('ko-KR')}</span>
                  </div>
                  {selectedInquiry.accommodation_name && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{selectedInquiry.accommodation_name}</span>
                    </div>
                  )}
                  {selectedInquiry.host_name && (
                    <div className="text-sm text-gray-600">
                      호스트: {selectedInquiry.host_name}
                    </div>
                  )}
                </div>
              </div>

              {/* 문의 내용 */}
              <div>
                <h4 className="font-medium mb-3 text-gray-900">문의 내용</h4>
                <div className="p-4 bg-white border rounded-lg">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedInquiry.content}
                  </div>
                </div>
              </div>

              {/* 기존 답변 */}
              {selectedInquiry.admin_response && (
                <div>
                  <h4 className="font-medium mb-3 text-gray-900">관리자 답변</h4>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-blue-800">
                        {selectedInquiry.admin_name || '관리자'}
                      </span>
                      <span className="text-xs text-blue-600">
                        {selectedInquiry.responded_at && new Date(selectedInquiry.responded_at).toLocaleString('ko-KR')}
                        {selectedInquiry.responded_at && (
                          <span className="ml-2">
                            (응답시간: {getResponseTime(selectedInquiry)})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {selectedInquiry.admin_response}
                    </div>
                  </div>
                </div>
              )}

              {/* 답변 작성 */}
              {selectedInquiry.status !== 'closed' && (
                <div>
                  <h4 className="font-medium mb-3 text-gray-900">
                    {selectedInquiry.admin_response ? '추가 답변' : '답변 작성'}
                  </h4>
                  <Textarea
                    placeholder="고객에게 전달할 답변을 입력하세요..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={6}
                    className="mb-3 resize-none"
                  />
                  <div className="flex justify-end gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedInquiry(null)}
                      disabled={sendingReply}
                    >
                      닫기
                    </Button>
                    <Button 
                      onClick={handleSendReply} 
                      disabled={!replyContent.trim() || sendingReply}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
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
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}