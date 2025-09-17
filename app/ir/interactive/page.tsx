'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  TrendingUp,
  Users,
  Building2,
  DollarSign,
  Calculator,
  Plus,
  Minus,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Award,
  Globe,
  ChevronDown,
  ChevronUp,
  Download,
  Printer,
  ArrowRight,
  CheckCircle2,
  Brain,
  Video,
  Crown,
  Heart,
  Waves,
  Home
} from 'lucide-react'
import Header from '@/components/header'

export default function InteractiveIRDeck() {
  const [activeSection, setActiveSection] = useState(0)
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(true)

  // 수익 시뮬레이션 상태 - 입점제안과 동일한 방식
  const [businessParams, setBusinessParams] = useState({
    activeHosts: 25,          // 현재 활성 호스트 수
    avgSessionPrice: 31,      // 평균 세션 가격 (만원)
    sessionsPerHost: 8,       // 호스트당 월 세션 수
    takeRate: 12,             // 플랫폼 수수료 (%)
    saasOptinRate: 35,        // SaaS 구독 옵션율 (%)
    saasMonthlyFee: 9,        // SaaS 월 구독료 (만원)
    premiumRevenue: 15,       // 프리미엄 서비스 수익 (%)
    hostGrowthRate: 15,       // 월 호스트 증가율 (%)
    churnRate: 2              // 월 이탈율 (%)
  })

  // 수익 계산 함수
  const calculateBusinessMetrics = () => {
    const monthlyGMV = businessParams.activeHosts * businessParams.avgSessionPrice * businessParams.sessionsPerHost * 10000 // 만원을 원으로
    const platformRevenue = monthlyGMV * (businessParams.takeRate / 100)
    const saasRevenue = businessParams.activeHosts * (businessParams.saasOptinRate / 100) * businessParams.saasMonthlyFee * 10000
    const premiumRevenue = platformRevenue * (businessParams.premiumRevenue / 100)

    const totalMonthlyRevenue = platformRevenue + saasRevenue + premiumRevenue
    const yearlyRevenue = totalMonthlyRevenue * 12

    // 12개월 후 예상
    const monthlyGrowthRate = (businessParams.hostGrowthRate - businessParams.churnRate) / 100
    const hosts12M = businessParams.activeHosts * Math.pow(1 + monthlyGrowthRate, 12)
    const gmv12M = hosts12M * businessParams.avgSessionPrice * businessParams.sessionsPerHost * 10000
    const revenue12M = (gmv12M * (businessParams.takeRate / 100) +
                       hosts12M * (businessParams.saasOptinRate / 100) * businessParams.saasMonthlyFee * 10000 +
                       (gmv12M * (businessParams.takeRate / 100)) * (businessParams.premiumRevenue / 100)) * 12

    return {
      monthlyGMV,
      platformRevenue,
      saasRevenue,
      premiumRevenue,
      totalMonthlyRevenue,
      yearlyRevenue,
      hosts12M: Math.floor(hosts12M),
      gmv12M,
      revenue12M,
      avgRevenuePerHost: totalMonthlyRevenue / businessParams.activeHosts
    }
  }

  const metrics = calculateBusinessMetrics()

  const sections = [
    {
      id: 'cover',
      title: 'Stay OneDay IR Deck',
      printPage: true
    },
    {
      id: 'problem',
      title: '우리가 해결하는 문제',
      printPage: true
    },
    {
      id: 'solution',
      title: '3방향 가치 창출',
      printPage: true
    },
    {
      id: 'calculator',
      title: '동적 수익 계산기',
      printPage: true
    },
    {
      id: 'business-model',
      title: '비즈니스 모델',
      printPage: true
    },
    {
      id: 'market',
      title: '시장 기회',
      printPage: true
    },
    {
      id: 'team',
      title: '팀 & 로드맵',
      printPage: true
    },
    {
      id: 'investment',
      title: '투자 제안',
      printPage: true
    }
  ]

  const scrollToSection = (index: number) => {
    setActiveSection(index)
    const element = document.getElementById(`section-${index}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* 고정 네비게이션 */}
      <div className="fixed top-20 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 print:hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-4 overflow-x-auto">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(index)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeSection === index
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {index + 1}. {section.title}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                인쇄
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-24">
        {/* Cover Section */}
        <section id="section-0" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white print:min-h-0 print:h-screen print:page-break-after-always">
          <div className="text-center px-8 max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-6xl md:text-8xl font-bold mb-6">Stay OneDay</h1>
              <p className="text-2xl md:text-3xl mb-8 text-blue-200">
                단순 중개를 넘어선 <span className="text-yellow-400">올인원 비즈니스 성장 플랫폼</span>
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Badge className="bg-white/20 text-white px-6 py-3 text-lg backdrop-blur-sm">
                  호스트 비즈니스 파트너
                </Badge>
                <Badge className="bg-white/20 text-white px-6 py-3 text-lg backdrop-blur-sm">
                  AI 마케팅 자동화
                </Badge>
                <Badge className="bg-white/20 text-white px-6 py-3 text-lg backdrop-blur-sm">
                  3방향 가치 창출
                </Badge>
              </div>
            </div>

            {/* 핵심 지표 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <Building2 className="w-8 h-8 text-blue-400 mb-3 mx-auto" />
                <div className="text-3xl font-bold mb-1">{businessParams.activeHosts}</div>
                <div className="text-sm text-gray-300">활성 호스트</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <DollarSign className="w-8 h-8 text-green-400 mb-3 mx-auto" />
                <div className="text-3xl font-bold mb-1">₩{(metrics.monthlyGMV / 100000000).toFixed(1)}억</div>
                <div className="text-sm text-gray-300">월 GMV</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <TrendingUp className="w-8 h-8 text-purple-400 mb-3 mx-auto" />
                <div className="text-3xl font-bold mb-1">₩{(metrics.totalMonthlyRevenue / 10000).toFixed(0)}만</div>
                <div className="text-sm text-gray-300">월 매출</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <Waves className="w-8 h-8 text-cyan-400 mb-3 mx-auto" />
                <div className="text-3xl font-bold mb-1">72%</div>
                <div className="text-sm text-gray-300">풀빌라 비율</div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section id="section-1" className="py-20 bg-gray-50 print:h-screen print:page-break-after-always">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
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
        </section>

        {/* Solution Section */}
        <section id="section-2" className="py-20 bg-white print:h-screen print:page-break-after-always">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
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
        </section>

        {/* 동적 수익 계산기 Section */}
        <section id="section-3" className="py-20 bg-gray-50 print:h-screen print:page-break-after-always">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                실시간 비즈니스 수익 시뮬레이션
              </h2>
              <p className="text-xl text-gray-600">
                투자자가 직접 조정해보는 인터랙티브 계산기 - 이것이 웹 IR의 강점입니다
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* 입력 컨트롤 */}
              <div className="space-y-6">
                <Card className="p-6">
                  <CardHeader className="p-0 mb-6">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Calculator className="w-6 h-6 text-blue-600" />
                      비즈니스 파라미터 조정
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-6">

                    {/* 활성 호스트 수 */}
                    <div>
                      <Label className="text-sm font-medium text-gray-900 mb-3 block">
                        <Building2 className="w-4 h-4 inline mr-1" />
                        활성 호스트 수
                      </Label>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-10 w-10 p-0"
                          onClick={() => setBusinessParams(prev => ({
                            ...prev,
                            activeHosts: Math.max(5, prev.activeHosts - 5)
                          }))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="flex-1 text-center">
                          <Input
                            type="number"
                            value={businessParams.activeHosts}
                            onChange={(e) => setBusinessParams(prev => ({
                              ...prev,
                              activeHosts: Math.max(5, parseInt(e.target.value) || 5)
                            }))}
                            className="text-center text-lg font-bold"
                            min="5"
                            max="500"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-10 w-10 p-0"
                          onClick={() => setBusinessParams(prev => ({
                            ...prev,
                            activeHosts: Math.min(500, prev.activeHosts + 5)
                          }))}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* 평균 세션 가격 */}
                    <div>
                      <Label className="text-sm font-medium text-gray-900 mb-3 block">
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        평균 세션 가격 (만원)
                      </Label>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-10 w-10 p-0"
                          onClick={() => setBusinessParams(prev => ({
                            ...prev,
                            avgSessionPrice: Math.max(15, prev.avgSessionPrice - 1)
                          }))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="flex-1 text-center">
                          <Input
                            type="number"
                            value={businessParams.avgSessionPrice}
                            onChange={(e) => setBusinessParams(prev => ({
                              ...prev,
                              avgSessionPrice: Math.max(15, parseInt(e.target.value) || 15)
                            }))}
                            className="text-center text-lg font-bold"
                            min="15"
                            max="100"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-10 w-10 p-0"
                          onClick={() => setBusinessParams(prev => ({
                            ...prev,
                            avgSessionPrice: Math.min(100, prev.avgSessionPrice + 1)
                          }))}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* 호스트당 월 세션 수 */}
                    <div>
                      <Label className="text-sm font-medium text-gray-900 mb-3 block">
                        <BarChart3 className="w-4 h-4 inline mr-1" />
                        호스트당 월 세션 수
                      </Label>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-10 w-10 p-0"
                          onClick={() => setBusinessParams(prev => ({
                            ...prev,
                            sessionsPerHost: Math.max(2, prev.sessionsPerHost - 1)
                          }))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="flex-1 text-center">
                          <Input
                            type="number"
                            value={businessParams.sessionsPerHost}
                            onChange={(e) => setBusinessParams(prev => ({
                              ...prev,
                              sessionsPerHost: Math.max(2, parseInt(e.target.value) || 2)
                            }))}
                            className="text-center text-lg font-bold"
                            min="2"
                            max="30"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-10 w-10 p-0"
                          onClick={() => setBusinessParams(prev => ({
                            ...prev,
                            sessionsPerHost: Math.min(30, prev.sessionsPerHost + 1)
                          }))}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* 플랫폼 수수료 */}
                    <div>
                      <Label className="text-sm font-medium text-gray-900 mb-3 block">
                        <PieChart className="w-4 h-4 inline mr-1" />
                        플랫폼 수수료 (%)
                      </Label>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-10 w-10 p-0"
                          onClick={() => setBusinessParams(prev => ({
                            ...prev,
                            takeRate: Math.max(5, prev.takeRate - 1)
                          }))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="flex-1 text-center">
                          <Input
                            type="number"
                            value={businessParams.takeRate}
                            onChange={(e) => setBusinessParams(prev => ({
                              ...prev,
                              takeRate: Math.max(5, parseInt(e.target.value) || 5)
                            }))}
                            className="text-center text-lg font-bold"
                            min="5"
                            max="20"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-10 w-10 p-0"
                          onClick={() => setBusinessParams(prev => ({
                            ...prev,
                            takeRate: Math.min(20, prev.takeRate + 1)
                          }))}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </div>

              {/* 결과 표시 */}
              <div className="space-y-6">
                {/* 현재 월 수익 */}
                <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-xl text-blue-900">현재 월 수익 구조</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">월 GMV</span>
                        <span className="text-xl font-bold text-blue-600">
                          ₩{(metrics.monthlyGMV / 100000000).toFixed(1)}억원
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">플랫폼 수수료</span>
                        <span className="text-lg font-bold text-green-600">
                          ₩{(metrics.platformRevenue / 10000).toFixed(0)}만원
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">SaaS 구독료</span>
                        <span className="text-lg font-bold text-purple-600">
                          ₩{(metrics.saasRevenue / 10000).toFixed(0)}만원
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">프리미엄 서비스</span>
                        <span className="text-lg font-bold text-orange-600">
                          ₩{(metrics.premiumRevenue / 10000).toFixed(0)}만원
                        </span>
                      </div>
                      <hr className="border-blue-200" />
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">총 월 매출</span>
                        <span className="text-2xl font-bold text-blue-900">
                          ₩{(metrics.totalMonthlyRevenue / 10000).toFixed(0)}만원
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 12개월 후 예상 */}
                <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-xl text-green-900">12개월 후 예상</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">예상 호스트 수</span>
                        <span className="text-xl font-bold text-green-600">
                          {metrics.hosts12M}개
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">예상 연 GMV</span>
                        <span className="text-xl font-bold text-blue-600">
                          ₩{(metrics.gmv12M * 12 / 1000000000).toFixed(1)}억원
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">예상 연 매출</span>
                        <span className="text-2xl font-bold text-green-900">
                          ₩{(metrics.revenue12M / 100000000).toFixed(1)}억원
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">호스트당 매출 기여</span>
                        <span className="text-lg font-bold text-purple-600">
                          ₩{(metrics.avgRevenuePerHost / 10000).toFixed(0)}만원/월
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 수익성 지표 */}
                <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-xl text-purple-900">수익성 지표</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {((metrics.totalMonthlyRevenue / metrics.monthlyGMV) * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Take Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {businessParams.saasOptinRate}%
                        </div>
                        <div className="text-sm text-gray-600">SaaS 구독률</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {businessParams.hostGrowthRate - businessParams.churnRate}%
                        </div>
                        <div className="text-sm text-gray-600">순성장률/월</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          ₩{(metrics.avgRevenuePerHost / 10000).toFixed(0)}만
                        </div>
                        <div className="text-sm text-gray-600">ARPU/월</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Business Model Section */}
        <section id="section-4" className="py-20 bg-white print:h-screen print:page-break-after-always">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">올인원 비즈니스 모델</h2>
              <p className="text-xl text-gray-600">예약 중개 + 마케팅 에이전시 + SaaS 도구를 하나로</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="p-6 border-l-4 border-green-500">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-lg">예약 수수료</h4>
                  <span className="text-2xl font-bold text-green-600">{businessParams.takeRate}%</span>
                </div>
                <p className="text-gray-600 mb-3">프라임타임 예약 금액 기준</p>
                <div className="text-sm text-gray-500">
                  현재: ₩{(metrics.platformRevenue / 10000).toFixed(0)}만원/월
                </div>
              </Card>

              <Card className="p-6 border-l-4 border-blue-500">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-lg">SaaS 구독</h4>
                  <span className="text-2xl font-bold text-blue-600">₩{businessParams.saasMonthlyFee}만원</span>
                </div>
                <p className="text-gray-600 mb-3">AI 마케팅 도구 + 분석 리포트</p>
                <div className="text-sm text-gray-500">
                  옵션율: {businessParams.saasOptinRate}% ({Math.floor(businessParams.activeHosts * businessParams.saasOptinRate / 100)}개 호스트)
                </div>
              </Card>

              <Card className="p-6 border-l-4 border-purple-500">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-lg">프리미엄 서비스</h4>
                  <span className="text-2xl font-bold text-purple-600">{businessParams.premiumRevenue}%</span>
                </div>
                <p className="text-gray-600 mb-3">전문 촬영, 컨설팅, B2B 패키지</p>
                <div className="text-sm text-gray-500">
                  현재: ₩{(metrics.premiumRevenue / 10000).toFixed(0)}만원/월
                </div>
              </Card>
            </div>

            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">vs 기존 솔루션</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-bold text-lg text-red-600">기존 방식</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-red-50 rounded">
                      <span>마케팅 에이전시</span>
                      <span className="font-bold text-red-600">월 200만원+</span>
                    </div>
                    <div className="flex justify-between p-3 bg-red-50 rounded">
                      <span>콘텐츠 제작</span>
                      <span className="font-bold text-red-600">월 100만원+</span>
                    </div>
                    <div className="flex justify-between p-3 bg-red-50 rounded">
                      <span>예약 관리 시스템</span>
                      <span className="font-bold text-red-600">월 50만원+</span>
                    </div>
                    <div className="flex justify-between p-3 bg-red-100 rounded font-bold">
                      <span>총 비용</span>
                      <span className="text-red-700">월 350만원+</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-lg text-green-600">Stay OneDay</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-green-50 rounded">
                      <span>올인원 솔루션</span>
                      <span className="font-bold text-green-600">수수료 {businessParams.takeRate}%</span>
                    </div>
                    <div className="flex justify-between p-3 bg-green-50 rounded">
                      <span>SaaS 구독 (선택)</span>
                      <span className="font-bold text-green-600">월 {businessParams.saasMonthlyFee}만원</span>
                    </div>
                    <div className="flex justify-between p-3 bg-green-50 rounded">
                      <span>성과 기반 과금</span>
                      <span className="font-bold text-green-600">예약시에만</span>
                    </div>
                    <div className="flex justify-between p-3 bg-green-100 rounded font-bold">
                      <span>실제 비용 (월 8세션)</span>
                      <span className="text-green-700">약 월 {Math.floor((businessParams.avgSessionPrice * businessParams.sessionsPerHost * businessParams.takeRate / 100) + businessParams.saasMonthlyFee)}만원</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Market Section */}
        <section id="section-5" className="py-20 bg-gray-50 print:h-screen print:page-break-after-always">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">시장 기회와 확장성</h2>
              <p className="text-xl text-gray-600">보수적 추정으로 지속가능한 성장 계획</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">TAM/SAM/SOM 분석</h3>
                <div className="space-y-6">
                  <Card className="p-6 border-l-4 border-blue-500">
                    <h4 className="font-bold text-lg text-blue-900 mb-2">TAM</h4>
                    <div className="text-3xl font-bold text-blue-600 mb-2">3.75조원</div>
                    <p className="text-gray-600">국내 프리미엄 숙박 시장</p>
                  </Card>

                  <Card className="p-6 border-l-4 border-green-500">
                    <h4 className="font-bold text-lg text-green-900 mb-2">SAM</h4>
                    <div className="text-3xl font-bold text-green-600 mb-2">2.25조원</div>
                    <p className="text-gray-600">데이유즈 적합 프리미엄 숙박</p>
                  </Card>

                  <Card className="p-6 border-l-4 border-purple-500">
                    <h4 className="font-bold text-lg text-purple-900 mb-2">SOM</h4>
                    <div className="text-3xl font-bold text-purple-600 mb-2">22.5억원</div>
                    <p className="text-gray-600">3년 내 목표 점유율 0.1%</p>
                  </Card>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">성장 로드맵</h3>
                <div className="space-y-4">
                  {[
                    { period: '현재', hosts: businessParams.activeHosts, gmv: metrics.monthlyGMV / 100000000, status: 'current' },
                    { period: '6개월', hosts: Math.floor(businessParams.activeHosts * 1.5), gmv: (metrics.monthlyGMV * 1.8) / 100000000, status: 'near' },
                    { period: '12개월', hosts: metrics.hosts12M, gmv: metrics.gmv12M / 100000000, status: 'target' },
                    { period: '24개월', hosts: Math.floor(metrics.hosts12M * 2), gmv: (metrics.gmv12M * 3) / 100000000, status: 'future' }
                  ].map((milestone, index) => (
                    <Card key={index} className={`p-4 ${milestone.status === 'current' ? 'bg-blue-50 border-blue-200' : milestone.status === 'target' ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-lg">{milestone.period}</h4>
                          <p className="text-sm text-gray-600">{milestone.hosts}개 호스트</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">₩{milestone.gmv.toFixed(1)}억</div>
                          <div className="text-sm text-gray-600">월 GMV</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <h4 className="font-bold text-yellow-900 mb-3">핵심 성장 동력</h4>
                  <ul className="text-yellow-800 space-y-2 text-sm">
                    <li>• 월 {businessParams.hostGrowthRate}% 호스트 증가 (순성장률 {businessParams.hostGrowthRate - businessParams.churnRate}%)</li>
                    <li>• SaaS 구독률 점진적 증가 ({businessParams.saasOptinRate}% → 60%)</li>
                    <li>• AI 마케팅으로 호스트당 세션 수 증가</li>
                    <li>• B2B 시장 진입으로 프리미엄 서비스 확대</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team & Roadmap Section */}
        <section id="section-6" className="py-20 bg-white print:h-screen print:page-break-after-always">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">팀과 로드맵</h2>
              <p className="text-xl text-gray-600">검증된 기술력과 명확한 실행 계획</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-8">핵심 역량</h3>
                <div className="space-y-6">
                  <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50">
                    <h4 className="font-bold text-lg text-blue-900 mb-3">풀스택 개발 역량</h4>
                    <ul className="text-sm text-blue-800 space-y-2">
                      <li>• Next.js 15, TypeScript, Supabase 최신 스택</li>
                      <li>• 서버사이드 렌더링, 이미지 최적화 등 성능 최적화</li>
                      <li>• RLS 기반 보안 아키텍처 구현</li>
                    </ul>
                  </Card>

                  <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50">
                    <h4 className="font-bold text-lg text-green-900 mb-3">비즈니스 검증</h4>
                    <ul className="text-sm text-green-800 space-y-2">
                      <li>• 25개 실제 숙소 온보딩 완료</li>
                      <li>• 수익 시뮬레이션 도구로 호스트 납득도 확보</li>
                      <li>• 3방향 가치 창출 모델 검증</li>
                    </ul>
                  </Card>

                  <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50">
                    <h4 className="font-bold text-lg text-purple-900 mb-3">AI 기술 적용</h4>
                    <ul className="text-sm text-purple-800 space-y-2">
                      <li>• 콘텐츠 자동 생성, 수요 예측 시스템</li>
                      <li>• 사용자 편의 중심의 AI 활용</li>
                      <li>• 데이터 기반 의사결정 지원</li>
                    </ul>
                  </Card>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-8">12개월 로드맵</h3>
                <div className="space-y-6">
                  {[
                    {
                      quarter: 'Q1 2025',
                      title: '마케팅 자동화 완성',
                      goals: ['AI 콘텐츠 제작 도구', '인플루언서 매칭 시스템', 'SEO 자동화']
                    },
                    {
                      quarter: 'Q2 2025',
                      title: '사업 확장',
                      goals: ['호스트 50개 달성', 'B2B 기업 고객 확보', 'SaaS 구독률 50%']
                    },
                    {
                      quarter: 'Q3 2025',
                      title: '지역 확산',
                      goals: ['전국 주요 도시 진출', '호스트 100개 달성', '월 GMV 10억 달성']
                    },
                    {
                      quarter: 'Q4 2025',
                      title: '플랫폼 고도화',
                      goals: ['AI 예측 정확도 향상', '프리미엄 서비스 다양화', '해외 진출 준비']
                    }
                  ].map((roadmap, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-blue-600 font-medium">{roadmap.quarter}</div>
                        <h4 className="font-bold text-lg text-gray-900">{roadmap.title}</h4>
                        <ul className="text-gray-600 text-sm space-y-1">
                          {roadmap.goals.map((goal, goalIndex) => (
                            <li key={goalIndex}>• {goal}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Investment Section */}
        <section id="section-7" className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white print:h-screen print:page-break-after-always">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">투자 제안</h2>
              <p className="text-xl text-blue-200">검증된 비즈니스 모델과 탄탄한 기술력</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                  <h3 className="text-2xl font-bold mb-6">투자 요청</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg">투자 규모</span>
                      <span className="text-3xl font-bold text-yellow-400">5억원</span>
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
                  <h3 className="text-2xl font-bold mb-6">예상 성과 (12개월)</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400">{metrics.hosts12M}개</div>
                      <div className="text-sm text-gray-300">파트너 호스트</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400">₩{(metrics.gmv12M * 12 / 1000000000).toFixed(1)}억</div>
                      <div className="text-sm text-gray-300">연간 GMV</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-400">₩{(metrics.revenue12M / 100000000).toFixed(1)}억</div>
                      <div className="text-sm text-gray-300">연간 매출</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-400">50%+</div>
                      <div className="text-sm text-gray-300">SaaS 구독률</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
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
                  <p>웹사이트: stayoneday.co.kr</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 1cm;
          }

          .print\\:h-screen {
            height: 100vh;
          }

          .print\\:min-h-0 {
            min-height: 0;
          }

          .print\\:page-break-after-always {
            page-break-after: always;
          }

          .print\\:hidden {
            display: none;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  )
}