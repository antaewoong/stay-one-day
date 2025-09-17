'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Send, CheckCircle, Calculator, Plus, Minus, TrendingUp, Building2, Users, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PartnershipPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    businessType: '',
    inquiry: ''
  })

  // 수익 시뮬레이션 상태
  const [simulationData, setSimulationData] = useState({
    baseCost: 300000,        // 기본 비용 (데이유즈 기준, 30만원 시작)
    guestCount: 5,           // 인원 수
    salesDays: 30,           // 월 판매 목표 일수
    platformFee: 5           // 플랫폼 수수료
  })

  // 수익 계산 함수
  const calculateRevenue = () => {
    const basePersons = 4 // 기준 인원
    const extraPersons = Math.max(0, simulationData.guestCount - basePersons)
    const extraPersonFee = extraPersons * 40000 // 초과 인원당 4만원

    const pricePerNight = simulationData.baseCost + extraPersonFee
    const monthlyRevenue = pricePerNight * simulationData.salesDays
    const platformFeeAmount = Math.floor(monthlyRevenue * (simulationData.platformFee / 100))
    const netRevenue = monthlyRevenue - platformFeeAmount
    const yearlyRevenue = netRevenue * 12

    return {
      pricePerNight,
      extraPersons,
      extraPersonFee,
      monthlyRevenue,
      platformFeeAmount,
      netRevenue,
      yearlyRevenue,
      salesDays: simulationData.salesDays
    }
  }

  const revenue = calculateRevenue()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // 실제 구현에서는 API 호출
    setIsSubmitted(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5 mr-2" />
                홈으로
              </Link>
              <div className="text-lg font-light tracking-tight">
                stay<span className="font-medium">oneday</span>
              </div>
            </div>
          </div>
        </div>

        {/* 성공 메시지 */}
        <div className="container mx-auto px-4 py-16 max-w-lg text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-gray-700" />
            </div>
            <h1 className="text-2xl font-light text-gray-900 mb-4">문의가 접수되었습니다</h1>
            <p className="text-gray-600 leading-relaxed">
              제휴문의를 주셔서 감사합니다.<br />
              담당자가 검토 후 영업일 기준 2-3일 내에<br />
              회신드리겠습니다.
            </p>
          </div>
          <div className="space-y-4">
            <Button 
              onClick={() => setIsSubmitted(false)} 
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 text-sm font-medium"
            >
              다른 문의 작성하기
            </Button>
            <div>
              <Link href="/" className="text-gray-600 hover:text-gray-900 underline text-sm">
                홈페이지로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" />
              홈으로
            </Link>
            <div className="text-lg font-light tracking-tight">
              stay<span className="font-medium">oneday</span>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-light text-gray-900 mb-4">제휴 문의</h1>
          <p className="text-gray-600 leading-relaxed">
            스테이 원데이와 함께 성장할 파트너를 찾고 있습니다.<br />
            다양한 협력 방안에 대해 논의해보세요.
          </p>
        </div>
        
        {/* 제휴 분야 안내 */}
        <div className="mb-12 p-8 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-medium text-gray-900 mb-6">제휴 분야</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="text-gray-700">• 마케팅 및 광고 협력</p>
              <p className="text-gray-700">• 기술 연동 및 API 제휴</p>
              <p className="text-gray-700">• 콘텐츠 파트너십</p>
            </div>
            <div className="space-y-2">
              <p className="text-gray-700">• 기업 복리후생 서비스</p>
              <p className="text-gray-700">• 브랜드 협력</p>
              <p className="text-gray-700">• 기타 사업 협력</p>
            </div>
          </div>
        </div>

        {/* 수익 시뮬레이션 계산기 */}
        <div className="mb-12">
          <Card className="border-2 border-blue-100">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center gap-2 text-xl text-gray-900">
                <Calculator className="w-6 h-6 text-blue-600" />
                간편 수익 계산기
              </CardTitle>
              <p className="text-gray-600 text-sm">
                기본 조건을 입력하면 예상 수익이 자동으로 계산됩니다
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* 입력 컨트롤 */}
                <div className="space-y-6">
                  <h3 className="font-semibold text-gray-900 mb-4">기본 정보 입력</h3>

                  {/* 기본 비용 (1박) */}
                  <div>
                    <Label className="text-sm font-medium text-gray-900 mb-3 block">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      데이유즈 기본 요금 (4명 기준)
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={simulationData.baseCost}
                        onChange={(e) => setSimulationData(prev => ({
                          ...prev,
                          baseCost: Math.max(300000, parseInt(e.target.value) || 300000)
                        }))}
                        className="text-right pr-12 text-lg font-medium"
                        min="300000"
                        max="700000"
                        step="10000"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">원</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      데이유즈 기준 4명 이용 시 받을 금액 (30~70만원)
                    </p>
                  </div>

                  {/* 예상 인원 */}
                  <div>
                    <Label className="text-sm font-medium text-gray-900 mb-3 block">
                      <Users className="w-4 h-4 inline mr-1" />
                      평균 이용 인원
                    </Label>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 p-0"
                        disabled={simulationData.guestCount <= 1}
                        onClick={() => setSimulationData(prev => ({
                          ...prev,
                          guestCount: Math.max(1, prev.guestCount - 1)
                        }))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>

                      <div className="flex-1 text-center">
                        <div className="text-2xl font-bold text-gray-900">{simulationData.guestCount}명</div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 p-0"
                        disabled={simulationData.guestCount >= 20}
                        onClick={() => setSimulationData(prev => ({
                          ...prev,
                          guestCount: Math.min(20, prev.guestCount + 1)
                        }))}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      기준 4명 초과시 인당 +4만원 추가
                    </div>
                  </div>

                  {/* 월 판매 목표 일수 */}
                  <div>
                    <Label className="text-sm font-medium text-gray-900 mb-3 block">
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      월 판매 목표 (일수)
                    </Label>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 p-0"
                        disabled={simulationData.salesDays <= 5}
                        onClick={() => setSimulationData(prev => ({
                          ...prev,
                          salesDays: Math.max(5, prev.salesDays - 1)
                        }))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>

                      <div className="flex-1 text-center">
                        <div className="text-2xl font-bold text-gray-900">{simulationData.salesDays}일</div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 p-0"
                        disabled={simulationData.salesDays >= 30}
                        onClick={() => setSimulationData(prev => ({
                          ...prev,
                          salesDays: Math.min(30, prev.salesDays + 1)
                        }))}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      한 달에 몇 일 정도 예약받을 계획인지 입력하세요
                    </p>
                  </div>
                </div>

                {/* 결과 표시 - 애니메이션 게이지 */}
                <div className="space-y-6">
                  <h3 className="font-semibold text-gray-900 mb-6">💰 실시간 수익 시뮬레이션</h3>

                  {/* 1일 요금 게이지 - 더 예쁜 디자인 */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200 shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-semibold text-blue-800">데이유즈 요금</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">₩{revenue.pricePerNight.toLocaleString()}</span>
                    </div>
                    <div className="relative h-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 rounded-full transition-all duration-1500 ease-out"
                        style={{
                          width: `${Math.min(100, (revenue.pricePerNight / 800000) * 100)}%`,
                          boxShadow: '0 0 20px rgba(59, 130, 246, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.3)'
                        }}
                      >
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-transparent via-white/20 to-white/40 rounded-full"></div>
                      </div>
                      <div className="absolute inset-0 rounded-full border border-white/30"></div>
                    </div>
                    <div className="mt-3 text-xs text-blue-600 bg-white/50 rounded-lg p-2">
                      기본 ₩{simulationData.baseCost.toLocaleString()} + 추가인원 ₩{revenue.extraPersonFee.toLocaleString()}
                    </div>
                  </div>

                  {/* 월 매출 게이지 - 더 예쁜 디자인 */}
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200 shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-semibold text-emerald-800">월 총 매출</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">₩{revenue.monthlyRevenue.toLocaleString()}</span>
                    </div>
                    <div className="relative h-7 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 via-green-500 to-green-600 rounded-full transition-all duration-1800 ease-out"
                        style={{
                          width: `${Math.min(100, (revenue.monthlyRevenue / 25000000) * 100)}%`,
                          boxShadow: '0 0 25px rgba(34, 197, 94, 0.7), inset 0 2px 6px rgba(255, 255, 255, 0.4)'
                        }}
                      >
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-transparent via-white/20 to-white/50 rounded-full"></div>
                        <div className="absolute top-1 left-0 w-full h-1 bg-white/60 rounded-full"></div>
                      </div>
                      <div className="absolute inset-0 rounded-full border border-white/30"></div>
                    </div>
                    <div className="mt-3 text-xs text-emerald-700 bg-white/60 rounded-lg p-2">
                      {revenue.salesDays}일 × ₩{revenue.pricePerNight.toLocaleString()} = ₩{revenue.monthlyRevenue.toLocaleString()}
                    </div>
                  </div>

                  {/* 수수료 차감 게이지 - 더 예쁜 디자인 */}
                  <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-6 border border-rose-200 shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-semibold text-rose-800">플랫폼 수수료</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">-₩{revenue.platformFeeAmount.toLocaleString()}</span>
                    </div>
                    <div className="relative h-5 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-rose-400 via-rose-500 to-pink-500 rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${simulationData.platformFee * 4}%`, // 5%면 20%까지 표시
                          boxShadow: '0 0 15px rgba(244, 63, 94, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.3)'
                        }}
                      >
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-transparent via-white/20 to-white/40 rounded-full"></div>
                      </div>
                      <div className="absolute inset-0 rounded-full border border-white/30"></div>
                    </div>
                    <div className="mt-3 text-xs text-rose-700 bg-white/60 rounded-lg p-2">
                      매출의 {simulationData.platformFee}% 차감 (업계 최저 수수료!)
                    </div>
                  </div>

                  {/* 월 순수익 - 메인 결과 */}
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8 border-2 border-purple-200 shadow-lg">
                    <div className="text-center mb-4">
                      <div className="text-sm text-gray-600 mb-2">월 순수익</div>
                      <div className="text-4xl font-bold text-purple-600 mb-4">
                        ₩{revenue.netRevenue.toLocaleString()}
                      </div>
                    </div>

                    {/* 원형 진행률 표시 */}
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 128 128">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-gray-200"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-purple-500"
                          strokeDasharray={`${2 * Math.PI * 56}`}
                          strokeDashoffset={`${2 * Math.PI * 56 * (1 - Math.min(1, revenue.netRevenue / 10000000))}`}
                          style={{
                            transition: 'stroke-dashoffset 1.5s ease-out',
                            filter: 'drop-shadow(0 0 6px rgba(147, 51, 234, 0.4))'
                          }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-sm font-medium text-purple-600">
                            {Math.round(Math.min(100, (revenue.netRevenue / 10000000) * 100))}%
                          </div>
                          <div className="text-xs text-gray-500">목표 대비</div>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 text-center">
                      월 목표 수익 1,000만원 기준
                    </div>
                  </div>

                  {/* 연간 수익 예측 */}
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">연간 예상 수익</div>
                      <div className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                        ₩{revenue.yearlyRevenue.toLocaleString()}
                      </div>
                    </div>

                    {/* 연간 수익 바 차트 */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>0원</span>
                        <span>1억원</span>
                        <span>2억원</span>
                      </div>
                      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-600 rounded-full transition-all duration-2000 ease-out"
                          style={{
                            width: `${Math.min(100, (revenue.yearlyRevenue / 200000000) * 100)}%`,
                            boxShadow: '0 0 15px rgba(251, 191, 36, 0.6)'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 성과 지표 카드들 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                      <div className="text-2xl font-bold text-blue-600">{revenue.salesDays}</div>
                      <div className="text-xs text-gray-500">월 운영일수</div>
                      <div className="mt-2 h-1 bg-blue-100 rounded-full">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                          style={{ width: `${(revenue.salesDays / 30) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                      <div className="text-2xl font-bold text-green-600">{simulationData.guestCount}</div>
                      <div className="text-xs text-gray-500">평균 이용인원</div>
                      <div className="mt-2 h-1 bg-green-100 rounded-full">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all duration-1000"
                          style={{ width: `${(simulationData.guestCount / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1 bg-gray-50 rounded-lg p-3">
                    <p>🎯 인터랙티브 시뮬레이션: 실시간 계산 결과</p>
                    <p>📊 게이지바는 실제 수익률을 시각적으로 표현합니다</p>
                    <p>💡 조건 변경시 즉시 반영되어 최적 조건을 찾을 수 있습니다</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 문의 폼 */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="companyName" className="text-sm font-medium text-gray-900 mb-2 block">
                회사명 *
              </Label>
              <Input
                id="companyName"
                name="companyName"
                type="text"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="회사명을 입력하세요"
                className="border-gray-200 focus:border-gray-400 focus:ring-0"
                required
              />
            </div>
            <div>
              <Label htmlFor="contactName" className="text-sm font-medium text-gray-900 mb-2 block">
                담당자명 *
              </Label>
              <Input
                id="contactName"
                name="contactName"
                type="text"
                value={formData.contactName}
                onChange={handleChange}
                placeholder="담당자명을 입력하세요"
                className="border-gray-200 focus:border-gray-400 focus:ring-0"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-900 mb-2 block">
                이메일 *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contact@company.com"
                className="border-gray-200 focus:border-gray-400 focus:ring-0"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-gray-900 mb-2 block">
                연락처
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="010-1234-5678"
                className="border-gray-200 focus:border-gray-400 focus:ring-0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="businessType" className="text-sm font-medium text-gray-900 mb-2 block">
              제휴 분야 *
            </Label>
            <select
              id="businessType"
              name="businessType"
              value={formData.businessType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:border-gray-400 focus:outline-none"
              required
            >
              <option value="">선택해주세요</option>
              <option value="marketing">마케팅 및 광고 협력</option>
              <option value="tech">기술 연동 및 API 제휴</option>
              <option value="content">콘텐츠 파트너십</option>
              <option value="corporate">기업 복리후생 서비스</option>
              <option value="brand">브랜드 협력</option>
              <option value="other">기타</option>
            </select>
          </div>

          <div>
            <Label htmlFor="inquiry" className="text-sm font-medium text-gray-900 mb-2 block">
              문의 내용 *
            </Label>
            <Textarea
              id="inquiry"
              name="inquiry"
              value={formData.inquiry}
              onChange={handleChange}
              placeholder="제휴 제안 내용, 협력 방향, 기대 효과 등을 자세히 작성해주세요.&#10;&#10;예시:&#10;- 제휴 제안 배경&#10;- 구체적인 협력 방안&#10;- 상호 기대 효과&#10;- 제안하는 조건"
              rows={8}
              className="border-gray-200 focus:border-gray-400 focus:ring-0 resize-none"
              required
            />
            <p className="mt-2 text-xs text-gray-500">
              최소 100자 이상 작성해주세요. ({formData.inquiry.length}/100)
            </p>
          </div>

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="privacy"
              className="mt-1 h-4 w-4 text-gray-900 border-gray-300 rounded focus:ring-0 focus:ring-offset-0"
              required
            />
            <label htmlFor="privacy" className="text-sm text-gray-600 leading-relaxed">
              개인정보 수집 및 이용에 동의합니다. 
              <Link href="/privacy" className="text-gray-900 underline hover:text-gray-700 ml-1">
                개인정보처리방침 보기
              </Link>
            </label>
          </div>

          <div className="pt-6">
            <Button 
              type="submit" 
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 font-medium"
              disabled={formData.inquiry.length < 100}
            >
              <Send className="w-4 h-4 mr-2" />
              제휴문의 보내기
            </Button>
            <p className="text-center text-xs text-gray-500 mt-4">
              영업일 기준 2-3일 내에 검토 후 회신드립니다.
            </p>
          </div>
        </form>

        {/* 연락처 정보 */}
        <div className="mt-16 pt-8 border-t border-gray-200 text-center">
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong className="text-gray-900">(주)스테이원데이</strong></p>
            <p>제휴문의: info@nuklabs.com</p>
            <p>대표전화: 1588-1234</p>
          </div>
        </div>
      </div>
    </div>
  )
}