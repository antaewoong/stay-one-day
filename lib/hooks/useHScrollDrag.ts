/**
 * 가로 스크롤 드래그 & 터치 스와이프 훅
 * 모멘텀 스크롤링, 터치 방향 감지, 클릭/드래그 구분 기능 포함
 */

import { useState, useCallback, useRef } from 'react'

interface DragState {
  isDown: boolean
  startX: number
  startY: number
  scrollLeft: number
  currentContainer: HTMLDivElement | null
  isDragging: boolean
  startTime: number
  lastX: number
  velocityX: number
  lastTime: number
  isTouching: boolean
  touchDirection: 'horizontal' | 'vertical' | null
}

interface UseHScrollDragReturn {
  // 상태
  dragState: DragState

  // 이벤트 핸들러들
  handleMouseDown: (containerRef: React.RefObject<HTMLDivElement>, e: React.MouseEvent) => void
  handleMouseMove: (e: React.MouseEvent) => void
  handleMouseUp: () => void
  handleMouseLeave: () => void
  handleTouchStart: (containerRef: React.RefObject<HTMLDivElement>, e: React.TouchEvent) => void
  handleTouchMove: (e: React.TouchEvent) => void
  handleTouchEnd: () => void

  // 유틸리티
  handleCardClick: (e: React.MouseEvent, callback?: () => void) => void
  getScrollContainerStyles: () => React.CSSProperties
}

export function useHScrollDrag(): UseHScrollDragReturn {
  const [dragState, setDragState] = useState<DragState>({
    isDown: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    currentContainer: null,
    isDragging: false,
    startTime: 0,
    lastX: 0,
    velocityX: 0,
    lastTime: 0,
    isTouching: false,
    touchDirection: null
  })

  // 모멘텀 스크롤 애니메이션 함수
  const animateScrollWithMomentum = useCallback((container: HTMLDivElement, velocity: number) => {
    const friction = 0.95 // 마찰 계수
    const minVelocity = 0.5 // 최소 속도

    if (Math.abs(velocity) > minVelocity) {
      container.scrollLeft -= velocity

      requestAnimationFrame(() => {
        animateScrollWithMomentum(container, velocity * friction)
      })
    }
  }, [])

  // 마우스 드래그 핸들러들
  const handleMouseDown = useCallback((containerRef: React.RefObject<HTMLDivElement>, e: React.MouseEvent) => {
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
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.isDown || !dragState.currentContainer) return

    const currentTime = Date.now()
    const x = e.pageX - dragState.currentContainer.offsetLeft
    const distance = Math.abs(x - dragState.startX)

    // 3px 이상 움직이면 드래그로 간주
    if (distance > 3) {
      setDragState(prev => ({ ...prev, isDragging: true }))
      e.preventDefault()

      // 부드러운 드래그 (민감도 1.2)
      const walk = (x - dragState.startX) * 1.2
      dragState.currentContainer.scrollLeft = dragState.scrollLeft - walk

      // 속도 계산 (모멘텀을 위해)
      const timeDelta = currentTime - dragState.lastTime
      if (timeDelta > 0) {
        const velocityX = (x - dragState.lastX) / timeDelta * 16 // 60fps 기준으로 정규화
        setDragState(prev => ({
          ...prev,
          velocityX,
          lastX: x,
          lastTime: currentTime
        }))
      }
    }
  }, [dragState])

  const handleMouseUp = useCallback(() => {
    if (dragState.currentContainer) {
      dragState.currentContainer.style.cursor = 'grab'
      dragState.currentContainer.style.userSelect = 'auto'
      dragState.currentContainer.style.scrollBehavior = 'smooth'

      // 모멘텀 스크롤 적용
      if (Math.abs(dragState.velocityX) > 2) {
        animateScrollWithMomentum(dragState.currentContainer, dragState.velocityX * 3)
      }
    }

    // 드래그 상태 리셋
    setTimeout(() => {
      setDragState(prev => ({
        ...prev,
        isDown: false,
        currentContainer: null,
        isDragging: false,
        velocityX: 0
      }))
    }, 100)
  }, [dragState, animateScrollWithMomentum])

  const handleMouseLeave = useCallback(() => {
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
  }, [dragState])

  // 터치 이벤트 핸들러들
  const handleTouchStart = useCallback((containerRef: React.RefObject<HTMLDivElement>, e: React.TouchEvent) => {
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
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragState.isDown || !dragState.currentContainer || !dragState.isTouching) return

    const currentTime = Date.now()
    const touch = e.touches[0]
    const x = touch.clientX - dragState.currentContainer.offsetLeft
    const y = touch.clientY
    const distanceX = Math.abs(x - dragState.startX)
    const distanceY = Math.abs(y - dragState.startY)

    // 터치 방향 결정 - 세로 스크롤 최우선
    if (!dragState.touchDirection && (distanceX > 5 || distanceY > 5)) {
      if (distanceX > 15 && distanceX > distanceY * 2.5) {
        // 명확한 가로 의도
        setDragState(prev => ({ ...prev, touchDirection: 'horizontal' }))
      } else {
        // 나머지는 세로 스크롤
        setDragState(prev => ({ ...prev, touchDirection: 'vertical' }))
        return
      }
    }

    // 가로 방향으로 확실히 결정된 경우에만 가로 스크롤 처리
    if (dragState.touchDirection === 'horizontal' && distanceX > 15) {
      setDragState(prev => ({ ...prev, isDragging: true }))
      e.preventDefault()
      e.stopPropagation()

      // 부드러운 터치 드래그
      const walk = (x - dragState.startX) * 1.0
      dragState.currentContainer.scrollLeft = dragState.scrollLeft - walk

      // 속도 계산
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
  }, [dragState])

  const handleTouchEnd = useCallback(() => {
    if (dragState.currentContainer) {
      dragState.currentContainer.style.scrollBehavior = 'smooth'

      // 모멘텀 스크롤 적용
      if (Math.abs(dragState.velocityX) > 1.5) {
        animateScrollWithMomentum(dragState.currentContainer, dragState.velocityX * 4)
      }
    }

    // 터치 상태 리셋
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
  }, [dragState, animateScrollWithMomentum])

  // 카드 클릭 핸들러 (드래그와 구분)
  const handleCardClick = useCallback((e: React.MouseEvent, callback?: () => void) => {
    // 드래그 중이면 클릭 방지
    if (dragState.isDragging) {
      e.preventDefault()
      return
    }

    // 긴 클릭은 드래그로 간주
    const clickDuration = Date.now() - dragState.startTime
    if (clickDuration > 200) {
      e.preventDefault()
      return
    }

    // 짧은 클릭이면 콜백 실행
    if (callback) {
      callback()
    }
  }, [dragState])

  // 스크롤 컨테이너 스타일
  const getScrollContainerStyles = useCallback((): React.CSSProperties => ({
    cursor: dragState.isDown ? 'grabbing' : 'grab',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    WebkitOverflowScrolling: 'touch',
    scrollBehavior: 'auto'
  }), [dragState.isDown])

  return {
    dragState,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleCardClick,
    getScrollContainerStyles
  }
}