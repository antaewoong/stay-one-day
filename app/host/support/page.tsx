'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  MessageCircleQuestion, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Phone,
  Mail,
  HelpCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { hostGet, hostPost } from '@/lib/host-api'

interface Inquiry {
  id: string
  title: string
  category: string
  content: string
  status: 'pending' | 'processing' | 'completed'
  created_at: string
  admin_reply?: string
  admin_reply_date?: string
}

export default function HostSupportPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [hostData, setHostData] = useState<any>(null)
  
  const [newInquiry, setNewInquiry] = useState({
    title: '',
    category: '',
    content: ''
  })

  useEffect(() => {
    const userData = sessionStorage.getItem('hostUser')
    if (userData) {
      const parsedData = JSON.parse(userData)
      setHostData(parsedData)
      loadInquiries(parsedData.id)
    }
  }, [])

  const loadInquiries = async (hostId: string) => {
    try {
      const response = await hostGet(`/api/host/inquiries?hostId=${hostId}`)
      const result = await response.json()
      
      if (result.success) {
        setInquiries(result.data || [])
      }
    } catch (error) {
      console.error('문의 내역 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitInquiry = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newInquiry.title.trim() || !newInquiry.category || !newInquiry.content.trim()) {
      toast.error('모든 필드를 입력해주세요')
      return
    }

    if (!hostData?.id) {
      toast.error('로그인 정보가 없습니다')
      return
    }

    setSubmitting(true)

    try {
      const response = await hostPost('/api/host/inquiries', {
        hostId: hostData.id,
        title: newInquiry.title.trim(),
        category: newInquiry.category,
        content: newInquiry.content.trim()
      })

      const result = await response.json()

      if (result.success) {
        toast.success('문의가 성공적으로 등록되었습니다')
        setNewInquiry({ title: '', category: '', content: '' })
        loadInquiries(hostData.id)
      } else {
        toast.error(result.error || '문의 등록에 실패했습니다')
      }
    } catch (error) {
      console.error('문의 등록 실패:', error)
      toast.error('서버 오류가 발생했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200"><Clock className="w-3 h-3 mr-1" />대기중</Badge>
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><AlertCircle className="w-3 h-3 mr-1" />처리중</Badge>
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />완료</Badge>
      default:
        return <Badge variant="secondary">알 수 없음</Badge>
    }
  }

  const getCategoryLabel = (category: string) => {
    const categories: { [key: string]: string } = {
      'accommodation': '숙소 관련',
      'reservation': '예약 관련',
      'payment': '결제/정산',
      'technical': '기술 문제',
      'other': '기타'
    }
    return categories[category] || category
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">문의 내역을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* 페이지 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-800 to-emerald-800 bg-clip-text text-transparent">
            호스트 고객센터
          </h1>
          <p className="text-slate-600 mt-2">궁금한 사항이나 문제가 있으시면 언제든지 문의해주세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 새 문의 등록 */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-800 to-emerald-800 bg-clip-text text-transparent flex items-center">
                  <MessageCircleQuestion className="w-6 h-6 mr-3 text-green-600" />
                  새 문의 등록
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={submitInquiry} className="space-y-4">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title" className="text-sm font-semibold text-slate-700">문의 제목</Label>
                      <Input
                        id="title"
                        value={newInquiry.title}
                        onChange={(e) => setNewInquiry(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="문의 제목을 입력하세요"
                        className="border-slate-300 focus:border-green-500 focus:ring-green-500"
                        disabled={submitting}
                      />
                    </div>

                    <div>
                      <Label htmlFor="category" className="text-sm font-semibold text-slate-700">문의 분류</Label>
                      <Select
                        value={newInquiry.category}
                        onValueChange={(value) => setNewInquiry(prev => ({ ...prev, category: value }))}
                        disabled={submitting}
                      >
                        <SelectTrigger className="border-slate-300 focus:border-green-500 focus:ring-green-500">
                          <SelectValue placeholder="문의 분류를 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="accommodation">숙소 관련</SelectItem>
                          <SelectItem value="reservation">예약 관련</SelectItem>
                          <SelectItem value="payment">결제/정산</SelectItem>
                          <SelectItem value="technical">기술 문제</SelectItem>
                          <SelectItem value="other">기타</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="content" className="text-sm font-semibold text-slate-700">문의 내용</Label>
                    <Textarea
                      id="content"
                      value={newInquiry.content}
                      onChange={(e) => setNewInquiry(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="문의 내용을 상세히 작성해주세요"
                      rows={6}
                      className="border-slate-300 focus:border-green-500 focus:ring-green-500"
                      disabled={submitting}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting || !newInquiry.title.trim() || !newInquiry.category || !newInquiry.content.trim()}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 shadow-lg"
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        문의 등록 중...
                      </div>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        문의 등록하기
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* 고객센터 정보 */}
          <div className="space-y-6">
            
            {/* 연락처 정보 */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <CardTitle className="text-lg font-bold bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent flex items-center">
                  <Phone className="w-5 h-5 mr-3 text-blue-600" />
                  긴급 연락처
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center text-sm">
                  <Phone className="w-4 h-4 text-blue-600 mr-3" />
                  <div>
                    <div className="font-medium text-slate-800">고객센터</div>
                    <div className="text-slate-600">1588-1234</div>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <Mail className="w-4 h-4 text-green-600 mr-3" />
                  <div>
                    <div className="font-medium text-slate-800">이메일</div>
                    <div className="text-slate-600">support@stayoneday.com</div>
                  </div>
                </div>
                <div className="text-xs text-slate-500 mt-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-3 h-3 inline mr-1" />
                  운영시간: 평일 09:00~18:00 (토/일/공휴일 휴무)
                </div>
              </CardContent>
            </Card>

            {/* FAQ */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                <CardTitle className="text-lg font-bold bg-gradient-to-r from-purple-800 to-pink-800 bg-clip-text text-transparent flex items-center">
                  <HelpCircle className="w-5 h-5 mr-3 text-purple-600" />
                  자주 묻는 질문
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="text-sm space-y-2">
                  <div className="font-medium text-slate-800">Q. 정산은 언제 받나요?</div>
                  <div className="text-slate-600 text-xs pl-3">A. 매월 15일에 전월 수익을 정산합니다.</div>
                </div>
                <hr className="border-slate-100" />
                <div className="text-sm space-y-2">
                  <div className="font-medium text-slate-800">Q. 예약 취소 시 수수료는?</div>
                  <div className="text-slate-600 text-xs pl-3">A. 취소 정책에 따라 수수료가 차등 적용됩니다.</div>
                </div>
                <hr className="border-slate-100" />
                <div className="text-sm space-y-2">
                  <div className="font-medium text-slate-800">Q. 숙소 정보 수정은 어떻게?</div>
                  <div className="text-slate-600 text-xs pl-3">A. 숙소 관리 메뉴에서 직접 수정 가능합니다.</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 문의 내역 */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-800 to-gray-800 bg-clip-text text-transparent">
              내 문의 내역
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {inquiries.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircleQuestion className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">아직 등록한 문의가 없습니다</p>
                <p className="text-sm text-slate-400 mt-2">궁금한 사항이 있으시면 언제든지 문의해주세요!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {inquiries.map((inquiry) => (
                  <div key={inquiry.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50/50 transition-all duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-slate-800">{inquiry.title}</h3>
                          {getStatusBadge(inquiry.status)}
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                            {getCategoryLabel(inquiry.category)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{inquiry.content}</p>
                        <p className="text-xs text-slate-400">
                          등록일: {new Date(inquiry.created_at).toLocaleString('ko-KR')}
                        </p>
                      </div>
                    </div>
                    
                    {inquiry.admin_reply && (
                      <div className="mt-4 p-3 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
                        <div className="flex items-center mb-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mr-2" />
                          <span className="text-sm font-medium text-green-800">관리자 답변</span>
                          <span className="text-xs text-green-600 ml-auto">
                            {new Date(inquiry.admin_reply_date!).toLocaleString('ko-KR')}
                          </span>
                        </div>
                        <p className="text-sm text-green-700">{inquiry.admin_reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}