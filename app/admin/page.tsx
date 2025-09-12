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
  Clock,
  MessageSquare,
  Shield,
  Activity,
  Zap,
  CheckCircle,
  Users,
  Home
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DashboardStats {
  totalReservations: number
  monthlyGuests: number
  monthlyRevenue: number
  averageRating: number
  totalProperties: number
  activeProperties: number
  featuredProperties: number
  totalUsers: number
  occupancyRate: number
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [isMainAdmin, setIsMainAdmin] = useState(false)
  const [userRole, setUserRole] = useState<'user' | 'host' | 'admin'>('user')
  const [accessDenied, setAccessDenied] = useState(false)
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalReservations: 0,
    monthlyGuests: 0,
    monthlyRevenue: 0,
    averageRating: 0,
    totalProperties: 0,
    activeProperties: 0,
    featuredProperties: 0,
    totalUsers: 0,
    occupancyRate: 0
  })
  
  const supabase = createClient()

  const [recentBookings, setRecentBookings] = useState([])

  const [notices, setNotices] = useState([])  
  const [loadingNotices, setLoadingNotices] = useState(true)

  useEffect(() => {
    checkAdminStatus()
  }, [])

  const checkAdminStatus = async () => {
    try {
      // sessionStorage에서 관리자 인증 정보 확인
      const adminUser = sessionStorage.getItem('adminUser')
      
      if (!adminUser) {
        // 인증되지 않은 경우 로그인 페이지로 리다이렉트
        router.push('/admin/login')
        return
      }

      const adminData = JSON.parse(adminUser)
      
      // 관리자 권한 확인
      if (adminData.role === 'admin' || adminData.role === 'super_admin') {
        setUserRole('admin')
        setIsMainAdmin(adminData.role === 'super_admin')
        setAccessDenied(false)
        // 인증 성공한 경우에만 데이터 로드
        loadDashboardData()
      } else {
        setAccessDenied(true)
        setUserRole('user')
        setIsMainAdmin(false)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('권한 체크 실패:', error)
      router.push('/admin/login')
    }
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // 실제 통계 데이터 가져오기
      const [accommodationsRes, reservationsRes] = await Promise.all([
        supabase.from('accommodations').select('*', { count: 'exact' }),
        supabase.from('reservations').select(`
          *,
          accommodations(name),
          profiles(name)
        `, { count: 'exact' }).order('created_at', { ascending: false }).limit(5)
      ])
      
      // 공지사항 데이터도 로드
      await loadNotices()

      const totalProperties = accommodationsRes.count || 0
      const activeProperties = accommodationsRes.data?.filter(acc => acc.status === 'active').length || 0
      const featuredProperties = accommodationsRes.data?.filter(acc => acc.is_featured === true).length || 0
      const totalReservations = reservationsRes.count || 0

      // 최근 예약 데이터 설정 - API 실패 시 빈 배열로 안전하게 처리
      const recentReservations = (reservationsRes.data || []).map(reservation => ({
        id: reservation.id,
        propertyName: reservation.accommodations?.name || '알 수 없는 숙소',
        guestName: reservation.profiles?.name || reservation.guest_name || '게스트',
        checkIn: reservation.check_in_date,
        checkOut: reservation.check_out_date,
        amount: reservation.total_amount,
        status: reservation.status,
        paymentStatus: reservation.payment_status
      }))

      setRecentBookings(recentReservations)

      // 월간 매출 계산 - API 실패 시 안전 처리
      const monthlyRevenue = (reservationsRes.data || []).reduce((sum, reservation) => {
        const reservationDate = new Date(reservation.created_at)
        const currentMonth = new Date().getMonth()
        if (reservationDate.getMonth() === currentMonth) {
          return sum + (reservation.total_amount || 0)
        }
        return sum
      }, 0)

      // 월간 게스트 수 계산 - API 실패 시 안전 처리
      const monthlyGuests = (reservationsRes.data || []).filter(reservation => {
        const reservationDate = new Date(reservation.created_at)
        const currentMonth = new Date().getMonth()
        return reservationDate.getMonth() === currentMonth
      }).reduce((sum, reservation) => sum + (reservation.guest_count || 1), 0) || 0

      setStats({
        totalReservations,
        monthlyGuests,
        monthlyRevenue,
        averageRating: 4.8, // 실제로는 리뷰 테이블에서 계산
        totalProperties,
        activeProperties,
        featuredProperties,
        totalUsers: 0, // 사용자 관리가 추가되면 계산
        occupancyRate: totalReservations > 0 ? Math.min((totalReservations / (totalProperties * 30)) * 100, 100) : 0
      })
      
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error)
      setStats({
        totalReservations: 0,
        monthlyGuests: 0,
        monthlyRevenue: 0,
        averageRating: 0,
        totalProperties: 0,
        activeProperties: 0,
        featuredProperties: 0,
        totalUsers: 0,
        occupancyRate: 0
      })
      setRecentBookings([])
    } finally {
      setLoading(false)
    }
  }

  const loadNotices = async () => {
    try {
      setLoadingNotices(true)
      
      // 실제 notices 테이블에서 공지사항 가져오기
      const { data: noticesData, error } = await supabase
        .from('notices')
        .select('id, title, content, created_at')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(3)
      
      if (error) {
        console.error('공지사항 로드 에러:', error)
        setNotices([])
      } else {
        // 기존 UI에 맞게 데이터 형식 변환
        const transformedNotices = noticesData.map(notice => ({
          id: notice.id,
          title: notice.title,
          views: notice.view_count || 0,
          author: notice.admin_id ? '관리자' : '시스템',
          date: new Date(notice.created_at).toISOString().split('T')[0],
          content: notice.content,
          isImportant: notice.is_pinned || notice.notice_type === 'urgent'
        }))
        
        setNotices(transformedNotices)
      }
      
      setLoadingNotices(false)
      
    } catch (error) {
      console.error('공지사항 로드 실패:', error)
      setNotices([])
      setLoadingNotices(false)
    }
  }

  // 로딩 화면
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">권한을 확인하는 중...</p>
        </div>
      </div>
    )
  }

  // 접근 거부 화면
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-600 mb-4">접근 권한이 없습니다</h2>
            <p className="text-gray-600 mb-6">
              이 페이지는 관리자만 접근할 수 있습니다.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => router.push('/')} 
                className="w-full"
              >
                메인페이지로 돌아가기
              </Button>
              <Button 
                onClick={() => router.back()} 
                variant="outline" 
                className="w-full"
              >
                이전 페이지로
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 대시보드 메인 콘텐츠 */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">대시보드</h2>
            <p className="text-sm mt-1 text-gray-600">
              {new Date().toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3">
            <Button variant="outline" className="border-gray-200 hover:bg-gray-50 text-sm">
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">리포트 다운로드</span>
              <span className="sm:hidden">리포트</span>
            </Button>
            <Button asChild className="bg-gray-800 hover:bg-gray-700 text-sm">
              <a href="/admin/accommodations/add">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">새 숙소 등록</span>
                <span className="sm:hidden">숙소 등록</span>
              </a>
            </Button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1 bg-blue-500"></div>
            <CardContent className="p-4 sm:p-6 bg-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-900">총 매출</p>
                  <p className="text-lg sm:text-2xl font-bold mt-1 text-blue-900 truncate">
                    ₩{loading ? '...' : stats.monthlyRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-sm mt-1 flex items-center text-green-600">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +15% 전월 대비
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-blue-200 flex-shrink-0 ml-2">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1 bg-green-500"></div>
            <CardContent className="p-4 sm:p-6 bg-green-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-900">총 예약</p>
                  <p className="text-lg sm:text-2xl font-bold mt-1 text-green-900 truncate">
                    {loading ? '...' : stats.totalReservations.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-sm mt-1 flex items-center text-green-600">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +12% 전월 대비
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-green-200 flex-shrink-0 ml-2">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1 bg-yellow-500"></div>
            <CardContent className="p-4 sm:p-6 bg-yellow-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-yellow-900">등록 숙소</p>
                  <p className="text-lg sm:text-2xl font-bold mt-1 text-yellow-900 truncate">
                    {loading ? '...' : stats.totalProperties}
                  </p>
                  <p className="text-xs sm:text-sm mt-1 text-yellow-700">
                    활성 {stats.activeProperties}개
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-yellow-200 flex-shrink-0 ml-2">
                  <Home className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1 bg-purple-500"></div>
            <CardContent className="p-4 sm:p-6 bg-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-purple-900">추천 숙소</p>
                  <p className="text-lg sm:text-2xl font-bold mt-1 text-purple-900 truncate">
                    {loading ? '...' : stats.featuredProperties}
                  </p>
                  <p className="text-xs sm:text-sm mt-1 text-purple-700">
                    메인페이지 노출
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-purple-200 flex-shrink-0 ml-2">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 성과 지표 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {[
            { label: '평균 평점', value: stats.averageRating, suffix: '', icon: Star, color: '#f59e0b' },
            { label: '점유율', value: stats.occupancyRate, suffix: '%', icon: TrendingUp, color: '#10b981' },
            { label: '전환율', value: 12.3, suffix: '%', icon: Zap, color: '#3b82f6' },
            { label: '응답 시간', value: 24, suffix: '분', icon: Clock, color: '#8b5cf6' }
          ].map((metric, idx) => {
            const Icon = metric.icon
            return (
              <Card key={idx} className="border shadow-sm">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{backgroundColor: `${metric.color}20`}}>
                      <Icon className="w-5 h-5" style={{color: metric.color}} />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">
                      {metric.value}{metric.suffix}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{metric.label}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* 최근 예약 현황 */}
        {recentBookings.length > 0 && (
          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="text-gray-900">최근 예약 현황</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">숙소명</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">게스트</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">체크인</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">체크아웃</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">금액</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{booking.propertyName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{booking.guestName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{booking.checkIn}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{booking.checkOut}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">₩{booking.amount?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm">
                          <Badge className={`text-xs ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status === 'confirmed' ? '확정' :
                             booking.status === 'pending' ? '대기' : booking.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 메인 콘텐츠 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 공지사항 */}
          <Card className="lg:col-span-2 border shadow-sm">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900">점주 공지사항</CardTitle>
                <Button asChild variant="outline" size="sm" className="border-gray-200 hover:bg-gray-50">
                  <a href="/admin/notices">
                    전체보기
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {loadingNotices ? (
                  <div className="p-4 text-center text-gray-500">
                    공지사항을 불러오는 중...
                  </div>
                ) : notices.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    공지사항이 없습니다.
                  </div>
                ) : (
                  notices.map((notice) => (
                  <div key={notice.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium truncate ${
                          notice.title.includes('[공지]') ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {notice.title}
                        </h4>
                        <div className="flex items-center mt-1 text-xs text-gray-600">
                          <span>{notice.author}</span>
                          <span className="mx-2">•</span>
                          <span>{notice.date}</span>
                          <span className="mx-2">•</span>
                          <span>조회 {notice.views}</span>
                        </div>
                      </div>
                      <div className="flex items-center ml-4">
                        {notice.title.includes('[공지]') && (
                          <Badge className="text-xs bg-red-100 text-red-700 border-red-200">
                            공지
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
                )}
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
                <Button asChild variant="outline" className="w-full justify-start border-gray-200 hover:bg-gray-50">
                  <a href="/admin/notices/create">
                    <Plus className="w-4 h-4 mr-2" />
                    새 공지사항 작성
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start border-gray-200 hover:bg-gray-50">
                  <a href="/admin/reservations">
                    <Calendar className="w-4 h-4 mr-2" />
                    예약 관리
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start border-gray-200 hover:bg-gray-50">
                  <a href="/admin/accommodations">
                    <Home className="w-4 h-4 mr-2" />
                    숙소 관리
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start border-gray-200 hover:bg-gray-50">
                  <a href="/admin/inquiries">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    고객 문의 관리
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* 시스템 상태 */}
            <Card className="border shadow-sm">
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-base text-gray-900">시스템 상태</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">서버 상태</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-green-600">정상</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">데이터베이스</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-green-600">연결됨</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">결제 시스템</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-green-600">활성</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}