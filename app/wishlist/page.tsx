'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { 
  Heart,
  Star,
  MapPin,
  Users,
  Trash2,
  ArrowLeft,
  Search
} from 'lucide-react'
import Header from '@/components/header'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface WishlistItem {
  id: string
  name: string
  region: string
  price_per_night: number
  rating: number
  image_url: string
  max_guests: number
  added_date: string
}

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // 더미 데이터로 위시리스트 로드
    const loadWishlist = () => {
      const dummyWishlist: WishlistItem[] = [
        {
          id: '1',
          name: '청주 프라이빗 하우스',
          region: '청주시',
          price_per_night: 180000,
          rating: 4.8,
          image_url: '/api/placeholder/300/200',
          max_guests: 6,
          added_date: '2024-02-10'
        },
        {
          id: '2',
          name: '대전 풀빌라',
          region: '대전 유성구',
          price_per_night: 340000,
          rating: 4.9,
          image_url: '/api/placeholder/300/200',
          max_guests: 10,
          added_date: '2024-02-08'
        },
        {
          id: '3',
          name: '세종 모던 스테이',
          region: '세종시',
          price_per_night: 220000,
          rating: 4.7,
          image_url: '/api/placeholder/300/200',
          max_guests: 8,
          added_date: '2024-02-05'
        }
      ]
      
      setWishlistItems(dummyWishlist)
      setLoading(false)
    }

    loadWishlist()
  }, [])

  const removeFromWishlist = (itemId: string) => {
    setWishlistItems(items => items.filter(item => item.id !== itemId))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">위시리스트 로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                뒤로가기
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">위시리스트</h1>
                <p className="text-gray-600 mt-1">관심있는 숙소를 저장해두세요</p>
              </div>
            </div>
            
            <div className="text-gray-600">
              총 {wishlistItems.length}개 숙소
            </div>
          </div>

          {wishlistItems.length === 0 ? (
            // 빈 위시리스트
            <div className="text-center py-16">
              <Heart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">아직 저장된 숙소가 없어요</h2>
              <p className="text-gray-600 mb-8">마음에 드는 숙소를 찾아 하트 버튼을 눌러보세요</p>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/spaces">
                  <Search className="w-4 h-4 mr-2" />
                  숙소 둘러보기
                </Link>
              </Button>
            </div>
          ) : (
            // 위시리스트 아이템들
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistItems.map((item) => (
                <Card key={item.id} className="border-0 shadow-md overflow-hidden group hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                    />
                    <button 
                      onClick={() => removeFromWishlist(item.id)}
                      className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white shadow-md"
                    >
                      <Heart className="w-5 h-5 text-red-500 fill-current" />
                    </button>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        <span className="text-sm text-gray-600">{item.rating}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-gray-600 text-sm mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {item.region}
                    </div>
                    
                    <div className="flex items-center text-gray-600 text-sm mb-3">
                      <Users className="w-4 h-4 mr-1" />
                      최대 {item.max_guests}명
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {new Date(item.added_date).toLocaleDateString('ko-KR')} 저장
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">₩{item.price_per_night.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">/ 박</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" className="flex-1" asChild>
                        <Link href={`/spaces/${item.id}`}>상세보기</Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeFromWishlist(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* 추천 섹션 */}
          {wishlistItems.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">이런 숙소도 좋아하실 것 같아요</h2>
              <div className="text-center py-12 bg-blue-50 rounded-lg">
                <p className="text-gray-600 mb-4">위시리스트 기반 맞춤 추천 기능을 준비 중입니다</p>
                <Button variant="outline" asChild>
                  <Link href="/spaces">다른 숙소 둘러보기</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}