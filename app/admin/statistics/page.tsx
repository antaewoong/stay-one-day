'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  Users, 
  Building2, 
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react'

export default function SiteStatisticsPage() {
  const [period, setPeriod] = useState('month')
  const [loading, setLoading] = useState(false)

  // Mock 사이트 통계 데이터
  const siteStats = {
    visitors: {
      total: 45230,
      unique: 38420,
      returning: 6810,
      growth: 15.2
    },
    pageviews: {
      total: 128450,
      avgSession: 3.2,
      bounceRate: 28.5,
      growth: 8.7
    },
    accommodations: {
      total: 156,
      active: 142,
      pending: 8,
      inactive: 6
    },
    bookings: {
      total: 892,
      completed: 834,
      cancelled: 45,
      pending: 13,
      conversionRate: 2.8
    },
    topPages: [
      { page: '/spaces', views: 25430, bounce: 25.2 },
      { page: '/', views: 18920, bounce: 22.1 },
      { page: '/spaces/풀빌라', views: 12340, bounce: 31.4 },
      { page: '/spaces/독채', views: 8760, bounce: 29.8 },
      { page: '/booking', views: 6540, bounce: 15.3 }
    ],
    trafficSources: [
      { source: '검색 엔진', visitors: 18920, percentage: 41.8 },
      { source: '직접 접속', visitors: 13570, percentage: 30.0 },
      { source: '소셜미디어', visitors: 7840, percentage: 17.3 },
      { source: '추천 사이트', visitors: 4900, percentage: 10.9 }
    ]
  }

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1500) // Mock loading
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">사이트 통계</h1>
          <p className="text-gray-600">웹사이트 방문자 및 이용 통계를 확인합니다</p>
        </div>
        <div className="flex gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">일간</SelectItem>
              <SelectItem value="week">주간</SelectItem>
              <SelectItem value="month">월간</SelectItem>
              <SelectItem value="year">연간</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            내보내기
          </Button>
        </div>
      </div>

      {/* 주요 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 방문자</p>
                <p className="text-2xl font-bold">{siteStats.visitors.total.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">+{siteStats.visitors.growth}%</span>
              <span className="text-gray-600 ml-1">전월 대비</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">페이지뷰</p>
                <p className="text-2xl font-bold">{siteStats.pageviews.total.toLocaleString()}</p>
              </div>
              <Eye className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">+{siteStats.pageviews.growth}%</span>
              <span className="text-gray-600 ml-1">전월 대비</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">활성 숙소</p>
                <p className="text-2xl font-bold">{siteStats.accommodations.active}</p>
              </div>
              <Building2 className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              <span className="text-gray-600">총 {siteStats.accommodations.total}개 숙소</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">예약 전환율</p>
                <p className="text-2xl font-bold">{siteStats.bookings.conversionRate}%</p>
              </div>
              <MousePointer className="w-8 h-8 text-orange-600" />
            </div>
            <div className="flex items-center mt-2 text-sm">
              <span className="text-gray-600">{siteStats.bookings.total}건 예약</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 상세 통계 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 방문자 분석 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              방문자 분석
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">순 방문자</p>
                <p className="text-xl font-bold">{siteStats.visitors.unique.toLocaleString()}</p>
              </div>
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                84.9%
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">재방문자</p>
                <p className="text-xl font-bold">{siteStats.visitors.returning.toLocaleString()}</p>
              </div>
              <Badge variant="outline" className="bg-gray-100 text-gray-800">
                15.1%
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">이탈률</p>
                <p className="text-xl font-bold">{siteStats.pageviews.bounceRate}%</p>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                양호
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">평균 세션 페이지</p>
                <p className="text-xl font-bold">{siteStats.pageviews.avgSession}</p>
              </div>
              <Badge variant="outline" className="bg-purple-100 text-purple-800">
                +0.3
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* 인기 페이지 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              인기 페이지 TOP 5
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {siteStats.topPages.map((page, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{page.page}</p>
                      <p className="text-xs text-gray-600">이탈률 {page.bounce}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{page.views.toLocaleString()}</p>
                    <p className="text-xs text-gray-600">조회수</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 트래픽 소스 & 예약 현황 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 트래픽 소스 */}
        <Card>
          <CardHeader>
            <CardTitle>트래픽 소스</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {siteStats.trafficSources.map((source, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{source.source}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{source.visitors.toLocaleString()}</span>
                      <Badge variant="outline">{source.percentage}%</Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${source.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 예약 현황 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              예약 현황
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-700">{siteStats.bookings.completed}</p>
                <p className="text-sm text-green-600">완료된 예약</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-yellow-700">{siteStats.bookings.pending}</p>
                <p className="text-sm text-yellow-600">대기 중</p>
              </div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-700">{siteStats.bookings.cancelled}</p>
              <p className="text-sm text-red-600">취소된 예약</p>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">예약 성공률</span>
                <span className="text-lg font-bold text-green-600">
                  {((siteStats.bookings.completed / siteStats.bookings.total) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 실시간 현황 */}
      <Card>
        <CardHeader>
          <CardTitle>실시간 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>실시간 방문자 데이터를 로드하는 중...</p>
            <p className="text-sm mt-2">Google Analytics 연동 후 표시됩니다.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}