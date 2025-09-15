'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Separator
} from '@/components/ui/separator'
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
  Hash,
  MapPin,
  Users,
  DollarSign,
  Star,
  Search,
  Sparkles,
  Activity,
  Settings,
  Plus,
  X,
  ChevronRight,
  TrendingDown,
  Award,
  Brain,
  Palette,
  Shield,
  Globe
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface QuotaStatus {
  used: number
  remaining: number
  reset_date: string
}

interface KeywordContext {
  selectedKeywords: string[]
  isTemporaryAnalysis: boolean
  keywordBasedAnalysis: boolean
}

interface MarketingAnalysisResponse {
  success: boolean
  accommodationName: string
  location: string
  keywordContext?: KeywordContext
  quota_status: QuotaStatus
  updateTime: string
}

interface KeywordOption {
  slug: string
  display_name: string
  category: 'family' | 'party' | 'business' | 'travel'
  priority: number
}

const ANALYSIS_TYPES = [
  {
    id: 'local-demand',
    title: '지역 수요 레이더',
    description: '네이버 검색 트렌드 기반 지역 수요 분석',
    icon: Target,
    color: 'bg-blue-500'
  },
  {
    id: 'shorts-trends',
    title: '쇼츠 트렌드 레이더',
    description: 'YouTube Shorts 바이럴 기회 발견',
    icon: Video,
    color: 'bg-red-500'
  },
  {
    id: 'event-suggestions',
    title: '이벤트/날씨 제안',
    description: '날씨와 이벤트 기반 마케팅 기회',
    icon: Calendar,
    color: 'bg-green-500'
  },
  {
    id: 'ad-waste-analysis',
    title: '광고 낭비 방지',
    description: '광고 비용 최적화 및 ROI 분석',
    icon: DollarSign,
    color: 'bg-yellow-500'
  },
  {
    id: 'competitor-analysis',
    title: '경쟁사 분석',
    description: '시장 포지셔닝 및 경쟁 우위 분석',
    icon: Award,
    color: 'bg-purple-500'
  },
  {
    id: 'naver-place-health',
    title: '네이버 플레이스 건강도',
    description: '네이버 플레이스 최적화 분석',
    icon: Star,
    color: 'bg-orange-500'
  },
  {
    id: 'content-studio',
    title: '콘텐츠 스튜디오',
    description: 'AI 기반 콘텐츠 제작 및 전략',
    icon: Palette,
    color: 'bg-pink-500'
  }
]

const CATEGORY_LABELS = {
  family: '가족/키즈',
  party: '파티/모임',
  business: '비즈니스',
  travel: '여행/힐링'
}

export default function MarketingStudioPage() {
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  const [accommodations, setAccommodations] = useState<any[]>([])
  const [selectedAccommodation, setSelectedAccommodation] = useState<string>('')
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [tempKeywords, setTempKeywords] = useState<string>('')
  const [useTempKeywords, setUseTempKeywords] = useState(false)
  const [availableKeywords, setAvailableKeywords] = useState<KeywordOption[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<{ [key: string]: any }>({})
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchAccommodations()
      fetchPopularKeywords()
    }
  }, [user])

  useEffect(() => {
    if (selectedAccommodation) {
      fetchSelectedKeywords()
    }
  }, [selectedAccommodation])

  const fetchAccommodations = async () => {
    try {
      const { data, error } = await supabase
        .from('accommodations')
        .select('id, name, city, region, accommodation_type')
        .order('name')

      if (error) throw error
      setAccommodations(data || [])
      if (data && data.length > 0) {
        setSelectedAccommodation(data[0].id)
      }
    } catch (error) {
      console.error('숙소 조회 오류:', error)
      setError('숙소 정보를 불러올 수 없습니다')
    }
  }

  const fetchPopularKeywords = async () => {
    try {
      const response = await fetch('/api/keywords/popular?limit=50')
      const data = await response.json()

      if (data.success) {
        setAvailableKeywords(data.keywords)
      }
    } catch (error) {
      console.error('키워드 조회 오류:', error)
    }
  }

  const fetchSelectedKeywords = async () => {
    try {
      const response = await fetch(`/api/host/accommodations/${selectedAccommodation}/keywords`)
      const data = await response.json()

      if (data.success) {
        setSelectedKeywords(data.selectedKeywords.map((kw: any) => kw.slug))
      }
    } catch (error) {
      console.error('선택된 키워드 조회 오류:', error)
    }
  }

  const handleKeywordToggle = async (keyword: string) => {
    const isSelected = selectedKeywords.includes(keyword)

    if (isSelected) {
      // 키워드 제거
      const newKeywords = selectedKeywords.filter(kw => kw !== keyword)
      setSelectedKeywords(newKeywords)
      await updateKeywords([], [keyword])
    } else {
      // 키워드 추가
      if (selectedKeywords.length >= 5) {
        setError('최대 5개 키워드까지만 선택할 수 있습니다')
        return
      }

      const newKeywords = [...selectedKeywords, keyword]
      setSelectedKeywords(newKeywords)
      await updateKeywords([keyword], [])
    }
  }

  const updateKeywords = async (add: string[], remove: string[]) => {
    try {
      const response = await fetch(`/api/host/accommodations/${selectedAccommodation}/keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ add, remove })
      })

      const data = await response.json()
      if (!data.success && data.error) {
        setError(data.error)
      } else {
        setError(null)
      }
    } catch (error) {
      setError('키워드 업데이트 중 오류가 발생했습니다')
    }
  }

  const runAnalysis = async (analysisType: string) => {
    if (!selectedAccommodation) {
      setError('숙소를 선택해주세요')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ accommodationId: selectedAccommodation })

      if (useTempKeywords && tempKeywords.trim()) {
        params.append('tempKeywords', tempKeywords.trim())
      }

      const response = await fetch(`/api/host/${analysisType}?${params}`)
      const data = await response.json()

      if (response.status === 429) {
        setError('이번 주 분석 2회를 모두 사용하셨습니다')
        setQuotaStatus(data.quota_status)
      } else if (data.success) {
        setAnalysisResults(prev => ({
          ...prev,
          [analysisType]: data
        }))
        setQuotaStatus(data.quota_status)
      } else {
        setError(data.error || '분석 중 오류가 발생했습니다')
      }
    } catch (error) {
      setError('분석 실행 중 네트워크 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const filteredKeywords = availableKeywords.filter(kw =>
    kw.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kw.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const keywordsByCategory = filteredKeywords.reduce((acc, keyword) => {
    if (!acc[keyword.category]) acc[keyword.category] = []
    acc[keyword.category].push(keyword)
    return acc
  }, {} as Record<string, KeywordOption[]>)

  const selectedAccommodationInfo = accommodations.find(acc => acc.id === selectedAccommodation)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🚀 마케팅 스튜디오
          </h1>
          <p className="text-gray-600 mt-2">
            AI 기반 통합 마케팅 분석 및 최적화 도구
          </p>
        </div>

        {quotaStatus && (
          <div className="text-right">
            <Badge variant={quotaStatus.remaining > 0 ? "default" : "destructive"}>
              이번 주 {quotaStatus.used}/2 사용
            </Badge>
            <p className="text-sm text-gray-500 mt-1">
              다음 리셋: {new Date(quotaStatus.reset_date).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="setup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">🎯 설정 & 키워드</TabsTrigger>
          <TabsTrigger value="analysis">📊 분석 실행</TabsTrigger>
          <TabsTrigger value="results">📈 결과 대시보드</TabsTrigger>
        </TabsList>

        {/* 설정 및 키워드 선택 */}
        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                기본 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="accommodation">분석할 숙소 선택</Label>
                <Select value={selectedAccommodation} onValueChange={setSelectedAccommodation}>
                  <SelectTrigger>
                    <SelectValue placeholder="숙소를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {accommodations.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name} ({acc.city}, {acc.region})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAccommodationInfo && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900">{selectedAccommodationInfo.name}</h3>
                  <p className="text-blue-700">
                    📍 {selectedAccommodationInfo.city}, {selectedAccommodationInfo.region} |
                    🏠 {selectedAccommodationInfo.accommodation_type}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                나의 주요 키워드 선택 ({selectedKeywords.length}/5)
              </CardTitle>
              <p className="text-sm text-gray-600">
                숙소의 특화 분야를 최대 5개까지 선택하면, 모든 분석이 해당 키워드로 정밀 조준됩니다.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="keyword-search">키워드 검색</Label>
                <Input
                  id="keyword-search"
                  placeholder="키워드 검색... (예: 키즈풀, 브라이덜파티, 워크샵)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-4"
                />
              </div>

              <div className="space-y-4">
                {Object.entries(keywordsByCategory).map(([category, keywords]) => (
                  <div key={category}>
                    <h4 className="font-medium text-gray-700 mb-2">
                      {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((keyword) => (
                        <Badge
                          key={keyword.slug}
                          variant={selectedKeywords.includes(keyword.slug) ? "default" : "secondary"}
                          className="cursor-pointer transition-all hover:scale-105"
                          onClick={() => handleKeywordToggle(keyword.slug)}
                        >
                          {selectedKeywords.includes(keyword.slug) && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {keyword.display_name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {selectedKeywords.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">선택된 키워드</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedKeywords.map((slug) => {
                      const keyword = availableKeywords.find(kw => kw.slug === slug)
                      return (
                        <Badge key={slug} variant="default" className="bg-green-600">
                          {keyword?.display_name || slug}
                          <X
                            className="w-3 h-3 ml-1 cursor-pointer"
                            onClick={() => handleKeywordToggle(slug)}
                          />
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                임시 키워드 (1회성 분석)
              </CardTitle>
              <p className="text-sm text-gray-600">
                저장하지 않고 일회성으로 특정 키워드를 테스트해볼 수 있습니다.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="use-temp-keywords"
                  checked={useTempKeywords}
                  onChange={(e) => setUseTempKeywords(e.target.checked)}
                />
                <Label htmlFor="use-temp-keywords">임시 키워드 사용</Label>
              </div>

              {useTempKeywords && (
                <div>
                  <Label htmlFor="temp-keywords">임시 키워드 (쉼표로 구분)</Label>
                  <Input
                    id="temp-keywords"
                    placeholder="예: 겨울축제, 스키패키지, 온천여행"
                    value={tempKeywords}
                    onChange={(e) => setTempKeywords(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    이 키워드들은 이번 분석에만 사용되며 저장되지 않습니다.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 분석 실행 */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ANALYSIS_TYPES.map((analysis) => (
              <Card key={analysis.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${analysis.color}`}>
                      <analysis.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{analysis.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {analysis.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    onClick={() => runAnalysis(analysis.id)}
                    disabled={loading || !selectedAccommodation || (quotaStatus?.remaining === 0)}
                    className="w-full"
                    variant={analysisResults[analysis.id] ? "secondary" : "default"}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        분석 중...
                      </div>
                    ) : analysisResults[analysis.id] ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        다시 실행
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        분석 실행
                      </div>
                    )}
                  </Button>

                  {analysisResults[analysis.id] && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        ✅ 완료: {new Date(analysisResults[analysis.id].updateTime).toLocaleString()}
                      </p>
                      {analysisResults[analysis.id].keywordContext?.keywordBasedAnalysis && (
                        <p className="text-xs text-green-600 mt-1">
                          🎯 키워드 기반 분석 적용됨
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {quotaStatus?.remaining === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                이번 주 분석 할당량(2회)을 모두 사용했습니다.
                다음 주 {new Date(quotaStatus.reset_date).toLocaleDateString()}에 리셋됩니다.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* 결과 대시보드 */}
        <TabsContent value="results" className="space-y-6">
          {Object.keys(analysisResults).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">분석 결과가 없습니다</h3>
                <p className="text-gray-500 text-center mb-4">
                  분석 탭에서 원하는 분석을 실행해주세요.
                </p>
                <Button variant="outline" onClick={() => document.querySelector('[value="analysis"]')?.click()}>
                  분석 실행하러 가기
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(analysisResults).map(([analysisType, data]) => {
                const analysisInfo = ANALYSIS_TYPES.find(a => a.id === analysisType)

                return (
                  <Card key={analysisType}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {analysisInfo && <analysisInfo.icon className="w-5 h-5" />}
                        {analysisInfo?.title || analysisType}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>📍 {data.location}</span>
                        <span>🏠 {data.accommodationName}</span>
                        <span>⏰ {new Date(data.updateTime).toLocaleString()}</span>
                        {data.keywordContext?.keywordBasedAnalysis && (
                          <Badge variant="secondary">🎯 키워드 분석</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* 요약 정보 표시 */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(data.summary || {}).map(([key, value]) => (
                            <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                              <p className="text-lg font-semibold">{value}</p>
                            </div>
                          ))}
                        </div>

                        {/* 키워드 컨텍스트 표시 */}
                        {data.keywordContext?.selectedKeywords && (
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-blue-900 mb-2">적용된 키워드</h4>
                            <div className="flex flex-wrap gap-2">
                              {data.keywordContext.selectedKeywords.map((keyword: string) => (
                                <Badge key={keyword} variant="default" className="bg-blue-600">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-center">
                          <Button variant="outline" size="sm">
                            <ChevronRight className="w-4 h-4 mr-1" />
                            상세 결과 보기
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}