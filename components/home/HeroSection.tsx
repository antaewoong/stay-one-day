'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, ChevronRight, Search, MapPin, CalendarDays, Users, Heart } from 'lucide-react'
import Link from 'next/link'

interface HeroSlide {
  id: string
  title?: string
  subtitle?: string
  description?: string
  image?: string
  image_url?: string
  headline?: string
  subheadline?: string
  cta?: string
  cta_text?: string
  badge?: string
  stats?: {
    avgRating?: string
    bookings?: string
    price?: string
  }
  order?: number
  sort_order?: number
  active?: boolean
}

interface HeroSectionProps {
  slides?: HeroSlide[]
}

export default function HeroSection({ slides }: HeroSectionProps) {
  // null-safe 처리
  const items = useMemo<HeroSlide[]>(() => (Array.isArray(slides) ? slides : []), [slides])
  
  const [currentSlide, setCurrentSlide] = useState(0)
  const [searchLocation, setSearchLocation] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [guestCount, setGuestCount] = useState(2)

  // 초기화는 useEffect에서 처리
  useEffect(() => {
    if (items.length > 0) {
      setCurrentSlide(0)
    }
  }, [items.length])

  // 자동 슬라이드 전환
  useEffect(() => {
    if (items.length === 0) return
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % items.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [items.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % items.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + items.length) % items.length)
  }

  if (items.length === 0) {
    return (
      <section className="relative bg-gray-100 flex items-center justify-center" style={{ height: '45vh' }}>
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-600 mb-4">히어로 슬라이드 로딩중...</h1>
          <p className="text-gray-500">관리자 페이지에서 슬라이드를 추가해보세요</p>
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden bg-gray-900" style={{ height: '45vh' }}>
      {/* 배경 슬라이드들 */}
      <div className="absolute inset-0">
        {items.map((slide, index) => {
          const imageUrl = slide.image_url || slide.image || ''
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-1000 ${
                index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
              style={{
                backgroundImage: `linear-gradient(135deg, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.15)), url('${imageUrl}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                filter: 'contrast(1.15) brightness(1.05) saturate(1.1)',
              }}
            >
              {/* 프리미엄 오버레이 - 스테이폴리오 스타일 명암비 강화 */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40"></div>
            </div>
          )
        })}
      </div>

      {/* 네비게이션 버튼들 */}
      <div className="absolute inset-y-0 left-4 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevSlide}
          className="text-white hover:bg-white/10 rounded-full h-12 w-12 backdrop-blur-sm"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
      </div>
      <div className="absolute inset-y-0 right-4 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={nextSlide}
          className="text-white hover:bg-white/10 rounded-full h-12 w-12 backdrop-blur-sm"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      {/* 스테이폴리오 스타일 히어로 컨텐츠 */}
      <div className="absolute inset-0 flex flex-col">
        {/* 스테이폴리오 정확한 헤더 레이아웃 */}
        <div className="flex items-center justify-between pt-4 md:pt-6 pb-8 md:pb-12 px-4 md:px-8">
          {/* 좌측: 로고만 */}
          <div className="flex items-center">
            {/* 로고 - 크기 증가 */}
            <div className="hero-logo text-white text-lg md:text-2xl font-light tracking-wide transition-all duration-500">
              stay<span className="font-medium">oneday</span>
            </div>
          </div>
          
          {/* 우측 메뉴 - 스테이폴리오 정확한 간격과 위치 */}
          <div className="hero-buttons flex items-center">
            {/* 데스크탑 텍스트 메뉴 */}
            <div className="hidden md:flex items-center gap-8 text-white text-sm font-medium mr-8">
              <Link href="/spaces" className="hover:text-white/80 transition-colors">FIND STAY</Link>
              <Link href="/promotion" className="hover:text-white/80 transition-colors">PROMOTION</Link>
              <Link href="/journal" className="hover:text-white/80 transition-colors">JOURNAL</Link>
              <Link href="/preorder" className="hover:text-white/80 transition-colors">PRE-ORDER</Link>
            </div>
            
            {/* 우측 아이콘들 - 정확한 간격 */}
            <div className="flex items-center gap-1 md:gap-2">
              <button className="p-1.5 md:p-2 text-white hover:bg-white/10 rounded-full transition-colors">
                <Heart className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button className="p-1.5 md:p-2 text-white hover:bg-white/10 rounded-full transition-colors">
                <Users className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* 스테이폴리오 검색창 - 정확한 크기와 위치 */}
        <div className="hero-search-bar flex justify-center pb-4 md:pb-8 px-4 transition-all duration-500">
          <div 
            className="bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer w-full max-w-sm md:max-w-md"
            onClick={() => {
              // 검색 모달 열기 로직 
              const event = new CustomEvent('openSearchModal')
              window.dispatchEvent(event)
            }}
          >
            <div className="flex items-center pl-5 pr-4 py-3">
              <Search className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
              <div className="flex-1 text-left">
                <div className="text-sm text-gray-500 font-medium">
                  <span className="md:hidden">검색</span>
                  <span className="hidden md:inline">어디든 검색하세요</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 스테이폴리오 스타일 - 텍스트를 하단으로 */}
        <div className="flex-1 flex items-end">
          {items.length > 0 && items[currentSlide] && (
            <div className="text-left pb-16 max-w-lg">
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight drop-shadow-2xl leading-tight">
                {items[currentSlide]?.title || items[currentSlide]?.headline || '감성에서 머무는'}
              </h1>
              <h2 className="text-lg md:text-xl font-light text-white/90 mb-2 tracking-wide drop-shadow-lg">
                {items[currentSlide]?.subtitle || items[currentSlide]?.subheadline || '아주 특별한 감성이 흘러'}
              </h2>
              <p className="text-sm md:text-base text-white/80 font-light tracking-wide drop-shadow-md">
                특별한 공간에서의 완벽한 하루를 만나보세요
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 슬라이드 인디케이터 */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-white scale-125' 
                : 'bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </section>
  )
}