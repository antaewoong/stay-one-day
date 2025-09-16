'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Search, Heart, Users } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

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
  const items = useMemo<HeroSlide[]>(() => (Array.isArray(slides) ? slides : []), [slides])
  
  const [currentSlide, setCurrentSlide] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const heroRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (items.length > 0) {
      setCurrentSlide(0)
    }
  }, [items.length])

  useEffect(() => {
    const handleScroll = () => {
      const hero = heroRef.current
      const search = searchRef.current
      if (!hero || !search) return

      const heroHeight = hero.offsetHeight
      // body의 scrollTop 사용 (실제 스크롤 컨테이너)
      const scrollY = document.body.scrollTop || document.documentElement.scrollTop

      // 스크롤 시작부터 애니메이션 시작
      const progress = Math.min(scrollY / heroHeight, 1)

      setScrollProgress(progress)
    }

    handleScroll() // 초기 실행

    // body에 스크롤 이벤트 리스너 추가
    document.body.addEventListener('scroll', handleScroll, { passive: true })
    document.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)

    return () => {
      document.body.removeEventListener('scroll', handleScroll)
      document.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

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
    return null
  }

  return (
    <div className="relative">
      {/* 완전 풀스크린 히어로 섹션 - 노치까지 확장 + 브레이크포인트별 높이 */}
      <section
        ref={heroRef}
        className="relative bg-gray-900 min-h-[65vh] sm:min-h-[75vh] md:min-h-[85vh]"
      >
        <div className="absolute inset-0">
          {items.map((slide, index) => {
            const imageUrl = slide.image_url || slide.image || ''
            if (!imageUrl) return null
            
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                  index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-100'
                }`}
              >
                {/* 즉시 페인트: inline_data_uri가 있으면 즉시 표시 */}
                {slide.inline_data_uri && index === 0 ? (
                  <img
                    src={slide.inline_data_uri}
                    alt={slide.title || slide.headline || '히어로 이미지'}
                    className="absolute inset-0 w-full h-full object-cover object-center sm:object-top"
                    style={{
                      filter: 'contrast(1.15) brightness(1.05) saturate(1.1)',
                      objectPosition: 'center center'
                    }}
                    fetchPriority="high"
                    decoding="sync"
                  />
                ) : (
                  <Image
                    src={imageUrl}
                    alt={slide.title || slide.headline || '히어로 이미지'}
                    fill
                    className="object-cover object-center sm:object-top"
                    style={{
                      filter: 'contrast(1.15) brightness(1.05) saturate(1.1)',
                      objectPosition: 'center center'
                    }}
                    priority={index === 0}
                    quality={90}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 100vw"
                  />
                )}
                
                {/* 그라디언트 오버레이 */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/35 via-transparent to-black/15"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40"></div>
              </div>
            )
          })}
        </div>

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

        <div className="absolute inset-0 flex flex-col">
          {/* 상단 좌측 로고 */}
          <div className="absolute top-4 left-4 z-[200]">
            <div className="text-white text-2xl md:text-4xl font-light tracking-wide drop-shadow-lg">
              stay<span className="font-medium">oneday</span>
            </div>
          </div>

          {/* 상단 우측 버튼들 */}
          <div className="absolute top-4 right-4 z-[200] flex items-center">
            <div className="hidden md:flex items-center gap-8 text-white text-sm font-medium mr-8">
              <Link href="/spaces" className="hover:text-white/80 transition-colors">FIND STAY</Link>
              <Link href="/promotion" className="hover:text-white/80 transition-colors">PROMOTION</Link>
              <Link href="/journal" className="hover:text-white/80 transition-colors">JOURNAL</Link>
              <Link href="/preorder" className="hover:text-white/80 transition-colors">PRE-ORDER</Link>
            </div>
            
            <div className="flex items-center gap-1 md:gap-2">
              <button className="p-1.5 md:p-2 text-white hover:bg-white/20 rounded-full transition-all duration-300 bg-black/10 backdrop-blur-sm border border-white/20 hover:border-white/40 shadow-lg">
                <Heart className="w-4 h-4 md:w-5 md:h-5 drop-shadow-sm" />
              </button>
              <button className="p-1.5 md:p-2 text-white hover:bg-white/20 rounded-full transition-all duration-300 bg-black/10 backdrop-blur-sm border border-white/20 hover:border-white/40 shadow-lg">
                <Users className="w-4 h-4 md:w-5 md:h-5 drop-shadow-sm" />
              </button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm px-4 pt-20 pb-16">
            <div
              ref={searchRef}
              className="z-40"
              style={{
                position: scrollProgress > 0.08 ? 'fixed' : 'relative',
                top: scrollProgress > 0.08 ? '0px' : 'auto',
                left: scrollProgress > 0.08 ? '0px' : 'auto',
                right: scrollProgress > 0.08 ? '0px' : 'auto',
                transform: scrollProgress > 0.08
                  ? 'none'
                  : `translateY(${-scrollProgress * 120}px)`,
                width: scrollProgress > 0.08
                  ? scrollProgress < 0.2
                    ? `${Math.min(384 + (scrollProgress - 0.08) * 1200, window.innerWidth)}px`
                    : '100vw'
                  : 'auto',
                padding: scrollProgress > 0.08 ? '8px 16px' : '0',
                zIndex: scrollProgress > 0.08 ? 100 : 40,
                transition: 'none'
              }}
            >
              <div
                className={`${scrollProgress > 0.095
                  ? 'max-w-4xl mx-auto bg-white/95 backdrop-blur-sm py-2.5 px-5 h-11 rounded-full'  // 헤더에서는 더 넓게
                  : 'w-full bg-white/95 backdrop-blur-sm py-2.5 px-5 h-11 rounded-full'             // 처음 크기
                } flex items-center gap-3 cursor-pointer hover:bg-white/98 transition-all duration-150 shadow-lg border-0 relative`}
                onClick={() => {
                  const event = new CustomEvent('openSearchModal');
                  window.dispatchEvent(event);
                }}
              >
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <div className="text-gray-500 font-normal text-base">
                    온전한 쉼, 완벽한 하루
                  </div>
                </div>

                {/* 헤더에 붙었을 때 우측 버튼들을 점진적으로 표시 */}
                {scrollProgress > 0.12 && (
                  <div
                    className="flex items-center gap-1 absolute right-3"
                    style={{
                      opacity: Math.min(1, (scrollProgress - 0.12) * 4),
                      transform: `translateX(${Math.max(0, (0.2 - scrollProgress) * 200)}px)`
                    }}
                  >
                    <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-300">
                      <Heart className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-300">
                      <Users className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0">
            {items.length > 0 && items[currentSlide] && (
              <div className="text-left pb-16 max-w-lg px-4 md:px-8">
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight drop-shadow-2xl leading-tight">
                  {items[currentSlide]?.title || items[currentSlide]?.headline || '감성에서 머무는'}
                </h1>
                <h2 className="text-lg md:text-xl font-light text-white/90 mb-2 tracking-wide drop-shadow-lg">
                  {items[currentSlide]?.subtitle || items[currentSlide]?.subheadline || '아주 특별한 감성이 흘러'}
                </h2>

                {items[currentSlide]?.description && (
                  <p className="text-sm md:text-base text-white/80 font-light tracking-wide drop-shadow-md">
                    {items[currentSlide].description}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

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

