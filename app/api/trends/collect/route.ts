/**
 * 트렌드 수집 API
 * YouTube Shorts, Instagram, NAVER DataLab에서 실시간 트렌드 수집
 */

import { NextRequest, NextResponse } from 'next/server'
import { collectTrendsFromPlatforms, type CollectionOptions } from '@/lib/trend-collector'
import { checkRateLimit, addRateLimitHeaders } from '@/lib/rate-limiter'

interface CollectRequest {
  platforms?: ('youtube' | 'instagram' | 'naver')[]
  regions?: string[]
  customSeedTags?: string[]
  maxResults?: number
  timeRange?: '1d' | '7d' | '30d'
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting 검사 (IP 기준만)
    const rateLimitResult = await checkRateLimit(
      request,
      '/api/trends/collect'
    )

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        {
          success: false,
          error: '요청 한도를 초과했습니다',
          code: 'RATE_LIMIT_EXCEEDED',
          details: `${rateLimitResult.retryAfter}초 후에 다시 시도해주세요`
        },
        { status: 429 }
      )
      return addRateLimitHeaders(response, rateLimitResult)
    }

    const body: CollectRequest = await request.json()
    const {
      platforms = ['youtube', 'instagram', 'naver'],
      regions = ['청주', '세종', '대전', '충북', '충남'],
      customSeedTags = [],
      maxResults = 50,
      timeRange = '7d'
    } = body

    console.log(`[TREND_COLLECTION] 시작: ${platforms.join(', ')} 플랫폼`)

    // 수집 옵션 구성
    const options: CollectionOptions = {
      platforms,
      regions,
      customSeedTags,
      maxResults,
      timeRange,
      includeFeatures: true // 비해시태그 신호 포함
    }

    // 트렌드 수집 실행
    const trendData = await collectTrendsFromPlatforms(options)

    console.log(`[TREND_COLLECTION] 완료: ${trendData.signals.length}개 신호 수집`)

    const responseData = {
      success: true,
      data: trendData,
      collectedAt: new Date().toISOString(),
      summary: {
        totalSignals: trendData.signals.length,
        platformBreakdown: trendData.platformStats,
        topCategories: trendData.topCategories
      }
    }

    const response = NextResponse.json(responseData)
    return addRateLimitHeaders(response, rateLimitResult)

  } catch (error) {
    console.error('[TREND_COLLECTION] 오류:', error)

    return NextResponse.json(
      {
        success: false,
        error: '트렌드 수집 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}

// GET 메서드로 최근 수집된 트렌드 데이터 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform')
    const region = searchParams.get('region')
    const limit = parseInt(searchParams.get('limit') || '20')

    // 최근 트렌드 데이터 조회 (실제로는 데이터베이스에서)
    // 현재는 샘플 데이터 반환
    const recentTrends = {
      signals: [
        {
          platform: 'youtube',
          category: '풀빌라_청주',
          keywords: ['풀빌라', '청주', '여행', '휴양'],
          engagement: { views: 45000, likes: 2300, shares: 180 },
          features: {
            estimated_cuts: 12,
            color_tone: 'warm',
            bgm_tempo: 'upbeat',
            has_overlay_text: true
          }
        }
      ],
      platformStats: {
        youtube: 15,
        instagram: 12,
        naver: 8
      },
      lastUpdated: new Date().toISOString()
    }

    // 필터 적용
    let filteredSignals = recentTrends.signals
    if (platform) {
      filteredSignals = filteredSignals.filter(s => s.platform === platform)
    }

    return NextResponse.json({
      success: true,
      data: {
        ...recentTrends,
        signals: filteredSignals.slice(0, limit)
      }
    })

  } catch (error) {
    console.error('[TREND_COLLECTION] 조회 오류:', error)

    return NextResponse.json(
      {
        success: false,
        error: '트렌드 데이터 조회 중 오류가 발생했습니다'
      },
      { status: 500 }
    )
  }
}