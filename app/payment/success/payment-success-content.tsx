'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle,
  Calendar,
  MapPin,
  Users,
  CreditCard,
  Download,
  Home,
  MessageCircle,
  Star,
  Clock
} from 'lucide-react'
import OptimizedImage from '@/components/optimized-image'
import Link from 'next/link'

interface PaymentResult {
  orderId: string
  paymentKey: string
  amount: number
  reservationId: string
  accommodationName: string
  accommodationImage: string
  region: string
  checkinDate: string
  checkoutDate: string
  guestCount: number
  nights: number
  guestName: string
  status: 'success' | 'failed'
}

export default function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null)

  useEffect(() => {
    verifyPayment()
  }, [])

  const verifyPayment = async () => {
    try {
      const paymentKey = searchParams.get('paymentKey')
      const orderId = searchParams.get('orderId')
      const amount = searchParams.get('amount')

      if (!paymentKey || !orderId || !amount) {
        router.push('/payment/fail?message=결제 정보가 올바르지 않습니다')
        return
      }

      // 토스페이먼츠 결제 승인 API 호출 (실제 환경에서는 서버에서 처리)
      const response = await fetch('/api/payment/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: parseInt(amount)
        })
      })

      if (!response.ok) {
        throw new Error('결제 승인 실패')
      }

      const paymentData = await response.json()

      // 예약 상태 업데이트
      const reservationId = orderId.split('_')[1] // ORDER_{reservationId}_{timestamp} 형식
      
      await supabase
        .from('reservations')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          payment_key: paymentKey
        })
        .eq('id', reservationId)

      // 예약 정보 가져오기
      const { data: reservation, error } = await supabase
        .from('reservations')
        .select(`
          *,
          accommodation:accommodations(
            name,
            region,
            accommodation_images(image_url)
          )
        `)
        .eq('id', reservationId)
        .single()

      if (error || !reservation) {
        throw new Error('예약 정보 조회 실패')
      }

      const checkin = new Date(reservation.checkin_date)
      const checkout = new Date(reservation.checkout_date)
      const diffTime = Math.abs(checkout.getTime() - checkin.getTime())
      const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      setPaymentResult({
        orderId,
        paymentKey,
        amount: parseInt(amount),
        reservationId: reservation.id,
        accommodationName: reservation.accommodation.name,
        accommodationImage: reservation.accommodation.accommodation_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&crop=center',
        region: reservation.accommodation.region,
        checkinDate: reservation.checkin_date,
        checkoutDate: reservation.checkout_date,
        guestCount: reservation.guest_count,
        nights,
        guestName: reservation.guest_name,
        status: 'success'
      })

    } catch (error) {
      console.error('결제 검증 실패:', error)
      router.push('/payment/fail?message=결제 처리 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">결제 결과를 확인하는 중...</p>
        </div>
      </div>
    )
  }

  if (!paymentResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-4">결제 결과 오류</h2>
            <p className="text-gray-600 mb-6">결제 결과를 확인할 수 없습니다.</p>
            <Button asChild className="w-full">
              <Link href="/spaces">숙소 목록으로 돌아가기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          
          {/* 성공 메시지 */}
          <Card className="mb-8 border border-gray-200 shadow-lg bg-white">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">결제가 완료되었습니다!</h1>
              <p className="text-gray-600 text-lg mb-6">
                예약이 성공적으로 확정되었습니다.<br />
                예약 확인서가 이메일로 발송되었습니다.
              </p>
              
              {/* 예약 번호 */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <div className="text-sm text-gray-600 mb-2">주문번호</div>
                <div className="text-xl font-bold text-gray-900 font-mono">
                  {paymentResult.orderId}
                </div>
              </div>

              {/* 빠른 액션 */}
              <div className="grid grid-cols-2 gap-4">
                <Button asChild variant="outline" className="h-12">
                  <Link href="/profile">
                    <Calendar className="w-4 h-4 mr-2" />
                    예약 관리
                  </Link>
                </Button>
                <Button asChild className="h-12 bg-gray-900 hover:bg-gray-800">
                  <Link href="/spaces">
                    <Home className="w-4 h-4 mr-2" />
                    다른 숙소 보기
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 예약 상세 정보 */}
          <Card className="border border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                예약 상세 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* 숙소 정보 */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  <OptimizedImage
                    src={paymentResult.accommodationImage}
                    alt={paymentResult.accommodationName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{paymentResult.accommodationName}</h3>
                  <div className="flex items-center text-gray-600 text-sm">
                    <MapPin className="w-4 h-4 mr-1" />
                    {paymentResult.region}
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">예약 확정</Badge>
              </div>

              <Separator className="my-6" />

              {/* 예약 정보 */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-600 mb-2">체크인</div>
                  <div className="font-semibold">
                    {new Date(paymentResult.checkinDate).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short'
                    })}
                  </div>
                  <div className="text-sm text-gray-600">15:00부터</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-2">체크아웃</div>
                  <div className="font-semibold">
                    {new Date(paymentResult.checkoutDate).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short'
                    })}
                  </div>
                  <div className="text-sm text-gray-600">11:00까지</div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* 게스트 정보 */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-600 mb-2">예약자</div>
                  <div className="font-semibold">{paymentResult.guestName}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-2">인원</div>
                  <div className="font-semibold">{paymentResult.guestCount}명</div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* 결제 정보 */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <CreditCard className="w-5 h-5 text-gray-600 mr-2" />
                    <span className="font-semibold text-gray-900">결제 완료</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    ₩{paymentResult.amount.toLocaleString()}
                  </div>
                </div>
                <div className="text-sm text-gray-700">
                  결제일: {new Date().toLocaleDateString('ko-KR')} {new Date().toLocaleTimeString('ko-KR')}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 다음 단계 안내 */}
          <Card className="mt-8 border-gray-200 bg-gray-50">
            <CardContent className="p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                다음 단계
              </h3>
              <div className="space-y-3 text-gray-800">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-800 text-sm font-bold mr-3 mt-0.5">1</div>
                  <div>
                    <div className="font-medium">예약 확인서 수신</div>
                    <div className="text-sm text-gray-700">이메일로 예약 확인서와 체크인 안내가 발송됩니다.</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-800 text-sm font-bold mr-3 mt-0.5">2</div>
                  <div>
                    <div className="font-medium">호스트 연락</div>
                    <div className="text-sm text-gray-700">체크인 1일 전, 호스트가 상세 안내를 드립니다.</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-800 text-sm font-bold mr-3 mt-0.5">3</div>
                  <div>
                    <div className="font-medium">체크인 및 숙박</div>
                    <div className="text-sm text-gray-700">예정된 날짜에 체크인하여 편안한 숙박을 즐기세요!</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 고객 지원 */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">문의사항이 있으시면 언제든지 연락해주세요.</p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" size="sm" className="flex items-center">
                <MessageCircle className="w-4 h-4 mr-2" />
                고객센터 채팅
              </Button>
              <Button variant="outline" size="sm" className="flex items-center">
                <Download className="w-4 h-4 mr-2" />
                영수증 다운로드
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}