'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  Heart,
  ArrowRight,
  Wifi,
  Car,
  Utensils,
  Waves,
  Baby,
  Snowflake,
  Tv,
  Coffee,
  Bath,
  Trees,
  ParkingCircle,
  ChefHat,
  Gamepad2,
  Dumbbell,
  Wind,
  Mountain,
  Sparkles,
  Home
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

// 편의시설 아이콘 매핑 함수 (Stay-OneDay 톤앤매너 적용)
const getAmenityIcon = (amenity: string) => {
  const amenityLower = amenity.toLowerCase()

  // Wi-Fi 관련 - 민트 톤
  if (amenityLower.includes('wifi') || amenityLower.includes('인터넷') || amenityLower.includes('무선')) {
    return { icon: Wifi, color: 'text-[#00D4B3]', bgColor: 'bg-[#00D4B3]/10' }
  }

  // 주차 관련 - 네이비 톤
  if (amenityLower.includes('주차') || amenityLower.includes('parking')) {
    return { icon: Car, color: 'text-[#0B1A34]', bgColor: 'bg-[#0B1A34]/10' }
  }

  // 수영장 관련 - 민트 톤
  if (amenityLower.includes('수영장') || amenityLower.includes('풀') || amenityLower.includes('pool') || amenityLower.includes('워터')) {
    return { icon: Waves, color: 'text-[#00D4B3]', bgColor: 'bg-[#00D4B3]/10' }
  }

  // 바베큐 관련 - 골드 톤
  if (amenityLower.includes('바베큐') || amenityLower.includes('bbq') || amenityLower.includes('그릴')) {
    return { icon: ChefHat, color: 'text-[#C7A756]', bgColor: 'bg-[#C7A756]/10' }
  }

  // 키즈 관련 - 골드 톤
  if (amenityLower.includes('키즈') || amenityLower.includes('아이') || amenityLower.includes('어린이') || amenityLower.includes('유아')) {
    return { icon: Baby, color: 'text-[#C7A756]', bgColor: 'bg-[#C7A756]/10' }
  }

  // 에어컨 관련 - 민트 톤
  if (amenityLower.includes('에어컨') || amenityLower.includes('냉방') || amenityLower.includes('에어컨디셔너')) {
    return { icon: Snowflake, color: 'text-[#00D4B3]', bgColor: 'bg-[#00D4B3]/10' }
  }

  // TV 관련 - 네이비 톤
  if (amenityLower.includes('tv') || amenityLower.includes('텔레비전') || amenityLower.includes('티비')) {
    return { icon: Tv, color: 'text-[#16305E]', bgColor: 'bg-[#16305E]/10' }
  }

  // 커피 관련 - 골드 톤
  if (amenityLower.includes('커피') || amenityLower.includes('카페') || amenityLower.includes('coffee')) {
    return { icon: Coffee, color: 'text-[#C7A756]', bgColor: 'bg-[#C7A756]/10' }
  }

  // 욕조/스파 관련 - 민트 톤
  if (amenityLower.includes('욕조') || amenityLower.includes('스파') || amenityLower.includes('자쿠지') || amenityLower.includes('온수')) {
    return { icon: Bath, color: 'text-[#00D4B3]', bgColor: 'bg-[#00D4B3]/10' }
  }

  // 정원/자연 관련 - 네이비 톤
  if (amenityLower.includes('정원') || amenityLower.includes('자연') || amenityLower.includes('숲') || amenityLower.includes('산')) {
    return { icon: Trees, color: 'text-[#0B1A34]', bgColor: 'bg-[#0B1A34]/10' }
  }

  // 게임 관련 - 네이비 톤
  if (amenityLower.includes('게임') || amenityLower.includes('오락') || amenityLower.includes('플스') || amenityLower.includes('xbox')) {
    return { icon: Gamepad2, color: 'text-[#16305E]', bgColor: 'bg-[#16305E]/10' }
  }

  // 피트니스 관련 - 골드 톤
  if (amenityLower.includes('헬스') || amenityLower.includes('운동') || amenityLower.includes('피트니스') || amenityLower.includes('gym')) {
    return { icon: Dumbbell, color: 'text-[#C7A756]', bgColor: 'bg-[#C7A756]/10' }
  }

  // 펜션/독채 관련 - 네이비 톤
  if (amenityLower.includes('독채') || amenityLower.includes('펜션') || amenityLower.includes('프라이빗')) {
    return { icon: Home, color: 'text-[#0B1A34]', bgColor: 'bg-[#0B1A34]/10' }
  }

  // 전망/뷰 관련 - 그레이 톤
  if (amenityLower.includes('전망') || amenityLower.includes('뷰') || amenityLower.includes('view') || amenityLower.includes('오션')) {
    return { icon: Mountain, color: 'text-[#666666]', bgColor: 'bg-[#666666]/10' }
  }

  // 기본 아이콘 - 그레이 톤
  return { icon: Sparkles, color: 'text-[#666666]', bgColor: 'bg-[#666666]/10' }
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
                    <span className={`text-sm font-medium ${variant === 'featured' ? 'text-gray-800' : ''}`}>2명~{stay.capacity}명</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <StarRating rating={stay.rating} readonly size="sm" showNumber />
                    {stay.ratingCount && stay.ratingCount > 0 && (
                      <span className="text-xs text-gray-500">({stay.ratingCount})</span>
                    )}
                  </div>
                </div>
                {stay.amenities && stay.amenities.length > 0 && (
                  <div className={variant === 'featured' ? "flex items-center gap-2 flex-wrap" : "grid grid-cols-2 gap-1.5 text-xs"}>
                    {variant === 'featured' ? (
                      stay.amenities.filter((amenity: string) =>
                        amenity && amenity.trim().length > 0
                      ).slice(0, 4).map((amenity: string, idx: number) => {
                        const { icon: IconComponent, color, bgColor } = getAmenityIcon(amenity)
                        return (
                          <div key={idx} className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${bgColor} transition-all hover:scale-105`}>
                            <IconComponent className={`w-3 h-3 ${color} flex-shrink-0`} />
                            <span className="text-xs text-gray-700 truncate max-w-[60px]">{amenity}</span>
                          </div>
                        )
                      })
                    ) : (
                      stay.amenities.slice(0, 4).map((amenity: string, idx: number) => {
                        const { icon: IconComponent, color, bgColor } = getAmenityIcon(amenity)
                        return (
                          <div key={idx} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${bgColor} transition-all hover:scale-105`}>
                            <IconComponent className={`w-3.5 h-3.5 ${color} flex-shrink-0`} />
                            <span className="text-xs text-gray-700 truncate">{amenity}</span>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <CardContent className="pt-3 px-4 pb-3">
            {variant === 'featured' ? (
              <>
                {/* 제목 - 스테이폴리오 스타일 (볼드 제거) */}
                <h3 className="font-normal text-gray-900 mb-1 line-clamp-1 text-lg sm:text-base leading-tight">
                  {stay.name}
                </h3>

                {/* 위치와 기본 정보 */}
                <div className="flex items-center text-gray-500 text-base sm:text-sm mb-2 font-normal">
                  <span>{stay.location}</span>
                  <span className="mx-2">·</span>
                  <span>기준 2명 ~ 최대 {stay.capacity}명</span>
                </div>

                {/* 주요 편의시설 미리보기 */}
                {stay.amenities && stay.amenities.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    {stay.amenities.slice(0, 3).map((amenity: string, idx: number) => {
                      const { icon: IconComponent, color } = getAmenityIcon(amenity)
                      return (
                        <div key={idx} className="flex items-center gap-1">
                          <IconComponent className={`w-3 h-3 ${color}`} />
                          <span className="text-xs text-gray-600">{amenity}</span>
                        </div>
                      )
                    })}
                    {stay.amenities.length > 3 && (
                      <span className="text-xs text-gray-400">+{stay.amenities.length - 3}개</span>
                    )}
                  </div>
                )}

                {/* 가격 정보 */}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">
                    {stay.price.toLocaleString()}원
                    <span className="text-sm font-normal text-gray-500 ml-1">/ 박</span>
                  </span>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-normal text-gray-900 mb-1 line-clamp-1 text-lg sm:text-base">{stay.name}</h3>
                <div className="flex items-center text-gray-500 text-sm mb-2">
                  <span>{stay.location}</span>
                  <span className="mx-2">·</span>
                  <span>기준 2명 ~ 최대 {stay.capacity}명</span>
                </div>

                {/* 주요 편의시설 미리보기 */}
                {stay.amenities && stay.amenities.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    {stay.amenities.slice(0, 4).map((amenity: string, idx: number) => {
                      const { icon: IconComponent, color } = getAmenityIcon(amenity)
                      return (
                        <div key={idx} className="flex items-center gap-1">
                          <IconComponent className={`w-3 h-3 ${color}`} />
                          <span className="text-xs text-gray-600 truncate max-w-[60px]">{amenity}</span>
                        </div>
                      )
                    })}
                    {stay.amenities.length > 4 && (
                      <span className="text-xs text-gray-400">+{stay.amenities.length - 4}</span>
                    )}
                  </div>
                )}

                {/* 가격 정보 */}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">
                    {stay.price.toLocaleString()}원
                    <span className="text-sm font-normal text-gray-500 ml-1">/ 박</span>
                  </span>
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