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

  const hostId = '550e8400-e29b-41d4-a716-446655440000' // 임시 호스트 ID

  useEffect(() => {
    loadCollaborationRequests()
  }, [statusFilter])

  const loadCollaborationRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/host/collaboration-requests?host_id=${hostId}&status=${statusFilter}&limit=50`)
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
          host_id: hostId
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
        return <Badge variant="outline" className="text-yellow-600">대기중</Badge>
      case 'accepted':
        return <Badge variant="default" className="bg-green-600">승인됨</Badge>
      case 'rejected':
        return <Badge variant="destructive">거부됨</Badge>
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
                   status === 'pending' ? '대기중' :
                   status === 'accepted' ? '승인됨' : '거부됨'}
                </Button>
              ))}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {statusFilter === 'all' ? '협업 요청이 없습니다.' : `${statusFilter} 상태의 협업 요청이 없습니다.`}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>인플루언서</TableHead>
                    <TableHead>숙소</TableHead>
                    <TableHead>일정</TableHead>
                    <TableHead>협업 유형</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="w-32">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={request.influencer.profile_image_url} />
                            <AvatarFallback>
                              {request.influencer.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{request.influencer.name}</div>
                            <div className="text-sm text-gray-600">
                              팔로워 {request.influencer.follower_count?.toLocaleString()}명
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.accommodation.name}</div>
                          <div className="text-sm text-gray-600">{request.accommodation.location}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(new Date(request.check_in_date), 'MM/dd', { locale: ko })} - {format(new Date(request.check_out_date), 'MM/dd', { locale: ko })}</div>
                          <div className="text-gray-600">{request.guest_count}명</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getRequestTypeBadge(request.request_type)}
                          {request.proposed_rate && (
                            <div className="text-sm text-gray-600">₩{request.proposed_rate.toLocaleString()}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(request.status)}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedRequest(request)}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              상세
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>협업 요청 상세</DialogTitle>
                            </DialogHeader>
                            
                            {selectedRequest && (
                              <div className="space-y-6">
                                {/* 인플루언서 정보 */}
                                <div className="bg-blue-50 p-4 rounded-lg">
                                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    인플루언서 정보
                                  </h3>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                      <Mail className="w-4 h-4 text-gray-400" />
                                      {selectedRequest.influencer.email}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-4 h-4 text-gray-400" />
                                      {selectedRequest.influencer.phone}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-4 h-4 text-gray-400" />
                                      {selectedRequest.influencer.location}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <TrendingUp className="w-4 h-4 text-gray-400" />
                                      참여율 {selectedRequest.influencer.engagement_rate}%
                                    </div>
                                    {selectedRequest.influencer.instagram_handle && (
                                      <div className="flex items-center gap-2">
                                        <Instagram className="w-4 h-4 text-gray-400" />
                                        {selectedRequest.influencer.instagram_handle}
                                      </div>
                                    )}
                                    {selectedRequest.influencer.youtube_channel && (
                                      <div className="flex items-center gap-2">
                                        <Youtube className="w-4 h-4 text-gray-400" />
                                        {selectedRequest.influencer.youtube_channel}
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-2">
                                    <span className="text-sm font-medium">콘텐츠 카테고리: </span>
                                    <span className="text-sm">{selectedRequest.influencer.content_category?.join(', ')}</span>
                                  </div>
                                </div>

                                {/* 협업 요청 내용 */}
                                <div>
                                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4" />
                                    협업 요청 메시지
                                  </h3>
                                  <div className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap">
                                    {selectedRequest.message || '메시지가 없습니다.'}
                                  </div>
                                </div>

                                {/* 승인/거부 (pending 상태일 때만) */}
                                {selectedRequest.status === 'pending' && (
                                  <div>
                                    <h3 className="font-semibold mb-3">호스트 메모 (선택사항)</h3>
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