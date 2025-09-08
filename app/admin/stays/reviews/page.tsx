'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Search, 
  Star, 
  MessageCircle, 
  Eye,
  Reply,
  Flag,
  Trash2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react'

interface Review {
  id: number
  stayName: string
  reservationId: string
  guestName: string
  rating: number
  title: string
  content: string
  photos?: string[]
  checkInDate: string
  reviewDate: string
  status: 'published' | 'pending' | 'hidden' | 'reported'
  isVerified: boolean
  hostReply?: {
    content: string
    date: string
  }
  helpful: number
}

export default function ReviewsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false)
  const [replyContent, setReplyContent] = useState('')

  // Mock data - 리뷰 데이터
  const reviews: Review[] = [
    {
      id: 1,
      stayName: '구공스테이 청주 본디',
      reservationId: 'RES-20250815-001',
      guestName: '김**',
      rating: 5,
      title: '정말 완벽한 하루였습니다!',
      content: '가족들과 함께 이용했는데 시설이 너무 깨끗하고 수영장도 최고였어요. 바베큐 시설도 잘 되어있고 직원분들도 친절하셨습니다. 다음에 또 이용하고 싶어요!',
      photos: ['/images/review1-1.jpg', '/images/review1-2.jpg'],
      checkInDate: '2025-08-15',
      reviewDate: '2025-08-16',
      status: 'published',
      isVerified: true,
      helpful: 23
    },
    {
      id: 2,
      stayName: '구공스테이 청주 본디',
      reservationId: 'RES-20250810-002',
      guestName: '이**',
      rating: 4,
      title: '좋았지만 아쉬운 부분도 있었어요',
      content: '전반적으로 만족스러웠지만 체크인 시간이 조금 늦어졌어요. 시설은 정말 좋았고 특히 수영장이 깨끗해서 좋았습니다. 다만 주변이 조금 시끄러웠던 점이 아쉬워요.',
      checkInDate: '2025-08-10',
      reviewDate: '2025-08-11',
      status: 'published',
      isVerified: true,
      hostReply: {
        content: '소중한 후기 감사합니다. 체크인 시간 지연에 대해 죄송하며, 주변 소음 문제도 개선하도록 노력하겠습니다.',
        date: '2025-08-12'
      },
      helpful: 15
    },
    {
      id: 3,
      stayName: '구공스테이 소소한옥',
      reservationId: 'RES-20250805-003',
      guestName: '박**',
      rating: 5,
      title: '한옥의 정취를 제대로 느꼈어요',
      content: '전통 한옥에서의 특별한 경험이었습니다. 조용하고 평화로운 분위기에서 힐링할 수 있었어요. 사진보다 실물이 더 예뻤어요!',
      checkInDate: '2025-08-05',
      reviewDate: '2025-08-06',
      status: 'published',
      isVerified: true,
      helpful: 18
    },
    {
      id: 4,
      stayName: '구공스테이 옥천 키즈',
      reservationId: 'RES-20250801-004',
      guestName: '최**',
      rating: 2,
      title: '아이들에게는 좋지만...',
      content: '아이들은 정말 좋아했지만 성인에게는 시설이 부족해 보였습니다. 특히 화장실이 너무 작고 더러웠어요. 청소 상태를 더 신경 써주셨으면 좋겠습니다.',
      checkInDate: '2025-08-01',
      reviewDate: '2025-08-02',
      status: 'pending',
      isVerified: true,
      helpful: 8
    },
    {
      id: 5,
      stayName: '구공스테이 사천 안토이비토',
      reservationId: 'RES-20250728-005',
      guestName: '정**',
      rating: 3,
      title: '기대에 못 미쳤어요',
      content: '사진과 너무 달랐습니다. 온수풀이라고 했는데 물이 차갑고, 주변 정리도 잘 안되어 있었어요. 가격 대비 만족도가 떨어집니다.',
      checkInDate: '2025-07-28',
      reviewDate: '2025-07-29',
      status: 'reported',
      isVerified: true,
      helpful: 5
    },
    {
      id: 6,
      stayName: '구공스테이 남해 디풀&애견',
      reservationId: 'RES-20250720-006',
      guestName: '강**',
      rating: 5,
      title: '반려견과 함께한 최고의 하루!',
      content: '우리 강아지도 정말 좋아했어요! 넓은 마당에서 마음껏 뛰어놀 수 있어서 좋았고, 반려견 전용 시설들도 잘 갖춰져 있었습니다. 강력 추천!',
      checkInDate: '2025-07-20',
      reviewDate: '2025-07-21',
      status: 'published',
      isVerified: true,
      helpful: 31
    }
  ]

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.stayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter
    const matchesRating = ratingFilter === 'all' || review.rating.toString() === ratingFilter
    
    return matchesSearch && matchesStatus && matchesRating
  })

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
  const totalHelpful = reviews.reduce((sum, review) => sum + review.helpful, 0)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">게시됨</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">검토중</Badge>
      case 'hidden':
        return <Badge className="bg-gray-100 text-gray-800">숨김</Badge>
      case 'reported':
        return <Badge className="bg-red-100 text-red-800">신고됨</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} ${
              i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className={`ml-1 ${size === 'sm' ? 'text-xs' : 'text-sm'} font-medium`}>
          {rating}.0
        </span>
      </div>
    )
  }

  const handleReply = (review: Review) => {
    setSelectedReview(review)
    setIsReplyDialogOpen(true)
    setReplyContent(review.hostReply?.content || '')
  }

  const handleSaveReply = () => {
    console.log('Saving reply for review:', selectedReview?.id, replyContent)
    setIsReplyDialogOpen(false)
    setSelectedReview(null)
    setReplyContent('')
  }

  const handleStatusChange = (reviewId: number, newStatus: string) => {
    console.log('Changing status for review:', reviewId, 'to:', newStatus)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">스테이 리뷰 관리</h1>
          <p className="text-gray-600">고객 리뷰를 관리하고 답변을 작성합니다.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">전체 리뷰</p>
                <p className="text-2xl font-bold">{reviews.length}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">평균 평점</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{averageRating.toFixed(1)}</p>
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">답변 대기</p>
                <p className="text-2xl font-bold text-orange-600">
                  {reviews.filter(r => !r.hostReply && r.status === 'published').length}
                </p>
              </div>
              <Reply className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 도움됨</p>
                <p className="text-2xl font-bold">{totalHelpful}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>리뷰 목록</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="스테이명, 고객명, 제목 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="published">게시됨</SelectItem>
                  <SelectItem value="pending">검토중</SelectItem>
                  <SelectItem value="hidden">숨김</SelectItem>
                  <SelectItem value="reported">신고됨</SelectItem>
                </SelectContent>
              </Select>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="평점" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="5">⭐⭐⭐⭐⭐</SelectItem>
                  <SelectItem value="4">⭐⭐⭐⭐</SelectItem>
                  <SelectItem value="3">⭐⭐⭐</SelectItem>
                  <SelectItem value="2">⭐⭐</SelectItem>
                  <SelectItem value="1">⭐</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-sm text-blue-600">
                        {review.stayName}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {review.reservationId}
                      </Badge>
                      {review.isVerified && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          인증된 예약
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium">{review.guestName}</span>
                      {renderStars(review.rating)}
                      <span className="text-xs text-gray-500">
                        {review.reviewDate} | 도움됨 {review.helpful}
                      </span>
                    </div>
                    <h4 className="font-medium mb-2">{review.title}</h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {review.content}
                    </p>
                    
                    {review.hostReply && (
                      <div className="bg-blue-50 rounded-lg p-3 mt-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Reply className="w-3 h-3 text-blue-600" />
                          <span className="text-xs font-medium text-blue-600">
                            호스트 답변 ({review.hostReply.date})
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{review.hostReply.content}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-start gap-2 ml-4">
                    {getStatusBadge(review.status)}
                    <div className="flex flex-col gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleReply(review)}
                        className="h-8"
                      >
                        <Reply className="w-3 h-3" />
                      </Button>
                      <Select onValueChange={(value) => handleStatusChange(review.id, value)}>
                        <SelectTrigger className="w-8 h-8 p-1">
                          <Eye className="w-3 h-3" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg">
                          <SelectItem value="published">게시</SelectItem>
                          <SelectItem value="hidden">숨김</SelectItem>
                          <SelectItem value="reported">신고</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" className="h-8 text-red-600">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredReviews.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchQuery || statusFilter !== 'all' || ratingFilter !== 'all'
                ? '검색 조건에 맞는 리뷰가 없습니다.'
                : '등록된 리뷰가 없습니다.'
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>리뷰 답변</DialogTitle>
            <DialogDescription>
              고객 리뷰에 대한 답변을 작성하세요.
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-4">
              {/* Original Review */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-medium">{selectedReview.guestName}</span>
                  {renderStars(selectedReview.rating, 'md')}
                  <span className="text-sm text-gray-500">{selectedReview.reviewDate}</span>
                </div>
                <h4 className="font-medium mb-2">{selectedReview.title}</h4>
                <p className="text-sm text-gray-600">{selectedReview.content}</p>
              </div>

              {/* Reply Input */}
              <div>
                <label className="text-sm font-medium mb-2 block">답변 내용</label>
                <Textarea
                  placeholder="고객에게 정중하고 도움이 되는 답변을 작성해 주세요."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={6}
                />
                <p className="text-xs text-gray-500 mt-2">
                  • 정중하고 전문적인 톤으로 작성해 주세요
                  • 구체적인 개선 방안이나 감사 인사를 포함해 주세요
                  • 개인정보나 민감한 정보는 포함하지 마세요
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveReply} disabled={!replyContent.trim()}>
              <Reply className="w-4 h-4 mr-2" />
              답변 저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}