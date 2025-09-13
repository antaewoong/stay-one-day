'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Heart, 
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import OptimizedImage from '@/components/optimized-image'
import { motion } from 'framer-motion'
import { StarRating } from '@/components/ui/star-rating'
import { memo } from 'react'

interface BadgeData {
  badge_id: string
  badge_name: string
  badge_label: string
  color_scheme: string
  background_color: string
  text_color: string
  border_color?: string
  icon?: string
  priority: number
  expires_at?: string
  badge_active: boolean
}

interface StayCardProps {
  stay: {
    id: string
    name: string
    location: string
    price: number
    image: string
    capacity: number
    rating: number
    ratingCount?: number
    amenities?: string[]
    isHot?: boolean
    isNew?: boolean
    discount?: number
    badges?: BadgeData[] // 새로운 뱃지 시스템
  }
  index?: number
  handleCardClick: (e: React.MouseEvent, id: string) => void
  loading?: boolean
  useNextImage?: boolean
  variant?: 'default' | 'featured'
}

const StayCard = memo(function StayCard({ stay, index = 0, handleCardClick, loading = false, useNextImage = true, variant = 'default' }: StayCardProps) {
  if (loading) {
    return (
      <Card className="flex-shrink-0 animate-pulse border-0 shadow-none bg-white" style={{ width: '320px', minWidth: '320px' }}>
        <div className="aspect-square bg-gray-200 rounded-2xl"></div>
        <CardContent className="pt-3 px-4 pb-3">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="flex justify-between">
            <div className="h-5 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.15, 
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ scale: 1.02 }}
      className="flex-shrink-0"
    >
      <Link 
        href={`/spaces/${stay.id}`} 
        className="group block"
        onClick={(e) => handleCardClick(e, stay.id)}
      >
        <Card className="overflow-hidden border-0 bg-white hover:z-50 relative transition-all duration-500 ease-out shadow-sm hover:shadow-2xl hover:shadow-gray-200/60 hover:-translate-y-2 hover:scale-[1.02] backdrop-blur-sm" 
              style={{ 
                width: '320px', 
                minWidth: '320px',
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                borderRadius: '16px'
              }}>
          <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: '1/1' }}>
            {useNextImage ? (
              <OptimizedImage 
                src={stay.image} 
                alt={stay.name} 
                fill
                priority={index === 0}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover group-hover:scale-110 transition-all duration-700 ease-out" 
                style={{
                  filter: 'contrast(1.1) brightness(1.02) saturate(1.08)',
                  transform: 'translate3d(0, 0, 0)',
                  backfaceVisibility: 'hidden'
                }}
              />
            ) : (
              <img 
                src={stay.image} 
                alt={stay.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 pointer-events-none select-none"
                draggable={false}
                onDragStart={(e) => e.preventDefault()} 
                style={{
                  filter: 'contrast(1.1) brightness(1.02) saturate(1.08)'
                }}
              />
            )}
            
            {/* 프리미엄 오버레이 그라데이션 (featured variant만) */}
            {variant === 'featured' && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            )}
            
            {/* 뱃지들 - 스테이폴리오 스타일 (새로운 시스템) */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2 max-w-[calc(100%-2rem)]">
              {/* 새로운 뱃지 시스템 사용 */}
              {stay.badges && stay.badges.length > 0 ? (
                stay.badges
                  .filter(badge => badge.badge_active)
                  .sort((a, b) => b.priority - a.priority) // 우선순위 높은 순
                  .slice(0, 3) // 최대 3개까지만 표시
                  .map((badge) => {
                    // 동적 할인율 처리
                    const displayText = badge.badge_name === 'DISCOUNT_PERCENT' && stay.discount 
                      ? `-${stay.discount}%` 
                      : badge.badge_label

                    return (
                      <Badge 
                        key={badge.badge_id}
                        className={`${badge.background_color} ${badge.text_color} backdrop-blur-sm border-0 shadow-sm font-medium text-xs px-3 py-1 rounded-full transition-all duration-300 hover:scale-105 ${
                          badge.border_color ? `border ${badge.border_color}` : ''
                        }`}
                      >
                        {displayText}
                      </Badge>
                    )
                  })
              ) : (
                /* 기본 뱃지들 (하위 호환성) */
                <>
                  {variant === 'featured' && (
                    <Badge className="bg-red-500/90 backdrop-blur-sm text-white border-0 shadow-sm font-medium text-xs px-3 py-1 rounded-full">
                      PICK
                    </Badge>
                  )}
                  {stay.discount && (
                    <Badge className="bg-white/95 backdrop-blur-sm text-gray-900 border-0 shadow-sm font-semibold text-xs px-3 py-1 rounded-full">
                      -{stay.discount}%
                    </Badge>
                  )}
                  {stay.isHot && (
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-sm text-xs px-3 py-1 rounded-full">
                      HOT
                    </Badge>
                  )}
                  {stay.isNew && (
                    <Badge className="bg-blue-500/90 backdrop-blur-sm text-white border-0 shadow-sm text-xs px-3 py-1 rounded-full">
                      NEW
                    </Badge>
                  )}
                </>
              )}
            </div>
            

            {/* 하단 빠른 정보 (호버시 나타남) */}
            <div className={`absolute bottom-0 left-0 right-0 ${variant === 'featured' ? 'p-3' : 'p-4'} transform translate-y-full group-hover:translate-y-0 transition-transform duration-500`}>
              <div className={`bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-xl ${variant === 'featured' ? 'mx-2 mb-2' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span className={`text-sm font-medium ${variant === 'featured' ? 'text-gray-800' : ''}`}>최대 {stay.capacity}명</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <StarRating rating={stay.rating} readonly size="sm" showNumber />
                    {stay.ratingCount && stay.ratingCount > 0 && (
                      <span className="text-xs text-gray-500">({stay.ratingCount})</span>
                    )}
                  </div>
                </div>
                {stay.amenities && stay.amenities.length > 0 && (
                  <div className={variant === 'featured' ? "flex items-center gap-2 flex-wrap" : "grid grid-cols-2 gap-2 text-xs text-gray-600"}>
                    {variant === 'featured' ? (
                      stay.amenities.filter((amenity: string) => 
                        amenity && !['주차', '무료주차', 'Wi-Fi', 'WiFi', '인터넷'].includes(amenity)
                      ).slice(0, 4).map((amenity: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 flex-shrink-0" />
                          <span className="text-xs text-gray-700 truncate max-w-[70px]">{amenity}</span>
                        </div>
                      ))
                    ) : (
                      stay.amenities.slice(0, 4).map((amenity: string) => (
                        <div key={amenity} className="flex items-center">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></div>
                          {amenity}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <CardContent className="pt-3 px-4 pb-3">
            {variant === 'featured' ? (
              <>
                {/* 제목 - 스테이폴리오 스타일 */}
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 text-lg sm:text-base leading-tight">
                  {stay.name}
                </h3>
                
                {/* 위치와 기본 정보 */}
                <div className="flex items-center text-gray-500 text-base sm:text-sm mb-3 font-medium">
                  <span>{stay.location}</span>
                  <span className="mx-2">·</span>
                  <span>최대 {stay.capacity}명</span>
                </div>
                
              </>
            ) : (
              <>
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 text-lg sm:text-base">{stay.name}</h3>
                <div className="flex items-center text-gray-500 text-sm mb-3">
                  <span>{stay.location}</span>
                  <span className="mx-2">·</span>
                  <span>최대 {stay.capacity}명</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
})

export default StayCard