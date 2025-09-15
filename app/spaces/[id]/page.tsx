'use client'

// 카카오맵 타입 선언
declare global {
  interface Window {
    kakao: any;
  }
}

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import OptimizedImage from '@/components/optimized-image'
import Link from 'next/link'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import Header from '@/components/header'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogOverlay,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { 
  MapPin, 
  Users, 
  Star,
  Heart,
  Share2,
  ArrowLeft,
  CalendarIcon,
  Phone,
  Mail,
  Clock,
  Check,
  Wifi,
  Car,
  Coffee,
  TreePine,
  Home as HomeIcon,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react'
import { 
  Accommodation, 
  CreateReservationData, 
  ReservationCalculation 
} from '@/lib/types/reservation'
import { StarRating, RatingBreakdown } from '@/components/ui/star-rating'
import { 
  calculateReservationPrice,
  validateReservationDate,
  validateGuestCount,
  validatePhoneNumber,
  validateEmail,
  formatPrice,
  formatDate,
  formatTime
} from '@/lib/utils/reservation'
import { 
  fetchHolidays, 
  getHolidayInfo, 
  formatDateToYYYYMMDD, 
  isWeekend,
  getHolidayColorClass 
} from '@/lib/utils/holiday'
import { Holiday } from '@/lib/types/holiday'

interface Review {
  id: string
  accommodation_id: string
  rating: number
  content: string
  created_at: string
}

interface ReviewStats {
  averageRating: number
  totalReviews: number
  ratingCounts: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

export default function AccommodationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [accommodation, setAccommodation] = useState<Accommodation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null)
  const [showAllReviews, setShowAllReviews] = useState(false)
  
  // 예약 폼 상태
  const [reservationDate, setReservationDate] = useState<Date | undefined>(undefined)
  const [guestCount, setGuestCount] = useState({
    adults: 2,
    teens: 0,
    infants: 0
  })
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<{code: string, value: number, type: string} | null>(null)
  const [checkingCode, setCheckingCode] = useState(false)
  
  // UI 상태
  const [showReservationForm, setShowReservationForm] = useState(false)
  const [showDateGuestPicker, setShowDateGuestPicker] = useState(false)
  const [activeTab, setActiveTab] = useState<'date' | 'guests'>('date')
  const [submitting, setSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // 드롭다운 상태
  const [showUsageGuide, setShowUsageGuide] = useState(false)
  const [showRefundPolicy, setShowRefundPolicy] = useState(false)
  const [showSellerInfo, setShowSellerInfo] = useState(false)
  
  // 가격 계산
  const [priceCalculation, setPriceCalculation] = useState<ReservationCalculation | null>(null)
  
  // 공휴일 정보
  const [holidays, setHolidays] = useState<Holiday[]>([])

  useEffect(() => {
    if (params.id) {
      loadAccommodationData()
      loadReviewsData()
      checkAuthState()
      loadHolidayData()
    }
  }, [params.id])

  useEffect(() => {
    if (accommodation) {
      const totalGuests = guestCount.adults + guestCount.teens + guestCount.infants
      const calculation = calculateReservationPrice(accommodation, totalGuests, selectedOptions)
      setPriceCalculation(calculation)
    }
  }, [accommodation, guestCount, selectedOptions])

  // 카카오맵 초기화
  useEffect(() => {
    console.log('useEffect - 카카오맵 초기화 체크:', {
      accommodation: !!accommodation,
      latitude: accommodation?.latitude,
      longitude: accommodation?.longitude,
      kakao: !!window?.kakao,
      maps: !!window?.kakao?.maps
    })
    
    if (accommodation && typeof window !== 'undefined' && window.kakao && window.kakao.maps) {
      console.log('useEffect에서 지도 초기화 시작')
      setTimeout(() => {
        initializeKakaoMap()
      }, 200)
    }
  }, [accommodation])

  const initializeKakaoMap = () => {
    if (!window.kakao || !window.kakao.maps) {
      console.error('카카오맵 SDK가 로드되지 않았습니다')
      return
    }

    if (!accommodation) {
      console.error('숙소 정보가 없습니다')
      return
    }

    const container = document.getElementById('kakao-map')
    if (!container) {
      console.error('지도 컨테이너를 찾을 수 없습니다')
      return
    }

    // 좌표가 있으면 바로 지도 생성
    if (accommodation.latitude && accommodation.longitude) {
      createMapWithCoordinates(container, parseFloat(accommodation.latitude), parseFloat(accommodation.longitude))
    } 
    // 좌표가 없으면 주소로 검색해서 지도 생성
    else if (accommodation.address) {
      geocodeAddress(container, accommodation.address)
    } 
    // 주소도 없으면 기본 위치로 지도 생성
    else {
      console.warn('위치 정보가 없어 기본 위치로 지도를 표시합니다')
      createMapWithCoordinates(container, 36.6424, 127.4890) // 청주 시청 기본 좌표
    }
  }

  const geocodeAddress = (container: HTMLElement, address: string) => {
    const geocoder = new window.kakao.maps.services.Geocoder()
    
    geocoder.addressSearch(address, (result: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x)
        createMapWithCoordinates(container, parseFloat(result[0].y), parseFloat(result[0].x))
        console.log('주소 기반 좌표 찾기 성공:', { lat: result[0].y, lng: result[0].x })
      } else {
        console.warn('주소 검색 실패, 기본 위치로 지도 표시')
        createMapWithCoordinates(container, 36.6424, 127.4890) // 청주 시청 기본 좌표
      }
    })
  }

  const createMapWithCoordinates = (container: HTMLElement, lat: number, lng: number) => {
    try {
      const options = {
        center: new window.kakao.maps.LatLng(lat, lng),
        level: 3
      }

      const map = new window.kakao.maps.Map(container, options)
      
      // 마커 생성
      const markerPosition = new window.kakao.maps.LatLng(lat, lng)
      const marker = new window.kakao.maps.Marker({
        position: markerPosition
      })
      
      marker.setMap(map)

      // 인포윈도우 생성
      const infowindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:10px;font-size:12px;width:200px;">
                    <strong>${accommodation?.name}</strong><br/>
                    ${accommodation?.address}
                  </div>`
      })

      // 마커 클릭 시 인포윈도우 표시
      window.kakao.maps.event.addListener(marker, 'click', function() {
        infowindow.open(map, marker)
      })

      // 지도 로딩 완료 후 로딩 메시지 숨기기
      const loadingElement = document.getElementById('map-loading')
      if (loadingElement) {
        loadingElement.style.display = 'none'
      }

      console.log('카카오맵 생성 완료:', { lat, lng })

    } catch (error) {
      console.error('카카오맵 생성 실패:', error)
      
      // 에러 시 로딩 메시지를 에러 메시지로 변경
      const loadingElement = document.getElementById('map-loading')
      if (loadingElement) {
        loadingElement.innerHTML = `
          <div class="text-gray-500 text-sm">
            지도를 불러올 수 없습니다
          </div>
        `
      }
    }
  }

  const checkAuthState = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  // 공휴일 데이터 로드
  const loadHolidayData = async () => {
    try {
      const currentYear = new Date().getFullYear()
      const nextYear = new Date().getFullYear() + 1
      
      // 현재 연도와 다음 연도 공휴일 데이터 가져오기
      const [currentYearHolidays, nextYearHolidays] = await Promise.all([
        fetchHolidays(currentYear),
        fetchHolidays(nextYear)
      ])
      
      const allHolidays = [...currentYearHolidays, ...nextYearHolidays]
      console.log('로드된 공휴일 데이터:', allHolidays)
      setHolidays(allHolidays)
    } catch (error) {
      console.error('공휴일 데이터 로드 실패:', error)
    }
  }

  // 리뷰 데이터 로드
  const loadReviewsData = async () => {
    try {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('accommodation_id', params.id)
        .order('created_at', { ascending: false })
      
      if (reviewsError) {
        console.error('리뷰 로드 실패:', reviewsError.message)
        return
      }
      
      setReviews(reviewsData || [])
      
      // 리뷰 통계 계산
      if (reviewsData && reviewsData.length > 0) {
        const totalReviews = reviewsData.length
        const averageRating = reviewsData.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        const ratingCounts = {
          1: reviewsData.filter(r => r.rating === 1).length,
          2: reviewsData.filter(r => r.rating === 2).length,
          3: reviewsData.filter(r => r.rating === 3).length,
          4: reviewsData.filter(r => r.rating === 4).length,
          5: reviewsData.filter(r => r.rating === 5).length,
        }
        
        setReviewStats({
          averageRating,
          totalReviews,
          ratingCounts
        })
      }
    } catch (error) {
      console.error('리뷰 데이터 로드 오류:', error)
    }
  }

  const loadAccommodationData = async () => {
    try {
      setLoading(true)

      // 숙소 기본 정보와 서명 URL을 병렬로 가져오기
      const [accommodationResponse, imagesResponse] = await Promise.all([
        fetch(`/api/accommodations/${params.id}`),
        fetch(`/api/accommodations/${params.id}/images`)
      ])

      const accommodationResult = await accommodationResponse.json()

      if (!accommodationResponse.ok) {
        setError(accommodationResult.error || '숙소 정보를 불러올 수 없습니다.')
        return
      }

      // 공개 URL 결과 처리 (성능 최적화)
      let publicImages: string[] = []
      if (imagesResponse.ok) {
        const imagesResult = await imagesResponse.json()
        publicImages = imagesResult.images?.map((img: any) => img.public_url || img.original_url).filter(Boolean) || []
      }

      // 공개 URL이 있으면 사용하고, 없으면 원본 URL 사용
      const accommodationData = {
        ...accommodationResult.data,
        images: publicImages.length > 0 ? publicImages : accommodationResult.data.images
      }

      setAccommodation(accommodationData)

    } catch (error) {
      console.error('숙소 데이터 로드 실패:', error)
      setError('숙소 정보를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleOptionToggle = (optionName: string) => {
    setSelectedOptions(prev => 
      prev.includes(optionName)
        ? prev.filter(opt => opt !== optionName)
        : [...prev, optionName]
    )
  }

  const getTotalGuests = () => guestCount.adults + guestCount.teens + guestCount.infants

  const handleDiscountCodeCheck = async () => {
    if (!discountCode.trim()) return

    setCheckingCode(true)
    try {
      const response = await fetch('/api/discount-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: discountCode.toUpperCase(),
          accommodation_id: params.id
        })
      })

      const result = await response.json()
      
      if (result.valid) {
        setAppliedDiscount({
          code: result.code,
          value: result.discount_value,
          type: result.discount_type
        })
        alert(`할인 코드가 적용되었습니다! (${result.discount_value}% 할인)`)
      } else {
        setAppliedDiscount(null)
        alert(result.message || '유효하지 않은 할인 코드입니다.')
      }
    } catch (error) {
      console.error('할인 코드 확인 실패:', error)
      // Mock validation for demo
      const mockCodes = ['STAY5', 'STAY10', 'STAY15', 'STAY20']
      const upperCode = discountCode.toUpperCase()
      
      if (mockCodes.includes(upperCode)) {
        const discountValue = parseInt(upperCode.replace('STAY', ''))
        setAppliedDiscount({
          code: upperCode,
          value: discountValue,
          type: 'percentage'
        })
        alert(`할인 코드가 적용되었습니다! (${discountValue}% 할인)`)
      } else {
        setAppliedDiscount(null)
        alert('유효하지 않은 할인 코드입니다.')
      }
    } finally {
      setCheckingCode(false)
    }
  }

  const removeDiscountCode = () => {
    setDiscountCode('')
    setAppliedDiscount(null)
  }

  const calculateDiscountedPrice = (originalPrice: number) => {
    if (!appliedDiscount) return originalPrice
    
    if (appliedDiscount.type === 'percentage') {
      return originalPrice * (1 - appliedDiscount.value / 100)
    }
    return originalPrice
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!accommodation) {
      setError('숙소 정보가 없습니다.')
      return false
    }

    // 날짜 검증
    if (reservationDate) {
      const dateValidation = validateReservationDate(reservationDate.toISOString().split('T')[0])
      if (!dateValidation.valid) {
        errors.reservationDate = dateValidation.error!
      }
    }

    // 인원수 검증
    const totalGuests = guestCount.adults + guestCount.teens + guestCount.infants
    const guestValidation = validateGuestCount(totalGuests, accommodation)
    if (!guestValidation.valid) {
      errors.guestCount = guestValidation.error!
    }

    // 예약자 정보 검증
    if (!guestName.trim()) {
      errors.guestName = '예약자 이름을 입력해주세요.'
    }

    const phoneValidation = validatePhoneNumber(guestPhone)
    if (!phoneValidation.valid) {
      errors.guestPhone = phoneValidation.error!
    }

    if (guestEmail) {
      const emailValidation = validateEmail(guestEmail)
      if (!emailValidation.valid) {
        errors.guestEmail = emailValidation.error!
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleReservation = async () => {
    if (!user) {
      alert('로그인이 필요합니다.')
      router.push('/auth/login')
      return
    }

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      const reservationData: CreateReservationData = {
        accommodation_id: params.id as string,
        reservation_date: reservationDate ? reservationDate.toISOString().split('T')[0] : '',
        guest_count: guestCount.adults + guestCount.teens + guestCount.infants,
        selected_options: selectedOptions,
        guest_name: guestName.trim(),
        guest_phone: guestPhone,
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
          setFormErrors(result.errors)
        } else {
          setError(result.error || '예약에 실패했습니다.')
        }
        return
      }

      // 예약 성공 - 결제 페이지로 이동
      alert('예약이 성공적으로 생성되었습니다!')
      router.push(`/reservations/${result.data.reservation.id}/payment`)

    } catch (error) {
      console.error('예약 실패:', error)
      setError('예약 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const getAmenityIcon = (amenityName: string) => {
    const iconMap: { [key: string]: any } = {
      'WiFi': Wifi,
      '주차장': Car,
      '커피머신': Coffee,
      '정원': TreePine,
      '주방': HomeIcon,
    }
    return iconMap[amenityName] || HomeIcon
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">숙소 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !accommodation) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              돌아가기
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 뒤로가기 및 제목 */}
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mr-4 p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{accommodation.name}</h1>
            <div className="flex items-center mt-1">
              <MapPin className="w-4 h-4 text-gray-500 mr-1" />
              <span className="text-gray-600">{accommodation.address}, {accommodation.region}</span>
            </div>
          </div>
          
          {/* 공유하기 및 위시리스트 */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className={isWishlisted ? "text-red-500" : ""}
            >
              <Heart className="w-4 h-4" fill={isWishlisted ? "currentColor" : "none"} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 이미지 및 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 이미지 갤러리 */}
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
              {accommodation.images && accommodation.images.length > 0 &&
                accommodation.images[currentImageIndex] &&
                typeof accommodation.images[currentImageIndex] === 'string' &&
                (accommodation.images[currentImageIndex].startsWith('http') || accommodation.images[currentImageIndex].startsWith('/')) ? (
                <>
                  <div className="relative w-full h-full">
                    <OptimizedImage
                      src={accommodation.images[currentImageIndex]}
                      alt={accommodation.name}
                      fill
                      className="object-cover transition-opacity duration-300 ease-in-out"
                      priority
                    />
                  </div>
                  
                  {accommodation.images.length > 1 && (
                    <>
                      <button
                        onClick={() => {
                          const validImages = accommodation.images?.filter(img => img && typeof img === 'string' && (img.startsWith('http') || img.startsWith('/'))) || []
                          setCurrentImageIndex(prev => prev === 0 ? validImages.length - 1 : prev - 1)
                        }}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          const validImages = accommodation.images?.filter(img => img && typeof img === 'string' && (img.startsWith('http') || img.startsWith('/'))) || []
                          setCurrentImageIndex(prev => prev === validImages.length - 1 ? 0 : prev + 1)
                        }}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg"
                      >
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                      </button>
                      
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                        {accommodation.images?.filter(img => img && typeof img === 'string' && (img.startsWith('http') || img.startsWith('/'))).map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 hover:scale-125 ${
                              index === currentImageIndex ? 'bg-white scale-110' : 'bg-white/50 hover:bg-white/75'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <HomeIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>

            {/* 기본 정보 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{accommodation.name}</h2>
                    <div className="flex items-center mt-2 mb-1">
                      <Badge variant="outline" className="text-xs font-medium border-blue-200 bg-blue-50 text-blue-700 mr-2">
                        {accommodation.accommodation_type}
                      </Badge>
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                      <span className="font-medium text-gray-900">4.8</span>
                      <span className="text-gray-600 text-sm ml-1">(0개 리뷰)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">₩{formatPrice(accommodation.base_price)}</div>
                    <div className="text-sm text-gray-600">/당일</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm text-gray-700">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2 text-gray-500" />
                    최대 {accommodation.max_capacity}명
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gray-500" />
                    {formatTime(accommodation.checkin_time)} 입장
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gray-500" />
                    {formatTime(accommodation.checkout_time)} 퇴장
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 설명 */}
            {accommodation.description && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3">소개</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {accommodation.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* 편의시설 및 서비스 */}
            {accommodation && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">편의시설 및 서비스</h3>
                  {accommodation.accommodation_amenities && accommodation.accommodation_amenities.length > 0 ? (
                    <div className="grid grid-cols-4 gap-3">
                      {accommodation.accommodation_amenities.map((amenityObj: any, index: number) => {
                      const amenityName = amenityObj.amenity_name
                      const getAmenityIcon = (name: string) => {
                        const lowerName = name.toLowerCase()
                        
                        // 와이파이/인터넷
                        if (lowerName.includes('wifi') || lowerName.includes('와이파이') || lowerName.includes('인터넷') || lowerName.includes('무료 wifi')) {
                          return (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                            </svg>
                          )
                        }
                        // 주차장
                        else if (lowerName.includes('주차') || lowerName.includes('parking')) {
                          return (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )
                        }
                        // 에어컨/냉방
                        else if (lowerName.includes('에어컨') || lowerName.includes('냉방')) {
                          return (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                            </svg>
                          )
                        }
                        // 난방/히터
                        else if (lowerName.includes('난방') || lowerName.includes('히터')) {
                          return (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                            </svg>
                          )
                        }
                        // 키친/주방/부엌/취사시설
                        else if (lowerName.includes('키친') || lowerName.includes('부엌') || lowerName.includes('주방') || lowerName.includes('취사')) {
                          return (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4v18a1 1 0 001 1h8a1 1 0 001-1V4M9 9h6M9 13h6" />
                            </svg>
                          )
                        }
                        // 바베큐/그릴
                        else if (lowerName.includes('바베큐') || lowerName.includes('bbq') || lowerName.includes('그릴') || lowerName.includes('바비큐')) {
                          return (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="3" strokeWidth={1.5}></circle>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 1v6m0 6v6m11-7h-6m-6 0H1m15.5-6.5L12 12l-4.5-4.5m9 9L12 12l-4.5 4.5" />
                            </svg>
                          )
                        }
                        // 수영장/풀
                        else if (lowerName.includes('수영장') || lowerName.includes('풀')) {
                          return (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                              <circle cx="12" cy="12" r="3" strokeWidth={1.5}></circle>
                            </svg>
                          )
                        }
                        // 사우나/스파
                        else if (lowerName.includes('사우나') || lowerName.includes('스파')) {
                          return (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                          )
                        }
                        // 정원
                        else if (lowerName.includes('정원')) {
                          return (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-5a2 2 0 00-2-2H9" />
                            </svg>
                          )
                        }
                        // TV/텔레비전/티비
                        else if (lowerName.includes('tv') || lowerName.includes('텔레비전') || lowerName.includes('티비')) {
                          return (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" strokeWidth={1.5}></rect>
                              <line x1="8" y1="21" x2="16" y2="21" strokeWidth={1.5}></line>
                              <line x1="12" y1="17" x2="12" y2="21" strokeWidth={1.5}></line>
                            </svg>
                          )
                        }
                        // 세탁기
                        else if (lowerName.includes('세탁') || lowerName.includes('워싱')) {
                          return (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="9" strokeWidth={1.5}></circle>
                              <circle cx="12" cy="12" r="4" strokeWidth={1.5}></circle>
                              <circle cx="12" cy="7" r="1" strokeWidth={1.5}></circle>
                              <circle cx="9" cy="7" r="1" strokeWidth={1.5}></circle>
                            </svg>
                          )
                        }
                        // 건조기
                        else if (lowerName.includes('건조기')) {
                          return (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="9" strokeWidth={1.5}></circle>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h8M12 8v8" />
                            </svg>
                          )
                        }
                        // 냉장고
                        else if (lowerName.includes('냉장고') || lowerName.includes('refrigerator')) {
                          return (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
                              <line x1="8" y1="10" x2="8" y2="14" strokeWidth={1.5}></line>
                              <line x1="5" y1="2" x2="19" y2="2" strokeWidth={1.5}></line>
                              <line x1="5" y1="22" x2="19" y2="22" strokeWidth={1.5}></line>
                            </svg>
                          )
                        }
                        // 전자레인지/마이크로웨이브
                        else if (lowerName.includes('전자레인지') || lowerName.includes('마이크로웨이브')) {
                          return (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <rect x="3" y="6" width="18" height="12" rx="2" strokeWidth={1.5}></rect>
                              <circle cx="8" cy="12" r="2" strokeWidth={1.5}></circle>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 10h2M16 14h2" />
                            </svg>
                          )
                        }
                        // 커피머신/커피
                        else if (lowerName.includes('커피') || lowerName.includes('coffee')) {
                          return (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 10V7a3 3 0 013-3h6a3 3 0 013 3v3M6 10h12M6 10l1 9a1 1 0 001 1h8a1 1 0 001-1l1-9M9 21v-4M15 21v-4" />
                            </svg>
                          )
                        }
                        // 취사도구
                        else if (lowerName.includes('취사도구')) {
                          return (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l-3-9M8 2h8" />
                            </svg>
                          )
                        }
                        // 반려동물 동반 가능/애견
                        else if (lowerName.includes('반려동물') || lowerName.includes('애견') || lowerName.includes('동반')) {
                          return (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6s0-2 6-2 6 2 6 2c2 0 2 2 2 6 0 8-6 10-8 10s-8-2-8-10c0-4 0-6 2-6z" />
                              <circle cx="9" cy="9" r="1" strokeWidth={1.5}></circle>
                              <circle cx="15" cy="9" r="1" strokeWidth={1.5}></circle>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 13c1 1 2 1 3 0" />
                            </svg>
                          )
                        }
                        // 어메니티
                        else if (lowerName.includes('어메니티') || lowerName.includes('amenity')) {
                          return (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                          )
                        }
                        // 독채/독립
                        else if (lowerName.includes('독채') || lowerName.includes('독립')) {
                          return (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                          )
                        }
                        // 펜션
                        else if (lowerName.includes('펜션')) {
                          return (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          )
                        }
                        // 기본 체크 아이콘
                        else {
                          return (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )
                        }
                      }
                      
                      return (
                        <div key={index} className="flex flex-col items-center text-center space-y-1">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            {getAmenityIcon(amenityName)}
                          </div>
                          <span className="text-xs text-gray-600">{amenityName}</span>
                        </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">등록된 편의시설 정보가 없습니다.</p>
                      <p className="text-sm text-gray-400 mt-1">호스트에게 문의해주세요.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 위치 정보 */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">위치 정보</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{accommodation.address}</p>
                      <p className="text-sm text-gray-600 mt-1">{accommodation.detailed_address || accommodation.address_detail}</p>
                    </div>
                  </div>
                  
                  {/* 카카오맵 지도 */}
                  <div className="mt-6 h-80 bg-gray-100 rounded-lg overflow-hidden relative">
                    <div 
                      id="kakao-map" 
                      className="w-full h-full"
                      style={{ minHeight: '320px' }}
                    >
                    </div>
                    <div 
                      id="map-loading" 
                      className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 p-6"
                    >
                      <div className="text-center">
                        <div className="text-gray-700 font-medium mb-2">📍 위치 정보</div>
                        <div className="text-gray-600 text-sm mb-4">
                          {accommodation?.address}
                        </div>
                        <div className="text-xs text-gray-500">
                          지도 서비스 준비 중입니다
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <h4 className="text-base font-medium text-gray-900 mb-4">추가 서비스</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700">24시간 체크인 가능</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700">안전한 셀프 체크인</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700">깨끗한 청소 서비스</span>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700">호스트 응답 보장</span>
                    </div>
                  </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 이용안내, 환불규정, 판매자안내 - 스테이폴리오 스타일 드롭다운 */}
            <Card>
              <CardContent className="p-6 space-y-4">
                {/* 이용안내 */}
                <Collapsible open={showUsageGuide} onOpenChange={setShowUsageGuide}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <span className="text-lg font-medium text-gray-900">이용안내</span>
                    {showUsageGuide ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4 pb-2 text-gray-700 leading-relaxed">
                    <div className="space-y-3">
                      {accommodation.usage_guide ? (
                        <pre className="whitespace-pre-wrap font-sans text-gray-700">
                          {accommodation.usage_guide}
                        </pre>
                      ) : (
                        <div>
                          <p>• 체크인: {formatTime(accommodation.checkin_time)}</p>
                          <p>• 체크아웃: {formatTime(accommodation.checkout_time)}</p>
                          <p>• 최대 인원: {accommodation.max_capacity}명</p>
                          <p>• 주차 가능 여부는 호스트에게 문의해주세요</p>
                          <p>• 반려동물 동반은 사전 협의가 필요합니다</p>
                          <p>• 시설 내 금연입니다</p>
                          <p>• 소음 및 파손에 대한 책임은 이용자에게 있습니다</p>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* 환불규정 */}
                <Collapsible open={showRefundPolicy} onOpenChange={setShowRefundPolicy}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <span className="text-lg font-medium text-gray-900">환불규정</span>
                    {showRefundPolicy ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4 pb-2 text-gray-700 leading-relaxed">
                    <div className="space-y-3">
                      {accommodation.refund_policy ? (
                        <pre className="whitespace-pre-wrap font-sans text-gray-700">
                          {accommodation.refund_policy}
                        </pre>
                      ) : (
                        <div>
                          <p><strong>이용 7일 전까지:</strong> 100% 환불</p>
                          <p><strong>이용 6일~3일 전까지:</strong> 50% 환불</p>
                          <p><strong>이용 2일~당일:</strong> 환불 불가</p>
                          <p><strong>No-Show (미출현):</strong> 환불 불가</p>
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm">
                              * 천재지변, 호스트 귀책사유로 인한 취소는 100% 환불됩니다<br/>
                              * 환불 시 결제수수료는 제외됩니다<br/>
                              * 환불 처리는 3-5 영업일이 소요됩니다
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* 판매자 안내 */}
                <Collapsible open={showSellerInfo} onOpenChange={setShowSellerInfo}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <span className="text-lg font-medium text-gray-900">판매자 안내</span>
                    {showSellerInfo ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4 pb-2 text-gray-700 leading-relaxed">
                    <div className="space-y-3">
                      {accommodation.seller_info ? (
                        <pre className="whitespace-pre-wrap font-sans text-gray-700">
                          {accommodation.seller_info}
                        </pre>
                      ) : (
                        <div>
                          <p><strong>사업자명:</strong> 플래트(주)</p>
                          <p><strong>대표자:</strong> 안태웅</p>
                          <p><strong>소재지:</strong> 충청북도 청주시 흥덕구 2순환로 1205번길 14-7</p>
                          <p><strong>연락처:</strong> 010-6433-6668</p>
                          <p><strong>이메일:</strong> antaewoongs@gmail.com</p>
                          <p><strong>사업자등록번호:</strong> 309-88-02783</p>
                          <p><strong>통신판매업 신고번호:</strong> 제2024-충북청주-0234호</p>
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                              <strong>Stay One Day</strong>는 고품격 당일치기 숙박 플랫폼입니다.<br/>
                              * 문의사항이 있으시면 위 연락처로 연락주세요<br/>
                              * 운영시간: 평일 09:00~18:00 (주말, 공휴일 상담 가능)<br/>
                              * 예약 및 이용 관련 문의는 언제든지 환영합니다
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>

            {/* 리뷰 및 평점 섹션 */}
            {reviewStats && reviewStats.totalReviews > 0 && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">
                      리뷰 {reviewStats.totalReviews}개
                    </h3>
                    <div className="flex items-center gap-2">
                      <StarRating rating={reviewStats.averageRating} readonly size="sm" />
                      <span className="text-sm text-gray-600">
                        {reviewStats.averageRating.toFixed(1)}/5
                      </span>
                    </div>
                  </div>

                  {/* 평점 분석 */}
                  <div className="mb-8">
                    <RatingBreakdown
                      ratings={reviewStats.ratingCounts}
                      totalReviews={reviewStats.totalReviews}
                    />
                  </div>

                  {/* 리뷰 목록 */}
                  <div className="space-y-6">
                    {(showAllReviews ? reviews : reviews.slice(0, 3)).map((review) => (
                      <div key={review.id} className="pb-6 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                            {review.id.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <StarRating rating={review.rating} readonly size="sm" />
                              <span className="text-sm text-gray-500">
                                {new Date(review.created_at).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <p className="text-gray-700 leading-relaxed">
                              {review.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 더 보기 버튼 */}
                  {reviews.length > 3 && (
                    <div className="mt-6 text-center">
                      <Button
                        variant="outline"
                        onClick={() => setShowAllReviews(!showAllReviews)}
                        className="px-6"
                      >
                        {showAllReviews 
                          ? '리뷰 접기' 
                          : `리뷰 ${reviews.length - 3}개 더 보기`
                        }
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* 오른쪽: 예약 폼 */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-gray-200 shadow-lg">
              <CardContent className="p-6 bg-white">
                <h3 className="text-xl font-bold text-gray-900 mb-6">예약하기</h3>

                {/* 스테이폴리오 스타일 예약 요약 */}
                <div className="mb-6 p-4 border border-gray-300 rounded-xl bg-white">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 mb-1">
                      ₩{formatPrice(accommodation.base_price)}
                    </div>
                    <div className="text-sm text-gray-600">/당일</div>
                  </div>
                </div>

                {/* 추가 옵션 - 기존 DB 스키마에는 options 필드가 없으므로 주석 처리 */}
                {/* {accommodation.options && accommodation.options.length > 0 && (
                  <div className="mb-4">
                    <Label className="mb-3 block">추가 옵션</Label>
                    <div className="space-y-2">
                      {accommodation.options.map((option, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <Checkbox
                            id={`option-${index}`}
                            checked={selectedOptions.includes(option.name)}
                            onCheckedChange={() => handleOptionToggle(option.name)}
                          />
                          <div className="flex-1">
                            <label 
                              htmlFor={`option-${index}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {option.name}
                            </label>
                            <p className="text-xs text-gray-600 mt-1">
                              {option.description} - ₩{formatPrice(option.price)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )} */}

                {/* 할인 코드 입력 - 접을 수 있는 세련된 스타일 */}
                <div className="mb-4">
                  {appliedDiscount ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          {appliedDiscount.code} ({appliedDiscount.value}% 할인 적용)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeDiscountCode}
                        className="text-green-600 hover:text-green-700 hover:bg-green-100 h-auto p-1"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                        <span>할인 코드가 있으신가요?</span>
                        <ChevronDown className="w-4 h-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="코드 입력"
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                            className="flex-1 h-10 text-sm"
                            maxLength={20}
                          />
                          <Button
                            variant="outline"
                            onClick={handleDiscountCodeCheck}
                            disabled={checkingCode || !discountCode.trim()}
                            className="px-4 h-10"
                            size="sm"
                          >
                            {checkingCode ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            '적용'
                          )}
                        </Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>

                {/* 가격 표시 - 스테이폴리오 스타일 */}
                {priceCalculation && (
                  <div className="mb-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-base">
                        <span className="text-gray-800">₩{formatPrice(priceCalculation.base_price)} ({guestCount.adults + guestCount.teens + guestCount.infants}명)</span>
                        <span className="font-medium text-gray-900">₩{formatPrice(priceCalculation.base_price)}</span>
                      </div>
                      
                      {appliedDiscount && (
                        <div className="flex justify-between items-center text-base text-green-600">
                          <span>할인 ({appliedDiscount.code} - {appliedDiscount.value}%)</span>
                          <span>-₩{formatPrice(priceCalculation.total_price * appliedDiscount.value / 100)}</span>
                        </div>
                      )}
                      
                      <hr className="border-gray-200" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">총 금액</span>
                        <span className="text-lg font-bold text-gray-900">
                          ₩{formatPrice(calculateDiscountedPrice(priceCalculation.total_price))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 스테이폴리오 스타일 예약 버튼 */}
                <Button 
                  className="w-full h-12 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold rounded-xl text-base shadow-lg hover:shadow-xl transition-all duration-200" 
                  size="lg"
                  onClick={() => setShowDateGuestPicker(true)}
                >
                  예약하기
                </Button>

                {/* 스테이폴리오 스타일 예약 모달 */}
                <Dialog open={showDateGuestPicker} onOpenChange={setShowDateGuestPicker}>
                  <DialogContent className="max-w-md p-0 gap-0 bg-white border-0 shadow-2xl">
                    <DialogHeader className="sr-only">
                      <DialogTitle>일정 및 인원 선택</DialogTitle>
                      <DialogDescription>
                        예약할 날짜와 인원을 선택해주세요.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col h-[600px]">
                      {/* 헤더 */}
                      <div className="flex items-center justify-between p-4 border-b">
                        <h2 className="text-lg font-medium">일정 및 인원</h2>
                      </div>

                      {/* 탭 버튼 */}
                      <div className="flex">
                        <button
                          onClick={() => setActiveTab('date')}
                          className={`flex-1 py-3 text-sm font-medium border-b-2 flex items-center justify-center gap-2 ${
                            activeTab === 'date'
                              ? 'bg-gray-800 text-white border-gray-800'
                              : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={activeTab === 'date' ? 'text-white' : 'text-gray-800'}>
                            <path d="M8 2V5M16 2V5M7 13H17M7 17H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span className={activeTab === 'date' ? 'text-white' : 'text-gray-800'}>일정</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('guests')}
                          className={`flex-1 py-3 text-sm font-medium border-b-2 flex items-center justify-center gap-2 ${
                            activeTab === 'guests'
                              ? 'bg-gray-800 text-white border-gray-800'
                              : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={activeTab === 'guests' ? 'text-white' : 'text-gray-800'}>
                            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span className={activeTab === 'guests' ? 'text-white' : 'text-gray-800'}>인원</span>
                        </button>
                      </div>

                      {/* 콘텐츠 영역 */}
                      <div className="flex-1 p-6 overflow-y-auto">
                        {activeTab === 'date' ? (
                          /* 달력 */
                          <div className="space-y-4">
                            <div className="text-center text-lg font-medium text-gray-800 mb-6">
                              {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
                            </div>
                            
                            {/* 요일 헤더 */}
                            <div className="grid grid-cols-7 gap-1 mb-2">
                              {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                                <div key={day} className={`text-center text-sm py-2 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'}`}>
                                  {day}
                                </div>
                              ))}
                            </div>
                            
                            {/* 2개월 달력 그리드 */}
                            <div className="space-y-4">
                              {/* 현재 월 */}
                              <div className="grid grid-cols-7 gap-1">
                                {Array.from({ length: 42 }, (_, i) => {
                                  const today = new Date()
                                  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
                                  const startDate = new Date(firstDay.getTime() - (firstDay.getDay() * 24 * 60 * 60 * 1000))
                                  const currentDate = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000))
                                  const isCurrentMonth = currentDate.getMonth() === today.getMonth()
                                  const isToday = currentDate.toDateString() === today.toDateString()
                                  const isSelected = reservationDate && currentDate.toDateString() === reservationDate.toDateString()
                                  const isPast = currentDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())
                                  
                                  // 공휴일 정보 확인
                                  const holidayInfo = getHolidayInfo(currentDate, holidays)
                                  const isHoliday = !!holidayInfo
                                  const isWeekendDay = isWeekend(currentDate)
                                  
                                  return (
                                    <button
                                      key={i}
                                      onClick={() => {
                                        if (!isPast && isCurrentMonth) {
                                          setReservationDate(currentDate)
                                        }
                                      }}
                                      disabled={isPast || !isCurrentMonth}
                                      className={`
                                        h-12 text-sm rounded-lg transition-colors relative group
                                        ${isSelected 
                                          ? 'bg-gray-800 text-white font-bold' 
                                          : isToday 
                                            ? 'bg-gray-100 text-gray-800 font-medium'
                                            : isHoliday && isCurrentMonth && !isPast
                                              ? 'bg-red-50 text-red-700 hover:bg-red-100 font-medium'
                                              : isWeekendDay && isCurrentMonth && !isPast && currentDate.getDay() === 6
                                                ? 'text-blue-700 hover:bg-blue-50 font-medium'
                                                : isWeekendDay && isCurrentMonth && !isPast && currentDate.getDay() === 0
                                                  ? 'text-red-700 hover:bg-red-50 font-medium'
                                                : isCurrentMonth && !isPast
                                                  ? 'hover:bg-gray-100 text-gray-800'
                                                  : 'text-gray-300 cursor-not-allowed'
                                        }
                                      `}
                                      title={holidayInfo ? holidayInfo.name : undefined}
                                    >
                                      <div className="flex flex-col items-center">
                                        <span>{currentDate.getDate()}</span>
                                        {isHoliday && isCurrentMonth && (
                                          <div className="w-1 h-1 bg-red-500 rounded-full absolute bottom-1"></div>
                                        )}
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>

                              {/* 다음 월 제목 */}
                              <div className="text-center text-lg font-medium text-gray-800 mt-8 mb-4">
                                {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
                              </div>

                              {/* 다음 월 */}
                              <div className="grid grid-cols-7 gap-1">
                                {Array.from({ length: 42 }, (_, i) => {
                                  const today = new Date()
                                  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
                                  const firstDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1)
                                  const startDate = new Date(firstDay.getTime() - (firstDay.getDay() * 24 * 60 * 60 * 1000))
                                  const currentDate = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000))
                                  const isNextMonth = currentDate.getMonth() === nextMonth.getMonth()
                                  const isToday = currentDate.toDateString() === today.toDateString()
                                  const isSelected = reservationDate && currentDate.toDateString() === reservationDate.toDateString()
                                  const isPast = currentDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())
                                  
                                  // 공휴일 정보 확인
                                  const holidayInfo = getHolidayInfo(currentDate, holidays)
                                  const isHoliday = !!holidayInfo
                                  const isWeekendDay = isWeekend(currentDate)
                                  
                                  return (
                                    <button
                                      key={`next-${i}`}
                                      onClick={() => {
                                        if (!isPast && isNextMonth) {
                                          setReservationDate(currentDate)
                                        }
                                      }}
                                      disabled={isPast || !isNextMonth}
                                      className={`
                                        h-12 text-sm rounded-lg transition-colors relative group
                                        ${isSelected 
                                          ? 'bg-gray-800 text-white font-bold' 
                                          : isToday 
                                            ? 'bg-gray-100 text-gray-800 font-medium'
                                            : isHoliday && isNextMonth && !isPast
                                              ? 'bg-red-50 text-red-700 hover:bg-red-100 font-medium'
                                              : isWeekendDay && isNextMonth && !isPast && currentDate.getDay() === 6
                                                ? 'text-blue-700 hover:bg-blue-50 font-medium'
                                                : isWeekendDay && isNextMonth && !isPast && currentDate.getDay() === 0
                                                  ? 'text-red-700 hover:bg-red-50 font-medium'
                                                : isNextMonth && !isPast
                                                  ? 'hover:bg-gray-100 text-gray-800'
                                                  : 'text-gray-300 cursor-not-allowed'
                                        }
                                      `}
                                      title={holidayInfo ? holidayInfo.name : undefined}
                                    >
                                      <div className="flex flex-col items-center">
                                        <span>{currentDate.getDate()}</span>
                                        {isHoliday && isNextMonth && (
                                          <div className="w-1 h-1 bg-red-500 rounded-full absolute bottom-1"></div>
                                        )}
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                            
                            <div className="mt-6 text-center space-y-2">
                              <div className="flex items-center justify-center gap-4 text-xs">
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  <span className="text-red-600">공휴일</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span className="text-blue-600">주말</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
                                  <span className="text-gray-600">선택됨</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* 인원 선택 */
                          <div className="space-y-8">
                            {/* 성인 */}
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-lg font-medium text-gray-800">성인</div>
                              </div>
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => setGuestCount(prev => ({ ...prev, adults: Math.max(1, prev.adults - 1) }))}
                                  disabled={guestCount.adults <= 1}
                                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30 hover:border-gray-400 text-gray-800"
                                >
                                  −
                                </button>
                                <span className="text-lg font-medium w-8 text-center text-gray-800">{guestCount.adults}</span>
                                <button
                                  onClick={() => setGuestCount(prev => ({ 
                                    ...prev, 
                                    adults: prev.adults + prev.teens + prev.infants < accommodation.max_capacity 
                                      ? prev.adults + 1 
                                      : prev.adults 
                                  }))}
                                  disabled={guestCount.adults + guestCount.teens + guestCount.infants >= accommodation.max_capacity}
                                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30 hover:border-gray-400 text-gray-800"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* 아동 */}
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-lg font-medium text-gray-800">아동</div>
                                <div className="text-sm text-gray-500">2세 ~ 12세</div>
                              </div>
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => setGuestCount(prev => ({ ...prev, teens: Math.max(0, prev.teens - 1) }))}
                                  disabled={guestCount.teens <= 0}
                                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30 hover:border-gray-400 text-gray-800"
                                >
                                  −
                                </button>
                                <span className="text-lg font-medium w-8 text-center text-gray-800">{guestCount.teens}</span>
                                <button
                                  onClick={() => setGuestCount(prev => ({ 
                                    ...prev, 
                                    teens: prev.adults + prev.teens + prev.infants < accommodation.max_capacity 
                                      ? prev.teens + 1 
                                      : prev.teens 
                                  }))}
                                  disabled={guestCount.adults + guestCount.teens + guestCount.infants >= accommodation.max_capacity}
                                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30 hover:border-gray-400 text-gray-800"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* 영아 */}
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-lg font-medium text-gray-800">영아</div>
                                <div className="text-sm text-gray-500">24개월 미만</div>
                              </div>
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => setGuestCount(prev => ({ ...prev, infants: Math.max(0, prev.infants - 1) }))}
                                  disabled={guestCount.infants <= 0}
                                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30 hover:border-gray-400 text-gray-800"
                                >
                                  −
                                </button>
                                <span className="text-lg font-medium w-8 text-center text-gray-800">{guestCount.infants}</span>
                                <button
                                  onClick={() => setGuestCount(prev => ({ 
                                    ...prev, 
                                    infants: prev.adults + prev.teens + prev.infants < accommodation.max_capacity 
                                      ? prev.infants + 1 
                                      : prev.infants 
                                  }))}
                                  disabled={guestCount.adults + guestCount.teens + guestCount.infants >= accommodation.max_capacity}
                                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30 hover:border-gray-400 text-gray-800"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 하단 고정 버튼 */}
                      <div className="p-4 border-t bg-white">
                        <div className="text-center text-sm text-gray-800 mb-4">
                          {guestCount.adults + guestCount.teens + guestCount.infants}인
                        </div>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => {
                              setReservationDate(null)
                              setGuestCount({ adults: 2, teens: 0, infants: 0 })
                            }}
                            className="px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            초기화
                          </button>
                          <button 
                            onClick={() => {
                              const queryParams = new URLSearchParams({
                                accommodation_id: accommodation.id,
                                date: reservationDate ? reservationDate.toISOString().split('T')[0] : '',
                                guests: (guestCount.adults + guestCount.teens + guestCount.infants).toString(),
                                price: priceCalculation?.total_price.toString() || accommodation.base_price.toString()
                              })
                              router.push(`/booking/${accommodation.id}?${queryParams}`)
                            }}
                            disabled={!reservationDate}
                            className="flex-1 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            다음
                          </button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* 카카오맵 SDK 로드 */}
      <Script 
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=76833d9162b866642e1966b546729715&autoload=false&libraries=services`}
        strategy="afterInteractive"
        onLoad={() => {
          console.log('카카오맵 스크립트 로드 완료')
          console.log('window.kakao:', window.kakao)
          console.log('window.kakao.maps:', window.kakao?.maps)
          
          if (window.kakao && window.kakao.maps) {
            window.kakao.maps.load(() => {
              console.log('카카오맵 라이브러리 로드 완료')
              console.log('accommodation 상태:', accommodation)
              
              // 숙소 정보가 있으면 바로 지도 초기화
              if (accommodation) {
                console.log('지도 초기화 시작')
                setTimeout(() => {
                  initializeKakaoMap()
                }, 100)
              } else {
                console.log('숙소 정보 없음, 대기 중')
              }
            })
          } else {
            console.error('카카오맵 객체를 찾을 수 없습니다')
            // 로딩 메시지를 에러 메시지로 변경
            const loadingElement = document.getElementById('map-loading')
            if (loadingElement) {
              loadingElement.innerHTML = `
                <div class="text-red-500 text-sm">
                  지도 서비스를 불러올 수 없습니다
                </div>
              `
            }
          }
        }}
        onError={(e) => {
          console.error('카카오맵 스크립트 로드 실패:', e)
          const loadingElement = document.getElementById('map-loading')
          if (loadingElement) {
            loadingElement.innerHTML = `
              <div class="text-red-500 text-sm">
                지도 스크립트 로드 실패
              </div>
            `
          }
        }}
      />
    </div>
  )
}