'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: number
  sizes?: string
  fill?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 75,
  sizes,
  fill = false,
  placeholder = 'empty',
  blurDataURL
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Supabase 이미지 URL 변환 함수
  const getOptimizedSupabaseUrl = (originalUrl: string) => {
    if (!originalUrl.includes('supabase.co/storage/v1/object/public/')) {
      return originalUrl
    }
    
    // Supabase Transform API를 사용하여 이미지 최적화
    try {
      const url = new URL(originalUrl)
      const pathParts = url.pathname.split('/')
      const bucketName = pathParts[4] // accommodation-images
      const fileName = pathParts.slice(5).join('/') // 파일명
      
      // Transform API URL 구성
      const baseUrl = `${url.protocol}//${url.hostname}`
      const transformUrl = `${baseUrl}/storage/v1/object/public/${bucketName}/${fileName}`
      
      // 크기 파라미터 추가 (optional)
      if (width && height) {
        return `${transformUrl}?width=${width}&height=${height}&resize=cover&quality=${quality}`
      }
      
      return transformUrl
    } catch (error) {
      console.warn('URL 변환 실패:', error)
      return originalUrl
    }
  }

  const optimizedSrc = getOptimizedSupabaseUrl(src)

  // 기본 블러 데이터 URL (10x10 투명 이미지)
  const defaultBlurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAKAAoDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAhEQACAQIHAQAAAAAAAAAAAAABAgADBAUREiExUWGRkv/aAAwDAQACEQMRAD8A0XGrC7t7OwhEUUEUUUUUIhEUEUUUUUUP/9k='

  const handleLoadComplete = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
  }

  // 오류 발생 시 대체 이미지
  if (hasError) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-gray-200 text-gray-400",
          className
        )}
        style={{ width, height }}
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
      </div>
    )
  }

  // Supabase 이미지인 경우 Next.js Image를 완전히 우회하고 직접 img 태그 사용
  if (src.includes('supabase.co/storage/v1/object/public/')) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          fill ? 'absolute inset-0 w-full h-full object-cover' : '',
          className
        )}
        style={fill ? { objectFit: 'cover' } : { width, height }}
        loading={priority ? 'eager' : 'lazy'}
      />
    )
  }

  // 다른 이미지들은 Next.js Image 컴포넌트 사용
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* 로딩 스케leton */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ width, height }}
        />
      )}
      
      <Image
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        priority={priority}
        quality={quality}
        sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
        placeholder={placeholder}
        blurDataURL={blurDataURL || defaultBlurDataURL}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        onLoad={handleLoadComplete}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
      />
    </div>
  )
}

// 이미지 최적화를 위한 유틸리티 함수들
export const imageUtils = {
  // Unsplash 이미지 최적화 파라미터 추가
  optimizeUnsplashUrl: (url: string, width: number, height: number, quality: number = 80) => {
    if (url.includes('unsplash.com')) {
      return `${url}&w=${width}&h=${height}&q=${quality}&fm=webp&fit=crop`
    }
    return url
  },

  // 이미지 크기별 sizes 속성 생성
  generateSizes: (breakpoints: { [key: string]: string }) => {
    return Object.entries(breakpoints)
      .map(([breakpoint, size]) => `(max-width: ${breakpoint}) ${size}`)
      .join(', ')
  },

  // 이미지 프리로드 함수
  preloadImage: (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.onload = () => resolve()
      img.onerror = reject
      img.src = src
    })
  },

  // 여러 이미지 프리로드
  preloadImages: async (urls: string[]) => {
    try {
      await Promise.all(urls.map(url => imageUtils.preloadImage(url)))
      console.log('📷 이미지 프리로드 완료:', urls.length, '개')
    } catch (error) {
      console.error('📷 이미지 프리로드 실패:', error)
    }
  }
}