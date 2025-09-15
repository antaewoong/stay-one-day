'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Heart,
  Search,
  ArrowRight,
  ChevronDown,
  X
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { StarRating } from '@/components/ui/star-rating'
import StayCard from '@/components/StayCard'
import SectionContainer from '@/components/SectionContainer'

interface HomeClientProps {
  heroSlides: any[]
  initialData: {
    featuredStays: any[]
    poolvillaStays: any[]
    privateStays: any[]
    kidsStays: any[]
    partyStays: any[]
    newStays: any[]
  }
}

export default function HomeClient({ heroSlides, initialData }: HomeClientProps) {
  // 클라이언트 상태들
  const [featuredStays, setFeaturedStays] = useState(initialData.featuredStays)
  const [poolvillaStays, setPoolvillaStays] = useState(initialData.poolvillaStays)
  const [privateStays, setPrivateStays] = useState(initialData.privateStays)
  const [kidsStays, setKidsStays] = useState(initialData.kidsStays)
  const [partyStays, setPartyStays] = useState(initialData.partyStays)
  const [newStays, setNewStays] = useState(initialData.newStays)

  const [showBusinessInfo, setShowBusinessInfo] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [searchLocation, setSearchLocation] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [guestCount, setGuestCount] = useState(2)
  const [user, setUser] = useState<any>(null)
  const [isUserLoading, setIsUserLoading] = useState(true)
  const [loading, setLoading] = useState(false)

  // 드래그 상태들
  const [dragState, setDragState] = useState({
    isDown: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    currentContainer: null as HTMLDivElement | null,
    isDragging: false,
    startTime: 0,
    lastX: 0,
    velocityX: 0,
    lastTime: 0,
    isTouching: false,
    touchDirection: null as 'horizontal' | 'vertical' | null
  })

  // 스크롤 refs
  const recommendedScrollRef = useRef<HTMLDivElement>(null)
  const poolvillaScrollRef = useRef<HTMLDivElement>(null)
  const privateScrollRef = useRef<HTMLDivElement>(null)
  const kidsScrollRef = useRef<HTMLDivElement>(null)
  const partyScrollRef = useRef<HTMLDivElement>(null)
  const newScrollRef = useRef<HTMLDivElement>(null)

  const suggestions = ['풀빌라', '청주', '세종', '대전', '천안', '애견풀빌라']

  // Supabase 클라이언트
  const supabase = createClient()

  // 사용자 인증 확인
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

  // 드래그 핸들러들 (기존 코드와 동일)
  const animateScrollWithMomentum = useCallback((container: HTMLDivElement, velocity: number) => {
    const friction = 0.95
    const minVelocity = 0.5

    if (Math.abs(velocity) > minVelocity) {
      container.scrollLeft -= velocity

      requestAnimationFrame(() => {
        animateScrollWithMomentum(container, velocity * friction)
      })
    }
  }, [])

  const handleMouseDown = (containerRef: React.RefObject<HTMLDivElement>, e: React.MouseEvent) => {
    if (!containerRef.current) return

    const container = containerRef.current
    const currentTime = Date.now()
    const x = e.pageX - container.offsetLeft

    setDragState({
      isDown: true,
      startX: x,
      startY: 0,
      scrollLeft: container.scrollLeft,
      currentContainer: container,
      isDragging: false,
      startTime: currentTime,
      lastX: x,
      velocityX: 0,
      lastTime: currentTime,
      isTouching: false,
      touchDirection: null
    })
    container.style.cursor = 'grabbing'
    container.style.userSelect = 'none'
    container.style.scrollBehavior = 'auto'
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDown || !dragState.currentContainer) return

    const currentTime = Date.now()
    const x = e.pageX - dragState.currentContainer.offsetLeft
    const distance = Math.abs(x - dragState.startX)

    if (distance > 3) {
      setDragState(prev => ({ ...prev, isDragging: true }))
      e.preventDefault()

      const walk = (x - dragState.startX) * 1.2
      dragState.currentContainer.scrollLeft = dragState.scrollLeft - walk

      const timeDelta = currentTime - dragState.lastTime
      if (timeDelta > 0) {
        const velocityX = (x - dragState.lastX) / timeDelta * 16
        setDragState(prev => ({
          ...prev,
          velocityX,
          lastX: x,
          lastTime: currentTime
        }))
      }
    }
  }

  const handleMouseUp = () => {
    if (dragState.currentContainer) {
      dragState.currentContainer.style.cursor = 'grab'
      dragState.currentContainer.style.userSelect = 'auto'
      dragState.currentContainer.style.scrollBehavior = 'smooth'

      if (Math.abs(dragState.velocityX) > 2) {
        animateScrollWithMomentum(dragState.currentContainer, dragState.velocityX * 3)
      }
    }

    setTimeout(() => {
      setDragState(prev => ({
        ...prev,
        isDown: false,
        currentContainer: null,
        isDragging: false,
        velocityX: 0
      }))
    }, 100)
  }

  const handleMouseLeave = () => {
    if (dragState.currentContainer) {
      dragState.currentContainer.style.cursor = 'grab'
      dragState.currentContainer.style.userSelect = 'auto'
    }
    setDragState(prev => ({
      ...prev,
      isDown: false,
      currentContainer: null,
      isDragging: false
    }))
  }

  const handleTouchStart = (containerRef: React.RefObject<HTMLDivElement>, e: React.TouchEvent) => {
    const container = containerRef.current
    if (!container) return

    const currentTime = Date.now()
    const touch = e.touches[0]
    const x = touch.clientX - container.offsetLeft
    const y = touch.clientY

    setDragState({
      isDown: true,
      startX: x,
      startY: y,
      scrollLeft: container.scrollLeft,
      currentContainer: container,
      isDragging: false,
      startTime: currentTime,
      lastX: x,
      velocityX: 0,
      lastTime: currentTime,
      isTouching: true,
      touchDirection: null
    })

    container.style.scrollBehavior = 'auto'
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragState.isDown || !dragState.currentContainer || !dragState.isTouching) return

    const currentTime = Date.now()
    const touch = e.touches[0]
    const x = touch.clientX - dragState.currentContainer.offsetLeft
    const y = touch.clientY
    const distanceX = Math.abs(x - dragState.startX)
    const distanceY = Math.abs(y - dragState.startY)

    if (!dragState.touchDirection && (distanceX > 5 || distanceY > 5)) {
      if (distanceX > 15 && distanceX > distanceY * 2.5) {
        setDragState(prev => ({ ...prev, touchDirection: 'horizontal' }))
      } else {
        setDragState(prev => ({ ...prev, touchDirection: 'vertical' }))
        return
      }
    }

    if (dragState.touchDirection === 'horizontal' && distanceX > 15) {
      setDragState(prev => ({ ...prev, isDragging: true }))
      e.preventDefault()
      e.stopPropagation()

      const walk = (x - dragState.startX) * 1.0
      dragState.currentContainer.scrollLeft = dragState.scrollLeft - walk

      const timeDelta = currentTime - dragState.lastTime
      if (timeDelta > 0) {
        const velocityX = (x - dragState.lastX) / timeDelta * 16
        setDragState(prev => ({
          ...prev,
          velocityX,
          lastX: x,
          lastTime: currentTime
        }))
      }
    }
  }

  const handleTouchEnd = () => {
    if (dragState.currentContainer) {
      dragState.currentContainer.style.scrollBehavior = 'smooth'

      if (Math.abs(dragState.velocityX) > 1.5) {
        animateScrollWithMomentum(dragState.currentContainer, dragState.velocityX * 4)
      }
    }

    setTimeout(() => {
      setDragState(prev => ({
        ...prev,
        isDown: false,
        currentContainer: null,
        isDragging: false,
        isTouching: false,
        touchDirection: null
      }))
    }, 100)
  }

  const handleCardClick = (e: React.MouseEvent, stayId: string) => {
    if (dragState.isDragging) {
      e.preventDefault()
      return
    }

    const clickDuration = Date.now() - dragState.startTime
    if (clickDuration > 200) {
      e.preventDefault()
      return
    }
  }

  return (
    <>
      {/* 글로벌 스타일 */}
      <style jsx global>{`
        .scroll-container {
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
          cursor: grab;
          user-select: none;
          scroll-snap-type: x proximity;
          touch-action: pan-x pan-y;
        }
        .scroll-container::-webkit-scrollbar {
          display: none;
        }
        .scroll-container:active {
          cursor: grabbing;
        }
        .scroll-container img,
        .scroll-container svg {
          pointer-events: none;
          user-select: none;
          -webkit-user-drag: none;
          -khtml-user-drag: none;
          -moz-user-drag: none;
          -o-user-drag: none;
        }
        .scroll-container > * {
          scroll-snap-align: start;
        }
        @media (hover: hover) and (pointer: fine) {
          .scroll-container {
            transition: scroll-left 0.1s ease-out;
          }
        }
        body {
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-y: contain;
        }
        .fullscreen-container {
          min-height: 100vh;
          min-height: calc(100vh + env(safe-area-inset-top) + env(safe-area-inset-bottom));
        }
        @supports (-webkit-touch-callout: none) {
          .scroll-container {
            -webkit-overflow-scrolling: touch;
            transform: translateZ(0);
          }
          .hero-section {
            padding-top: env(safe-area-inset-top);
          }
        }
      `}</style>

      {/* 추천 스테이 섹션 */}
      <SectionContainer
        title=""
        subtitle=""
        mainTitle="완벽한 하루를 위한"
        secondTitle="추천 스테이"
        detailDescription="엄선된 특별한 공간들"
        bgColor="bg-white"
        stays={featuredStays}
        loading={loading}
        scrollRef={recommendedScrollRef}
        dragState={dragState}
        handleMouseDown={handleMouseDown}
        handleMouseMove={handleMouseMove}
        handleMouseUp={handleMouseUp}
        handleMouseLeave={handleMouseLeave}
        handleTouchStart={handleTouchStart}
        handleTouchMove={handleTouchMove}
        handleTouchEnd={handleTouchEnd}
        handleCardClick={handleCardClick}
        useNextImage={true}
        variant="featured"
      />

      {/* 나머지 섹션들... (기존 코드와 동일) */}

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
            {/* 모달 내용 */}
          </div>
        </div>
      )}
    </>
  )
}