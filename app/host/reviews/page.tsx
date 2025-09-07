'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Star, Search, MessageSquare, Reply, Calendar, User } from 'lucide-react'

interface Review {
  id: string
  guest_name: string
  accommodation_name: string
  rating: number
  comment: string
  created_at: string
  reply?: string
  reply_date?: string
  images?: string[]
}

export default function HostReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [hostData, setHostData] = useState<any>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    const userData = sessionStorage.getItem('hostUser')
    if (userData) {
      const parsedData = JSON.parse(userData)
      setHostData(parsedData)
      loadReviews(parsedData.host_id)
    }
  }, [])

  const loadReviews = async (hostId: string) => {
    try {
      setLoading(true)
      
      // 호스트별 더미 리뷰 데이터
      const hostReviewsData = getHostReviews(hostId)
      
      let filteredReviews = hostReviewsData

      // 평점 필터 적용
      if (ratingFilter !== 'all') {
        const rating = parseInt(ratingFilter)
        filteredReviews = filteredReviews.filter(r => r.rating === rating)
      }

      // 검색 필터 적용
      if (searchQuery) {
        filteredReviews = filteredReviews.filter(r => 
          r.guest_name.includes(searchQuery) || 
          r.accommodation_name.includes(searchQuery) ||
          r.comment.includes(searchQuery)
        )
      }

      setReviews(filteredReviews)
    } catch (error) {
      console.error('리뷰 목록 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const getHostReviews = (hostId: string): Review[] => {
    const reviewDataMap: Record<string, Review[]> = {
      'host-1': [
        {
          id: '1',
          guest_name: '김민수',
          accommodation_name: '구공스테이 풀빌라',
          rating: 5,
          comment: '정말 깨끗하고 시설이 훌륭했습니다. 풀장이 최고였어요! 다음에도 꼭 이용하고 싶습니다.',
          created_at: '2024-02-10T15:30:00Z',
          reply: '소중한 후기 감사합니다. 다음에도 더 좋은 서비스로 모시겠습니다!',
          reply_date: '2024-02-11T09:00:00Z'
        },
        {
          id: '2',
          guest_name: '박지영',
          accommodation_name: '구공스테이 독채',
          rating: 4,
          comment: '위치가 좋고 조용해서 휴식하기 좋았습니다. 다만 와이파이가 조금 느렸어요.',
          created_at: '2024-02-08T12:15:00Z'
        },
        {
          id: '3',
          guest_name: '최서연',
          accommodation_name: '구공스테이 풀빌라',
          rating: 5,
          comment: '가족 여행으로 정말 만족스러웠습니다. 바베큐 시설도 잘 되어있고 아이들이 너무 좋아했어요.',
          created_at: '2024-01-28T14:20:00Z',
          reply: '가족분들이 즐거워하셨다니 저희도 기쁩니다. 감사합니다!',
          reply_date: '2024-01-29T10:30:00Z'
        }
      ],
      'host-2': [
        {
          id: '4',
          guest_name: '이준호',
          accommodation_name: '스테이도고 펜션',
          rating: 4,
          comment: '조용하고 편안한 휴식 공간이었습니다. 자연 경치가 아름다웠어요.',
          created_at: '2024-02-08T16:45:00Z'
        },
        {
          id: '5',
          guest_name: '정미영',
          accommodation_name: '스테이도고 펜션',
          rating: 3,
          comment: '전반적으로는 좋았지만 침구류가 조금 오래된 것 같아요.',
          created_at: '2024-02-05T11:20:00Z'
        }
      ],
      'host-3': [
        {
          id: '6',
          guest_name: '강동욱',
          accommodation_name: '마담아네뜨 글램핑',
          rating: 5,
          comment: '자연 속에서의 특별한 경험이었습니다! 별보기도 환상적이었어요.',
          created_at: '2024-02-01T19:30:00Z'
        }
      ]
    }

    return reviewDataMap[hostId] || []
  }

  useEffect(() => {
    if (hostData) {
      const timeoutId = setTimeout(() => {
        loadReviews(hostData.host_id)
      }, 300)

      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery, ratingFilter, hostData])

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return

    try {
      // 실제 환경에서는 Supabase에서 답글 저장
      setReviews(prev => 
        prev.map(r => r.id === reviewId ? { 
          ...r, 
          reply: replyText,
          reply_date: new Date().toISOString()
        } : r)
      )
      
      setReplyingTo(null)
      setReplyText('')
      alert('답글이 등록되었습니다.')
    } catch (error) {
      console.error('답글 등록 실패:', error)
      alert('답글 등록에 실패했습니다.')
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 5) return 'text-green-500'
    if (rating >= 4) return 'text-blue-500'
    if (rating >= 3) return 'text-yellow-500'
    return 'text-red-500'
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : '0.0'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">리뷰 관리</h1>
          <p className="text-sm text-gray-600 mt-1">
            총 {reviews.length}개의 리뷰 • 평균 평점: {averageRating}점
          </p>
        </div>
        <div className="flex items-center gap-2">
          {renderStars(Math.round(parseFloat(averageRating)))}
          <span className="text-lg font-semibold text-gray-900">{averageRating}</span>
        </div>
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
                  placeholder="게스트명, 숙소명, 리뷰 내용으로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-300 bg-white"
                />
              </div>
            </div>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full md:w-[150px] border-gray-300 bg-white">
                <SelectValue placeholder="평점 필터" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">전체 평점</SelectItem>
                <SelectItem value="5">5점</SelectItem>
                <SelectItem value="4">4점</SelectItem>
                <SelectItem value="3">3점</SelectItem>
                <SelectItem value="2">2점</SelectItem>
                <SelectItem value="1">1점</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 리뷰 목록 */}
      <div className="space-y-4">
        {loading ? (
          <Card className="border shadow-sm">
            <CardContent className="p-8 text-center bg-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </CardContent>
          </Card>
        ) : reviews.length === 0 ? (
          <Card className="border shadow-sm">
            <CardContent className="p-12 text-center bg-white">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">리뷰가 없습니다</h3>
              <p className="text-gray-500">검색 조건을 변경해보세요</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="border shadow-sm">
              <CardHeader className="bg-white border-b">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{review.guest_name}</h3>
                        <p className="text-sm text-gray-500">{review.accommodation_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      <span className={`font-semibold ${getRatingColor(review.rating)}`}>
                        {review.rating}.0
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(review.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 bg-white">
                <div className="space-y-4">
                  {/* 리뷰 내용 */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-800 leading-relaxed">{review.comment}</p>
                  </div>

                  {/* 호스트 답글 */}
                  {review.reply ? (
                    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                      <div className="flex items-center gap-2 mb-2">
                        <Reply className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">호스트 답글</span>
                        {review.reply_date && (
                          <span className="text-xs text-gray-500">
                            {new Date(review.reply_date).toLocaleDateString('ko-KR')}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-800">{review.reply}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {replyingTo === review.id ? (
                        <div className="space-y-3">
                          <Textarea
                            placeholder="정성스러운 답글을 작성해주세요..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="bg-white border-gray-300"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              onClick={() => handleReply(review.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              답글 등록
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
                          variant="outline"
                          onClick={() => setReplyingTo(review.id)}
                          className="border-green-600 text-green-600 hover:bg-green-50"
                        >
                          <Reply className="w-4 h-4 mr-2" />
                          답글 작성
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