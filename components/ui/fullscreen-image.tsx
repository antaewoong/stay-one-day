'use client'

import Image from 'next/image'
import { useState } from 'react'

interface FullscreenImageProps {
  src: string
  alt: string
  className?: string
  priority?: boolean
}

export function FullscreenImage({ src, alt, className = '', priority = false }: FullscreenImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div className={`fullscreen-image relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className={`object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        sizes="100vw"
        onLoad={() => setIsLoaded(true)}
      />
      
      {/* 로딩 상태 */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {/* 그라디언트 오버레이 (텍스트 가독성을 위해) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
    </div>
  )
}

interface HeroImageProps {
  src: string
  alt: string
  children?: React.ReactNode
}

export function HeroImage({ src, alt, children }: HeroImageProps) {
  return (
    <div className="relative">
      <FullscreenImage 
        src={src}
        alt={alt}
        className="h-screen"
        priority
      />
      
      {/* 컨텐츠는 safe area 내부에 위치 */}
      <div className="absolute inset-0 safe-area-content flex flex-col justify-end">
        {children}
      </div>
    </div>
  )
}