'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Filter,
  MapPin,
  Users,
  Clock,
  Star,
  Calendar,
  Wifi,
  Car,
  Utensils,
  Waves,
  Heart,
  Share2,
  Grid3X3,
  List,
  SlidersHorizontal,
  Zap,
  Award,
  TrendingUp,
  Shield,
  ArrowUpDown,
  ChevronDown,
  X,
  CheckCircle2,
  Camera,
  MapIcon,
  Sparkles,
  Home
} from 'lucide-react'
import OptimizedImage from '@/components/optimized-image'
import Link from 'next/link'
import Header from '@/components/header'

interface Accommodation {
  id: string
  name: string
  description: string
  accommodation_type: string
  region: string
  address: string
  detailed_address: string
  max_capacity: number
  bedrooms: number
  bathrooms: number
  base_price: number
  weekend_price: number
  checkin_time: string
  checkout_time: string
  is_featured: boolean
  status: string
  created_at: string
  images?: string[]
}

interface SpacesClientProps {
  initialData: {
    accommodations: Accommodation[]
    collectionCounts: Record<string, number>
    error?: any
  }
}

export default function SpacesClient({ initialData }: SpacesClientProps) {
  const searchParams = useSearchParams()
  const [accommodations, setAccommodations] = useState<Accommodation[]>(initialData.accommodations)
  const [searchData, setSearchData] = useState({
    location: '',
    date: '',
    guests: '2',
    checkIn: '',
    checkOut: '',
    searchHistory: [] as string[],
    suggestedLocations: ['청주', '세종', '대전', '가평', '양양', '부산']
  })
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [searchLocation, setSearchLocation] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [guestCount, setGuestCount] = useState(2)

  const [filters, setFilters] = useState({
    priceRange: [0, 500000],
    amenities: [] as string[],
    capacity: '',
    category: '',
    collection: 'all',
    sortBy: 'recommended',
    propertyType: [] as string[],
    instantBook: false,
    superHost: false,
    accessibility: false
  })

  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAccommodation, setSelectedAccommodation] = useState<any>(null)
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [activeStep, setActiveStep] = useState<'location' | 'dates' | 'guests' | 'filters'>('location')
  const [searchFocused, setSearchFocused] = useState(false)
  const [savedSearches, setSavedSearches] = useState<any[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(['1', '2'])
  const [collectionCounts, setCollectionCounts] = useState<Record<string, number>>(initialData.collectionCounts)

  const handleSearch = () => {
    // 클라이언트 사이드 필터링만 수행
    applyFilters()
  }

  // 클라이언트 사이드 필터링 함수
  const applyFilters = () => {
    let filtered = [...initialData.accommodations]

    // 검색어 필터링
    if (searchLocation) {
      filtered = filtered.filter(acc =>
        acc.name.toLowerCase().includes(searchLocation.toLowerCase()) ||
        acc.region.toLowerCase().includes(searchLocation.toLowerCase()) ||
        acc.address.toLowerCase().includes(searchLocation.toLowerCase())
      )
    }

    // 가격 필터링
    if (filters.priceRange && filters.priceRange.length === 2) {
      filtered = filtered.filter(acc =>
        acc.base_price >= filters.priceRange[0] &&
        acc.base_price <= filters.priceRange[1]
      )
    }

    // 인원 필터링
    if (filters.capacity) {
      filtered = filtered.filter(acc => acc.max_capacity >= parseInt(filters.capacity))
    }

    // 게스트 수 필터링
    if (guestCount > 1) {
      filtered = filtered.filter(acc => acc.max_capacity >= guestCount)
    }

    // 컬렉션 필터링
    if (filters.collection !== 'all') {
      switch (filters.collection) {
        case 'recommended':
          filtered = filtered.filter(acc => acc.is_featured)
          break
        case 'poolvilla':
          filtered = filtered.filter(acc =>
            acc.name.toLowerCase().includes('풀빌라') ||
            acc.name.toLowerCase().includes('pool') ||
            acc.description?.toLowerCase().includes('풀빌라') ||
            acc.description?.toLowerCase().includes('수영장')
          )
          break
        case 'private':
          filtered = filtered.filter(acc => acc.accommodation_type === '독채형')
          break
        case 'trending':
          // 임시로 최근 생성된 순으로
          filtered = filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, Math.floor(filtered.length * 0.3))
          break
        case 'luxury':
          // 임시로 가격이 높은 순으로
          filtered = filtered.filter(acc => acc.base_price > 200000)
          break
      }
    }

    // 정렬 적용
    switch (filters.sortBy) {
      case 'price_low':
        filtered.sort((a, b) => a.base_price - b.base_price)
        break
      case 'price_high':
        filtered.sort((a, b) => b.base_price - a.base_price)
        break
      case 'rating':
        // 임시로 created_at 사용
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      default: // recommended
        filtered.sort((a, b) => {
          if (a.is_featured && !b.is_featured) return -1
          if (!a.is_featured && b.is_featured) return 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
        break
    }

    setAccommodations(filtered)
  }

  // 혁신적인 카테고리 컬렉션 - 실제 데이터 기반
  const collections = [
    {
      id: 'all',
      name: '전체',
      count: collectionCounts.all || 0,
      icon: Grid3X3,
      gradient: 'from-slate-600 to-slate-800',
      description: '모든 프리미엄 공간'
    },
    {
      id: 'recommended',
      name: '큐레이터 추천',
      count: collectionCounts.recommended || 0,
      icon: Award,
      gradient: 'from-yellow-400 to-orange-500',
      description: '엄선된 최고급 공간'
    },
    {
      id: 'poolvilla',
      name: '풀빌라',
      count: collectionCounts.poolvilla || 0,
      icon: Waves,
      gradient: 'from-blue-400 to-cyan-500',
      description: '프라이빗 수영장'
    },
    {
      id: 'private',
      name: '독채형',
      count: collectionCounts.private || 0,
      icon: Home,
      gradient: 'from-green-400 to-emerald-500',
      description: '온전한 프라이버시'
    },
    {
      id: 'trending',
      name: '인기 급상승',
      count: collectionCounts.trending || 0,
      icon: TrendingUp,
      gradient: 'from-red-400 to-pink-500',
      description: '지금 뜨는 공간'
    },
    {
      id: 'luxury',
      name: '럭셔리',
      count: collectionCounts.luxury || 0,
      icon: Sparkles,
      gradient: 'from-purple-400 to-indigo-500',
      description: '최고급 시설'
    }
  ]

  // URL 파라미터에서 검색 조건을 읽어오는 useEffect
  useEffect(() => {
    const location = searchParams.get('location') || ''
    const date = searchParams.get('date') || ''
    const guests = searchParams.get('guests') || '2'
    const stayType = searchParams.get('type') || ''

    // 검색 데이터 업데이트
    setSearchData(prev => ({
      ...prev,
      location,
      date,
      guests
    }))

    setSearchLocation(location)
    setGuestCount(parseInt(guests))

    // 스테이 형태 필터 업데이트
    if (stayType) {
      setFilters(prev => ({
        ...prev,
        category: stayType
      }))
    }

    // 필터 적용
    applyFilters()
  }, [searchParams])

  useEffect(() => {
    applyFilters()
  }, [filters.sortBy, filters.capacity, filters.collection, filters.category, guestCount, searchLocation])

  // 필터된 숙소 목록
  const filteredAccommodations = accommodations

  console.log('클라이언트에서 렌더링되는 숙소 수:', filteredAccommodations.length)

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* 검색 섹션 */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              완벽한 공간을 발견하세요
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              스테이 원데이에서 검증한 프리미엄 스테이가 당신을 기다립니다
            </p>
          </div>

          {/* 검색 버튼 - 모달 트리거 */}
          <Card
            className="max-w-5xl mx-auto border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-white"
            onClick={() => setShowSearchModal(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">목적지</span>
                    <span className="text-sm text-gray-500">
                      {searchLocation || '어디로 가시나요?'}
                    </span>
                  </div>
                  <div className="hidden md:block w-px h-8 bg-gray-200"></div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">날짜</span>
                    <span className="text-sm text-gray-500">
                      {selectedDate || '날짜를 선택하세요'}
                    </span>
                  </div>
                  <div className="hidden md:block w-px h-8 bg-gray-200"></div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">인원</span>
                    <span className="text-sm text-gray-500">
                      게스트 {guestCount}명
                    </span>
                  </div>
                </div>
                <div className="bg-gray-800 hover:bg-gray-900 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-sm transition-all duration-200">
                  <Search className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* 정렬 및 필터 컨트롤 */}
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">정렬:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                {[
                  { id: 'recommended', label: '추천순' },
                  { id: 'price_low', label: '낮은 가격' },
                  { id: 'price_high', label: '높은 가격' },
                  { id: 'rating', label: '평점순' }
                ].map((sort) => (
                  <button
                    key={sort.id}
                    onClick={() => setFilters({...filters, sortBy: sort.id})}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      filters.sortBy === sort.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {sort.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">인원:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                {[
                  { id: '', label: '전체' },
                  { id: '2', label: '2명' },
                  { id: '4', label: '4명' },
                  { id: '6', label: '6명+' }
                ].map((capacity) => (
                  <button
                    key={capacity.id}
                    onClick={() => setFilters({...filters, capacity: capacity.id})}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      filters.capacity === capacity.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {capacity.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 컬렉션 카테고리 */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">큐레이션 컬렉션</h2>
            <p className="text-base md:text-lg text-gray-600">테마별로 엄선된 특별한 공간들</p>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {collections.map((collection) => {
              const IconComponent = collection.icon
              return (
                <button
                  key={collection.id}
                  onClick={() => setFilters({...filters, collection: collection.id})}
                  className={`group relative overflow-hidden rounded-lg p-3 text-center transition-all duration-200 ${
                    filters.collection === collection.id
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center transition-all duration-200 ${
                    filters.collection === collection.id
                      ? 'bg-white/20'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <h3 className="font-medium text-xs mb-1 text-gray-900">{collection.name}</h3>
                  <Badge variant="secondary" className={`text-xs ${
                    filters.collection === collection.id
                      ? 'bg-white/20 text-white border-0'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {collection.count}개
                  </Badge>
                </button>
              )
            })}
          </div>
        </section>

        {/* 개인화 추천 섹션 */}
        {recentlyViewed.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Clock className="w-3 h-3 md:w-4 md:h-4 text-white" />
                </div>
                최근 본 숙소
              </h2>
              <Button variant="outline" size="sm" className="text-purple-600 border-purple-200 text-xs md:text-sm">
                모두 보기
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {filteredAccommodations.slice(0, 3).map((accommodation) => {
                return (
                  <Link key={accommodation.id} href={`/spaces/${accommodation.id}`} className="group block">
                    <Card className="overflow-hidden border border-purple-100 shadow-md hover:shadow-lg transition-all duration-300">
                      <div className="relative aspect-[4/3]">
                        <OptimizedImage
                          src={accommodation.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&crop=center'}
                          alt={accommodation.name}
                          fill
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-purple-500 text-white text-xs">
                            추천 숙소
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-3 md:p-4">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 text-sm md:text-base">{accommodation.name}</h3>
                        <p className="text-xs md:text-sm text-gray-600 mb-2">{accommodation.region}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-xs md:text-sm font-medium">4.9</span>
                          </div>
                          <span className="font-bold text-sm md:text-base">₩{accommodation.base_price.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* 벤치마크 추천 */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 md:p-8 mb-8">
            <div className="text-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">당신을 위한 추천</h2>
              <p className="text-sm md:text-base text-gray-600">방문 기록과 선호도를 기반으로 엄선된 숙소들</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-6">
              <Badge className="bg-blue-100 text-blue-700 px-3 md:px-4 py-1 md:py-2 text-xs md:text-sm">풀빌라 선호</Badge>
              <Badge className="bg-green-100 text-green-700 px-3 md:px-4 py-1 md:py-2 text-xs md:text-sm">고평점 선호</Badge>
              <Badge className="bg-purple-100 text-purple-700 px-3 md:px-4 py-1 md:py-2 text-xs md:text-sm">충청권 선호</Badge>
            </div>
          </div>
        </section>

        {/* 숙소 그리드 */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-gray-900">
                {filteredAccommodations.length}개의 숙소
              </span>
              {(filters.collection !== 'all' || filters.capacity || searchLocation) && (
                <button
                  onClick={() => {
                    setFilters({...filters, collection: 'all', capacity: '', sortBy: 'recommended'})
                    setSearchLocation('')
                  }}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                  필터 초기화
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredAccommodations.map((accommodation) => (
              <Link
                key={accommodation.id}
                href={`/spaces/${accommodation.id}`}
                className="group block"
              >
                <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 md:hover:-translate-y-3 bg-white cursor-pointer">
                  {/* 이미지 섹션 */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <OptimizedImage
                      src={accommodation.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&crop=center'}
                      alt={accommodation.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />

                    {/* 상단 배지들 */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {accommodation.is_featured && (
                        <Badge className="bg-red-500 text-white border-0 shadow-sm">
                          ⭐ 추천
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* 콘텐츠 섹션 */}
                  <CardContent className="p-4 md:p-6">
                    {/* 상단 정보 */}
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="text-xs font-medium border-blue-200 bg-blue-50 text-blue-700">
                        {accommodation.accommodation_type}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-bold text-gray-900">4.8</span>
                        <span className="text-xs text-gray-500">(12)</span>
                      </div>
                    </div>

                    {/* 숙소명 */}
                    <h3 className="font-bold text-base md:text-lg text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                      {accommodation.name}
                    </h3>

                    {/* 위치 & 수용인원 */}
                    <div className="flex items-center justify-between text-gray-600 mb-3">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-sm">{accommodation.region}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                          최대 {accommodation.max_capacity}명
                        </span>
                      </div>
                    </div>

                    {/* 신뢰도 지표 */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {accommodation.is_featured && (
                          <div className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                            <Award className="w-3 h-3" />
                            <span>추천 숙소</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>즉시확정</span>
                        </div>
                      </div>
                    </div>

                    {/* 가격 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {accommodation.weekend_price > accommodation.base_price && (
                          <span className="text-sm text-gray-400 line-through">
                            ₩{accommodation.weekend_price.toLocaleString()}
                          </span>
                        )}
                        <span className="text-lg md:text-xl font-bold text-gray-900">
                          ₩{accommodation.base_price.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">/일</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* 사용자 신뢰도 섹션 */}
        <section className="my-16 bg-gray-50 rounded-lg p-6 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">안심하고 예약하세요</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">엄격한 심사와 인증을 통과한 숙소들만을 제공합니다</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">안전 보장</h3>
              <p className="text-gray-600 text-sm">모든 숙소는 안전 및 위생 기준을<br/>충족합니다</p>
            </div>

            <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">인증된 호스트</h3>
              <p className="text-gray-600 text-sm">신원과 자격을 인증받은<br/>신뢰할 수 있는 호스트</p>
            </div>

            <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">24/7 고객지원</h3>
              <p className="text-gray-600 text-sm">언제나 도움이 필요할 때<br/>전문 팀이 대기</p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Badge className="bg-green-100 text-green-800 px-4 py-2 text-sm font-medium">
              99.9% 고객 만족도 달성
            </Badge>
          </div>
        </section>

        {/* 로드 모어 */}
        <div className="text-center mt-12">
          <div className="mb-6">
            <p className="text-gray-600 mb-4">더 많은 특별한 숙소들이 있어요</p>
            <div className="flex flex-wrap justify-center gap-2 md:gap-4 text-sm text-gray-500">
              <span>풀빌라 345개</span>
              <span>독채형 289개</span>
              <span>글램핑 156개</span>
            </div>
          </div>
          <Button
            variant="outline"
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 rounded px-6 md:px-8 py-3 text-base md:text-lg font-medium transition-all duration-200"
          >
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            더 많은 숙소 보기
          </Button>
        </div>
      </div>

      {/* 검색 모달 */}
      {showSearchModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowSearchModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">검색</h2>
                <p className="text-sm text-gray-500 mt-1">원하시는 조건을 선택해주세요</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="default"
                  size="sm"
                  className="px-4 bg-gray-800 hover:bg-gray-900"
                  onClick={() => {
                    setSearchData(prev => ({
                      ...prev,
                      location: searchLocation,
                      checkIn: selectedDate,
                      guests: guestCount.toString()
                    }))
                    handleSearch()
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
              {/* 장소 입력 */}
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

                {/* 추천 태그 */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {searchData.suggestedLocations.slice(0, 4).map((suggestion, index) => (
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

              {/* 날짜 & 인원 */}
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

              {/* 안내 텍스트 */}
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