/**
 * 슬롯 검증 및 비용 가드 로직
 * 업로드된 이미지의 슬롯 요구사항 검증 및 생성할 이미지 선별
 */

import { createClient } from '@/lib/supabase/server'

interface SlotSpec {
  key: string
  label: string
  count: number
  required: boolean
  hint?: string
  constraints?: {
    orientation?: 'portrait' | 'landscape' | 'square'
    min_px?: number
    max_size_mb?: number
  }
  alternatives?: string[]
  policy?: 'consent_required' | 'optional'
}

interface ArchetypeSpec {
  min_total: number
  max_total: number
  max_generate: number
  slots: SlotSpec[]
}

interface UploadedImage {
  filename: string
  slot: string
  fileSize: number
  width: number
  height: number
  quality_score?: number // 이미지 품질 점수 (0-1)
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  summary: {
    totalUploaded: number
    requiredFulfilled: number
    requiredTotal: number
    selectedForGeneration: string[]
    costEstimate: {
      totalShots: number
      estimatedCostUSD: number
      processingTimeMinutes: number
    }
  }
}

interface SlotManifest {
  slot: string
  file: string
}

/**
 * 슬롯 매니페스트 검증 및 이미지 선별
 */
export async function validateAndSelectSlots(
  archetype: string,
  manifest: SlotManifest[],
  uploadedImages: UploadedImage[],
  accommodationId: string
): Promise<ValidationResult> {
  try {
    console.log(`[SLOT_VALIDATOR] 검증 시작: ${archetype}, ${manifest.length}개 이미지`)

    // 1. 활성 슬롯 스펙 조회
    const slotSpec = await getActiveSlotSpec(archetype)
    if (!slotSpec) {
      throw new Error('활성 슬롯 스펙을 찾을 수 없습니다')
    }

    // 2. 기본 검증
    const basicValidation = validateBasicRequirements(slotSpec, manifest, uploadedImages)
    if (!basicValidation.isValid) {
      return basicValidation
    }

    // 3. 이미지 품질 평가 및 점수 계산
    const imageScores = await calculateImageQualityScores(uploadedImages, slotSpec.slots)

    // 4. 비용 가드: 생성할 이미지 선별
    const selectedImages = selectImagesForGeneration(
      slotSpec,
      manifest,
      imageScores
    )

    // 5. 최종 검증 결과
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: basicValidation.warnings,
      summary: {
        totalUploaded: manifest.length,
        requiredFulfilled: countRequiredSlotsFulfilled(slotSpec, manifest),
        requiredTotal: slotSpec.slots.filter(s => s.required).length,
        selectedForGeneration: selectedImages,
        costEstimate: calculateCostEstimate(selectedImages.length)
      }
    }

    // 6. 추가 경고 검사
    result.warnings.push(...generateAdditionalWarnings(slotSpec, manifest))

    console.log(`[SLOT_VALIDATOR] 검증 완료: ${selectedImages.length}개 선별됨`)

    return result

  } catch (error) {
    console.error('[SLOT_VALIDATOR] 검증 실패:', error)
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : '알 수 없는 오류'],
      warnings: [],
      summary: {
        totalUploaded: 0,
        requiredFulfilled: 0,
        requiredTotal: 0,
        selectedForGeneration: [],
        costEstimate: { totalShots: 0, estimatedCostUSD: 0, processingTimeMinutes: 0 }
      }
    }
  }
}

/**
 * 활성 슬롯 스펙 조회
 */
async function getActiveSlotSpec(archetype: string): Promise<ArchetypeSpec | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('weekly_prompt_packs')
      .select('slot_spec')
      .eq('is_active', true)
      .order('week_start', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      console.warn('[SLOT_VALIDATOR] 활성 팩 없음, 기본 스펙 사용')
      return getDefaultSlotSpec(archetype)
    }

    const spec = data.slot_spec?.archetypes?.[archetype]
    return spec || getDefaultSlotSpec(archetype)

  } catch (error) {
    console.error('[SLOT_VALIDATOR] 스펙 조회 실패:', error)
    return getDefaultSlotSpec(archetype)
  }
}

/**
 * 기본 슬롯 스펙 (폴백용)
 */
function getDefaultSlotSpec(archetype: string): ArchetypeSpec {
  const defaultSpecs: Record<string, ArchetypeSpec> = {
    energy_montage: {
      min_total: 10,
      max_total: 20,
      max_generate: 8,
      slots: [
        { key: 'hero', label: '히어로 샷', count: 1, required: true },
        { key: 'exterior_wide', label: '야외 전경', count: 2, required: true },
        { key: 'interior_main', label: '실내 메인', count: 2, required: true },
        { key: 'amenity', label: '편의시설', count: 2, required: true },
        { key: 'detail', label: '디테일 샷', count: 3, required: false }
      ]
    },
    story_tour: {
      min_total: 8,
      max_total: 16,
      max_generate: 6,
      slots: [
        { key: 'hero', label: '히어로 샷', count: 1, required: true },
        { key: 'entrance', label: '입구/현관', count: 1, required: true },
        { key: 'living_main', label: '거실/메인홀', count: 1, required: true },
        { key: 'bedroom', label: '침실', count: 1, required: true },
        { key: 'view_scenic', label: '전망/뷰', count: 2, required: false }
      ]
    }
  }

  return defaultSpecs[archetype] || defaultSpecs.energy_montage
}

/**
 * 기본 요구사항 검증
 */
function validateBasicRequirements(
  slotSpec: ArchetypeSpec,
  manifest: SlotManifest[],
  uploadedImages: UploadedImage[]
): Pick<ValidationResult, 'isValid' | 'errors' | 'warnings'> {
  const errors: string[] = []
  const warnings: string[] = []

  // 1. 총 이미지 수 검증
  if (manifest.length < slotSpec.min_total) {
    errors.push(`최소 ${slotSpec.min_total}개 이미지가 필요합니다 (현재: ${manifest.length}개)`)
  }

  if (manifest.length > slotSpec.max_total) {
    warnings.push(`권장 최대 수량 초과 (${manifest.length}/${slotSpec.max_total}개)`)
  }

  // 2. 필수 슬롯 검증
  const slotCounts = countSlotUsage(manifest)
  const requiredSlots = slotSpec.slots.filter(s => s.required)

  for (const slot of requiredSlots) {
    const count = slotCounts[slot.key] || 0
    if (count === 0) {
      errors.push(`필수 슬롯 누락: ${slot.label} (${slot.key})`)
    }
  }

  // 3. 이미지 제약 조건 검증
  for (const image of uploadedImages) {
    const manifestItem = manifest.find(m => m.file === image.filename)
    if (!manifestItem) continue

    const slotDef = slotSpec.slots.find(s => s.key === manifestItem.slot)
    if (!slotDef?.constraints) continue

    // 해상도 검증
    if (slotDef.constraints.min_px && Math.min(image.width, image.height) < slotDef.constraints.min_px) {
      warnings.push(`${image.filename}: 해상도 부족 (최소 ${slotDef.constraints.min_px}px 필요)`)
    }

    // 세로/가로 비율 검증
    if (slotDef.constraints.orientation) {
      const isPortrait = image.height > image.width
      const isLandscape = image.width > image.height
      const isSquare = Math.abs(image.width - image.height) / Math.max(image.width, image.height) < 0.1

      if (slotDef.constraints.orientation === 'portrait' && !isPortrait) {
        warnings.push(`${image.filename}: 세로 이미지가 권장됩니다`)
      } else if (slotDef.constraints.orientation === 'landscape' && !isLandscape) {
        warnings.push(`${image.filename}: 가로 이미지가 권장됩니다`)
      } else if (slotDef.constraints.orientation === 'square' && !isSquare) {
        warnings.push(`${image.filename}: 정사각형 이미지가 권장됩니다`)
      }
    }

    // 파일 크기 검증
    if (slotDef.constraints.max_size_mb) {
      const sizeMB = image.fileSize / (1024 * 1024)
      if (sizeMB > slotDef.constraints.max_size_mb) {
        warnings.push(`${image.filename}: 파일 크기 초과 (${sizeMB.toFixed(1)}MB > ${slotDef.constraints.max_size_mb}MB)`)
      }
    }
  }

  // 4. 동의 정책 검증
  const consentRequiredSlots = slotSpec.slots.filter(s => s.policy === 'consent_required')
  for (const slot of consentRequiredSlots) {
    if (slotCounts[slot.key] > 0) {
      warnings.push(`${slot.label} 슬롯 사용 시 초상권/저작권 동의가 필요합니다`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 이미지 품질 점수 계산
 */
async function calculateImageQualityScores(
  images: UploadedImage[],
  slots: SlotSpec[]
): Promise<UploadedImage[]> {
  return images.map(image => {
    let qualityScore = 0.5 // 기본 점수

    // 해상도 점수 (0.3 가중치)
    const pixelCount = image.width * image.height
    const resolutionScore = Math.min(pixelCount / (1920 * 1080), 1) // 풀HD 기준
    qualityScore += resolutionScore * 0.3

    // 파일 크기/품질 균형 점수 (0.2 가중치)
    const sizeMB = image.fileSize / (1024 * 1024)
    const sizeScore = Math.max(0, Math.min(1, (sizeMB - 0.5) / 4)) // 0.5-4.5MB 범위
    qualityScore += sizeScore * 0.2

    // 비율 점수 (0.2 가중치)
    const aspectRatio = image.width / image.height
    const isGoodAspectRatio = (aspectRatio >= 0.5 && aspectRatio <= 2.0) // 16:9 ~ 9:16 범위
    qualityScore += (isGoodAspectRatio ? 0.2 : 0)

    return {
      ...image,
      quality_score: Math.min(qualityScore, 1.0)
    }
  })
}

/**
 * 생성용 이미지 선별 (비용 가드)
 */
function selectImagesForGeneration(
  slotSpec: ArchetypeSpec,
  manifest: SlotManifest[],
  imageScores: UploadedImage[]
): string[] {
  const maxGenerate = slotSpec.max_generate
  const selected: string[] = []
  const slotCounts = countSlotUsage(manifest)

  // 1단계: 필수 슬롯에서 각각 1개씩 우선 선택
  const requiredSlots = slotSpec.slots.filter(s => s.required)

  for (const slot of requiredSlots) {
    if (selected.length >= maxGenerate) break

    const slotImages = manifest
      .filter(m => m.slot === slot.key)
      .map(m => ({
        filename: m.file,
        score: imageScores.find(img => img.filename === m.file)?.quality_score || 0
      }))
      .sort((a, b) => b.score - a.score)

    if (slotImages.length > 0 && !selected.includes(slotImages[0].filename)) {
      selected.push(slotImages[0].filename)
    }
  }

  // 2단계: 남은 슬롯 중에서 품질 점수 기반으로 선택
  const remainingImages = manifest
    .filter(m => !selected.includes(m.file))
    .map(m => ({
      filename: m.file,
      slot: m.slot,
      score: imageScores.find(img => img.filename === m.file)?.quality_score || 0,
      slotWeight: getSlotPriorityWeight(m.slot, slotSpec.slots)
    }))
    .sort((a, b) => (b.score * b.slotWeight) - (a.score * a.slotWeight))

  for (const image of remainingImages) {
    if (selected.length >= maxGenerate) break
    selected.push(image.filename)
  }

  return selected
}

/**
 * 슬롯별 우선순위 가중치
 */
function getSlotPriorityWeight(slotKey: string, slots: SlotSpec[]): number {
  const slot = slots.find(s => s.key === slotKey)
  if (!slot) return 0.1

  // 우선순위: 필수 > 권장 개수 많음 > 선택사항
  if (slot.required) return 1.0
  if (slot.count >= 2) return 0.8
  return 0.6
}

/**
 * 비용 추정
 */
function calculateCostEstimate(shotCount: number): {
  totalShots: number
  estimatedCostUSD: number
  processingTimeMinutes: number
} {
  // Runway ML 기준 추정치
  const costPerShot = 1.25 // USD per 4-second generation
  const timePerShot = 2.5 // 분 (대기시간 포함)

  return {
    totalShots: shotCount,
    estimatedCostUSD: shotCount * costPerShot,
    processingTimeMinutes: Math.ceil(shotCount * timePerShot)
  }
}

/**
 * 슬롯 사용 개수 계산
 */
function countSlotUsage(manifest: SlotManifest[]): Record<string, number> {
  const counts: Record<string, number> = {}

  for (const item of manifest) {
    counts[item.slot] = (counts[item.slot] || 0) + 1
  }

  return counts
}

/**
 * 필수 슬롯 충족 개수 계산
 */
function countRequiredSlotsFulfilled(slotSpec: ArchetypeSpec, manifest: SlotManifest[]): number {
  const slotCounts = countSlotUsage(manifest)
  const requiredSlots = slotSpec.slots.filter(s => s.required)

  return requiredSlots.filter(slot => (slotCounts[slot.key] || 0) > 0).length
}

/**
 * 추가 경고 생성
 */
function generateAdditionalWarnings(slotSpec: ArchetypeSpec, manifest: SlotManifest[]): string[] {
  const warnings: string[] = []
  const slotCounts = countSlotUsage(manifest)

  // 슬롯별 권장 개수 대비 경고
  for (const slot of slotSpec.slots) {
    const count = slotCounts[slot.key] || 0
    if (count > slot.count * 2) {
      warnings.push(`${slot.label}: 너무 많은 이미지 (${count}개, 권장: ${slot.count}개)`)
    }
  }

  // 비어있는 선택 슬롯 안내
  const optionalSlots = slotSpec.slots.filter(s => !s.required)
  const emptyOptionalSlots = optionalSlots.filter(s => (slotCounts[s.key] || 0) === 0)

  if (emptyOptionalSlots.length > 0) {
    warnings.push(`선택사항 미활용: ${emptyOptionalSlots.map(s => s.label).join(', ')}`)
  }

  return warnings
}