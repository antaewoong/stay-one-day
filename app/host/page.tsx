'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { hostGet } from '@/lib/host-api'
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
  Phone,
  Bell
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
  const supabase = createClient()
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
    console.log('🚀 호스트 페이지 useEffect 실행됨!')
    
    const checkAuth = async () => {
      try {
        // 1. sessionStorage 확인
        const userData = sessionStorage.getItem('hostUser')
        console.log('호스트 페이지 데이터 로드:', userData)
        
        if (userData) {
          const parsedData = JSON.parse(userData)
          console.log('파싱된 호스트 데이터:', parsedData)
          setHostData(parsedData)
          loadDashboardData(parsedData.id)
          return
        }

        // 2. localStorage에서 Supabase 토큰 확인 (즉시 확인 가능)
        const authToken = localStorage.getItem('sb-fcmauibvdqbocwhloqov-auth-token')
        console.log('localStorage 토큰 확인:', authToken ? 'exists' : 'none')
        
        // 토큰이 없어도 Supabase 세션을 한번 확인해보자
        if (!authToken) {
          console.log('토큰 없음, 그래도 세션 확인 시도...')
        }

        // 3. Supabase 세션 확인 (토큰이 있을 때만)
        const { data: session, error } = await supabase.auth.getSession()
        console.log('대시보드 세션 확인:', session?.session?.user?.id || 'no session')
        
        if (error || !session?.session) {
          console.log('세션 로드 실패, 잠시 후 재시도...')
          // 토큰은 있는데 세션 로드가 안되면 잠시 대기 후 재시도
          setTimeout(() => {
            router.push('/host/login')
          }, 1000)
          return
        }

        // 3. 호스트 정보 조회
        const { data: hostInfo, error: hostError } = await supabase
          .from('hosts')
          .select('*')
          .eq('auth_user_id', session.session.user.id)
          .single()

        if (hostError || !hostInfo) {
          console.error('호스트 정보 조회 실패:', hostError)
          router.push('/host/login')
          return
        }

        // 4. sessionStorage에 호스트 정보 저장
        const hostUserData = {
          id: hostInfo.id,
          auth_user_id: session.session.user.id,
          host_id: hostInfo.host_id,
          business_name: hostInfo.business_name,
          representative_name: hostInfo.representative_name,
          email: hostInfo.email || session.session.user.email,
          role: 'host'
        }
        
        sessionStorage.setItem('hostUser', JSON.stringify(hostUserData))
        setHostData(hostUserData)
        loadDashboardData(hostInfo.id)
        
      } catch (error) {
        console.error('인증 확인 실패:', error)
        router.push('/host/login')
      }
    }

    checkAuth()
  }, [])

  const loadDashboardData = async (hostId: string) => {
    try {
      // 실제 데이터베이스에서 데이터 가져오기
      const response = await hostGet(`/api/host/dashboard`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch dashboard data')
      }

      if (result.ok) {
        // 실제 예약 데이터를 모의 형태로 변환
        const mockBookings = result.data.recent?.map((r: any, i: number) => ({
          id: r.id,
          guestName: `게스트 ${i + 1}`,
          propertyName: `숙소 ${i + 1}`,
          checkIn: r.checkin_date,
          checkOut: r.checkout_date,
          amount: r.total_amount || 50000,
          status: r.status
        })) || []

        setRecentBookings(mockBookings)
        setDashboardData(result.data)
        
        // 실제 데이터로 stats 설정
        setStats({
          totalEarnings: 0,
          monthlyEarnings: 0,
          totalBookings: result.data.recent?.length || 0,
          monthlyBookings: result.data.recent?.length || 0,
          averageRating: 4.5,
          occupancyRate: 85,
          totalProperties: result.data.accommodations_count,
          activeProperties: result.data.accommodations_count
        })
        
        // 임시 리뷰 데이터
        setRecentReviews([
          {
            id: 1,
            guestName: "김고객",
            propertyName: "숙소 1",
            rating: 5,
            comment: "정말 좋았어요! 깨끗하고 편안했습니다.",
            date: "2일 전"
          }
        ])
      } else {
        console.error('Dashboard data load failed:', result.message)
      }
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* 모바일 간편 메뉴 - 모바일에서만 표시 */}
      <div className="md:hidden px-4 pt-4">
        <MobileQuickActions 
          todayCheckins={dashboardData?.today?.checkins || 0}
          todayCheckouts={dashboardData?.today?.checkouts || 0}
          pendingBookings={dashboardData?.today?.pendingBookings || 0}
          hostId={hostData?.host_id}
        />
      </div>

      {/* 모바일용 최근 예약 간단 목록 */}
      <div className="md:hidden px-4">
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-blue-50 to-indigo-50 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent">최근 예약</CardTitle>
              <Button variant="outline" size="sm" asChild className="border-blue-200 text-blue-700 hover:bg-blue-50">
                <Link href="/host/reservations" className="text-xs">전체보기</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {recentBookings.slice(0, 3).map((booking) => (
                <div key={booking.id} className="p-3 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-md">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-800 text-sm">{booking.guestName}</h4>
                          <p className="text-xs text-slate-600">{booking.propertyName}</p>
                        </div>
                      </div>
                      <div className="flex items-center text-xs text-slate-500 ml-10">
                        <span>{booking.checkIn} ~ {booking.checkOut}</span>
                        <span className="mx-2">•</span>
                        <span>₩{booking.amount.toLocaleString()}</span>
                      </div>
                    </div>
                    <Badge 
                      className={`text-xs shadow-sm ${
                        booking.status === 'confirmed' ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-200' :
                        booking.status === 'pending' ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-200' :
                        'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border-slate-200'
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
      <div className="hidden md:flex items-center justify-between px-4 lg:px-8 pt-6 pb-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent">
            호스트 대시보드
          </h1>
          <p className="text-sm mt-2 text-slate-600 bg-white/60 rounded-full px-4 py-2 inline-block shadow-sm">
            {new Date().toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="border-blue-200 hover:bg-blue-50 text-blue-700 shadow-md bg-white/60 backdrop-blur-sm">
            <Download className="w-4 h-4 mr-2" />
            리포트 다운로드
          </Button>
        </div>
      </div>

      {/* 통계 카드 - PC에서만 표시 */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 lg:px-8 pb-4">
        <Card className="border-0 shadow-xl overflow-hidden bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group">
          <div className="h-1 bg-gradient-to-r from-emerald-400 to-green-500"></div>
          <CardContent className="p-4 bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-800">월 수익</p>
                <p className="text-3xl font-bold mt-2 text-emerald-900">
                  ₩{stats.monthlyEarnings.toLocaleString()}
                </p>
                {stats.monthlyEarnings > 0 && (
                  <p className="text-sm mt-3 flex items-center text-emerald-700 bg-white/60 rounded-full px-3 py-1">
                    <DollarSign className="w-4 h-4 mr-1" />
                    이번 달 수익
                  </p>
                )}
              </div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl overflow-hidden bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group">
          <div className="h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
          <CardContent className="p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-800">월 예약</p>
                <p className="text-3xl font-bold mt-2 text-blue-900">
                  {stats.monthlyBookings}건
                </p>
                {stats.monthlyBookings > 0 && (
                  <p className="text-sm mt-3 flex items-center text-blue-700 bg-white/60 rounded-full px-3 py-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    이번 달 예약
                  </p>
                )}
              </div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl overflow-hidden bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group">
          <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>
          <CardContent className="p-4 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-800">평균 평점</p>
                <p className="text-3xl font-bold mt-2 text-amber-900">
                  {stats.averageRating}
                </p>
                {recentReviews.length > 0 && (
                  <p className="text-sm mt-3 text-amber-700 bg-white/60 rounded-full px-3 py-1 inline-block">
                    총 {recentReviews.length}개 리뷰
                  </p>
                )}
              </div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Star className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl overflow-hidden bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group">
          <div className="h-1 bg-gradient-to-r from-purple-400 to-pink-500"></div>
          <CardContent className="p-4 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-800">점유율</p>
                <p className="text-3xl font-bold mt-2 text-purple-900">
                  {stats.occupancyRate}%
                </p>
                <p className="text-sm mt-3 text-purple-700 bg-white/60 rounded-full px-3 py-1 inline-block">
                  활성 숙소 {stats.activeProperties}개
                </p>
              </div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* 메인 콘텐츠 - PC에서만 표시 */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-4 px-4 lg:px-8">
        
        {/* 최근 예약 */}
        <Card className="lg:col-span-2 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-blue-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent">최근 예약</CardTitle>
              <Button variant="outline" size="sm" asChild className="border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm">
                <Link href="/host/reservations">전체보기</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="p-3 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 text-lg">{booking.guestName}</h4>
                          <p className="text-sm text-slate-600 font-medium">{booking.propertyName}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center text-sm text-slate-500 ml-16 bg-slate-50 rounded-full px-4 py-2 w-fit">
                        <span className="font-medium">{booking.checkIn} ~ {booking.checkOut}</span>
                        <span className="mx-3 text-slate-400">•</span>
                        <span className="font-semibold text-slate-700">₩{booking.amount.toLocaleString()}</span>
                      </div>
                    </div>
                    <Badge 
                      className={`text-sm font-medium px-3 py-1 shadow-sm ${
                        booking.status === 'confirmed' ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-200' :
                        booking.status === 'pending' ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-200' :
                        'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border-slate-200'
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

        {/* 사이드 패널 */}
        <div className="space-y-4">
          {/* PC용 완전한 호스트 관리 메뉴 */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
              <CardTitle className="text-lg font-bold bg-gradient-to-r from-emerald-800 to-green-800 bg-clip-text text-transparent flex items-center">
                <Building2 className="w-5 h-5 mr-3 text-emerald-600" />
                숙소 운영 관리
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <Button asChild variant="outline" className="w-full justify-start text-sm h-11 border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-sm">
                <Link href="/host/accommodations">
                  <Building2 className="w-4 h-4 mr-3" />
                  숙소 정보 관리 (사진/정보)
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start text-sm h-11 border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-sm">
                <Link href="/host/rooms">
                  <Settings className="w-4 h-4 mr-3" />
                  객실 관리 (방막기/방열기)
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start text-sm h-11 border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-sm">
                <Link href="/host/amenities">
                  <Plus className="w-4 h-4 mr-3" />
                  편의시설 관리
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* 예약 및 고객 관리 */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <CardTitle className="text-lg font-bold bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent flex items-center">
                <Calendar className="w-5 h-5 mr-3 text-blue-600" />
                예약 및 고객 관리
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <Button asChild variant="outline" className="w-full justify-start text-sm h-11 border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm">
                <Link href="/host/reservations">
                  <Calendar className="w-4 h-4 mr-3" />
                  예약 현황
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start text-sm h-11 border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm">
                <Link href="/host/calendar">
                  <Calendar className="w-4 h-4 mr-3" />
                  달력 관리
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start text-sm h-11 border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm">
                <Link href="/host/reservations/new">
                  <Phone className="w-4 h-4 mr-3" />
                  전화 예약 등록
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start text-sm h-11 border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm">
                <Link href="/host/reviews">
                  <Star className="w-4 h-4 mr-3" />
                  리뷰 관리
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start text-sm h-11 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:bg-purple-100 shadow-md">
                <Link href="/host/influencer-reviews">
                  <Users className="w-4 h-4 mr-3 text-purple-600" />
                  <span className="bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent font-semibold">인플루언서 리뷰 관리</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* 수익 및 정산 */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
              <CardTitle className="text-lg font-bold bg-gradient-to-r from-amber-800 to-orange-800 bg-clip-text text-transparent flex items-center">
                <DollarSign className="w-5 h-5 mr-3 text-amber-600" />
                수익 및 정산
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <Button asChild variant="outline" className="w-full justify-start text-sm h-11 border-amber-200 text-amber-700 hover:bg-amber-50 shadow-sm">
                <Link href="/host/analytics">
                  <TrendingUp className="w-4 h-4 mr-3" />
                  수익 분석
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start text-sm h-11 border-amber-200 text-amber-700 hover:bg-amber-50 shadow-sm">
                <Link href="/host/settlements">
                  <DollarSign className="w-4 h-4 mr-3" />
                  정산 관리
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start text-sm h-11 border-amber-200 text-amber-700 hover:bg-amber-50 shadow-sm">
                <Link href="/host/pricing">
                  <Edit className="w-4 h-4 mr-3" />
                  요금 관리
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start text-sm h-11 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 shadow-md">
                <Link href="/host/marketing-analysis">
                  <svg className="w-4 h-4 mr-3 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L13.09 6.26L18 7L13.09 7.74L12 12L10.91 7.74L6 7L10.91 6.26L12 2Z" fill="currentColor"/>
                    <path d="M19 15L20.09 17.26L23 18L20.09 18.74L19 21L17.91 18.74L15 18L17.91 17.26L19 15Z" fill="currentColor"/>
                    <path d="M5 15L6.09 17.26L9 18L6.09 18.74L5 21L3.91 18.74L1 18L3.91 17.26L5 15Z" fill="currentColor"/>
                  </svg>
                  <span className="bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent font-semibold">AI 마케팅 분석 (그룹 KPI)</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* 최근 리뷰 */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
              <CardTitle className="text-lg font-bold bg-gradient-to-r from-violet-800 to-purple-800 bg-clip-text text-transparent flex items-center">
                <Star className="w-5 h-5 mr-3 text-violet-600" />
                최근 리뷰
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {recentReviews.map((review) => (
                <div key={review.id} className="border-b border-violet-100 last:border-0 pb-4 last:pb-0 hover:bg-gradient-to-r hover:from-violet-50/30 hover:to-purple-50/30 rounded-lg transition-all duration-300 p-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-800">{review.guestName}</span>
                    <div className="flex items-center bg-amber-50 rounded-full px-2 py-1">
                      {Array.from({length: review.rating}).map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-amber-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-violet-600 font-medium mb-2 bg-violet-50 rounded-full px-3 py-1 inline-block">{review.propertyName}</p>
                  <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">{review.comment}</p>
                  <p className="text-xs text-slate-500 mt-2 font-medium">{review.date}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 하단 여백 */}
      <div className="h-8"></div>
    </div>
  )
}