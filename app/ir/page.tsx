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
  Waves
} from 'lucide-react'
import Header from '@/components/header'
import OptimizedImage from '@/components/optimized-image'
import Link from 'next/link'

export default function IRPage() {
  const [activeSection, setActiveSection] = useState('hero')
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 애니메이션을 위한 숫자 카운터
  const [counters, setCounters] = useState({
    users: 0,
    accommodations: 0,
    revenue: 0,
    growth: 0
  })

  useEffect(() => {
    const targets = {
      users: 15000,
      accommodations: 25,
      revenue: 2400,
      growth: 340
    }

    const duration = 2000 // 2초
    const steps = 60
    const stepDuration = duration / steps

    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      const progress = currentStep / steps

      setCounters({
        users: Math.floor(targets.users * progress),
        accommodations: Math.floor(targets.accommodations * progress),
        revenue: Math.floor(targets.revenue * progress),
        growth: Math.floor(targets.growth * progress)
      })

      if (currentStep >= steps) {
        clearInterval(timer)
        setCounters(targets)
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [])

  const keyMetrics = [
    {
      label: "활성 숙소",
      value: "25",
      suffix: "개",
      icon: Building2,
      color: "from-green-500 to-emerald-500",
      growth: "프리미엄 큐레이션"
    },
    {
      label: "평균 요금",
      value: "31",
      suffix: "만원",
      icon: DollarSign,
      color: "from-purple-500 to-pink-500",
      growth: "데이유즈 기준"
    },
    {
      label: "풀빌라 비율",
      value: "72",
      suffix: "%",
      icon: Waves,
      color: "from-blue-500 to-cyan-500",
      growth: "18/25개"
    },
    {
      label: "추천 숙소",
      value: "40",
      suffix: "%",
      icon: Award,
      color: "from-orange-500 to-red-500",
      growth: "10/25개"
    }
  ]

  const marketData = [
    { year: '2021', market: 19.2, stayoneday: 0, desc: '코로나 회복기' },
    { year: '2022', market: 23.8, stayoneday: 0, desc: '여행 수요 급증' },
    { year: '2023', market: 28.4, stayoneday: 0, desc: '프리미엄 세그먼트 성장' },
    { year: '2024', market: 32.1, stayoneday: 0.05, desc: 'Stay OneDay 시작' },
    { year: '2025E', market: 37.5, stayoneday: 0.8, desc: '본격 확장' },
    { year: '2026E', market: 43.2, stayoneday: 3.2, desc: '시장 점유율 확보' },
    { year: '2027E', market: 49.8, stayoneday: 8.5, desc: '전국 확산' }
  ]

  const competitors = [
    {
      name: "에어비앤비",
      market: "글로벌",
      focus: "민박 전반",
      weakness: "한국 시장 이해 부족, 복잡한 예약 과정"
    },
    {
      name: "야놀자",
      market: "국내",
      focus: "호텔/모텔",
      weakness: "프리미엄 숙박에 집중도 낮음, 차별화 부족"
    },
    {
      name: "여기어때",
      market: "국내",
      focus: "다양한 숙박",
      weakness: "큐레이션 부족, 품질 관리 한계"
    }
  ]

  const timeline = [
    { year: '2023.Q1', event: '스테이 원데이 법인 설립', milestone: 'Company Founded' },
    { year: '2023.Q2', event: '초기 숙소 파트너 확보 (5개)', milestone: 'Early Partners' },
    { year: '2023.Q3', event: '베타 서비스 론칭', milestone: 'Beta Launch' },
    { year: '2023.Q4', event: '정식 서비스 오픈', milestone: 'Official Launch' },
    { year: '2024.Q1', event: '월 매출 500만원 달성', milestone: 'Revenue Milestone' },
    { year: '2024.Q2', event: '누적 사용자 5,000명 돌파', milestone: 'User Growth' },
    { year: '2024.Q3', event: '제휴 숙소 20개 확장', milestone: 'Partner Expansion' },
    { year: '2024.Q4', event: '월 매출 2,400만원 달성', milestone: 'Current Status' },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* 배경 애니메이션 */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700"></div>
          <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 text-center text-white px-4 max-w-6xl mx-auto">
          {/* 로고 & 회사명 */}
          <div className="mb-8">
            <div className="inline-block p-4 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 border border-white/20">
              <span className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Stay OneDay
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              프리미엄 스테이의
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                평일 프라임타임
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              주말만 꽉 차던 프리미엄 공간을 평일에도 프라임 매출로<br/>
              '숙박 없는 경험' 상품화로 새로운 시장을 개척합니다
            </p>
          </div>

          {/* 핵심 지표 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {keyMetrics.map((metric, index) => {
              const IconComponent = metric.icon
              return (
                <div
                  key={metric.label}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${metric.color} flex items-center justify-center mb-4 mx-auto`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold mb-2">
                    {metric.value}{metric.suffix}
                  </div>
                  <div className="text-sm text-gray-300 mb-2">{metric.label}</div>
                  <div className="text-xs text-green-400 font-medium">{metric.growth}</div>
                </div>
              )
            })}
          </div>

          {/* CTA 버튼들 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Download className="w-5 h-5 mr-2" />
              IR 자료 다운로드
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-xl backdrop-blur-sm"
            >
              <Play className="w-5 h-5 mr-2" />
              비즈니스 소개 영상
            </Button>
          </div>

          {/* 스크롤 인디케이터 */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-8 h-8 text-white/60" />
          </div>
        </div>
      </section>

      {/* 회사 소개 */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
              Company Overview
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              왜 스테이 원데이인가?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              우리는 단순한 숙박 예약 플랫폼이 아닙니다. 고객의 특별한 경험을 위해 엄선된 숙소와 완벽한 서비스를 제공하는 프리미엄 브랜드입니다.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: Crown,
                title: "큐레이션 중심",
                desc: "전문가가 직접 선별한 프리미엄 숙소만을 제공하여 품질을 보장합니다.",
                color: "from-yellow-400 to-orange-500"
              },
              {
                icon: Heart,
                title: "경험 중심",
                desc: "단순한 숙박을 넘어 특별한 추억이 되는 완벽한 경험을 제공합니다.",
                color: "from-pink-400 to-red-500"
              },
              {
                icon: Zap,
                title: "기술 중심",
                desc: "AI 추천 시스템과 스마트 매칭으로 고객 맞춤형 서비스를 구현합니다.",
                color: "from-blue-400 to-purple-500"
              }
            ].map((item, index) => {
              const IconComponent = item.icon
              return (
                <Card key={index} className="p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <CardContent className="p-0 text-center">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${item.color} flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* 시장 분석 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
              Market Analysis
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              거대한 시장 기회
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              국내 프리미엄 숙박 시장은 연평균 15% 성장 중이며, 데이유즈 세그먼트는 연 25% 고성장하고 있습니다.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* 시장 성장 차트 */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">프리미엄 숙박 시장 성장 추이</h3>
              <div className="text-sm text-gray-600 mb-4">
                TAM: 3.75조원 | SAM: 2.25조원 | SOM: 22.5억원 (3년 목표)
              </div>
              <div className="space-y-4">
                {marketData.map((data, index) => (
                  <div key={data.year} className="flex items-center gap-4">
                    <div className="w-16 text-sm font-medium text-gray-700">{data.year}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-gray-600">프리미엄 숙박시장</span>
                        <span className="text-sm font-bold text-gray-900">{data.market}조원</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${(data.market / 50) * 100}%`,
                            transitionDelay: `${index * 100}ms`
                          }}
                        />
                      </div>
                      {data.stayoneday > 0 && (
                        <>
                          <div className="flex items-center gap-2 mb-1 mt-2">
                            <span className="text-sm text-purple-600">스테이원데이</span>
                            <span className="text-sm font-bold text-purple-900">{data.stayoneday}억원</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                              style={{
                                width: `${(data.stayoneday / 10) * 100}%`,
                                transitionDelay: `${index * 100 + 500}ms`
                              }}
                            />
                          </div>
                        </>
                      )}
                      <div className="text-xs text-gray-500 mt-1">{data.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 경쟁사 분석 */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">경쟁 우위</h3>
              <div className="space-y-6">
                {competitors.map((competitor, index) => (
                  <Card key={index} className="p-6 border border-gray-200 hover:border-gray-300 transition-colors">
                    <CardContent className="p-0">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-lg text-gray-900">{competitor.name}</h4>
                          <p className="text-sm text-gray-600">{competitor.market} · {competitor.focus}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          경쟁사
                        </Badge>
                      </div>
                      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r">
                        <p className="text-sm text-red-700">
                          <strong>약점:</strong> {competitor.weakness}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* 우리의 강점 */}
                <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
                  <CardContent className="p-0">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-gray-900">스테이 원데이</h4>
                        <p className="text-sm text-gray-600">국내 · 프리미엄 큐레이션</p>
                      </div>
                      <Badge className="bg-green-500 text-white">
                        Our Edge
                      </Badge>
                    </div>
                    <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded-r">
                      <p className="text-sm text-green-800">
                        <strong>차별화:</strong> 엄격한 품질 기준, 전문가 큐레이션, 한국 시장 특화, 개인화된 서비스
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 비즈니스 모델 */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
              Business Model
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              수익성 있는 비즈니스 모델
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              다각화된 수익 구조와 확장 가능한 비즈니스 모델로 지속 가능한 성장을 실현합니다.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                title: "예약 수수료",
                percentage: "65%",
                amount: "월 1,560만원",
                desc: "호스트로부터 받는 예약 건당 5-15% 수수료",
                color: "from-blue-500 to-cyan-500",
                icon: PieChart
              },
              {
                title: "프리미엄 서비스",
                percentage: "25%",
                amount: "월 600만원",
                desc: "컨시어지, 케어테이킹 등 부가 서비스 수익",
                color: "from-purple-500 to-pink-500",
                icon: Crown
              },
              {
                title: "파트너십",
                percentage: "10%",
                amount: "월 240만원",
                desc: "체험, 액티비티 등 제휴 업체 수수료",
                color: "from-green-500 to-emerald-500",
                icon: Target
              }
            ].map((revenue, index) => {
              const IconComponent = revenue.icon
              return (
                <Card key={index} className="p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${revenue.color}`} />
                  <CardContent className="p-0">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${revenue.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{revenue.title}</h3>
                    <div className="text-3xl font-bold text-gray-900 mb-2">{revenue.percentage}</div>
                    <div className="text-lg font-semibold text-gray-600 mb-4">{revenue.amount}</div>
                    <p className="text-gray-600 text-sm leading-relaxed">{revenue.desc}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* 성장 전략 */}
          <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">성장 로드맵</h3>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  phase: "Phase 1",
                  period: "2024 Q4 - 2025 Q2",
                  focus: "시장 점유율 확대",
                  targets: ["숙소 50개 확장", "월 매출 5,000만원", "사용자 3만명"]
                },
                {
                  phase: "Phase 2",
                  period: "2025 Q3 - Q4",
                  focus: "서비스 다양화",
                  targets: ["프리미엄 서비스", "AI 추천 시스템", "월 매출 1억원"]
                },
                {
                  phase: "Phase 3",
                  period: "2026 Q1 - Q2",
                  focus: "지역 확장",
                  targets: ["전국 주요 도시", "숙소 200개", "월 매출 3억원"]
                },
                {
                  phase: "Phase 4",
                  period: "2026 Q3+",
                  focus: "해외 진출",
                  targets: ["동남아 진출", "IPO 준비", "글로벌 브랜드"]
                }
              ].map((phase, index) => (
                <div key={index} className="text-center group">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white font-bold text-lg">{index + 1}</span>
                  </div>
                  <h4 className="font-bold text-lg text-gray-900 mb-2">{phase.phase}</h4>
                  <p className="text-sm text-gray-600 mb-3">{phase.period}</p>
                  <p className="text-sm font-medium text-gray-800 mb-3">{phase.focus}</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {phase.targets.map((target, i) => (
                      <li key={i} className="flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        {target}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 재무 현황 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
              Financial Overview
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              건전한 재무 구조
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              꾸준한 성장과 함께 건전한 재무 구조를 유지하며, 투자자에게 안정적인 수익을 제공합니다.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* 재무 지표 */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">핵심 재무 지표 (2024)</h3>
              {[
                { label: "총 매출", value: "2억 8,800만원", growth: "+280%", color: "blue" },
                { label: "순이익", value: "8,640만원", growth: "+320%", color: "green" },
                { label: "이익률", value: "30%", growth: "+5%p", color: "purple" },
                { label: "월 성장률", value: "18%", growth: "평균", color: "orange" }
              ].map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div>
                    <h4 className="font-semibold text-gray-900">{metric.label}</h4>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={`bg-${metric.color}-100 text-${metric.color}-800`}>
                      {metric.growth}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* 투자 계획 */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">투자 활용 계획</h3>
              <div className="space-y-4">
                {[
                  { category: "기술 개발", percentage: 40, amount: "12억원", desc: "AI/ML, 플랫폼 고도화" },
                  { category: "마케팅", percentage: 30, amount: "9억원", desc: "브랜드 인지도, 고객 확보" },
                  { category: "운영 확장", percentage: 20, amount: "6억원", desc: "인력 증원, 파트너 확대" },
                  { category: "예비 자금", percentage: 10, amount: "3억원", desc: "리스크 대응, 기회 투자" }
                ].map((plan, index) => (
                  <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{plan.category}</h4>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">{plan.percentage}%</div>
                        <div className="text-sm text-gray-600">{plan.amount}</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${plan.percentage}%`,
                          transitionDelay: `${index * 200}ms`
                        }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">{plan.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 팀 소개 */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-pink-100 text-pink-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
              Our Team
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              경험과 열정을 갖춘 팀
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              다양한 분야의 전문가들이 모여 스테이 원데이의 비전을 현실로 만들어가고 있습니다.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "안태웅",
                role: "CEO & Founder",
                experience: "전 네이버 개발자 · 스타트업 연쇄창업",
                expertise: "제품 기획, 기술 리더십, 사업 전략",
                image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face"
              },
              {
                name: "김혁신",
                role: "CTO",
                experience: "전 카카오 시니어 개발자 · 10년차",
                expertise: "풀스택 개발, AI/ML, 시스템 아키텍처",
                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
              },
              {
                name: "박마케팅",
                role: "CMO",
                experience: "전 쿠팡 마케팅 팀장 · 브랜딩 전문가",
                expertise: "디지털 마케팅, 브랜드 전략, 고객 분석",
                image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face"
              }
            ].map((member, index) => (
              <Card key={index} className="p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group text-center">
                <CardContent className="p-0">
                  <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 ring-4 ring-gray-100 group-hover:ring-blue-200 transition-all duration-300">
                    <OptimizedImage
                      src={member.image}
                      alt={member.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                  <p className="text-blue-600 font-semibold mb-3">{member.role}</p>
                  <p className="text-sm text-gray-600 mb-4">{member.experience}</p>
                  <div className="space-y-2">
                    {member.expertise.split(', ').map((skill, skillIndex) => (
                      <Badge key={skillIndex} variant="outline" className="text-xs mx-1">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 채용 정보 */}
          <div className="mt-16 text-center bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">함께 성장할 동료를 찾습니다</h3>
            <p className="text-gray-600 mb-6">
              스테이 원데이와 함께 숙박 업계의 혁신을 이끌어갈 열정적인 인재를 모집합니다.
            </p>
            <div className="grid md:grid-cols-4 gap-4">
              {['백엔드 개발자', '프론트엔드 개발자', '데이터 분석가', '비즈니스 개발'].map((position, index) => (
                <Badge key={index} className="bg-blue-100 text-blue-800 px-4 py-3 text-sm">
                  {position} 모집중
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 투자 제안 */}
      <section className="py-20 bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
        {/* 배경 효과 */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Badge className="bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-4 backdrop-blur-sm">
              Investment Opportunity
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              지금이 투자의
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                골든 타임
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              급성장하는 시장에서 독보적인 포지션을 확보한 스테이 원데이와 함께 성공의 여정을 시작하세요.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* 투자 하이라이트 */}
            <div className="space-y-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold mb-6">Series A 모집 현황</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>목표 투자금</span>
                    <span className="font-bold text-xl">30억원</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>현재 모집률</span>
                    <span className="font-bold text-xl text-green-400">65%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div className="bg-gradient-to-r from-green-400 to-emerald-400 h-3 rounded-full w-[65%] transition-all duration-1000 ease-out"></div>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-300">
                    <span>투자자 수: 8명</span>
                    <span>평균 투자액: 2.4억원</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">15%</div>
                  <div className="text-sm text-gray-300">예상 연간 수익률</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">5-7X</div>
                  <div className="text-sm text-gray-300">예상 투자 수익 배수</div>
                </div>
              </div>
            </div>

            {/* 투자자 혜택 */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold mb-6">투자자 특별 혜택</h3>
              {[
                {
                  icon: Rocket,
                  title: "조기 투자자 우대",
                  desc: "후속 라운드 우선 참여권 및 특별 할인 제공"
                },
                {
                  icon: Award,
                  title: "의결권 부여",
                  desc: "회사 주요 의사결정 과정 참여 및 이사회 참관권"
                },
                {
                  icon: Globe,
                  title: "네트워킹 기회",
                  desc: "다른 투자자 및 업계 전문가와의 정기적 네트워킹"
                },
                {
                  icon: Heart,
                  title: "서비스 혜택",
                  desc: "스테이 원데이 모든 서비스 평생 30% 할인"
                }
              ].map((benefit, index) => {
                const IconComponent = benefit.icon
                return (
                  <div key={index} className="flex items-start gap-4 bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-2">{benefit.title}</h4>
                      <p className="text-gray-300 text-sm">{benefit.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 inline-block">
              <h3 className="text-2xl font-bold mb-4">투자 문의</h3>
              <p className="text-gray-300 mb-6">
                상세한 사업계획서와 재무자료를 제공해드립니다.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold px-8 py-4 rounded-xl"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  투자 문의하기
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-xl backdrop-blur-sm"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  전화 상담 예약
                </Button>
              </div>
              <div className="mt-4 text-sm text-gray-400">
                <p>이메일: invest@stayoneday.com | 전화: 02-1234-5678</p>
                <p>투자 상담: 평일 09:00-18:00</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Stay OneDay</h3>
              <p className="text-gray-400 text-sm mb-4">
                프리미엄 숙박의 새로운 기준을 제시하는 혁신적인 플랫폼
              </p>
              <div className="flex gap-4">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">회사 정보</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>대표이사: 안태웅</li>
                <li>사업자등록번호: 123-45-67890</li>
                <li>주소: 서울시 강남구 테헤란로</li>
                <li>설립일: 2023년 1월</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">IR 자료</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white">사업계획서 다운로드</Link></li>
                <li><Link href="#" className="hover:text-white">재무제표</Link></li>
                <li><Link href="#" className="hover:text-white">시장분석보고서</Link></li>
                <li><Link href="#" className="hover:text-white">투자설명서</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">연락처</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>이메일: invest@stayoneday.com</li>
                <li>전화: 02-1234-5678</li>
                <li>팩스: 02-1234-5679</li>
                <li>IR 전용: ir@stayoneday.com</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 Stay OneDay. All rights reserved. | Investor Relations Deck</p>
          </div>
        </div>
      </footer>
    </div>
  )
}