'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Clock,
  Calendar,
  MapPin,
  Users,
  Star,
  Sparkles,
  Bell,
  CheckCircle,
  Building2,
  Camera
} from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/header'

export default function PreOrderPage() {
  const preOrderStays = [
    {
      id: 'po-1',
      name: '청주 레이크뷰 프라이빗 빌라',
      location: '충북 청주시 상당구',
      openingDate: '2024-02-15',
      description: '호수를 바라보는 절경과 함께하는 신개념 프라이빗 풀빌라',
      features: ['인피니티 풀', '호수 전망', '스카이라운지', '바베큐 데크'],
      capacity: '최대 15명',
      preOrderPrice: 160000,
      regularPrice: 200000,
      discount: 20,
      bookingProgress: 65,
      totalSlots: 100,
      bookedSlots: 65,
      images: [
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop'
      ],
      status: 'coming-soon',
      badge: '2월 오픈'
    },
    {
      id: 'po-2', 
      name: '세종 모던 글램핑',
      location: '세종특별자치시 연서면',
      openingDate: '2024-03-01',
      description: '자연 속에서 즐기는 럭셔리 글램핑 경험',
      features: ['글램핑텐트 4동', '캠프파이어존', '별빛카페', '자연산책로'],
      capacity: '최대 12명',
      preOrderPrice: 140000,
      regularPrice: 180000,
      discount: 22,
      bookingProgress: 45,
      totalSlots: 80,
      bookedSlots: 36,
      images: [
        'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&h=600&fit=crop'
      ],
      status: 'pre-order',
      badge: '사전예약 중'
    },
    {
      id: 'po-3',
      name: '대전 루프탑 펜트하우스',
      location: '대전광역시 유성구',
      openingDate: '2024-04-01',
      description: '도심 한가운데서 즐기는 프라이빗 루프탑 파티 공간',
      features: ['루프탑 테라스', '시티뷰', 'DJ부스', '샴페인바'],
      capacity: '최대 20명',
      preOrderPrice: 180000,
      regularPrice: 240000,
      discount: 25,
      bookingProgress: 30,
      totalSlots: 60,
      bookedSlots: 18,
      images: [
        'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&h=600&fit=crop'
      ],
      status: 'pre-order',
      badge: '얼리버드'
    }
  ]

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'coming-soon': return 'bg-orange-500'
      case 'pre-order': return 'bg-green-500'  
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* 히어로 섹션 */}
          <section className="text-center mb-16">
            <div className="mb-8">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent px-6 py-3 rounded-full text-lg font-medium border border-purple-200">
                <Sparkles className="w-5 h-5 inline mr-2" />
                PRE-ORDER EXCLUSIVE
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              곧 만날 수 있는<br />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                새로운 스테이들
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
              오픈 전 미리 예약하고 특별한 할인 혜택을 받으세요.<br />
              한정된 사전예약 기회를 놓치지 마세요!
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">최대 25% 할인</h3>
                <p className="text-sm text-gray-600">정가 대비 사전예약 특가</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">우선 예약권</h3>
                <p className="text-sm text-gray-600">오픈일 최우선 예약 가능</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">100% 환불 보장</h3>
                <p className="text-sm text-gray-600">오픈 전까지 전액 환불</p>
              </div>
            </div>
          </section>

          {/* 사전 예약 스테이 목록 */}
          <section className="grid lg:grid-cols-1 gap-8 mb-16">
            {preOrderStays.map((stay) => (
              <Card key={stay.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                <div className="grid md:grid-cols-2 gap-0">
                  
                  {/* 이미지 섹션 */}
                  <div className="relative">
                    <div className="grid grid-cols-2 h-full">
                      {stay.images.map((image, index) => (
                        <img 
                          key={index}
                          src={image} 
                          alt={`${stay.name} ${index + 1}`}
                          className="w-full h-48 md:h-full object-cover"
                        />
                      ))}
                    </div>
                    <div className="absolute top-4 left-4">
                      <Badge className={`${getStatusColor(stay.status)} text-white border-0`}>
                        {stay.badge}
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-red-600 font-bold">{stay.discount}% OFF</span>
                    </div>
                  </div>

                  {/* 콘텐츠 섹션 */}
                  <CardContent className="p-8 flex flex-col justify-between">
                    <div>
                      <div className="mb-4">
                        <h3 className="font-bold text-2xl text-gray-900 mb-2">{stay.name}</h3>
                        <div className="flex items-center text-gray-600 mb-2">
                          <MapPin className="w-4 h-4 mr-1" />
                          {stay.location}
                        </div>
                        <div className="flex items-center text-gray-600 mb-4">
                          <Calendar className="w-4 h-4 mr-1" />
                          {stay.openingDate} 오픈 예정
                        </div>
                        <p className="text-gray-700 mb-4">{stay.description}</p>
                      </div>
                      
                      {/* 특징 */}
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">특별한 시설</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {stay.features.map((feature, index) => (
                            <div key={index} className="flex items-center text-sm text-gray-600">
                              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* 예약 현황 */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-gray-900">사전예약 현황</span>
                          <span className="text-sm text-gray-600">
                            {stay.bookedSlots}/{stay.totalSlots}명 예약
                          </span>
                        </div>
                        <Progress value={stay.bookingProgress} className="mb-2" />
                        <p className="text-xs text-gray-500">
                          한정된 사전예약 기회입니다
                        </p>
                      </div>
                    </div>
                    
                    {/* 가격 및 예약 */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-gray-500 line-through text-sm">
                            ₩{stay.regularPrice.toLocaleString()}
                          </div>
                          <div className="text-2xl font-bold text-purple-600">
                            ₩{stay.preOrderPrice.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">{stay.capacity}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">사전예약가</div>
                          <div className="font-bold text-green-600">
                            {stay.discount}% 할인
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                          <Bell className="w-4 h-4 mr-2" />
                          사전예약 하기
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Camera className="w-4 h-4 mr-2" />
                          더 많은 사진 보기
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </section>

          {/* CTA 섹션 */}
          <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-12 text-center">
            <h3 className="text-3xl font-bold mb-6">
              새로운 스테이 오픈 소식을 받아보세요
            </h3>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              이메일로 최신 사전예약 정보와<br />
              특별 할인 혜택을 가장 먼저 받아보세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="이메일을 입력하세요"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900"
              />
              <Button variant="secondary" size="lg" className="px-8">
                알림 받기
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}