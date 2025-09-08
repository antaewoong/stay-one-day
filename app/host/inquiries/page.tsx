'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  MessageCircle, 
  Reply, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface Inquiry {
  id: string
  guest_name: string
  guest_phone: string
  guest_email: string
  accommodation_name?: string
  subject: string
  message: string
  status: 'pending' | 'answered' | 'closed'
  priority: 'high' | 'medium' | 'low'
  created_at: string
  reply?: string
  reply_date?: string
}

export default function HostInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [hostData, setHostData] = useState<any>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    const userData = sessionStorage.getItem('hostUser')
    if (userData) {
      const parsedData = JSON.parse(userData)
      setHostData(parsedData)
      loadInquiries(parsedData.host_id)
    }
  }, [])

  const loadInquiries = async (hostId: string) => {
    try {
      setLoading(true)
      
      let url = `/api/inquiries?userId=${hostId}&limit=100`
      
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`
      }
      
      const response = await fetch(url)
      const result = await response.json()
      
      if (result.success && result.data) {
        const mappedInquiries = result.data.map((inquiry: any) => ({
          id: inquiry.id,
          guest_name: inquiry.inquirer_name,
          guest_phone: inquiry.inquirer_phone || '',
          guest_email: inquiry.inquirer_email,
          accommodation_name: inquiry.accommodation_name,
          subject: inquiry.title,
          message: inquiry.content,
          status: inquiry.status,
          priority: inquiry.priority || 'medium',
          created_at: inquiry.created_at,
          reply: inquiry.inquiry_replies && inquiry.inquiry_replies.length > 0 
            ? inquiry.inquiry_replies[inquiry.inquiry_replies.length - 1].content 
            : undefined,
          reply_date: inquiry.inquiry_replies && inquiry.inquiry_replies.length > 0 
            ? inquiry.inquiry_replies[inquiry.inquiry_replies.length - 1].created_at
            : undefined
        }))
        
        let filteredInquiries = mappedInquiries

        // 우선순위 필터 적용
        if (priorityFilter !== 'all') {
          filteredInquiries = filteredInquiries.filter((i: any) => i.priority === priorityFilter)
        }

        // 검색 필터 적용
        if (searchQuery) {
          filteredInquiries = filteredInquiries.filter((i: any) => 
            i.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            i.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.guest_phone.includes(searchQuery) ||
            i.guest_email.toLowerCase().includes(searchQuery.toLowerCase())
          )
        }

        setInquiries(filteredInquiries)
      } else {
        console.log('문의사항이 없거나 API 호출 실패')
        setInquiries([])
      }
    } catch (error) {
      console.error('문의 목록 로드 실패:', error)
      setInquiries([])
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    if (hostData) {
      const timeoutId = setTimeout(() => {
        loadInquiries(hostData.host_id)
      }, 300)

      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery, statusFilter, priorityFilter, hostData])

  const handleReply = async (inquiryId: string) => {
    if (!replyText.trim()) return

    try {
      const response = await fetch(`/api/inquiries/${inquiryId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyText,
          authorId: hostData?.host_id || 'host-001',
          authorName: hostData?.host_name || '호스트',
          isAdminReply: false
        })
      })

      const result = await response.json()

      if (result.success) {
        await loadInquiries(hostData?.host_id)
        setReplyingTo(null)
        setReplyText('')
        alert('답변이 등록되었습니다.')
      } else {
        alert('답변 등록에 실패했습니다.')
      }
    } catch (error) {
      console.error('답변 등록 실패:', error)
      alert('답변 등록에 실패했습니다.')
    }
  }

  const handleStatusChange = async (inquiryId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        })
      })

      const result = await response.json()

      if (result.success) {
        await loadInquiries(hostData?.host_id)
        alert('상태가 변경되었습니다.')
      } else {
        alert('상태 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('상태 변경 실패:', error)
      alert('상태 변경에 실패했습니다.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'answered': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '답변대기'
      case 'answered': return '답변완료'
      case 'closed': return '종료'
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'answered': return <CheckCircle className="w-4 h-4" />
      case 'closed': return <CheckCircle className="w-4 h-4" />
      default: return null
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '긴급'
      case 'medium': return '보통'
      case 'low': return '낮음'
      default: return priority
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4" />
      case 'medium': return <Clock className="w-4 h-4" />
      case 'low': return <CheckCircle className="w-4 h-4" />
      default: return null
    }
  }

  const pendingCount = inquiries.filter(i => i.status === 'pending').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">게스트 문의</h1>
          <p className="text-sm text-gray-600 mt-1">
            총 {inquiries.length}개의 문의 • 답변 대기: {pendingCount}개
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-red-100 text-red-800 px-3 py-1">
            새 문의 {pendingCount}건
          </Badge>
        )}
      </div>

      {/* 검색 및 필터 */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-white">
          <CardTitle className="text-gray-900">검색 및 필터</CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="게스트명, 제목, 내용, 연락처로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-300 bg-white"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px] border-gray-300 bg-white">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="pending">답변대기</SelectItem>
                <SelectItem value="answered">답변완료</SelectItem>
                <SelectItem value="closed">종료</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-[150px] border-gray-300 bg-white">
                <SelectValue placeholder="우선순위" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="all">전체 우선순위</SelectItem>
                <SelectItem value="high">긴급</SelectItem>
                <SelectItem value="medium">보통</SelectItem>
                <SelectItem value="low">낮음</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 문의 목록 */}
      <div className="space-y-4">
        {loading ? (
          <Card className="border shadow-sm">
            <CardContent className="p-8 text-center bg-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </CardContent>
          </Card>
        ) : inquiries.length === 0 ? (
          <Card className="border shadow-sm">
            <CardContent className="p-12 text-center bg-white">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">문의가 없습니다</h3>
              <p className="text-gray-500">검색 조건을 변경해보세요</p>
            </CardContent>
          </Card>
        ) : (
          inquiries.map((inquiry) => (
            <Card key={inquiry.id} className="border shadow-sm">
              <CardHeader className="bg-white border-b">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{inquiry.guest_name}</h3>
                        <p className="text-sm text-gray-500">{inquiry.accommodation_name || '일반 문의'}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge className={`flex items-center gap-1 ${getStatusColor(inquiry.status)}`}>
                        {getStatusIcon(inquiry.status)}
                        {getStatusText(inquiry.status)}
                      </Badge>
                      <Badge className={`flex items-center gap-1 ${getPriorityColor(inquiry.priority)}`}>
                        {getPriorityIcon(inquiry.priority)}
                        {getPriorityText(inquiry.priority)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{inquiry.guest_phone}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span>{inquiry.guest_email}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(inquiry.created_at).toLocaleDateString('ko-KR')}
                    </div>
                    {inquiry.status === 'answered' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(inquiry.id, 'closed')}
                        className="text-gray-600 border-gray-300 hover:bg-gray-50"
                      >
                        종료
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 bg-white">
                <div className="space-y-4">
                  {/* 문의 제목과 내용 */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{inquiry.subject}</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-line">{inquiry.message}</p>
                    </div>
                  </div>

                  {/* 호스트 답변 */}
                  {inquiry.reply ? (
                    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                      <div className="flex items-center gap-2 mb-2">
                        <Reply className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">답변</span>
                        {inquiry.reply_date && (
                          <span className="text-xs text-gray-500">
                            {new Date(inquiry.reply_date).toLocaleDateString('ko-KR')}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-800 whitespace-pre-line">{inquiry.reply}</p>
                    </div>
                  ) : inquiry.status === 'pending' && (
                    <div className="space-y-3">
                      {replyingTo === inquiry.id ? (
                        <div className="space-y-3">
                          <Textarea
                            placeholder="정성스러운 답변을 작성해주세요..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="bg-white border-gray-300"
                            rows={4}
                          />
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              onClick={() => handleReply(inquiry.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              답변 등록
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setReplyingTo(null)
                                setReplyText('')
                              }}
                            >
                              취소
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setReplyingTo(inquiry.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Reply className="w-4 h-4 mr-2" />
                          답변 작성
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}