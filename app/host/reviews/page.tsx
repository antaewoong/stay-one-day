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
      
      let url = `/api/reviews?hostId=${hostId}&limit=50`
      
      if (ratingFilter !== 'all') {
        url += `&rating=${ratingFilter}`
      }
      
      const response = await fetch(url)
      const result = await response.json()
      
      if (result.data && result.data.length >= 0) {
        const mappedReviews = result.data.map((review: any) => ({
          id: review.id,
          guest_name: review.reservations?.guest_name || '게스트',
          accommodation_name: review.accommodations?.name || '숙소',
          rating: review.rating,
          comment: review.comment,
          created_at: review.created_at,
          reply: review.host_reply,
          reply_date: review.reply_date,
          images: review.images || []
        }))
        
        let filteredReviews = mappedReviews

        // 검색 필터 적용
        if (searchQuery) {
          filteredReviews = filteredReviews.filter((r: any) => 
            r.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            r.accommodation_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.comment.toLowerCase().includes(searchQuery.toLowerCase())
          )
        }

        setReviews(filteredReviews)
      } else {
        console.log('리뷰가 없거나 API 호출 실패')
        setReviews([])
      }
    } catch (error) {
      console.error('리뷰 목록 로드 실패:', error)
      setReviews([])
    } finally {
      setLoading(false)
    }
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
      const response = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reply: replyText,
          hostId: hostData?.host_id || 'host-001',
          hostName: hostData?.host_name || '호스트'
        })
      })

      const result = await response.json()

      if (result.success) {
        await loadReviews(hostData?.host_id)
        setReplyingTo(null)
        setReplyText('')
        alert('답글이 등록되었습니다.')
      } else {
        alert('답글 등록에 실패했습니다.')
      }
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
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
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