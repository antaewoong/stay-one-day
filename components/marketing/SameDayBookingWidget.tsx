'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Clock, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Target,
  Calendar,
  Users,
  ArrowRight
} from 'lucide-react'

interface SameDayMetrics {
  sameDayBookingRate: number        // 즉시 예약률 (North Star Metric)
  sameDayBookingTrend: number       // 전월 대비 변화
  avgBookingWindow: number          // 평균 예약 리드타임 (시간)
  todayBookings: number            // 오늘 당일 예약 수
  peakHours: Array<{              // 당일 예약 성수 시간대
    hour: number
    bookings: number
  }>
  competitorGap: number            // 경쟁사 대비 즉시 예약률 차이
  lastUpdated: string
}

interface SameDayBookingWidgetProps {
  hostId: string
  accommodationId?: string
}

/**
 * 🚀 즉시 예약률 위젯 - 당일 대여 플랫폼의 North Star Metric
 * ChatGPT 제안 반영: "Same-day booking ratio"가 진짜 핵심 지표
 */
export function SameDayBookingWidget({ hostId, accommodationId }: SameDayBookingWidgetProps) {
  const [metrics, setMetrics] = useState<SameDayMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSameDayMetrics()
    
    // 30분마다 갱신 (당일 예약은 실시간성이 중요)
    const interval = setInterval(fetchSameDayMetrics, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [hostId, accommodationId])

  const fetchSameDayMetrics = async () => {
    try {
      const params = new URLSearchParams({ hostId })
      if (accommodationId) params.set('accommodationId', accommodationId)
      
      const response = await fetch(`/api/marketing/same-day-metrics?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setMetrics(result.data)
      }
    } catch (error) {
      console.error('즉시 예약 지표 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">즉시 예약 분석 중...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-6 text-center text-gray-500">
          즉시 예약 데이터가 없습니다
        </CardContent>
      </Card>
    )
  }

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 30) return { label: '우수', color: 'bg-green-100 text-green-800' }
    if (rate >= 20) return { label: '양호', color: 'bg-blue-100 text-blue-800' }  
    if (rate >= 10) return { label: '보통', color: 'bg-yellow-100 text-yellow-800' }
    return { label: '개선필요', color: 'bg-red-100 text-red-800' }
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (trend < -5) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <div className="h-4 w-4 bg-gray-400 rounded-full" />
  }

  const performance = getPerformanceBadge(metrics.sameDayBookingRate)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 메인 즉시 예약률 카드 */}
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              즉시 예약률
            </div>
            <Badge className={performance.color}>
              {performance.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 메인 수치 */}
            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-4xl font-bold text-blue-600">
                  {metrics.sameDayBookingRate.toFixed(1)}%
                </span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(metrics.sameDayBookingTrend)}
                  <span className={`text-sm font-medium ${
                    metrics.sameDayBookingTrend > 0 ? 'text-green-600' : 
                    metrics.sameDayBookingTrend < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {metrics.sameDayBookingTrend > 0 ? '+' : ''}{metrics.sameDayBookingTrend.toFixed(1)}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600">전체 예약 중 당일 예약 비율</p>
            </div>

            {/* 상세 지표 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">평균 예약 시점</span>
                </div>
                <span className="text-lg font-semibold text-gray-800">
                  {metrics.avgBookingWindow}시간 전
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">오늘 당일 예약</span>
                </div>
                <span className="text-lg font-semibold text-gray-800">
                  {metrics.todayBookings}건
                </span>
              </div>
            </div>

            {/* 경쟁사 비교 */}
            {metrics.competitorGap !== 0 && (
              <div className={`p-3 rounded border ${
                metrics.competitorGap > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">경쟁사 대비</span>
                  <span className={`text-sm font-semibold ${
                    metrics.competitorGap > 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {metrics.competitorGap > 0 ? '+' : ''}{metrics.competitorGap.toFixed(1)}%p
                  </span>
                </div>
              </div>
            )}

            {/* 개선 액션 */}
            {metrics.sameDayBookingRate < 20 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-800 mb-1">개선 기회</p>
                    <p className="text-xs text-orange-700 mb-2">
                      즉시 예약률 향상으로 당일 수익 극대화 가능
                    </p>
                    <Button size="sm" variant="outline" className="border-orange-300 text-orange-700">
                      <Target className="h-3 w-3 mr-1" />
                      개선 전략 보기
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 시간대별 패턴 카드 */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-500" />
            당일 예약 패턴
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 성수 시간대 */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">성수 시간대</h4>
              <div className="space-y-2">
                {metrics.peakHours.slice(0, 3).map((peak, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-indigo-50 rounded">
                    <span className="text-sm font-medium">
                      {peak.hour}:00 ~ {peak.hour + 1}:00
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-indigo-700">{peak.bookings}건</span>
                      <div className={`w-12 h-2 bg-indigo-200 rounded-full overflow-hidden`}>
                        <div 
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ 
                            width: `${(peak.bookings / Math.max(...metrics.peakHours.map(p => p.bookings))) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 최적화 제안 */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 최적화 제안</h4>
              <div className="space-y-1 text-xs text-blue-700">
                <p>• 성수 시간대 전 푸시 알림 발송</p>
                <p>• 당일 할인 프로모션 타이밍 조절</p>
                <p>• 즉시 확정 옵션 강화</p>
              </div>
            </div>

            {/* 상세 분석 버튼 */}
            <Button variant="outline" size="sm" className="w-full">
              <ArrowRight className="h-4 w-4 mr-1" />
              상세 당일 예약 분석
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}