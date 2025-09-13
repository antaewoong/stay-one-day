'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
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

function clamp(n: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, n));
}

export default function HeroSection({ slides }: HeroSectionProps) {
  // null-safe 처리
  const items = useMemo<HeroSlide[]>(() => (Array.isArray(slides) ? slides : []), [slides])
  
  const [currentSlide, setCurrentSlide] = useState(0)
  const [searchLocation, setSearchLocation] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [guestCount, setGuestCount] = useState(2)
  
  // 스테이폴리오 스크롤 애니메이션
  const heroRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0); // 0 = 히어로 상태, 1 = 헤더 도킹

  // 초기화는 useEffect에서 처리
  useEffect(() => {
    if (items.length > 0) {
      setCurrentSlide(0)
    }
  }, [items.length])

  // 스테이폴리오 스크롤 애니메이션 로직
  useEffect(() => {
    const onScroll = () => {
      const hero = heroRef.current, sticky = stickyRef.current;
      if (!hero || !sticky) return;

      const h = hero.getBoundingClientRect();
      const s = sticky.getBoundingClientRect();
      
      // 진행도 정의: 검색창 상단이 뷰포트 top에 가까워질수록 1
      const startY = h.top + h.height * 0.40; // 히어로 40% 지점부터 축소 시작
      const endY = 8; // 헤더 safe-top 여백
      const raw = (startY - s.top) / Math.max(1, startY - endY);
      setP(clamp(raw));
    };
    
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

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
    <div className="relative">
      {/* 헤더 (투명 시작 → 도킹 후 배경) */}
      <header className="sticky top-0 z-[60] safe-pt">
        <div className={`h-14 transition-colors duration-200 ${p > 0.85 ? "bg-white/80 backdrop-blur border-b border-gray-100/50" : "bg-transparent"}`} />
      </header>

      {/* 히어로 섹션 */}
      <section ref={heroRef} className="relative overflow-hidden bg-gray-900 min-h-[72svh]">
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

      {/* 스테이폴리오 정확한 히어로 컨텐츠 */}
      <div className="absolute inset-0 flex flex-col">
        <div className="relative mx-auto max-w-5xl px-4 pt-20 pb-16">
          {/* 로고: 스크롤하며 페이드아웃 */}
          <div
            className="text-white text-lg md:text-2xl font-light tracking-wide mb-8 will-change-opacity"
            style={{ opacity: 1 - p, transition: "opacity 150ms ease-out" }}
          >
            stay<span className="font-medium">oneday</span>
          </div>
          
          {/* 우측 메뉴: 스크롤하며 페이드아웃 */}
          <div 
            className="absolute top-6 right-4 md:right-8 flex items-center will-change-opacity"
            style={{ opacity: 1 - p, transition: "opacity 150ms ease-out" }}
          >
            {/* 데스크탑 텍스트 메뉴 */}
            <div className="hidden md:flex items-center gap-8 text-white text-sm font-medium mr-8">
              <Link href="/spaces" className="hover:text-white/80 transition-colors">FIND STAY</Link>
              <Link href="/promotion" className="hover:text-white/80 transition-colors">PROMOTION</Link>
              <Link href="/journal" className="hover:text-white/80 transition-colors">JOURNAL</Link>
              <Link href="/preorder" className="hover:text-white/80 transition-colors">PRE-ORDER</Link>
            </div>
            
            {/* 우측 아이콘들 */}
            <div className="flex items-center gap-1 md:gap-2">
              <button className="p-1.5 md:p-2 text-white hover:bg-white/10 rounded-full transition-colors">
                <Heart className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button className="p-1.5 md:p-2 text-white hover:bg-white/10 rounded-full transition-colors">
                <Users className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
          
          {/* 검색창: 하나의 DOM이 sticky로 위로 '올라감' */}
          <div ref={stickyRef} className="sticky z-[55] top-[calc(var(--sat,0px)+8px)]">
            <div
              className="will-change-transform transition-[border-radius,box-shadow] duration-150 mx-auto"
              style={{
                transform: `scale(${1 - 0.18 * p})`,
                borderRadius: `calc(22px - 10px * ${p})`,
                boxShadow: p > 0.95 ? "0 8px 24px rgba(0,0,0,0.12)" : "0 2px 12px rgba(0,0,0,0.08)",
                maxWidth: p > 0.6 ? '480px' : '600px',
                transition: 'max-width 150ms ease-out'
              }}
            >
              <SearchBar compact={p > 0.6} />
            </div>
          </div>
        </div>
        {/* 히어로 텍스트 - 하단에 배치 */}
        <div className="absolute bottom-0 left-0 right-0">
          {items.length > 0 && items[currentSlide] && (
            <div 
              className="text-left pb-16 max-w-lg px-4 md:px-8 will-change-opacity"
              style={{ 
                opacity: 1 - p * 1.5, 
                transition: "opacity 150ms ease-out",
                transform: `translateY(${p * 20}px)`
              }}
            >
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
      </section>

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
    </div>
  )
}

// 스테이폴리오 스타일 SearchBar 컴포넌트
function SearchBar({ compact }: { compact: boolean }) {
  const handleOpenModal = () => {
    const event = new CustomEvent('openSearchModal');
    window.dispatchEvent(event);
  };

  return (
    <div
      className={`w-full bg-white/95 backdrop-blur-sm px-5 ${
        compact ? "py-2 h-12" : "py-3 h-14"
      } rounded-full flex items-center gap-3 cursor-pointer hover:bg-white/98 transition-all duration-150 shadow-lg`}
      style={{ transition: "height 150ms ease-out, padding 150ms ease-out" }}
      onClick={handleOpenModal}
    >
      <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <div className="flex-1 text-left">
        <div className={`text-gray-500 font-medium ${compact ? 'text-sm' : 'text-sm md:text-base'}`}>
          <span className="md:hidden">검색</span>
          <span className="hidden md:inline">어디든 검색하세요</span>
        </div>
      </div>
    </div>
  );
}