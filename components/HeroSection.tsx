'use client'

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
import Image from 'next/image'
import { useState, useEffect, memo } from 'react'
import { motion } from 'framer-motion'

interface HeroSectionProps {
  heroSlides: any[]
  heroTexts: any[]
  currentSlide: number
  setCurrentSlide: (index: number) => void
  currentEmotionalText: number
  textOpacity: number
  heroY: any
  heroOpacity: any
  user: any
  isUserLoading: boolean
  isUserMenuOpen: boolean
  setIsUserMenuOpen: (open: boolean) => void
  handleSignOut: () => void
  suggestions: string[]
  currentSuggestionIndex: number
  searchLocation: string
  setShowSearchModal: (show: boolean) => void
}

const HeroSection = memo(function HeroSection({
  heroSlides,
  heroTexts,
  currentSlide,
  setCurrentSlide,
  currentEmotionalText,
  textOpacity,
  heroY,
  heroOpacity,
  user,
  isUserLoading,
  isUserMenuOpen,
  setIsUserMenuOpen,
  handleSignOut,
  suggestions,
  currentSuggestionIndex,
  searchLocation,
  setShowSearchModal
}: HeroSectionProps) {
  // 터치 스와이프를 위한 상태
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // 슬라이드 네비게이션 함수들
  const nextSlide = () => {
    const slidesLength = (heroSlides || []).length
    if (slidesLength > 0) {
      setCurrentSlide((currentSlide + 1) % slidesLength)
    }
  }

  const prevSlide = () => {
    const slidesLength = (heroSlides || []).length
    if (slidesLength > 0) {
      setCurrentSlide((currentSlide - 1 + slidesLength) % slidesLength)
    }
  }

  // 터치 이벤트 핸들러
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null) // 이전 터치 종료점 초기화
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || (heroSlides || []).length <= 1) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50


    if (isLeftSwipe) {
      nextSlide()
    } else if (isRightSwipe) {
      prevSlide()
    }
    
    // 터치 상태 초기화
    setTouchStart(null)
    setTouchEnd(null)
  }
  return (
    <section 
      className="relative h-[65vh] sm:h-[45vh] md:h-[45vh] lg:h-[50vh] overflow-hidden touch-pan-y"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* 배경 이미지 슬라이더 */}
      <motion.div 
        className="absolute inset-0"
        style={{ y: heroY, opacity: heroOpacity }}
      >
        {(heroSlides || []).map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 ${
              index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.15)), url('${slide.image}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              filter: 'contrast(1.15) brightness(1.05) saturate(1.1)',
            }}
          >
            {/* 프리미엄 오버레이 - 스테이폴리오 스타일 명암비 강화 */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40"></div>
          </div>
        ))}
      </motion.div>

      {/* 투명 헤더 오버레이 */}
      <div className="absolute top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* 왼쪽: 홈 + 로고 */}
            <div className="flex items-center gap-4">
              <Link href="/" className="text-white hover:text-white/80 transition-colors p-2">
                <Home className="w-5 h-5" />
              </Link>
              <Link href="/" className="font-light text-white tracking-tight" style={{ fontSize: '3.5rem', lineHeight: '1' }}>
                stay<span className="font-medium">oneday</span>
              </Link>
            </div>
            
            {/* 오른쪽: 공유하기 + 위시리스트 + 마이페이지 */}
            <div className="flex items-center gap-3">
              <div
                className="rounded-full p-2 cursor-pointer hover:bg-white/10 transition-colors"
                style={{ 
                  color: 'white !important',
                  backgroundColor: 'transparent !important',
                  border: 'none',
                  outline: 'none'
                }}
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
                <Share2 className="w-5 h-5" style={{ 
                  color: 'white !important',
                  fill: 'none',
                  stroke: 'white',
                  strokeWidth: '2'
                }} />
              </div>
              <Link href="/wishlist">
                <div
                  className="rounded-full p-2 cursor-pointer hover:bg-white/10 transition-colors"
                  style={{ 
                    color: 'white !important',
                    backgroundColor: 'transparent !important',
                    border: 'none',
                    outline: 'none'
                  }}
                >
                  <Heart className="w-5 h-5" style={{ 
                    color: 'white !important',
                    fill: 'none',
                    stroke: 'white',
                    strokeWidth: '2'
                  }} />
                </div>
              </Link>
              <div className="relative" data-user-menu>
                {isUserLoading ? (
                  <div
                    className="text-white rounded-full w-10 h-10 p-0 flex items-center justify-center cursor-not-allowed"
                    style={{ 
                      backgroundColor: 'transparent !important',
                      border: 'none',
                      outline: 'none'
                    }}
                  >
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                ) : user ? (
                  <>
                    <div
                      className="text-white hover:bg-white/10 rounded-full w-10 h-10 p-0 flex items-center justify-center cursor-pointer transition-colors"
                      style={{ 
                        backgroundColor: 'transparent !important',
                        border: 'none',
                        outline: 'none'
                      }}
                      onClick={() => {
                        console.log('마이페이지 버튼 클릭 - 로그인된 사용자:', user.email)
                        setIsUserMenuOpen(!isUserMenuOpen)
                      }}
                    >
                      <Users className="w-5 h-5" style={{ 
                        color: 'white !important',
                        fill: 'none',
                        stroke: 'white',
                        strokeWidth: '2'
                      }} />
                    </div>
                    {isUserMenuOpen && (
                      <>
                        {/* 백드롭 오버레이 */}
                        <div 
                          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-in fade-in duration-300"
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
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
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
                    <div
                      className="text-white hover:bg-white/10 rounded-full w-10 h-10 p-0 flex items-center justify-center cursor-pointer transition-colors"
                      style={{ 
                        backgroundColor: 'transparent !important',
                        border: 'none',
                        outline: 'none'
                      }}
                      onClick={() => console.log('마이페이지 버튼 클릭 - 로그인 안된 사용자')}
                    >
                      <Users className="w-5 h-5" style={{ 
                        color: 'white !important',
                        fill: 'none',
                        stroke: 'white',
                        strokeWidth: '2'
                      }} />
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 검색창 오버레이 - 간단한 스테이폴리오 스타일 */}
      <div className="absolute top-16 left-0 right-0 z-40">
        <div className="container mx-auto px-4 py-2">
          <div className="max-w-sm sm:max-w-md mx-auto">
            <div 
              className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-full shadow-lg p-2 sm:p-2.5 cursor-pointer hover:shadow-xl transition-shadow duration-300"
              onClick={() => setShowSearchModal(true)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 px-2">
                  <div className="text-sm sm:text-base font-medium text-gray-900 h-6 overflow-hidden relative">
                    <div 
                      className="transition-transform duration-500 ease-in-out"
                      style={{
                        transform: `translateY(-${currentSuggestionIndex * 24}px)`
                      }}
                    >
                      {(suggestions || []).map((suggestion, index) => (
                        <div key={index} className="h-6 flex items-center">
                          {searchLocation || suggestion}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2">
                  <Search className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 블러/그라데이션 오버레이 - 가독성 향상 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      
      {/* 텍스트 - 스테이폴리오 스타일 감성 문구 (모바일: 좌하단, PC: 가운데) */}
      <div className="absolute inset-0 flex items-end justify-start md:items-center md:justify-center z-10">
        <div 
          className="text-left md:text-center text-white px-6 sm:px-8 pb-12 sm:pb-16 md:pb-0 max-w-2xl md:max-w-4xl"
          style={{ 
            opacity: textOpacity,
            transform: `scale(${textOpacity === 1 ? 1 : 0.98})`,
            transition: 'all 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }}
        >
          {/* 영문 액센트 */}
          <div className="relative h-5 overflow-hidden mb-3">
            <div 
              style={{
                transform: `translateY(-${currentEmotionalText * (100 / (heroTexts || []).length)}%)`,
                opacity: textOpacity,
                height: `${(heroTexts || []).length * 100}%`,
                transition: 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {(heroTexts || []).map((text, index) => (
                <div key={`accent-${index}`} className="flex items-start justify-start" style={{ height: `${100 / (heroTexts || []).length}%` }}>
                  <span className="text-sm sm:text-xs font-light tracking-[0.15em] text-white/70 uppercase transition-all duration-1000 ease-out" style={{ fontFamily: "'Pretendard', sans-serif", letterSpacing: '0.15em', lineHeight: '1.2' }}>
                    {text.accent}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 메인 + 서브 텍스트 - 스테이폴리오 스타일 (두 줄로 함께 표시) */}
          <div className="relative h-16 sm:h-18 md:h-20 overflow-hidden">
            <div 
              style={{
                transform: `translateY(-${currentEmotionalText * (100 / (heroTexts || []).length)}%)`,
                height: `${(heroTexts || []).length * 100}%`,
                transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {(heroTexts || []).map((text, index) => (
                <div key={`combined-${index}`} className="flex flex-col justify-start" style={{ height: `${100 / (heroTexts || []).length}%` }}>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium text-white drop-shadow-lg mb-2 transition-all duration-1000 ease-out" style={{ fontFamily: "'Pretendard', sans-serif", letterSpacing: '-0.01em', lineHeight: '1.2' }}>
                    {text.main}
                  </h1>
                  <p className="text-lg sm:text-xl md:text-2xl text-white/80 font-light max-w-lg transition-all duration-1000 ease-out" style={{ fontFamily: "'Pretendard', sans-serif", letterSpacing: '0.01em', lineHeight: '1.3', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                    {text.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 장식적인 라인 */}
          <div className="mt-6 flex justify-start md:justify-center">
            <div className="w-12 h-px bg-white/40"></div>
          </div>
        </div>
      </div>


      {/* 슬라이드 인디케이터 */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {(heroSlides || []).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentSlide 
                ? 'w-8 h-2 bg-white' 
                : 'w-2 h-2 bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>
    </section>
  )
})

export default HeroSection