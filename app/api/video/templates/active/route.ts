/**
 * 활성 프롬프트 팩 기반 템플릿 조회 API
 * 주간별 슬롯 스펙을 포함한 템플릿 정보 제공
 */

import { NextRequest, NextResponse } from 'next/server'
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

interface TemplateWithSlotSpec {
  id: string
  archetype: string
  name: string
  description: string
  estimated_duration: number
  slotSpec: ArchetypeSpec
  weekStart: string
  version: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accommodationId = searchParams.get('accommodationId')

    if (!accommodationId) {
      return NextResponse.json(
        { error: '숙소 ID가 필요합니다' },
        { status: 400 }
      )
    }

    console.log(`[API] 활성 템플릿 조회: ${accommodationId}`)

    const supabase = createClient()

    // 1. 현재 활성화된 프롬프트 팩 조회
    const { data: activePack, error: packError } = await supabase
      .from('weekly_prompt_packs')
      .select('*')
      .eq('is_active', true)
      .order('week_start', { ascending: false })
      .order('version', { ascending: false })
      .limit(1)
      .single()

    if (packError || !activePack) {
      console.warn('[API] 활성 프롬프트 팩 없음, 기본값 사용')

      // 기본 슬롯 스펙 반환
      const defaultTemplates = getDefaultTemplatesWithSlotSpec()
      return NextResponse.json({
        success: true,
        templates: defaultTemplates,
        weekStart: getCurrentWeekStart(),
        version: 0,
        source: 'default'
      })
    }

    // 2. 숙소 정보 조회 (타입별 필터링용)
    const { data: accommodation } = await supabase
      .from('accommodations')
      .select('name, accommodation_type, features')
      .eq('id', accommodationId)
      .single()

    // 3. 슬롯 스펙에서 템플릿 생성
    const templates = buildTemplatesFromSlotSpec(
      activePack.slot_spec,
      accommodation,
      activePack.week_start,
      activePack.version
    )

    console.log(`[API] 템플릿 조회 완료: ${templates.length}개`)

    return NextResponse.json({
      success: true,
      templates,
      weekStart: activePack.week_start,
      version: activePack.version,
      trendAnalysis: activePack.trend_analysis,
      source: 'active_pack'
    })

  } catch (error) {
    console.error('[API] 활성 템플릿 조회 실패:', error)

    return NextResponse.json(
      {
        success: false,
        error: '템플릿을 불러올 수 없습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}

/**
 * 슬롯 스펙에서 템플릿 빌드
 */
function buildTemplatesFromSlotSpec(
  slotSpec: any,
  accommodation: any,
  weekStart: string,
  version: number
): TemplateWithSlotSpec[] {
  if (!slotSpec?.archetypes) {
    return getDefaultTemplatesWithSlotSpec()
  }

  const templates: TemplateWithSlotSpec[] = []
  const archetypes = slotSpec.archetypes

  // 각 아키타입을 템플릿으로 변환
  Object.keys(archetypes).forEach(archetypeKey => {
    const spec = archetypes[archetypeKey]

    // 숙소별 맞춤화
    const customizedSpec = customizeSlotSpecForAccommodation(spec, accommodation)

    templates.push({
      id: `${weekStart}_${archetypeKey}_v${version}`,
      archetype: archetypeKey,
      name: getTemplateDisplayName(archetypeKey),
      description: getTemplateDescription(archetypeKey, spec),
      estimated_duration: calculateEstimatedDuration(spec),
      slotSpec: customizedSpec,
      weekStart,
      version
    })
  })

  return templates
}

/**
 * 숙소별 슬롯 스펙 맞춤화
 */
function customizeSlotSpecForAccommodation(
  spec: ArchetypeSpec,
  accommodation: any
): ArchetypeSpec {
  if (!accommodation) return spec

  const customized = JSON.parse(JSON.stringify(spec)) // 깊은 복사

  // 숙소 features에 따른 슬롯 조정
  const features = accommodation.features || []

  customized.slots = customized.slots.map((slot: SlotSpec) => {
    // 수영장 관련 슬롯
    if (slot.key === 'amenity' && slot.alternatives) {
      if (features.includes('pool') || features.includes('kids_pool')) {
        slot.hint = '수영장/키즈풀 우선'
        slot.alternatives = ['amenity_pool', 'amenity_kids', 'amenity_spa']
      } else if (features.includes('spa')) {
        slot.hint = '스파/온천 우선'
        slot.alternatives = ['amenity_spa', 'amenity_pool', 'amenity_kids']
      }
    }

    // 펜션/풀빌라 타입별 조정
    if (accommodation.accommodation_type === 'pension') {
      if (slot.key === 'exterior_wide') {
        slot.hint = '펜션 건물 전경'
      }
    } else if (accommodation.accommodation_type === 'villa') {
      if (slot.key === 'hero') {
        slot.hint = '풀빌라 대표 전경 (수영장 포함 권장)'
      }
    }

    return slot
  })

  return customized
}

/**
 * 템플릿 표시명 반환
 */
function getTemplateDisplayName(archetype: string): string {
  const displayNames: Record<string, string> = {
    energy_montage: '에너지 몽타주',
    story_tour: '스토리 투어',
    lifestyle_showcase: '라이프스타일 쇼케이스',
    seasonal_special: '시즌 스페셜'
  }

  return displayNames[archetype] || archetype
}

/**
 * 템플릿 설명 생성
 */
function getTemplateDescription(archetype: string, spec: ArchetypeSpec): string {
  const requiredSlots = spec.slots.filter(s => s.required).length
  const totalSlots = spec.slots.length
  const generateCount = spec.max_generate

  const descriptions: Record<string, string> = {
    energy_montage: `빠른 템포의 역동적인 영상 (${requiredSlots}/${totalSlots}개 슬롯 필수, 최대 ${generateCount}개 생성)`,
    story_tour: `차근차근 둘러보는 투어 영상 (${requiredSlots}/${totalSlots}개 슬롯 필수, 최대 ${generateCount}개 생성)`,
    lifestyle_showcase: `라이프스타일 중심의 감성 영상 (${requiredSlots}/${totalSlots}개 슬롯 필수, 최대 ${generateCount}개 생성)`,
    seasonal_special: `계절 특성을 강조한 영상 (${requiredSlots}/${totalSlots}개 슬롯 필수, 최대 ${generateCount}개 생성)`
  }

  return descriptions[archetype] || `커스텀 템플릿 (${requiredSlots}/${totalSlots}개 슬롯 필수)`
}

/**
 * 예상 제작 시간 계산
 */
function calculateEstimatedDuration(spec: ArchetypeSpec): number {
  // 생성할 샷 수에 따른 예상 시간 (분 단위)
  const baseTime = 5 // 기본 5분
  const shotTime = spec.max_generate * 0.8 // 샷당 0.8분
  const complexityTime = spec.slots.filter(s => s.required).length * 0.3 // 필수 슬롯당 0.3분

  return Math.ceil(baseTime + shotTime + complexityTime)
}

/**
 * 기본 템플릿 (폴백용)
 */
function getDefaultTemplatesWithSlotSpec(): TemplateWithSlotSpec[] {
  const currentWeek = getCurrentWeekStart()

  return [
    {
      id: `${currentWeek}_energy_montage_default`,
      archetype: 'energy_montage',
      name: '에너지 몽타주',
      description: '빠른 템포의 역동적인 영상 (기본 설정)',
      estimated_duration: 8,
      slotSpec: {
        min_total: 10,
        max_total: 20,
        max_generate: 8,
        slots: [
          {
            key: 'hero',
            label: '히어로 샷',
            count: 1,
            required: true,
            hint: '대표 외관/뷰'
          },
          {
            key: 'exterior_wide',
            label: '야외 전경',
            count: 2,
            required: true,
            hint: '건물 전체 외관'
          },
          {
            key: 'interior_main',
            label: '실내 메인',
            count: 2,
            required: true,
            hint: '대표 실내 공간'
          },
          {
            key: 'amenity',
            label: '편의시설',
            count: 2,
            required: true,
            hint: '수영장/스파/키즈시설 등'
          },
          {
            key: 'detail',
            label: '디테일 샷',
            count: 3,
            required: false,
            hint: '인테리어 소품/디테일'
          }
        ]
      },
      weekStart: currentWeek,
      version: 0
    }
  ]
}

/**
 * 현재 주차 시작일 계산
 */
function getCurrentWeekStart(): string {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0: 일요일
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // 월요일까지 일수

  const monday = new Date(now)
  monday.setDate(now.getDate() - daysToMonday)
  monday.setHours(0, 0, 0, 0)

  return monday.toISOString().slice(0, 10) // YYYY-MM-DD
}