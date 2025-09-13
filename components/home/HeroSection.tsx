'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface HeroSlide {
  id: string
  title: string
  subtitle: string
  description: string
  image: string
  cta: string
  badge: string
  stats: {
    avgRating?: string
    bookings?: string
    price?: string
  }
  order: number
  active: boolean
}

interface HeroSectionProps {
  slides: HeroSlide[]
}

export default function HeroSection({ slides }: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  // 자동 슬라이드 전환
  useEffect(() => {
    if (slides.length === 0) return
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [slides.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  if (slides.length === 0) {
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
        {slides.map((slide, index) => (
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

      {/* 중앙 텍스트 - 실제 슬라이드 데이터 */}
      <Link 
        href={`/spaces/${slides[currentSlide]?.id || ''}`}
        className="absolute inset-0 flex items-center justify-center cursor-pointer group"
      >
        <div className="text-center text-white px-4 mt-16 max-w-4xl transition-all duration-500 ease-out">
          {slides.length > 0 && (
            <>
              {/* 배지 */}
              {slides[currentSlide]?.badge && (
                <div className="mb-4">
                  <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm px-4 py-1 rounded-full border border-white/30">
                    {slides[currentSlide].badge}
                  </span>
                </div>
              )}

              {/* 메인 제목 */}
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight mb-4 group-hover:scale-105 transition-transform duration-300">
                <span className="block text-white/95">{slides[currentSlide]?.title}</span>
              </h1>

              {/* 서브 텍스트 */}
              <p className="text-lg md:text-xl lg:text-2xl text-white/90 font-light tracking-wide leading-relaxed mb-8">
                {slides[currentSlide]?.subtitle}
              </p>

              {/* CTA 버튼 */}
              <div className="mt-8 flex justify-center">
                <Button 
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/30 px-8 py-3 text-lg font-light rounded-full transition-all duration-300 hover:scale-105"
                  onClick={(e) => {
                    e.preventDefault()
                    window.location.href = `/spaces/${slides[currentSlide]?.id || ''}`
                  }}
                >
                  {slides[currentSlide]?.cta || '지금 예약하기'}
                </Button>
              </div>

              {/* 숙소 정보 (price, rating 등) */}
              {slides[currentSlide]?.stats && (
                <div className="mt-6 flex justify-center items-center gap-6 text-white/80 text-sm">
                  {slides[currentSlide].stats.price && (
                    <span>{slides[currentSlide].stats.price}</span>
                  )}
                  {slides[currentSlide].stats.avgRating && (
                    <span>★ {slides[currentSlide].stats.avgRating}</span>
                  )}
                  {slides[currentSlide].stats.bookings && (
                    <span>{slides[currentSlide].stats.bookings}</span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Link>

      {/* 슬라이드 인디케이터 */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
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