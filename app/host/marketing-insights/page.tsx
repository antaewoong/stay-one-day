'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  Heart,
  Star,
  Calendar,
  Users,
  MapPin,
  Camera,
  Clock,
  Target,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  BarChart3
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'

interface HostMarketingInsights {
  // 기본 성과
  accommodationName: string
  totalViews: number
  totalBookings: number
  conversionRate: number
  averageRating: number

  // 트렌드 (지난 30일 vs 이전 30일)
  viewsTrend: number
  bookingsTrend: number
  ratingTrend: number

  // 고객 분석
  topCustomerTypes: Array<{
    type: string
    percentage: number
    averageStay: number
    tipRevenue: number
  }>

  // 경쟁 분석
  rankingInArea: number
  totalCompetitors: number
  pricePosition: 'low' | 'medium' | 'high'

  // 최적화 제안
  quickWins: Array<{
    title: string
    impact: 'high' | 'medium' | 'low'
    effort: 'easy' | 'medium' | 'hard'
    description: string
    action: string
  }>

  // 예약 패턴
  bestBookingDays: string[]
  peakSeasons: string[]
  averageLeadTime: number

  // 콘텐츠 성과
  photoPerformance: {
    bestPhotos: Array<{ url: string; clickRate: number }>
    needsUpdate: Array<{ reason: string; suggestion: string }>
  }
}

export default function HostMarketingInsightsPage() {
  const { user } = useAuth()
  const [insights, setInsights] = useState<HostMarketingInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('overview')

  useEffect(() => {
    if (user) {
      fetchMarketingInsights()
    }
  }, [user])

  const fetchMarketingInsights = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // 호스트의 숙소 정보 먼저 가져오기
      const { data: hostData } = await supabase
        .from('host_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (!hostData) {
        console.error('호스트 프로필을 찾을 수 없습니다')
        return
      }

      // 숙소별 마케팅 인사이트 조회
      const response = await fetch('/api/host/marketing-insights', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setInsights(data)
      }
    } catch (error) {
      console.error('마케팅 인사이트 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'easy': return 'bg-green-50 text-green-700'
      case 'medium': return 'bg-yellow-50 text-yellow-700'
      case 'hard': return 'bg-red-50 text-red-700'
      default: return 'bg-gray-50 text-gray-700'
    }
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <div className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 p-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">마케팅 인사이트를 불러올 수 없습니다</h1>
          <Button onClick={fetchMarketingInsights}>다시 시도</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 {insights.accommodationName} 마케팅 성과
          </h1>
          <p className="text-gray-600">
            간단하고 실용적인 인사이트로 예약률을 높여보세요
          </p>
        </div>

        {/* 핵심 지표 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  조회수
                </span>
                {getTrendIcon(insights.viewsTrend)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights.totalViews.toLocaleString()}</div>
              <div className="text-sm text-blue-100">
                지난달 대비 {insights.viewsTrend > 0 ? '+' : ''}{insights.viewsTrend}%
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  예약수
                </span>
                {getTrendIcon(insights.bookingsTrend)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights.totalBookings}</div>
              <div className="text-sm text-green-100">
                지난달 대비 {insights.bookingsTrend > 0 ? '+' : ''}{insights.bookingsTrend}%
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5" />
                전환율
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights.conversionRate.toFixed(1)}%</div>
              <div className="text-sm text-purple-100">
                조회 100명당 {Math.round(insights.conversionRate)}명 예약
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  평점
                </span>
                {getTrendIcon(insights.ratingTrend)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights.averageRating.toFixed(1)}</div>
              <div className="text-sm text-orange-100">
                지역 내 {insights.rankingInArea}위/{insights.totalCompetitors}개
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">성과 요약</TabsTrigger>
            <TabsTrigger value="customers">고객 분석</TabsTrigger>
            <TabsTrigger value="optimize">최적화 제안</TabsTrigger>
            <TabsTrigger value="content">콘텐츠 분석</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    경쟁력 분석
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">지역 내 순위</span>
                    <Badge variant="outline">
                      {insights.rankingInArea}위 / {insights.totalCompetitors}개
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">가격 포지션</span>
                    <Badge className={`${
                      insights.pricePosition === 'high' ? 'bg-red-100 text-red-800' :
                      insights.pricePosition === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {insights.pricePosition === 'high' ? '프리미엄' :
                       insights.pricePosition === 'medium' ? '중간' : '경제적'}
                    </Badge>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">예약 패턴</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div>• 예약이 많은 요일: {insights.bestBookingDays.join(', ')}</div>
                      <div>• 성수기: {insights.peakSeasons.join(', ')}</div>
                      <div>• 평균 예약 리드타임: {insights.averageLeadTime}일</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    주요 고객층
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {insights.topCustomerTypes.map((customer, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{customer.type}</h4>
                          <Badge variant="outline">{customer.percentage}%</Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>평균 체류: {customer.averageStay}박</div>
                          <div>평균 매출: {customer.tipRevenue.toLocaleString()}원</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customers" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>고객 유형별 상세 분석</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {insights.topCustomerTypes.map((customer, index) => (
                    <div key={index} className="p-6 border-2 rounded-xl bg-gray-50">
                      <h3 className="text-lg font-bold mb-4">{customer.type}</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">전체 예약 비중</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full">
                              <div
                                className="h-2 bg-blue-500 rounded-full"
                                style={{ width: `${customer.percentage}%` }}
                              />
                            </div>
                            <span className="font-medium">{customer.percentage}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">평균 체류기간</span>
                          <span className="font-medium">{customer.averageStay}박</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">평균 매출기여</span>
                          <span className="font-medium text-green-600">
                            {customer.tipRevenue.toLocaleString()}원
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="optimize" className="mt-6">
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">🚀 즉시 실행 가능한 개선사항</h2>
                <p className="text-gray-600">우선순위별로 정리했습니다. 쉬운 것부터 시작해보세요!</p>
              </div>

              <div className="grid gap-6">
                {insights.quickWins
                  .sort((a, b) => {
                    // 임팩트 높고 쉬운 것부터
                    const impactScore = { high: 3, medium: 2, low: 1 }
                    const effortScore = { easy: 3, medium: 2, hard: 1 }
                    const scoreA = impactScore[a.impact] * effortScore[a.effort]
                    const scoreB = impactScore[b.impact] * effortScore[b.effort]
                    return scoreB - scoreA
                  })
                  .map((quickWin, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex items-center gap-1">
                                {quickWin.impact === 'high' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                                {quickWin.impact === 'medium' && <Clock className="h-5 w-5 text-yellow-500" />}
                                {quickWin.impact === 'low' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                              </div>
                              <h3 className="text-lg font-semibold">{quickWin.title}</h3>
                            </div>
                            <p className="text-gray-600 mb-3">{quickWin.description}</p>
                            <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                              <div className="flex items-center gap-2 text-blue-800">
                                <Lightbulb className="h-4 w-4" />
                                <span className="font-medium">실행방법:</span>
                              </div>
                              <p className="text-blue-700 mt-1">{quickWin.action}</p>
                            </div>
                          </div>
                          <div className="ml-4 space-y-2">
                            <Badge className={getImpactColor(quickWin.impact)}>
                              {quickWin.impact === 'high' ? '높은 효과' :
                               quickWin.impact === 'medium' ? '보통 효과' : '낮은 효과'}
                            </Badge>
                            <Badge className={getEffortColor(quickWin.effort)}>
                              {quickWin.effort === 'easy' ? '쉬움' :
                               quickWin.effort === 'medium' ? '보통' : '어려움'}
                            </Badge>
                          </div>
                        </div>
                        <Button className="w-full" variant="outline">
                          <ArrowRight className="h-4 w-4 mr-2" />
                          지금 바로 실행하기
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    성과 좋은 사진
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {insights.photoPerformance.bestPhotos.map((photo, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
                        <img
                          src={photo.url}
                          alt={`베스트 사진 ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-green-800">
                            클릭률 {photo.clickRate.toFixed(1)}%
                          </div>
                          <div className="text-sm text-green-600">
                            이런 스타일의 사진을 더 추가해보세요
                          </div>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    개선이 필요한 부분
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {insights.photoPerformance.needsUpdate.map((issue, index) => (
                      <div key={index} className="p-4 border-l-4 border-orange-400 bg-orange-50 rounded-lg">
                        <div className="font-medium text-orange-800 mb-2">
                          {issue.reason}
                        </div>
                        <div className="text-sm text-orange-700">
                          💡 {issue.suggestion}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}