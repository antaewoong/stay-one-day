'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  TrendingUp,
  Users,
  DollarSign,
  Star,
  ArrowLeft,
  CheckCircle,
  Clock,
  Shield,
  BarChart3,
  HeadphonesIcon
} from 'lucide-react'
import Link from 'next/link'

export default function PartnerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-blue-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">Stay One Day</h1>
              </div>
            </div>
            <Badge variant="outline" className="text-primary border-primary">
              파트너 모집
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* 히어로 섹션 */}
          <section className="text-center mb-16">
            <div className="mb-8">
              <span className="bg-primary/10 text-primary px-6 py-3 rounded-full text-lg font-medium">
                호스트 파트너 모집
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              프리미엄 파트너와 함께<br />
              <span className="text-primary">새로운 수익 기회를 창출하세요</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
              고품격 풀빌라·펜션 운영 사업자를 위한 전문 플랫폼<br />
              당일 대여 서비스로 유휴 시간을 수익화하세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="px-8 h-14 text-lg">
                  <Building2 className="w-5 h-5 mr-2" />
                  입점 문의하기
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="px-8 h-14 text-lg">
                <HeadphonesIcon className="w-5 h-5 mr-2" />
                상담 받기
              </Button>
            </div>
          </section>

          {/* 핵심 혜택 */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Stay One Day 파트너의 특별한 혜택
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-green-600 mb-2">낮은 수수료</h3>
                  <div className="text-3xl font-bold text-green-600 mb-2">5%</div>
                  <p className="text-gray-600">업계 최저 수준의 수수료<br />카드 수수료 별도</p>
                </CardContent>
              </Card>
              
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-blue-600 mb-2">간편 정산</h3>
                  <div className="text-3xl font-bold text-blue-600 mb-2">자동</div>
                  <p className="text-gray-600">자동 정산 시스템으로<br />복잡한 계산 불필요</p>
                </CardContent>
              </Card>
              
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-8">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-purple-600 mb-2">무료 홍보</h3>
                  <div className="text-3xl font-bold text-purple-600 mb-2">100%</div>
                  <p className="text-gray-600">플랫폼 마케팅 지원으로<br />별도 광고비 불필요</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* 수익 증대 효과 */}
          <section className="mb-16">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
                실제 파트너사 평균 수익 증대 효과
              </h3>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">+40%</div>
                  <div className="text-gray-600">전체 매출 증가</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">+50%</div>
                  <div className="text-gray-600">이용 고객 증가</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">평일</div>
                  <div className="text-gray-600">빈 시간 활용</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">8시간</div>
                  <div className="text-gray-600">15:00~23:00</div>
                </div>
              </div>
            </div>
          </section>

          {/* 이런 사업자님께 추천 */}
          <section className="mb-16">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-12">
              이런 사업자님께 추천해요
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">고품격 풀빌라/펜션 운영</h4>
                    <p className="text-gray-600">수영장, 바베큐, 넓은 공간 등 매력적인 시설을 보유한 사업자</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">추가 수익 창출 관심</h4>
                    <p className="text-gray-600">숙박 외 새로운 매출원이 필요한 사업자</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Star className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">품질 지향 사업자</h4>
                    <p className="text-gray-600">고객 만족과 서비스 품질을 중시하는 사업자</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">대용량 수용 가능</h4>
                    <p className="text-gray-600">10명 이상 대규모 그룹 이용이 가능한 사업자</p>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* 입점 프로세스 */}
          <section className="mb-16">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-12">
              간단한 4단계로 시작하세요
            </h3>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold text-xl">1</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">입점 신청</h4>
                <p className="text-sm text-gray-600">온라인 폼을 통해<br />간단히 신청하세요</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold text-xl">2</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">시설 검토</h4>
                <p className="text-sm text-gray-600">전문팀이 직접<br />시설을 확인합니다</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold text-xl">3</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">파트너십 체결</h4>
                <p className="text-sm text-gray-600">조건 협의 후<br />계약을 진행합니다</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold text-xl">4</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">서비스 오픈</h4>
                <p className="text-sm text-gray-600">플랫폼에 등록되어<br />예약을 받기 시작합니다</p>
              </div>
            </div>
          </section>

          {/* CTA 섹션 */}
          <section className="bg-primary text-white rounded-2xl p-12 text-center">
            <h3 className="text-3xl font-bold mb-6">
              지금 바로 파트너가 되어보세요!
            </h3>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              전문 검토팀이 48시간 내에 연락드려<br />
              상세한 안내를 도와드리겠습니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" variant="secondary" className="px-8 h-14 text-lg">
                  <Building2 className="w-5 h-5 mr-2" />
                  입점 문의하기
                </Button>
              </Link>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}