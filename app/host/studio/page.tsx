'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Zap,
  Video,
  Play,
  Eye,
  ThumbsUp,
  Hash
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'

interface QuotaStatus {
  used: number
  remaining: number
  manual_runs: number
  admin_proxy_runs: number
}

interface ReportData {
  accommodation_name: string
  location: string
  summary: string
  actionable_insights: Array<{
    type: string
    title: string
    action: string
    priority: 'high' | 'medium' | 'low'
    effort: 'high' | 'medium' | 'low'
    estimated_impact: string
  }>
  quick_stats: {
    price_rank: string
    competition_level: string
    search_volume_trend: string
    optimal_price_range: string
  }
  trending_keywords: Array<{
    keyword: string
    search_volume: number
    trend: string
  }>
  next_actions: string[]
  generated_at: string
  quota_status: {
    used: number
    remaining: number
    reset_date?: string
  }
}

interface ShortsRadarData {
  accommodationName: string
  location: string
  analysis: {
    totalKeywordsAnalyzed: number
    totalVideosFound: number
    totalViewsAnalyzed: number
    avgViewsPerKeyword: number
  }
  trendingKeywords: Array<{
    keyword: string
    totalVideos: number
    totalViews: number
    avgViews: number
    shortsRatio: number
    opportunity: 'high' | 'medium' | 'low'
    topChannels: Array<{ name: string; videoCount: number }>
    relatedKeywords: string[]
  }>
  contentSuggestions: Array<{
    keyword: string
    priority: 'high' | 'medium' | 'low'
    expectedViews: number
    contentIdeas: string[]
    hashtagSuggestions: string[]
    bestPractices: string[]
  }>
  performancePrediction: {
    expectedReach: {
      pessimistic: number
      realistic: number
      optimistic: number
    }
    timeToViral: {
      estimated_days: string
      key_factors: string[]
    }
    roi_prediction: {
      content_cost: string
      expected_bookings: string
      revenue_impact: string
    }
    success_indicators: string[]
  }
  actionableInsights: Array<{
    type: string
    title: string
    description: string
    action: string
    priority: string
    effort: string
  }>
  dataSource: string
  quota_status: {
    used: number
    remaining: number
    reset_date?: string
  }
  updateTime: string
}

interface Accommodation {
  id: string
  name: string
  city: string
  region: string
}

export default function HostStudioPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null)
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [selectedAccommodation, setSelectedAccommodation] = useState<string>('')
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [shortsData, setShortsData] = useState<ShortsRadarData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'report' | 'shorts'>('report')

  const supabase = createClient()

  // 쿼터 상태 조회
  useEffect(() => {
    fetchQuotaStatus()
    fetchAccommodations()
  }, [])

  const fetchQuotaStatus = async () => {
    try {
      const response = await fetch('/api/host/report/quota')
      if (response.ok) {
        const data = await response.json()
        setQuotaStatus(data.quota)
      }
    } catch (error) {
      console.error('쿼터 상태 조회 실패:', error)
    }
  }

  const fetchAccommodations = async () => {
    try {
      const { data } = await supabase
        .from('accommodations')
        .select('id, name, city, region')
        .order('name')

      if (data) {
        setAccommodations(data)
        if (data.length > 0) {
          setSelectedAccommodation(data[0].id)
        }
      }
    } catch (error) {
      console.error('숙소 목록 조회 실패:', error)
    }
  }

  const generateReport = async () => {
    if (!selectedAccommodation) return

    setLoading(true)
    setError(null)
    setActiveTab('report')

    try {
      const response = await fetch('/api/host/report/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accommodationId: selectedAccommodation })
      })

      const data = await response.json()

      if (response.status === 429) {
        setError(`${data.message}\n다음 가능일: ${data.next_available}`)
      } else if (response.ok) {
        setReportData(data)
        setQuotaStatus(data.quota_status)
      } else {
        setError(data.error || '리포트 생성에 실패했습니다')
      }
    } catch (error) {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const generateShortsRadar = async () => {
    if (!selectedAccommodation) return

    setLoading(true)
    setError(null)
    setActiveTab('shorts')

    try {
      const response = await fetch(`/api/host/shorts-radar?accommodationId=${selectedAccommodation}`)
      const data = await response.json()

      if (response.status === 429) {
        setError(`${data.message}\n다음 가능일: ${data.next_available}`)
      } else if (response.ok) {
        setShortsData(data)
        setQuotaStatus(data.quota_status)
      } else {
        setError(data.error || '쇼츠 레이더 생성에 실패했습니다')
      }
    } catch (error) {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'default'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-4 w-4" />
      case 'medium': return <Target className="h-4 w-4" />
      case 'low': return <CheckCircle2 className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">마케팅 스튜디오</h1>
          <p className="text-muted-foreground">AI 기반 숙소 마케팅 인사이트</p>
        </div>
        <div className="flex items-center gap-4">
          {quotaStatus && (
            <Badge variant="outline" className="px-3 py-1">
              <Zap className="h-4 w-4 mr-1" />
              {quotaStatus.remaining}/2 남음
            </Badge>
          )}
        </div>
      </div>

      {/* 쿼터 상태 및 생성 버튼 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            마케팅 분석 도구
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">숙소 선택</label>
              <Select value={selectedAccommodation} onValueChange={setSelectedAccommodation}>
                <SelectTrigger>
                  <SelectValue placeholder="숙소를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {accommodations.map((accom) => (
                    <SelectItem key={accom.id} value={accom.id}>
                      {accom.name} ({accom.city})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={generateReport}
                disabled={loading || !selectedAccommodation || (quotaStatus?.remaining || 0) <= 0}
                variant="default"
              >
                {loading && activeTab === 'report' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    종합 리포트
                  </>
                )}
              </Button>
              <Button
                onClick={generateShortsRadar}
                disabled={loading || !selectedAccommodation || (quotaStatus?.remaining || 0) <= 0}
                variant="outline"
              >
                {loading && activeTab === 'shorts' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4 mr-2" />
                    쇼츠 레이더
                  </>
                )}
              </Button>
            </div>
          </div>

          {quotaStatus && (
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">이번 주 사용량</span>
                <span className="font-medium">{quotaStatus.used}/2</span>
              </div>
              <div className="w-full bg-background rounded-full h-2 mt-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(quotaStatus.used / 2) * 100}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 분석 결과 */}
      {(reportData || shortsData) && (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'report' | 'shorts')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="report" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              종합 리포트
            </TabsTrigger>
            <TabsTrigger value="shorts" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              쇼츠 레이더
            </TabsTrigger>
          </TabsList>

          <TabsContent value="report" className="space-y-6">
            {reportData && (
        <div className="space-y-6">
          {/* 요약 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {reportData.accommodation_name}
              </CardTitle>
              <p className="text-muted-foreground">{reportData.location}</p>
            </CardHeader>
            <CardContent>
              <p className="text-lg">{reportData.summary}</p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{reportData.quick_stats.price_rank}</div>
                  <div className="text-sm text-muted-foreground">가격 순위</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{reportData.quick_stats.competition_level}</div>
                  <div className="text-sm text-muted-foreground">경쟁 수준</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{reportData.quick_stats.search_volume_trend}</div>
                  <div className="text-sm text-muted-foreground">검색량 증가</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">{reportData.quick_stats.optimal_price_range}</div>
                  <div className="text-sm text-muted-foreground">최적 가격대</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 실행 가능한 인사이트 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                실행 가능한 인사이트
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reportData.actionable_insights.map((insight, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(insight.priority)}
                    <h3 className="font-semibold">{insight.title}</h3>
                    <Badge variant={getPriorityColor(insight.priority) as any}>
                      {insight.priority}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{insight.action}</p>
                  <div className="flex justify-between text-sm">
                    <span>노력도: <Badge variant="outline">{insight.effort}</Badge></span>
                    <span className="text-green-600 font-medium">{insight.estimated_impact}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 트렌딩 키워드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                트렌딩 키워드
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportData.trending_keywords.map((keyword, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <div className="font-medium">{keyword.keyword}</div>
                      <div className="text-sm text-muted-foreground">검색량: {keyword.search_volume.toLocaleString()}</div>
                    </div>
                    <Badge variant={keyword.trend.startsWith('+') ? 'default' : 'secondary'}>
                      {keyword.trend}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 다음 액션 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                즉시 실행 액션
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {reportData.next_actions.map((action, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-primary rounded-full" />
                    {action}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground">
            생성 시간: {new Date(reportData.generated_at).toLocaleString('ko-KR')}
          </div>
            </div>
            )}
          </TabsContent>

          <TabsContent value="shorts" className="space-y-6">
            {shortsData && (
              <div className="space-y-6">
                {/* 쇼츠 분석 요약 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      {shortsData.accommodationName} - 쇼츠 트렌드 분석
                    </CardTitle>
                    <p className="text-muted-foreground">{shortsData.location}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{shortsData.analysis.totalVideosFound.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">분석 영상 수</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{shortsData.analysis.avgViewsPerKeyword.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">평균 조회수</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{shortsData.analysis.totalKeywordsAnalyzed}</div>
                        <div className="text-sm text-muted-foreground">키워드 분석</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{(shortsData.analysis.totalViewsAnalyzed / 1000000).toFixed(1)}M</div>
                        <div className="text-sm text-muted-foreground">총 조회수</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 트렌딩 키워드 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hash className="h-5 w-5" />
                      핫한 키워드 TOP 8
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {shortsData.trendingKeywords.map((keyword, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <h3 className="font-semibold">{keyword.keyword}</h3>
                            <Badge variant={keyword.opportunity === 'high' ? 'default' : keyword.opportunity === 'medium' ? 'secondary' : 'outline'}>
                              {keyword.opportunity === 'high' ? '🔥 HOT' : keyword.opportunity === 'medium' ? '📈 유망' : '💡 잠재'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              <span>{keyword.avgViews.toLocaleString()}회 평균</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Video className="h-3 w-3" />
                              <span>{keyword.totalVideos}개 영상</span>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            쇼츠 비율: {keyword.shortsRatio.toFixed(1)}%
                          </div>
                          {keyword.topChannels.length > 0 && (
                            <div className="text-xs">
                              <span className="text-muted-foreground">인기 채널: </span>
                              <span>{keyword.topChannels.map(c => c.name).join(', ')}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 콘텐츠 제작 제안 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      콘텐츠 제작 가이드
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {shortsData.contentSuggestions.map((suggestion, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold">"{suggestion.keyword}" 콘텐츠</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant={suggestion.priority === 'high' ? 'default' : 'secondary'}>
                              {suggestion.priority === 'high' ? '높음' : '보통'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              예상 {suggestion.expectedViews.toLocaleString()}회
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <h4 className="text-sm font-medium mb-1">💡 콘텐츠 아이디어:</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {suggestion.contentIdeas.map((idea, i) => (
                                <li key={i}>• {idea}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium mb-1">🏷️ 추천 해시태그:</h4>
                            <div className="flex flex-wrap gap-1">
                              {suggestion.hashtagSuggestions.map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* 성과 예측 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      성과 예측 & ROI
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded">
                        <div className="text-lg font-bold text-red-600">
                          {shortsData.performancePrediction.expectedReach.pessimistic.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">보수적 예상</div>
                      </div>
                      <div className="text-center p-4 border rounded border-primary">
                        <div className="text-lg font-bold text-primary">
                          {shortsData.performancePrediction.expectedReach.realistic.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">현실적 예상</div>
                      </div>
                      <div className="text-center p-4 border rounded">
                        <div className="text-lg font-bold text-green-600">
                          {shortsData.performancePrediction.expectedReach.optimistic.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">낙관적 예상</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">📈 예상 ROI</h4>
                        <div className="text-sm space-y-1">
                          <div>비용: {shortsData.performancePrediction.roi_prediction.content_cost}</div>
                          <div>예상 예약: {shortsData.performancePrediction.roi_prediction.expected_bookings}</div>
                          <div className="font-semibold text-green-600">
                            수익 임팩트: {shortsData.performancePrediction.roi_prediction.revenue_impact}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">✅ 성공 지표</h4>
                        <ul className="text-sm space-y-1">
                          {shortsData.performancePrediction.success_indicators.map((indicator, i) => (
                            <li key={i}>• {indicator}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      <strong>바이럴 예상 시점:</strong> {shortsData.performancePrediction.timeToViral.estimated_days}
                    </div>
                  </CardContent>
                </Card>

                <div className="text-center text-sm text-muted-foreground">
                  생성 시간: {new Date(shortsData.updateTime).toLocaleString('ko-KR')} |
                  데이터 소스: YouTube Data API
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* 로딩 상태 */}
      {loading && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}