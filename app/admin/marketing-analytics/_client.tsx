"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  BarChart3,
  Users,
  Activity,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Download,
  Search,
  Filter,
  Calendar
} from 'lucide-react'

interface AnalyticsData {
  systemOverview: {
    totalHosts: number
    activeHosts: number
    totalAnalysisRuns: number
    weeklyAnalysisRuns: number
    popularKeywords: Array<{
      keyword: string
      count: number
      category: string
    }>
    analysisDistribution: Array<{
      type: string
      count: number
      percentage: number
    }>
    quotaUtilization: {
      used: number
      total: number
      utilization: number
    }
  }
}

export default function AnalyticsClient() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AnalyticsData | null>(null)

  const handleRefresh = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/marketing-analytics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`)
      }

      setData(result.data)
    } catch (err: any) {
      setError(err.message || '데이터를 불러올 수 없습니다')
      console.error('API 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    handleRefresh()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            마케팅 애널리틱스 (관리자)
          </h1>
          <p className="text-gray-600 mt-2">
            전체 호스트의 마케팅 툴 사용 현황 및 성과 분석
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? '로딩 중...' : '새로고침'}
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            리포트 내보내기
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 필터 메뉴 */}
      <div className="flex flex-wrap gap-4 items-center p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select className="px-3 py-2 border rounded-md text-sm">
            <option value="7d">최근 7일</option>
            <option value="30d">최근 30일</option>
            <option value="90d">최근 90일</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select className="px-3 py-2 border rounded-md text-sm">
            <option value="all">모든 호스트</option>
            <option value="active">활성 호스트만</option>
            <option value="inactive">비활성 호스트만</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="호스트 검색..."
            className="px-3 py-2 border rounded-md text-sm w-48"
          />
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 호스트</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.systemOverview.totalHosts || 0}</div>
            <p className="text-xs text-muted-foreground">
              활성 {data?.systemOverview.activeHosts || 0}명 ({data ? Math.round((data.systemOverview.activeHosts / data.systemOverview.totalHosts) * 100) : 0}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 분석 실행</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.systemOverview.totalAnalysisRuns.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              이번 주 {data?.systemOverview.weeklyAnalysisRuns || 0}건
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">쿼터 사용률</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.systemOverview.quotaUtilization.utilization || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {data?.systemOverview.quotaUtilization.used || 0}/{data?.systemOverview.quotaUtilization.total || 0} 사용
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">인기 분석</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.systemOverview.analysisDistribution[0]?.type === 'local-demand' ? '지역 수요' : '분석 중'}
            </div>
            <p className="text-xs text-muted-foreground">
              {data?.systemOverview.analysisDistribution[0]?.percentage || 0}% 비중
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 분석 분포 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>분석 유형별 분포</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.systemOverview.analysisDistribution ? (
              <div className="space-y-4">
                {data.systemOverview.analysisDistribution.map((item, index) => {
                  const typeNames: Record<string, string> = {
                    'local-demand': '지역 수요 분석',
                    'content-studio': '콘텐츠 스튜디오',
                    'competitor-analysis': '경쟁사 분석',
                    'shorts-trends': '숏츠 트렌드',
                    'ad-waste-analysis': '광고 낭비 분석',
                    'naver-place-health': '네이버플레이스 건강도',
                    'event-suggestions': '이벤트 제안'
                  }
                  return (
                    <div key={item.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: `hsl(${index * 50}, 70%, 60%)` }}
                        />
                        <span className="text-sm font-medium">
                          {typeNames[item.type] || item.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{item.count}회</span>
                        <span className="text-sm font-semibold">{item.percentage}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {loading ? '로딩 중...' : '데이터를 불러오는 중입니다.'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>인기 키워드</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.systemOverview.popularKeywords ? (
              <div className="space-y-4">
                {data.systemOverview.popularKeywords.map((keyword, index) => (
                  <div key={keyword.keyword} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                      <div>
                        <div className="font-medium">{keyword.keyword}</div>
                        <div className="text-xs text-gray-500">{keyword.category}</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-blue-600">
                      {keyword.count}회
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {loading ? '로딩 중...' : '키워드 데이터를 불러오는 중입니다.'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 호스트 활동 현황 */}
      <Card>
        <CardHeader>
          <CardTitle>시스템 현황</CardTitle>
        </CardHeader>
        <CardContent>
          {data ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {data.systemOverview.activeHosts}명
                </div>
                <div className="text-sm text-gray-500">활성 호스트</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {data.systemOverview.totalAnalysisRuns.toLocaleString()}회
                </div>
                <div className="text-sm text-gray-500">총 분석 실행</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {data.systemOverview.quotaUtilization.utilization}%
                </div>
                <div className="text-sm text-gray-500">시스템 가동률</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                {loading ? '데이터를 불러오는 중...' : '데이터가 없습니다.'}
              </div>
              <Button
                onClick={handleRefresh}
                disabled={loading}
                variant="outline"
              >
                {loading ? '로딩 중...' : '새로고침'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}