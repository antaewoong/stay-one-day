/**
 * 영상 생성 워커
 * 런웨이 API + FFmpeg 스티칭 + 스토리지 업로드
 */

import { Job } from 'bullmq'
import { createClient } from '@/lib/supabase/server'
import { getRunwayClient, RunwayTask } from './runway-client'
import { VideoJobData } from './video-queue'
import { stitchVideoClips } from './video-ffmpeg'
import { uploadVideoToStorage, createSignedVideoUrl } from './video-storage'
import { sendVideoReadyEmail } from './video-email'

interface VideoProcessingResult {
  success: boolean
  finalVideoPath?: string
  signedUrl?: string
  duration?: number
  fileSize?: number
  error?: string
  details?: any
}

/**
 * 메인 영상 생성 워커 프로세서
 */
export async function processVideoGeneration(job: Job<VideoJobData>): Promise<VideoProcessingResult> {
  const { jobId, hostId, accommodationId, templateId, assets, templateVars, processingMode } = job.data
  const startTime = Date.now()

  console.log(`[VIDEO_WORKER] 작업 시작: ${jobId}`)

  try {
    // 1. 데이터베이스 초기화
    await initializeJobInDB(job.data)
    await updateJobStatus(jobId, 'validating', '입력 검증 중')

    // 2. 템플릿 및 자산 검증
    const validation = await validateJobAssets(job.data)
    if (!validation.success) {
      await updateJobStatus(jobId, 'failed', validation.error!)
      return { success: false, error: validation.error }
    }

    await job.updateProgress(10) // 10%

    // 3. 런웨이에서 클립 생성
    await updateJobStatus(jobId, 'generating_clips', '런웨이에서 영상 클립 생성 중')

    const clipsResult = await generateVideoClips(job.data)
    if (!clipsResult.success) {
      await updateJobStatus(jobId, 'failed', clipsResult.error!)
      return { success: false, error: clipsResult.error }
    }

    await job.updateProgress(60) // 60%

    // 4. FFmpeg로 클립 스티칭
    await updateJobStatus(jobId, 'stitching', 'FFmpeg로 영상 합성 중')

    const stitchResult = await stitchVideoClips({
      clips: clipsResult.clipUrls!,
      templateVars,
      outputPath: `/tmp/final_${jobId}.mp4`
    })

    if (!stitchResult.success) {
      await updateJobStatus(jobId, 'failed', stitchResult.error!)
      return { success: false, error: stitchResult.error }
    }

    await job.updateProgress(80) // 80%

    // 5. 스토리지 업로드
    await updateJobStatus(jobId, 'uploading', '스토리지에 업로드 중')

    const uploadResult = await uploadVideoToStorage({
      jobId,
      accommodationId,
      localFilePath: stitchResult.outputPath!,
      metadata: {
        duration: stitchResult.duration!,
        fileSize: stitchResult.fileSize!,
        resolution: '1080x1920'
      }
    })

    if (!uploadResult.success) {
      await updateJobStatus(jobId, 'failed', uploadResult.error!)
      return { success: false, error: uploadResult.error }
    }

    await job.updateProgress(90) // 90%

    // 6. 서명 URL 생성 및 이메일 발송
    const signedUrl = await createSignedVideoUrl(uploadResult.storagePath!)

    if (signedUrl) {
      await sendVideoReadyNotification(job.data, signedUrl, uploadResult.storagePath!)
    }

    // 7. 완료 처리
    await updateJobStatus(jobId, 'delivered', '완료')
    await finalizeJobInDB(jobId, {
      storagePath: uploadResult.storagePath!,
      signedUrl: signedUrl!,
      duration: stitchResult.duration!,
      fileSize: stitchResult.fileSize!
    })

    await job.updateProgress(100) // 100%

    const duration = Date.now() - startTime
    console.log(`[VIDEO_WORKER] 작업 완료: ${jobId}, 소요시간: ${duration}ms`)

    return {
      success: true,
      finalVideoPath: uploadResult.storagePath,
      signedUrl,
      duration: stitchResult.duration,
      fileSize: stitchResult.fileSize
    }

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[VIDEO_WORKER] 작업 실패: ${jobId}, 소요시간: ${duration}ms`, error)

    await updateJobStatus(jobId, 'failed', error instanceof Error ? error.message : '알 수 없는 오류')

    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      details: error
    }
  }
}

/**
 * 런웨이에서 비디오 클립 생성
 */
async function generateVideoClips(jobData: VideoJobData): Promise<{
  success: boolean
  clipUrls?: string[]
  error?: string
  details?: any
}> {
  try {
    const runwayClient = getRunwayClient()
    const { assets, templateVars, processingMode } = jobData

    // 템플릿 정보 조회
    const template = await getTemplateFromDB(jobData.templateId)
    if (!template) {
      return { success: false, error: '템플릿을 찾을 수 없습니다' }
    }

    // 프롬프트 생성
    const basePrompt = template.prompt_base
    const finalPrompt = interpolatePrompt(basePrompt, templateVars)

    console.log(`[VIDEO_WORKER] 프롬프트: ${finalPrompt}`)

    // 각 슬롯별로 런웨이 작업 생성
    const runwayRequests = assets.map(asset => ({
      promptImage: asset.imageUrl,
      promptText: finalPrompt,
      model: processingMode === 'turbo' ? 'gen3a_turbo' : 'gen3a_turbo', // 느린 모드도 turbo 사용
      duration: 5, // 5초 고정
      ratio: '9:16' as const
    }))

    // 배치 작업 시작
    const batchResult = await runwayClient.createBatchImageToVideo(runwayRequests)

    if (!batchResult.success) {
      return {
        success: false,
        error: '런웨이 작업 생성 실패',
        details: batchResult.errors
      }
    }

    console.log(`[VIDEO_WORKER] 런웨이 작업 생성 완료: ${batchResult.tasks.length}개`)

    // 배치 작업 완료 대기 (폴링)
    const taskIds = batchResult.tasks.map(task => task.id)
    const completionResult = await runwayClient.waitForBatchCompletion(taskIds, {
      maxWaitMs: 30 * 60 * 1000, // 30분
      pollIntervalMs: 90 * 1000,  // 90초 간격
      onProgress: (completed, total) => {
        console.log(`[VIDEO_WORKER] 런웨이 진행: ${completed}/${total}`)
      }
    })

    if (!completionResult.success) {
      return {
        success: false,
        error: '런웨이 작업 완료 대기 실패',
        details: completionResult.errors
      }
    }

    // 완성된 비디오 URL 추출
    const clipUrls = completionResult.completedTasks
      .map(task => task.video?.[0])
      .filter(Boolean) as string[]

    if (clipUrls.length === 0) {
      return {
        success: false,
        error: '생성된 비디오 클립이 없습니다',
        details: completionResult
      }
    }

    console.log(`[VIDEO_WORKER] 클립 생성 완료: ${clipUrls.length}개`)

    return {
      success: true,
      clipUrls
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '런웨이 작업 중 오류',
      details: error
    }
  }
}

/**
 * 프롬프트 변수 치환
 */
function interpolatePrompt(basePrompt: string, vars: Record<string, any>): string {
  let result = basePrompt

  Object.entries(vars).forEach(([key, value]) => {
    const pattern = new RegExp(`\\{${key}\\}`, 'g')
    result = result.replace(pattern, String(value))
  })

  return result
}

/**
 * DB에서 템플릿 정보 조회
 */
async function getTemplateFromDB(templateId: string): Promise<any> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('video_templates')
    .select('*')
    .eq('id', templateId)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('[VIDEO_WORKER] 템플릿 조회 실패:', error)
    return null
  }

  return data
}

/**
 * 작업 자산 검증
 */
async function validateJobAssets(jobData: VideoJobData): Promise<{
  success: boolean
  error?: string
}> {
  // 1. 필수 자산 확인
  if (jobData.assets.length === 0) {
    return { success: false, error: '업로드된 이미지가 없습니다' }
  }

  // 2. 템플릿 존재 확인
  const template = await getTemplateFromDB(jobData.templateId)
  if (!template) {
    return { success: false, error: '지정된 템플릿을 찾을 수 없습니다' }
  }

  // 3. 월간 쿼터 확인
  const quotaCheck = await checkMonthlyQuota(jobData.hostId)
  if (!quotaCheck.allowed) {
    return { success: false, error: quotaCheck.error }
  }

  return { success: true }
}

/**
 * 월간 쿼터 확인
 */
async function checkMonthlyQuota(hostId: string): Promise<{
  allowed: boolean
  error?: string
}> {
  const supabase = createClient()

  const currentMonth = new Date().toISOString().slice(0, 7) + '-01'

  const { data, error } = await supabase
    .from('video_monthly_quota')
    .select('used_count, limit_count')
    .eq('host_id', hostId)
    .eq('month', currentMonth)
    .single()

  if (error && error.code !== 'PGRST116') { // Not found는 허용
    console.error('[VIDEO_WORKER] 쿼터 조회 실패:', error)
    return { allowed: false, error: '쿼터 확인 중 오류가 발생했습니다' }
  }

  const quota = data || { used_count: 0, limit_count: 1 }

  if (quota.used_count >= quota.limit_count) {
    return {
      allowed: false,
      error: `월 영상 생성 한도를 초과했습니다 (${quota.used_count}/${quota.limit_count})`
    }
  }

  return { allowed: true }
}

/**
 * DB에 작업 초기화
 */
async function initializeJobInDB(jobData: VideoJobData): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('video_jobs')
    .insert({
      id: jobData.jobId,
      host_id: jobData.hostId,
      accommodation_id: jobData.accommodationId,
      template_id: jobData.templateId,
      status: 'queued',
      processing_mode: jobData.processingMode,
      dedup_key: jobData.dedupKey,
      created_at: new Date().toISOString()
    })

  if (error) {
    console.error('[VIDEO_WORKER] 작업 DB 초기화 실패:', error)
  }

  // 자산 정보도 저장
  if (jobData.assets.length > 0) {
    const assetInserts = jobData.assets.map(asset => ({
      job_id: jobData.jobId,
      slot_key: asset.slotKey,
      file_url: asset.imageUrl,
      filename: asset.originalFilename,
      is_safe: true // 기본값, 나중에 모더레이션 추가
    }))

    await supabase.from('video_job_assets').insert(assetInserts)
  }
}

/**
 * 작업 상태 업데이트
 */
async function updateJobStatus(jobId: string, status: string, step?: string): Promise<void> {
  const supabase = createClient()

  const updateData: any = {
    status,
    step,
    updated_at: new Date().toISOString()
  }

  if (status === 'generating_clips') {
    updateData.started_at = new Date().toISOString()
  } else if (status === 'delivered' || status === 'failed') {
    updateData.completed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('video_jobs')
    .update(updateData)
    .eq('id', jobId)

  if (error) {
    console.error('[VIDEO_WORKER] 상태 업데이트 실패:', error)
  }
}

/**
 * 작업 완료 처리
 */
async function finalizeJobInDB(
  jobId: string,
  result: {
    storagePath: string
    signedUrl: string
    duration: number
    fileSize: number
  }
): Promise<void> {
  const supabase = createClient()

  // video_renders 테이블에 결과 저장
  const { error } = await supabase
    .from('video_renders')
    .insert({
      job_id: jobId,
      final_path: result.storagePath,
      final_url: result.signedUrl,
      duration_sec: result.duration,
      size_mb: result.fileSize / (1024 * 1024),
      delivered_at: new Date().toISOString(),
      signed_url_expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() // 72시간 후
    })

  if (error) {
    console.error('[VIDEO_WORKER] 결과 저장 실패:', error)
  }
}

/**
 * 완료 알림 발송
 */
async function sendVideoReadyNotification(
  jobData: VideoJobData,
  signedUrl: string,
  storagePath: string
): Promise<void> {
  try {
    // 호스트 정보 조회
    const supabase = createClient()
    const { data: host } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', jobData.hostId)
      .single()

    if (!host?.email) {
      console.warn('[VIDEO_WORKER] 호스트 이메일을 찾을 수 없습니다')
      return
    }

    // 이메일 발송
    await sendVideoReadyEmail({
      toEmail: host.email,
      hostName: host.name || '호스트',
      videoUrl: signedUrl,
      dashboardUrl: `${process.env.APP_URL}/host/videos/${jobData.jobId}`,
      accommodationName: jobData.templateVars.accommodation_type || '숙소'
    })

    console.log(`[VIDEO_WORKER] 완료 알림 발송: ${host.email}`)

  } catch (error) {
    console.error('[VIDEO_WORKER] 알림 발송 실패:', error)
  }
}