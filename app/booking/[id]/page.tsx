'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calculateDayPrice, getPriceType, getPriceTypeLabel } from '@/lib/pricing'
import Header from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft,
  Calendar,
  Users,
  MapPin,
  Clock,
  CreditCard,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  User
} from 'lucide-react'
import OptimizedImage from '@/components/optimized-image'
import Link from 'next/link'

interface Accommodation {
  id: string
  name: string
  accommodation_type: string
  address: string
  region: string
  base_price: number
  weekend_price: number
  peak_season_price: number
  max_capacity: number
  images: string[]
  checkin_time: string
  checkout_time: string
  amenities: any[]
  extra_options: any[]
}

interface BookingData {
  accommodation_id: string
  date: string
  guests: number
  price: number
}

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // States
  const [accommodation, setAccommodation] = useState<Accommodation | null>(null)
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // Form data
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadData()
  }, [params.id])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Get user authentication
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('로그인이 필요합니다.')
        router.push('/auth/login')
        return
      }
      setUser(user)
      
      // Pre-fill user data
      setGuestName(user.user_metadata?.full_name || '')
      setGuestEmail(user.email || '')

      // Parse booking data from URL params
      const accommodationId = searchParams.get('accommodation_id')
      const date = searchParams.get('date')
      const guests = parseInt(searchParams.get('guests') || '0')
      const price = parseInt(searchParams.get('price') || '0')

      if (!accommodationId || !date || guests === 0) {
        alert('예약 정보가 올바르지 않습니다.')
        router.back()
        return
      }

      setBookingData({
        accommodation_id: accommodationId,
        date,
        guests,
        price
      })

      // Load accommodation data
      const { data: accommodationData, error } = await supabase
        .from('accommodations')
        .select('*')
        .eq('id', accommodationId)
        .single()

      if (error || !accommodationData) {
        throw new Error('숙소 정보를 찾을 수 없습니다.')
      }

      setAccommodation(accommodationData)
      
    } catch (error) {
      console.error('데이터 로드 실패:', error)
      alert('예약 정보를 불러올 수 없습니다.')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!guestName.trim()) {
      newErrors.guestName = '예약자 이름을 입력해주세요.'
    }

    if (!guestPhone.trim()) {
      newErrors.guestPhone = '연락처를 입력해주세요.'
    } else if (!/^01[0-9]-?[0-9]{4}-?[0-9]{4}$/.test(guestPhone.replace(/[^0-9]/g, ''))) {
      newErrors.guestPhone = '올바른 휴대폰 번호를 입력해주세요.'
    }

    if (guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      newErrors.guestEmail = '올바른 이메일 주소를 입력해주세요.'
    }

    if (!agreedToTerms) {
      newErrors.terms = '이용약관에 동의해주세요.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleOptionToggle = (optionName: string) => {
    setSelectedOptions(prev => 
      prev.includes(optionName)
        ? prev.filter(opt => opt !== optionName)
        : [...prev, optionName]
    )
  }

  const calculateTotalPrice = () => {
    if (!accommodation || !bookingData) return 0
    
    let total = bookingData.price
    
    // Add option prices
    if (accommodation.extra_options) {
      selectedOptions.forEach(optionName => {
        const option = accommodation.extra_options.find((opt: any) => opt.name === optionName)
        if (option) {
          total += option.price
        }
      })
    }
    
    return total
  }

  const handleSubmit = async () => {
    if (!validateForm() || !accommodation || !bookingData || !user) {
      return
    }

    setSubmitting(true)

    try {
      // Create reservation
      const reservationData = {
        accommodation_id: bookingData.accommodation_id,
        reservation_date: bookingData.date,
        guest_count: bookingData.guests,
        selected_options: selectedOptions,
        guest_name: guestName.trim(),
        guest_phone: guestPhone.replace(/[^0-9]/g, ''),
        guest_email: guestEmail.trim() || undefined,
        special_requests: specialRequests.trim() || undefined
      }

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData)
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.errors) {
          setErrors(result.errors)
        } else {
          throw new Error(result.error || '예약에 실패했습니다.')
        }
        return
      }

      // Redirect to payment page
      const reservationId = result.data.reservation.id
      router.push(`/payment?reservation=${reservationId}`)

    } catch (error) {
      console.error('예약 실패:', error)
      alert('예약 처리 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">예약 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!accommodation || !bookingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">예약 정보를 찾을 수 없습니다.</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              돌아가기
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const totalPrice = calculateTotalPrice()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">예약 확인</h1>
            <p className="text-gray-600 mt-1">예약 정보를 확인하고 결제를 진행하세요</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Accommodation Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  숙소 정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <OptimizedImage
                      src={accommodation.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=96&h=96&fit=crop&crop=center'}
                      alt={accommodation.name}
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">
                      {accommodation.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">
                      {accommodation.address}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <Badge variant="outline">{accommodation.accommodation_type}</Badge>
                      <span>최대 {accommodation.max_capacity}명</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  예약 세부사항
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">이용일</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium">{formatDate(bookingData.date)}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {accommodation.checkin_time.slice(0,5)} 입장 ~ {accommodation.checkout_time.slice(0,5)} 퇴장
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">인원</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {bookingData.guests}명
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">기본 요금</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium">₩{formatPrice(bookingData.price)}</div>
                      <div className="text-xs text-gray-500">당일 이용</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Options */}
            {accommodation.extra_options && accommodation.extra_options.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>추가 옵션</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {accommodation.extra_options.map((option: any, index: number) => (
                      <label key={index} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedOptions.includes(option.name)}
                          onChange={() => handleOptionToggle(option.name)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{option.name}</div>
                          <div className="text-sm text-gray-600">{option.description}</div>
                          <div className="text-sm font-medium text-blue-600 mt-1">
                            +₩{formatPrice(option.price)}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Guest Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  예약자 정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guestName">예약자 이름 *</Label>
                    <Input
                      id="guestName"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="홍길동"
                      className={errors.guestName ? 'border-red-500' : ''}
                    />
                    {errors.guestName && (
                      <p className="text-red-500 text-sm mt-1">{errors.guestName}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="guestPhone">연락처 *</Label>
                    <Input
                      id="guestPhone"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="010-1234-5678"
                      className={errors.guestPhone ? 'border-red-500' : ''}
                    />
                    {errors.guestPhone && (
                      <p className="text-red-500 text-sm mt-1">{errors.guestPhone}</p>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="guestEmail">이메일</Label>
                    <Input
                      id="guestEmail"
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="hong@example.com"
                      className={errors.guestEmail ? 'border-red-500' : ''}
                    />
                    {errors.guestEmail && (
                      <p className="text-red-500 text-sm mt-1">{errors.guestEmail}</p>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="specialRequests">특별 요청사항</Label>
                    <Textarea
                      id="specialRequests"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="추가 요청사항이 있으시면 입력해주세요"
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Terms Agreement */}
            <Card>
              <CardContent className="pt-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <span className="text-gray-700">
                      <Link href="/terms" className="text-blue-600 hover:underline">이용약관</Link> 및 
                      <Link href="/privacy" className="text-blue-600 hover:underline"> 개인정보처리방침</Link>에 동의합니다.
                    </span>
                    {errors.terms && (
                      <p className="text-red-500 text-sm mt-1">{errors.terms}</p>
                    )}
                  </div>
                </label>
              </CardContent>
            </Card>
          </div>

          {/* Right: Price Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  결제 정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Price Breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>기본 요금</span>
                      <span>₩{formatPrice(bookingData.price)}</span>
                    </div>
                    
                    {selectedOptions.length > 0 && (
                      <>
                        <Separator />
                        {selectedOptions.map(optionName => {
                          const option = accommodation.extra_options.find((opt: any) => opt.name === optionName)
                          return option ? (
                            <div key={optionName} className="flex justify-between text-sm">
                              <span>{option.name}</span>
                              <span>+₩{formatPrice(option.price)}</span>
                            </div>
                          ) : null
                        })}
                      </>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between text-lg font-bold">
                      <span>총 결제금액</span>
                      <span>₩{formatPrice(totalPrice)}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-semibold"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        처리중...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        안전 결제하기
                      </>
                    )}
                  </Button>
                  
                  <div className="text-center text-xs text-gray-500 space-y-1">
                    <div className="flex items-center justify-center gap-1">
                      <Shield className="w-3 h-3" />
                      <span>SSL 보안 결제</span>
                    </div>
                    <div>결제는 토스페이먼츠를 통해 안전하게 처리됩니다</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}