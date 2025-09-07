'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Clock,
  Calendar,
  MapPin,
  Users,
  Star,
  Gift,
  Percent,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/header'

export default function PromotionPage() {
  const promotions = [
    {
      id: 1,
      title: '신규 가입 특가',
      description: '첫 예약 시 20% 할인',
      discount: '20%',
      originalPrice: 180000,
      discountPrice: 144000,
      badge: 'NEW',
      badgeColor: 'bg-red-500',
      validUntil: '2024-12-31',
      image: 'https://cdn.imweb.me/thumbnail/20250718/771be60274a16.jpg',
      spaceName: '구공스테이 청주 메인홀',
      location: '충북 청주시 청원구'
    },
    {
      id: 2,
      title: '주중 특가 프로모션',
      description: '월-목 예약 시 15% 할인',
      discount: '15%',
      originalPrice: 180000,
      discountPrice: 153000,
      badge: 'WEEKDAY',
      badgeColor: 'bg-blue-500',
      validUntil: '2024-12-31',
      image: 'https://cdn.imweb.me/thumbnail/20250718/1e8101b6c07a0.jpg',
      spaceName: '구공스테이 청주 가든뷰',
      location: '충북 청주시 청원구'
    },
    {
      id: 3,
      title: '얼리버드 할인',
      description: '3주 전 미리 예약 시 25% 할인',
      discount: '25%',
      originalPrice: 180000,
      discountPrice: 135000,
      badge: 'EARLY BIRD',
      badgeColor: 'bg-green-500',
      validUntil: '2024-12-31',
      image: 'https://cdn.imweb.me/thumbnail/20250718/328af5dec5195.jpg',
      spaceName: '세종 힐링스테이',
      location: '세종특별자치시'
    },
    {
      id: 4,
      title: '연말 특가 이벤트',
      description: '12월 예약 시 최대 30% 할인',
      discount: '30%',
      originalPrice: 200000,
      discountPrice: 140000,
      badge: 'YEAR-END',
      badgeColor: 'bg-purple-500',
      validUntil: '2024-12-31',
      image: 'https://cdn.imweb.me/thumbnail/20250720/01ef0d2862ad4.jpg',
      spaceName: '대전 프리미엄 풀빌라',
      location: '대전광역시'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* 히어로 섹션 */}
          <section className="text-center mb-16">
            <div className="mb-8">
              <span className="bg-red-500/10 text-red-600 px-6 py-3 rounded-full text-lg font-medium">
                LIMITED TIME PROMOTION
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              특별 할인 혜택으로<br />
              <span className="text-red-600">더욱 저렴하게 즐기세요</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Stay One Day에서 진행하는 다양한 프로모션을 확인하고<br />
              특별한 가격으로 프리미엄 스테이를 경험해보세요
            </p>
          </section>

          {/* 프로모션 카드 */}
          <section className="grid md:grid-cols-2 gap-8 mb-16">
            {promotions.map((promo) => (
              <Card key={promo.id} className="overflow-hidden hover:shadow-xl transition-shadow group">
                <div className="relative">
                  <img 
                    src={promo.image} 
                    alt={promo.spaceName}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className={`${promo.badgeColor} text-white border-0`}>
                      {promo.badge}
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-red-600 font-bold text-lg">{promo.discount} OFF</span>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="font-bold text-xl text-gray-900 mb-2">{promo.title}</h3>
                    <p className="text-gray-600">{promo.description}</p>
                  </div>
                  
                  <div className="mb-4">
                    <div className="font-semibold text-gray-900">{promo.spaceName}</div>
                    <div className="flex items-center text-gray-500 text-sm">
                      <MapPin className="w-4 h-4 mr-1" />
                      {promo.location}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-gray-500 line-through text-sm">
                        ₩{promo.originalPrice.toLocaleString()}
                      </div>
                      <div className="text-2xl font-bold text-red-600">
                        ₩{promo.discountPrice.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-gray-500 text-sm">
                        <Clock className="w-4 h-4 mr-1" />
                        ~{promo.validUntil}
                      </div>
                    </div>
                  </div>
                  
                  <Link href={`/spaces/${promo.id}`}>
                    <Button className="w-full">
                      지금 예약하기
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </section>

          {/* 추가 혜택 안내 */}
          <section className="bg-gradient-to-r from-primary/5 to-blue-50 rounded-2xl p-8">
            <div className="text-center">
              <div className="mb-6">
                <Gift className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  더 많은 혜택이 준비되어 있어요!
                </h3>
                <p className="text-gray-600">
                  정기적으로 업데이트되는 프로모션을 놓치지 마세요
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Percent className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">계절별 할인</h4>
                  <p className="text-sm text-gray-600">봄, 여름, 가을, 겨울 시즌 특가</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">그룹 할인</h4>
                  <p className="text-sm text-gray-600">대규모 그룹 예약 시 추가 할인</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">멤버십 혜택</h4>
                  <p className="text-sm text-gray-600">누적 이용 시 VIP 할인</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}