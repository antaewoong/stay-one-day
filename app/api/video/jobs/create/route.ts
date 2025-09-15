/**
 * 비디오 작업 생성 API
 * 검증된 이미지들로 비디오 생성 작업을 큐에 추가
 */

import { NextRequest, NextResponse } from 'next/server'
import { createVideoJob } from '@/lib/video-queue'
import { validateAndSelectSlots } from '@/lib/slot-validator'
import { createClient } from '@/lib/supabase/server'
import {
  checkRateLimit,
  checkIdempotency,
  cacheIdempotentResponse,
  addRateLimitHeaders
} from '@/lib/rate-limiter'

interface CreateJobRequest {
  accommodationId: string
  templateId: string
  manifest: Array<{
    slot: string
    file: string
  }>
  uploadedImages: Array<{
    filename: string
    slot: string
    fileSize: number
    width: number
    height: number
  }>
  hostId: string
  customPrompts?: Record<string, string>
}

export async function POST(request: NextRequest) {
  let rateLimitResult: any = null

  try {
    const body: CreateJobRequest = await request.json()
    const {
      accommodationId,
      templateId,
      manifest,
      uploadedImages,
      hostId,
      customPrompts = {}
    } = body

    console.log(`[VIDEO_JOB] 작업 생성 요청: ${accommodationId}, 템플릿: ${templateId}`)

    // 필수 파라미터 검증
    if (!accommodationId || !templateId || !hostId || !manifest?.length) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 파라미터가 누락되었습니다',
          code: 'MISSING_PARAMETERS',
          details: 'accommodationId, templateId, hostId, manifest가 모두 필요합니다'
        },
        { status: 400 }
      )
    }

    // 1. Rate limiting 검사
    rateLimitResult = await checkRateLimit(
      request,
      '/api/video/jobs/create',
      hostId,
      accommodationId
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

    // 2. Idempotency 검사 (중복 요청 차단)
    const idempotencyResult = await checkIdempotency(
      request,
      body,
      hostId,
      accommodationId
    )

    if (idempotencyResult.isReplay) {
      console.log(`[VIDEO_JOB] 중복 요청 차단: ${idempotencyResult.key}`)

      const response = NextResponse.json(idempotencyResult.cachedResponse)
      return addRateLimitHeaders(response, rateLimitResult)
    }

    const supabase = createClient()

    // 1. 숙소 정보 확인
    const { data: accommodation, error: accError } = await supabase
      .from('accommodations')
      .select('id, name, host_id')
      .eq('id', accommodationId)
      .single()

    if (accError || !accommodation) {
      return NextResponse.json(
        {
          success: false,
          error: '숙소 정보를 찾을 수 없습니다',
          details: accError?.message || '존재하지 않는 숙소 ID'
        },
        { status: 404 }
      )
    }

    // 호스트 권한 확인
    if (accommodation.host_id !== hostId) {
      return NextResponse.json(
        {
          success: false,
          error: '해당 숙소에 대한 권한이 없습니다'
        },
        { status: 403 }
      )
    }

    // 2. 템플릿 정보 조회 (활성 프롬프트 팩에서)
    const templateResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/video/templates/active?accommodationId=${accommodationId}`,
      { cache: 'no-store' }
    )

    if (!templateResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: '템플릿 정보를 가져올 수 없습니다'
        },
        { status: 500 }
      )
    }

    const templatesData = await templateResponse.json()
    const template = templatesData.templates.find((t: any) => t.id === templateId)

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: '지원되지 않는 템플릿입니다',
          details: `템플릿 ID: ${templateId}`
        },
        { status: 400 }
      )
    }

    // 3. 슬롯 검증 수행
    const validationResult = await validateAndSelectSlots(
      template.archetype,
      manifest,
      uploadedImages,
      accommodationId
    )

    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: '슬롯 검증 실패',
          validation: validationResult
        },
        { status: 400 }
      )
    }

    // 4. 월간 할당량 확인
    const quotaCheck = await checkMonthlyQuota(hostId)
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: '월간 할당량을 초과했습니다',
          quota: quotaCheck
        },
        { status: 429 }
      )
    }

    // 5. 비디오 작업 생성
    const jobData = {
      hostId,
      accommodationId,
      templateId,
      template: template,
      manifest,
      uploadedImages,
      selectedImages: validationResult.summary.selectedForGeneration,
      customPrompts,
      validation: validationResult,
      estimatedCost: validationResult.summary.costEstimate
    }

    const job = await createVideoJob(jobData)

    console.log(`[VIDEO_JOB] 작업 생성 완료: ${job.id}`)

    const responseData = {
      success: true,
      job: {
        id: job.id,
        status: 'queued',
        estimatedDuration: validationResult.summary.costEstimate.processingTimeMinutes,
        selectedImages: validationResult.summary.selectedForGeneration.length,
        totalCost: validationResult.summary.costEstimate.estimatedCostUSD
      },
      validation: validationResult
    }

    // 3. Idempotency 응답 캐시
    cacheIdempotentResponse(idempotencyResult.key, responseData)

    const response = NextResponse.json(responseData)
    return addRateLimitHeaders(response, rateLimitResult)

  } catch (error) {
    console.error('[VIDEO_JOB] 작업 생성 오류:', error)

    return NextResponse.json(
      {
        success: false,
        error: '비디오 작업 생성 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}

// 월간 할당량 확인 함수
async function checkMonthlyQuota(hostId: string) {
  try {
    const supabase = createClient()
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

    const { data: quota, error } = await supabase
      .from('video_monthly_quota')
      .select('*')
      .eq('host_id', hostId)
      .eq('month', currentMonth)
      .single()

    // 기본 할당량: 월 10개
    const defaultLimit = 10
    const used = quota?.used_count || 0
    const limit = quota?.quota_limit || defaultLimit

    return {
      allowed: used < limit,
      used,
      limit,
      remaining: limit - used
    }
  } catch (error) {
    console.error('[QUOTA_CHECK] 오류:', error)
    // 오류 시 기본적으로 허용 (안전장치)
    return { allowed: true, used: 0, limit: 10, remaining: 10 }
  }
}