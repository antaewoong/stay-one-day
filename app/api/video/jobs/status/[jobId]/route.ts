/**
 * 비디오 작업 상태 조회 API
 * 특정 작업의 진행 상황과 결과 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface JobParams {
  jobId: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: JobParams }
) {
  try {
    const { jobId } = params

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: '작업 ID가 필요합니다'
        },
        { status: 400 }
      )
    }

    console.log(`[VIDEO_STATUS] 상태 조회: ${jobId}`)

    const supabase = createClient()

    // 작업 정보 조회
    const { data: job, error: jobError } = await supabase
      .from('video_jobs')
      .select(`
        id,
        status,
        host_id,
        accommodation_id,
        template_id,
        created_at,
        updated_at,
        estimated_completion,
        retry_count,
        max_retries,
        error_message,
        dedup_key,
        runway_task_id,
        accommodations(name),
        video_renders(
          id,
          runway_task_id,
          status,
          video_url,
          failure_reason
        ),
        video_job_assets(
          id,
          filename,
          slot,
          storage_path,
          selected_for_generation
        )
      `)
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        {
          success: false,
          error: '작업을 찾을 수 없습니다',
          details: jobError?.message || '존재하지 않는 작업 ID'
        },
        { status: 404 }
      )
    }

    // 진행률 계산
    const progressInfo = calculateProgress(job)

    // 응답 구성
    const response = {
      success: true,
      job: {
        id: job.id,
        status: job.status,
        accommodationName: job.accommodations?.name || '알 수 없음',
        templateId: job.template_id,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
        estimatedCompletion: job.estimated_completion,
        progress: progressInfo,
        assets: {
          total: job.video_job_assets?.length || 0,
          selected: job.video_job_assets?.filter((a: any) => a.selected_for_generation).length || 0,
          assets: job.video_job_assets?.map((asset: any) => ({
            filename: asset.filename,
            slot: asset.slot,
            selected: asset.selected_for_generation
          })) || []
        },
        renders: job.video_renders?.map((render: any) => ({
          id: render.id,
          runwayTaskId: render.runway_task_id,
          status: render.status,
          videoUrl: render.video_url,
          failureReason: render.failure_reason
        })) || []
      }
    }

    // 오류가 있는 경우 오류 정보 추가
    if (job.status === 'failed' && job.error_message) {
      response.job = {
        ...response.job,
        error: {
          message: job.error_message,
          retryCount: job.retry_count,
          maxRetries: job.max_retries,
          canRetry: job.retry_count < job.max_retries
        }
      } as any
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('[VIDEO_STATUS] 조회 오류:', error)

    return NextResponse.json(
      {
        success: false,
        error: '작업 상태 조회 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}

// 작업 취소 API
export async function DELETE(
  request: NextRequest,
  { params }: { params: JobParams }
) {
  try {
    const { jobId } = params

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: '작업 ID가 필요합니다'
        },
        { status: 400 }
      )
    }

    console.log(`[VIDEO_CANCEL] 작업 취소: ${jobId}`)

    const supabase = createClient()

    // 작업 상태 확인
    const { data: job, error: jobError } = await supabase
      .from('video_jobs')
      .select('id, status, runway_task_id')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        {
          success: false,
          error: '작업을 찾을 수 없습니다'
        },
        { status: 404 }
      )
    }

    // 취소 가능한 상태 확인
    const cancellableStatuses = ['queued', 'validating', 'generating_clips']
    if (!cancellableStatuses.includes(job.status)) {
      return NextResponse.json(
        {
          success: false,
          error: '현재 상태에서는 취소할 수 없습니다',
          currentStatus: job.status,
          cancellableStatuses
        },
        { status: 400 }
      )
    }

    // 작업 상태를 cancelled로 변경
    const { error: updateError } = await supabase
      .from('video_jobs')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
        error_message: '사용자에 의해 취소됨'
      })
      .eq('id', jobId)

    if (updateError) {
      throw new Error(`작업 취소 실패: ${updateError.message}`)
    }

    // Runway 작업이 있는 경우 취소 시도 (선택사항)
    if (job.runway_task_id) {
      try {
        // TODO: Runway API 취소 호출
        console.log(`[VIDEO_CANCEL] Runway 작업 취소 시도: ${job.runway_task_id}`)
      } catch (runwayError) {
        console.warn('[VIDEO_CANCEL] Runway 작업 취소 실패:', runwayError)
        // Runway 취소 실패해도 로컬 작업은 취소됨
      }
    }

    return NextResponse.json({
      success: true,
      message: '작업이 취소되었습니다',
      jobId,
      cancelledAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('[VIDEO_CANCEL] 취소 오류:', error)

    return NextResponse.json(
      {
        success: false,
        error: '작업 취소 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}

// 진행률 계산 함수
function calculateProgress(job: any) {
  const status = job.status
  const progressMap: Record<string, { percentage: number; message: string }> = {
    'queued': { percentage: 0, message: '대기 중' },
    'validating': { percentage: 10, message: '이미지 검증 중' },
    'generating_clips': { percentage: 30, message: 'AI 영상 생성 중' },
    'stitching': { percentage: 70, message: '영상 편집 중' },
    'uploading': { percentage: 85, message: '업로드 중' },
    'delivered': { percentage: 100, message: '완료 - 이메일 발송됨' },
    'failed': { percentage: 0, message: '실패' },
    'cancelled': { percentage: 0, message: '취소됨' }
  }

  const progress = progressMap[status] || { percentage: 0, message: '알 수 없음' }

  // 렌더링 상태에서 세부 진행률 계산
  if (status === 'generating_clips' && job.video_renders?.length > 0) {
    const totalRenders = job.video_renders.length
    const completedRenders = job.video_renders.filter((r: any) => r.status === 'SUCCESS').length
    const failedRenders = job.video_renders.filter((r: any) => r.status === 'FAILED').length

    if (totalRenders > 0) {
      const renderProgress = (completedRenders / totalRenders) * 40 // 30-70% 구간
      progress.percentage = 30 + renderProgress
      progress.message = `AI 영상 생성 중 (${completedRenders}/${totalRenders})`

      if (failedRenders > 0) {
        progress.message += ` - ${failedRenders}개 실패`
      }
    }
  }

  return progress
}