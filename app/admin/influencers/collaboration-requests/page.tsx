'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Users, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Instagram, 
  Youtube, 
  MessageCircle,
  Check,
  X,
  Loader2,
  Eye,
  TrendingUp,
  Search,
  Filter
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'react-hot-toast'
import { apiFetch } from '@/lib/auth-helpers'

interface CollaborationRequest {
  id: string
  request_type: 'paid' | 'barter' | 'partnership'
  proposed_rate: number | null
  message: string
  check_in_date: string
  check_out_date: string
  guest_count: number
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  admin_notes: string | null
  influencer: {
    id: string
    name: string
    email: string
    phone: string
    instagram_handle: string
    youtube_channel: string
    tiktok_handle: string
    follower_count: number
    engagement_rate: number
    content_category: string[]
    profile_image_url: string
    location: string
  }
  accommodation: {
    id: string
    name: string
    location: string
    price_per_night: number
    images: string[]
  }
  host: {
    id: string
    business_name: string
    representative_name: string
    phone: string
    email: string
  }
}

export default function AdminCollaborationRequestsPage() {
  const [requests, setRequests] = useState<CollaborationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<CollaborationRequest | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    loadCollaborationRequests()
  }, [statusFilter])

  const loadCollaborationRequests = async () => {
    try {
      setLoading(true)
      const result = await apiFetch(`/api/admin/collaboration-requests?status=${statusFilter}&limit=100`)
      
      if (result.success) {
        setRequests(result.data)
      } else {
        toast.error(result.error || '협업 요청을 불러올 수 없습니다')
      }
    } catch (error) {
      console.error('협업 요청 로드 실패:', error)
      toast.error('서버 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestAction = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      setProcessing(requestId)
      
      const result = await apiFetch('/api/admin/collaboration-requests', {
        method: 'PUT',
        body: JSON.stringify({
          request_id: requestId,
          status,
          admin_notes: adminNotes
        })
      })
      
      if (result.success) {
        toast.success(result.message)
        setSelectedRequest(null)
        setAdminNotes('')
        await loadCollaborationRequests()
      } else {
        toast.error(result.error || '처리에 실패했습니다')
      }
    } catch (error) {
      console.error('협업 요청 처리 실패:', error)
      toast.error('서버 오류가 발생했습니다')
    } finally {
      setProcessing(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">승인대기</Badge>
      case 'accepted':
        return <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">승인완료</Badge>
      case 'rejected':
        return <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">승인거절</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getRequestTypeBadge = (type: string) => {
    switch (type) {
      case 'barter':
        return <Badge variant="secondary">물물교환</Badge>
      case 'paid':
        return <Badge variant="default">유료협업</Badge>
      case 'partnership':
        return <Badge variant="outline">파트너십</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  const filteredRequests = requests.filter(request => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        request.influencer.name.toLowerCase().includes(searchLower) ||
        request.accommodation.name.toLowerCase().includes(searchLower) ||
        request.host.business_name.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>로딩 중...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>인플루언서 협업 신청 관리</span>
            <div className="flex gap-4 items-center">
              {/* 검색 */}
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-500" />
                <Input
                  placeholder="인플루언서명, 숙소명, 호스트명 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              
              {/* 필터 */}
              <div className="flex gap-2">
                {['all', 'pending', 'accepted', 'rejected'].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status === 'all' ? '전체' : 
                     status === 'pending' ? '승인대기' :
                     status === 'accepted' ? '승인완료' : '승인거절'}
                  </Button>
                ))}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm ? '검색 결과가 없습니다.' : 
               statusFilter === 'all' ? '협업 요청이 없습니다.' : 
               statusFilter === 'pending' ? '승인대기 중인 협업 요청이 없습니다.' :
               statusFilter === 'accepted' ? '승인완료된 협업 요청이 없습니다.' : 
               '승인거절된 협업 요청이 없습니다.'}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>인플루언서</TableHead>
                    <TableHead>숙소정보</TableHead>
                    <TableHead>호스트</TableHead>
                    <TableHead>신청일</TableHead>
                    <TableHead>이용일</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>인원</TableHead>
                    <TableHead>액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id} className="hover:bg-gray-50">
                      {/* 인플루언서 */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={request.influencer.profile_image_url} />
                            <AvatarFallback>
                              {request.influencer.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{request.influencer.name}</div>
                            <div className="text-sm text-gray-600">{request.influencer.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      
                      {/* 숙소정보 */}
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.accommodation.name}</div>
                          <div className="text-sm text-gray-600">{request.accommodation.location}</div>
                        </div>
                      </TableCell>
                      
                      {/* 호스트 */}
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.host.business_name}</div>
                          <div className="text-sm text-gray-600">{request.host.representative_name}</div>
                        </div>
                      </TableCell>
                      
                      {/* 신청일 */}
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(request.created_at), 'MM/dd HH:mm', { locale: ko })}
                        </div>
                      </TableCell>
                      
                      {/* 이용일 */}
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(request.check_in_date), 'MM/dd', { locale: ko })}
                        </div>
                      </TableCell>
                      
                      {/* 상태 */}
                      <TableCell>
                        {getStatusBadge(request.status)}
                      </TableCell>
                      
                      {/* 유형 */}
                      <TableCell>
                        {getRequestTypeBadge(request.request_type)}
                      </TableCell>
                      
                      {/* 인원 */}
                      <TableCell>
                        <div className="text-sm flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {request.guest_count}명
                        </div>
                      </TableCell>
                      
                      {/* 액션 */}
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              상세보기
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>협업 요청 상세 정보</DialogTitle>
                            </DialogHeader>
                            
                            {selectedRequest && (
                              <div className="space-y-6">
                                {/* 인플루언서 정보 */}
                                <div className="grid grid-cols-2 gap-4">
                                  <Card>
                                    <CardHeader className="pb-3">
                                      <CardTitle className="text-sm">인플루언서 정보</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Avatar className="w-8 h-8">
                                          <AvatarImage src={selectedRequest.influencer.profile_image_url} />
                                          <AvatarFallback>{selectedRequest.influencer.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{selectedRequest.influencer.name}</span>
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        <div><Mail className="w-4 h-4 inline mr-1" />{selectedRequest.influencer.email}</div>
                                        <div><Phone className="w-4 h-4 inline mr-1" />{selectedRequest.influencer.phone}</div>
                                        <div><MapPin className="w-4 h-4 inline mr-1" />{selectedRequest.influencer.location}</div>
                                      </div>
                                      {selectedRequest.influencer.instagram_handle && (
                                        <div className="text-sm"><Instagram className="w-4 h-4 inline mr-1" />{selectedRequest.influencer.instagram_handle}</div>
                                      )}
                                      {selectedRequest.influencer.youtube_channel && (
                                        <div className="text-sm"><Youtube className="w-4 h-4 inline mr-1" />{selectedRequest.influencer.youtube_channel}</div>
                                      )}
                                    </CardContent>
                                  </Card>
                                  
                                  <Card>
                                    <CardHeader className="pb-3">
                                      <CardTitle className="text-sm">숙소 & 호스트 정보</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                      <div>
                                        <div className="font-medium">{selectedRequest.accommodation.name}</div>
                                        <div className="text-sm text-gray-600">{selectedRequest.accommodation.location}</div>
                                      </div>
                                      <div className="border-t pt-2">
                                        <div className="font-medium">{selectedRequest.host.business_name}</div>
                                        <div className="text-sm text-gray-600">{selectedRequest.host.representative_name}</div>
                                        <div className="text-sm text-gray-600">
                                          <Phone className="w-4 h-4 inline mr-1" />{selectedRequest.host.phone}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>

                                {/* 요청 상세 */}
                                <Card>
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">요청 상세 정보</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div><span className="font-medium">신청일:</span> {format(new Date(selectedRequest.created_at), 'PPP HH:mm', { locale: ko })}</div>
                                      <div><span className="font-medium">이용일:</span> {format(new Date(selectedRequest.check_in_date), 'PPP', { locale: ko })}</div>
                                      <div><span className="font-medium">인원:</span> {selectedRequest.guest_count}명</div>
                                      <div><span className="font-medium">유형:</span> {getRequestTypeBadge(selectedRequest.request_type)}</div>
                                    </div>
                                    {selectedRequest.proposed_rate && (
                                      <div className="text-sm"><span className="font-medium">제안단가:</span> {selectedRequest.proposed_rate.toLocaleString()}원</div>
                                    )}
                                    <div>
                                      <div className="font-medium text-sm mb-2">요청 메시지</div>
                                      <div className="bg-gray-50 p-3 rounded-lg text-sm whitespace-pre-wrap">
                                        {selectedRequest.message || '메시지가 없습니다.'}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* 관리자 메모 */}
                                {selectedRequest.status === 'pending' && (
                                  <div>
                                    <Label htmlFor="admin-notes" className="text-sm font-medium">관리자 메모 (선택사항)</Label>
                                    <Textarea
                                      id="admin-notes"
                                      value={adminNotes}
                                      onChange={(e) => setAdminNotes(e.target.value)}
                                      placeholder="협업 승인/거부에 대한 메모를 작성해주세요..."
                                      rows={3}
                                      className="mt-2"
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            <DialogFooter className="gap-2">
                              {selectedRequest?.status === 'pending' && (
                                <>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleRequestAction(selectedRequest.id, 'rejected')}
                                    disabled={processing === selectedRequest.id}
                                  >
                                    {processing === selectedRequest.id ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <X className="mr-2 h-4 w-4" />
                                    )}
                                    거부
                                  </Button>
                                  <Button
                                    onClick={() => handleRequestAction(selectedRequest.id, 'accepted')}
                                    disabled={processing === selectedRequest.id}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    {processing === selectedRequest.id ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <Check className="mr-2 h-4 w-4" />
                                    )}
                                    승인
                                  </Button>
                                </>
                              )}
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
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