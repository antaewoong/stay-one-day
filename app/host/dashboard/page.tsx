'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Bell,
  Settings,
  Home,
  BarChart3,
  CalendarDays,
  Star,
  Phone,
  Mail,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { formatPrice, formatDate, getReservationStatusText } from '@/lib/utils/reservation'

interface HostData {
  id: string
  business_name: string
  host_name: string
  phone: string
  email: string
  commission_rate: number
}

interface AccommodationData {
  id: string
  name: string
  address: string
  accommodation_type: string
  base_price: number
  rating?: number
  review_count?: number
  status: string
}

interface ReservationData {
  id: string
  accommodation_id: string
  accommodation_name: string
  guest_name: string
  guest_phone: string
  reservation_date: string
  guest_count: number
  total_price: number
  status: string
  payment_status: string
  created_at: string
}

interface DashboardStats {
  total_reservations: number
  pending_reservations: number
  confirmed_reservations: number
  total_revenue: number
  monthly_revenue: number
  active_accommodations: number
}

export default function HostDashboard() {
  const router = useRouter()
  const [hostData, setHostData] = useState<HostData | null>(null)
  const [accommodations, setAccommodations] = useState<AccommodationData[]>([])
  const [reservations, setReservations] = useState<ReservationData[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    total_reservations: 0,
    pending_reservations: 0,
    confirmed_reservations: 0,
    total_revenue: 0,
    monthly_revenue: 0,
    active_accommodations: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('overview')
  
  const supabase = createClient()

  useEffect(() => {
    loadHostData()
  }, [])

  const loadHostData = async () => {
    try {
      // 세션에서 호스트 정보 가져오기 (다른 호스트 페이지와 일관성 유지)
      const userData = sessionStorage.getItem('hostUser')
      if (!userData) {
        window.location.href = '/host/login'
        return
      }

      const parsedData = JSON.parse(userData)
      
      // 호스트 정보 조회
      const { data: hostInfo } = await supabase
        .from('hosts')
        .select('*')
        .eq('host_id', parsedData.host_id)
        .single()

      if (!hostInfo) {
        console.error('호스트 정보를 찾을 수 없습니다.')
        window.location.href = '/host/login'
        return
      }

      setHostData(hostInfo)

      // 호스트의 숙소들 조회
      const { data: accommodationData } = await supabase
        .from('accommodations')
        .select('*')
        .eq('host_id', hostInfo.id)

      setAccommodations(accommodationData || [])

      // 예약 데이터 조회 (최근 50개)
      const { data: reservationData } = await supabase
        .from('reservations')
        .select(`
          *,
          accommodations(name)
        `)
        .in('accommodation_id', (accommodationData || []).map(acc => acc.id))
        .order('created_at', { ascending: false })
        .limit(50)

      const processedReservations = reservationData?.map(res => ({
        ...res,
        accommodation_name: res.accommodations?.name || 'Unknown'
      })) || []

      setReservations(processedReservations)

      // 통계 계산
      const now = new Date()
      const thisMonth = now.getMonth()
      const thisYear = now.getFullYear()

      const monthlyReservations = processedReservations.filter(res => {
        const resDate = new Date(res.created_at)
        return resDate.getMonth() === thisMonth && resDate.getFullYear() === thisYear
      })

      const totalRevenue = processedReservations
        .filter(res => res.payment_status === 'paid')
        .reduce((sum, res) => sum + res.total_price, 0)

      const monthlyRevenue = monthlyReservations
        .filter(res => res.payment_status === 'paid')
        .reduce((sum, res) => sum + res.total_price, 0)

      setStats({
        total_reservations: processedReservations.length,
        pending_reservations: processedReservations.filter(res => res.status === 'pending').length,
        confirmed_reservations: processedReservations.filter(res => res.status === 'confirmed').length,
        total_revenue: totalRevenue,
        monthly_revenue: monthlyRevenue,
        active_accommodations: accommodationData?.filter(acc => acc.status === 'active').length || 0
      })

    } catch (error) {
      console.error('호스트 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'paid': return 'bg-green-100 text-green-800'
      case 'refunded': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">호스트 데이터 로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">호스트 대시보드</h1>
              <p className="text-gray-600 mt-1">
                {hostData?.business_name} · {hostData?.host_name}님
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                알림
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                설정
              </Button>
            </div>
          </div>
        </div>

        {/* 통계 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 예약</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_reservations}</div>
              <p className="text-xs text-muted-foreground">
                대기 {stats.pending_reservations}건 · 확정 {stats.confirmed_reservations}건
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 매출</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₩{formatPrice(stats.total_revenue)}</div>
              <p className="text-xs text-muted-foreground">
                수수료 제외 금액
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">이번 달 매출</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₩{formatPrice(stats.monthly_revenue)}</div>
              <p className="text-xs text-muted-foreground">
                {new Date().getMonth() + 1}월 매출
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">활성 숙소</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_accommodations}</div>
              <p className="text-xs text-muted-foreground">
                총 {accommodations.length}개 숙소 중
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 탭 메뉴 */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="reservations">예약 관리</TabsTrigger>
            <TabsTrigger value="accommodations">숙소 관리</TabsTrigger>
            <TabsTrigger value="analytics">분석</TabsTrigger>
          </TabsList>

          {/* 개요 탭 */}
          <TabsContent value="overview" className="space-y-6">
            {/* 최근 예약 현황 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarDays className="w-5 h-5 mr-2" />
                  최근 예약 현황
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reservations.slice(0, 5).map((reservation) => (
                    <div key={reservation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{reservation.accommodation_name}</h4>
                        <p className="text-sm text-gray-600">
                          {reservation.guest_name} · {reservation.guest_count}명 · {formatDate(reservation.reservation_date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₩{formatPrice(reservation.total_price)}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(reservation.status)}>
                            {getReservationStatusText(reservation.status)}
                          </Badge>
                          <Badge className={getPaymentStatusColor(reservation.payment_status)}>
                            {reservation.payment_status === 'paid' ? '결제완료' : '결제대기'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  {reservations.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      아직 예약이 없습니다.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 예약 관리 탭 */}
          <TabsContent value="reservations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>전체 예약 관리</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reservations.map((reservation) => (
                    <div key={reservation.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{reservation.accommodation_name}</h4>
                            <Badge className={getStatusColor(reservation.status)}>
                              {getReservationStatusText(reservation.status)}
                            </Badge>
                            <Badge className={getPaymentStatusColor(reservation.payment_status)}>
                              {reservation.payment_status === 'paid' ? '결제완료' : '결제대기'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {reservation.guest_name} ({reservation.guest_count}명)
                            </div>
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              {reservation.guest_phone}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(reservation.reservation_date)}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {new Date(reservation.created_at).toLocaleDateString('ko-KR')} 예약
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-xl font-bold">₩{formatPrice(reservation.total_price)}</div>
                          <div className="flex gap-2 mt-2">
                            {reservation.status === 'pending' && (
                              <>
                                <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  승인
                                </Button>
                                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                  <XCircle className="w-4 h-4 mr-1" />
                                  거절
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 숙소 관리 탭 */}
          <TabsContent value="accommodations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>숙소 관리</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {accommodations.map((accommodation) => (
                    <div key={accommodation.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg font-medium">{accommodation.name}</h4>
                            <Badge variant={accommodation.status === 'active' ? "default" : "secondary"}>
                              {accommodation.status === 'active' ? "운영중" : "중지"}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {accommodation.address}
                            </div>
                            <div className="flex items-center">
                              <Home className="w-4 h-4 mr-1" />
                              {accommodation.accommodation_type}
                            </div>
                            <div className="flex items-center">
                              <Star className="w-4 h-4 mr-1" />
                              {accommodation.rating || 0} ({accommodation.review_count || 0}개 리뷰)
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-bold">₩{formatPrice(accommodation.base_price)}</div>
                          <div className="text-sm text-gray-600">/당일</div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="mt-2"
                            onClick={() => router.push(`/host/accommodations/${accommodation.id}/edit`)}
                          >
                            수정
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 분석 탭 */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  매출 분석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>매출 분석 차트는 곧 추가될 예정입니다.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  )
}