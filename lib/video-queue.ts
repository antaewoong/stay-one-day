/**
 * BullMQ 비디오 생성 큐 시스템
 * 동시성 제어 + 지수 백오프 재시도
 */

import { Queue, Worker, Job, QueueOptions, WorkerOptions } from 'bullmq'
import Redis from 'ioredis'
import { createHash } from 'crypto'

// Redis 연결 설정
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  lazyConnect: true
})

// 큐 이름 정의
const QUEUE_NAMES = {
  VIDEO_GENERATION: `${process.env.BULL_PREFIX || 'stayOneDay:video'}:generation`,
  VIDEO_PROCESSING: `${process.env.BULL_PREFIX || 'stayOneDay:video'}:processing`,
} as const

// 작업 데이터 타입 정의
export interface VideoJobData {
  jobId: string // UUID
  hostId: string
  accommodationId: string
  templateId: string

  // 슬롯별 이미지 URL
  assets: {
    slotKey: string // 'outdoor_1', 'indoor_1' 등
    imageUrl: string // Supabase Storage URL
    originalFilename?: string
  }[]

  // 템플릿 변수
  templateVars: {
    region: string
    accommodation_type: string
    kw1?: string
    kw2?: string
    season?: string
    [key: string]: any
  }

  // 설정
  processingMode: 'turbo' | 'relaxed' // 속도 모드
  duration: number // 초

  // 메타데이터
  dedupKey: string // 중복 방지용 해시
  priority?: number // 작업 우선순위
}

// 큐 옵션
const queueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 50, // 완료된 작업 50개까지 보관
    removeOnFail: 100,    // 실패한 작업 100개까지 보관
    attempts: 3,          // 최대 3회 재시도
    backoff: {
      type: 'exponential',
      settings: {
        delay: 30000,     // 30초 시작
        factor: 3,        // 3배씩 증가 (30s → 90s → 3m)
      },
    },
  },
}

// 워커 옵션 (동시성 제어)
const workerOptions: WorkerOptions = {
  connection: redisConnection,
  concurrency: 3, // 전체 워크스페이스 동시 작업 3개
  limiter: {
    max: 5,      // 5분당 최대 5개 작업
    duration: 5 * 60 * 1000,
  },
}

/**
 * 비디오 생성 큐 관리 클래스
 */
export class VideoGenerationQueue {
  private static instance: VideoGenerationQueue | null = null
  private queue: Queue<VideoJobData>
  private worker: Worker<VideoJobData> | null = null

  private constructor() {
    this.queue = new Queue<VideoJobData>(QUEUE_NAMES.VIDEO_GENERATION, queueOptions)
  }

  static getInstance(): VideoGenerationQueue {
    if (!VideoGenerationQueue.instance) {
      VideoGenerationQueue.instance = new VideoGenerationQueue()
    }
    return VideoGenerationQueue.instance
  }

  /**
   * 비디오 생성 작업 추가
   */
  async addVideoJob(data: VideoJobData): Promise<{
    success: boolean
    jobId?: string
    queuePosition?: number
    error?: string
  }> {
    try {
      // 중복 작업 확인
      const existingJob = await this.findJobByDedup(data.dedupKey)
      if (existingJob) {
        return {
          success: false,
          error: '동일한 요청이 이미 처리 중입니다 (10분 내 중복 요청)',
          jobId: existingJob.id
        }
      }

      // 호스트별 동시 작업 제한 확인
      const hostJobCount = await this.getHostActiveJobCount(data.hostId)
      if (hostJobCount >= 2) {
        return {
          success: false,
          error: '호스트당 최대 2개의 작업만 동시에 처리 가능합니다'
        }
      }

      // 작업 추가
      const job = await this.queue.add(
        'generateVideo',
        data,
        {
          jobId: data.jobId,
          priority: data.priority || 0,
          delay: 0, // 즉시 실행
        }
      )

      // 큐 내 위치 계산
      const waiting = await this.queue.getWaiting()
      const queuePosition = waiting.findIndex(j => j.id === job.id) + 1

      console.log(`[VIDEO_QUEUE] 작업 추가: ${data.jobId}, 큐 위치: ${queuePosition}`)

      return {
        success: true,
        jobId: job.id!,
        queuePosition
      }

    } catch (error) {
      console.error('[VIDEO_QUEUE] 작업 추가 실패:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      }
    }
  }

  /**
   * 작업 상태 조회
   */
  async getJobStatus(jobId: string): Promise<{
    success: boolean
    status?: string
    progress?: number
    queuePosition?: number
    error?: string
    data?: any
  }> {
    try {
      const job = await this.queue.getJob(jobId)

      if (!job) {
        return {
          success: false,
          error: '작업을 찾을 수 없습니다'
        }
      }

      const status = await job.getState()
      const progress = job.progress || 0

      let queuePosition = 0
      if (status === 'waiting') {
        const waiting = await this.queue.getWaiting()
        queuePosition = waiting.findIndex(j => j.id === job.id) + 1
      }

      return {
        success: true,
        status,
        progress,
        queuePosition,
        data: job.data
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      }
    }
  }

  /**
   * 작업 취소
   */
  async cancelJob(jobId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const job = await this.queue.getJob(jobId)

      if (!job) {
        return {
          success: false,
          error: '작업을 찾을 수 없습니다'
        }
      }

      await job.remove()
      console.log(`[VIDEO_QUEUE] 작업 취소: ${jobId}`)

      return { success: true }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '취소 실패'
      }
    }
  }

  /**
   * 중복 키로 작업 찾기
   */
  private async findJobByDedup(dedupKey: string): Promise<Job<VideoJobData> | null> {
    const jobs = await Promise.all([
      this.queue.getWaiting(),
      this.queue.getActive(),
      this.queue.getDelayed()
    ])

    const allJobs = jobs.flat()

    return allJobs.find(job => job.data.dedupKey === dedupKey) || null
  }

  /**
   * 호스트별 활성 작업 수 계산
   */
  private async getHostActiveJobCount(hostId: string): Promise<number> {
    const activeJobs = await this.queue.getActive()
    return activeJobs.filter(job => job.data.hostId === hostId).length
  }

  /**
   * 큐 통계
   */
  async getQueueStats(): Promise<{
    waiting: number
    active: number
    completed: number
    failed: number
    delayed: number
  }> {
    return {
      waiting: await this.queue.getWaiting().then(jobs => jobs.length),
      active: await this.queue.getActive().then(jobs => jobs.length),
      completed: await this.queue.getCompleted().then(jobs => jobs.length),
      failed: await this.queue.getFailed().then(jobs => jobs.length),
      delayed: await this.queue.getDelayed().then(jobs => jobs.length),
    }
  }

  /**
   * 워커 시작 (별도 프로세스에서 실행)
   */
  startWorker(processor: (job: Job<VideoJobData>) => Promise<any>): void {
    if (this.worker) {
      console.log('[VIDEO_QUEUE] 워커가 이미 실행 중입니다')
      return
    }

    this.worker = new Worker<VideoJobData>(
      QUEUE_NAMES.VIDEO_GENERATION,
      processor,
      workerOptions
    )

    this.worker.on('completed', (job) => {
      console.log(`[VIDEO_QUEUE] 작업 완료: ${job.id}`)
    })

    this.worker.on('failed', (job, err) => {
      console.error(`[VIDEO_QUEUE] 작업 실패: ${job?.id}`, err.message)
    })

    this.worker.on('stalled', (jobId) => {
      console.warn(`[VIDEO_QUEUE] 작업 지연: ${jobId}`)
    })

    console.log('[VIDEO_QUEUE] 워커 시작됨')
  }

  /**
   * 워커 종료
   */
  async stopWorker(): Promise<void> {
    if (this.worker) {
      await this.worker.close()
      this.worker = null
      console.log('[VIDEO_QUEUE] 워커 종료됨')
    }
  }

  /**
   * 큐 정리 (개발용)
   */
  async cleanup(): Promise<void> {
    await this.queue.obliterate({ force: true })
    console.log('[VIDEO_QUEUE] 큐 정리 완료')
  }
}

/**
 * 중복 방지용 해시 생성
 */
export function generateDedupKey(
  templateId: string,
  assets: VideoJobData['assets'],
  templateVars: VideoJobData['templateVars']
): string {
  const content = JSON.stringify({
    templateId,
    assetHashes: assets.map(a => a.imageUrl).sort(),
    templateVars
  })

  return createHash('sha256').update(content).digest('hex').substring(0, 16)
}

/**
 * 싱글톤 큐 인스턴스
 */
export function getVideoQueue(): VideoGenerationQueue {
  return VideoGenerationQueue.getInstance()
}

// Redis 연결 상태 모니터링
redisConnection.on('connect', () => {
  console.log('[REDIS] 연결됨')
})

redisConnection.on('error', (err) => {
  console.error('[REDIS] 연결 오류:', err.message)
})

redisConnection.on('close', () => {
  console.log('[REDIS] 연결 종료됨')
})