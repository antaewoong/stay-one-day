/**
 * Supabase Storage를 통한 비디오 파일 관리
 * 업로드 + 서명 URL 생성 + 90일 후 자동 삭제
 */

import { createClient } from '@/lib/supabase/server'
import { promises as fs } from 'fs'

interface VideoUploadRequest {
  jobId: string
  accommodationId: string
  localFilePath: string
  metadata: {
    duration: number
    fileSize: number
    resolution: string
  }
}

interface VideoUploadResult {
  success: boolean
  storagePath?: string
  publicUrl?: string
  error?: string
}

/**
 * 완성된 비디오를 Supabase Storage에 업로드
 */
export async function uploadVideoToStorage(request: VideoUploadRequest): Promise<VideoUploadResult> {
  const { jobId, accommodationId, localFilePath, metadata } = request

  try {
    console.log(`[STORAGE] 업로드 시작: ${localFilePath}`)

    // 파일 읽기
    const fileBuffer = await fs.readFile(localFilePath)
    const fileSizeBytes = fileBuffer.length

    // 스토리지 경로 생성 (날짜별 폴더 구조)
    const uploadDate = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const storagePath = `video-renders/${uploadDate}/${accommodationId}/${jobId}.mp4`

    // Supabase Storage 업로드
    const supabase = createClient()

    const { data, error } = await supabase.storage
      .from('private') // private 버킷 사용
      .upload(storagePath, fileBuffer, {
        contentType: 'video/mp4',
        cacheControl: '3600', // 1시간 캐시
        upsert: true, // 덮어쓰기 허용
        metadata: {
          jobId,
          accommodationId,
          duration: metadata.duration.toString(),
          resolution: metadata.resolution,
          uploadedAt: new Date().toISOString(),
          autoDeleteAfter: '90days'
        }
      })

    if (error) {
      console.error('[STORAGE] 업로드 실패:', error)
      return {
        success: false,
        error: `Storage 업로드 실패: ${error.message}`
      }
    }

    console.log(`[STORAGE] 업로드 완료: ${storagePath}, ${(fileSizeBytes / 1024 / 1024).toFixed(2)}MB`)

    // 로컬 파일 정리
    try {
      await fs.unlink(localFilePath)
      console.log(`[STORAGE] 로컬 파일 정리: ${localFilePath}`)
    } catch (unlinkError) {
      console.warn(`[STORAGE] 로컬 파일 정리 실패: ${unlinkError}`)
    }

    return {
      success: true,
      storagePath: data.path,
      publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/private/${data.path}`
    }

  } catch (error) {
    console.error('[STORAGE] 업로드 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 업로드 오류'
    }
  }
}

/**
 * 비디오 파일에 대한 서명 URL 생성
 */
export async function createSignedVideoUrl(
  storagePath: string,
  expiresInSeconds: number = 72 * 60 * 60 // 기본 72시간
): Promise<string | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.storage
      .from('private')
      .createSignedUrl(storagePath, expiresInSeconds)

    if (error) {
      console.error('[STORAGE] 서명 URL 생성 실패:', error)
      return null
    }

    console.log(`[STORAGE] 서명 URL 생성: ${storagePath}, 만료: ${expiresInSeconds}초`)

    return data.signedUrl

  } catch (error) {
    console.error('[STORAGE] 서명 URL 생성 오류:', error)
    return null
  }
}

/**
 * 만료된 서명 URL 재생성
 */
export async function refreshSignedUrl(
  jobId: string,
  expiresInSeconds: number = 72 * 60 * 60
): Promise<{
  success: boolean
  signedUrl?: string
  expiresAt?: string
  error?: string
}> {
  try {
    const supabase = createClient()

    // DB에서 스토리지 경로 조회
    const { data: render, error: renderError } = await supabase
      .from('video_renders')
      .select('final_path')
      .eq('job_id', jobId)
      .single()

    if (renderError || !render) {
      return {
        success: false,
        error: '비디오 렌더 정보를 찾을 수 없습니다'
      }
    }

    // 새 서명 URL 생성
    const signedUrl = await createSignedVideoUrl(render.final_path, expiresInSeconds)

    if (!signedUrl) {
      return {
        success: false,
        error: '서명 URL 생성에 실패했습니다'
      }
    }

    // DB 업데이트
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString()

    const { error: updateError } = await supabase
      .from('video_renders')
      .update({
        final_url: signedUrl,
        signed_url_expires_at: expiresAt
      })
      .eq('job_id', jobId)

    if (updateError) {
      console.warn('[STORAGE] DB 업데이트 실패:', updateError)
    }

    return {
      success: true,
      signedUrl,
      expiresAt
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}

/**
 * 호스트별 비디오 목록 조회 (페이지네이션)
 */
export async function getHostVideos(
  hostId: string,
  options: {
    page?: number
    limit?: number
    includeExpired?: boolean
  } = {}
): Promise<{
  success: boolean
  videos?: Array<{
    id: string
    jobId: string
    accommodationName: string
    templateName: string
    duration: number
    fileSize: number
    createdAt: string
    signedUrl?: string
    isExpired: boolean
    canRefresh: boolean
  }>
  pagination?: {
    page: number
    limit: number
    total: number
    hasNext: boolean
  }
  error?: string
}> {
  try {
    const { page = 1, limit = 10, includeExpired = false } = options
    const offset = (page - 1) * limit

    const supabase = createClient()

    // 기본 쿼리
    let query = supabase
      .from('video_renders')
      .select(`
        id,
        job_id,
        final_url,
        duration_sec,
        size_mb,
        delivered_at,
        signed_url_expires_at,
        video_jobs!inner(
          host_id,
          accommodation_id,
          template_id,
          accommodations!inner(name),
          video_templates!inner(name)
        )
      `)
      .eq('video_jobs.host_id', hostId)
      .not('delivered_at', 'is', null) // 배달된 것만
      .order('delivered_at', { ascending: false })

    // 만료된 것 제외 (옵션)
    if (!includeExpired) {
      query = query.gte('signed_url_expires_at', new Date().toISOString())
    }

    // 페이지네이션 적용
    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .limit(limit)

    if (error) {
      console.error('[STORAGE] 비디오 목록 조회 실패:', error)
      return {
        success: false,
        error: '비디오 목록을 불러올 수 없습니다'
      }
    }

    // 데이터 변환
    const videos = (data || []).map(item => {
      const isExpired = new Date() > new Date(item.signed_url_expires_at || 0)

      return {
        id: item.id,
        jobId: item.job_id,
        accommodationName: (item.video_jobs as any).accommodations.name,
        templateName: (item.video_jobs as any).video_templates.name,
        duration: item.duration_sec,
        fileSize: Math.round(item.size_mb * 1024 * 1024), // bytes로 변환
        createdAt: item.delivered_at,
        signedUrl: isExpired ? undefined : item.final_url,
        isExpired,
        canRefresh: !isExpired || (Date.now() - new Date(item.delivered_at).getTime() < 90 * 24 * 60 * 60 * 1000) // 90일 이내
      }
    })

    return {
      success: true,
      videos,
      pagination: {
        page,
        limit,
        total: count || 0,
        hasNext: (count || 0) > offset + limit
      }
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}

/**
 * 자동 삭제 대상 파일 목록 조회 (90일 이후)
 */
export async function getExpiredVideosForCleanup(): Promise<{
  success: boolean
  expiredPaths?: string[]
  count?: number
  error?: string
}> {
  try {
    const supabase = createClient()
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('video_renders')
      .select('final_path')
      .lt('auto_delete_at', cutoffDate)
      .not('final_path', 'is', null)

    if (error) {
      return {
        success: false,
        error: '만료된 비디오 목록 조회 실패'
      }
    }

    const expiredPaths = data?.map(item => item.final_path).filter(Boolean) || []

    return {
      success: true,
      expiredPaths,
      count: expiredPaths.length
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}

/**
 * 만료된 파일 일괄 삭제 (크론잡용)
 */
export async function cleanupExpiredVideos(): Promise<{
  success: boolean
  deletedCount?: number
  errors?: string[]
}> {
  try {
    const expiredResult = await getExpiredVideosForCleanup()

    if (!expiredResult.success || !expiredResult.expiredPaths?.length) {
      return {
        success: true,
        deletedCount: 0,
        errors: []
      }
    }

    const supabase = createClient()
    const errors: string[] = []
    let deletedCount = 0

    // 배치 삭제
    for (const path of expiredResult.expiredPaths) {
      try {
        const { error } = await supabase.storage
          .from('private')
          .remove([path])

        if (error) {
          errors.push(`${path}: ${error.message}`)
        } else {
          deletedCount++
        }
      } catch (err) {
        errors.push(`${path}: ${err}`)
      }
    }

    // DB에서도 레코드 삭제
    if (deletedCount > 0) {
      await supabase
        .from('video_renders')
        .delete()
        .in('final_path', expiredResult.expiredPaths.slice(0, deletedCount))
    }

    console.log(`[STORAGE] 자동 정리 완료: ${deletedCount}개 삭제, ${errors.length}개 실패`)

    return {
      success: errors.length === 0,
      deletedCount,
      errors
    }

  } catch (error) {
    return {
      success: false,
      deletedCount: 0,
      errors: [error instanceof Error ? error.message : '알 수 없는 오류']
    }
  }
}

/**
 * 스토리지 사용량 통계
 */
export async function getStorageStats(): Promise<{
  totalFiles: number
  totalSizeMB: number
  expiredFiles: number
  activeFiles: number
}> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('video_renders')
      .select('size_mb, auto_delete_at')
      .not('final_path', 'is', null)

    if (error) {
      console.error('[STORAGE] 통계 조회 실패:', error)
      return { totalFiles: 0, totalSizeMB: 0, expiredFiles: 0, activeFiles: 0 }
    }

    const now = new Date()
    const stats = data?.reduce(
      (acc, item) => {
        acc.totalFiles++
        acc.totalSizeMB += item.size_mb || 0

        if (new Date(item.auto_delete_at || 0) < now) {
          acc.expiredFiles++
        } else {
          acc.activeFiles++
        }

        return acc
      },
      { totalFiles: 0, totalSizeMB: 0, expiredFiles: 0, activeFiles: 0 }
    ) || { totalFiles: 0, totalSizeMB: 0, expiredFiles: 0, activeFiles: 0 }

    return stats

  } catch (error) {
    console.error('[STORAGE] 통계 계산 오류:', error)
    return { totalFiles: 0, totalSizeMB: 0, expiredFiles: 0, activeFiles: 0 }
  }
}