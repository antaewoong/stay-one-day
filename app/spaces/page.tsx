'use client'

import { useState, useEffect } from 'react'
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
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/header'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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

export default function SpacesPage() {
  const supabase = createClient()
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [searchData, setSearchData] = useState({
    location: '',
    date: '',
    guests: '2',
    checkIn: '',
    checkOut: '',
    searchHistory: [] as string[],
    suggestedLocations: ['청주', '세종', '대전', '가평', '양양', '부산']
  })

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
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAccommodation, setSelectedAccommodation] = useState<any>(null)
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [activeStep, setActiveStep] = useState<'location' | 'dates' | 'guests' | 'filters'>('location')
  const [searchFocused, setSearchFocused] = useState(false)
  const [savedSearches, setSavedSearches] = useState<any[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(['1', '2'])

  const loadAccommodations = async (searchQuery = '') => {
    try {
      setIsLoading(true)
      
      let query = supabase
        .from('accommodations')
        .select('*')
        .eq('status', 'active')

      // 검색 기능 추가
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,region.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`)
      }

      // 필터 적용
      if (filters.priceRange && filters.priceRange.length === 2) {
        query = query
          .gte('base_price', filters.priceRange[0])
          .lte('base_price', filters.priceRange[1])
      }

      if (filters.capacity) {
        query = query.gte('max_capacity', parseInt(filters.capacity))
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error('숙소 데이터 로드 실패:', error)
        return
      }

      setAccommodations(data || [])
    } catch (error) {
      console.error('숙소 데이터 로드 중 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    loadAccommodations(searchData.location)
  }

  // 혁신적인 카테고리 컬렉션
  const collections = [
    { 
      id: 'all', 
      name: '전체', 
      count: 1247, 
      icon: Grid3X3, 
      gradient: 'from-slate-600 to-slate-800',
      description: '모든 프리미엄 공간'
    },
    { 
      id: 'recommended', 
      name: '큐레이터 추천', 
      count: 89, 
      icon: Award, 
      gradient: 'from-yellow-400 to-orange-500',
      description: '엄선된 최고급 공간'
    },
    { 
      id: 'poolvilla', 
      name: '풀빌라', 
      count: 345, 
      icon: Waves, 
      gradient: 'from-blue-400 to-cyan-500',
      description: '프라이빗 수영장'
    },
    { 
      id: 'private', 
      name: '독채형', 
      count: 289, 
      icon: Home, 
      gradient: 'from-green-400 to-emerald-500',
      description: '온전한 프라이버시'
    },
    { 
      id: 'trending', 
      name: '인기 급상승', 
      count: 67, 
      icon: TrendingUp, 
      gradient: 'from-red-400 to-pink-500',
      description: '지금 뜨는 공간'
    },
    { 
      id: 'luxury', 
      name: '럭셔리', 
      count: 156, 
      icon: Sparkles, 
      gradient: 'from-purple-400 to-indigo-500',
      description: '최고급 시설'
    }
  ]

  useEffect(() => {
    loadAccommodations()
  }, [])

  // 필터된 숙소 목록
  const filteredAccommodations = accommodations.filter(acc => {
    // 컬렉션 필터링은 이미 loadAccommodations에서 처리됨
    return true
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-12">
          {/* 스켈레톤 로딩 */}
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-24 bg-gray-200 rounded-lg"></div>
            <div className="flex gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded-full w-24"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

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

          {/* 스테이폴리오 스타일 검색바 */}
          <Card className="max-w-5xl mx-auto border border-gray-100 shadow-sm bg-gray-50 overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
                <div className="md:col-span-2 border-r border-gray-200 relative">
                  <div className="p-4 hover:bg-gray-100 transition-colors cursor-pointer">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">어디로 가시나요?</label>
                    <Input 
                      placeholder="목적지 검색"
                      className="border-0 bg-transparent p-0 focus:ring-0 font-normal text-sm text-gray-600 placeholder:text-gray-400"
                      value={searchData.location}
                      onChange={(e) => setSearchData({...searchData, location: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="border-r border-gray-200">
                  <div className="p-4 hover:bg-gray-100 transition-colors cursor-pointer">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">체크인</label>
                    <Input 
                      type="date"
                      placeholder="날짜 선택"
                      className="border-0 bg-transparent p-0 focus:ring-0 font-normal text-sm text-gray-600 placeholder:text-gray-400"
                      value={searchData.checkIn}
                      onChange={(e) => setSearchData({...searchData, checkIn: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="relative">
                  <div className="p-4 hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">인원</label>
                      <div className="font-normal text-sm text-gray-600">
                        {searchData.guests === '2' ? '인원 추가' : `${searchData.guests}명`}
                      </div>
                    </div>
                    <div 
                      onClick={handleSearch}
                      className="bg-gray-800 hover:bg-gray-900 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-sm transition-all duration-200 cursor-pointer"
                    >
                      <Search className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
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
              {accommodations.slice(0, 3).map((accommodation) => {
                return (
                  <Link key={accommodation.id} href={`/spaces/${accommodation.id}`} className="group block">
                    <Card className="overflow-hidden border border-purple-100 shadow-md hover:shadow-lg transition-all duration-300">
                      <div className="relative aspect-[4/3]">
                        <Image
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
                    <Image
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
    </div>
  )
}