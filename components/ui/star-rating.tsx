import { Star, StarHalf } from 'lucide-react'

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  showNumber?: boolean
  readonly?: boolean
  onRatingChange?: (rating: number) => void
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  size = 'md', 
  showNumber = true,
  readonly = true,
  onRatingChange
}: StarRatingProps) {
  const sizeMap = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const handleStarClick = (starRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starRating)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[...Array(maxRating)].map((_, index) => {
          const starValue = index + 1
          const isFull = rating >= starValue
          const isHalf = rating >= starValue - 0.5 && rating < starValue
          
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleStarClick(starValue)}
              disabled={readonly}
              className={`${readonly ? '' : 'hover:scale-110 cursor-pointer'} transition-transform`}
            >
              {isFull ? (
                <Star className={`${sizeMap[size]} fill-yellow-400 text-yellow-400`} />
              ) : isHalf ? (
                <StarHalf className={`${sizeMap[size]} fill-yellow-400 text-yellow-400`} />
              ) : (
                <Star className={`${sizeMap[size]} text-gray-300`} />
              )}
            </button>
          )
        })}
      </div>
      {showNumber && (
        <span className={`ml-1 font-medium ${
          size === 'sm' ? 'text-xs' : 
          size === 'md' ? 'text-sm' : 'text-base'
        }`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

interface StarRatingBreakdownProps {
  ratings: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
  totalReviews: number
}

export function StarRatingBreakdown({ ratings, totalReviews }: StarRatingBreakdownProps) {
  if (totalReviews === 0) {
    return <div className="text-sm text-gray-500">아직 리뷰가 없습니다.</div>
  }

  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((stars) => {
        const count = ratings[stars as keyof typeof ratings] || 0
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
        
        return (
          <div key={stars} className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 w-10">
              <span>{stars}</span>
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-gray-600 w-8 text-right">{count}</span>
          </div>
        )
      })}
    </div>
  )
}

interface CategoryRatingProps {
  categories: {
    cleanliness: number
    location: number
    value: number
    amenities: number
    communication: number
    checkin: number
  }
}

export function CategoryRating({ categories }: CategoryRatingProps) {
  const categoryLabels = {
    cleanliness: '청결도',
    location: '위치',
    value: '가성비',
    amenities: '시설',
    communication: '소통',
    checkin: '체크인'
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {Object.entries(categories).map(([key, rating]) => (
        <div key={key} className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {categoryLabels[key as keyof typeof categoryLabels]}
          </span>
          <StarRating 
            rating={rating || 0} 
            size="sm" 
            showNumber={true}
          />
        </div>
      ))}
    </div>
  )
}

// Export alias for backward compatibility
export { StarRatingBreakdown as RatingBreakdown }