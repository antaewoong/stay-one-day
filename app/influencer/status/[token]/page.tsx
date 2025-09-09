'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  MapPin, 
  Users, 
  Loader2,
  ExternalLink,
  FileText,
  Star,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface CollaborationStatus {
  id: string
  request_type: 'paid' | 'barter' | 'partnership'
  proposed_rate: number | null
  message: string
  check_in_date: string
  check_out_date: string
  guest_count: number
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
  final_status: 'pending' | 'in_progress' | 'review_pending' | 'completed'
  admin_notes: string | null
  review_submitted_at: string | null
  review_content: string | null
  review_links: any
  created_at: string
  updated_at: string
  influencer: {
    name: string
    email: string
  }
  accommodation: {
    name: string
    location: string
    price_per_night: number
    images: string[]
  }
  host: {
    business_name: string
    name: string
  }
}

export default function InfluencerStatusPage() {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [collaborations, setCollaborations] = useState<CollaborationStatus[]>([])
  const [influencerInfo, setInfluencerInfo] = useState<any>(null)

  useEffect(() => {
    loadInfluencerStatus()
  }, [token])

  const loadInfluencerStatus = async () => {
    try {
      const response = await fetch(`/api/influencer/status/${token}`)
      const result = await response.json()
      
      if (result.success) {
        setInfluencerInfo(result.influencer)
        setCollaborations(result.collaborations)
      } else {
        alert('유효하지 않은 링크입니다.')
      }
    } catch (error) {
      console.error('상태 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string, final_status: string) => {
    if (status === 'pending') {
      return <Badge variant="outline" className="text-yellow-600"><Clock className="mr-1 w-3 h-3" />승인 대기</Badge>
    } else if (status === 'rejected') {
      return <Badge variant="destructive"><XCircle className="mr-1 w-3 h-3" />거부됨</Badge>
    } else if (status === 'accepted') {
      switch (final_status) {
        case 'pending':
        case 'in_progress':
          return <Badge variant="default" className="bg-blue-600"><CheckCircle className="mr-1 w-3 h-3" />승인됨 - 예약 확정</Badge>
        case 'review_pending':
          return <Badge variant="default" className="bg-orange-600"><FileText className="mr-1 w-3 h-3" />리뷰 검토 중</Badge>
        case 'completed':
          return <Badge variant="default" className="bg-green-600"><Star className="mr-1 w-3 h-3" />협업 완료</Badge>
        default:
          return <Badge variant="default"><CheckCircle className="mr-1 w-3 h-3" />승인됨</Badge>
      }
    } else {
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

  const generateReviewToken = (collaborationId: string) => {
    // 실제로는 서버에서 생성해야 하지만, 여기서는 간단히 처리
    return `review-${collaborationId}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>로딩 중...</span>
        </div>
      </div>
    )
  }

  if (!influencerInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">접근 불가</h2>
            <p className="text-gray-600">유효하지 않은 링크이거나 만료된 링크입니다.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl text-center">스테이 원데이 협업 현황</CardTitle>
            <div className="text-center text-gray-600">
              <p>안녕하세요, <span className="font-semibold text-blue-600">{influencerInfo.name}</span>님!</p>
              <p className="text-sm mt-1">현재 협업 신청 및 진행 현황을 확인하실 수 있습니다.</p>
            </div>
          </CardHeader>
        </Card>

        {collaborations.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">협업 신청 내역이 없습니다</h3>
              <p className="text-gray-600">아직 협업을 신청하지 않으셨거나, 협업 링크를 통해 신청해주세요.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {collaborations.map((collaboration) => (
              <Card key={collaboration.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{collaboration.accommodation.name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <MapPin className="w-4 h-4" />
                        {collaboration.accommodation.location}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      {getStatusBadge(collaboration.status, collaboration.final_status)}
                      {getRequestTypeBadge(collaboration.request_type)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* 예약 정보 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">체크인</div>
                        <div className="text-sm text-gray-600">
                          {format(new Date(collaboration.check_in_date), 'PPP', { locale: ko })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">체크아웃</div>
                        <div className="text-sm text-gray-600">
                          {format(new Date(collaboration.check_out_date), 'PPP', { locale: ko })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">인원</div>
                        <div className="text-sm text-gray-600">{collaboration.guest_count}명</div>
                      </div>
                    </div>
                  </div>

                  {/* 협업 메시지 */}
                  {collaboration.message && (
                    <div>
                      <h4 className="font-medium mb-2">협업 신청 메시지</h4>
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                        {collaboration.message}
                      </div>
                    </div>
                  )}

                  {/* 호스트 메모 (거부된 경우) */}
                  {collaboration.status === 'rejected' && collaboration.admin_notes && (
                    <div>
                      <h4 className="font-medium mb-2 text-red-600">거부 사유</h4>
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg whitespace-pre-wrap">
                        {collaboration.admin_notes}
                      </div>
                    </div>
                  )}

                  {/* 승인된 경우 - 호스트 정보 */}
                  {collaboration.status === 'accepted' && (
                    <div>
                      <h4 className="font-medium mb-2">호스트 정보</h4>
                      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                        <div><span className="font-medium">업체명:</span> {collaboration.host.business_name}</div>
                        <div><span className="font-medium">담당자:</span> {collaboration.host.name}</div>
                      </div>
                    </div>
                  )}

                  {/* 리뷰 제출 상태 */}
                  {collaboration.status === 'accepted' && collaboration.final_status === 'in_progress' && (
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-orange-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-orange-800">리뷰 제출이 필요합니다</h4>
                          <p className="text-sm text-orange-700 mt-1">
                            숙박 이용 완료 후 24시간 이내에 리뷰와 SNS 링크를 제출해주세요.
                          </p>
                          <Button 
                            className="mt-3 bg-orange-600 hover:bg-orange-700"
                            onClick={() => window.open(`/influencer/review/${generateReviewToken(collaboration.id)}`, '_blank')}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            리뷰 제출하기
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 리뷰 제출 완료 */}
                  {collaboration.review_submitted_at && (
                    <div>
                      <h4 className="font-medium mb-2 text-green-600">제출된 리뷰</h4>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-3">
                        <div className="text-sm text-green-800">
                          <span className="font-medium">제출일:</span> {format(new Date(collaboration.review_submitted_at), 'PPP pp', { locale: ko })}
                        </div>
                        
                        {collaboration.review_content && (
                          <div>
                            <div className="text-sm font-medium text-green-800 mb-1">리뷰 내용:</div>
                            <div className="text-sm text-green-700 whitespace-pre-wrap bg-white p-2 rounded border">
                              {collaboration.review_content}
                            </div>
                          </div>
                        )}
                        
                        {collaboration.review_links && Object.keys(collaboration.review_links).length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-green-800 mb-2">제출된 링크:</div>
                            <div className="space-y-1">
                              {Object.entries(collaboration.review_links).map(([platform, data]: [string, any]) => (
                                <div key={platform} className="flex items-center gap-2">
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    {platform === 'instagram' ? '인스타그램' :
                                     platform === 'youtube' ? '유튜브' :
                                     platform === 'blog' ? '블로그' : platform}
                                  </span>
                                  <a 
                                    href={data.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline"
                                  >
                                    {data.description || data.url}
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {collaboration.final_status === 'completed' && (
                          <div className="flex items-center gap-2 text-green-800">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">협업이 성공적으로 완료되었습니다!</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <Separator />
                  
                  <div className="text-xs text-gray-500 text-right">
                    신청일: {format(new Date(collaboration.created_at), 'PPP pp', { locale: ko })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}