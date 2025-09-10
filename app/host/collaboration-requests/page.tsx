'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  TrendingUp
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'react-hot-toast'

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
}

export default function HostCollaborationRequestsPage() {
  const [requests, setRequests] = useState<CollaborationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedRequest, setSelectedRequest] = useState<CollaborationRequest | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [hostNotes, setHostNotes] = useState('')

  const [hostData, setHostData] = useState<any>(null)

  useEffect(() => {
    // 호스트 정보 확인
    const userData = sessionStorage.getItem('hostUser')
    if (userData) {
      const parsedData = JSON.parse(userData)
      setHostData(parsedData)
    }
  }, [])

  useEffect(() => {
    if (hostData?.id) {
      loadCollaborationRequests()
    }
  }, [hostData, statusFilter])

  const loadCollaborationRequests = async () => {
    if (!hostData?.id) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/host/collaboration-requests?host_id=${hostData.id}&status=${statusFilter}&limit=50`)
      const result = await response.json()
      
      if (result.success) {
        setRequests(result.data)
      } else {
        toast.error('협업 요청을 불러올 수 없습니다')
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
      
      const response = await fetch('/api/host/collaboration-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestId,
          status,
          host_notes: hostNotes,
          host_id: hostData?.id
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success(result.message)
        setSelectedRequest(null)
        setHostNotes('')
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
            <span>인플루언서 협업 요청</span>
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {statusFilter === 'all' ? '협업 요청이 없습니다.' : 
               statusFilter === 'pending' ? '승인대기 중인 협업 요청이 없습니다.' :
               statusFilter === 'accepted' ? '승인완료된 협업 요청이 없습니다.' : 
               '승인거절된 협업 요청이 없습니다.'}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>인플루언서명</TableHead>
                    <TableHead>스테이명</TableHead>
                    <TableHead>신청일</TableHead>
                    <TableHead>이용희망일</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>연락처</TableHead>
                    <TableHead>인원</TableHead>
                    <TableHead>유무상</TableHead>
                    <TableHead>참여율</TableHead>
                    <TableHead>요청메모</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request, index) => (
                    <TableRow key={request.id} className="hover:bg-gray-50">
                      {/* # */}
                      <TableCell className="text-center text-sm">
                        {index + 1}
                      </TableCell>
                      
                      {/* 인플루언서명 (클릭 시 채널 정보 모달) */}
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="link" className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800">
                              {request.influencer.name}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>인플루언서 채널 정보</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-12 h-12">
                                  <AvatarImage src={request.influencer.profile_image_url} />
                                  <AvatarFallback>
                                    {request.influencer.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-lg">{request.influencer.name}</div>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm">팔로워: {request.influencer.follower_count?.toLocaleString()}명</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm">참여율: {request.influencer.engagement_rate}%</span>
                                </div>
                                
                                {request.influencer.instagram_handle && (
                                  <div className="flex items-center gap-2">
                                    <Instagram className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm">{request.influencer.instagram_handle}</span>
                                  </div>
                                )}
                                
                                {request.influencer.youtube_channel && (
                                  <div className="flex items-center gap-2">
                                    <Youtube className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm">{request.influencer.youtube_channel}</span>
                                  </div>
                                )}
                                
                                <div className="text-sm">
                                  <span className="font-medium">콘텐츠 카테고리: </span>
                                  <span>{request.influencer.content_category?.join(', ')}</span>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      
                      {/* 스테이명 */}
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.accommodation.name}</div>
                          <div className="text-sm text-gray-600">{request.accommodation.location}</div>
                        </div>
                      </TableCell>
                      
                      {/* 신청일 */}
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(request.created_at), 'MM/dd', { locale: ko })}
                        </div>
                      </TableCell>
                      
                      {/* 이용희망일 */}
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(request.check_in_date), 'MM/dd', { locale: ko })}
                        </div>
                      </TableCell>
                      
                      {/* 상태 */}
                      <TableCell>
                        {getStatusBadge(request.status)}
                      </TableCell>
                      
                      {/* 연락처 */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">{request.influencer.phone}</div>
                          <div className="text-xs text-gray-600">{request.influencer.email}</div>
                        </div>
                      </TableCell>
                      
                      {/* 희망인원 */}
                      <TableCell>
                        <div className="text-sm flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {request.guest_count}명
                        </div>
                      </TableCell>
                      
                      {/* 유상/무상 */}
                      <TableCell>
                        {request.request_type === 'free' ? (
                          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">무상</Badge>
                        ) : request.request_type === 'paid' ? (
                          <Badge variant="outline" className="text-purple-700 border-purple-300 bg-purple-50">유상</Badge>
                        ) : (
                          <Badge variant="secondary">기타</Badge>
                        )}
                      </TableCell>
                      
                      {/* 인게이지먼트 */}
                      <TableCell>
                        <div className="text-center">
                          <div className="text-sm font-medium">{request.influencer.engagement_rate}%</div>
                          <div className="text-xs text-gray-500">참여율</div>
                        </div>
                      </TableCell>
                      
                      {/* 요청메모 (클릭 시 모달) */}
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                            >
                              <MessageCircle className="mr-1 h-3 w-3" />
                              메모보기
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-xl">
                            <DialogHeader>
                              <DialogTitle>협업 요청 메모</DialogTitle>
                            </DialogHeader>
                            
                            {selectedRequest && (
                              <div className="space-y-4">
                                {/* 기본 정보 */}
                                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                                  <div><span className="font-medium">신청자:</span> {selectedRequest.influencer.name}</div>
                                  <div><span className="font-medium">숙소:</span> {selectedRequest.accommodation.name}</div>
                                  <div><span className="font-medium">이용일:</span> {format(new Date(selectedRequest.check_in_date), 'PPP', { locale: ko })}</div>
                                </div>

                                {/* 협업 요청 메시지 */}
                                <div>
                                  <h3 className="font-semibold mb-2">인플루언서 요청 메시지</h3>
                                  <div className="bg-blue-50 p-4 rounded-lg text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                                    {selectedRequest.message || '메시지가 없습니다.'}
                                  </div>
                                </div>

                                {/* 승인/거부 (pending 상태일 때만) */}
                                {selectedRequest.status === 'pending' && (
                                  <div>
                                    <h3 className="font-semibold mb-2">호스트 메모 (선택사항)</h3>
                                    <Textarea
                                      value={hostNotes}
                                      onChange={(e) => setHostNotes(e.target.value)}
                                      placeholder="협업 승인/거부에 대한 메모를 작성해주세요..."
                                      rows={3}
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