/**
 * 슬롯 검증 API
 * 업로드된 이미지들이 주간 프롬프트 팩 요구사항을 만족하는지 검증
 * + 실제 파일 내용 검증 (MIME, 해상도, 동의 등)
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateAndSelectSlots } from '@/lib/slot-validator'
import { validateUploadedFile, VALIDATION_ERRORS, type ValidationErrorCode } from '@/lib/file-validator'
import { checkRateLimit, addRateLimitHeaders } from '@/lib/rate-limiter'

interface SlotManifest {
  slot: string
  file: string
  consent?: boolean // 초상권 동의 여부
}

interface UploadedImage {
  filename: string
  slot: string
  fileSize: number
  width: number
  height: number
  quality_score?: number
}

interface ValidateRequest {
  archetype: string
  manifest: SlotManifest[]
  uploadedImages: UploadedImage[]
  accommodationId: string
}

// FormData를 받는 강화된 검증 (실제 파일 업로드)
export async function POST(request: NextRequest) {
  try {
    // Rate limiting 검사 (호스트 ID 추출을 위해 먼저 body 파싱)
    const contentType = request.headers.get('content-type') || ''
    let hostId: string | undefined
    let accommodationId: string | undefined

    // 간단한 파라미터 추출 (rate limiting용)
    if (contentType.includes('multipart/form-data')) {
      const clonedRequest = request.clone()
      try {
        const formData = await clonedRequest.formData()
        accommodationId = formData.get('accommodationId') as string || undefined
        // FormData에서는 hostId가 별도로 없으므로 accommodationId로만 제한
      } catch (e) {
        // 파싱 실패 시 IP만으로 제한
      }
    } else {
      const clonedRequest = request.clone()
      try {
        const body = await clonedRequest.json()
        accommodationId = body.accommodationId
        hostId = body.hostId
      } catch (e) {
        // 파싱 실패 시 IP만으로 제한
      }
    }

    const rateLimitResult = await checkRateLimit(
      request,
      '/api/video/validate-slots',
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

    // FormData로 실제 파일이 업로드된 경우
    if (contentType.includes('multipart/form-data')) {
      const response = await handleFileUploadValidation(request)
      return addRateLimitHeaders(response, rateLimitResult)
    }

    // JSON으로 메타데이터만 전송된 경우 (기존 방식 유지)
    const response = await handleMetadataValidation(request)
    return addRateLimitHeaders(response, rateLimitResult)

  } catch (error) {
    console.error('[SLOT_VALIDATION] 오류:', error)

    return NextResponse.json(
      {
        success: false,
        error: '슬롯 검증 중 오류가 발생했습니다',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}

/**
 * 실제 파일 업로드를 받아서 검증하는 강화된 버전
 */
async function handleFileUploadValidation(request: NextRequest) {
  try {
    const formData = await request.formData()

    const archetype = formData.get('archetype') as string
    const accommodationId = formData.get('accommodationId') as string
    const manifestStr = formData.get('manifest') as string

    if (!archetype || !accommodationId || !manifestStr) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 파라미터가 누락되었습니다',
          code: 'MISSING_PARAMETERS',
          details: 'archetype, accommodationId, manifest가 모두 필요합니다'
        },
        { status: 400 }
      )
    }

    const manifest = JSON.parse(manifestStr) as SlotManifest[]
    console.log(`[SLOT_VALIDATION] 파일 업로드 검증: ${archetype}, ${manifest.length}개 파일`)

    // 실제 파일들 검증
    const fileValidationResults = []
    const uploadedImages = []

    for (const manifestItem of manifest) {
      const file = formData.get(manifestItem.file) as File
      if (!file) {
        return NextResponse.json(
          {
            success: false,
            error: `파일이 누락되었습니다: ${manifestItem.file}`,
            code: 'FILE_MISSING'
          },
          { status: 400 }
        )
      }

      // 파일을 Buffer로 읽기
      const arrayBuffer = await file.arrayBuffer()
      const fileBuffer = Buffer.from(arrayBuffer)

      // 슬롯별 파일 검증 옵션 설정
      const validationOptions = getSlotValidationOptions(manifestItem.slot, archetype)

      // 실제 파일 검증 실행
      const validationResult = await validateUploadedFile(
        fileBuffer,
        file.name,
        validationOptions,
        manifestItem.consent || false
      )

      if (!validationResult.isValid) {
        fileValidationResults.push({
          file: manifestItem.file,
          slot: manifestItem.slot,
          errors: validationResult.errors
        })
      } else {
        // 검증 통과한 이미지 정보 저장
        uploadedImages.push({
          filename: manifestItem.file,
          slot: manifestItem.slot,
          fileSize: validationResult.metadata.fileSize,
          width: validationResult.metadata.dimensions.width,
          height: validationResult.metadata.dimensions.height,
          quality_score: calculateQualityScore(validationResult.metadata)
        })
      }
    }

    // 파일 검증 실패가 있으면 즉시 반환
    if (fileValidationResults.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: '파일 검증에 실패했습니다',
          code: 'FILE_VALIDATION_FAILED',
          fileErrors: fileValidationResults
        },
        { status: 400 }
      )
    }

    // 기존 슬롯 검증 로직 실행
    const slotValidationResult = await validateAndSelectSlots(
      archetype,
      manifest,
      uploadedImages,
      accommodationId
    )

    return NextResponse.json({
      success: true,
      validation: slotValidationResult
    })

  } catch (error) {
    console.error('[SLOT_VALIDATION] 파일 검증 실패:', error)
    return NextResponse.json(
      {
        success: false,
        error: '파일 검증 중 오류가 발생했습니다',
        code: 'FILE_PROCESSING_ERROR',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}

/**
 * 기존 JSON 메타데이터 검증 (호환성 유지)
 */
async function handleMetadataValidation(request: NextRequest) {
  const body: ValidateRequest = await request.json()
  const { archetype, manifest, uploadedImages, accommodationId } = body

  console.log(`[SLOT_VALIDATION] 메타데이터 검증: ${archetype}, ${manifest.length}개 이미지`)

  // 입력 유효성 검사
  if (!archetype || !manifest || !uploadedImages || !accommodationId) {
    return NextResponse.json(
      {
        success: false,
        error: '필수 파라미터가 누락되었습니다',
        code: 'MISSING_PARAMETERS',
        details: 'archetype, manifest, uploadedImages, accommodationId가 모두 필요합니다'
      },
      { status: 400 }
    )
  }

  if (manifest.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: '최소 1개 이상의 이미지가 필요합니다',
        code: 'EMPTY_MANIFEST'
      },
      { status: 400 }
    )
  }

  // 매니페스트와 업로드된 이미지 매칭 검증
  const manifestFiles = manifest.map(m => m.file)
  const uploadedFiles = uploadedImages.map(u => u.filename)
  const missingFiles = manifestFiles.filter(f => !uploadedFiles.includes(f))

  if (missingFiles.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: '매니페스트와 업로드된 이미지가 일치하지 않습니다',
        code: 'MANIFEST_MISMATCH',
        details: `누락된 파일: ${missingFiles.join(', ')}`
      },
      { status: 400 }
    )
  }

  // 슬롯 검증 수행
  const validationResult = await validateAndSelectSlots(
    archetype,
    manifest,
    uploadedImages,
    accommodationId
  )

  console.log(`[SLOT_VALIDATION] 메타데이터 검증 결과: ${validationResult.isValid ? '성공' : '실패'}`)

  return NextResponse.json({
    success: true,
    validation: validationResult
  })
}

/**
 * 슬롯별 파일 검증 옵션 반환
 */
function getSlotValidationOptions(slotKey: string, archetype: string) {
  const baseOptions = {
    allowedTypes: ['jpg', 'jpeg', 'png', 'webp'],
    allowedMimes: ['image/jpeg', 'image/png', 'image/webp'],
    minWidth: 800,
    minHeight: 600,
    maxSizeMB: 10,
    minSizeMB: 0.1
  }

  // 슬롯별 특별 요구사항
  const slotSpecificOptions: Record<string, any> = {
    hero: {
      ...baseOptions,
      minWidth: 1920,
      minHeight: 1080,
      requiredOrientation: 'landscape'
    },
    exterior_wide: {
      ...baseOptions,
      minWidth: 1920,
      minHeight: 1080,
      requiredOrientation: 'landscape'
    },
    interior_main: {
      ...baseOptions,
      minWidth: 1080,
      minHeight: 800
    },
    amenity: {
      ...baseOptions,
      minWidth: 1080,
      minHeight: 800
    },
    usage_people: {
      ...baseOptions,
      requiresConsent: true, // 초상권 동의 필수
      minWidth: 1080,
      minHeight: 800
    },
    sign_brand: {
      ...baseOptions,
      minWidth: 800,
      minHeight: 600
    },
    detail: {
      ...baseOptions,
      minWidth: 800,
      minHeight: 600
    },
    entrance: {
      ...baseOptions,
      minWidth: 1080,
      minHeight: 800
    },
    living_main: {
      ...baseOptions,
      minWidth: 1080,
      minHeight: 800
    },
    bedroom: {
      ...baseOptions,
      minWidth: 1080,
      minHeight: 800
    },
    view_scenic: {
      ...baseOptions,
      minWidth: 1920,
      minHeight: 1080,
      requiredOrientation: 'landscape'
    }
  }

  return slotSpecificOptions[slotKey] || baseOptions
}

/**
 * 파일 메타데이터로부터 품질 점수 계산
 */
function calculateQualityScore(metadata: any): number {
  let score = 0.5 // 기본 점수

  // 해상도 점수
  const { width, height } = metadata.dimensions
  const pixelCount = width * height
  const resolutionScore = Math.min(pixelCount / (1920 * 1080), 1)
  score += resolutionScore * 0.3

  // 파일 크기 점수 (적절한 압축)
  const sizeMB = metadata.fileSize / (1024 * 1024)
  const sizeScore = Math.max(0, Math.min(1, (sizeMB - 0.5) / 4)) // 0.5-4.5MB 범위
  score += sizeScore * 0.2

  // 비율 점수
  const aspectRatio = metadata.aspectRatio
  const isGoodAspectRatio = (aspectRatio >= 0.5 && aspectRatio <= 2.0)
  score += (isGoodAspectRatio ? 0.2 : 0)

  return Math.min(score, 1.0)
}

// GET 메서드로 지원되는 아키타입 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supportedArchetypes = [
      {
        key: 'energy_montage',
        name: '에너지 몽타주',
        description: '빠른 템포의 역동적인 영상'
      },
      {
        key: 'story_tour',
        name: '스토리 투어',
        description: '차근차근 둘러보는 투어 영상'
      },
      {
        key: 'lifestyle_showcase',
        name: '라이프스타일 쇼케이스',
        description: '라이프스타일 중심의 감성 영상'
      },
      {
        key: 'seasonal_special',
        name: '시즌 스페셜',
        description: '계절 특성을 강조한 영상'
      }
    ]

    return NextResponse.json({
      success: true,
      archetypes: supportedArchetypes
    })

  } catch (error) {
    console.error('[SLOT_VALIDATION] 아키타입 조회 오류:', error)

    return NextResponse.json(
      {
        success: false,
        error: '아키타입 조회 중 오류가 발생했습니다'
      },
      { status: 500 }
    )
  }
}