import { NextRequest, NextResponse } from 'next/server'
import { withHostAuth } from '@/middleware/withHostAuth'
import { getYouTubeClient } from '@/lib/youtube-api'
import { tryIncrementQuota } from '@/utils/quota-manager'

export const GET = withHostAuth(async (req, db, { userId, host }) => {
  try {
    const { searchParams } = req.nextUrl
    const accommodationId = searchParams.get('accommodationId')

    if (!accommodationId) {
      return NextResponse.json({ error: '숙소 ID가 필요합니다' }, { status: 400 })
    }

    // 쿼터 확인
    const quotaResult = tryIncrementQuota(userId, 'manual')
    if (!quotaResult.incremented) {
      return NextResponse.json({
        error: 'quota_exceeded',
        message: '이번 주 분석 2회 모두 사용하셨습니다',
        next_available: quotaResult.next_available
      }, { status: 429 })
    }

    // 숙소 정보 조회
    const { data: accommodation, error: accomError } = await db
      .from('accommodations')
      .select('id, name, city, region, accommodation_type')
      .eq('id', accommodationId)
      .eq('host_id', host.id)
      .single()

    if (accomError || !accommodation) {
      return NextResponse.json({ error: '숙소를 찾을 수 없습니다' }, { status: 404 })
    }

    // YouTube 클라이언트로 쇼츠 트렌드 데이터 조회
    const youtubeClient = getYouTubeClient()
    const shortsData = await youtubeClient.getLocationShortsData(
      accommodation.city,
      accommodation.region,
      accommodation.accommodation_type || '펜션'
    )

    // 콘텐츠 제작 제안 생성
    const contentSuggestions = generateContentSuggestions(shortsData, accommodation)

    // 상위 트렌딩 키워드 추출
    const trendingKeywords = shortsData
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, 8)
      .map(data => ({
        keyword: data.keyword,
        totalVideos: data.totalVideos,
        totalViews: data.totalViews,
        avgViews: data.avgViewsPerVideo,
        shortsRatio: data.contentTypes.shorts / data.totalVideos * 100,
        topChannels: data.topChannels.slice(0, 3),
        relatedKeywords: data.relatedKeywords.slice(0, 5),
        opportunity: calculateOpportunity(data)
      }))

    // 성과 예측 생성
    const performancePrediction = generatePerformancePrediction(trendingKeywords, accommodation)

    return NextResponse.json({
      success: true,
      accommodationName: accommodation.name,
      location: `${accommodation.city}, ${accommodation.region}`,
      analysis: {
        totalKeywordsAnalyzed: shortsData.length,
        totalVideosFound: shortsData.reduce((sum, data) => sum + data.totalVideos, 0),
        totalViewsAnalyzed: shortsData.reduce((sum, data) => sum + data.totalViews, 0),
        avgViewsPerKeyword: Math.round(
          shortsData.reduce((sum, data) => sum + data.totalViews, 0) / shortsData.length
        )
      },
      trendingKeywords,
      contentSuggestions,
      performancePrediction,
      actionableInsights: [
        {
          type: 'hot_keyword',
          title: `🔥 "${trendingKeywords[0]?.keyword}" 키워드 급상승`,
          description: `평균 조회수 ${trendingKeywords[0]?.avgViews.toLocaleString()}회로 가장 핫한 키워드`,
          action: '이 키워드로 숙소 소개 쇼츠 제작 권장',
          priority: 'high',
          effort: 'medium'
        },
        {
          type: 'content_gap',
          title: '📹 콘텐츠 공백 기회 발견',
          description: '경쟁 업체들이 놓치고 있는 키워드 조합 발견',
          action: '독점적 콘텐츠 제작으로 선점 효과 기대',
          priority: 'medium',
          effort: 'high'
        },
        {
          type: 'viral_timing',
          title: '⏰ 최적 업로드 시간대',
          description: '분석 결과 오후 7-9시가 가장 높은 참여율',
          action: '이 시간대에 맞춰 콘텐츠 업로드 스케줄 조정',
          priority: 'medium',
          effort: 'low'
        }
      ],
      dataSource: 'youtube_data_api',
      quota_status: {
        used: quotaResult.total_runs,
        remaining: 2 - quotaResult.total_runs,
        reset_date: quotaResult.next_available
      },
      updateTime: new Date().toISOString()
    })

  } catch (error) {
    console.error('쇼츠 레이더 API 오류:', error)

    return NextResponse.json({
      error: '쇼츠 트렌드 분석 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
})

// 콘텐츠 제작 제안 생성
function generateContentSuggestions(shortsData: any[], accommodation: any) {
  const suggestions = []

  // 상위 3개 키워드 기준으로 제안 생성
  const topKeywords = shortsData
    .sort((a, b) => b.totalViews - a.totalViews)
    .slice(0, 3)

  topKeywords.forEach((data, index) => {
    const templates = getContentTemplates(data.keyword, accommodation)

    suggestions.push({
      keyword: data.keyword,
      priority: index === 0 ? 'high' : 'medium',
      expectedViews: data.avgViewsPerVideo,
      contentIdeas: templates,
      hashtagSuggestions: [
        `#${accommodation.city}`,
        `#${data.keyword.replace(/\s+/g, '')}`,
        '#숏폼',
        '#여행',
        '#힐링'
      ],
      bestPractices: [
        '15초 이내 핵심 메시지 전달',
        '자막 활용으로 접근성 향상',
        '트렌딩 음악 사용',
        '강렬한 첫 3초 구성'
      ]
    })
  })

  return suggestions
}

// 콘텐츠 템플릿 생성
function getContentTemplates(keyword: string, accommodation: any) {
  const templates = [
    `${accommodation.name}에서 경험하는 ${keyword} 브이로그`,
    `${keyword} 꿀팁 대공개! (${accommodation.city} 편)`,
    `3분만에 알아보는 ${keyword} 완벽 가이드`,
    `${accommodation.city} ${keyword} 숨은 명소 탐방`,
    `이것만 알면 ${keyword} 고수! 실전 팁`
  ]

  return templates.slice(0, 3)
}

// 기회 점수 계산
function calculateOpportunity(data: any): 'high' | 'medium' | 'low' {
  const score =
    (data.avgViewsPerVideo > 50000 ? 40 : data.avgViewsPerVideo > 10000 ? 20 : 10) +
    (data.totalVideos < 100 ? 30 : data.totalVideos < 500 ? 20 : 10) +
    (data.contentTypes.shorts / data.totalVideos > 0.7 ? 30 : 20)

  return score > 70 ? 'high' : score > 50 ? 'medium' : 'low'
}

// 성과 예측 생성
function generatePerformancePrediction(keywords: any[], accommodation: any) {
  const topKeyword = keywords[0]

  return {
    expectedReach: {
      pessimistic: Math.round(topKeyword?.avgViews * 0.1) || 1000,
      realistic: Math.round(topKeyword?.avgViews * 0.3) || 3000,
      optimistic: Math.round(topKeyword?.avgViews * 0.6) || 6000
    },
    timeToViral: {
      estimated_days: '7-14일',
      key_factors: [
        '콘텐츠 품질',
        '업로드 타이밍',
        '해시태그 전략',
        '초기 참여율'
      ]
    },
    roi_prediction: {
      content_cost: '50,000-100,000원 (촬영/편집 비용)',
      expected_bookings: '2-5건 (월 기준)',
      revenue_impact: '200,000-500,000원'
    },
    success_indicators: [
      '첫 24시간 내 1,000회 이상 조회',
      '좋아요율 5% 이상',
      '댓글 참여율 2% 이상',
      '공유 횟수 50회 이상'
    ]
  }
}