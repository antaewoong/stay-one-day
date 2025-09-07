'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { 
  Search,
  Calendar,
  MapPin,
  Users,
  Clock,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Star,
  MessageCircle,
  DollarSign,
  CalendarDays,
  Building,
  Eye
} from 'lucide-react'
import Header from '@/components/header'
import Link from 'next/link'

interface ReservationWithAccommodation {
  id: string
  reservation_number: string
  checkin_date: string
  checkout_date: string
  guest_count: number
  guest_name: string
  guest_phone: string
  guest_email: string
  total_amount: number
  payment_status: string
  status: string
  special_requests: string | null
  created_at: string
  accommodations: {
    id: string
    name: string
    region: string
    accommodation_type: string
    accommodation_images: { image_url: string }[]
  }
}

export default function ReservationsPage() {
  const supabase = createClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [reservations, setReservations] = useState<ReservationWithAccommodation[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const searchReservations = async () => {
    if (!phoneNumber && !searchQuery) {
      alert('전화번호 또는 예약번호를 입력해주세요.')
      return
    }

    try {
      setLoading(true)
      
      let query = supabase
        .from('reservations')
        .select(`
          *,
          accommodations!inner(
            id, name, region, accommodation_type,
            accommodation_images(image_url)
          )
        `)

      if (phoneNumber) {
        query = query.eq('guest_phone', phoneNumber)
      } else if (searchQuery) {
        query = query.eq('reservation_number', searchQuery)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      setReservations(data || [])
      setSearched(true)
    } catch (error) {
      console.error('예약 조회 실패:', error)
      alert('예약 조회에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">예약확정</Badge>
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">이용완료</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">결제대기</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">취소됨</Badge>
      case 'no_show':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">노쇼</Badge>
      default:
        return <Badge variant="secondary">알 수 없음</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch(status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">결제완료</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">결제대기</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">결제취소</Badge>
      case 'refunded':
        return <Badge className="bg-purple-100 text-purple-800">환불완료</Badge>
      case 'partial_refund':
        return <Badge className="bg-orange-100 text-orange-800">부분환불</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filterReservations = (status: string) => {
    if (status === 'all') return reservations
    return reservations.filter(r => r.status === status)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* 히어로 섹션 */}
          <section className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              예약 조회
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              예약번호나 전화번호로 간편하게<br />
              예약 내역을 확인하고 관리하세요
            </p>
          </section>

          {/* 검색 섹션 */}
          <section className="mb-12">
            <Card className="shadow-lg border-0">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="font-bold text-xl mb-2">예약 내역 검색</h3>
                  <p className="text-gray-600">전화번호 또는 예약번호로 검색하세요</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <Label htmlFor="reservation-id" className="text-sm font-medium text-gray-700">예약번호</Label>
                    <div className="relative mt-1">
                      <Input
                        id="reservation-id"
                        type="text"
                        placeholder="RSV-2024-001"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">예약자 전화번호</Label>
                    <div className="relative mt-1">
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="010-0000-0000"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="pl-10"
                      />
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <Button 
                    size="lg" 
                    onClick={searchReservations} 
                    disabled={loading}
                    className="px-8 bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        검색 중...
                      </div>
                    ) : (
                      <>
                        <Search className="w-5 h-5 mr-2" />
                        예약 조회하기
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 예약 내역 섹션 */}
          {searched && (
            <section>
              {reservations.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">예약 내역을 찾을 수 없습니다</h3>
                    <p className="text-gray-600 mb-6">
                      입력하신 정보로 예약 내역을 찾을 수 없습니다.<br />
                      예약번호나 전화번호를 다시 확인해주세요.
                    </p>
                    <Button variant="outline" onClick={() => {
                      setSearchQuery('')
                      setPhoneNumber('')
                      setSearched(false)
                    }}>
                      다시 검색하기
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-8">
                    <TabsTrigger value="all">
                      전체 ({reservations.length})
                    </TabsTrigger>
                    <TabsTrigger value="confirmed">
                      예약확정 ({filterReservations('confirmed').length})
                    </TabsTrigger>
                    <TabsTrigger value="completed">
                      이용완료 ({filterReservations('completed').length})
                    </TabsTrigger>
                    <TabsTrigger value="cancelled">
                      취소됨 ({filterReservations('cancelled').length})
                    </TabsTrigger>
                  </TabsList>
                  
                  {['all', 'confirmed', 'completed', 'cancelled'].map((tabValue) => (
                    <TabsContent key={tabValue} value={tabValue} className="space-y-6">
                      {filterReservations(tabValue).map((reservation) => (
                        <Card key={reservation.id} className="overflow-hidden shadow-lg border-0 hover:shadow-xl transition-shadow">
                          <div className="grid md:grid-cols-4 gap-0">
                            
                            {/* 이미지 */}
                            <div className="md:col-span-1">
                              <img 
                                src={reservation.accommodations.accommodation_images?.[0]?.image_url || '/placeholder-accommodation.jpg'} 
                                alt={reservation.accommodations.name}
                                className="w-full h-48 md:h-full object-cover"
                              />
                            </div>

                            {/* 예약 정보 */}
                            <div className="md:col-span-3 p-6">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-bold text-xl text-gray-900">{reservation.accommodations.name}</h3>
                                    {getStatusBadge(reservation.status)}
                                  </div>
                                  <div className="text-gray-600 mb-2 font-mono text-sm">
                                    예약번호: {reservation.reservation_number}
                                  </div>
                                  <div className="flex items-center text-gray-600 mb-1">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {reservation.accommodations.region}
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {reservation.accommodations.accommodation_type}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-blue-600">
                                    ₩{reservation.total_amount.toLocaleString()}
                                  </div>
                                  <div className="text-sm text-gray-500 mb-2">총 결제 금액</div>
                                  {getPaymentStatusBadge(reservation.payment_status)}
                                </div>
                              </div>
                              
                              <div className="grid md:grid-cols-3 gap-4 mb-4">
                                <div className="flex items-center text-gray-700">
                                  <CalendarDays className="w-4 h-4 mr-2 text-blue-600" />
                                  <div>
                                    <div className="font-medium">체크인</div>
                                    <div className="text-sm">{new Date(reservation.checkin_date).toLocaleDateString('ko-KR')}</div>
                                  </div>
                                </div>
                                <div className="flex items-center text-gray-700">
                                  <Calendar className="w-4 h-4 mr-2 text-red-600" />
                                  <div>
                                    <div className="font-medium">체크아웃</div>
                                    <div className="text-sm">{new Date(reservation.checkout_date).toLocaleDateString('ko-KR')}</div>
                                  </div>
                                </div>
                                <div className="flex items-center text-gray-700">
                                  <Users className="w-4 h-4 mr-2 text-green-600" />
                                  <div>
                                    <div className="font-medium">인원</div>
                                    <div className="text-sm">{reservation.guest_count}명</div>
                                  </div>
                                </div>
                              </div>

                              {/* 예약자 정보 */}
                              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <h4 className="font-medium text-gray-900 mb-2">예약자 정보</h4>
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                  <div className="flex items-center text-gray-600">
                                    <Users className="w-4 h-4 mr-2" />
                                    {reservation.guest_name}
                                  </div>
                                  <div className="flex items-center text-gray-600">
                                    <Phone className="w-4 h-4 mr-2" />
                                    {reservation.guest_phone}
                                  </div>
                                  {reservation.guest_email && (
                                    <div className="flex items-center text-gray-600 md:col-span-2">
                                      <Mail className="w-4 h-4 mr-2" />
                                      {reservation.guest_email}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* 특별 요청사항 */}
                              {reservation.special_requests && (
                                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                                  <div className="flex items-center mb-2">
                                    <MessageCircle className="w-4 h-4 mr-2 text-blue-600" />
                                    <span className="font-medium text-blue-900">특별 요청사항</span>
                                  </div>
                                  <p className="text-blue-800 text-sm">{reservation.special_requests}</p>
                                </div>
                              )}
                              
                              <div className="flex justify-between items-center pt-4 border-t">
                                <div className="text-sm text-gray-500">
                                  예약일: {new Date(reservation.created_at).toLocaleDateString('ko-KR')}
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" asChild>
                                    <Link href={`/spaces/${reservation.accommodations.id}`} target="_blank">
                                      <Eye className="w-4 h-4 mr-1" />
                                      숙소 보기
                                    </Link>
                                  </Button>
                                  {reservation.status === 'confirmed' && reservation.payment_status === 'paid' && (
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                      <Download className="w-4 h-4 mr-1" />
                                      예약증 다운로드
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </section>
          )}

          {/* 안내사항 */}
          <section className="mt-12">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-blue-900 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  예약 조회 안내
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
                  <div>
                    <h4 className="font-semibold mb-2">검색 방법</h4>
                    <ul className="space-y-1">
                      <li>• 예약번호(RSV-XXXX-XXX) 입력</li>
                      <li>• 예약시 사용한 전화번호 입력</li>
                      <li>• 둘 중 하나만 입력하면 검색 가능</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">문의 사항</h4>
                    <ul className="space-y-1">
                      <li>• 예약 변경: 체크인 24시간 전까지</li>
                      <li>• 취소 및 환불: 정책에 따라 처리</li>
                      <li>• 고객센터: 070-1234-5678</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  )
}