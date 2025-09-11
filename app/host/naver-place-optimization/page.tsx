'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  MapPin,
  Phone,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Target,
  Calendar,
  Clock,
  Users
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

interface NaverPlaceAnalysis {
  currentStatus: {
    isRegistered: boolean
    visibility: number
    ranking: number
    completeness: number
    issues: string[]
  }
  optimizationPlan: Array<{
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
    action: string
    expectedImpact: string
    implementation: string
    timeframe: string
  }>
  competitorComparison: {
    nearbyCount: number
    averageRating: number
    averageReviews: number
    myPosition: number
    weaknesses: string[]
    opportunities: string[]
  }
  actionableSteps: {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
  }
}

export default function NaverPlaceOptimizationPage() {
  const router = useRouter()
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null)
  const [analysis, setAnalysis] = useState<NaverPlaceAnalysis | null>(null)
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

      // 🔐 RLS 준수: 호스트 역할 확인
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single()

      if (!userRole || userRole.role !== 'host') {
        router.push('/auth/signin')
        return
      }

      // 호스트 정보 조회
      const { data: hostData, error: hostError } = await supabase
        .from('hosts')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

      if (hostError) {
        console.error('호스트 정보 조회 실패:', hostError)
        setError('호스트 정보를 찾을 수 없습니다')
        return
      }

      // RLS 정책에 의해 자동으로 본인 숙소만 조회됨
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
        .eq('host_id', hostData.id)
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

  const generateNaverAnalysis = async (accommodationId: string) => {
    if (!accommodationId) return

    setLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      const response = await fetch('/api/ai/naver-place-optimization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accommodationId }),
      })

      if (!response.ok) {
        throw new Error('네이버 플레이스 분석 요청에 실패했습니다')
      }

      const result = await response.json()
      
      if (result.success) {
        setAnalysis(result.data.analysis)
      } else {
        throw new Error(result.error || '분석 생성에 실패했습니다')
      }
    } catch (err) {
      console.error('네이버 플레이스 분석 실패:', err)
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
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">등록된 숙소가 없습니다</h2>
            <p className="text-gray-500 mb-4">네이버 플레이스 최적화를 받으려면 먼저 숙소를 등록해주세요</p>
            <Link href="/host/accommodations/new">
              <Button className="bg-green-600 hover:bg-green-700">
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
                <MapPin className="w-7 h-7 text-green-600" />
                네이버 플레이스 최적화
              </h1>
              <p className="text-gray-500">한국 시장 핵심 플랫폼 네이버에서의 노출을 극대화하세요</p>
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
                        ? 'border-green-500 bg-green-50'
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
                  onClick={() => selectedAccommodation && generateNaverAnalysis(selectedAccommodation.id)}
                  disabled={loading || !selectedAccommodation}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      네이버 분석 중...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 mr-2" />
                      네이버 플레이스 분석
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
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                    <p>{error}</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => selectedAccommodation && generateNaverAnalysis(selectedAccommodation.id)}
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
                    <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
                    <p className="text-gray-600">네이버 플레이스 최적화 분석 중...</p>
                    <p className="text-sm text-gray-500 mt-2">한국 시장 특성을 반영한 맞춤 전략을 수립하고 있습니다</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {analysis && !loading && (
              <div className="space-y-6">
                {/* 현재 상태 요약 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-green-600" />
                      네이버 플레이스 현황
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">등록 상태</span>
                            {analysis.currentStatus.isRegistered ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {analysis.currentStatus.isRegistered ? '등록 완료' : '미등록 - 즉시 등록 필요'}
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">가시성 점수</span>
                            <span className="text-sm font-bold">{analysis.currentStatus.visibility}점</span>
                          </div>
                          <Progress value={analysis.currentStatus.visibility} className="h-2" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">정보 완성도</span>
                            <span className="text-sm font-bold">{analysis.currentStatus.completeness}%</span>
                          </div>
                          <Progress value={analysis.currentStatus.completeness} className="h-2" />
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">개선 필요사항</h4>
                        <div className="space-y-2">
                          {analysis.currentStatus.issues.map((issue, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                              <AlertTriangle className="w-4 h-4" />
                              {issue}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 경쟁사 비교 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      지역 경쟁 분석
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{analysis.competitorComparison.nearbyCount}</div>
                        <div className="text-sm text-gray-500">주변 경쟁업체</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{analysis.competitorComparison.averageRating.toFixed(1)}</div>
                        <div className="text-sm text-gray-500">평균 평점</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{analysis.competitorComparison.myPosition}위</div>
                        <div className="text-sm text-gray-500">현재 순위</div>
                      </div>
                    </div>

                    {analysis.competitorComparison.opportunities.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900 mb-2">기회 요소</h4>
                        <div className="space-y-1">
                          {analysis.competitorComparison.opportunities.map((opportunity, index) => (
                            <div key={index} className="text-sm text-green-600 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" />
                              {opportunity}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 최적화 계획 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-600" />
                      최적화 액션 플랜
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysis.optimizationPlan.map((plan, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={plan.priority === 'HIGH' ? 'destructive' : plan.priority === 'MEDIUM' ? 'default' : 'secondary'}
                              >
                                {plan.priority}
                              </Badge>
                              <span className="font-medium">{plan.action}</span>
                            </div>
                            <Badge variant="outline">{plan.timeframe}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{plan.implementation}</p>
                          <div className="text-sm text-green-600 flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            예상 효과: {plan.expectedImpact}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 단계별 실행 계획 */}
                <div className="grid md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Clock className="w-5 h-5 text-red-600" />
                        즉시 실행
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.actionableSteps.immediate.map((step, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-red-600 mt-1">•</span>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="w-5 h-5 text-yellow-600" />
                        단기 계획
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.actionableSteps.shortTerm.map((step, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-yellow-600 mt-1">•</span>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        장기 전략
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.actionableSteps.longTerm.map((step, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-green-600 mt-1">•</span>
                            {step}
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