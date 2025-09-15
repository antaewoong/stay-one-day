/**
 * 프롬프트 튜닝 API
 * Claude API를 사용하여 트렌드 신호를 분석하고 주간 프롬프트 팩 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { tunePromptsFromTrendSignals, type TuningRequest } from '@/lib/prompt-tuner'
import { createWeeklyPromptPack, getActivePromptPack } from '@/lib/prompt-pack-manager'
import { checkRateLimit, addRateLimitHeaders } from '@/lib/rate-limiter'

interface PromptTuningRequest {
  trendSignals?: any[]
  targetWeek?: string // YYYY-MM-DD format (Monday)
  customModifiers?: string[]
  forceUpdate?: boolean
  seasonContext?: 'spring' | 'summer' | 'autumn' | 'winter'
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting 검사 (IP 기준만)
    const rateLimitResult = await checkRateLimit(
      request,
      '/api/prompts/tune'
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

    const body: PromptTuningRequest = await request.json()
    const {
      trendSignals = [],
      targetWeek,
      customModifiers = [],
      forceUpdate = false,
      seasonContext
    } = body

    console.log(`[PROMPT_TUNING] 시작: ${trendSignals.length}개 트렌드 신호 분석`)

    // 타겟 주차 계산 (제공되지 않으면 다음 주)
    const weekStart = targetWeek || getNextMondayDate()

    // 기존 활성 팩 확인
    const existingPack = await getActivePromptPack(weekStart)
    if (existingPack && !forceUpdate) {
      return NextResponse.json({
        success: true,
        message: '이미 해당 주차의 활성 프롬프트 팩이 존재합니다',
        existing: {
          id: existingPack.id,
          version: existingPack.version,
          weekStart: existingPack.week_start,
          createdAt: existingPack.created_at
        },
        suggestion: 'forceUpdate=true로 강제 업데이트하거나 다른 주차를 선택하세요'
      })
    }

    // 튜닝 요청 구성
    const tuningRequest: TuningRequest = {
      trendSignals,
      weekStart,
      customModifiers,
      seasonContext: seasonContext || getCurrentSeason(),
      previousPack: existingPack
    }

    // Claude API를 통한 프롬프트 튜닝
    const tunedPrompts = await tunePromptsFromTrendSignals(tuningRequest)

    // 새로운 주간 프롬프트 팩 생성
    const newPack = await createWeeklyPromptPack({
      weekStart,
      prompts: tunedPrompts.prompts,
      slotSpec: tunedPrompts.slotSpec,
      trendAnalysis: tunedPrompts.analysis,
      version: existingPack ? existingPack.version + 1 : 1
    })

    console.log(`[PROMPT_TUNING] 완료: 버전 ${newPack.version} 생성`)

    const responseData = {
      success: true,
      promptPack: {
        id: newPack.id,
        weekStart: newPack.week_start,
        version: newPack.version,
        prompts: newPack.prompts,
        slotSpec: newPack.slot_spec,
        analysis: newPack.trend_analysis
      },
      tuningDetails: {
        analyzedSignals: trendSignals.length,
        generatedArchetypes: Object.keys(tunedPrompts.prompts).length,
        seasonContext: tuningRequest.seasonContext,
        customModifiers: customModifiers.length
      }
    }

    const response = NextResponse.json(responseData)
    return addRateLimitHeaders(response, rateLimitResult)

  } catch (error) {
    console.error('[PROMPT_TUNING] 오류:', error)

    return NextResponse.json(
      {
        success: false,
        error: '프롬프트 튜닝 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}

// GET 메서드로 프롬프트 팩 히스토리 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const weekStart = searchParams.get('weekStart')
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const limit = parseInt(searchParams.get('limit') || '10')

    let packs
    if (weekStart) {
      // 특정 주차의 모든 버전 조회
      packs = await getPromptPackVersions(weekStart, limit)
    } else {
      // 최근 프롬프트 팩들 조회
      packs = await getRecentPromptPacks({ includeInactive, limit })
    }

    return NextResponse.json({
      success: true,
      packs: packs.map(pack => ({
        id: pack.id,
        weekStart: pack.week_start,
        version: pack.version,
        isActive: pack.is_active,
        createdAt: pack.created_at,
        appliedAt: pack.applied_at,
        summary: {
          archetypes: Object.keys(pack.prompts || {}).length,
          totalSlots: getTotalSlotsCount(pack.slot_spec),
          dominantFeatures: pack.trend_analysis?.dominant_features || []
        }
      }))
    })

  } catch (error) {
    console.error('[PROMPT_TUNING] 조회 오류:', error)

    return NextResponse.json(
      {
        success: false,
        error: '프롬프트 팩 조회 중 오류가 발생했습니다'
      },
      { status: 500 }
    )
  }
}

// 헬퍼 함수들
function getNextMondayDate(): string {
  const now = new Date()
  const daysUntilNextMonday = (8 - now.getDay()) % 7 || 7
  const nextMonday = new Date(now.getTime() + daysUntilNextMonday * 24 * 60 * 60 * 1000)
  return nextMonday.toISOString().slice(0, 10)
}

function getCurrentSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = new Date().getMonth() + 1 // 1-12
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

// 임시 함수들 (실제로는 prompt-pack-manager에서 import)
async function getPromptPackVersions(weekStart: string, limit: number) {
  // TODO: 실제 구현
  return []
}

async function getRecentPromptPacks(options: { includeInactive: boolean, limit: number }) {
  // TODO: 실제 구현
  return []
}

function getTotalSlotsCount(slotSpec: any): number {
  if (!slotSpec?.archetypes) return 0
  return Object.values(slotSpec.archetypes).reduce((total: number, archetype: any) => {
    return total + (archetype.slots?.length || 0)
  }, 0)
}