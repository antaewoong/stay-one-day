'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  TrendingUp,
  Target,
  DollarSign,
  Megaphone,
  Star,
  Users,
  BarChart3,
  Lightbulb,
  Loader2,
  Sparkles,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

interface Accommodation {
  id: string
  name: string
  accommodation_type: string
  region: string
  base_price: number
  max_capacity: number
}

interface MarketingAnalysis {
  targetAudience: {
    primary: string
    secondary: string[]
    demographics: string
  }
  pricingStrategy: {
    currentPosition: string
    recommendations: string[]
    seasonalPricing: string
  }
  promotionChannels: {
    recommended: string[]
    contentStrategy: string[]
  }
  uniqueSellingPoints: string[]
  improvementSuggestions: string[]
}

export default function MarketingAnalysisPage() {
  const router = useRouter()
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null)
  const [analysis, setAnalysis] = useState<MarketingAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadHostAccommodations()
  }, [])

  const loadHostAccommodations = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/signin')
        return
      }

      // 호스트의 숙소 목록 조회
      const { data, error } = await supabase
        .from('accommodations')
        .select(`
          id,
          name,
          accommodation_type,
          region,
          base_price,
          max_capacity
        `)
        .eq('host_id', session.user.id)
        .eq('status', 'active')

      if (error) throw error
      setAccommodations(data || [])
      
      if (data && data.length > 0) {
        setSelectedAccommodation(data[0])
      }
    } catch (err) {
      console.error('숙소 목록 로드 실패:', err)
      setError('숙소 목록을 불러올 수 없습니다')
    }
  }

  const generateAnalysis = async (accommodationId: string) => {
    if (!accommodationId) return

    setLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      const response = await fetch('/api/ai/marketing-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accommodationId }),
      })

      if (!response.ok) {
        throw new Error('마케팅 분석 요청에 실패했습니다')
      }

      const result = await response.json()
      
      if (result.success) {
        setAnalysis(result.data.analysis)
      } else {
        throw new Error(result.error || '분석 생성에 실패했습니다')
      }
    } catch (err) {
      console.error('마케팅 분석 생성 실패:', err)
      setError(err instanceof Error ? err.message : '분석 생성 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (accommodations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">등록된 숙소가 없습니다</h2>
            <p className="text-gray-500 mb-4">마케팅 분석을 받으려면 먼저 숙소를 등록해주세요</p>
            <Link href="/host/accommodations/new">
              <Button className="bg-blue-600 hover:bg-blue-700">
                숙소 등록하기
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/host" className="flex items-center text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5 mr-1" />
              호스트 대시보드
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-7 h-7 text-blue-600" />
                AI 마케팅 분석
              </h1>
              <p className="text-gray-500">숙소별 맞춤 마케팅 전략을 제안받으세요</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 숙소 선택 */}
          <div className="lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">숙소 선택</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {accommodations.map((accommodation) => (
                  <div
                    key={accommodation.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedAccommodation?.id === accommodation.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedAccommodation(accommodation)}
                  >
                    <h3 className="font-medium text-gray-900">{accommodation.name}</h3>
                    <div className="text-sm text-gray-500 mt-1">
                      <p>{accommodation.accommodation_type} • {accommodation.region}</p>
                      <p>{accommodation.base_price.toLocaleString()}원 • 최대 {accommodation.max_capacity}명</p>
                    </div>
                  </div>
                ))}
                
                <Button
                  onClick={() => selectedAccommodation && generateAnalysis(selectedAccommodation.id)}
                  disabled={loading || !selectedAccommodation}
                  className="w-full mt-4"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      AI 분석 중...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      마케팅 분석 시작
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 분석 결과 */}
          <div className="lg:col-span-8">
            {error && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="text-center text-red-600">
                    <p>{error}</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => selectedAccommodation && generateAnalysis(selectedAccommodation.id)}
                    >
                      다시 시도
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {loading && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">AI가 마케팅 전략을 분석하고 있습니다...</p>
                    <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {analysis && !loading && (
              <div className="space-y-6">
                {/* 타겟 고객층 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      타겟 고객층 분석
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">주요 타겟</h4>
                        <Badge variant="secondary" className="mb-2">{analysis.targetAudience.primary}</Badge>
                        <p className="text-sm text-gray-600">{analysis.targetAudience.demographics}</p>
                      </div>
                      {analysis.targetAudience.secondary.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">부차적 타겟</h4>
                          <div className="flex gap-2 flex-wrap">
                            {analysis.targetAudience.secondary.map((target, index) => (
                              <Badge key={index} variant="outline">{target}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 가격 전략 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      가격 전략
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">현재 포지셔닝</h4>
                        <p className="text-sm text-gray-600">{analysis.pricingStrategy.currentPosition}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">시즌별 전략</h4>
                        <p className="text-sm text-gray-600">{analysis.pricingStrategy.seasonalPricing}</p>
                      </div>
                      {analysis.pricingStrategy.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">개선 제안</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {analysis.pricingStrategy.recommendations.map((rec, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 홍보 채널 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-purple-600" />
                      홍보 채널 & 전략
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">추천 채널</h4>
                        <div className="space-y-2">
                          {analysis.promotionChannels.recommended.map((channel, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <BarChart3 className="w-4 h-4 text-blue-600" />
                              {channel}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">콘텐츠 전략</h4>
                        <div className="space-y-2">
                          {analysis.promotionChannels.contentStrategy.map((strategy, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5" />
                              {strategy}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 차별화 포인트 & 개선사항 */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-600" />
                        차별화 포인트
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.uniqueSellingPoints.map((point, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <span className="text-yellow-600 mt-1">★</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        개선 제안사항
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.improvementSuggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <span className="text-green-600 mt-1">→</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}