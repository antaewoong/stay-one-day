'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { 
  Calendar,
  Download,
  Plus,
  Star,
  DollarSign,
  TrendingUp,
  Users,
  Building2,
  Eye,
  Edit
} from 'lucide-react'
import Link from 'next/link'

interface HostStats {
  totalEarnings: number
  monthlyEarnings: number
  totalBookings: number
  monthlyBookings: number
  averageRating: number
  occupancyRate: number
  totalProperties: number
  activeProperties: number
}

export default function HostPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [stats, setStats] = useState<HostStats>({
    totalEarnings: 0,
    monthlyEarnings: 0,
    totalBookings: 0,
    monthlyBookings: 0,
    averageRating: 0,
    occupancyRate: 0,
    totalProperties: 0,
    activeProperties: 0
  })

  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [recentReviews, setRecentReviews] = useState<any[]>([])
  const [hostData, setHostData] = useState<any>(null)

  useEffect(() => {
    // 호스트 정보 확인
    const userData = sessionStorage.getItem('hostUser')
    if (userData) {
      const parsedData = JSON.parse(userData)
      setHostData(parsedData)
      loadDashboardData(parsedData.host_id)
    }
  }, [])

  const loadDashboardData = async (hostId: string) => {
    try {
      // 호스트별로 다른 더미 데이터 제공
      const hostSpecificData = getHostSpecificData(hostId)
      
      setStats(hostSpecificData.stats)
      setRecentBookings(hostSpecificData.bookings)
      setRecentReviews(hostSpecificData.reviews)
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 호스트별 데이터 분리 함수
  const getHostSpecificData = (hostId: string) => {
    const hostDataMap: Record<string, any> = {
      'host-1': {
        stats: {
          totalEarnings: 8500000,
          monthlyEarnings: 1800000,
          totalBookings: 89,
          monthlyBookings: 15,
          averageRating: 4.9,
          occupancyRate: 82,
          totalProperties: 3,
          activeProperties: 3
        },
        bookings: [
          {
            id: 1,
            guestName: '김민수',
            propertyName: '구공스테이 풀빌라',
            checkIn: '2024-02-15',
            checkOut: '2024-02-17',
            amount: 360000,
            status: 'confirmed'
          },
          {
            id: 2,
            guestName: '박지영',
            propertyName: '구공스테이 독채',
            checkIn: '2024-02-20',
            checkOut: '2024-02-22',
            amount: 280000,
            status: 'pending'
          }
        ],
        reviews: [
          {
            id: 1,
            guestName: '김민수',
            propertyName: '구공스테이 풀빌라',
            rating: 5,
            comment: '정말 깨끗하고 시설이 훌륭했습니다. 풀장이 최고였어요!',
            date: '2024-02-10'
          }
        ]
      },
      'host-2': {
        stats: {
          totalEarnings: 6200000,
          monthlyEarnings: 1200000,
          totalBookings: 67,
          monthlyBookings: 8,
          averageRating: 4.7,
          occupancyRate: 74,
          totalProperties: 2,
          activeProperties: 2
        },
        bookings: [
          {
            id: 3,
            guestName: '이준호',
            propertyName: '스테이도고 펜션',
            checkIn: '2024-02-18',
            checkOut: '2024-02-19',
            amount: 150000,
            status: 'completed'
          }
        ],
        reviews: [
          {
            id: 2,
            guestName: '이준호',
            propertyName: '스테이도고 펜션',
            rating: 4,
            comment: '조용하고 편안한 휴식 공간이었습니다.',
            date: '2024-02-08'
          }
        ]
      },
      'host-3': {
        stats: {
          totalEarnings: 4800000,
          monthlyEarnings: 950000,
          totalBookings: 45,
          monthlyBookings: 6,
          averageRating: 4.6,
          occupancyRate: 68,
          totalProperties: 2,
          activeProperties: 1
        },
        bookings: [
          {
            id: 4,
            guestName: '최서연',
            propertyName: '마담아네뜨 글램핑',
            checkIn: '2024-02-25',
            checkOut: '2024-02-26',
            amount: 180000,
            status: 'confirmed'
          }
        ],
        reviews: [
          {
            id: 3,
            guestName: '최서연',
            propertyName: '마담아네뜨 글램핑',
            rating: 5,
            comment: '자연 속에서의 특별한 경험이었습니다!',
            date: '2024-02-12'
          }
        ]
      }
    }

    // 기본값 (관리자나 알 수 없는 호스트)
    return hostDataMap[hostId] || {
      stats: {
        totalEarnings: 0,
        monthlyEarnings: 0,
        totalBookings: 0,
        monthlyBookings: 0,
        averageRating: 0,
        occupancyRate: 0,
        totalProperties: 0,
        activeProperties: 0
      },
      bookings: [],
      reviews: []
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">호스트 대시보드</h1>
          <p className="text-sm mt-1 text-gray-600">
            {new Date().toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="border-gray-200 hover:bg-gray-50">
            <Download className="w-4 h-4 mr-2" />
            리포트 다운로드
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-1 bg-green-500"></div>
          <CardContent className="p-6 bg-green-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900">월 수익</p>
                <p className="text-2xl font-bold mt-1 text-green-900">
                  ₩{stats.monthlyEarnings.toLocaleString()}
                </p>
                <p className="text-sm mt-1 flex items-center text-green-600">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +18% 전월 대비
                </p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-200">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-1 bg-blue-500"></div>
          <CardContent className="p-6 bg-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">월 예약</p>
                <p className="text-2xl font-bold mt-1 text-blue-900">
                  {stats.monthlyBookings}건
                </p>
                <p className="text-sm mt-1 flex items-center text-blue-600">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +22% 전월 대비
                </p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-200">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-1 bg-yellow-500"></div>
          <CardContent className="p-6 bg-yellow-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-900">평균 평점</p>
                <p className="text-2xl font-bold mt-1 text-yellow-900">
                  {stats.averageRating}
                </p>
                <p className="text-sm mt-1 text-yellow-700">
                  총 {stats.totalBookings}개 리뷰
                </p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-yellow-200">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-1 bg-purple-500"></div>
          <CardContent className="p-6 bg-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-900">점유율</p>
                <p className="text-2xl font-bold mt-1 text-purple-900">
                  {stats.occupancyRate}%
                </p>
                <p className="text-sm mt-1 text-purple-700">
                  활성 숙소 {stats.activeProperties}개
                </p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-200">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 최근 예약 */}
        <Card className="lg:col-span-2 border shadow-sm">
          <CardHeader className="border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900">최근 예약</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/host/reservations">전체보기</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{booking.guestName}</h4>
                          <p className="text-sm text-gray-600">{booking.propertyName}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <span>{booking.checkIn} ~ {booking.checkOut}</span>
                        <span className="mx-2">•</span>
                        <span>₩{booking.amount.toLocaleString()}</span>
                      </div>
                    </div>
                    <Badge 
                      className={
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }
                    >
                      {booking.status === 'confirmed' ? '확정' :
                       booking.status === 'pending' ? '대기' : '완료'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 사이드 패널 */}
        <div className="space-y-6">
          {/* 빠른 작업 */}
          <Card className="border shadow-sm">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-base text-gray-900">빠른 작업</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/host/calendar">
                  <Calendar className="w-4 h-4 mr-2" />
                  예약 달력
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/host/reservations">
                  <Calendar className="w-4 h-4 mr-2" />
                  예약 관리
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/host/reviews">
                  <Star className="w-4 h-4 mr-2" />
                  리뷰 관리
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/host/photos">
                  <Eye className="w-4 h-4 mr-2" />
                  사진 관리
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* 최근 리뷰 */}
          <Card className="border shadow-sm">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-base text-gray-900">최근 리뷰</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {recentReviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{review.guestName}</span>
                    <div className="flex items-center">
                      {Array.from({length: review.rating}).map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{review.propertyName}</p>
                  <p className="text-sm text-gray-700 line-clamp-2">{review.comment}</p>
                  <p className="text-xs text-gray-500 mt-1">{review.date}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}