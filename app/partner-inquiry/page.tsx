'use client'

import { useState } from 'react'
import { ArrowLeft, ChevronDown, CheckCircle, Star, Calendar, CreditCard, Bell, TrendingUp, Home, Camera, Heart, ArrowRight, Mail, Phone, Clock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import PartnerInquiryModal from '@/components/PartnerInquiryModal'
import HostDashboardPreview from '@/components/HostDashboardPreview'

export default function PartnerInquiryPage() {
  const [openFAQ, setOpenFAQ] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [estimatorValues, setEstimatorValues] = useState({
    idleDays: 10,
    dayRate: 350000,
    commission: 5
  })

  const toggleFAQ = (faqId: string) => {
    setOpenFAQ(prev => 
      prev.includes(faqId) 
        ? prev.filter(id => id !== faqId)
        : [...prev, faqId]
    )
  }

  const calculateRevenue = () => {
    const monthlyRevenue = estimatorValues.idleDays * estimatorValues.dayRate
    const commission = monthlyRevenue * (estimatorValues.commission / 100)
    const netRevenue = monthlyRevenue - commission
    return { monthlyRevenue, commission, netRevenue }
  }

  const { monthlyRevenue, commission, netRevenue } = calculateRevenue()

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-gray-100)' }}>
      {/* Navigation */}
      <nav 
        className="sticky top-0 z-50 transition-all duration-300"
        style={{ 
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.05)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="text-lg font-light tracking-tight">
                stay<span className="font-medium">oneday</span>
              </span>
            </Link>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-black font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:bg-gray-100"
            >
              입점 문의하기
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="py-20 lg:py-32 relative overflow-hidden"
        style={{ 
          background: 'linear-gradient(135deg, rgba(249, 250, 251, 0.9) 0%, rgba(243, 244, 246, 0.8) 50%, rgba(229, 231, 235, 0.7) 100%)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-purple-50/30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-light mb-6 text-gray-900 leading-tight">
              스테이 원데이와 함께<br />새로운 가능성을.
            </h1>
            <p className="text-lg md:text-xl mb-10 text-gray-600 leading-relaxed">
              비어있는 날을 수익으로 바꾸는 프리미엄 데이유즈 플랫폼
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="font-semibold px-12 py-4 text-xl rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl text-white"
              style={{ backgroundColor: 'var(--color-mint-500)' }}
            >
              입점 문의하기
              <ArrowRight className="w-6 h-6 ml-3 text-white" />
            </Button>
          </div>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-light mb-4 text-gray-900">
              Why Stay‑OneDay?
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Clock className="w-8 h-8 text-gray-700" />,
                title: '하루 한 팀 전용',
                description: '15:00–23:00, 완전 프라이빗 이용으로 프리미엄 경험 제공'
              },
              {
                icon: <TrendingUp className="w-8 h-8 text-gray-700" />,
                title: '높은 수익성',
                description: '숙박 대비 더 많은 인원 이용 가능, 8시간 동안 숙박료와 유사한 매출 창출'
              },
              {
                icon: <Star className="w-8 h-8 text-gray-700" />,
                title: '유휴일 매출화',
                description: '숙박이 없는 날에도 안정적 수익 창출로 연간 매출 30% 이상 증대'
              }
            ].map((item, index) => (
              <Card 
                key={index}
                className="p-6 text-center border border-gray-100 hover:shadow-sm transition-shadow"
              >
                <CardContent className="p-0">
                  <div className="mb-4">{item.icon}</div>
                  <h3 className="text-lg font-medium mb-3 text-gray-900">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Territory Protection Policy Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-light mb-4 text-gray-900">
              지역별 영업권 보장
            </h2>
            <p className="text-gray-600 leading-relaxed">
              선입점 파트너사의 권익을 보호하는 상생 협력 정책을 운영합니다
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">영업권 보호 원칙</h3>
              </div>
              <div className="space-y-3 text-gray-600">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-sm leading-relaxed">
                    반경 10KM(카카오맵 기준) 이내 추가 입점 문의 시 소정의 검토 절차를 진행합니다.
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-sm leading-relaxed">
                    동일 컨셉 또는 유사 유형의 스테이 입점 시 기입점 업체의 의견을 최우선으로 반영합니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">파트너 우선 정책</h3>
              </div>
              <div className="space-y-3 text-gray-600">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-sm leading-relaxed">
                    선입점 파트너사에게는 지역 내 우선권과 특별한 마케팅 지원을 제공합니다.
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-sm leading-relaxed">
                    상호 존중과 협력을 바탕으로 지속 가능한 성장 파트너십을 구축합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center py-8 px-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <div className="flex justify-center mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-sm text-gray-700 mb-2 font-medium">
              프리미엄 데이유즈 시장의 선도업체로 자리잡을 수 있는 기회입니다
            </p>
            <p className="text-xs text-gray-500">
              지역별 제한된 파트너십으로 독점적 지위를 보장합니다
            </p>
          </div>
        </div>
      </section>

      {/* What We Provide Section */}
      <section className="py-12 relative" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%)' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-indigo-50/20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-light mb-2 text-gray-900">
              What We Provide
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <Calendar />, title: '실시간 예약 시스템', desc: '캘린더·가격관리 통합 솔루션' },
              { icon: <CreditCard />, title: '결제/정산 통합', desc: 'Toss/카카오페이/카드 결제 지원' },
              { icon: <Bell />, title: '카카오 알림톡', desc: '예약/변경/취소 자동안내' },
              { icon: <TrendingUp />, title: '브랜딩 노출', desc: '콘텐츠·SNS·추천 영역 마케팅' }
            ].map((item, index) => (
              <div 
                key={index} 
                className="text-center p-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)'
                }}
              >
                <div 
                  className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{ 
                    background: 'rgba(16, 185, 129, 0.15)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}
                >
                  <div style={{ color: 'var(--color-mint-500)' }}>
                    {item.icon}
                  </div>
                </div>
                <h3 
                  className="text-base font-semibold mb-2"
                  style={{ color: 'var(--color-navy-900)' }}
                >
                  {item.title}
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-gray-600)' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Host Dashboard Preview */}
      <section className="py-20" style={{ backgroundColor: 'var(--color-gray-50)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: 'var(--color-navy-900)', fontFamily: 'var(--font-display)' }}
            >
              호스트 관리 시스템
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              직관적이고 강력한 호스트 전용 대시보드로 예약부터 정산까지 한 번에 관리하세요
            </p>
          </div>
          
          <div className="flex justify-center">
            <HostDashboardPreview />
          </div>
        </div>
      </section>

      {/* Revenue Estimator */}
      <section 
        className="py-20 relative"
        style={{ 
          background: 'linear-gradient(135deg, rgba(243, 244, 246, 0.9) 0%, rgba(249, 250, 251, 0.8) 100%)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 to-teal-50/20"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: 'var(--color-navy-900)', fontFamily: 'var(--font-display)' }}
            >
              예상 수익 계산기
            </h2>
            <p style={{ color: 'var(--color-gray-600)' }}>
              간단한 정보 입력으로 월 예상 수익을 확인해보세요
            </p>
          </div>

          <Card 
            className="p-8 border-0 transition-all duration-300"
            style={{ 
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
            }}
          >
            <CardContent className="p-0">
              <div className="grid md:grid-cols-3 gap-8">
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-navy-900)' }}>
                    월 비가동 일수
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="20"
                    value={estimatorValues.idleDays}
                    onChange={(e) => setEstimatorValues(prev => ({ ...prev, idleDays: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-center mt-2">
                    <span 
                      className="text-lg font-bold"
                      style={{ color: 'var(--color-mint-500)' }}
                    >
                      {estimatorValues.idleDays}일
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-navy-900)' }}>
                    데이유즈 요금
                  </label>
                  <input
                    type="range"
                    min="200000"
                    max="500000"
                    step="50000"
                    value={estimatorValues.dayRate}
                    onChange={(e) => setEstimatorValues(prev => ({ ...prev, dayRate: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-center mt-2">
                    <span 
                      className="text-lg font-bold"
                      style={{ color: 'var(--color-mint-500)' }}
                    >
                      {estimatorValues.dayRate.toLocaleString()}원
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-navy-900)' }}>
                    수수료율
                  </label>
                  <div className="text-center">
                    <span 
                      className="text-2xl font-bold"
                      style={{ color: 'var(--color-mint-500)' }}
                    >
                      {estimatorValues.commission}%
                    </span>
                    <p className="text-sm mt-2" style={{ color: 'var(--color-gray-500)' }}>
                      업계 최저 수수료
                    </p>
                  </div>
                </div>
              </div>

              <div 
                className="mt-8 p-6 rounded-xl text-center"
                style={{ backgroundColor: 'var(--color-navy-900)' }}
              >
                <h3 
                  className="text-lg font-semibold mb-4"
                  style={{ color: 'var(--color-white)' }}
                >
                  월 예상 수익
                </h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs opacity-70" style={{ color: 'var(--color-gray-200)' }}>총 매출</p>
                    <p 
                      className="text-base font-bold break-all"
                      style={{ color: 'var(--color-mint-500)' }}
                    >
                      {monthlyRevenue.toLocaleString()}원
                    </p>
                  </div>
                  <div>
                    <p className="text-xs opacity-70" style={{ color: 'var(--color-gray-200)' }}>수수료</p>
                    <p 
                      className="text-base font-bold break-all"
                      style={{ color: 'var(--color-gray-300)' }}
                    >
                      -{commission.toLocaleString()}원
                    </p>
                  </div>
                  <div>
                    <p className="text-xs opacity-70" style={{ color: 'var(--color-gray-200)' }}>순수익</p>
                    <p 
                      className="text-lg font-bold break-all"
                      style={{ color: 'var(--color-mint-500)' }}
                    >
                      {netRevenue.toLocaleString()}원
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Who Can Join */}
      <section className="py-20" style={{ backgroundColor: 'var(--color-white)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: 'var(--color-navy-900)', fontFamily: 'var(--font-display)' }}
            >
              Who Can Join
            </h2>
            <p style={{ color: 'var(--color-gray-600)' }}>
              스테이 원데이와 함께할 수 있는 공간 유형
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <Home />, title: '독채 풀빌라', desc: '프라이빗 스테이' },
              { icon: <Heart />, title: '스몰웨딩 공간', desc: '파티/이벤트 적합' },
              { icon: <Camera />, title: '촬영 스튜디오', desc: '포토/영상 촬영용' },
              { icon: <Star />, title: '프리미엄 펜션', desc: '고급 숙박시설' },
              { icon: <Calendar />, title: '하우스 스테이', desc: '독립형 주택' },
              { icon: <TrendingUp />, title: '럭셔리 공간', desc: '프리미엄 체험' }
            ].map((item, index) => (
              <div 
                key={index}
                className="flex items-center space-x-4 p-4 rounded-xl transition-all hover:shadow-md"
                style={{ backgroundColor: 'var(--color-gray-100)' }}
              >
                <div 
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--color-mint-500)' }}
                >
                  <div style={{ color: 'var(--color-white)' }}>
                    {item.icon}
                  </div>
                </div>
                <div>
                  <h3 
                    className="font-semibold"
                    style={{ color: 'var(--color-navy-900)' }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--color-gray-600)' }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: 'var(--color-navy-900)', fontFamily: 'var(--font-display)' }}
            >
              입점 절차
            </h2>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: '문의 접수', desc: '온라인 문의 양식 작성' },
              { step: '2', title: '공간 검토', desc: '시설 및 조건 확인' },
              { step: '3', title: '계약 체결', desc: '조건 협의 및 계약' },
              { step: '4', title: '입점 완료', desc: '서비스 시작 및 노출' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-xl font-bold"
                  style={{ 
                    backgroundColor: 'var(--color-mint-500)',
                    color: 'var(--color-white)'
                  }}
                >
                  {item.step}
                </div>
                <h3 
                  className="text-lg font-semibold mb-2"
                  style={{ color: 'var(--color-navy-900)' }}
                >
                  {item.title}
                </h3>
                <p style={{ color: 'var(--color-gray-600)' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20" style={{ backgroundColor: 'var(--color-white)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: 'var(--color-navy-900)', fontFamily: 'var(--font-display)' }}
            >
              자주 묻는 질문
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                id: 'fee',
                question: '수수료는 얼마인가요?',
                answer: '수수료는 파트너사별 조건에 따라 협의 후 안내드립니다. 초기 입점 시에는 특별 조건을 제공하고 있습니다.'
              },
              {
                id: 'platform',
                question: '다른 플랫폼 숙박 예약과 함께 운영하는데 불편함은 없을까요?',
                answer: '전혀 불편함이 없습니다. 통합 캘린더 시스템을 통해 다른 플랫폼의 숙박 예약과 자동으로 연동되어 중복 예약을 방지합니다. 호스트 관리페이지는 PC와 모바일 모든 환경에서 최적화되어 있어 언제 어디서든 쉽고 빠르게 객실 판매 상태를 변경하실 수 있습니다.'
              },
              {
                id: 'photos',
                question: '사진 촬영은 어떻게 진행되나요?',
                answer: '입점업체에서 보유하고 있는 사진을 호스트 관리 페이지에서 직접 추가 및 삭제가 가능합니다. 또한 사진 촬영을 희망할시 전문 포토그래퍼가 방문하여 촬영을 진행합니다. 촬영 가이드 라인에 따라 최적의 공간 사진을 제작하며, 이외 홈페이지 제작 역시 진행이 가능합니다.'
              },
              {
                id: 'overnight',
                question: '숙박예약은 불가능한가요?',
                answer: '네, 스테이 원데이는 기존 숙박예약 플랫폼과는 차별화된 당일 사용 전용 서비스입니다. 15:00-23:00 시간대에 특화된 데이유즈 플랫폼으로, 기존 숙박 매출 외에 새로운 수익 창구를 만드는 것이 목적입니다. 이를 통해 유휴 시간대를 활용한 추가 매출을 창출할 수 있어 전체적인 수익성을 높일 수 있습니다.'
              },
              {
                id: 'marketing',
                question: '홍보 지원은 어떻게 이루어지나요?',
                answer: '스테이 원데이 공식 채널, SNS, 캠페인에 노출되며 프리미엄 파트너사에게는 추가 마케팅 지원을 제공합니다.'
              },
              {
                id: 'settlement',
                question: '정산은 언제, 어떻게 이루어지나요?',
                answer: '매월 말일 기준으로 익월 15일에 정산됩니다. 실시간으로 매출 현황을 확인할 수 있는 대시보드를 제공합니다.'
              }
            ].map((faq, index) => (
              <Card 
                key={faq.id}
                className="border-0"
                style={{ 
                  backgroundColor: 'var(--color-gray-100)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  style={{ borderRadius: 'var(--radius-md)' }}
                >
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: 'var(--color-navy-900)' }}
                  >
                    {faq.question}
                  </h3>
                  <ChevronDown 
                    className={`w-5 h-5 transition-transform ${openFAQ.includes(faq.id) ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--color-gray-500)' }}
                  />
                </button>
                {openFAQ.includes(faq.id) && (
                  <div className="px-6 pb-6">
                    <p style={{ color: 'var(--color-gray-600)' }}>
                      {faq.answer}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section 
        className="py-20 relative overflow-hidden"
        style={{ backgroundColor: 'var(--color-navy-900)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 
            className="text-3xl md:text-4xl font-bold mb-6"
            style={{ color: 'var(--color-white)', fontFamily: 'var(--font-display)' }}
          >
            지금 시작하세요
          </h3>
          <p 
            className="text-xl mb-10 opacity-90"
            style={{ color: 'var(--color-gray-200)' }}
          >
            비어있는 공간을 수익으로 바꾸는 새로운 기회, 스테이 원데이와 함께하세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="font-semibold px-8 py-4 text-lg rounded-xl transition-all hover:shadow-lg hover:scale-105 border border-white"
              style={{ backgroundColor: '#ffffff !important', color: '#000000 !important' }}
            >
              입점 문의하기
              <ArrowRight className="w-5 h-5 ml-2" style={{ color: '#000000' }} />
            </Button>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Mail className="w-5 h-5 mr-2" style={{ color: 'var(--color-gray-300)' }} />
                <span style={{ color: 'var(--color-gray-300)' }}>info@nuklabs.com</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-12" style={{ backgroundColor: 'var(--color-white)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <div className="text-2xl font-light tracking-tight" style={{ color: 'var(--color-navy-900)' }}>
              stay<span className="font-medium">oneday</span>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm">
              <Link href="/terms" className="hover:underline" style={{ color: 'var(--color-gray-600)' }}>이용약관</Link>
              <Link href="/privacy" className="hover:underline" style={{ color: 'var(--color-gray-600)' }}>개인정보 처리방침</Link>
              <a href="mailto:info@nuklabs.com" className="hover:underline" style={{ color: 'var(--color-gray-600)' }}>제휴 문의</a>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-gray-500)' }}>
              © 2025 Stay-OneDay. All rights reserved. | (주)스테이원데이 | 대표: 홍길동 | 사업자등록번호: 123-45-67890
            </p>
          </div>
        </div>
      </footer>

      {/* Partner Inquiry Modal */}
      <PartnerInquiryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  )
}