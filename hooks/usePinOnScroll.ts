'use client'
import { useEffect, useRef, useState } from 'react'

export function usePinOnScroll(headerHeight = 64) {
  const [pinned, setPinned] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!sentinelRef.current) return
    
    const io = new IntersectionObserver(
      ([entry]) => {
        setPinned(!entry.isIntersecting)
      },
      { 
        rootMargin: `-${headerHeight}px 0px 0px 0px`, 
        threshold: 0 
      }
    )
    
    io.observe(sentinelRef.current)
    return () => io.disconnect()
  }, [headerHeight])

  return { pinned, sentinelRef }
}