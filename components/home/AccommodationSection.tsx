'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, Heart, ArrowRight } from 'lucide-react'

interface Accommodation {
  id: string
  name: string
  location: string
  price: number
  rating: number
  image: string
  capacity: number
  badges?: string[]
  amenities?: string[]
}

interface AccommodationSectionProps {
  title: string
  subtitle: string
  accommodations: Accommodation[]
  loading: boolean
  backgroundColor?: string
  badgeText: string
  sectionId: string
  onCardClick?: (e: React.MouseEvent, id: string) => void
}

export default function AccommodationSection({
  title,
  subtitle,
  accommodations,
  loading,
  backgroundColor = 'bg-white',
  badgeText,
  sectionId,
  onCardClick
}: AccommodationSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState({
    isDown: false,
    startX: 0,
    scrollLeft: 0
  })

  // 스테이폴리오 스타일 터치/드래그 이벤트 핸들러들
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    
    // 이미지 드래그 방지 및 텍스트 선택 방지
    e.preventDefault()
    
    setDragState({
      isDown: true,
      startX: e.pageX - scrollRef.current.offsetLeft,
      scrollLeft: scrollRef.current.scrollLeft
    })
    
    // 커서를 grabbing으로 변경
    scrollRef.current.style.cursor = 'grabbing'
    scrollRef.current.style.userSelect = 'none'
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDown || !scrollRef.current) return
    e.preventDefault()
    
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - dragState.startX) * 1.5 // 부드러운 스크롤을 위해 배율 조정
    scrollRef.current.scrollLeft = dragState.scrollLeft - walk
  }

  const handleMouseUp = () => {
    if (!scrollRef.current) return
    
    setDragState({ ...dragState, isDown: false })
    scrollRef.current.style.cursor = 'grab'
    scrollRef.current.style.userSelect = 'auto'
  }

  const handleMouseLeave = () => {
    if (!scrollRef.current) return
    
    setDragState({ ...dragState, isDown: false })
    scrollRef.current.style.cursor = 'grab'
    scrollRef.current.style.userSelect = 'auto'
  }

  // 터치 이벤트 핸들러들 (모바일 지원)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollRef.current) return
    
    const touch = e.touches[0]
    setDragState({
      isDown: true,
      startX: touch.pageX - scrollRef.current.offsetLeft,
      scrollLeft: scrollRef.current.scrollLeft
    })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragState.isDown || !scrollRef.current) return
    
    const touch = e.touches[0]
    const x = touch.pageX - scrollRef.current.offsetLeft
    const walk = (x - dragState.startX) * 1.5
    scrollRef.current.scrollLeft = dragState.scrollLeft - walk
  }

  const handleTouchEnd = () => {
    setDragState({ ...dragState, isDown: false })
  }

  return (
    <section className={`py-12 ${backgroundColor}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <p className="text-gray-600">{subtitle}</p>
          </div>
          <Link href="/spaces" className="text-gray-500 hover:text-gray-900 flex items-center">
            더보기
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div 
          ref={scrollRef}
          className="overflow-x-auto overflow-y-hidden -mx-4 select-none"
          style={{
            cursor: dragState.isDown ? 'grabbing' : 'grab',
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'auto'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDragStart={(e) => e.preventDefault()}
        >
          <div className="flex space-x-4 pb-4 pl-4" style={{ width: 'max-content', paddingRight: '40vw' }}>
            {loading ? (
              // 로딩 스켈레톤
              Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="flex-shrink-0 animate-pulse border-0 shadow-none bg-white" style={{ width: '320px', minWidth: '320px' }}>
                  <div className="aspect-square bg-gray-200 rounded-2xl"></div>
                  <CardContent className="pt-3 px-0 pb-0">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                    <div className="flex justify-between">
                      <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : accommodations.length > 0 ? (
              accommodations.map((stay) => (
                <Link 
                  key={stay.id} 
                  href={`/spaces/${stay.id}`} 
                  className="group block flex-shrink-0"
                  onClick={(e) => onCardClick?.(e, stay.id)}
                >
                  <Card className="overflow-hidden border-0 shadow-none hover:shadow-xl transition-all duration-300 bg-white hover:z-50 relative" 
                        style={{ width: '320px', minWidth: '320px' }}>
                    <div className="relative aspect-square overflow-hidden rounded-2xl">
                      <img 
                        src={stay.image} 
                        alt={stay.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 pointer-events-none select-none" 
                        style={{
                          filter: 'contrast(1.1) brightness(1.02) saturate(1.08)'
                        }}
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                      />
                      <Badge className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-gray-900 border-0 shadow-sm text-xs px-3 py-1 rounded-full">{badgeText}</Badge>
                      <Button variant="secondary" size="sm" className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm hover:bg-white text-gray-700 rounded-full w-9 h-9 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.preventDefault()}>
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardContent className="pt-3 px-0 pb-0">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 text-base">{stay.name}</h3>
                      <div className="flex items-center text-gray-500 text-sm mb-3">
                        <span>{stay.location}</span>
                        <span className="mx-2">·</span>
                        <span>최대 {stay.capacity}명</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-base font-bold text-gray-900">₩{stay.price.toLocaleString()}</span>
                          <span className="text-xs text-gray-500 ml-1">/1day</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{stay.rating}</span>
                        </div>
                      </div>

                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="flex-shrink-0 w-full text-center py-12">
                <p className="text-gray-500">등록된 숙소가 없습니다</p>
                <p className="text-sm text-gray-400 mt-2">관리자 페이지에서 숙소를 추가해보세요</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}