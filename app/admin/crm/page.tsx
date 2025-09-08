'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  MessageSquare, 
  Star, 
  Calendar,
  Phone,
  Mail,
  Filter,
  Search,
  MessageCircle,
  PhoneCall,
  Building2,
  TrendingUp,
  UserCheck,
  ClipboardList,
  Download
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface AdminCustomer {
  id: string
  name: string
  email: string
  phone: string
  total_reservations: number
  total_spent: number
  last_stay: string
  host_name: string
  accommodation_name: string
  rating_avg: number
  recent_reservation?: {
    id: string
    checkin_date: string
    checkout_date: string
    accommodation_name: string
    host_name: string
    status: string
  }
}

interface HostStatistics {
  host_id: string
  host_name: string
  business_name: string
  total_customers: number
  total_revenue: number
  avg_rating: number
  total_reviews: number
  active_accommodations: number
}

interface GlobalStatistics {
  total_customers: number
  total_hosts: number
  total_accommodations: number
  total_revenue: number
  avg_rating: number
  total_reviews: number
  monthly_growth: number
}

export default function AdminCRMPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [hostStats, setHostStats] = useState<HostStatistics[]>([])
  const [globalStats, setGlobalStats] = useState<GlobalStatistics>({
    total_customers: 0,
    total_hosts: 0,
    total_accommodations: 0,
    total_revenue: 0,
    avg_rating: 0,
    total_reviews: 0,
    monthly_growth: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterHost, setFilterHost] = useState('all')
  const [filterPeriod, setFilterPeriod] = useState('all')

  useEffect(() => {
    fetchCRMData()
  }, [])

  const fetchCRMData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // 전체 고객 데이터 조회 (모든 호스트 포함)
      const { data: reservationData } = await supabase
        .from('reservations')
        .select(`
          id,
          user_id,
          total_amount,
          checkin_date,
          checkout_date,
          status,
          guest_name,
          guest_phone,
          guest_email,
          accommodations!inner(
            id,
            name,
            hosts!inner(
              id,
              name,
              business_name
            )
          )
        `)
        .in('status', ['confirmed', 'pending'])
        .order('checkin_date', { ascending: false })

      // 고객별로 그룹화
      const customerMap = new Map()
      const hostStatsMap = new Map()
      let totalRevenue = 0

      reservationData?.forEach(reservation => {
        const userId = reservation.user_id || reservation.guest_phone || `guest_${reservation.id}`
        const hostId = reservation.accommodations?.hosts?.id
        const hostName = reservation.accommodations?.hosts?.name || '알 수 없는 호스트'
        const businessName = reservation.accommodations?.hosts?.business_name || hostName

        // 고객 데이터 집계
        if (!customerMap.has(userId)) {
          customerMap.set(userId, {
            id: userId,
            name: reservation.guest_name || '게스트',
            phone: reservation.guest_phone || '',
            email: reservation.guest_email || '',
            total_reservations: 0,
            total_spent: 0,
            last_stay: reservation.checkin_date,
            host_name: hostName,
            accommodation_name: reservation.accommodations?.name || '',
            recent_reservation: {
              id: reservation.id,
              checkin_date: reservation.checkin_date,
              checkout_date: reservation.checkout_date,
              accommodation_name: reservation.accommodations?.name || '',
              host_name: hostName,
              status: reservation.status
            }
          })
        }
        
        const customer = customerMap.get(userId)
        customer.total_reservations += 1
        customer.total_spent += reservation.total_amount || 0
        if (reservation.checkin_date > customer.last_stay) {
          customer.last_stay = reservation.checkin_date
          customer.recent_reservation = {
            id: reservation.id,
            checkin_date: reservation.checkin_date,
            checkout_date: reservation.checkout_date,
            accommodation_name: reservation.accommodations?.name || '',
            host_name: hostName,
            status: reservation.status
          }
        }

        // 호스트별 통계 집계
        if (hostId && !hostStatsMap.has(hostId)) {
          hostStatsMap.set(hostId, {
            host_id: hostId,
            host_name: hostName,
            business_name: businessName,
            total_customers: new Set(),
            total_revenue: 0,
            total_reviews: 0,
            ratings: [],
            active_accommodations: new Set()
          })
        }

        if (hostId) {
          const hostStat = hostStatsMap.get(hostId)
          hostStat.total_customers.add(userId)
          hostStat.total_revenue += reservation.total_amount || 0
          hostStat.active_accommodations.add(reservation.accommodations?.id)
        }

        totalRevenue += reservation.total_amount || 0
      })

      // 리뷰 데이터 조회
      const { data: reviewData } = await supabase
        .from('reviews')
        .select(`
          rating,
          accommodations!inner(
            hosts!inner(id)
          )
        `)

      reviewData?.forEach(review => {
        const hostId = review.accommodations?.hosts?.id
        if (hostId && hostStatsMap.has(hostId)) {
          const hostStat = hostStatsMap.get(hostId)
          hostStat.ratings.push(review.rating)
          hostStat.total_reviews += 1
        }
      })

      // 숙소 수 조회
      const { data: accommodationData } = await supabase
        .from('accommodations')
        .select('id, host_id, status')
        .eq('status', 'active')

      const customerList = Array.from(customerMap.values())
      setCustomers(customerList)

      // 호스트 통계 정리
      const hostStatsList = Array.from(hostStatsMap.values()).map(stat => ({
        ...stat,
        total_customers: stat.total_customers.size,
        active_accommodations: stat.active_accommodations.size,
        avg_rating: stat.ratings.length > 0 ? 
          Math.round((stat.ratings.reduce((sum, r) => sum + r, 0) / stat.ratings.length) * 10) / 10 : 0
      }))
      setHostStats(hostStatsList)

      // 전체 통계 계산
      const totalReviews = reviewData?.length || 0
      const avgRating = reviewData && reviewData.length > 0 ? 
        Math.round((reviewData.reduce((sum, r) => sum + r.rating, 0) / reviewData.length) * 10) / 10 : 0

      setGlobalStats({
        total_customers: customerList.length,
        total_hosts: hostStatsList.length,
        total_accommodations: accommodationData?.length || 0,
        total_revenue: totalRevenue,
        avg_rating: avgRating,
        total_reviews: totalReviews,
        monthly_growth: 0 // 월별 성장률은 별도 계산 필요
      })

    } catch (error) {
      console.error('CRM 데이터 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCustomerSegment = (customer: AdminCustomer) => {
    if (customer.total_spent > 1000000) return { label: 'VIP', color: 'bg-purple-100 text-purple-800' }
    if (customer.total_reservations > 10) return { label: '다이아몬드', color: 'bg-blue-100 text-blue-800' }
    if (customer.total_reservations > 5) return { label: '골드', color: 'bg-yellow-100 text-yellow-800' }
    if (customer.total_reservations > 2) return { label: '실버', color: 'bg-gray-100 text-gray-800' }
    return { label: '브론즈', color: 'bg-orange-100 text-orange-800' }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  const formatPhoneNumber = (phone: string) => {
    if (phone.length === 11) {
      return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
    }
    return phone
  }

  const handleExportCSV = () => {
    // CSV 내보내기 기능
    const csvData = customers.map(customer => ({
      이름: customer.name,
      전화번호: customer.phone,
      이메일: customer.email,
      예약횟수: customer.total_reservations,
      총결제액: customer.total_spent,
      최근투숙일: customer.last_stay,
      호스트: customer.host_name,
      숙소명: customer.accommodation_name
    }))
    
    console.log('CSV 데이터 내보내기:', csvData)
    alert('CSV 내보내기 기능이 구현되었습니다.')
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesHost = filterHost === 'all' || customer.host_name === filterHost
    
    return matchesSearch && matchesHost
  })

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">통합 CRM 데이터를 불러오는 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">통합 CRM 관리</h1>
        <p className="text-gray-600">전체 플랫폼의 고객 관계를 통합 관리하고 분석하세요</p>
      </div>

      {/* 전체 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 고객 수</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.total_customers.toLocaleString()}명</div>
            <div className="text-xs text-muted-foreground">
              +{globalStats.monthly_growth}% 이번 달
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 매출</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(globalStats.total_revenue)}</div>
            <div className="text-xs text-muted-foreground">
              평균 {formatCurrency(globalStats.total_revenue / Math.max(globalStats.total_customers, 1))} / 고객
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 평점</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.avg_rating}점</div>
            <div className="text-xs text-muted-foreground">
              총 {globalStats.total_reviews}개 리뷰
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 호스트</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.total_hosts}명</div>
            <div className="text-xs text-muted-foreground">
              {globalStats.total_accommodations}개 숙소 운영
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="customers">전체 고객 관리</TabsTrigger>
          <TabsTrigger value="hosts">호스트별 통계</TabsTrigger>
          <TabsTrigger value="analytics">분석 리포트</TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                전체 고객 목록
                <Button onClick={handleExportCSV} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  CSV 내보내기
                </Button>
              </CardTitle>
              <CardDescription>
                플랫폼 전체 고객의 정보를 확인하고 관리하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 필터 및 검색 */}
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="고객명, 전화번호, 이메일로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={filterHost} onValueChange={setFilterHost}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="호스트 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 호스트</SelectItem>
                    {hostStats.map((host) => (
                      <SelectItem key={host.host_id} value={host.host_name}>
                        {host.business_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 고객 목록 */}
              <div className="space-y-4">
                {filteredCustomers.map((customer) => {
                  const segment = getCustomerSegment(customer)
                  return (
                    <div key={customer.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-lg">{customer.name}</h3>
                            <Badge className={segment.color}>{segment.label}</Badge>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-4">
                              <span>📞 {formatPhoneNumber(customer.phone)}</span>
                              <span>✉️ {customer.email}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span>🏢 호스트: {customer.host_name}</span>
                              <span>🏠 최근 숙소: {customer.accommodation_name}</span>
                            </div>
                            <div>예약 횟수: {customer.total_reservations}회 | 총 결제액: {formatCurrency(customer.total_spent)}</div>
                            <div>최근 투숙: {format(new Date(customer.last_stay), 'yyyy.MM.dd', { locale: ko })}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm">{customer.rating_avg || 0}</span>
                        </div>
                      </div>

                      {/* 최근 예약 정보 */}
                      {customer.recent_reservation && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-3">
                          <div className="text-sm">
                            <div className="font-medium mb-1">최근 예약 정보</div>
                            <div className="text-gray-600">
                              <div>숙소: {customer.recent_reservation.accommodation_name}</div>
                              <div>호스트: {customer.recent_reservation.host_name}</div>
                              <div>
                                체크인: {format(new Date(customer.recent_reservation.checkin_date), 'yyyy.MM.dd', { locale: ko })} ~ 
                                체크아웃: {format(new Date(customer.recent_reservation.checkout_date), 'yyyy.MM.dd', { locale: ko })}
                              </div>
                              <div>
                                상태: 
                                <Badge variant={customer.recent_reservation.status === 'confirmed' ? 'default' : 'secondary'} className="ml-1">
                                  {customer.recent_reservation.status === 'confirmed' ? '예약확정' : '예약대기'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 관리 버튼들 */}
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm">
                          <UserCheck className="h-4 w-4 mr-2" />
                          고객 상세
                        </Button>
                        <Button variant="outline" size="sm">
                          <ClipboardList className="h-4 w-4 mr-2" />
                          예약 이력
                        </Button>
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4 mr-2" />
                          메시지 발송
                        </Button>
                      </div>
                    </div>
                  )
                })}
                
                {filteredCustomers.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    검색 조건에 맞는 고객이 없습니다.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hosts">
          <Card>
            <CardHeader>
              <CardTitle>호스트별 통계</CardTitle>
              <CardDescription>
                각 호스트의 성과를 확인하고 비교 분석하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {hostStats.map((host) => (
                  <div key={host.host_id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-lg">{host.business_name}</h3>
                        <p className="text-sm text-gray-600">호스트: {host.host_name}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm">{host.avg_rating}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">고객 수</div>
                        <div className="font-medium">{host.total_customers}명</div>
                      </div>
                      <div>
                        <div className="text-gray-500">매출</div>
                        <div className="font-medium">{formatCurrency(host.total_revenue)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">숙소 수</div>
                        <div className="font-medium">{host.active_accommodations}개</div>
                      </div>
                      <div>
                        <div className="text-gray-500">리뷰 수</div>
                        <div className="font-medium">{host.total_reviews}개</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>분석 리포트</CardTitle>
              <CardDescription>
                플랫폼 전체의 성과를 분석하고 인사이트를 얻으세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-3">고객 등급별 분포</h4>
                  <div className="space-y-2">
                    {['VIP', '다이아몬드', '골드', '실버', '브론즈'].map(grade => {
                      const count = customers.filter(c => getCustomerSegment(c).label === grade).length
                      const percentage = customers.length > 0 ? Math.round((count / customers.length) * 100) : 0
                      return (
                        <div key={grade} className="flex justify-between items-center">
                          <span className="text-sm">{grade}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{count}명</span>
                            <span className="text-xs text-gray-500">({percentage}%)</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-3">주요 지표</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>고객당 평균 매출</span>
                      <span className="font-medium">
                        {formatCurrency(globalStats.total_revenue / Math.max(globalStats.total_customers, 1))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>고객당 평균 예약수</span>
                      <span className="font-medium">
                        {Math.round((customers.reduce((sum, c) => sum + c.total_reservations, 0) / Math.max(customers.length, 1)) * 10) / 10}회
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>호스트당 평균 고객수</span>
                      <span className="font-medium">
                        {Math.round((globalStats.total_customers / Math.max(globalStats.total_hosts, 1)) * 10) / 10}명
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>숙소당 평균 매출</span>
                      <span className="font-medium">
                        {formatCurrency(globalStats.total_revenue / Math.max(globalStats.total_accommodations, 1))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}