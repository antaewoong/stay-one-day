'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { ReactNode, RefObject, memo } from 'react'
import StayCard from './StayCard'

interface SectionContainerProps {
  id?: string
  title: string
  subtitle: string
  bgColor?: string
  stays: any[]
  loading: boolean
  scrollRef: RefObject<HTMLDivElement>
  dragState: { isDown: boolean }
  handleMouseDown: (ref: RefObject<HTMLDivElement>, e: React.MouseEvent) => void
  handleMouseMove: (e: React.MouseEvent) => void
  handleMouseUp: (e: React.MouseEvent) => void
  handleMouseLeave: (e: React.MouseEvent) => void
  handleTouchStart: (ref: RefObject<HTMLDivElement>, e: React.TouchEvent) => void
  handleTouchMove: (e: React.TouchEvent) => void
  handleTouchEnd: (e: React.TouchEvent) => void
  handleCardClick: (e: React.MouseEvent, id: string) => void
  useNextImage?: boolean
  variant?: 'default' | 'featured'
}

const SectionContainer = memo(function SectionContainer({
  id,
  title,
  subtitle,
  bgColor = 'bg-white',
  stays,
  loading,
  scrollRef,
  dragState,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleMouseLeave,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  handleCardClick,
  useNextImage = false,
  variant = 'default'
}: SectionContainerProps) {
  return (
    <section id={id} className={`py-16 md:py-20 ${bgColor}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-light text-gray-900 tracking-tight">{title}</h2>
            <p className="text-gray-500 font-light mt-1">{subtitle}</p>
          </div>
          <Link href="/spaces" className="text-gray-400 hover:text-gray-900 flex items-center transition-colors duration-300 group">
            <span className="font-light">더보기</span>
            <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        <div 
          ref={scrollRef}
          className="overflow-x-auto overflow-y-hidden -mx-4 select-none scroll-container"
          style={{
            cursor: dragState.isDown ? 'grabbing' : 'grab',
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'auto'
          }}
          onMouseDown={(e) => handleMouseDown(scrollRef, e)}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={(e) => handleTouchStart(scrollRef, e)}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDragStart={(e) => e.preventDefault()}
        >
          <div className="flex space-x-4 pb-4 pl-4" style={{ width: 'max-content', paddingRight: '40vw' }}>
            {loading ? (
              // 로딩 스켈레톤
              Array.from({ length: 4 }).map((_, index) => (
                <StayCard 
                  key={index}
                  stay={{} as any}
                  handleCardClick={() => {}}
                  loading={true}
                />
              ))
            ) : (
              stays.map((stay, index) => (
                <StayCard 
                  key={stay.id}
                  stay={stay}
                  index={index}
                  handleCardClick={handleCardClick}
                  useNextImage={useNextImage}
                  variant={variant}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
})

export default SectionContainer