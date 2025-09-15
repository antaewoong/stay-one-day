/**
 * Runway ML API 클라이언트
 * 영상 생성 및 작업 상태 추적
 */

const RUNWAY_API_BASE = 'https://api.dev.runwayml.com'
const RUNWAY_VERSION = '2024-09-13'

interface RunwayResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: any
}

interface RunwayTask {
  id: string
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED'
  image?: string
  video?: string[]
  progress?: number
  eta?: number
  error?: string
  createdAt: string
  updatedAt: string
}

interface ImageToVideoRequest {
  promptImage: string | string[] // Base64 또는 URL
  promptText?: string
  model?: 'gen3a_turbo' | 'gen3a' // 기본: gen3a_turbo (빠름)
  seed?: number
  watermark?: boolean
  duration?: 5 | 10 // 초단위
  ratio?: '16:9' | '9:16' | '1:1'
}

export class RunwayClient {
  private apiToken: string

  constructor(apiToken?: string) {
    this.apiToken = apiToken || process.env.RUNWAY_API_TOKEN!
    if (!this.apiToken) {
      throw new Error('RUNWAY_API_TOKEN이 설정되지 않았습니다')
    }
  }

  /**
   * API 호출 헬퍼
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<RunwayResponse<T>> {
    try {
      const url = `${RUNWAY_API_BASE}${endpoint}`

      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'X-Runway-Version': RUNWAY_VERSION,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText }
        }

        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`,
          details: errorData
        }
      }

      const data = await response.json()
      return {
        success: true,
        data
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        details: error
      }
    }
  }

  /**
   * 이미지를 비디오로 변환 작업 시작
   */
  async createImageToVideo(request: ImageToVideoRequest): Promise<RunwayResponse<RunwayTask>> {
    const payload = {
      promptImage: request.promptImage,
      promptText: request.promptText || '',
      model: request.model || 'gen3a_turbo', // 느린 모드 기본값
      seed: request.seed,
      watermark: request.watermark ?? false,
      duration: request.duration || 5,
      ratio: request.ratio || '9:16'
    }

    console.log('[RUNWAY] 영상 생성 시작:', {
      model: payload.model,
      duration: payload.duration,
      ratio: payload.ratio,
      hasPromptText: !!payload.promptText
    })

    return this.request<RunwayTask>('/v1/image_to_video', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }

  /**
   * 작업 상태 조회
   */
  async getTask(taskId: string): Promise<RunwayResponse<RunwayTask>> {
    return this.request<RunwayTask>(`/v1/tasks/${taskId}`)
  }

  /**
   * 작업 취소
   */
  async cancelTask(taskId: string): Promise<RunwayResponse<void>> {
    return this.request<void>(`/v1/tasks/${taskId}`, {
      method: 'DELETE'
    })
  }

  /**
   * 작업 완료까지 폴링 (느린 모드 최적화)
   */
  async waitForCompletion(
    taskId: string,
    options: {
      maxWaitMs?: number // 최대 대기시간 (기본: 30분)
      pollIntervalMs?: number // 폴링 간격 (기본: 90초)
      onProgress?: (task: RunwayTask) => void
    } = {}
  ): Promise<RunwayResponse<RunwayTask>> {
    const maxWaitMs = options.maxWaitMs || 30 * 60 * 1000 // 30분
    const pollIntervalMs = options.pollIntervalMs || 90 * 1000 // 90초 (느린 모드 최적화)

    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitMs) {
      const result = await this.getTask(taskId)

      if (!result.success) {
        return result
      }

      const task = result.data!

      // 진행상황 콜백
      if (options.onProgress) {
        options.onProgress(task)
      }

      // 완료 상태 확인
      if (task.status === 'SUCCEEDED') {
        console.log(`[RUNWAY] 작업 완료: ${taskId}`)
        return result
      }

      if (task.status === 'FAILED' || task.status === 'CANCELLED') {
        console.error(`[RUNWAY] 작업 실패: ${taskId}, 상태: ${task.status}`)
        return {
          success: false,
          error: task.error || `작업이 ${task.status} 상태입니다`,
          data: task
        }
      }

      // 다음 폴링까지 대기
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
    }

    // 타임아웃
    return {
      success: false,
      error: '작업 완료 대기 시간이 초과되었습니다',
      details: { taskId, maxWaitMs }
    }
  }

  /**
   * 크레딧 사용량 추정
   */
  estimateCredits(duration: number, model: string = 'gen3a_turbo'): number {
    // gen3a_turbo: 초당 5 크레딧
    // gen3a: 초당 10 크레딧 (더 높은 품질)
    const creditsPerSecond = model === 'gen3a' ? 10 : 5
    return duration * creditsPerSecond
  }

  /**
   * 배치 작업 (6샷을 위한 병렬 처리)
   */
  async createBatchImageToVideo(requests: ImageToVideoRequest[]): Promise<{
    success: boolean
    tasks: RunwayTask[]
    errors: string[]
  }> {
    const results = await Promise.allSettled(
      requests.map(req => this.createImageToVideo(req))
    )

    const tasks: RunwayTask[] = []
    const errors: string[] = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        tasks.push(result.value.data!)
      } else {
        const error = result.status === 'fulfilled'
          ? result.value.error
          : result.reason.message
        errors.push(`슬롯 ${index + 1}: ${error}`)
      }
    })

    return {
      success: errors.length === 0,
      tasks,
      errors
    }
  }

  /**
   * 배치 작업 완료 대기
   */
  async waitForBatchCompletion(
    taskIds: string[],
    options: {
      maxWaitMs?: number
      pollIntervalMs?: number
      onProgress?: (completed: number, total: number, tasks: RunwayTask[]) => void
    } = {}
  ): Promise<{
    success: boolean
    completedTasks: RunwayTask[]
    failedTasks: RunwayTask[]
    errors: string[]
  }> {
    const maxWaitMs = options.maxWaitMs || 45 * 60 * 1000 // 45분
    const pollIntervalMs = options.pollIntervalMs || 90 * 1000 // 90초

    const startTime = Date.now()
    const completedTasks: RunwayTask[] = []
    const failedTasks: RunwayTask[] = []
    const errors: string[] = []

    const pendingTaskIds = new Set(taskIds)

    while (pendingTaskIds.size > 0 && Date.now() - startTime < maxWaitMs) {
      // 모든 대기 중인 작업 상태 조회
      const statusResults = await Promise.allSettled(
        Array.from(pendingTaskIds).map(taskId => this.getTask(taskId))
      )

      const allTasks: RunwayTask[] = []

      statusResults.forEach((result, index) => {
        const taskId = Array.from(pendingTaskIds)[index]

        if (result.status === 'fulfilled' && result.value.success) {
          const task = result.value.data!
          allTasks.push(task)

          if (task.status === 'SUCCEEDED') {
            completedTasks.push(task)
            pendingTaskIds.delete(taskId)
          } else if (task.status === 'FAILED' || task.status === 'CANCELLED') {
            failedTasks.push(task)
            errors.push(`작업 ${taskId}: ${task.error || task.status}`)
            pendingTaskIds.delete(taskId)
          }
        } else {
          const error = result.status === 'fulfilled'
            ? result.value.error
            : result.reason.message
          errors.push(`작업 ${taskId} 상태 조회 실패: ${error}`)
          pendingTaskIds.delete(taskId)
        }
      })

      // 진행상황 콜백
      if (options.onProgress) {
        options.onProgress(
          completedTasks.length,
          taskIds.length,
          allTasks
        )
      }

      // 아직 대기 중인 작업이 있으면 다음 폴링까지 대기
      if (pendingTaskIds.size > 0) {
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
      }
    }

    // 타임아웃된 작업들
    if (pendingTaskIds.size > 0) {
      errors.push(`타임아웃된 작업: ${Array.from(pendingTaskIds).join(', ')}`)
    }

    return {
      success: failedTasks.length === 0 && pendingTaskIds.size === 0,
      completedTasks,
      failedTasks,
      errors
    }
  }
}

// 싱글톤 인스턴스
let runwayClientInstance: RunwayClient | null = null

export function getRunwayClient(): RunwayClient {
  if (!runwayClientInstance) {
    runwayClientInstance = new RunwayClient()
  }
  return runwayClientInstance
}

// 타입 익스포트
export type { RunwayTask, ImageToVideoRequest }