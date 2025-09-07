'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Star, 
  Heart,
  MapPin,
  Users,
  Waves,
  Home,
  Share2,
  Grid3X3,
  List,
  Filter,
  SlidersHorizontal
} from 'lucide-react'
import Link from 'next/link'

interface AccommodationGridProps {
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  viewMode: string
  setViewMode: (mode: string) => void
  searchQuery: string
  showFilters: boolean
  setShowFilters: (show: boolean) => void
}

export default function AccommodationGrid({ 
  selectedCategory, 
  setSelectedCategory, 
  viewMode, 
  setViewMode,
  searchQuery,
  showFilters,
  setShowFilters 
}: AccommodationGridProps) {
  const [favoriteIds, setFavoriteIds] = useState<number[]>([])

  const categories = ['전체', '풀빌라', '독채', '펜션', '게스트하우스', '호텔', '리조트']

  const accommodations = [
    {
      id: 1,
      name: "구공스테이 풀빌라",
      category: "풀빌라",
      location: "청주시 흥덕구",
      price: 180000,
      rating: 4.9,
      reviewCount: 127,
      images: ["/images/90staycj/1.jpg", "/images/90staycj/2.jpg"],
      amenities: ["수영장", "바베큐", "주차장", "와이파이"],
      maxGuests: 8,
      tags: ["풀빌라", "바베큐", "애견동반"],
      isNew: true,
      discount: 15
    },
    {
      id: 2,
      name: "스테이도고 펜션",
      category: "펜션", 
      location: "청주시 서원구",
      price: 120000,
      rating: 4.7,
      reviewCount: 89,
      images: ["/images/90staycj/3.jpg", "/images/90staycj/4.jpg"],
      amenities: ["바베큐", "주차장", "와이파이", "넷플릭스"],
      maxGuests: 6,
      tags: ["독채", "바베큐"],
      isNew: false,
      discount: 0
    },
    {
      id: 3,
      name: "마담아네뜨 글램핑",
      category: "독채",
      location: "청주시 청원구", 
      price: 150000,
      rating: 4.8,
      reviewCount: 156,
      images: ["/images/90staycj/5.jpg", "/images/90staycj/6.jpg"],
      amenities: ["글램핑", "바베큐", "주차장", "화장실"],
      maxGuests: 4,
      tags: ["글램핑", "자연"],
      isNew: false,
      discount: 10
    },
    // Add more accommodations as needed...
  ]

  const filteredAccommodations = accommodations.filter(acc => {
    const matchesCategory = selectedCategory === '전체' || acc.category === selectedCategory
    const matchesSearch = acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          acc.location.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const toggleFavorite = (id: number) => {
    setFavoriteIds(prev => 
      prev.includes(id) 
        ? prev.filter(fId => fId !== id)
        : [...prev, id]
    )
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '풀빌라': return <Waves className="w-4 h-4" />
      case '독채': return <Home className="w-4 h-4" />
      default: return <Home className="w-4 h-4" />
    }
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">인기 숙박 공간</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            청주에서 가장 사랑받는 숙박 공간들을 만나보세요
          </p>
        </div>

        {/* Filter Controls */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    {category}
                  </div>
                </button>
              ))}
            </div>

            {/* View and Filter Controls */}
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-green-600 text-white' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-green-600 text-white' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Filter Button */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                필터
              </Button>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              총 <span className="font-semibold text-gray-900">{filteredAccommodations.length}</span>개 숙소
            </p>
          </div>
        </div>

        {/* Accommodations Grid */}
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {filteredAccommodations.map((accommodation) => (
            <Card 
              key={accommodation.id} 
              className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-white border-0 group"
            >
              <div className="relative">
                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={accommodation.images[0]}
                    alt={accommodation.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Overlay Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {accommodation.isNew && (
                    <Badge className="bg-green-600 text-white px-2 py-1">NEW</Badge>
                  )}
                  {accommodation.discount > 0 && (
                    <Badge className="bg-red-500 text-white px-2 py-1">
                      {accommodation.discount}% 할인
                    </Badge>
                  )}
                </div>

                {/* Favorite Button */}
                <button
                  onClick={() => toggleFavorite(accommodation.id)}
                  className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                >
                  <Heart 
                    className={`w-4 h-4 ${
                      favoriteIds.includes(accommodation.id) 
                        ? 'text-red-500 fill-current' 
                        : 'text-gray-600'
                    }`} 
                  />
                </button>

                {/* Share Button */}
                <button className="absolute top-12 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors opacity-0 group-hover:opacity-100">
                  <Share2 className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <CardContent className="p-5">
                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {accommodation.tags.map((tag) => (
                    <Badge 
                      key={tag}
                      variant="secondary" 
                      className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Title & Location */}
                <div className="mb-3">
                  <Link 
                    href={`/spaces/${accommodation.id}`}
                    className="block hover:text-green-600 transition-colors"
                  >
                    <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
                      {accommodation.name}
                    </h3>
                  </Link>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    {accommodation.location}
                  </div>
                </div>

                {/* Amenities */}
                <div className="mb-3">
                  <p className="text-sm text-gray-600 line-clamp-1">
                    {accommodation.amenities.join(' • ')}
                  </p>
                </div>

                {/* Rating & Price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm font-medium text-gray-900">
                        {accommodation.rating}
                      </span>
                      <span className="ml-1 text-sm text-gray-500">
                        ({accommodation.reviewCount})
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-1" />
                      최대 {accommodation.maxGuests}명
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      ₩{accommodation.price.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">1박</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More Button */}
        {filteredAccommodations.length > 6 && (
          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-3 text-lg"
            >
              더 많은 숙소 보기
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}