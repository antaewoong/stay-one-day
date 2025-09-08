'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  PhoneCall
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  total_reservations: number
  total_spent: number
  last_stay: string
  rating_avg: number
  notes: string
  created_at: string
  recent_reservation?: {
    id: string
    checkin_date: string
    checkout_date: string
    accommodation_name: string
    status: string
  }
}

interface Review {
  id: string
  customer_name: string
  accommodation_name: string
  rating: number
  comment: string
  created_at: string
  status: 'pending' | 'published' | 'hidden'
}

interface Inquiry {
  id: string
  customer_name: string
  customer_email: string
  accommodation_name: string
  message: string
  status: 'new' | 'responded' | 'closed'
  created_at: string
}

export default function HostCRMPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [hostId, setHostId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    const userData = sessionStorage.getItem('hostUser')
    if (userData) {
      const hostData = JSON.parse(userData)
      setHostId(hostData.id)
      fetchCRMData(hostData.id)
    }
  }, [])

  const fetchCRMData = async (hostId: string) => {
    try {
      setLoading(true)
      const supabase = createClient()

      // 고객 데이터 조회 (users 테이블과 조인하여 실제 고객 정보 가져오기)
      const { data: customerData } = await supabase
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
          accommodations!inner(host_id, name)
        `)
        .eq('accommodations.host_id', hostId)
        .in('status', ['confirmed', 'pending'])
        .order('checkin_date', { ascending: false })

      // 고객별로 그룹화
      const customerMap = new Map()
      customerData?.forEach(reservation => {
        const userId = reservation.user_id || reservation.guest_phone // user_id가 없으면 전화번호를 키로 사용
        const customerId = userId || `guest_${reservation.id}`
        
        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            id: customerId,
            name: reservation.guest_name || '게스트',
            phone: reservation.guest_phone || '',
            email: reservation.guest_email || '',
            total_reservations: 0,
            total_spent: 0,
            last_stay: reservation.checkin_date,
            recent_reservation: {
              id: reservation.id,
              checkin_date: reservation.checkin_date,
              checkout_date: reservation.checkout_date,
              accommodation_name: reservation.accommodations?.name || '',
              status: reservation.status
            }
          })
        }
        const customer = customerMap.get(customerId)
        customer.total_reservations += 1
        customer.total_spent += reservation.total_amount || 0
        if (reservation.checkin_date > customer.last_stay) {
          customer.last_stay = reservation.checkin_date
          customer.recent_reservation = {
            id: reservation.id,
            checkin_date: reservation.checkin_date,
            checkout_date: reservation.checkout_date,
            accommodation_name: reservation.accommodations?.name || '',
            status: reservation.status
          }
        }
      })

      const customerList = Array.from(customerMap.values())
      setCustomers(customerList)

      // 리뷰 데이터 조회
      const { data: reviewData } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          accommodations!inner(host_id, name)
        `)
        .eq('accommodations.host_id', hostId)
        .order('created_at', { ascending: false })

      setReviews(reviewData || [])

      // 문의 데이터 조회 (예약과 연결)
      const { data: inquiryData } = await supabase
        .from('reservations')
        .select(`
          id,
          user_id,
          special_requests,
          created_at,
          accommodations!inner(host_id, name)
        `)
        .eq('accommodations.host_id', hostId)
        .not('special_requests', 'is', null)
        .order('created_at', { ascending: false })

      setInquiries(inquiryData || [])

    } catch (error) {
      console.error('CRM 데이터 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCustomerRating = (customerId: string) => {
    const customerReviews = reviews.filter(r => r.customer_name === customerId)
    if (customerReviews.length === 0) return 0
    const avg = customerReviews.reduce((sum, r) => sum + r.rating, 0) / customerReviews.length
    return Math.round(avg * 10) / 10
  }

  const getCustomerSegment = (customer: Customer) => {
    if (customer.total_spent > 500000) return { label: 'VIP', color: 'bg-purple-100 text-purple-800' }
    if (customer.total_reservations > 5) return { label: '단골', color: 'bg-blue-100 text-blue-800' }
    if (customer.total_reservations > 2) return { label: '우수', color: 'bg-green-100 text-green-800' }
    return { label: '일반', color: 'bg-gray-100 text-gray-800' }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  // 연락 기능들
  const handleKakaoTalk = (phone: string, name: string) => {
    // 카카오톡 URL scheme (모바일에서만 작동)
    const message = encodeURIComponent(`안녕하세요 ${name}님, Stay One Day입니다.`)
    
    if (typeof window !== 'undefined') {
      // 모바일 환경 감지
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      if (isMobile) {
        // 카카오톡 앱으로 연결 시도
        window.location.href = `kakaotalk://send?text=${message}`
      } else {
        // 데스크톱에서는 웹 카카오톡으로 연결
        window.open('https://talk.kakao.com/', '_blank')
      }
    }
  }

  const handleSMS = (phone: string, name: string) => {
    const message = encodeURIComponent(`안녕하세요 ${name}님, Stay One Day입니다. 궁금한 점이 있으시면 언제든 연락주세요.`)
    
    if (typeof window !== 'undefined') {
      // 모바일에서는 SMS 앱으로 바로 연결
      window.location.href = `sms:${phone}?body=${message}`
    }
  }

  const handlePhoneCall = (phone: string) => {
    if (typeof window !== 'undefined') {
      // 전화 앱으로 바로 연결
      window.location.href = `tel:${phone}`
    }
  }

  const formatPhoneNumber = (phone: string) => {
    // 전화번호 포맷팅
    if (phone.length === 11) {
      return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
    }
    return phone
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">CRM 데이터를 불러오는 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">고객관계 관리 (CRM)</h1>
        <p className="text-gray-600">고객과의 관계를 관리하고 서비스 품질을 향상시키세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 고객 수</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}명</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 리뷰 점수</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reviews.length > 0 
                ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
                : 0
              }점
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 리뷰 수</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviews.length}개</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">문의 건수</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inquiries.length}건</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="customers">고객 관리</TabsTrigger>
          <TabsTrigger value="reviews">리뷰 관리</TabsTrigger>
          <TabsTrigger value="inquiries">문의 관리</TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>고객 목록</CardTitle>
              <CardDescription>
                귀하의 숙소를 이용한 고객들의 정보를 확인하고 관리하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 검색 및 필터 */}
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="고객 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* 고객 목록 */}
              <div className="space-y-4">
                {customers.map((customer) => {
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
                            <div>예약 횟수: {customer.total_reservations}회</div>
                            <div>총 결제 금액: {formatCurrency(customer.total_spent)}</div>
                            <div>최근 투숙: {format(new Date(customer.last_stay), 'yyyy.MM.dd', { locale: ko })}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm">{getCustomerRating(customer.id)}</span>
                        </div>
                      </div>

                      {/* 최근 예약 정보 */}
                      {customer.recent_reservation && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-3">
                          <div className="text-sm">
                            <div className="font-medium mb-1">최근 예약 정보</div>
                            <div className="text-gray-600">
                              <div>숙소: {customer.recent_reservation.accommodation_name}</div>
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

                      {/* 연락 버튼들 */}
                      {customer.phone && (
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleKakaoTalk(customer.phone, customer.name)}
                            className="flex items-center gap-2"
                          >
                            <MessageCircle className="h-4 w-4 text-yellow-500" />
                            카카오톡
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSMS(customer.phone, customer.name)}
                            className="flex items-center gap-2"
                          >
                            <MessageSquare className="h-4 w-4 text-green-500" />
                            문자
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handlePhoneCall(customer.phone)}
                            className="flex items-center gap-2"
                          >
                            <PhoneCall className="h-4 w-4 text-blue-500" />
                            전화
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
                
                {customers.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    예약 고객이 없습니다.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>리뷰 관리</CardTitle>
              <CardDescription>
                고객들이 남긴 리뷰를 확인하고 관리하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{review.accommodation_name}</h3>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">({review.rating}/5)</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {format(new Date(review.created_at), 'yyyy.MM.dd', { locale: ko })}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3">{review.comment}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">작성자: {review.customer_name}</span>
                      <Button variant="outline" size="sm">
                        답글 작성
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inquiries">
          <Card>
            <CardHeader>
              <CardTitle>문의 관리</CardTitle>
              <CardDescription>
                고객 문의와 특별 요청사항을 확인하고 관리하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inquiries.map((inquiry) => (
                  <div key={inquiry.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium">예약 ID: {inquiry.id}</h3>
                        <p className="text-sm text-gray-600">{inquiry.accommodations?.name}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {format(new Date(inquiry.created_at), 'yyyy.MM.dd', { locale: ko })}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded mb-3">
                      <p className="text-sm">{inquiry.special_requests}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">고객 ID: {inquiry.user_id}</span>
                      <Button variant="outline" size="sm">
                        답변 작성
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}