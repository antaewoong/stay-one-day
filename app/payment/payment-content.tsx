'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CreditCard, 
  Shield, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Calendar,
  MapPin,
  Users,
  Smartphone,
  Building,
  Zap
} from 'lucide-react'
import OptimizedImage from '@/components/optimized-image'
import Link from 'next/link'

interface PaymentInfo {
  reservationId: string
  accommodationName: string
  accommodationImage: string
  region: string
  checkinDate: string
  checkoutDate: string
  guestCount: number
  totalAmount: number
  nights: number
  guestName: string
  guestEmail: string
  guestPhone: string
}

// 토스페이먼츠 스크립트 로드
const loadTossPayments = () => {
  return new Promise((resolve, reject) => {
    if ((window as any).TossPayments) {
      resolve((window as any).TossPayments)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://js.tosspayments.com/v1/payment'
    script.onload = () => resolve((window as any).TossPayments)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export default function PaymentPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [selectedMethod, setSelectedMethod] = useState('card')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadPaymentInfo()
  }, [])

  const loadPaymentInfo = async () => {
    try {
      const reservationId = searchParams.get('reservation')
      if (!reservationId) {
        alert('결제 정보를 찾을 수 없습니다.')
        router.push('/spaces')
        return
      }

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
        alert('예약 정보를 찾을 수 없습니다.')
        router.push('/spaces')
        return
      }

      const checkin = new Date(reservation.checkin_date)
      const checkout = new Date(reservation.checkout_date)
      const diffTime = Math.abs(checkout.getTime() - checkin.getTime())
      const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      setPaymentInfo({
        reservationId: reservation.id,
        accommodationName: reservation.accommodation.name,
        accommodationImage: reservation.accommodation.accommodation_images?.[0]?.image_url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&crop=center',
        region: reservation.accommodation.region,
        checkinDate: reservation.checkin_date,
        checkoutDate: reservation.checkout_date,
        guestCount: reservation.guest_count,
        totalAmount: reservation.total_amount,
        nights,
        guestName: reservation.guest_name,
        guestEmail: reservation.guest_email,
        guestPhone: reservation.guest_phone
      })

    } catch (error) {
      console.error('결제 정보 로드 실패:', error)
      alert('결제 정보를 불러오는 중 오류가 발생했습니다.')
      router.push('/spaces')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!paymentInfo) return

    setIsProcessing(true)

    try {
      // 토스페이먼츠 초기화 (실제 환경에서는 환경변수로 관리)
      const TossPayments = await loadTossPayments()
      const tossPayments = (TossPayments as any)('test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq') // 테스트 키

      // 결제 요청
      const paymentData = {
        amount: paymentInfo.totalAmount,
        orderId: `ORDER_${paymentInfo.reservationId}_${Date.now()}`,
        orderName: `${paymentInfo.accommodationName} ${paymentInfo.nights}박`,
        customerName: paymentInfo.guestName,
        customerEmail: paymentInfo.guestEmail,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`
      }

      if (selectedMethod === 'card') {
        await tossPayments.requestPayment('카드', paymentData)
      } else if (selectedMethod === 'transfer') {
        await tossPayments.requestPayment('계좌이체', paymentData)
      } else if (selectedMethod === 'phone') {
        await tossPayments.requestPayment('휴대폰', paymentData)
      }

    } catch (error) {
      console.error('결제 실패:', error)
      alert('결제 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsProcessing(false)
    }
  }

  const paymentMethods = [
    {
      id: 'card',
      name: '신용/체크카드',
      icon: CreditCard,
      description: '국내외 모든 카드 사용 가능',
      recommended: true
    },
    {
      id: 'transfer',
      name: '계좌이체',
      icon: Building,
      description: '실시간 계좌이체로 즉시 결제',
      recommended: false
    },
    {
      id: 'phone',
      name: '휴대폰 결제',
      icon: Smartphone,
      description: '통신사 소액결제 서비스',
      recommended: false
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">결제 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!paymentInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-4">결제 정보 오류</h2>
            <p className="text-gray-600 mb-6">결제 정보를 찾을 수 없습니다.</p>
            <Button asChild className="w-full">
              <Link href="/spaces">숙소 목록으로 돌아가기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
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
            <h1 className="ml-6 text-xl font-bold text-gray-900">결제하기</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 결제 방법 선택 */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* 보안 안내 */}
              <Card className="border-gray-200 bg-gray-50">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Shield className="w-6 h-6 text-gray-600 mr-3" />
                    <div>
                      <h3 className="font-semibold text-gray-900">안전한 결제</h3>
                      <p className="text-gray-700 text-sm">
                        토스페이먼츠의 보안 시스템으로 안전하게 보호됩니다
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 결제 방법 */}
              <Card>
                <CardHeader>
                  <CardTitle>결제 방법 선택</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon
                    return (
                      <div
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          selectedMethod === method.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {method.recommended && (
                          <Badge className="absolute top-2 right-2 bg-blue-500">추천</Badge>
                        )}
                        <div className="flex items-center">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                            selectedMethod === method.id ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <Icon className={`w-6 h-6 ${
                              selectedMethod === method.id ? 'text-blue-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{method.name}</h3>
                            <p className="text-sm text-gray-600">{method.description}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 ${
                            selectedMethod === method.id
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedMethod === method.id && (
                              <CheckCircle className="w-4 h-4 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* 결제 버튼 */}
              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full h-14 text-lg font-bold bg-gray-900 hover:bg-gray-800"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    결제 처리 중...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    ₩{paymentInfo.totalAmount.toLocaleString()} 결제하기
                  </>
                )}
              </Button>

              {/* 결제 안내 */}
              <div className="text-sm text-gray-600 space-y-2">
                <p>• 결제 완료 후 예약이 확정됩니다.</p>
                <p>• 취소 및 환불 정책은 숙소별로 다를 수 있습니다.</p>
                <p>• 문의사항이 있으시면 고객센터로 연락해주세요.</p>
              </div>
            </div>

            {/* 예약 요약 */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card>
                  <CardHeader>
                    <CardTitle>예약 요약</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* 숙소 정보 */}
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-4">
                      <OptimizedImage
                        src={paymentInfo.accommodationImage}
                        alt={paymentInfo.accommodationName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    
                    <h3 className="font-bold text-lg mb-2">{paymentInfo.accommodationName}</h3>
                    <div className="flex items-center text-gray-600 text-sm mb-4">
                      <MapPin className="w-4 h-4 mr-1" />
                      {paymentInfo.region}
                    </div>

                    <Separator className="my-4" />

                    {/* 예약 상세 */}
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-4 h-4 mr-1" />
                          체크인
                        </div>
                        <span className="font-medium">
                          {new Date(paymentInfo.checkinDate).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-4 h-4 mr-1" />
                          체크아웃
                        </div>
                        <span className="font-medium">
                          {new Date(paymentInfo.checkoutDate).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-gray-600">
                          <Users className="w-4 h-4 mr-1" />
                          게스트
                        </div>
                        <span className="font-medium">{paymentInfo.guestCount}명</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-4 h-4 mr-1" />
                          숙박 기간
                        </div>
                        <span className="font-medium">{paymentInfo.nights}박</span>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* 예약자 정보 */}
                    <div className="space-y-2 text-sm">
                      <h4 className="font-semibold text-gray-900">예약자 정보</h4>
                      <div className="flex items-center text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        {paymentInfo.guestName}
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* 가격 상세 */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>숙박료 ({paymentInfo.nights}박)</span>
                        <span>₩{paymentInfo.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>청소비</span>
                        <span>₩0</span>
                      </div>
                      <div className="flex justify-between">
                        <span>서비스 수수료</span>
                        <span>₩0</span>
                      </div>
                      
                      <Separator className="my-2" />
                      
                      <div className="flex justify-between font-bold text-lg text-gray-900">
                        <span>총 결제 금액</span>
                        <span>₩{paymentInfo.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}