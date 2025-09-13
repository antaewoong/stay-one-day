'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Heart, 
  Users, 
  Home, 
  Share2, 
  X,
  CalendarDays 
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function UserHeader() {
  const [user, setUser] = useState<any>(null)
  const [isUserLoading, setIsUserLoading] = useState(true)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [searchLocation, setSearchLocation] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [guestCount, setGuestCount] = useState(2)

  const supabase = createClient()

  // 사용자 인증 상태 확인
  useEffect(() => {
    let mounted = true
    
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

  // 로그아웃 처리
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('로그아웃 실패:', error)
      } else {
        setUser(null)
        setIsUserMenuOpen(false)
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

  return (
    <>
      {/* 유저 페이지 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* 왼쪽: 로고 + 홈 버튼 */}
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-light tracking-tight text-gray-900">
              stay<span className="font-medium">oneday</span>
            </Link>
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Home className="w-5 h-5 text-gray-600" />
            </Link>
          </div>
          
          {/* 중앙: 검색창 */}
          <div className="flex-1 max-w-2xl mx-8">
            <div 
              className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full px-6 py-2 cursor-pointer transition-all duration-300 hover:shadow-md"
              onClick={() => setShowSearchModal(true)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm text-gray-600 truncate">
                    {searchLocation || "어디로 여행가시나요?"}
                  </div>
                </div>
                <div className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 ml-4">
                  <Search className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽: 액션 버튼들 */}
          <div className="flex items-center gap-3">
            {/* 공유하기 */}
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-gray-100 rounded-full"
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
              <Share2 className="w-5 h-5 text-gray-600" />
            </Button>

            {/* 위시리스트 */}
            <Link href="/wishlist">
              <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 rounded-full">
                <Heart className="w-5 h-5 text-gray-600" />
              </Button>
            </Link>

            {/* 사용자 메뉴 */}
            <div className="relative" data-user-menu>
              {isUserLoading ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-2 hover:bg-gray-100 rounded-full"
                  disabled
                >
                  <Users className="w-5 h-5 text-gray-600" />
                </Button>
              ) : user ? (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-2 hover:bg-gray-100 rounded-full"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <Users className="w-5 h-5 text-gray-600" />
                  </Button>
                  {isUserMenuOpen && (
                    <>
                      {/* 백드롭 오버레이 */}
                      <div 
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      
                      {/* 슬라이드 사이드바 */}
                      <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300 ease-out">
                        <div className="flex flex-col h-full">
                          {/* 헤더 */}
                          <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">마이페이지</h2>
                            <button
                              onClick={() => setIsUserMenuOpen(false)}
                              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          {/* 사용자 정보 */}
                          <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                <Users className="w-6 h-6 text-gray-600" />
                              </div>
                              <div>
                                <p className="text-base font-medium text-gray-900">
                                  {user.user_metadata?.full_name || user.email?.split('@')[0] || '사용자'}
                                </p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </div>

                          {/* 메뉴 목록 */}
                          <div className="flex-1 py-6">
                            <nav className="space-y-2 px-6">
                              <Link 
                                href="/profile" 
                                className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 hover:translate-x-1"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <Users className="w-5 h-5" />
                                <span>프로필</span>
                              </Link>
                              <Link 
                                href="/wishlist" 
                                className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 hover:translate-x-1"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <Heart className="w-5 h-5" />
                                <span>위시리스트</span>
                              </Link>
                              <Link 
                                href="/reservations" 
                                className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 hover:translate-x-1"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <CalendarDays className="w-5 h-5" />
                                <span>예약 내역</span>
                              </Link>
                            </nav>
                          </div>

                          {/* 하단 로그아웃 버튼 */}
                          <div className="p-6 border-t border-gray-100">
                            <button
                              onClick={handleSignOut}
                              className="flex items-center space-x-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              <span>로그아웃</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <Link href="/auth/login">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <Users className="w-5 h-5 text-gray-600" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

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
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* 날짜 & 인원 */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {/* 날짜 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-3">
                    날짜
                  </label>
                  <Input 
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-4 pr-4 py-3 h-12 rounded-2xl border border-gray-200 focus:border-gray-400 focus:ring-0 text-base"
                    min={new Date().toISOString().split('T')[0]}
                  />
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
                        className="w-8 h-8 p-0 rounded-full hover:bg-gray-100 text-gray-500"
                        disabled={guestCount <= 1}
                      >
                        -
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setGuestCount(Math.min(20, guestCount + 1))}
                        className="w-8 h-8 p-0 rounded-full hover:bg-gray-100 text-gray-500"
                        disabled={guestCount >= 20}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}