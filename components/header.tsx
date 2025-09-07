'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Search,
  MapPin,
  Calendar,
  Users,
  Filter,
  User,
  Heart,
  Menu,
  X,
  ArrowLeft,
  Home,
  Share2
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<'user' | 'host' | 'admin'>('user')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedGuests, setSelectedGuests] = useState('4')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  // 현재 페이지가 숙소 상세 페이지인지 확인
  const isAccommodationDetail = pathname.startsWith('/spaces/') && pathname !== '/spaces'

  // 모든 페이지에서 흰색 배경 사용 (에어비앤비/스테이폴리오 스타일)
  const headerClass = "bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200"
  const textClass = "text-gray-900"

  useEffect(() => {
    // 드롭다운 외부 클릭시 닫기
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserMenuOpen) {
        const target = event.target as Element
        if (!target.closest('.relative')) {
          setIsUserMenuOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserMenuOpen])

  // 사용자 역할 체크 함수 메모화
  const checkUserRole = useCallback((email: string) => {
    const mainAdminEmails = ['admin@stayoneday.com', 'manager@stayoneday.com']
    const hostEmails = ['host1@example.com', 'host2@example.com', 'test@test.com']
    
    if (mainAdminEmails.includes(email)) {
      return 'admin'
    } else if (hostEmails.includes(email)) {
      return 'host'
    }
    return 'user'
  }, [])

  useEffect(() => {
    let mounted = true
    
    // 초기 세션 확인
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        setUser(session?.user || null)
        if (session?.user?.email) {
          setUserRole(checkUserRole(session.user.email) as 'user' | 'host' | 'admin')
        }
        setIsLoading(false)
      } catch (error) {
        if (mounted) {
          setUser(null)
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      
      setUser(session?.user || null)
      
      if (session?.user?.email) {
        setUserRole(checkUserRole(session.user.email) as 'user' | 'host' | 'admin')
      } else {
        setUserRole('user')
      }
      
      setIsLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [checkUserRole])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleSearch = () => {
    // 검색 파라미터를 URL에 추가하여 spaces 페이지로 이동
    const searchParams = new URLSearchParams()
    
    if (selectedRegion) searchParams.append('region', selectedRegion)
    if (selectedDate) searchParams.append('date', selectedDate)
    if (selectedGuests) searchParams.append('guests', selectedGuests)
    if (selectedCategories.length > 0) searchParams.append('categories', selectedCategories.join(','))
    if (minPrice) searchParams.append('minPrice', minPrice)
    if (maxPrice) searchParams.append('maxPrice', maxPrice)
    
    // 검색 모달 닫기
    setIsSearchOpen(false)
    
    // 검색 결과 페이지로 이동
    router.push(`/spaces?${searchParams.toString()}`)
  }

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  return (
    <header className={headerClass}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* 왼쪽 영역: 뒤로가기 + 홈 + 로고 */}
          <div className="flex items-center space-x-4">
            {/* 뒤로가기 버튼 (메인 페이지가 아닐 때만 표시) */}
            {pathname !== '/' && (
              <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="flex items-center text-gray-700 hover:text-gray-900 p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            
            {/* 홈 버튼 */}
            <Link href="/" className="flex items-center text-gray-700 hover:text-gray-900 p-2">
              <Home className="w-5 h-5" />
            </Link>
            
          </div>

          {/* 데스크탑 네비게이션 */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link href="/spaces" className="text-gray-900 hover:text-gray-700 font-medium transition-colors">
              전체 스테이
            </Link>
            
            {/* FIND STAY 상세 검색 */}
            <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <DialogTrigger asChild>
                <button className="font-medium text-gray-900 hover:text-gray-700 transition-colors cursor-pointer">
                  FIND STAY
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>스테이 상세 검색</DialogTitle>
                  <DialogDescription>
                    원하는 조건으로 완벽한 스테이를 찾아보세요
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  {/* 지역 선택 */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">지역</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['청주', '세종', '대전', '충남', '충북', '기타'].map((region) => (
                        <Button 
                          key={region} 
                          variant={selectedRegion === region ? "default" : "outline"} 
                          size="sm" 
                          className="justify-start"
                          onClick={() => setSelectedRegion(selectedRegion === region ? '' : region)}
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          {region}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* 날짜 선택 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">체크인</label>
                      <Input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">인원</label>
                      <select 
                        className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
                        value={selectedGuests}
                        onChange={(e) => setSelectedGuests(e.target.value)}
                      >
                        <option value="2">2명</option>
                        <option value="4">4명</option>
                        <option value="6">6명</option>
                        <option value="8">8명</option>
                        <option value="10">10명</option>
                        <option value="12">12명</option>
                        <option value="15">15명</option>
                        <option value="20">20명</option>
                      </select>
                    </div>
                  </div>

                  {/* 카테고리 필터 */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">카테고리</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        '배달음식 이용 편리',
                        '물놀이 가능 풀빌라',
                        '프라이빗 독채형',
                        '반려견 동반 가능',
                        '키즈 전용',
                        '자연 속 완벽한 휴식'
                      ].map((category) => (
                        <Button 
                          key={category} 
                          variant={selectedCategories.includes(category) ? "default" : "outline"} 
                          size="sm"
                          onClick={() => handleCategoryToggle(category)}
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* 가격 범위 */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">가격 범위</label>
                    <div className="grid grid-cols-2 gap-4">
                      <Input 
                        type="number" 
                        placeholder="최소 금액" 
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                      />
                      <Input 
                        type="number" 
                        placeholder="최대 금액" 
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setSelectedRegion('')
                        setSelectedDate('')
                        setSelectedGuests('4')
                        setSelectedCategories([])
                        setMinPrice('')
                        setMaxPrice('')
                      }}
                    >
                      초기화
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={handleSearch}
                    >
                      검색하기
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Link href="/promotion" className="text-gray-900 hover:text-gray-700 font-medium relative transition-colors">
              PROMOTION
              <Badge variant="secondary" className="absolute -top-2 -right-6 text-xs bg-red-500 text-white">
                NEW
              </Badge>
            </Link>
            
            <Link href="/pre-order" className="text-gray-900 hover:text-gray-700 font-medium transition-colors">
              PRE-ORDER
            </Link>
          </nav>

          {/* 우측 메뉴 */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            
            {/* 검색창 */}
            <div className="flex items-center relative">
              <Input
                type="text"
                placeholder="스테이 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 sm:w-48 md:w-56 pr-10 text-sm bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-gray-300"
              />
              <Search className="w-4 h-4 absolute right-3 text-gray-400" />
            </div>

            {/* 예약조회 - 데스크탑에서만 */}
            <Link href="/reservations" className="hidden lg:block text-gray-900 hover:text-gray-700 font-medium transition-colors">
              예약조회
            </Link>

            {/* 공유하기 */}
            <Button 
              variant="ghost" 
              className="text-gray-900 hover:text-gray-700 transition-colors p-2"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Stay One Day',
                    text: '완벽한 당일여행을 위한 숙소 플랫폼',
                    url: window.location.href
                  })
                } else {
                  navigator.clipboard.writeText(window.location.href)
                  alert('링크가 클립보드에 복사되었습니다!')
                }
              }}
            >
              <Share2 className="w-5 h-5" />
            </Button>

            {/* 숙소 상세 페이지에서만 표시되는 즐겨찾기 버튼 */}
            {isAccommodationDetail && (
              <Button
                variant="ghost"
                onClick={() => setIsFavorite(!isFavorite)}
                className="flex items-center text-gray-900 hover:text-red-600 p-2"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-900'}`} />
              </Button>
            )}

            {/* 위시리스트 (일반 페이지에서만) */}
            {!isAccommodationDetail && (
              <Link href="/wishlist" className="text-gray-900 hover:text-gray-700 transition-colors p-2 relative">
                <Heart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">2</span>
              </Link>
            )}

            {/* 사용자 메뉴 */}
            <div className="relative">
              <Button 
                variant="ghost" 
                className="text-gray-900 hover:text-gray-700 transition-colors p-2 h-auto"
                onClick={() => {
                  setIsUserMenuOpen(!isUserMenuOpen)
                }}
              >
                <User className="w-5 h-5" />
              </Button>

              {/* 드롭다운 메뉴 */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  {isLoading ? (
                    <div className="px-4 py-2 text-gray-500">로딩 중...</div>
                  ) : user ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-100 font-medium">
                        {user.user_metadata?.full_name || user.email}
                        <Badge 
                          variant={userRole === 'admin' ? 'default' : userRole === 'host' ? 'secondary' : 'outline'} 
                          className="ml-2"
                        >
                          {userRole === 'admin' ? '관리자' : userRole === 'host' ? '호스트' : '일반'}
                        </Badge>
                      </div>
                      
                      {/* 공통 메뉴 */}
                      <Link href="/profile" className="block px-4 py-2 hover:bg-gray-50 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                        프로필
                      </Link>
                      
                      {/* 일반 사용자 및 호스트 메뉴 */}
                      {(userRole === 'user' || userRole === 'host') && (
                        <Link href="/reservations" className="block px-4 py-2 hover:bg-gray-50 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                          예약 내역
                        </Link>
                      )}
                      
                      {/* 호스트 전용 메뉴 */}
                      {userRole === 'host' && (
                        <Link href="/host" className="block px-4 py-2 hover:bg-gray-50 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                          호스트 대시보드
                        </Link>
                      )}
                      
                      {/* 관리자 전용 메뉴 */}
                      {userRole === 'admin' && (
                        <>
                          <Link href="/admin" className="block px-4 py-2 hover:bg-gray-50 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                            관리자 대시보드
                          </Link>
                          <Link href="/host" className="block px-4 py-2 hover:bg-gray-50 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                            호스트 관리
                          </Link>
                        </>
                      )}
                      
                      <Link href="/wishlist" className="block px-4 py-2 hover:bg-gray-50 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                        위시리스트
                      </Link>
                      
                      <button 
                        onClick={() => {
                          handleLogout()
                          setIsUserMenuOpen(false)
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-red-600"
                      >
                        로그아웃
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/auth/login" className="block px-4 py-2 hover:bg-gray-50 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                        로그인
                      </Link>
                      <Link href="/auth/signup" className="block px-4 py-2 hover:bg-gray-50 transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                        회원가입
                      </Link>
                      <div className="px-4 py-2 text-xs text-gray-500">
                        상태: {isLoading ? '로딩중' : '비로그인'}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 모바일 햄버거 메뉴 */}
            <button
              className="lg:hidden text-gray-900 hover:text-gray-700 transition-colors p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 space-y-2 border-t border-gray-200 bg-white shadow-lg">
            <div className="flex items-center space-x-2 mb-4">
              <Input
                type="text"
                placeholder="스테이 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-gray-300"
              />
              <button className="border border-gray-300 text-gray-700 hover:text-gray-900 p-2 rounded-md transition-colors hover:bg-gray-50">
                <Search className="w-4 h-4" />
              </button>
            </div>
            
            <Link 
              href="/spaces" 
              className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              전체 스테이
            </Link>
            
            <button 
              className="block w-full text-left px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setIsSearchOpen(true)
                setIsMenuOpen(false)
              }}
            >
              FIND STAY
            </button>
            
            <Link 
              href="/promotion" 
              className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              PROMOTION
            </Link>
            
            <Link 
              href="/pre-order" 
              className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              PRE-ORDER (신규오픈)
            </Link>
            
            <Link 
              href="/reservations" 
              className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              예약조회
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}