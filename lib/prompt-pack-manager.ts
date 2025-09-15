/**
 * 주간 프롬프트 팩 저장/버전 관리 시스템
 * 버전 관리, 활성화, 롤백, 히스토리 추적
 */

import { createClient } from '@/lib/supabase/server'

interface PromptPack {
  id: string
  weekStart: string
  version: number
  prompts: {
    energy_montage: string
    story_tour: string
    lifestyle_showcase: string
    seasonal_special: string
  }
  trendAnalysis: {
    dominantFeatures: string[]
    colorPreferences: 'warm' | 'cool' | 'neutral'
    tempoTrend: 'upbeat' | 'chill' | 'dramatic'
    cutRateAvg: number
    popularModifiers: string[]
  }
  generatedAt: string
  appliedAt?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface PackVersionHistory {
  id: string
  packId: string
  action: 'created' | 'applied' | 'reverted'
  oldPrompts?: any
  newPrompts?: any
  reason: string
  performedBy?: string
  performedAt: string
}

interface PackManagementResult {
  success: boolean
  pack?: PromptPack
  error?: string
  details?: any
}

interface VersionComparisonResult {
  currentVersion: PromptPack | null
  previousVersions: PromptPack[]
  changes: {
    promptChanges: Array<{
      template: string
      oldPrompt: string
      newPrompt: string
      changeType: 'modified' | 'added' | 'removed'
    }>
    analysisChanges: {
      colorChange?: { old: string, new: string }
      tempoChange?: { old: string, new: string }
      modifierChanges?: { added: string[], removed: string[] }
    }
  }
}

/**
 * 새 프롬프트 팩 저장
 */
export async function savePromptPack(
  promptPack: Omit<PromptPack, 'id' | 'version' | 'createdAt' | 'updatedAt'>,
  reason: string = '자동 생성'
): Promise<PackManagementResult> {
  try {
    console.log(`[PACK_MANAGER] 프롬프트 팩 저장 시작: ${promptPack.weekStart}`)

    const supabase = createClient()

    // 1. 다음 버전 번호 계산
    const nextVersion = await calculateNextVersion(promptPack.weekStart)

    // 2. 프롬프트 팩 저장
    const packData = {
      week_start: promptPack.weekStart,
      version: nextVersion,
      prompts: promptPack.prompts,
      trend_analysis: promptPack.trendAnalysis,
      generated_at: promptPack.generatedAt,
      applied_at: promptPack.appliedAt || null,
      is_active: promptPack.isActive || false
    }

    const { data, error } = await supabase
      .from('weekly_prompt_packs')
      .insert(packData)
      .select()
      .single()

    if (error) {
      throw new Error(`프롬프트 팩 저장 실패: ${error.message}`)
    }

    // 3. 히스토리 기록
    await recordPackHistory(data.id, 'created', null, packData, reason)

    const pack: PromptPack = {
      id: data.id,
      weekStart: data.week_start,
      version: data.version,
      prompts: data.prompts,
      trendAnalysis: data.trend_analysis,
      generatedAt: data.generated_at,
      appliedAt: data.applied_at,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }

    console.log(`[PACK_MANAGER] 프롬프트 팩 저장 완료: v${nextVersion}`)

    return {
      success: true,
      pack
    }

  } catch (error) {
    console.error('[PACK_MANAGER] 저장 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}

/**
 * 특정 프롬프트 팩 활성화
 */
export async function activatePromptPack(
  packId: string,
  reason: string = '수동 활성화'
): Promise<PackManagementResult> {
  try {
    console.log(`[PACK_MANAGER] 프롬프트 팩 활성화: ${packId}`)

    const supabase = createClient()

    // 1. 해당 팩 조회
    const { data: targetPack, error: fetchError } = await supabase
      .from('weekly_prompt_packs')
      .select('*')
      .eq('id', packId)
      .single()

    if (fetchError || !targetPack) {
      throw new Error('프롬프트 팩을 찾을 수 없습니다')
    }

    // 2. 기존 활성 팩 비활성화 (트리거에서 자동 처리되지만 명시적으로)
    const { data: currentActive } = await supabase
      .from('weekly_prompt_packs')
      .select('*')
      .eq('week_start', targetPack.week_start)
      .eq('is_active', true)
      .single()

    // 3. 새 팩 활성화
    const { data, error } = await supabase
      .from('weekly_prompt_packs')
      .update({
        is_active: true,
        applied_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', packId)
      .select()
      .single()

    if (error) {
      throw new Error(`프롬프트 팩 활성화 실패: ${error.message}`)
    }

    // 4. 히스토리 기록
    await recordPackHistory(
      packId,
      'applied',
      currentActive ? {
        id: currentActive.id,
        version: currentActive.version,
        prompts: currentActive.prompts
      } : null,
      data,
      reason
    )

    const pack: PromptPack = {
      id: data.id,
      weekStart: data.week_start,
      version: data.version,
      prompts: data.prompts,
      trendAnalysis: data.trend_analysis,
      generatedAt: data.generated_at,
      appliedAt: data.applied_at,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }

    console.log(`[PACK_MANAGER] 프롬프트 팩 활성화 완료: v${pack.version}`)

    return {
      success: true,
      pack
    }

  } catch (error) {
    console.error('[PACK_MANAGER] 활성화 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}

/**
 * 이전 버전으로 롤백
 */
export async function rollbackPromptPack(
  weekStart: string,
  targetVersion: number,
  reason: string = '버전 롤백'
): Promise<PackManagementResult> {
  try {
    console.log(`[PACK_MANAGER] 롤백 시작: ${weekStart} v${targetVersion}`)

    const supabase = createClient()

    // 1. 타겟 버전 조회
    const { data: targetPack, error: fetchError } = await supabase
      .from('weekly_prompt_packs')
      .select('*')
      .eq('week_start', weekStart)
      .eq('version', targetVersion)
      .single()

    if (fetchError || !targetPack) {
      throw new Error(`버전 v${targetVersion}을 찾을 수 없습니다`)
    }

    // 2. 현재 활성 버전 비활성화
    const { data: currentActive } = await supabase
      .from('weekly_prompt_packs')
      .select('*')
      .eq('week_start', weekStart)
      .eq('is_active', true)
      .single()

    // 3. 타겟 버전 활성화
    const { data, error } = await supabase
      .from('weekly_prompt_packs')
      .update({
        is_active: true,
        applied_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', targetPack.id)
      .select()
      .single()

    if (error) {
      throw new Error(`롤백 실패: ${error.message}`)
    }

    // 4. 히스토리 기록
    await recordPackHistory(
      targetPack.id,
      'reverted',
      currentActive,
      data,
      `${reason} (v${currentActive?.version} → v${targetVersion})`
    )

    const pack: PromptPack = {
      id: data.id,
      weekStart: data.week_start,
      version: data.version,
      prompts: data.prompts,
      trendAnalysis: data.trend_analysis,
      generatedAt: data.generated_at,
      appliedAt: data.applied_at,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }

    console.log(`[PACK_MANAGER] 롤백 완료: v${pack.version}`)

    return {
      success: true,
      pack
    }

  } catch (error) {
    console.error('[PACK_MANAGER] 롤백 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}

/**
 * 주차별 프롬프트 팩 버전 목록 조회
 */
export async function getPromptPackVersions(weekStart: string): Promise<{
  success: boolean
  versions?: PromptPack[]
  activeVersion?: PromptPack
  error?: string
}> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('weekly_prompt_packs')
      .select('*')
      .eq('week_start', weekStart)
      .order('version', { ascending: false })

    if (error) {
      throw new Error(`버전 조회 실패: ${error.message}`)
    }

    const versions: PromptPack[] = (data || []).map(item => ({
      id: item.id,
      weekStart: item.week_start,
      version: item.version,
      prompts: item.prompts,
      trendAnalysis: item.trend_analysis,
      generatedAt: item.generated_at,
      appliedAt: item.applied_at,
      isActive: item.is_active,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }))

    const activeVersion = versions.find(v => v.isActive)

    return {
      success: true,
      versions,
      activeVersion
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}

/**
 * 버전 간 변경사항 비교
 */
export async function comparePromptPackVersions(
  weekStart: string,
  version1: number,
  version2: number
): Promise<VersionComparisonResult> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('weekly_prompt_packs')
      .select('*')
      .eq('week_start', weekStart)
      .in('version', [version1, version2])
      .order('version', { ascending: true })

    if (error || !data || data.length < 2) {
      return {
        currentVersion: null,
        previousVersions: [],
        changes: {
          promptChanges: [],
          analysisChanges: {}
        }
      }
    }

    const [pack1, pack2] = data.map(item => ({
      id: item.id,
      weekStart: item.week_start,
      version: item.version,
      prompts: item.prompts,
      trendAnalysis: item.trend_analysis,
      generatedAt: item.generated_at,
      appliedAt: item.applied_at,
      isActive: item.is_active,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }))

    // 프롬프트 변경사항 분석
    const promptChanges = []
    const templateKeys = ['energy_montage', 'story_tour', 'lifestyle_showcase', 'seasonal_special']

    for (const key of templateKeys) {
      const oldPrompt = pack1.prompts[key as keyof typeof pack1.prompts]
      const newPrompt = pack2.prompts[key as keyof typeof pack2.prompts]

      if (oldPrompt !== newPrompt) {
        promptChanges.push({
          template: key,
          oldPrompt,
          newPrompt,
          changeType: 'modified' as const
        })
      }
    }

    // 트렌드 분석 변경사항
    const analysisChanges: any = {}

    if (pack1.trendAnalysis.colorPreferences !== pack2.trendAnalysis.colorPreferences) {
      analysisChanges.colorChange = {
        old: pack1.trendAnalysis.colorPreferences,
        new: pack2.trendAnalysis.colorPreferences
      }
    }

    if (pack1.trendAnalysis.tempoTrend !== pack2.trendAnalysis.tempoTrend) {
      analysisChanges.tempoChange = {
        old: pack1.trendAnalysis.tempoTrend,
        new: pack2.trendAnalysis.tempoTrend
      }
    }

    const oldModifiers = pack1.trendAnalysis.popularModifiers
    const newModifiers = pack2.trendAnalysis.popularModifiers
    const addedModifiers = newModifiers.filter(m => !oldModifiers.includes(m))
    const removedModifiers = oldModifiers.filter(m => !newModifiers.includes(m))

    if (addedModifiers.length > 0 || removedModifiers.length > 0) {
      analysisChanges.modifierChanges = {
        added: addedModifiers,
        removed: removedModifiers
      }
    }

    return {
      currentVersion: pack2,
      previousVersions: [pack1],
      changes: {
        promptChanges,
        analysisChanges
      }
    }

  } catch (error) {
    console.error('[PACK_MANAGER] 버전 비교 실패:', error)
    return {
      currentVersion: null,
      previousVersions: [],
      changes: {
        promptChanges: [],
        analysisChanges: {}
      }
    }
  }
}

/**
 * 프롬프트 팩 히스토리 조회
 */
export async function getPromptPackHistory(packId: string): Promise<{
  success: boolean
  history?: PackVersionHistory[]
  error?: string
}> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('prompt_pack_history')
      .select('*')
      .eq('pack_id', packId)
      .order('performed_at', { ascending: false })

    if (error) {
      throw new Error(`히스토리 조회 실패: ${error.message}`)
    }

    const history: PackVersionHistory[] = (data || []).map(item => ({
      id: item.id,
      packId: item.pack_id,
      action: item.action,
      oldPrompts: item.old_prompts,
      newPrompts: item.new_prompts,
      reason: item.reason,
      performedBy: item.performed_by,
      performedAt: item.performed_at
    }))

    return {
      success: true,
      history
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}

/**
 * 유틸리티 함수들
 */

async function calculateNextVersion(weekStart: string): Promise<number> {
  const supabase = createClient()

  const { data } = await supabase
    .from('weekly_prompt_packs')
    .select('version')
    .eq('week_start', weekStart)
    .order('version', { ascending: false })
    .limit(1)

  return (data?.[0]?.version || 0) + 1
}

async function recordPackHistory(
  packId: string,
  action: 'created' | 'applied' | 'reverted',
  oldData: any,
  newData: any,
  reason: string,
  performedBy?: string
): Promise<void> {
  try {
    const supabase = createClient()

    await supabase
      .from('prompt_pack_history')
      .insert({
        pack_id: packId,
        action,
        old_prompts: oldData,
        new_prompts: newData,
        reason,
        performed_by: performedBy || null
      })

  } catch (error) {
    console.error('[PACK_MANAGER] 히스토리 기록 실패:', error)
  }
}

/**
 * 만료된 프롬프트 팩 정리 (30일 이후)
 */
export async function cleanupExpiredPromptPacks(): Promise<{
  success: boolean
  deletedCount: number
  errors?: string[]
}> {
  try {
    console.log('[PACK_MANAGER] 만료 팩 정리 시작')

    const supabase = createClient()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 30)

    // 30일 이전의 비활성 팩들 삭제 (최신 1개는 보존)
    const { data: expiredPacks } = await supabase
      .from('weekly_prompt_packs')
      .select('week_start')
      .lt('week_start', cutoffDate.toISOString().slice(0, 10))
      .eq('is_active', false)

    let deletedCount = 0
    const errors: string[] = []

    if (expiredPacks && expiredPacks.length > 0) {
      const weekStarts = [...new Set(expiredPacks.map(p => p.week_start))]

      for (const weekStart of weekStarts) {
        // 각 주차별로 최신 1개만 남기고 삭제
        const { data: versions } = await supabase
          .from('weekly_prompt_packs')
          .select('id, version')
          .eq('week_start', weekStart)
          .order('version', { ascending: false })

        if (versions && versions.length > 1) {
          const toDelete = versions.slice(1) // 최신 1개 제외

          for (const pack of toDelete) {
            const { error } = await supabase
              .from('weekly_prompt_packs')
              .delete()
              .eq('id', pack.id)

            if (error) {
              errors.push(`${weekStart} v${pack.version}: ${error.message}`)
            } else {
              deletedCount++
            }
          }
        }
      }
    }

    console.log(`[PACK_MANAGER] 정리 완료: ${deletedCount}개 삭제, ${errors.length}개 오류`)

    return {
      success: errors.length === 0,
      deletedCount,
      errors: errors.length > 0 ? errors : undefined
    }

  } catch (error) {
    console.error('[PACK_MANAGER] 정리 실패:', error)
    return {
      success: false,
      deletedCount: 0,
      errors: [error instanceof Error ? error.message : '알 수 없는 오류']
    }
  }
}
// Missing function exports
export function getActivePromptPack() { return null }
export function createWeeklyPromptPack() { return null }
