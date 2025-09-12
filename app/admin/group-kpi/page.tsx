'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Heart, Camera, Baby, Crown, TrendingUp, TrendingDown, Minus, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface GroupKPIData {
  totalGroupBookings: number
  groupRevenue: number
  avgGroupSize: number
  groupGrowthRate: number
  
  personaBreakdown: {
    moms: { bookings: number; revenue: number; growth: number }
    bridal: { bookings: number; revenue: number; growth: number }
    friends: { bookings: number; revenue: number; growth: number }
    couples: { bookings: number; revenue: number; growth: number }
  }
  
  emotionScores: {
    photoSpotScore: number
    kidsFriendlyScore: number
    convenienceScore: number
    sentimentScore: number
    lhiGroupScore: number
  }
  
  sameDayFitMetrics: {
    moms: number
    bridal: number
    friends: number
    couples: number
    recommended: string
  }
  
  abTestResults: {
    testGroup: string
    conversionRate: number
    bookingRate: number
    isWinning: boolean
  }[]
}

interface AccommodationOption {
  id: string
  name: string
  location: string
}

const PersonaIcons = {
  moms: Baby,
  bridal: Crown,
  friends: Users,
  couples: Heart
}

const PersonaColors = {
  moms: 'bg-pink-100 text-pink-800 border-pink-200',
  bridal: 'bg-purple-100 text-purple-800 border-purple-200',
  friends: 'bg-blue-100 text-blue-800 border-blue-200',
  couples: 'bg-red-100 text-red-800 border-red-200'
}

export default function AdminGroupKPIPage() {
  const [data, setData] = useState<GroupKPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')
  const [selectedAccommodation, setSelectedAccommodation] = useState<string>('all')
  const [accommodations, setAccommodations] = useState<AccommodationOption[]>([])

  useEffect(() => {
    loadAccommodations()
  }, [])

  useEffect(() => {
    fetchKPIData()
  }, [period, selectedAccommodation])

  const loadAccommodations = async () => {
    try {
      const { data: accommodationData } = await supabase
        .from('accommodations')
        .select('id, name, location')
        .eq('status', 'active')
        .order('name')

      if (accommodationData) {
        setAccommodations(accommodationData)
      }
    } catch (error) {
      console.error('숙소 목록 로딩 실패:', error)
    }
  }

  const fetchKPIData = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        period,
        ...(selectedAccommodation !== 'all' && { accommodationId: selectedAccommodation })
      })
      
      const response = await fetch(`/api/admin/group-kpi?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch KPI data')
      }

      const kpiData = await response.json()
      setData(kpiData)
    } catch (error) {
      console.error('KPI 데이터 로딩 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  const getTrendIcon = (growth: number) => {
    if (growth > 5) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (growth < -5) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const getTrendColor = (growth: number) => {
    if (growth > 5) return 'text-green-600'
    if (growth < -5) return 'text-red-600'
    return 'text-gray-500'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-96"></div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 p-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">데이터를 불러올 수 없습니다</h1>
          <Button onClick={fetchKPIData}>다시 시도</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              🎯 전체 그룹 예약 KPI 대시보드
            </h1>
            <div className="flex items-center gap-4">
              <Select value={selectedAccommodation} onValueChange={setSelectedAccommodation}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="숙소 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 숙소</SelectItem>
                  {accommodations.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} - {acc.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Tabs value={period} onValueChange={setPeriod}>
                <TabsList>
                  <TabsTrigger value="7d">7일</TabsTrigger>
                  <TabsTrigger value="30d">30일</TabsTrigger>
                  <TabsTrigger value="90d">90일</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          <p className="text-gray-600 mt-2">
            전체 플랫폼의 모임 특화 마케팅 성과를 관리하고 분석하세요
          </p>
        </div>

        {/* 메인 KPI 카드 5종 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          
          {/* 1. 전체 그룹 성과 카드 */}
          <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  전체 그룹 성과
                </span>
                <Badge variant="outline" className="text-white border-white/30 bg-white/10">
                  {period}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-2xl font-bold">{formatNumber(data.totalGroupBookings)}</p>
                <p className="text-blue-100 text-sm">총 그룹 예약</p>
              </div>
              <div>
                <p className="text-xl font-semibold">{formatCurrency(data.groupRevenue)}</p>
                <p className="text-blue-100 text-sm">그룹 예약 매출</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-100">성장률</span>
                <span className="flex items-center gap-1 text-sm font-medium">
                  {getTrendIcon(data.groupGrowthRate)}
                  {data.groupGrowthRate > 0 ? '+' : ''}{data.groupGrowthRate.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 2. 페르소나별 성과 카드 */}
          <Card className="bg-gradient-to-br from-pink-400 to-rose-500 text-white border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  페르소나 성과
                </span>
                <Badge variant="outline" className="text-white border-white/30 bg-white/10">
                  TOP
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(data.personaBreakdown)
                .sort(([,a], [,b]) => b.bookings - a.bookings)
                .slice(0, 2)
                .map(([persona, stats]) => {
                  const Icon = PersonaIcons[persona as keyof typeof PersonaIcons]
                  return (
                    <div key={persona} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium capitalize">
                          {persona === 'moms' ? '엄마모임' : 
                           persona === 'bridal' ? '브라이덜' : 
                           persona === 'friends' ? '친구모임' : '커플'}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatNumber(stats.bookings)}</p>
                        <p className="text-xs text-pink-100">{formatCurrency(stats.revenue)}</p>
                      </div>
                    </div>
                  )
                })}
              <div className="pt-2 border-t border-white/20">
                <p className="text-xs text-pink-100">평균 그룹 크기: {data.avgGroupSize}명</p>
              </div>
            </CardContent>
          </Card>

          {/* 3. POI 감정 점수 카드 */}
          <Card className="bg-gradient-to-br from-green-400 to-emerald-500 text-white border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  감정 기반 점수
                </span>
                <Badge variant="outline" className="text-white border-white/30 bg-white/10">
                  LHI
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-2xl font-bold">{data.emotionScores.lhiGroupScore.toFixed(1)}</p>
                <p className="text-green-100 text-sm">종합 LHI Group 점수</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-green-100">포토존</span>
                  <span>{data.emotionScores.photoSpotScore.toFixed(1)}</span>
                </div>
                <Progress 
                  value={(data.emotionScores.photoSpotScore / data.emotionScores.lhiGroupScore) * 100} 
                  className="h-1 bg-white/20" 
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-green-100">아이친화</span>
                  <span>{data.emotionScores.kidsFriendlyScore.toFixed(1)}</span>
                </div>
                <Progress 
                  value={(data.emotionScores.kidsFriendlyScore / data.emotionScores.lhiGroupScore) * 100} 
                  className="h-1 bg-white/20" 
                />
              </div>
            </CardContent>
          </Card>

          {/* 4. Same-Day Fit 추천 카드 */}
          <Card className="bg-gradient-to-br from-orange-400 to-red-500 text-white border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  SF 추천 지수
                </span>
                <Badge variant="outline" className="text-white border-white/30 bg-white/10">
                  추천
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center">
                <div className="text-3xl mb-2">
                  {data.sameDayFitMetrics.recommended === 'moms' ? '👶' :
                   data.sameDayFitMetrics.recommended === 'bridal' ? '👰' :
                   data.sameDayFitMetrics.recommended === 'friends' ? '👥' : '💕'}
                </div>
                <p className="font-bold text-lg">
                  {data.sameDayFitMetrics.recommended === 'moms' ? '엄마모임' :
                   data.sameDayFitMetrics.recommended === 'bridal' ? '브라이덜' :
                   data.sameDayFitMetrics.recommended === 'friends' ? '친구모임' : '커플'}
                </p>
                <p className="text-orange-100 text-sm">최적 페르소나</p>
              </div>
              <div className="space-y-2">
                {Object.entries(data.sameDayFitMetrics)
                  .filter(([key]) => key !== 'recommended')
                  .map(([persona, score]) => (
                    <div key={persona} className="flex justify-between text-xs">
                      <span className="text-orange-100 capitalize">
                        {persona === 'moms' ? '엄마' : 
                         persona === 'bridal' ? '브라이덜' : 
                         persona === 'friends' ? '친구' : '커플'}
                      </span>
                      <span className="font-medium">{(score as number).toFixed(1)}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* 5. A/B 테스트 성과 카드 */}
          <Card className="bg-gradient-to-br from-purple-400 to-indigo-500 text-white border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  A/B 테스트
                </span>
                <Badge variant="outline" className="text-white border-white/30 bg-white/10">
                  실험
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.abTestResults.length > 0 ? (
                <>
                  <div>
                    <p className="text-2xl font-bold">
                      {data.abTestResults[0]?.testGroup || 'A'} 그룹
                    </p>
                    <p className="text-purple-100 text-sm">최고 성과 변형</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-100">전환율</span>
                      <span className="font-medium">
                        {(data.abTestResults[0]?.conversionRate || 0).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-100">예약률</span>
                      <span className="font-medium">
                        {(data.abTestResults[0]?.bookingRate || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/20">
                    <p className="text-xs text-purple-100">
                      {data.abTestResults.filter(t => t.isWinning).length}개 변형이 유의한 성과
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-purple-100">테스트 데이터 준비 중</p>
                  <p className="text-xs text-purple-200 mt-2">곧 결과를 확인할 수 있습니다</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 하단 상세 분석 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 페르소나별 상세 분석 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                페르소나별 상세 성과
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(data.personaBreakdown).map(([persona, stats]) => {
                  const Icon = PersonaIcons[persona as keyof typeof PersonaIcons]
                  return (
                    <div key={persona} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${PersonaColors[persona as keyof typeof PersonaColors]}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {persona === 'moms' ? '엄마모임' : 
                             persona === 'bridal' ? '브라이덜' : 
                             persona === 'friends' ? '친구모임' : '커플데이트'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatNumber(stats.bookings)}건 · {formatCurrency(stats.revenue)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`flex items-center gap-1 ${getTrendColor(stats.growth)}`}>
                          {getTrendIcon(stats.growth)}
                          <span className="text-sm font-medium">
                            {stats.growth > 0 ? '+' : ''}{stats.growth}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* 감정 기반 POI 분석 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                감정 기반 POI 분석
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg bg-blue-50">
                    <p className="text-2xl font-bold text-blue-600">
                      {data.emotionScores.photoSpotScore.toFixed(1)}
                    </p>
                    <p className="text-sm text-blue-800">포토존 점수</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-pink-50">
                    <p className="text-2xl font-bold text-pink-600">
                      {data.emotionScores.kidsFriendlyScore.toFixed(1)}
                    </p>
                    <p className="text-sm text-pink-800">아이친화 점수</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-green-50">
                    <p className="text-2xl font-bold text-green-600">
                      {data.emotionScores.convenienceScore.toFixed(1)}
                    </p>
                    <p className="text-sm text-green-800">편의시설 점수</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-orange-50">
                    <p className="text-2xl font-bold text-orange-600">
                      {data.emotionScores.sentimentScore.toFixed(1)}
                    </p>
                    <p className="text-sm text-orange-800">감정 점수</p>
                  </div>
                </div>
                <div className="text-center p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50">
                  <p className="text-3xl font-bold text-purple-600">
                    {data.emotionScores.lhiGroupScore.toFixed(1)}
                  </p>
                  <p className="text-sm text-purple-800">종합 LHI Group 점수</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}