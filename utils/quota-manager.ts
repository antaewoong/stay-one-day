import { getCurrentWeekInfo, formatDateKST } from './kst-time'

// 메모리 기반 쿼터 관리 (임시 - 실제로는 DB 원자 함수 사용)
interface QuotaEntry {
  manual_runs: number
  admin_proxy_runs: number
  week_start: string
}

const quotaStore = new Map<string, QuotaEntry>()

// 표준화된 쿼터 결과 타입
export interface QuotaResult {
  manual_runs: number
  admin_proxy_runs: number
  total_runs: number
  incremented: boolean
  next_available?: string
}

// 429 응답용 표준화된 쿼터 초과 에러
export interface QuotaExceededError {
  error: 'quota_exceeded'
  message: '이번 주 리포트 2회 모두 사용하셨습니다'
  next_available: string
  current_usage: {
    manual: number
    admin_proxy: number
  }
}

/**
 * 원자적 쿼터 확인 및 증가 시도
 * 실제로는 upsert_and_try_increment_quota DB 함수 사용
 * 동시성 문제 방지를 위한 원자 연산
 */
export function tryIncrementQuota(
  hostId: string,
  kind: 'manual' | 'admin_proxy'
): QuotaResult {
  const weekInfo = getCurrentWeekInfo()
  const key = `${hostId}:${weekInfo.weekStartFormatted}`

  // 기존 쿼터 조회 또는 초기화
  let quota = quotaStore.get(key) || {
    manual_runs: 0,
    admin_proxy_runs: 0,
    week_start: weekInfo.weekStartFormatted
  }

  const currentTotal = quota.manual_runs + quota.admin_proxy_runs

  // 이미 한도 초과
  if (currentTotal >= 2) {
    return {
      manual_runs: quota.manual_runs,
      admin_proxy_runs: quota.admin_proxy_runs,
      total_runs: currentTotal,
      incremented: false,
      next_available: weekInfo.nextWeekFormatted
    }
  }

  // 증가 후에도 한도 초과 확인
  if (currentTotal + 1 > 2) {
    return {
      manual_runs: quota.manual_runs,
      admin_proxy_runs: quota.admin_proxy_runs,
      total_runs: currentTotal,
      incremented: false,
      next_available: weekInfo.nextWeekFormatted
    }
  }

  // 원자적 증가 (실제로는 DB에서 처리)
  if (kind === 'manual') {
    quota.manual_runs += 1
  } else {
    quota.admin_proxy_runs += 1
  }

  quotaStore.set(key, quota)

  return {
    manual_runs: quota.manual_runs,
    admin_proxy_runs: quota.admin_proxy_runs,
    total_runs: quota.manual_runs + quota.admin_proxy_runs,
    incremented: true
  }
}

/**
 * 현재 쿼터 상태 조회 (읽기 전용)
 */
export function getQuotaStatus(hostId: string): QuotaResult {
  const weekInfo = getCurrentWeekInfo()
  const key = `${hostId}:${weekInfo.weekStartFormatted}`

  const quota = quotaStore.get(key) || {
    manual_runs: 0,
    admin_proxy_runs: 0,
    week_start: weekInfo.weekStartFormatted
  }

  const total = quota.manual_runs + quota.admin_proxy_runs

  return {
    manual_runs: quota.manual_runs,
    admin_proxy_runs: quota.admin_proxy_runs,
    total_runs: total,
    incremented: false, // 조회만 하므로 false
    next_available: total >= 2 ? weekInfo.nextWeekFormatted : undefined
  }
}

/**
 * 표준화된 429 쿼터 초과 에러 생성
 */
export function createQuotaExceededError(quotaResult: QuotaResult): QuotaExceededError {
  return {
    error: 'quota_exceeded',
    message: '이번 주 리포트 2회 모두 사용하셨습니다',
    next_available: quotaResult.next_available || getCurrentWeekInfo().nextWeekFormatted,
    current_usage: {
      manual: quotaResult.manual_runs,
      admin_proxy: quotaResult.admin_proxy_runs
    }
  }
}

/**
 * 쿼터 상태를 체크하고 초과시 429 에러 반환
 */
export function checkAndIncrementQuota(hostId: string, kind: 'manual' | 'admin_proxy') {
  const quotaResult = tryIncrementQuota(hostId, kind)

  if (!quotaResult.incremented) {
    const error = createQuotaExceededError(quotaResult)
    return { success: false, error, status: 429 }
  }

  return { success: true, quota: quotaResult, status: 200 }
}