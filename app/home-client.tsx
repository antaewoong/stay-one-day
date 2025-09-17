'use client'

import './globals.css'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useHeroSlidePreloader } from '@/hooks/useHeroSlidePreloader'
import { 
  CalendarDays, 
  MapPin, 
  Users, 
  Clock, 
  Star, 
  Shield, 
  Heart,
  Search,
  TrendingUp,
  Award,
  Zap,
  ArrowRight,
  PlayCircle,
  ChevronDown,
  Filter,
  Grid3X3,
  List,
  SlidersHorizontal,
  Home,
  Share2,
  X
} from 'lucide-react'
import Link from 'next/link'
import OptimizedImage from '@/components/optimized-image'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useHScrollDrag } from '@/lib/hooks/useHScrollDrag'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { getFeaturedAccommodations, getAccommodations } from '@/lib/supabase/accommodations'
import { createClient } from '@/lib/supabase/client'
import { StarRating } from '@/components/ui/star-rating'
import StayCard from '@/components/StayCard'
import SectionContainer from '@/components/SectionContainer'

// Supabase 클라이언트를 컴포넌트 외부에서 생성
const supabase = createClient()

interface HomeClientProps {
  initialData: {
    accommodationRatings: Record<string, { average: number; count: number }>
    allAccommodations: any[]
    featured: any[]
    poolvilla: any[]
    private: any[]
    kids: any[]
    party: any[]
    new: any[]
  }
}

export default function HomeClient({ initialData }: HomeClientProps) {
  // 히어로 슬라이드 프리로더 사용 (어제 구현한 해결책)
  const { heroSlides, isLoading: heroLoading, preloadedImages } = useHeroSlidePreloader()

  const [currentSlide, setCurrentSlide] = useState(0)
  const [currentEmotionalText, setCurrentEmotionalText] = useState(0)
  const [textOpacity, setTextOpacity] = useState(1)

  // 히어로 텍스트 데이터
  const heroTexts = [
    {
      accent: "Premium Stay Experience",
      main: "완벽한 하루를 위한 특별한 공간",
      sub: "엄선된 숙소에서 만나는 프리미엄 휴식"
    },
    {
      accent: "Curated Accommodations",
      main: "당신만을 위한 맞춤 스테이",
      sub: "취향과 목적에 따라 선별된 최고의 숙소"
    },
    {
      accent: "Instant Booking",
      main: "언제든 떠날 수 있는 자유",
      sub: "간편한 예약으로 시작하는 완벽한 여행"
    }
  ]
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [viewMode, setViewMode] = useState('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0)
  const [suggestions, setSuggestions] = useState(['풀빌라', '청주', '세종', '대전', '천안', '애견풀빌라'])
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showBusinessInfo, setShowBusinessInfo] = useState(false)
  // 서버에서 받은 데이터로 초기화
  const [featuredStays, setFeaturedStays] = useState<any[]>(initialData.featured)
  const [poolvillaStays, setPoolvillaStays] = useState<any[]>(initialData.poolvilla)
  const [accommodationRatings, setAccommodationRatings] = useState<Record<string, { average: number; count: number }>>(initialData.accommodationRatings)
  const [privateStays, setPrivateStays] = useState<any[]>(initialData.private)
  const [kidsStays, setKidsStays] = useState<any[]>(initialData.kids)
  const [partyStays, setPartyStays] = useState<any[]>(initialData.party)
  const [newStays, setNewStays] = useState<any[]>(initialData.new)
  const [loading, setLoading] = useState(false) // 서버에서 로드하므로 false로 시작
  const [dataLoadTimeout, setDataLoadTimeout] = useState<NodeJS.Timeout | null>(null)
  const [allAccommodations, setAllAccommodations] = useState<any[]>(initialData.allAccommodations)
  const [searchLocation, setSearchLocation] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [guestCount, setGuestCount] = useState(2)
  const [user, setUser] = useState<any>(null)
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [isUserLoading, setIsUserLoading] = useState(true)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isUserMenuClosing, setIsUserMenuClosing] = useState(false)
  // const [heroTexts, setHeroTexts] = useState<any[]>([]) // 서버 컴포넌트로 이동
  // const [currentEmotionalText, setCurrentEmotionalText] = useState(0) // 서버 컴포넌트로 이동


  // 데이터 로딩은 서버에서 처리되므로 클라이언트 사이드 로딩 로직 제거
  // useEffect(() => {
  //   // 대부분의 데이터 로드 로직이 서버로 이동됨
  // }, [])

  // Framer Motion 스크롤 애니메이션 훅들
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 500], [0, 150])
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3])
  const textY = useTransform(scrollY, [0, 500], [0, 100])

  // 스크롤 컨테이너 ref들
  const recommendedScrollRef = useRef<HTMLDivElement>(null)
  const poolvillaScrollRef = useRef<HTMLDivElement>(null)
  const privateScrollRef = useRef<HTMLDivElement>(null)
  const kidsScrollRef = useRef<HTMLDivElement>(null)
  const partyScrollRef = useRef<HTMLDivElement>(null)
  const newScrollRef = useRef<HTMLDivElement>(null)

  // 가로 스크롤 드래그 훅 사용
  const {
    dragState,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleCardClick,
    getScrollContainerStyles
  } = useHScrollDrag()

  // 가로 스크롤 핸들러는 훅으로 이동됨

  // 모멘텀 스크롤 애니메이션은 훅으로 이동됨

  // 마우스 드래그 핸들러들은 useHScrollDrag 훅으로 이동됨

  // 터치 이벤트 핸들러들은 useHScrollDrag 훅으로 이동됨

  // 카드 클릭 핸들러는 useHScrollDrag 훅으로 이동됨
  const handleStayCardClick = (e: React.MouseEvent, stayId: string) => {
    handleCardClick(e) // 드래그 체크만 수행
  }

  // 사용자 인증 상태 확인
  // 인증 상태 최적화: 중복 호출 방지 및 로깅 최소화
  useEffect(() => {
    let mounted = true
    
    // 초기 세션만 한 번 확인
    const getInitialSession = async () => {
      if (!mounted) return
      
      setIsUserLoading(true)
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (mounted) {
          if (error) {
            setUser(null)
          } else {
            setUser(session?.user ?? null)
          }
        }
      } catch (error) {
        if (mounted) {
          setUser(null)
        }
      } finally {
        if (mounted) {
          setIsUserLoading(false)
        }
      }
    }

    getInitialSession()

    // 인증 상태 변화만 감지 (로깅 최소화)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setUser(session?.user ?? null)
          setIsUserLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // 사이드바 닫기 함수
  const closeUserMenu = () => {
    setIsUserMenuClosing(true)
    setTimeout(() => {
      setIsUserMenuOpen(false)
      setIsUserMenuClosing(false)
    }, 300) // 애니메이션 시간과 맞춤
  }

  // 로그아웃 처리
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('로그아웃 실패:', error)
      } else {
        setUser(null)
        closeUserMenu()
      }
    } catch (error) {
      console.error('로그아웃 중 오류:', error)
    }
  }

  // 클릭 외부 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (isUserMenuOpen && !target.closest('[data-user-menu]')) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isUserMenuOpen])


  // 카테고리 데이터 (확장된 섹션 포함)
  const categories = [
    { id: 'all', name: '전체', count: 1200, color: 'bg-gray-900 text-white', icon: Grid3X3 },
    { id: 'recommended', name: '추천', count: 89, color: 'bg-gray-800 text-white', icon: Award },
    { id: 'poolvilla', name: '풀빌라', count: 245, color: 'bg-gray-700 text-white', icon: Zap },
    { id: 'private', name: '독채', count: 189, color: 'bg-gray-600 text-white', icon: Shield },
    { id: 'kids', name: '키즈', count: 78, color: 'bg-emerald-600 text-white', icon: Heart },
    { id: 'party', name: '파티', count: 45, color: 'bg-purple-600 text-white', icon: Star },
    { id: 'new', name: '신규', count: 32, color: 'bg-blue-600 text-white', icon: TrendingUp },
    { id: 'trending', name: '인기급상승', count: 67, color: 'bg-red-600 text-white', icon: Zap },
    { id: 'pet', name: '반려견동반', count: 156, color: 'bg-orange-600 text-white', icon: Heart }
  ]

  // 관리자 설정 검색어 불러오기 (최적화: 캐싱 적용)
  const loadSearchSuggestions = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        const adminSuggestions = localStorage.getItem('adminSearchSuggestions')
        if (adminSuggestions) {
          const parsedSuggestions = JSON.parse(adminSuggestions)
          setSuggestions(parsedSuggestions)
        }
      }
    } catch (error) {
      // 프로덕션에서는 에러만 콘솔에 출력
      console.error('검색어 로드 실패:', error)
    }
  }, [])

  // 자동 슬라이드 전환은 서버 컴포넌트로 이동
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
  //   }, 6000)

  //   return () => clearInterval(interval)
  // }, [heroSlides.length])

  // 감성 문구 자동 전환은 서버 컴포넌트로 이동
  // useEffect(() => {
  //   if (heroTexts.length <= 1) return
  //   const interval = setInterval(() => {
  //     setCurrentEmotionalText((prev) => (prev + 1) % heroTexts.length)
  //   }, 5000)
  //   return () => clearInterval(interval)
  // }, [heroTexts.length])

  // 페이드 효과도 서버 컴포넌트로 이동
  // const [textOpacity, setTextOpacity] = useState(1)
  // useEffect(() => {
  //   const fadeOut = setTimeout(() => {
  //     setTextOpacity(0.3)
  //   }, 9000)
  //   const fadeIn = setTimeout(() => {
  //     setTextOpacity(1)
  //   }, 9500)
  //   return () => {
  //     clearTimeout(fadeOut)
  //     clearTimeout(fadeIn)
  //   }
  // }, [currentEmotionalText])

  // 히어로 슬라이드 로드는 서버 컴포넌트로 이동
  // const loadAdminHeroSlides = useCallback(() => {
  //   try {
  //     if (typeof window !== 'undefined') {
  //       const savedSlides = localStorage.getItem('adminHeroSlides')
  //       if (savedSlides) {
  //         const parsedSlides = JSON.parse(savedSlides)
  //         if (parsedSlides.length > 0) {
  //           setHeroSlides(parsedSlides)
  //         }
  //       }
  //     }
  //   } catch (error) {
  //     console.error('히어로 슬라이드 로드 실패:', error)
  //   }
  // }, [])


  // 추천 검색어 자동 스크롤 (항상 실행)
  useEffect(() => {
    if (!searchQuery && suggestions.length > 0) {
      const interval = setInterval(() => {
        setCurrentSuggestionIndex((prev) => (prev + 1) % suggestions.length)
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [searchQuery, suggestions.length])

  // 검색 모달 열기 이벤트
  useEffect(() => {
    const handleOpenSearchModal = () => setShowSearchModal(true)
    window.addEventListener('openSearchModal', handleOpenSearchModal)
    
    return () => {
      window.removeEventListener('openSearchModal', handleOpenSearchModal)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-2 border-gray-900 border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-2xl font-light text-gray-900 mb-2 tracking-tight">stay<span className="font-medium">oneday</span></h2>
          <p className="text-gray-600">특별한 하루를 준비하고 있습니다...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fullscreen-container bg-white">

      {/* 히어로 섹션은 서버 컴포넌트에서 렌더링됨 */}

      {/* 추천 스테이 섹션 - 히어로 바로 뒤 */}
      <SectionContainer
        title=""
        subtitle=""
        mainTitle="완벽한 하루를 위한"
        secondTitle="추천 스테이"
        detailDescription="엄선된 특별한 공간들"
        bgColor="bg-white"
        stays={featuredStays}
        loading={loading}
        scrollRef={recommendedScrollRef}
        dragState={dragState}
        handleMouseDown={handleMouseDown}
        handleMouseMove={handleMouseMove}
        handleMouseUp={handleMouseUp}
        handleMouseLeave={handleMouseLeave}
        handleTouchStart={handleTouchStart}
        handleTouchMove={handleTouchMove}
        handleTouchEnd={handleTouchEnd}
        handleCardClick={handleStayCardClick}
        useNextImage={true}
        variant="featured"
      />


      {/* 풀빌라 섹션 */}
      <SectionContainer
        id="poolvilla"
        title=""
        subtitle=""
        mainTitle="물 위에서 꿈꾸는"
        secondTitle="풀빌라"
        detailDescription="투명한 수면과 함께하는 특별한 시간"
        sectionLabel="PRIVATE POOL"
        bgColor="bg-gray-50/50"
        stays={poolvillaStays}
        loading={loading}
        scrollRef={poolvillaScrollRef}
        dragState={dragState}
        handleMouseDown={handleMouseDown}
        handleMouseMove={handleMouseMove}
        handleMouseUp={handleMouseUp}
        handleMouseLeave={handleMouseLeave}
        handleTouchStart={handleTouchStart}
        handleTouchMove={handleTouchMove}
        handleTouchEnd={handleTouchEnd}
        handleCardClick={handleStayCardClick}
        useNextImage={false}
      />

      {/* 독채 섹션 */}
      <SectionContainer
        id="private"
        title=""
        subtitle=""
        mainTitle="우리만의 프라이빗함"
        secondTitle="독채 스테이"
        detailDescription="온전히 우리만을 위한 독립된 공간"
        sectionLabel="PRIVATE HOUSE"
        bgColor="bg-white"
        stays={privateStays}
        loading={loading}
        scrollRef={privateScrollRef}
        dragState={dragState}
        handleMouseDown={handleMouseDown}
        handleMouseMove={handleMouseMove}
        handleMouseUp={handleMouseUp}
        handleMouseLeave={handleMouseLeave}
        handleTouchStart={handleTouchStart}
        handleTouchMove={handleTouchMove}
        handleTouchEnd={handleTouchEnd}
        handleCardClick={handleStayCardClick}
        useNextImage={false}
      />

      {/* 키즈 섹션 */}
      <SectionContainer
        id="kids"
        title=""
        subtitle=""
        mainTitle="아이들의 웃음소리 가득한"
        secondTitle="키즈 전용 스테이"
        detailDescription="온 가족이 함께하는 안전하고 즐거운 시간"
        sectionLabel="KIDS FRIENDLY"
        bgColor="bg-gray-50"
        stays={kidsStays}
        loading={loading}
        scrollRef={kidsScrollRef}
        dragState={dragState}
        handleMouseDown={handleMouseDown}
        handleMouseMove={handleMouseMove}
        handleMouseUp={handleMouseUp}
        handleMouseLeave={handleMouseLeave}
        handleTouchStart={handleTouchStart}
        handleTouchMove={handleTouchMove}
        handleTouchEnd={handleTouchEnd}
        handleCardClick={handleStayCardClick}
        useNextImage={false}
      />

      {/* 파티 섹션 */}
      <SectionContainer
        id="party"
        title=""
        subtitle=""
        mainTitle="빛나는 순간으로 기억될"
        secondTitle="파티 스테이"
        detailDescription="소중한 사람들과 만드는 특별한 추억"
        sectionLabel="PARTY & EVENT"
        bgColor="bg-white"
        stays={partyStays}
        loading={loading}
        scrollRef={partyScrollRef}
        dragState={dragState}
        handleMouseDown={handleMouseDown}
        handleMouseMove={handleMouseMove}
        handleMouseUp={handleMouseUp}
        handleMouseLeave={handleMouseLeave}
        handleTouchStart={handleTouchStart}
        handleTouchMove={handleTouchMove}
        handleTouchEnd={handleTouchEnd}
        handleCardClick={handleStayCardClick}
        useNextImage={false}
      />

      {/* 신규 섹션 */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl md:text-2xl font-normal text-gray-900 leading-tight mb-1">스테이 원데이</h2>
              <h3 className="text-xl md:text-2xl font-normal text-gray-900 leading-tight mb-2">신규 스테이</h3>
              <p className="text-sm text-gray-500 font-light max-w-xl leading-relaxed">막 오픈한 따끈따끈한 새로운 공간들</p>
            </div>
            <Button variant="tertiary" asChild>
              <Link href="/spaces" className="flex items-center transition-colors duration-300 group">
                <span>더보기</span>
                <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          <div 
            ref={newScrollRef}
            className="overflow-x-auto overflow-y-hidden -mx-4 select-none scroll-container"
            style={getScrollContainerStyles()}
            onMouseDown={(e) => handleMouseDown(newScrollRef, e)}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={(e) => handleTouchStart(newScrollRef, e)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onDragStart={(e) => e.preventDefault()}
          >
            <div className="flex space-x-4 pb-4 pl-4" style={{ width: 'max-content', paddingRight: '40vw' }}>
              {loading ? (
                // 로딩 스켈레톤
                Array.from({ length: 4 }).map((_, index) => (
                  <StayCard 
                    key={index}
                    stay={{} as any}
                    handleCardClick={() => {}}
                    loading={true}
                  />
                ))
              ) : (
                newStays.map((stay) => (
                <Link 
                  key={stay.id} 
                  href={`/spaces/${stay.id}`} 
                  className="group block flex-shrink-0"
                  onClick={(e) => handleStayCardClick(e, stay.id)}
                >
                  <Card className="overflow-hidden border-0 bg-white hover:z-50 relative transition-all duration-500 ease-out shadow-sm hover:shadow-2xl hover:shadow-gray-200/60 hover:-translate-y-2 hover:scale-[1.02] backdrop-blur-sm" 
                        style={{ 
                          width: '320px', 
                          minWidth: '320px',
                          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                          borderRadius: '16px'
                        }}>
                    <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: '1/1' }}>
                      <img 
                        src={stay.image} 
                        alt={stay.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 pointer-events-none select-none"
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()} 
                        style={{
                          filter: 'contrast(1.1) brightness(1.02) saturate(1.08)'
                        }}
                      />
                      <Badge className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-gray-900 border-0 shadow-sm text-xs px-3 py-1 rounded-full">NEW</Badge>
                      {/* 우측 상단 액션 버튼들 */}
                      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                        <Button variant="secondary" size="sm" className="bg-white/95 backdrop-blur-sm hover:bg-white text-gray-700 hover:text-red-500 rounded-full w-9 h-9 p-0 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 ease-out" onClick={(e) => e.preventDefault()}>
                          <Heart className="w-4 h-4 transition-colors duration-300" />
                        </Button>
                        <Button variant="secondary" size="sm" className="bg-white/95 backdrop-blur-sm hover:bg-white text-gray-700 rounded-full w-9 h-9 p-0 shadow-lg hover:scale-110 transition-transform duration-200" onClick={(e) => e.preventDefault()}>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* 하단 빠른 정보 (호버시 나타남) */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                        <div className="bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-xl">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-600" />
                              <span className="text-sm font-medium">최대 {stay.capacity}명</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <StarRating rating={stay.rating} readonly size="sm" showNumber />
                              {stay.ratingCount > 0 && (
                                <span className="text-xs text-gray-500">({stay.ratingCount})</span>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            {stay.amenities?.slice(0, 4).map((amenity: any, index: number) => (
                              <div key={index} className="flex items-center">
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></div>
                                {typeof amenity === 'string' ? amenity : amenity?.amenity_name || amenity?.name || '편의시설'}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardContent className="pt-3 px-4 pb-3">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 text-base">{stay.name}</h3>
                      <div className="flex items-center text-gray-500 text-sm mb-3">
                        <span>{stay.location}</span>
                        <span className="mx-2">·</span>
                        <span>최대 {stay.capacity}명</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-base font-bold text-gray-900">₩{stay.price.toLocaleString()}</span>
                          <span className="text-xs text-gray-500 ml-1">/1day</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <StarRating rating={stay.rating} readonly size="sm" showNumber />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 더 많은 공간 탐색 섹션 */}
      <section className="py-20 md:py-24 bg-gray-50/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4 tracking-tight">더 많은 특별한 공간들</h2>
          <p className="text-lg text-gray-500 mb-8 font-light max-w-2xl mx-auto">AI 기반 맞춤 추천으로 완벽한 공간을 발견하세요</p>
          <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 text-base font-light rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <Link href="/spaces" className="inline-flex items-center">
              전체 숙소 둘러보기
              <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </section>

      {/* 푸터 */}
      {/* 스테이폴리오 스타일 프리미엄 푸터 */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12 mt-20">
        <div className="container mx-auto px-4 max-w-6xl">
          
          {/* 기본 푸터 정보 - 사업자 정보가 접혀있을 때 */}
          {!showBusinessInfo && (
            <div className="space-y-8">
              {/* 브랜드 & 주요 정보 */}
              <div className="grid md:grid-cols-3 gap-8">
                {/* 브랜드 */}
                <div className="md:col-span-1">
                  <div className="text-2xl font-light tracking-tight text-gray-900 mb-4">
                    stay<span className="font-medium">oneday</span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    프리미엄 스테이 플랫폼으로<br />
                    특별한 하루를 경험하세요
                  </p>
                </div>

                {/* 고객 지원 */}
                <div className="md:col-span-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">고객 센터</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>평일 10:00 ~ 19:00</div>
                    <div className="text-xs text-gray-500">주말 및 공휴일 제외</div>
                  </div>
                </div>

                {/* 파트너 문의 */}
                <div className="md:col-span-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">파트너</h3>
                  <div className="space-y-2 text-sm">
                    <Link href="/partner-inquiry" className="text-gray-600 hover:text-gray-900 transition-colors block text-left">입점 문의</Link>
                    <Link href="/partnership" className="text-gray-600 hover:text-gray-900 transition-colors block text-left">제휴 문의</Link>
                    <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors block text-left">1:1 문의</Link>
                  </div>
                </div>
              </div>

              {/* 이용약관 & 면책 조항 */}
              <div className="space-y-4 pt-8 border-t border-gray-200">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <Link href="/terms" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">이용약관</Link>
                  <span className="text-gray-300">∙</span>
                  <Link href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">개인정보 처리방침</Link>
                </div>

                <div className="text-xs text-gray-500 leading-relaxed max-w-4xl">
                  스테이원데이는 통신판매 중개자로서 통신판매의 당사자가 아니며, 상품의 예약·이용 및 환불 등과 관련한 의무와 책임은 각 판매자에게 있습니다.
                </div>
              </div>

              {/* 하단 정보 */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-6 border-t border-gray-200">
                <div className="text-xs text-gray-400">
                  Copyright © {new Date().getFullYear()} STAYONEDAY. All rights reserved.
                </div>
                <button
                  onClick={() => setShowBusinessInfo(true)}
                  className="flex items-center text-xs text-gray-500 hover:text-gray-700 transition-colors self-start md:self-center"
                >
                  사업자정보
                  <ChevronDown className="w-3 h-3 ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* 사업자 정보 (토글 시 표시) */}
          {showBusinessInfo && (
            <div className="space-y-8">
              {/* 브랜드 & 주요 정보 (확장된 버전) */}
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                  <div className="text-2xl font-light tracking-tight text-gray-900 mb-4">
                    stay<span className="font-medium">oneday</span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    프리미엄 스테이 플랫폼으로<br />
                    특별한 하루를 경험하세요
                  </p>
                </div>

                <div className="md:col-span-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">고객 센터</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>평일 10:00 ~ 19:00</div>
                    <div className="text-xs text-gray-500">주말 및 공휴일 제외</div>
                  </div>
                </div>

                <div className="md:col-span-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">파트너</h3>
                  <div className="space-y-2 text-sm">
                    <Link href="/partner-inquiry" className="text-gray-600 hover:text-gray-900 transition-colors block text-left">입점 문의</Link>
                    <Link href="/partnership" className="text-gray-600 hover:text-gray-900 transition-colors block text-left">제휴 문의</Link>
                    <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors block text-left">1:1 문의</Link>
                  </div>
                </div>
              </div>

              {/* 상세 사업자 정보 */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">사업자 정보</h3>
                <div className="grid md:grid-cols-2 gap-4 text-xs text-gray-600 space-y-1 md:space-y-0">
                  <div className="space-y-1">
                    <div><span className="font-medium">회사명:</span> 주식회사 누크랩스</div>
                    <div><span className="font-medium">대표:</span> 안태웅</div>
                    <div><span className="font-medium">사업자등록번호:</span> 561-88-02777</div>
                  </div>
                  <div className="space-y-1">
                    <div><span className="font-medium">주소:</span> 경기도 화성시 동탄영천로 150 현대 실리콘앨리동탄 제B동 503호</div>
                    <div><span className="font-medium">통신판매신고:</span> 2022-서울서초-2594</div>
                    <div><span className="font-medium">고객센터:</span> info@nuklabs.com</div>
                  </div>
                </div>
              </div>

              {/* 이용약관 & 면책 조항 */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <Link href="/terms" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">이용약관</Link>
                  <span className="text-gray-300">∙</span>
                  <Link href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">개인정보 처리방침</Link>
                  <span className="text-gray-300">∙</span>
                  <Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">위치정보 이용약관</Link>
                </div>

                <div className="text-xs text-gray-500 leading-relaxed">
                  스테이원데이는 통신판매 중개자로서 통신판매의 당사자가 아니며, 상품의 예약·이용 및 환불 등과 관련한 의무와 책임은 각 판매자에게 있습니다.
                </div>
              </div>

              {/* 하단 정보 */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-6 border-t border-gray-200">
                <div className="text-xs text-gray-400">
                  Copyright © {new Date().getFullYear()} STAYONEDAY. All rights reserved.
                </div>
                <button
                  onClick={() => setShowBusinessInfo(false)}
                  className="flex items-center text-xs text-gray-500 hover:text-gray-700 transition-colors self-start md:self-center"
                >
                  사업자정보
                  <ChevronDown className="w-3 h-3 ml-1 rotate-180" />
                </button>
              </div>
            </div>
          )}
        </div>
      </footer>

      {/* 스테이폴리오 스타일 검색 모달 */}
      {showSearchModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowSearchModal(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 - 키보드 친화적 설계: 완료 버튼 상단 우측 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">검색</h2>
                <p className="text-sm text-gray-500 mt-1">원하시는 조건을 선택해주세요</p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="primary"
                  size="sm"
                  className="px-4"
                  onClick={() => {
                    console.log('검색 실행:', { searchLocation, selectedDate, guestCount })
                    setShowSearchModal(false)
                  }}
                >
                  검색
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowSearchModal(false)}
                  className="rounded-full hover:bg-gray-100 w-10 h-10 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* 검색 폼 */}
            <div className="p-6">
              {/* 장소 입력 - 간단한 스테이폴리오 스타일 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-800 mb-3">
                  목적지
                </label>
                <div className="relative">
                  <Input 
                    placeholder="지역을 입력해주세요"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="pl-4 pr-12 py-3 h-12 rounded-2xl border border-gray-200 focus:border-gray-400 focus:ring-0 text-base placeholder:text-gray-400 transition-colors"
                  />
                  {searchLocation && (
                    <button
                      onClick={() => setSearchLocation('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="검색어 지우기"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* 추천 태그 - 스테이폴리오 스타일 */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {suggestions.slice(0, 4).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setSearchLocation(suggestion)}
                      className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-full text-sm text-gray-600 transition-colors border border-gray-200"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* 날짜 & 인원 - 나란히 배치 */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {/* 날짜 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-3">
                    날짜
                  </label>
                  <div className="relative">
                    <Input 
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="pl-4 pr-4 py-3 h-12 rounded-2xl border border-gray-200 focus:border-gray-400 focus:ring-0 text-base [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {/* 인원 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-3">
                    인원
                  </label>
                  <div className="flex items-center justify-between h-12 px-4 rounded-2xl border border-gray-200 bg-white">
                    <span className="text-base text-gray-700">{guestCount}명</span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                        className="w-8 h-8 p-0 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                        disabled={guestCount <= 1}
                      >
                        -
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setGuestCount(Math.min(20, guestCount + 1))}
                        className="w-8 h-8 p-0 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                        disabled={guestCount >= 20}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 키보드 사용 시 상단 검색 버튼 사용 안내 */}
              <p className="text-sm text-gray-500 text-center mt-4">
                키보드 입력 중에는 상단의 검색 버튼을 이용해주세요
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}