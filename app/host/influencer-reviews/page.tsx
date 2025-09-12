'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft,
  Users,
  Star,
  MessageCircle,
  Eye,
  Calendar,
  MapPin,
  Instagram,
  Youtube,
  ThumbsUp,
  Reply,
  Send,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import OptimizedImage from '@/components/optimized-image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'react-hot-toast'
import { hostGet, hostPost } from '@/lib/host-api'

interface InfluencerReview {
  id: string
  influencer_id: string
  accommodation_id: string
  influencer_name: string
  influencer_instagram: string
  influencer_follower_count: number
  accommodation_name: string
  content: string
  rating: number
  images: string[]
  platform: 'instagram' | 'youtube' | 'blog' | 'tiktok'
  post_url?: string
  views?: number
  likes?: number
  comments_count?: number
  engagement_rate?: number
  created_at: string
  host_reply?: string
  host_reply_date?: string
  ai_evaluation?: any
}

export default function HostInfluencerReviewsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<InfluencerReview[]>([])
  const [filteredReviews, setFilteredReviews] = useState<InfluencerReview[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [hostData, setHostData] = useState<any>(null)
  
  // 답글 모달 상태
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState<InfluencerReview | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)

  useEffect(() => {
    // 호스트 인증 확인
    const userData = sessionStorage.getItem('hostUser')
    if (!userData) {
      router.push('/host/login')
      return
    }
    
    const parsedData = JSON.parse(userData)
    setHostData(parsedData)
    loadInfluencerReviews(parsedData.host_id)
  }, [router])

  useEffect(() => {
    filterReviews()
  }, [reviews, searchTerm, platformFilter])

  const loadInfluencerReviews = async (hostId: string) => {
    try {
      setLoading(true)
      const response = await hostGet(`/api/host/influencer-reviews?hostId=${hostId}`)
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setReviews(result.data)
        }
      }
    } catch (error) {
      console.error('인플루언서 리뷰 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterReviews = () => {
    let filtered = reviews
    
    if (searchTerm) {
      filtered = filtered.filter(review => 
        review.influencer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.accommodation_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (platformFilter !== 'all') {
      filtered = filtered.filter(review => review.platform === platformFilter)
    }
    
    setFilteredReviews(filtered)
  }

  const handleReply = (review: InfluencerReview) => {
    setSelectedReview(review)
    setReplyContent(review.host_reply || '')
    setShowReplyModal(true)
  }

  const submitReply = async () => {
    if (!selectedReview || !replyContent.trim()) return

    try {
      setReplyLoading(true)
      
      const response = await hostPost('/api/host/influencer-reviews/reply', {
        reviewId: selectedReview.id,
        hostId: hostData.host_id,
        reply: replyContent.trim()
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          toast.success('답글이 성공적으로 등록되었습니다')
          setShowReplyModal(false)
          setReplyContent('')
          loadInfluencerReviews(hostData.host_id) // 목록 새로고침
        } else {
          throw new Error(result.message || '답글 등록 실패')
        }
      } else {
        throw new Error('답글 등록 실패')
      }
    } catch (error) {
      console.error('답글 등록 오류:', error)
      toast.error(error instanceof Error ? error.message : '답글 등록 중 오류가 발생했습니다')
    } finally {
      setReplyLoading(false)
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="w-4 h-4" />
      case 'youtube':
        return <Youtube className="w-4 h-4" />
      case 'blog':
        return <MessageCircle className="w-4 h-4" />
      case 'tiktok':
        return <MessageCircle className="w-4 h-4" />
      default:
        return <MessageCircle className="w-4 h-4" />
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return 'bg-pink-100 text-pink-800'
      case 'youtube':
        return 'bg-red-100 text-red-800'
      case 'blog':
        return 'bg-blue-100 text-blue-800'
      case 'tiktok':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">인플루언서 리뷰를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/host" className="flex items-center text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5 mr-1" />
            호스트 대시보드
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-7 h-7 text-purple-600" />
              인플루언서 리뷰 관리
            </h1>
            <p className="text-gray-500">인플루언서가 작성한 리뷰를 확인하고 답글을 작성하세요</p>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 인플루언서 리뷰</p>
                <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">평균 평점</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0.0'}
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">답글 완료</p>
                <p className="text-2xl font-bold text-green-600">
                  {reviews.filter(r => r.host_reply).length}
                </p>
              </div>
              <Reply className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 조회수</p>
                <p className="text-2xl font-bold text-blue-600">
                  {reviews.reduce((sum, r) => sum + (r.views || 0), 0).toLocaleString()}
                </p>
              </div>
              <Eye className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="인플루언서명, 숙소명, 리뷰 내용으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-md bg-white"
            >
              <option value="all">전체 플랫폼</option>
              <option value="instagram">인스타그램</option>
              <option value="youtube">유튜브</option>
              <option value="blog">블로그</option>
              <option value="tiktok">틱톡</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* 인플루언서 리뷰 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>인플루언서 리뷰 ({filteredReviews.length}개)</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>해당 조건의 인플루언서 리뷰가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredReviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-6 bg-white">
                  {/* 인플루언서 정보 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <Users className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{review.influencer_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          {review.influencer_instagram && (
                            <span className="flex items-center gap-1">
                              <Instagram className="w-3 h-3" />
                              {review.influencer_follower_count.toLocaleString()} 팔로워
                            </span>
                          )}
                          {review.ai_evaluation?.grade && (
                            <Badge className="text-xs bg-purple-100 text-purple-800">
                              AI: {review.ai_evaluation.grade}급
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getPlatformColor(review.platform)}`}>
                        {getPlatformIcon(review.platform)}
                        <span className="ml-1 capitalize">{review.platform}</span>
                      </Badge>
                      {review.post_url && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={review.post_url} target="_blank">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            원본 보기
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* 숙소 및 평점 정보 */}
                  <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">{review.accommodation_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({length: 5}).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                      <span className="ml-1 text-sm font-medium">{review.rating}/5</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>

                  {/* 리뷰 내용 */}
                  <div className="mb-4">
                    <p className="text-gray-700 leading-relaxed">{review.content}</p>
                  </div>

                  {/* 리뷰 이미지 */}
                  {review.images.length > 0 && (
                    <div className="mb-4">
                      <div className="flex gap-2 flex-wrap">
                        {review.images.slice(0, 4).map((image, index) => (
                          <div key={index} className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                            <OptimizedImage
                              src={image}
                              alt={`리뷰 이미지 ${index + 1}`}
                              width={80}
                              height={80}
                              className="object-cover"
                            />
                          </div>
                        ))}
                        {review.images.length > 4 && (
                          <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                            <span className="text-xs text-gray-500">+{review.images.length - 4}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 성과 지표 */}
                  {(review.views || review.likes || review.comments_count) && (
                    <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                      {review.views && (
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {review.views.toLocaleString()} 조회
                        </div>
                      )}
                      {review.likes && (
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          {review.likes.toLocaleString()} 좋아요
                        </div>
                      )}
                      {review.comments_count && (
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {review.comments_count.toLocaleString()} 댓글
                        </div>
                      )}
                      {review.engagement_rate && (
                        <div className="text-blue-600 font-medium">
                          참여율 {review.engagement_rate}%
                        </div>
                      )}
                    </div>
                  )}

                  {/* 호스트 답글 */}
                  {review.host_reply ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <Reply className="w-3 h-3 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-blue-900">호스트 답글</span>
                        <span className="text-xs text-blue-600">
                          {review.host_reply_date && new Date(review.host_reply_date).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <p className="text-blue-800">{review.host_reply}</p>
                    </div>
                  ) : null}

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleReply(review)}
                      variant={review.host_reply ? "outline" : "default"}
                      size="sm"
                      className={review.host_reply ? "" : "bg-blue-600 hover:bg-blue-700"}
                    >
                      <Reply className="w-4 h-4 mr-1" />
                      {review.host_reply ? '답글 수정' : '답글 작성'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 답글 작성 모달 */}
      <Dialog open={showReplyModal} onOpenChange={setShowReplyModal}>
        <DialogContent className="max-w-2xl bg-white border shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Reply className="w-5 h-5 text-blue-600" />
              {selectedReview?.host_reply ? '답글 수정' : '답글 작성'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {selectedReview?.influencer_name}님의 리뷰에 답글을 작성하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 원본 리뷰 요약 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="font-medium">{selectedReview?.rating}/5</span>
                <span className="text-gray-500">·</span>
                <span className="text-sm text-gray-600">{selectedReview?.accommodation_name}</span>
              </div>
              <p className="text-sm text-gray-700 line-clamp-3">{selectedReview?.content}</p>
            </div>

            {/* 답글 입력 */}
            <div>
              <Label htmlFor="reply" className="text-sm font-medium">답글 내용</Label>
              <Textarea
                id="reply"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="정성스럽고 감사한 마음을 담아 답글을 작성해주세요..."
                className="bg-white border resize-none h-32 mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                {replyContent.length}/1000자
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowReplyModal(false)}
              className="bg-white border"
            >
              취소
            </Button>
            <Button 
              onClick={submitReply}
              disabled={replyLoading || !replyContent.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {replyLoading ? '등록 중...' : selectedReview?.host_reply ? '답글 수정' : '답글 등록'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}