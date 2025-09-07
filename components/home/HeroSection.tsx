'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface EmotionalText {
  main: string
  sub: string
  accent: string
}

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

const emotionalTexts: EmotionalText[] = [
  {
    main: "시간이 멈춰진 듯한",
    sub: "완벽한 순간을 위한 특별한 공간",
    accent: "Perfect Moments"
  },
  {
    main: "자연이 선사하는",
    sub: "마음을 울리는 감동의 스테이",
    accent: "Nature's Gift"
  },
  {
    main: "소중한 사람들과",
    sub: "만들어가는 아름다운 추억",
    accent: "Precious Time"
  },
  {
    main: "일상의 경계를 넘어",
    sub: "새로운 나를 발견하는 여행",
    accent: "Beyond Ordinary"
  },
  {
    main: "감성이 흘러넘치는",
    sub: "당신만을 위한 프라이빗 세상",
    accent: "Your Own World"
  },
  {
    main: "여행의 끝에서 만나는",
    sub: "진짜 휴식의 의미",
    accent: "True Rest"
  },
  {
    main: "마음속 깊이 새겨질",
    sub: "잊을 수 없는 특별한 하루",
    accent: "Unforgettable"
  },
  {
    main: "도심 속에서 찾은",
    sub: "나만의 작은 천국",
    accent: "Urban Paradise"
  },
  {
    main: "별빛이 내리는 밤",
    sub: "꿈같은 순간이 시작되는 곳",
    accent: "Starlit Dreams"
  },
  {
    main: "바람에 실려오는",
    sub: "자유로움이 가득한 공간",
    accent: "Freedom Breeze"
  },
  {
    main: "햇살이 머무는",
    sub: "따뜻한 마음이 깃든 숙소",
    accent: "Sunshine Stay"
  },
  {
    main: "추억을 수놓는",
    sub: "특별함이 살아있는 하루",
    accent: "Memory Weaver"
  },
  {
    main: "고요함 속에서 찾는",
    sub: "진정한 나만의 시간",
    accent: "Silent Sanctuary"
  },
  {
    main: "감동이 머무는",
    sub: "마음을 전하는 따뜻한 공간",
    accent: "Heartfelt Haven"
  },
  {
    main: "설렘이 시작되는",
    sub: "새로운 이야기의 첫 페이지",
    accent: "New Chapter"
  },
  {
    main: "영감이 피어나는",
    sub: "창의로움이 가득한 안식처",
    accent: "Creative Refuge"
  },
  {
    main: "온기가 전해지는",
    sub: "사랑이 머무는 아늑한 보금자리",
    accent: "Warm Embrace"
  },
  {
    main: "꿈이 현실이 되는",
    sub: "마법같은 순간들의 연속",
    accent: "Dreams Come True"
  }
]

export default function HeroSection({ slides }: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [currentEmotionalText, setCurrentEmotionalText] = useState(0)
  const [textOpacity, setTextOpacity] = useState(1)

  // 자동 슬라이드 전환
  useEffect(() => {
    if (slides.length === 0) return
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [slides.length])

  // 감성 문구 자동 전환
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEmotionalText((prev) => (prev + 1) % emotionalTexts.length)
    }, 3500)

    return () => clearInterval(interval)
  }, [])

  // 부드러운 페이드 전환 효과
  useEffect(() => {
    const fadeOut = setTimeout(() => {
      setTextOpacity(0.7)
    }, 3000)
    
    const fadeIn = setTimeout(() => {
      setTextOpacity(1)
    }, 3200)

    return () => {
      clearTimeout(fadeOut)
      clearTimeout(fadeIn)
    }
  }, [currentEmotionalText])

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

      {/* 중앙 텍스트 - 스테이폴리오 스타일 감성 문구 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="text-center text-white px-4 mt-16 max-w-4xl transition-all duration-500 ease-out"
          style={{ 
            opacity: textOpacity,
            transform: `scale(${textOpacity === 1 ? 1 : 0.98})`
          }}
        >
          {/* 영문 액센트 */}
          <div className="relative h-8 overflow-hidden mb-4">
            <div 
              className="transition-all duration-1200 ease-in-out"
              style={{
                transform: `translateY(-${currentEmotionalText * 32}px)`,
                opacity: textOpacity
              }}
            >
              {emotionalTexts.map((text, index) => (
                <div key={`accent-${index}`} className="h-8 flex items-center justify-center">
                  <span className="text-sm md:text-base font-light tracking-[0.3em] text-white/70 uppercase">
                    {text.accent}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 메인 제목 */}
          <div className="relative h-20 md:h-24 overflow-hidden mb-3">
            <div 
              className="transition-all duration-1200 ease-in-out"
              style={{
                transform: `translateY(-${currentEmotionalText * 100}%)`,
              }}
            >
              {emotionalTexts.map((text, index) => (
                <div key={`main-${index}`} className="h-20 md:h-24 flex items-center justify-center">
                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight">
                    <span className="block text-white/95">{text.main}</span>
                  </h1>
                </div>
              ))}
            </div>
          </div>

          {/* 서브 텍스트 */}
          <div className="relative h-12 md:h-16 overflow-hidden">
            <div 
              className="transition-all duration-1200 ease-in-out"
              style={{
                transform: `translateY(-${currentEmotionalText * 100}%)`,
              }}
            >
              {emotionalTexts.map((text, index) => (
                <div key={`sub-${index}`} className="h-12 md:h-16 flex items-center justify-center">
                  <p className="text-lg md:text-xl lg:text-2xl text-white/90 font-light tracking-wide leading-relaxed">
                    {text.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 장식적인 라인 */}
          <div className="mt-8 flex justify-center">
            <div className="w-16 md:w-24 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
          </div>
        </div>
      </div>

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