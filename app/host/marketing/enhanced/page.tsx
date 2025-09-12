'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  Zap, 
  MapPin,
  Bell,
  Brain,
  Target,
  RefreshCw,
  Settings,
  BarChart3,
  Clock,
  Users,
  Star,
  ArrowRight,
  AlertTriangle
} from 'lucide-react'

// 컴포넌트 임포트
import { LocalHeatWidget } from '@/components/marketing/LocalHeatWidget'
import { SameDayBookingWidget } from '@/components/marketing/SameDayBookingWidget'

interface MarketingDashboardData {
  overview: {
    totalRevenue: number
    totalBookings: number
    avgBookingValue: number
    conversionRate: number
  }
  sameDayMetrics: {
    rate: number
    trend: number
    todayBookings: number
  }
  localHeat: {
    score: number
    trend: number
    opportunities: number
  }
  alerts: {
    pending: number
    urgent: number
    opportunities: number
  }
}

/**
 * 🚀 Enhanced 호스트 마케팅 대시보드
 * ChatGPT 협업 결과 반영한 최종 버전
 * 
 * 특징:
 * - North Star Metric (즉시 예약률) 우선 배치
 * - 실시간 지역 상권 인텔리전스
 * - 실행 가능한 AI 제안
 * - 시간대별 최적화된 알림 시스템
 */
export default function EnhancedHostMarketingPage() {
  const [hostId, setHostId] = useState<string>('')
  const [accommodationId, setAccommodationId] = useState<string>('')
  const [dashboardData, setDashboardData] = useState<MarketingDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  // 호스트 정보 가져오기
  useEffect(() => {
    const hostUser = sessionStorage.getItem('hostUser')
    if (hostUser) {
      try {
        const parsedHostUser = JSON.parse(hostUser)
        if (parsedHostUser.id) {
          setHostId(parsedHostUser.id)
          fetchDashboardData(parsedHostUser.id)
        }
      } catch (error) {
        console.error('호스트 정보 파싱 실패:', error)
      }
    }
  }, [])

  const fetchDashboardData = async (hostId: string) => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/marketing/dashboard-overview?hostId=${hostId}`)
      const result = await response.json()
      
      if (result.success) {
        setDashboardData(result.data)
        if (result.data.accommodations?.[0]?.id) {
          setAccommodationId(result.data.accommodations[0].id)
        }
      }
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium">AI 마케팅 분석 중...</p>
            <p className="text-sm text-gray-600 mt-1">지역 상권과 경쟁사를 실시간으로 분석하고 있어요</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <Brain className="w-8 h-8 text-blue-600" />
            AI 마케팅 인텔리전스
          </h1>
          <p className="text-gray-600">실시간 지역 상권 분석으로 매출을 극대화하세요</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* 알림 상태 */}
          {dashboardData?.alerts && (
            <div className="flex items-center gap-2">
              {dashboardData.alerts.urgent > 0 && (
                <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  긴급 {dashboardData.alerts.urgent}
                </Badge>
              )}
              {dashboardData.alerts.opportunities > 0 && (
                <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  기회 {dashboardData.alerts.opportunities}
                </Badge>
              )}
            </div>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => fetchDashboardData(hostId)}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
          
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            알림 설정
          </Button>
        </div>
      </div>

      {/* 핵심 지표 카드 (ChatGPT 제안 KPI) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-blue-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">즉시 예약률</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-blue-600">
                    {dashboardData?.sameDayMetrics.rate.toFixed(1)}%
                  </p>
                  <Badge className={`text-xs ${
                    dashboardData?.sameDayMetrics.trend > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {dashboardData?.sameDayMetrics.trend > 0 ? '+' : ''}{dashboardData?.sameDayMetrics.trend.toFixed(1)}%
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">North Star Metric</p>
              </div>
              <Zap className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">지역 히트</p>
                <p className="text-2xl font-bold text-orange-600">
                  {dashboardData?.localHeat.score.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500 mt-1">상권 활성도</p>
              </div>
              <MapPin className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">오늘 당일 예약</p>
                <p className="text-2xl font-bold text-green-600">
                  {dashboardData?.sameDayMetrics.todayBookings || 0}건
                </p>
                <p className="text-xs text-gray-500 mt-1">실시간 수익</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">마케팅 기회</p>
                <p className="text-2xl font-bold text-purple-600">
                  {dashboardData?.localHeat.opportunities || 0}개
                </p>
                <p className="text-xs text-gray-500 mt-1">실행 가능한 제안</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 메인 탭 컨텐츠 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            실시간 대시보드
          </TabsTrigger>
          <TabsTrigger value="local-intel" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            지역 인텔리전스
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            스마트 알림
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI 인사이트
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* 핵심 위젯들 */}
          {hostId && (
            <SameDayBookingWidget 
              hostId={hostId} 
              accommodationId={accommodationId || undefined}
            />
          )}
          
          {accommodationId && (
            <LocalHeatWidget 
              accommodationId={accommodationId}
              accommodationName="내 숙소" 
            />
          )}
        </TabsContent>

        <TabsContent value="local-intel" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 지역 상권 맵 */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  500m 반경 상권 맵
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-3" />
                    <p>실시간 상권 지도</p>
                    <p className="text-sm">곧 업데이트 예정</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* POI 트렌드 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">🔥 뜨고 있는 POI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">🍽️ 제주 흑돼지 맛집</span>
                      <Badge className="text-xs bg-red-100 text-red-800">+22%</Badge>
                    </div>
                    <p className="text-xs text-gray-600">280m • 리뷰 급증</p>
                  </div>
                  
                  <div className="p-3 border rounded hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">🧸 키즈카페 놀이천국</span>
                      <Badge className="text-xs bg-orange-100 text-orange-800">+15%</Badge>
                    </div>
                    <p className="text-xs text-gray-600">320m • 인스타 태그 증가</p>
                  </div>
                  
                  <div className="p-3 border rounded hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">☕ 제주 바다뷰 카페</span>
                      <Badge className="text-xs bg-blue-100 text-blue-800">+8%</Badge>
                    </div>
                    <p className="text-xs text-gray-600">150m • 네이버 방문 증가</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-500" />
                  실시간 알림
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-800">CPA 급증 감지</h4>
                        <p className="text-sm text-red-700 mt-1">네이버 광고 CPA가 30% 증가했습니다</p>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" className="bg-red-600 hover:bg-red-700">
                            즉시 대응
                          </Button>
                          <Button size="sm" variant="outline">
                            상세 보기
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-green-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-800">마케팅 기회 발견</h4>
                        <p className="text-sm text-green-700 mt-1">근처 맛집 대박! 제휴 마케팅 기회</p>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            기회 활용
                          </Button>
                          <Button size="sm" variant="outline">
                            자세히 보기
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-500" />
                  알림 설정
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <h4 className="font-medium">지역 히트 급등</h4>
                      <p className="text-sm text-gray-600">15% 이상 증가 시 알림</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">ON</Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <h4 className="font-medium">CPA 급증</h4>
                      <p className="text-sm text-gray-600">30% 이상 증가 시 알림</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">ON</Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <h4 className="font-medium">경쟁사 급성장</h4>
                      <p className="text-sm text-gray-600">리뷰 50개 이상 증가 시</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">ON</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                AI 마케팅 인사이트 & 추천
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">📊 핵심 인사이트</h3>
                  
                  <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                    <p className="text-sm text-blue-800">
                      즉시 예약률이 업계 평균 대비 15% 높습니다. 당일 대여에 특화된 마케팅 전략이 효과적으로 작동하고 있어요.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-orange-50 border-l-4 border-orange-400 rounded">
                    <p className="text-sm text-orange-800">
                      주변 300m 내 신규 맛집이 급부상 중입니다. 제휴 마케팅으로 예약률 25% 증가가 가능해요.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">🎯 실행 추천</h3>
                  
                  <div className="p-4 border rounded hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">맛집 제휴 마케팅</h4>
                      <Badge className="bg-green-100 text-green-800">높음</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      제주 흑돼지 맛집과 할인 쿠폰 교환 이벤트
                    </p>
                    <Button size="sm" className="w-full">
                      <ArrowRight className="h-4 w-4 mr-1" />
                      실행 가이드 보기
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">네이버 플레이스 최적화</h4>
                      <Badge className="bg-yellow-100 text-yellow-800">보통</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      사진 12장 추가, 리뷰 응답 24시간 내 100%
                    </p>
                    <Button size="sm" variant="outline" className="w-full">
                      <ArrowRight className="h-4 w-4 mr-1" />
                      체크리스트 보기
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}