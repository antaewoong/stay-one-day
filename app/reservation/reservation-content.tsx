'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  Users, 
  MapPin, 
  Clock,
  CreditCard,
  CheckCircle,
  ArrowLeft,
  User,
  Phone,
  Mail,
  MessageCircle
} from 'lucide-react'
import OptimizedImage from '@/components/optimized-image'
import Link from 'next/link'
import { trackBookingCompleted, trackBookingStarted } from '@/lib/analytics/booking-tracker'

interface Accommodation {
  id: string
  name: string
  description: string
  accommodation_type: string
  region: string
  address: string
  max_capacity: number
  bedrooms: number
  bathrooms: number
  base_price: number
  weekend_price: number
  checkin_time: string
  checkout_time: string
  accommodation_images?: { image_url: string; alt_text?: string }[]
}

interface ReservationData {
  accommodation_id: string
  guest_name: string
  guest_email: string
  guest_phone: string
  checkin_date: string
  checkout_date: string
  guest_count: number
  total_amount: number
  special_requests?: string
}

export default function ReservationPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const accommodationId = searchParams.get('id')
  const checkinDate = searchParams.get('checkin') || ''
  const checkoutDate = searchParams.get('checkout') || ''
  const guestCount = parseInt(searchParams.get('guests') || '2')

  const [accommodation, setAccommodation] = useState<Accommodation | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [reservationData, setReservationData] = useState<ReservationData>({
    accommodation_id: accommodationId || '',
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    checkin_date: checkinDate,
    checkout_date: checkoutDate,
    guest_count: guestCount,
    total_amount: 0,
    special_requests: ''
  })

  const [nights, setNights] = useState(1)
  const [totalPrice, setTotalPrice] = useState(0)

  useEffect(() => {
    if (accommodationId) {
      loadAccommodation()
      
      // 🎯 예약 시작 추적
      if (checkinDate && checkoutDate) {
        trackBookingStarted({
          accommodationId,
          accommodationName: '',
          checkInDate: checkinDate,
          checkOutDate: checkoutDate,
          guestCount
        })
      }
    }
  }, [accommodationId])

  useEffect(() => {
    if (checkinDate && checkoutDate && accommodation) {
      const checkin = new Date(checkinDate)
      const checkout = new Date(checkoutDate)
      const diffTime = Math.abs(checkout.getTime() - checkin.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      setNights(diffDays > 0 ? diffDays : 1)
      
      // 주말 가격 계산 로직 (간단화)
      const isWeekend = checkin.getDay() === 5 || checkin.getDay() === 6 || checkout.getDay() === 0 || checkout.getDay() === 6
      const pricePerNight = isWeekend ? accommodation.weekend_price : accommodation.base_price
      const calculatedTotal = pricePerNight * diffDays
      setTotalPrice(calculatedTotal)
      setReservationData(prev => ({ ...prev, total_amount: calculatedTotal }))
    }
  }, [checkinDate, checkoutDate, accommodation])

  const loadAccommodation = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('accommodations')
        .select(`
          *,
          accommodation_images(image_url, alt_text)
        `)
        .eq('id', accommodationId)
        .single()

      if (error) {
        console.error('숙소 정보 로드 실패:', error)
        return
      }

      setAccommodation(data)
    } catch (error) {
      console.error('숙소 정보 로드 중 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // 예약 번호 생성
      const reservationNumber = `RSV-${Date.now()}`
      
      const { data: newReservation, error } = await supabase
        .from('reservations')
        .insert({
          reservation_number: reservationNumber,
          ...reservationData,
          payment_status: 'pending',
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        console.error('예약 생성 실패:', error)
        alert('예약 처리 중 오류가 발생했습니다.')
        return
      }

      // 🎯 예약 완료 추적 실행
      if (newReservation && accommodation) {
        try {
          await trackBookingCompleted({
            reservationId: newReservation.reservation_number,
            accommodationId: accommodation.id,
            accommodationName: accommodation.name,
            hostId: accommodation.host_id || '',
            guestName: reservationData.guest_name,
            guestEmail: reservationData.guest_email,
            guestPhone: reservationData.guest_phone,
            totalAmount: reservationData.total_amount,
            checkInDate: reservationData.checkin_date,
            checkOutDate: reservationData.checkout_date,
            guestCount: reservationData.guest_count,
            location: accommodation.region,
            bookingAt: new Date()
          })
          console.log('✅ 예약 완료 추적 성공')
        } catch (trackingError) {
          console.error('⚠️ 예약 추적 실패 (예약은 성공):', trackingError)
          // 추적 실패해도 예약 성공은 유지
        }
      }

      alert('예약이 성공적으로 접수되었습니다! 확인 후 연락드리겠습니다.')
      router.push('/spaces')
    } catch (error) {
      console.error('예약 처리 중 오류:', error)
      alert('예약 처리 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">숙소 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!accommodation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">숙소를 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-6">요청하신 숙소가 존재하지 않거나 예약할 수 없습니다.</p>
          <Button asChild>
            <Link href="/spaces">
              <ArrowLeft className="w-4 h-4 mr-2" />
              숙소 목록으로 돌아가기
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-16">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="flex items-center text-gray-700 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              뒤로가기
            </Button>
            <h1 className="ml-6 text-xl font-bold text-gray-900">예약하기</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 예약 폼 */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 예약자 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    예약자 정보
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이름 *
                    </label>
                    <Input
                      required
                      placeholder="예약자 이름을 입력해주세요"
                      value={reservationData.guest_name}
                      onChange={(e) => setReservationData(prev => ({ 
                        ...prev, 
                        guest_name: e.target.value 
                      }))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        이메일 *
                      </label>
                      <Input
                        type="email"
                        required
                        placeholder="이메일 주소"
                        value={reservationData.guest_email}
                        onChange={(e) => setReservationData(prev => ({ 
                          ...prev, 
                          guest_email: e.target.value 
                        }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        연락처 *
                      </label>
                      <Input
                        required
                        placeholder="010-0000-0000"
                        value={reservationData.guest_phone}
                        onChange={(e) => setReservationData(prev => ({ 
                          ...prev, 
                          guest_phone: e.target.value 
                        }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 특별 요청사항 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    특별 요청사항
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="특별한 요청사항이 있으시면 작성해주세요 (선택사항)"
                    rows={4}
                    value={reservationData.special_requests}
                    onChange={(e) => setReservationData(prev => ({ 
                      ...prev, 
                      special_requests: e.target.value 
                    }))}
                  />
                </CardContent>
              </Card>

              {/* 예약 버튼 */}
              <Button 
                type="submit" 
                disabled={submitting}
                className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    예약 처리 중...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    예약하기
                  </>
                )}
              </Button>

              <p className="text-sm text-gray-600 text-center">
                예약 확정 후 결제 정보를 안내해드립니다.
              </p>
            </form>
          </div>

          {/* 오른쪽: 예약 요약 */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardContent className="p-6">
                  {/* 숙소 정보 */}
                  <div className="mb-6">
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-4">
                      <OptimizedImage
                        src={accommodation.accommodation_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&crop=center'}
                        alt={accommodation.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{accommodation.name}</h3>
                    <div className="flex items-center text-gray-600 text-sm mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {accommodation.region}
                    </div>
                    <Badge variant="outline">{accommodation.accommodation_type}</Badge>
                  </div>

                  <Separator className="my-6" />

                  {/* 예약 상세 */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">예약 상세</h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="flex items-center text-gray-600 mb-1">
                          <Calendar className="w-4 h-4 mr-1" />
                          체크인
                        </div>
                        <div className="font-medium">
                          {new Date(checkinDate).toLocaleDateString('ko-KR')}
                        </div>
                        <div className="text-gray-500 text-xs">{accommodation.checkin_time}</div>
                      </div>
                      <div>
                        <div className="flex items-center text-gray-600 mb-1">
                          <Calendar className="w-4 h-4 mr-1" />
                          체크아웃
                        </div>
                        <div className="font-medium">
                          {new Date(checkoutDate).toLocaleDateString('ko-KR')}
                        </div>
                        <div className="text-gray-500 text-xs">{accommodation.checkout_time}</div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center text-gray-600 mb-1 text-sm">
                        <Users className="w-4 h-4 mr-1" />
                        게스트
                      </div>
                      <div className="font-medium">{guestCount}명</div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* 가격 상세 */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">가격 상세</h4>
                    <div className="flex justify-between text-sm">
                      <span>₩{accommodation.base_price.toLocaleString()} × {nights}박</span>
                      <span>₩{totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>청소비</span>
                      <span>₩0</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>서비스 수수료</span>
                      <span>₩0</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>총 금액</span>
                      <span className="text-blue-600">₩{totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}