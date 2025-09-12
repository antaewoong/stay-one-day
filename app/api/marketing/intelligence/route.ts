import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * 🎯 Stay OneDay 차별화 핵심: 지역 상권 인텔리전스 API
 * 
 * 호스트가 반할 수밖에 없는 3가지 강점:
 * 1) 🏪 실시간 지역 상권 분석 - "지금 뜨는 맛집이 300m 거리에!"  
 * 2) 🎯 AI 기반 실행 가능한 제안 - "이 맛집과 제휴하면 예약 25% 증가"
 * 3) 📱 즉시 실행 가능한 액션 - "현수막 설치 or 인스타 릴스 3종"
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // RLS로 호스트 인증 자동 처리
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증 필요' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accommodationId = searchParams.get('accommodationId')
    
    if (!accommodationId) {
      return NextResponse.json({ error: 'accommodationId 필수' }, { status: 400 })
    }

    // 1. 숙소 정보 조회 (RLS 자동 적용)
    const { data: accommodation } = await supabase
      .from('accommodations')
      .select('id, name, address, location_lat, location_lng, host_id')
      .eq('id', accommodationId)
      .single()

    if (!accommodation) {
      return NextResponse.json({ error: '숙소를 찾을 수 없습니다' }, { status: 404 })
    }

    // 2. 🔥 지역 히트 인덱스 (LHI) 조회
    const lhiData = await getLocalHeatIndex(supabase, accommodationId, accommodation)
    
    // 3. 🎯 경쟁사 네이버 플레이스 분석  
    const competitorAnalysis = await getCompetitorAnalysis(supabase, accommodation)
    
    // 4. 💰 채널별 성과 분석 (RLS 적용)
    const channelPerformance = await getChannelPerformance(supabase, accommodation.host_id)
    
    // 5. 🤖 AI 기반 액션 제안
    const aiRecommendations = await generateActionableInsights(
      lhiData, 
      competitorAnalysis, 
      channelPerformance,
      accommodation
    )

    return NextResponse.json({
      success: true,
      data: {
        accommodation: {
          id: accommodation.id,
          name: accommodation.name,
          address: accommodation.address
        },
        localHeatIndex: lhiData,
        competitorAnalysis,
        channelPerformance,
        aiRecommendations,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('마케팅 인텔리전스 조회 실패:', error)
    return NextResponse.json({ 
      error: '분석 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * 🔥 지역 히트 인덱스 (LHI) - 핵심 차별화 기능
 */
async function getLocalHeatIndex(supabase: any, accommodationId: string, accommodation: any) {
  try {
    // 최근 LHI 데이터 조회 (RLS 자동 적용)
    const { data: recentLHI } = await supabase
      .from('poi_heat_daily')
      .select('*')
      .eq('accommodation_id', accommodationId)
      .eq('buffer_m', 500)
      .order('date', { ascending: false })
      .limit(7)

    // LHI가 없으면 실시간 계산
    if (!recentLHI || recentLHI.length === 0) {
      return await calculateRealTimeLHI(supabase, accommodation)
    }

    const latestLHI = recentLHI[0]
    const previousLHI = recentLHI[1]
    
    // 트렌드 계산
    const trend = previousLHI ? 
      ((latestLHI.heat_score - previousLHI.heat_score) / previousLHI.heat_score * 100) : 0

    return {
      currentScore: latestLHI.heat_score,
      trend: Math.round(trend * 10) / 10, // 소수점 1자리
      trendDirection: trend > 5 ? 'up' : trend < -5 ? 'down' : 'stable',
      topContributors: latestLHI.top_contributors,
      insights: generateLHIInsights(latestLHI, trend),
      lastUpdated: latestLHI.date
    }

  } catch (error) {
    console.error('LHI 조회 실패:', error)
    return { currentScore: 0, trend: 0, trendDirection: 'stable', insights: [] }
  }
}

/**
 * 🎯 실시간 LHI 계산 (PostgreSQL 함수 활용)
 */
async function calculateRealTimeLHI(supabase: any, accommodation: any) {
  try {
    // 반경 500m 내 POI 조회
    const { data: nearbyPOIs } = await supabase.rpc('get_nearby_pois', {
      target_lat: accommodation.location_lat,
      target_lng: accommodation.location_lng,
      radius_m: 500
    })

    if (!nearbyPOIs || nearbyPOIs.length === 0) {
      return { currentScore: 0, trend: 0, trendDirection: 'stable', insights: [] }
    }

    // LHI 점수 계산
    let totalScore = 0
    const contributors = []

    for (const poi of nearbyPOIs) {
      const signals = poi.signals || {}
      const reviews = signals.reviews || 0
      const instaTags = signals.insta_tags || 0
      const naverVisits = signals.naver_visits || 0
      
      // 가중치 적용 점수 계산
      const poiScore = (reviews * 0.3 + instaTags * 0.2 + naverVisits * 0.1) * poi.quality_score * 0.1
      totalScore += poiScore
      
      if (poiScore > 10) { // 유의미한 기여도만
        contributors.push({
          name: poi.place_name,
          category: poi.category,
          score: Math.round(poiScore * 10) / 10,
          distance: poi.distance,
          signals: { reviews, instaTags, naverVisits }
        })
      }
    }

    // 상위 기여자 정렬
    contributors.sort((a, b) => b.score - a.score)

    return {
      currentScore: Math.round(totalScore * 10) / 10,
      trend: 0, // 첫 계산이므로 트렌드 없음
      trendDirection: 'stable',
      topContributors: contributors.slice(0, 5),
      insights: generateLHIInsights({ heat_score: totalScore, top_contributors: contributors }, 0),
      lastUpdated: new Date().toISOString().split('T')[0]
    }

  } catch (error) {
    console.error('실시간 LHI 계산 실패:', error)
    return { currentScore: 0, trend: 0, trendDirection: 'stable', insights: [] }
  }
}

/**
 * 📊 경쟁사 네이버 플레이스 분석
 */
async function getCompetitorAnalysis(supabase: any, accommodation: any) {
  try {
    // 최근 경쟁사 스냅샷 조회
    const { data: competitors } = await supabase
      .from('competitor_snapshot')
      .select('*')
      .eq('accommodation_id', accommodation.id)
      .eq('channel', 'naver_place')
      .gte('captured_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('captured_at', { ascending: false })

    if (!competitors || competitors.length === 0) {
      return {
        myRanking: null,
        competitors: [],
        insights: ['네이버 플레이스 데이터를 수집 중입니다.']
      }
    }

    // 내 숙소와 경쟁사 비교 분석
    const myData = competitors.find(c => c.competitor_name === accommodation.name)
    const competitorData = competitors.filter(c => c.competitor_name !== accommodation.name)
      .slice(0, 5) // 상위 5개 경쟁사

    const insights = generateCompetitorInsights(myData, competitorData)

    return {
      myRanking: myData?.keyword_rank || null,
      myReviewCount: myData?.review_count || 0,
      myPhotoCount: myData?.photo_count || 0,
      competitors: competitorData.map(c => ({
        name: c.competitor_name,
        ranking: c.keyword_rank,
        reviewCount: c.review_count,
        photoCount: c.photo_count,
        rating: c.avg_rating,
        responseTime: c.response_time_hours
      })),
      insights
    }

  } catch (error) {
    console.error('경쟁사 분석 실패:', error)
    return { myRanking: null, competitors: [], insights: [] }
  }
}

/**
 * 💰 채널별 성과 분석 (RLS 자동 적용)
 */
async function getChannelPerformance(supabase: any, hostId: string) {
  try {
    // 최근 30일 채널별 성과 (RLS로 호스트 데이터만 자동 필터링)
    const { data: performance } = await supabase
      .from('spend_daily') 
      .select('channel, date, cost, clicks, impressions, conversions')
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: false })

    if (!performance || performance.length === 0) {
      return { channels: [], totalSpend: 0, bestChannel: null }
    }

    // 채널별 집계
    const channelSummary = performance.reduce((acc, row) => {
      if (!acc[row.channel]) {
        acc[row.channel] = {
          channel: row.channel,
          totalCost: 0,
          totalClicks: 0,
          totalImpressions: 0,
          totalConversions: 0
        }
      }
      
      acc[row.channel].totalCost += row.cost || 0
      acc[row.channel].totalClicks += row.clicks || 0  
      acc[row.channel].totalImpressions += row.impressions || 0
      acc[row.channel].totalConversions += row.conversions || 0
      
      return acc
    }, {})

    // ROAS 계산 및 채널별 성과
    const channels = Object.values(channelSummary).map((channel: any) => ({
      ...channel,
      ctr: channel.totalImpressions > 0 ? 
        (channel.totalClicks / channel.totalImpressions * 100) : 0,
      cpa: channel.totalConversions > 0 ? 
        (channel.totalCost / channel.totalConversions) : null,
      conversionRate: channel.totalClicks > 0 ?
        (channel.totalConversions / channel.totalClicks * 100) : 0
    }))

    // 최고 성과 채널 찾기
    const bestChannel = channels.reduce((best, current) => 
      (current.conversionRate > best.conversionRate) ? current : best
    )

    return {
      channels,
      totalSpend: channels.reduce((sum, c) => sum + c.totalCost, 0),
      bestChannel: bestChannel.channel,
      insights: generateChannelInsights(channels)
    }

  } catch (error) {
    console.error('채널 성과 분석 실패:', error)
    return { channels: [], totalSpend: 0, bestChannel: null, insights: [] }
  }
}

/**
 * 🤖 AI 기반 실행 가능한 인사이트 생성
 */
async function generateActionableInsights(lhi: any, competitors: any, channels: any, accommodation: any) {
  const insights = []
  const actions = []

  // 1. LHI 기반 제안
  if (lhi.trend > 15) {
    insights.push(`🔥 지역 히트 급등: ${lhi.trend}% 증가`)
    
    if (lhi.topContributors && lhi.topContributors.length > 0) {
      const topPOI = lhi.topContributors[0]
      actions.push({
        type: 'local_partnership',
        priority: 'high',
        title: `${topPOI.name}와 협력 기회`,
        description: `${Math.round(topPOI.distance)}m 거리 인기 ${getCategoryName(topPOI.category)}와 제휴 패키지 제안`,
        expectedImpact: '예약률 20-30% 증가 예상',
        actionItems: [
          '사장님과 직접 컨택',
          '할인 쿠폰 교환 이벤트',
          '패키지 상품 기획'
        ],
        estimatedCost: 200000,
        timeframe: '2주 내'
      })
    }
  }

  // 2. 네이버 플레이스 최적화 제안
  if (competitors.myRanking && competitors.myRanking > 5) {
    const avgCompetitorPhotos = competitors.competitors.reduce((sum, c) => sum + c.photoCount, 0) / competitors.competitors.length
    
    if (competitors.myPhotoCount < avgCompetitorPhotos) {
      actions.push({
        type: 'naver_optimization',
        priority: 'high', 
        title: '네이버 플레이스 사진 보강',
        description: `현재 사진 ${competitors.myPhotoCount}장, 경쟁사 평균 ${Math.round(avgCompetitorPhotos)}장`,
        expectedImpact: '네이버 노출 30% 향상',
        actionItems: [
          '골든아워 전경 사진 5장 추가',
          '실내 분위기 사진 3장',
          '음식/어메니티 상세 사진 4장'
        ],
        estimatedCost: 50000,
        timeframe: '1주 내'
      })
    }
  }

  // 3. 채널 최적화 제안
  if (channels.bestChannel) {
    actions.push({
      type: 'channel_optimization',
      priority: 'medium',
      title: `${channels.bestChannel} 채널 예산 확대`,
      description: `현재 최고 성과 채널(전환율 기준)에 예산 집중`,
      expectedImpact: 'ROAS 15-25% 개선',
      actionItems: [
        `${channels.bestChannel} 예산 30% 증액`,
        '저성과 채널 예산 재배치',
        '성과 추적 강화'
      ],
      estimatedCost: channels.totalSpend * 0.3,
      timeframe: '즉시 실행'
    })
  }

  return {
    summary: insights,
    actionableRecommendations: actions,
    totalActions: actions.length,
    highPriorityCount: actions.filter(a => a.priority === 'high').length
  }
}

// Helper functions
function generateLHIInsights(lhiData: any, trend: number) {
  const insights = []
  
  if (trend > 20) {
    insights.push('🔥 지역 상권이 급속히 활성화되고 있습니다')
  } else if (trend < -10) {
    insights.push('⚠️ 지역 활성도가 다소 감소했습니다')
  }
  
  if (lhiData.top_contributors && lhiData.top_contributors.length > 0) {
    const restaurants = lhiData.top_contributors.filter((p: any) => p.category === 'restaurant')
    if (restaurants.length > 0) {
      insights.push(`🍽️ 근처 맛집 ${restaurants.length}곳이 인기 상승 중`)
    }
  }
  
  return insights
}

function generateCompetitorInsights(myData: any, competitors: any[]) {
  const insights = []
  
  if (myData && competitors.length > 0) {
    const avgRanking = competitors.reduce((sum, c) => sum + c.keyword_rank, 0) / competitors.length
    
    if (myData.keyword_rank < avgRanking) {
      insights.push('🎯 현재 경쟁사 대비 상위 노출 중')
    } else {
      insights.push('📈 검색 순위 개선 여지가 있습니다')
    }
    
    const avgReviews = competitors.reduce((sum, c) => sum + c.review_count, 0) / competitors.length
    if (myData.review_count < avgReviews) {
      insights.push('💬 리뷰 수 증가가 필요합니다')
    }
  }
  
  return insights
}

function generateChannelInsights(channels: any[]) {
  const insights = []
  
  const sortedByROAS = channels.sort((a, b) => b.conversionRate - a.conversionRate)
  if (sortedByROAS.length > 0) {
    insights.push(`🥇 최고 성과: ${sortedByROAS[0].channel} (전환율 ${sortedByROAS[0].conversionRate.toFixed(1)}%)`)
  }
  
  const highCostLowPerformance = channels.find(c => c.totalCost > 500000 && c.conversionRate < 2)
  if (highCostLowPerformance) {
    insights.push(`⚠️ ${highCostLowPerformance.channel} 채널 효율성 점검 필요`)
  }
  
  return insights
}

function getCategoryName(category: string) {
  const categoryMap: { [key: string]: string } = {
    'restaurant': '맛집',
    'cafe': '카페',
    'kids': '키즈카페',
    'academy': '학원',
    'attraction': '관광지'
  }
  return categoryMap[category] || category
}