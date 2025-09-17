'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  TrendingUp,
  Users,
  Building2,
  MapPin,
  Star,
  DollarSign,
  PieChart,
  BarChart3,
  Target,
  Zap,
  Shield,
  Award,
  Globe,
  Calendar,
  Phone,
  Mail,
  ChevronDown,
  Play,
  Download,
  Share2,
  Lightbulb,
  Rocket,
  Crown,
  Heart,
  CheckCircle2,
  ArrowUpRight,
  Waves,
  Home,
  Brain,
  Video,
  BarChart,
  Smartphone
} from 'lucide-react'
import Header from '@/components/header'
import OptimizedImage from '@/components/optimized-image'

export default function RealIRDeck() {
  const [activeSlide, setActiveSlide] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(false)

  // 실제 데이터 기반 메트릭스
  const realMetrics = {
    activeAccommodations: 25,
    poolVillaRatio: 72, // 18/25
    avgPrice: 31, // 만원
    featuredRatio: 40, // 10/25
    priceRange: { min: 10, max: 70 },
    regions: ['청주', '세종', '대전', '가평']
  }

  const slides = [
    {
      id: 'cover',
      title: 'Stay OneDay',
      component: () => (
        <div className="relative h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700"></div>
          </div>
          <div className="relative z-10 text-center px-8">
            <h1 className="text-6xl md:text-8xl font-bold mb-6">Stay OneDay</h1>
            <p className="text-2xl md:text-3xl mb-8 text-blue-200">
              단순 중개를 넘어선 <span className="text-yellow-400">올인원 비즈니스 성장 플랫폼</span>
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge className="bg-white/20 text-white px-4 py-2 text-lg backdrop-blur-sm">
                호스트 비즈니스 파트너
              </Badge>
              <Badge className="bg-white/20 text-white px-4 py-2 text-lg backdrop-blur-sm">
                AI 마케팅 자동화
              </Badge>
              <Badge className="bg-white/20 text-white px-4 py-2 text-lg backdrop-blur-sm">
                3방향 가치 창출
              </Badge>
            </div>
            <p className="text-lg text-gray-300 max-w-4xl mx-auto">
              프리미엄 스테이의 평일 프라임타임을 활용한 새로운 비즈니스 모델<br/>
              예약 + 마케팅 + 데이터 분석 + 콘텐츠 제작을 하나로
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'problem',
      title: '우리가 해결하는 진짜 문제',
      component: () => (
        <div className="p-12 h-full bg-gray-50">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">단순 중개로는 해결되지 않는 구조적 문제</h2>
            <p className="text-xl text-gray-600">플랫폼 수수료만 떼고 끝? 그건 진짜 해결이 아닙니다</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 border-l-4 border-red-500">
              <div className="flex items-center mb-4">
                <Building2 className="w-8 h-8 text-red-500 mr-3" />
                <h3 className="text-xl font-bold text-gray-900">호스트의 고민</h3>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  평일 70% 공실률, 고정비는 그대로
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  마케팅 어떻게 해야 할지 모름
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  SNS 콘텐츠 제작 부담
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  단순 예약 중개로는 한계
                </li>
              </ul>
            </Card>

            <Card className="p-8 border-l-4 border-orange-500">
              <div className="flex items-center mb-4">
                <Users className="w-8 h-8 text-orange-500 mr-3" />
                <h3 className="text-xl font-bold text-gray-900">사용자의 불편</h3>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  기준인원 제약으로 그룹 이용 어려움
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  숙박 전제 시 불필요한 비용 증가
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  목적별 맞춤 공간 찾기 힘듦
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  주말 집중으로 예약 경쟁 심화
                </li>
              </ul>
            </Card>

            <Card className="p-8 border-l-4 border-purple-500">
              <div className="flex items-center mb-4">
                <Video className="w-8 h-8 text-purple-500 mr-3" />
                <h3 className="text-xl font-bold text-gray-900">인플루언서 한계</h3>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  일방적 협찬 요청, 성과 측정 불가
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  콘텐츠 제작 부담과 품질 편차
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  공정한 보상 체계 부재
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  데이터 기반 협업 시스템 없음
                </li>
              </ul>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'solution',
      title: '우리만의 솔루션',
      component: () => (
        <div className="p-12 h-full bg-white">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">3방향 가치 창출 플랫폼</h2>
            <p className="text-xl text-gray-600">단순 중개가 아닌, 모두가 성장하는 생태계</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">호스트 성장 파트너</h3>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>평일 프라임타임(15:00-23:00) 매출화</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>AI 마케팅 자동화 (콘텐츠+SEO+광고)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>주 2회 맞춤 분석 리포트</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>침구 미사용으로 운영비 절감</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">사용자 경험 혁신</h3>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>기준인원 부담 없는 그룹 이용</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>목적별 맞춤 공간 AI 추천</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>당일 이용 가능한 접근성</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>프리미엄 공간, 합리적 가격</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">인플루언서 협업</h3>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>데이터 기반 공정한 성과 측정</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>AI 콘텐츠 제작 도구 제공</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>직접 제안 시스템</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>전환율/리치 데이터 투명 공개</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'business-model',
      title: '올인원 비즈니스 모델',
      component: () => (
        <div className="p-12 h-full bg-gray-50">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">단순 수수료 모델을 넘어선 구독 기반 성장 플랫폼</h2>
            <p className="text-xl text-gray-600">예약 중개 + 마케팅 에이전시 + SaaS 도구를 하나로</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">수익 구조</h3>
              <div className="space-y-6">
                <Card className="p-6 border-l-4 border-green-500">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-lg">예약 수수료</h4>
                    <span className="text-2xl font-bold text-green-600">8-15%</span>
                  </div>
                  <p className="text-gray-600">프라임타임 예약 금액 기준</p>
                  <p className="text-sm text-gray-500 mt-2">현재 평균 31만원 × 25개 숙소</p>
                </Card>

                <Card className="p-6 border-l-4 border-blue-500">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-lg">SaaS 구독</h4>
                    <span className="text-2xl font-bold text-blue-600">월 9만원</span>
                  </div>
                  <p className="text-gray-600">AI 마케팅 도구 + 분석 리포트</p>
                  <p className="text-sm text-gray-500 mt-2">예상 옵션율: 35%</p>
                </Card>

                <Card className="p-6 border-l-4 border-purple-500">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-lg">프리미엄 서비스</h4>
                    <span className="text-2xl font-bold text-purple-600">별도</span>
                  </div>
                  <p className="text-gray-600">전문 촬영, 컨설팅, B2B 패키지</p>
                  <p className="text-sm text-gray-500 mt-2">기업 오프사이트, 팀빌딩</p>
                </Card>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">제공 가치</h3>
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-gray-900">vs</div>
                  <p className="text-lg text-gray-600">기존 마케팅 에이전시 대비</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                    <span className="font-medium">마케팅 에이전시</span>
                    <span className="text-xl font-bold text-red-600">월 200만원+</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <span className="font-medium">Stay OneDay 올인원</span>
                    <span className="text-xl font-bold text-green-600">월 9만원</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-bold text-blue-900 mb-2">포함 서비스</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• AI 숏폼 영상 제작</li>
                    <li>• 네이버/구글 SEO 최적화</li>
                    <li>• 인플루언서 매칭</li>
                    <li>• 주 2회 성과 분석 리포트</li>
                    <li>• 예약 관리 + 자동 정산</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'ai-automation',
      title: 'AI 기술의 적재적소 활용',
      component: () => (
        <div className="p-12 h-full bg-white">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">AI를 위한 AI가 아닌, 사용자 편의를 위한 AI</h2>
            <p className="text-xl text-gray-600">호스트가 고민하지 않고, 사용자가 검색하지 않는 자동화</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
                <div className="flex items-center mb-4">
                  <Brain className="w-8 h-8 text-blue-600 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900">스마트 수요예측</h3>
                </div>
                <p className="text-gray-700 mb-4">지역/요일/날씨/이벤트 데이터 분석으로 최적 가격과 슬롯 자동 제안</p>
                <div className="bg-white/70 rounded-lg p-4">
                  <p className="text-sm text-blue-800"><strong>결과:</strong> 호스트가 가격 고민 없이 최적 수익 확보</p>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
                <div className="flex items-center mb-4">
                  <Video className="w-8 h-8 text-purple-600 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900">콘텐츠 자동 제작</h3>
                </div>
                <p className="text-gray-700 mb-4">호스트 사진만 업로드하면 숏폼 영상 자동 생성, 네이버/인스타/유튜브 최적화</p>
                <div className="bg-white/70 rounded-lg p-4">
                  <p className="text-sm text-purple-800"><strong>결과:</strong> 월 8편 콘텐츠 자동 생산, 노출 34% 증가</p>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
                <div className="flex items-center mb-4">
                  <Target className="w-8 h-8 text-green-600 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900">스마트 매칭</h3>
                </div>
                <p className="text-gray-700 mb-4">사용자 목적/인원/예산 기반으로 완벽한 공간 자동 추천</p>
                <div className="bg-white/70 rounded-lg p-4">
                  <p className="text-sm text-green-800"><strong>결과:</strong> 검색 스트레스 제거, 만족도 95%+</p>
                </div>
              </Card>
            </div>

            <div className="space-y-8">
              <div className="bg-gray-900 text-white rounded-xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-center">실제 성과 데이터</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400">38%</div>
                    <div className="text-sm text-gray-300">평일 가동률 증가</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">212만원</div>
                    <div className="text-sm text-gray-300">주간 프라임 매출</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400">21</div>
                    <div className="text-sm text-gray-300">월 리뷰/UGC</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-400">34%</div>
                    <div className="text-sm text-gray-300">네이버 노출 증가</div>
                  </div>
                </div>
              </div>

              <Card className="p-6">
                <h4 className="font-bold text-lg mb-4">AI 활용 원칙</h4>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <Zap className="w-5 h-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong>사용자 편의 최우선:</strong> 복잡한 과정을 간단하게</span>
                  </li>
                  <li className="flex items-start">
                    <Shield className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong>투명한 데이터:</strong> AI 결정 과정 공개</span>
                  </li>
                  <li className="flex items-start">
                    <Heart className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span><strong>인간 중심:</strong> 기술이 사람을 대체하지 않고 도움</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'market-size',
      title: '시장 기회와 현실적 목표',
      component: () => (
        <div className="p-12 h-full bg-gray-50">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">현실적 데이터 기반 시장 분석</h2>
            <p className="text-xl text-gray-600">과장되지 않은 보수적 추정으로 지속가능한 성장 계획</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">TAM/SAM/SOM 분석</h3>
              <div className="space-y-6">
                <Card className="p-6 border-l-4 border-blue-500">
                  <h4 className="font-bold text-lg text-blue-900 mb-2">TAM (Total Addressable Market)</h4>
                  <div className="text-3xl font-bold text-blue-600 mb-2">3.75조원</div>
                  <p className="text-gray-600">국내 프리미엄 숙박 시장 (전체 숙박업 25조원의 15%)</p>
                </Card>

                <Card className="p-6 border-l-4 border-green-500">
                  <h4 className="font-bold text-lg text-green-900 mb-2">SAM (Serviceable Addressable Market)</h4>
                  <div className="text-3xl font-bold text-green-600 mb-2">2.25조원</div>
                  <p className="text-gray-600">데이유즈 적합 프리미엄 숙박 (TAM의 60%)</p>
                </Card>

                <Card className="p-6 border-l-4 border-purple-500">
                  <h4 className="font-bold text-lg text-purple-900 mb-2">SOM (Serviceable Obtainable Market)</h4>
                  <div className="text-3xl font-bold text-purple-600 mb-2">22.5억원</div>
                  <p className="text-gray-600">3년 내 목표 점유율 0.1% (보수적 추정)</p>
                </Card>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">현재 실적과 목표</h3>
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">{realMetrics.activeAccommodations}</div>
                    <div className="text-sm text-gray-600">활성 숙소</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600">{realMetrics.poolVillaRatio}%</div>
                    <div className="text-sm text-gray-600">풀빌라 비율</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600">{realMetrics.avgPrice}만원</div>
                    <div className="text-sm text-gray-600">평균 요금</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-orange-600">{realMetrics.featuredRatio}%</div>
                    <div className="text-sm text-gray-600">추천 숙소</div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-bold text-lg mb-4">12개월 목표</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>숙소 수</span>
                      <span className="font-bold">25개 → 80개</span>
                    </div>
                    <div className="flex justify-between">
                      <span>월 GMV</span>
                      <span className="font-bold">0.5억 → 4억원</span>
                    </div>
                    <div className="flex justify-between">
                      <span>월 매출</span>
                      <span className="font-bold">500만 → 4,000만원</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SaaS 구독률</span>
                      <span className="font-bold">0% → 35%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'team-story',
      title: '팀과 여정',
      component: () => (
        <div className="p-12 h-full bg-white">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">함께 만들어온 혁신의 여정</h2>
            <p className="text-xl text-gray-600">기술과 비즈니스, 사용자 경험을 하나로 연결하는 팀</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8">개발 철학</h3>
              <div className="space-y-6">
                <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50">
                  <h4 className="font-bold text-lg text-blue-900 mb-3">사용자 중심 설계</h4>
                  <p className="text-gray-700">복잡한 기술을 단순한 경험으로 변환</p>
                  <ul className="mt-3 text-sm text-blue-800 space-y-1">
                    <li>• 검색 모달 시스템으로 통일된 UX</li>
                    <li>• 히어로 이미지 프리로더로 즉시 로딩</li>
                    <li>• 서버사이드 렌더링으로 빠른 초기 로딩</li>
                  </ul>
                </Card>

                <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50">
                  <h4 className="font-bold text-lg text-green-900 mb-3">데이터 기반 의사결정</h4>
                  <p className="text-gray-700">추측이 아닌 실제 데이터로 검증</p>
                  <ul className="mt-3 text-sm text-green-800 space-y-1">
                    <li>• 25개 실제 숙소 데이터 분석</li>
                    <li>• 실시간 수익 시뮬레이션 제공</li>
                    <li>• A/B 테스트 기반 기능 개선</li>
                  </ul>
                </Card>

                <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50">
                  <h4 className="font-bold text-lg text-purple-900 mb-3">지속가능한 아키텍처</h4>
                  <p className="text-gray-700">확장 가능하고 안정적인 시스템 구축</p>
                  <ul className="mt-3 text-sm text-purple-800 space-y-1">
                    <li>• Next.js 15 + TypeScript 최신 스택</li>
                    <li>• Supabase RLS로 보안 강화</li>
                    <li>• CI/CD 파이프라인으로 안정적 배포</li>
                  </ul>
                </Card>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8">주요 마일스톤</h3>
              <div className="space-y-6">
                {[
                  {
                    period: '2024.Q3',
                    title: '프로젝트 시작',
                    desc: '프리미엄 숙박 시장 문제 정의',
                    achievement: 'MVP 아키텍처 설계'
                  },
                  {
                    period: '2024.Q4',
                    title: '핵심 기능 구현',
                    desc: '검색, 예약, 호스트 대시보드',
                    achievement: '25개 숙소 온보딩'
                  },
                  {
                    period: '2025.Q1',
                    title: 'AI 기능 통합',
                    desc: '수익 시뮬레이션, 콘텐츠 자동화',
                    achievement: '사용자 경험 대폭 개선'
                  },
                  {
                    period: '2025.Q2',
                    title: '마케팅 자동화',
                    desc: '인플루언서 매칭, SEO 최적화',
                    achievement: '올인원 플랫폼 완성'
                  }
                ].map((milestone, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-blue-600 font-medium">{milestone.period}</div>
                      <h4 className="font-bold text-lg text-gray-900">{milestone.title}</h4>
                      <p className="text-gray-600 mb-1">{milestone.desc}</p>
                      <p className="text-sm text-green-700 font-medium">✓ {milestone.achievement}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                <h4 className="font-bold text-lg text-orange-900 mb-3">다음 단계</h4>
                <ul className="text-orange-800 space-y-2">
                  <li>• B2B 기업 오프사이트 시장 진입</li>
                  <li>• AI 영상 제작 도구 고도화</li>
                  <li>• 전국 주요 도시 확장</li>
                  <li>• 해외 시장 진출 준비</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'investment',
      title: '투자 제안',
      component: () => (
        <div className="p-12 h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">함께 성장할 파트너를 찾습니다</h2>
            <p className="text-xl text-blue-200">검증된 비즈니스 모델과 탄탄한 기술력으로 새로운 시장 개척</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold mb-6">투자 요청</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg">투자 규모</span>
                    <span className="text-2xl font-bold text-yellow-400">5억원</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg">기업 가치</span>
                    <span className="text-2xl font-bold text-green-400">협의</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg">사용 기간</span>
                    <span className="text-2xl font-bold text-blue-400">24개월</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold mb-6">자금 사용 계획</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>제품 개발 (AI/기술)</span>
                    <span className="font-bold">40% (2억원)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>마케팅 & 사업개발</span>
                    <span className="font-bold">30% (1.5억원)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>팀 확장 & 운영</span>
                    <span className="font-bold">20% (1억원)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>예비 자금</span>
                    <span className="font-bold">10% (0.5억원)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold mb-6">예상 성과 (24개월)</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">200개</div>
                    <div className="text-sm text-gray-300">파트너 숙소</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400">150억</div>
                    <div className="text-sm text-gray-300">연간 GMV</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400">18억</div>
                    <div className="text-sm text-gray-300">연간 매출</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-400">60%</div>
                    <div className="text-sm text-gray-300">SaaS 구독률</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold mb-6">투자자 혜택</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>후속 라운드 우선 참여권</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>이사회 참관 및 의결권</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>서비스 평생 30% 할인</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>월간 성과 리포트 제공</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <div className="inline-block bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold mb-4">연락처</h3>
              <div className="space-y-2 text-lg">
                <p>이메일: invest@stayoneday.com</p>
                <p>전화: 010-1234-5678</p>
                <p>카카오톡: @stayoneday</p>
              </div>
              <div className="mt-6 flex gap-4 justify-center">
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3">
                  <Mail className="w-5 h-5 mr-2" />
                  투자 문의하기
                </Button>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-3">
                  <Download className="w-5 h-5 mr-2" />
                  IR 자료 다운로드
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ]

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToSlide = (index: number) => {
    setActiveSlide(index)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        nextSlide()
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        prevSlide()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* 슬라이드 컨테이너 */}
        <div className="relative">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
            {slides[activeSlide].component()}
          </div>

          {/* 네비게이션 버튼 */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full p-3 transition-all"
            disabled={activeSlide === 0}
          >
            <ChevronDown className="w-6 h-6 rotate-90" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full p-3 transition-all"
            disabled={activeSlide === slides.length - 1}
          >
            <ChevronDown className="w-6 h-6 -rotate-90" />
          </button>
        </div>

        {/* 슬라이드 인디케이터 */}
        <div className="flex justify-center items-center mt-6 space-x-4">
          <div className="flex space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === activeSlide
                    ? 'bg-blue-600 scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500 ml-4">
            {activeSlide + 1} / {slides.length}
          </span>
        </div>

        {/* 컨트롤 가이드 */}
        <div className="text-center mt-4 text-sm text-gray-500">
          키보드: ← → 또는 A D | 클릭: 좌우 화살표 또는 하단 점
        </div>

        {/* 슬라이드 목록 */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => goToSlide(index)}
              className={`p-4 rounded-lg text-left transition-all ${
                index === activeSlide
                  ? 'bg-blue-100 border-2 border-blue-500 text-blue-800'
                  : 'bg-white border border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="font-medium text-sm">{index + 1}. {slide.title}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}