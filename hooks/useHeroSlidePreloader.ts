'use client'

import { useState, useEffect, useCallback } from 'react'
import { heroSlideCache, cachedFetch } from '@/utils/clientCache'

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

// 캐시 TTL 설정
const CACHE_TTL = 5 * 60 * 1000 // 5분

export function useHeroSlidePreloader() {
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set())

  // 이미지 프리로드 함수
  const preloadImages = useCallback(async (slides: HeroSlide[]) => {
    const imageUrls = slides
      .map(slide => slide.image_url || slide.image)
      .filter(Boolean) as string[]

    const preloadPromises = imageUrls.map(url => {
      return new Promise<string>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(url)
        img.onerror = () => reject(url)
        img.src = url
      })
    })

    try {
      const loadedUrls = await Promise.allSettled(preloadPromises)
      const successfulUrls = loadedUrls
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<string>).value)

      setPreloadedImages(new Set(successfulUrls))
    } catch (error) {
      console.error('이미지 프리로드 실패:', error)
    }
  }, [])

  // 히어로 슬라이드 로드 함수 (캐싱 포함)
  const loadHeroSlides = useCallback(async () => {
    try {
      // 캐시에서 먼저 확인
      const cachedSlides = heroSlideCache.get()
      if (cachedSlides) {
        setHeroSlides(cachedSlides)
        setIsLoading(false)
        // 캐시된 데이터로 즉시 이미지 프리로드 시작
        preloadImages(cachedSlides)
        return cachedSlides
      }

      // 캐시된 fetch 사용
      const slides = await cachedFetch<HeroSlide[]>(
        '/api/hero-slides',
        'hero_slides_preload',
        CACHE_TTL
      )

      if (slides && Array.isArray(slides) && slides.length > 0) {
        // 히어로 슬라이드 캐시에도 저장
        heroSlideCache.set(slides)
        setHeroSlides(slides)

        // 백그라운드에서 이미지 프리로드
        preloadImages(slides)
      }

      setIsLoading(false)
      return slides || []

    } catch (error) {
      console.error('히어로 슬라이드 로드 실패:', error)
      setIsLoading(false)
      return []
    }
  }, [preloadImages])

  // 컴포넌트 마운트 시 즉시 로드
  useEffect(() => {
    loadHeroSlides()
  }, [loadHeroSlides])

  // 페이지 포커스 시 캐시 확인
  useEffect(() => {
    const handleFocus = () => {
      if (!heroSlideCache.has()) {
        loadHeroSlides()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadHeroSlides])

  return {
    heroSlides,
    isLoading,
    preloadedImages,
    refreshSlides: loadHeroSlides,
    isCached: heroSlideCache.has()
  }
}