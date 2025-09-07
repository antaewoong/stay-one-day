'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, MapPin, Users, Clock, Star, Shield } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Header from '@/components/header'

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0)

  // 히어로 슬라이드 데이터 (구공스테이 청주 실제 대표 이미지만 사용)
  const heroSlides = [
    {
      id: 1,
      title: "구공스테이 청주",
      subtitle: "프라이빗 풀빌라의 완벽함",
      description: "최대 20명이 함께하는 8시간 풀타임 공간대여",
      image: "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://cdn.imweb.me/thumbnail/20250718/771be60274a16.jpg')",
      cta: "지금 예약하기",
      badge: "인기 1위"
    },
    {
      id: 2, 
      title: "구공스테이 청주",
      subtitle: "넓은 정원과 풀사이드 파티",
      description: "바베큐와 수영을 동시에 즐길 수 있는 프리미엄 공간",
      image: "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://cdn.imweb.me/thumbnail/20250718/1e8101b6c07a0.jpg')",
      cta: "상세보기",
      badge: "풀빌라"
    },
    {
      id: 3,
      title: "구공스테이 청주",
      subtitle: "맵티브 풀사이드 공간",
      description: "우아한 인테리어와 편안한 휴식 공간이 완벽 조화",
      image: "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://cdn.imweb.me/thumbnail/20250720/01ef0d2862ad4.jpg')",
      cta: "공간 둘러보기",
      badge: "프리미엄"
    }
  ]

  // 자동 슬라이드 전환
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000) // 5초마다 전환

    return () => clearInterval(interval)
  }, [heroSlides.length])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 히어로 슬라이더 - 스테이폴리오 스타일 */}
      <section className="relative h-[60vh] sm:h-[70vh] md:h-screen overflow-hidden">
        {/* 헤더 오버레이 */}
        <div className="absolute top-0 left-0 right-0 z-50">
          <Header />
        </div>
        {/* 슬라이더 컨테이너 */}
        <div className="relative h-full">
          {heroSlides.map((slide, index) => (
            <Link
              key={slide.id}
              href={slide.id === 3 ? "/spaces" : `/spaces/${slide.id}`}
              className={`absolute inset-0 transition-opacity duration-1000 block cursor-pointer ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                background: slide.image || 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), #1a1a1a',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {/* 모바일 최적화 콘텐츠 오버레이 */}
              <div className="absolute inset-0 flex items-end md:items-center justify-center">
                <div className="container mx-auto px-6 md:px-4 text-center text-white pb-28 md:pb-0">
                  <div className="max-w-4xl mx-auto">
                    {/* 배지 */}
                    {slide.badge && (
                      <div className="mb-4 md:mb-6">
                        <span className="bg-white/15 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-semibold border border-white/40 shadow-lg">
                          {slide.badge}
                        </span>
                      </div>
                    )}
                    
                    {/* 타이틀 - 모바일 최적화 */}
                    <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-3 md:mb-4 leading-tight tracking-tight">
                      {slide.title}
                    </h1>
                    
                    {/* 서브타이틀 - 모바일 최적화 */}
                    <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/95 mb-4 md:mb-6 font-light leading-snug">
                      {slide.subtitle}
                    </p>
                    
                    {/* 설명 - 모바일 최적화 */}
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 mb-6 md:mb-8 max-w-sm sm:max-w-lg md:max-w-2xl mx-auto leading-relaxed">
                      {slide.description}
                    </p>
                    
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 슬라이드 인디케이터 - 모바일 최적화 */}
        <div className="absolute bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-1.5 md:space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentSlide 
                  ? 'w-8 h-2 md:w-6 md:h-6 bg-white shadow-lg scale-100' 
                  : 'w-2 h-2 md:w-3 md:h-3 bg-white/60 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
        
        {/* 모바일용 스와이프 힌트 */}
        <div className="md:hidden absolute top-6 right-6 z-10 bg-black/30 backdrop-blur-sm text-white px-3 py-2 rounded-full text-xs font-medium">
          좌우로 밀어보세요 →
        </div>

        {/* 스크롤 다운 화살표 */}
        <div className="absolute bottom-8 right-8 animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* 큐레이티드 컬렉션 섹션 */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              오직 Stay One Day에서만
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Stay One Day 큐레이터가 직접 발굴한 특별한 컬렉션
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* 배달음식 편리 컬렉션 */}
            <Card className="overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="relative h-80 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 overflow-hidden">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute top-4 left-4">
                  <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium border border-white/30">
                    편의성 추천
                  </span>
                </div>
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">배달음식 이용이 편리한 스테이</h3>
                  <p className="text-white/90 mb-4">도시 근처 위치로 모든 배달음식을 이용 가능</p>
                  <div className="flex items-center space-x-2">
                    <span className="bg-orange-500 text-white px-2 py-1 rounded text-sm font-medium">
                      24시간 배달 가능
                    </span>
                    <span className="text-white/80 text-sm">+ 다양한 선택지</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* 물놀이 풀빌라 컬렉션 */}
            <Card className="overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="relative h-80 bg-gradient-to-br from-cyan-400 via-teal-500 to-blue-400 overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-4 left-4">
                  <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium border border-white/30">
                    물놀이 특화
                  </span>
                </div>
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">물놀이 가능한 풀빌라</h3>
                  <p className="text-white/90 mb-4">프라이빗 수영장에서 즐기는 특별한 하루</p>
                  <div className="flex items-center space-x-2">
                    <span className="bg-cyan-500 text-white px-2 py-1 rounded text-sm font-medium">
                      전용 풀 제공
                    </span>
                    <span className="text-white/80 text-sm">+ 물놀이 용품 무료</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* 반려견 동반 가능 */}
            <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300">
              <div className="relative h-48 bg-gradient-to-br from-orange-400 to-red-500 overflow-hidden">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute top-3 left-3">
                  <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                    반려견 동반
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h4 className="font-bold mb-1">반려견과 함께하는 특별한 시간</h4>
                  <p className="text-white/90 text-sm mb-2">넓은 정원에서 자유롭게 뛰어놀 수 있는 공간</p>
                  <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded text-xs">
                    펫프렌들리 시설
                  </span>
                </div>
              </div>
            </Card>

            {/* 프라이빗 독채형 */}
            <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300">
              <div className="relative h-48 bg-gradient-to-br from-purple-500 to-indigo-600 overflow-hidden">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute top-3 left-3">
                  <span className="bg-purple-500 text-white px-2 py-1 rounded text-xs font-medium">
                    독채형
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h4 className="font-bold mb-1">프라이빗 독채형 스테이</h4>
                  <p className="text-white/90 text-sm mb-2">온전히 우리만의 공간</p>
                  <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded text-xs">
                    완전한 프라이버시
                  </span>
                </div>
              </div>
            </Card>

            {/* 자연 힐링 */}
            <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300">
              <div className="relative h-48 bg-gradient-to-br from-green-500 to-teal-600 overflow-hidden">
                <div className="absolute inset-0 bg-black/30"></div>
                <div className="absolute top-3 left-3">
                  <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                    자연 힐링
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h4 className="font-bold mb-1">자연에서의 완벽한 휴식</h4>
                  <p className="text-white/90 text-sm mb-2">도시를 벗어난 진정한 힐링</p>
                  <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded text-xs">
                    자연 속 재충전
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Link href="/spaces">
              <Button size="lg" variant="outline" className="px-8">
                모든 컬렉션 보기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 특징 섹션 */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            왜 Stay One Day인가요?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
                <CardTitle>8시간 풀타임</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  오후 3시~11시, 8시간 꽉 찬 하루를 제공.
                  여유롭게 완전한 하루를 만끽하세요.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                <CardTitle>더 많은 인원</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  숙박 인원 제한에 구애받지 마세요.
                  파티나 모임에 적합한 넓은 공간을 제공합니다.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <Star className="w-12 h-12 text-primary mx-auto mb-4" />
                <CardTitle>프리미엄 시설</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  검증된 고품격 풀빌라와 독채만을 엄선.
                  특별한 날을 위한 완벽한 공간을 만나보세요.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 타겟 고객층 */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            이런 분들께 추천해요
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏠</span>
              </div>
              <h4 className="font-semibold mb-2">숙박이 부담스러운 분</h4>
              <p className="text-sm text-gray-600">집 밖에서 자는 것이 불편한 분들을 위한 당일 이용</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎉</span>
              </div>
              <h4 className="font-semibold mb-2">특별한 파티 계획 중</h4>
              <p className="text-sm text-gray-600">생일파티, 기념일 등 특별한 공간이 필요한 분들</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👨‍👩‍👧‍👦</span>
              </div>
              <h4 className="font-semibold mb-2">대가족 모임</h4>
              <p className="text-sm text-gray-600">인원 제한 때문에 이용하기 어려웠던 대가족</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🧸</span>
              </div>
              <h4 className="font-semibold mb-2">키즈 파티</h4>
              <p className="text-sm text-gray-600">키즈카페를 벗어나 특별한 공간에서의 아이들 파티</p>
            </div>
          </div>
        </div>
      </section>


      {/* 푸터 */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">S</span>
                </div>
                <span className="font-bold">Stay One Day</span>
              </div>
              <p className="text-gray-400 text-sm">
                당일치기 프리미엄 공간대여 플랫폼
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">서비스</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">공간 찾기</a></li>
                <li><a href="#" className="hover:text-white">예약하기</a></li>
                <li><a href="#" className="hover:text-white">이용안내</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">정보</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">서비스 소개</a></li>
                <li><a href="#" className="hover:text-white">이용 안내</a></li>
                <li><a href="#" className="hover:text-white">요금 안내</a></li>
                <li><Link href="/contact" className="hover:text-white">입점 문의</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">고객지원</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">FAQ</a></li>
                <li><a href="#" className="hover:text-white">1:1 문의</a></li>
                <li><a href="#" className="hover:text-white">이용약관</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            © 2024 Stay One Day. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}