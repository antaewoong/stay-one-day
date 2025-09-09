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
  Edit,
  Settings,
  Phone
} from 'lucide-react'
import Link from 'next/link'
import MobileQuickActions from '@/components/host/MobileQuickActions'

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
  const [dashboardData, setDashboardData] = useState<any>(null)

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
      // 실제 데이터베이스에서 데이터 가져오기
      const response = await fetch(`/api/host/dashboard?hostId=${hostId}`)
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data.stats)
        setRecentBookings(result.data.recentBookings)
        setRecentReviews(result.data.recentReviews)
        setDashboardData(result.data)
      } else {
        console.error('Dashboard data load failed:', result.error)
        // 실패시 기본값 유지
      }
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error)
      // 에러시 기본값 유지
    } finally {
      setLoading(false)
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
      {/* 모바일 간편 메뉴 - 모바일에서만 표시 */}
      <div className="block md:hidden px-4">
        <MobileQuickActions 
          todayCheckins={dashboardData?.today?.checkins || 0}
          todayCheckouts={dashboardData?.today?.checkouts || 0}
          pendingBookings={dashboardData?.today?.pendingBookings || 0}
          rooms={dashboardData?.accommodations || []}
          hostId={hostData?.host_id}
        />
      </div>

      {/* 모바일용 최근 예약 간단 목록 */}
      <div className="block md:hidden px-4">
        <Card className="border shadow-sm">
          <CardHeader className="border-b bg-gray-50 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-gray-900">최근 예약</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/host/reservations" className="text-xs">전체보기</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {recentBookings.slice(0, 3).map((booking) => (
                <div key={booking.id} className="p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">{booking.guestName}</h4>
                          <p className="text-xs text-gray-600">{booking.propertyName}</p>
                        </div>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 ml-10">
                        <span>{booking.checkIn} ~ {booking.checkOut}</span>
                        <span className="mx-2">•</span>
                        <span>₩{booking.amount.toLocaleString()}</span>
                      </div>
                    </div>
                    <Badge 
                      className={`text-xs ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
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
      </div>

      {/* PC용 페이지 헤더 - 데스크톱에서만 표시 */}
      <div className="hidden md:flex items-center justify-between px-4 lg:px-8">
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

      {/* 통계 카드 - PC에서만 표시 */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 lg:px-8">
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

      {/* 메인 콘텐츠 - PC에서만 표시 */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 lg:px-8">
        
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
          {/* PC용 완전한 호스트 관리 메뉴 */}
          <Card className="border shadow-sm">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-base text-gray-900 flex items-center">
                <Building2 className="w-4 h-4 mr-2" />
                숙소 운영 관리
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Button asChild variant="outline" className="w-full justify-start text-sm h-9">
                <Link href="/host/accommodations">
                  <Building2 className="w-4 h-4 mr-2" />
                  숙소 정보 관리
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start text-sm h-9">
                <Link href="/host/rooms">
                  <Settings className="w-4 h-4 mr-2" />
                  객실 관리 (방막기/방열기)
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start text-sm h-9">
                <Link href="/host/photos">
                  <Eye className="w-4 h-4 mr-2" />
                  사진 관리
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start text-sm h-9">
                <Link href="/host/amenities">
                  <Plus className="w-4 h-4 mr-2" />
                  편의시설 관리
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* 예약 및 고객 관리 */}
          <Card className="border shadow-sm">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-base text-gray-900 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                예약 및 고객 관리
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Button asChild variant="outline" className="w-full justify-start text-sm h-9">
                <Link href="/host/reservations">
                  <Calendar className="w-4 h-4 mr-2" />
                  예약 현황
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start text-sm h-9">
                <Link href="/host/calendar">
                  <Calendar className="w-4 h-4 mr-2" />
                  달력 관리
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start text-sm h-9">
                <Link href="/host/reservations/new">
                  <Phone className="w-4 h-4 mr-2" />
                  전화 예약 등록
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start text-sm h-9">
                <Link href="/host/reviews">
                  <Star className="w-4 h-4 mr-2" />
                  리뷰 관리
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* 수익 및 정산 */}
          <Card className="border shadow-sm">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-base text-gray-900 flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                수익 및 정산
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Button asChild variant="outline" className="w-full justify-start text-sm h-9">
                <Link href="/host/analytics">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  수익 분석
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start text-sm h-9">
                <Link href="/host/settlements">
                  <DollarSign className="w-4 h-4 mr-2" />
                  정산 관리
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start text-sm h-9">
                <Link href="/host/pricing">
                  <Edit className="w-4 h-4 mr-2" />
                  요금 관리
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start text-sm h-9 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:bg-blue-50">
                <Link href="/host/marketing-analysis">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L13.09 6.26L18 7L13.09 7.74L12 12L10.91 7.74L6 7L10.91 6.26L12 2Z" fill="currentColor"/>
                    <path d="M19 15L20.09 17.26L23 18L20.09 18.74L19 21L17.91 18.74L15 18L17.91 17.26L19 15Z" fill="currentColor"/>
                    <path d="M5 15L6.09 17.26L9 18L6.09 18.74L5 21L3.91 18.74L1 18L3.91 17.26L5 15Z" fill="currentColor"/>
                  </svg>
                  AI 마케팅 분석
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