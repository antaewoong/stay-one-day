'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Zap,
  ExternalLink,
  Target,
  Clock,
  Users,
  Star
} from 'lucide-react'

interface POIContributor {
  name: string
  category: string
  score: number
  distance: number
  signals: {
    reviews: number
    instaTags: number
    naverVisits: number
  }
}

interface LocalHeatData {
  currentScore: number
  trend: number
  trendDirection: 'up' | 'down' | 'stable'
  topContributors: POIContributor[]
  insights: string[]
  lastUpdated: string
}

interface LocalHeatWidgetProps {
  accommodationId: string
  accommodationName: string
}

/**
 * 🔥 지역 히트 인덱스 위젯
 * Stay OneDay 핵심 차별화 기능 - "300m 거리 맛집 대박!"
 */
export function LocalHeatWidget({ accommodationId, accommodationName }: LocalHeatWidgetProps) {
  const [heatData, setHeatData] = useState<LocalHeatData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    fetchHeatData()
    
    // 5분마다 자동 갱신
    const interval = setInterval(fetchHeatData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [accommodationId])

  const fetchHeatData = async () => {
    try {
      const response = await fetch(`/api/marketing/intelligence?accommodationId=${accommodationId}`)
      const result = await response.json()
      
      if (result.success) {
        setHeatData(result.data.localHeatIndex)
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error('지역 히트 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="col-span-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-gray-600">지역 상권 분석 중...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!heatData) {
    return (
      <Card className="col-span-full border-orange-200">
        <CardContent className="p-6 text-center">
          <MapPin className="h-12 w-12 text-orange-400 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800 mb-2">지역 상권 데이터 수집 중</h3>
          <p className="text-sm text-gray-600">주변 POI 정보를 분석하여 마케팅 기회를 찾고 있습니다</p>
        </CardContent>
      </Card>
    )
  }

  const getTrendIcon = () => {
    switch (heatData.trendDirection) {
      case 'up':
        return <TrendingUp className="h-5 w-5 text-green-500" />
      case 'down':
        return <TrendingDown className="h-5 w-5 text-red-500" />
      default:
        return <div className="h-5 w-5 bg-gray-400 rounded-full" />
    }
  }

  const getTrendColor = () => {
    switch (heatData.trendDirection) {
      case 'up':
        return 'text-green-600 bg-green-50'
      case 'down':
        return 'text-red-600 bg-red-50'  
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-orange-600 bg-orange-100'
    if (score >= 40) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
  }

  const getCategoryIcon = (category: string) => {
    const iconMap = {
      restaurant: '🍽️',
      cafe: '☕',
      kids: '🧸',
      academy: '📚',
      attraction: '🎯'
    }
    return iconMap[category as keyof typeof iconMap] || '📍'
  }

  const formatLastUpdate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffHours < 1) return '방금 전 업데이트'
    if (diffHours < 24) return `${diffHours}시간 전 업데이트`
    return `${Math.floor(diffHours / 24)}일 전 업데이트`
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 메인 히트 스코어 카드 */}
      <Card className="lg:col-span-2 border-orange-200 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              🔥 지역 히트 인덱스
              <Badge variant="outline" className="text-xs">
                실시간
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              {formatLastUpdate(heatData.lastUpdated)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 히트 스코어 */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-3xl font-bold ${getScoreColor(heatData.currentScore).split(' ')[0]}`}>
                    {heatData.currentScore.toFixed(1)}
                  </span>
                  <div className="flex items-center gap-1">
                    {getTrendIcon()}
                    <span className={`text-sm font-medium px-2 py-1 rounded ${getTrendColor()}`}>
                      {heatData.trend > 0 ? '+' : ''}{heatData.trend.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">500m 반경 상권 활성도</p>
              </div>
              <div className={`px-4 py-2 rounded-full ${getScoreColor(heatData.currentScore)}`}>
                <span className="text-sm font-medium">
                  {heatData.currentScore >= 80 ? '매우 뜨거움' :
                   heatData.currentScore >= 60 ? '활성화됨' :
                   heatData.currentScore >= 40 ? '보통' : '조용함'}
                </span>
              </div>
            </div>

            {/* 인사이트 */}
            {heatData.insights.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-orange-500" />
                  AI 인사이트
                </h4>
                <div className="space-y-1">
                  {heatData.insights.map((insight, index) => (
                    <div key={index} className="text-sm p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                      {insight}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 액션 버튼 */}
            {heatData.trendDirection === 'up' && heatData.trend > 15 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-green-800 mb-1">🚀 마케팅 기회 감지!</h4>
                    <p className="text-sm text-green-700">
                      지역 상권이 급속 성장 중입니다. 지금이 제휴 마케팅 적기예요!
                    </p>
                  </div>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <Target className="h-4 w-4 mr-1" />
                    액션 플랜 보기
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* TOP POI 기여자들 */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            주요 기여 POI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {heatData.topContributors.slice(0, 3).map((poi, index) => (
              <div key={index} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{getCategoryIcon(poi.category)}</span>
                      <h4 className="font-medium text-sm text-gray-800 truncate">
                        {poi.name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      {poi.distance}m 거리
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-orange-600">
                      {poi.score.toFixed(1)}점
                    </div>
                  </div>
                </div>
                
                {/* POI 신호 정보 */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-blue-500" />
                    <span>{poi.signals.reviews}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-pink-500">#</span>
                    <span>{poi.signals.instaTags}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-green-500">N</span>
                    <span>{poi.signals.naverVisits}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {heatData.topContributors.length > 3 && (
              <Button variant="outline" size="sm" className="w-full mt-2">
                <ExternalLink className="h-3 w-3 mr-1" />
                전체 POI 보기 ({heatData.topContributors.length}개)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}