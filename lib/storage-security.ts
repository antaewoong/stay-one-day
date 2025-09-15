/**
 * 스토리지 보안 관리 유틸리티
 * P1-3: 스토리지 링크 정책 완성의 일부
 */

import { createClient } from '@/lib/supabase/client'

interface StorageSecurityConfig {
  bucket: string
  maxFileSize: number // bytes
  allowedMimeTypes: string[]
  pathTemplate: string // 파일 경로 템플릿
  requireAuth: boolean
  ownerOnly: boolean
}

// 버킷별 보안 설정
export const STORAGE_CONFIGS: Record<string, StorageSecurityConfig> = {
  'accommodation-images': {
    bucket: 'accommodation-images',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    pathTemplate: '{accommodation_id}/{filename}',
    requireAuth: true,
    ownerOnly: true
  },
  'video-assets': {
    bucket: 'video-assets',
    maxFileSize: 20 * 1024 * 1024, // 20MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    pathTemplate: '{host_id}/jobs/{job_id}/{filename}',
    requireAuth: true,
    ownerOnly: true
  },
  'video-renders': {
    bucket: 'video-renders',
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: ['video/mp4', 'video/webm'],
    pathTemplate: '{host_id}/renders/{job_id}/{filename}',
    requireAuth: true,
    ownerOnly: true
  },
  'hero-slides': {
    bucket: 'hero-slides',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    pathTemplate: 'slides/{filename}',
    requireAuth: true,
    ownerOnly: false // 관리자만 접근
  }
}

export interface SecureUploadOptions {
  bucket: string
  file: File
  path: string
  metadata?: Record<string, any>
  hostId?: string
  accommodationId?: string
}

export interface SecureUploadResult {
  success: boolean
  path?: string
  publicUrl?: string
  error?: string
  errorCode?: string
}

/**
 * 보안 파일 업로드
 */
export async function secureUpload(options: SecureUploadOptions): Promise<SecureUploadResult> {
  const { bucket, file, path, metadata = {}, hostId, accommodationId } = options

  try {
    const config = STORAGE_CONFIGS[bucket]
    if (!config) {
      return {
        success: false,
        error: '지원되지 않는 버킷입니다',
        errorCode: 'INVALID_BUCKET'
      }
    }

    // 1. 파일 크기 검증
    if (file.size > config.maxFileSize) {
      return {
        success: false,
        error: `파일 크기가 너무 큽니다. 최대 ${config.maxFileSize / 1024 / 1024}MB`,
        errorCode: 'FILE_TOO_LARGE'
      }
    }

    // 2. MIME 타입 검증
    if (!config.allowedMimeTypes.includes(file.type)) {
      return {
        success: false,
        error: '지원되지 않는 파일 형식입니다',
        errorCode: 'INVALID_MIME_TYPE'
      }
    }

    // 3. 경로 보안 검증
    const securityResult = validateUploadPath(bucket, path, hostId, accommodationId)
    if (!securityResult.isValid) {
      return {
        success: false,
        error: securityResult.error || '경로 검증 실패',
        errorCode: 'INVALID_PATH'
      }
    }

    // 4. Supabase 업로드
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        metadata
      })

    if (error) {
      console.error(`[STORAGE] 업로드 실패 (${bucket}):`, error)
      return {
        success: false,
        error: '파일 업로드에 실패했습니다',
        errorCode: 'UPLOAD_FAILED'
      }
    }

    // 5. 공개 URL 생성 (공개 버킷인 경우)
    let publicUrl: string | undefined
    if (bucket === 'accommodation-images' || bucket === 'hero-slides') {
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)
      publicUrl = urlData.publicUrl
    }

    console.log(`[STORAGE] 업로드 성공: ${bucket}/${path}`)
    return {
      success: true,
      path: data.path,
      publicUrl
    }

  } catch (error) {
    console.error(`[STORAGE] 업로드 오류 (${bucket}):`, error)
    return {
      success: false,
      error: '파일 업로드 중 오류가 발생했습니다',
      errorCode: 'UNEXPECTED_ERROR'
    }
  }
}

/**
 * 업로드 경로 보안 검증
 */
function validateUploadPath(
  bucket: string,
  path: string,
  hostId?: string,
  accommodationId?: string
): { isValid: boolean, error?: string } {
  try {
    // 경로 트래버설 공격 방지
    if (path.includes('..') || path.includes('//') || path.startsWith('/')) {
      return {
        isValid: false,
        error: '잘못된 파일 경로입니다'
      }
    }

    const pathSegments = path.split('/')

    switch (bucket) {
      case 'accommodation-images':
        // accommodation-images/{accommodation_id}/{filename}
        if (!accommodationId || pathSegments[0] !== accommodationId) {
          return {
            isValid: false,
            error: '숙소 ID와 경로가 일치하지 않습니다'
          }
        }
        break

      case 'video-assets':
        // video-assets/{host_id}/jobs/{job_id}/{filename}
        if (!hostId || pathSegments[0] !== hostId) {
          return {
            isValid: false,
            error: '호스트 ID와 경로가 일치하지 않습니다'
          }
        }
        if (pathSegments[1] !== 'jobs') {
          return {
            isValid: false,
            error: '잘못된 비디오 에셋 경로입니다'
          }
        }
        break

      case 'video-renders':
        // video-renders/{host_id}/renders/{job_id}/{filename}
        if (!hostId || pathSegments[0] !== hostId) {
          return {
            isValid: false,
            error: '호스트 ID와 경로가 일치하지 않습니다'
          }
        }
        if (pathSegments[1] !== 'renders') {
          return {
            isValid: false,
            error: '잘못된 비디오 렌더 경로입니다'
          }
        }
        break

      case 'hero-slides':
        // hero-slides/slides/{filename} (관리자만)
        if (pathSegments[0] !== 'slides') {
          return {
            isValid: false,
            error: '잘못된 히어로 슬라이드 경로입니다'
          }
        }
        break

      default:
        return {
          isValid: false,
          error: '알 수 없는 버킷입니다'
        }
    }

    return { isValid: true }

  } catch (error) {
    return {
      isValid: false,
      error: '경로 검증 중 오류가 발생했습니다'
    }
  }
}

/**
 * 보안 파일 삭제
 */
export async function secureDelete(
  bucket: string,
  path: string,
  hostId?: string
): Promise<{ success: boolean, error?: string }> {
  try {
    // 경로 보안 검증
    const pathValidation = validateUploadPath(bucket, path, hostId)
    if (!pathValidation.isValid) {
      return {
        success: false,
        error: pathValidation.error
      }
    }

    const supabase = createClient()
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      console.error(`[STORAGE] 삭제 실패 (${bucket}):`, error)
      return {
        success: false,
        error: '파일 삭제에 실패했습니다'
      }
    }

    console.log(`[STORAGE] 삭제 성공: ${bucket}/${path}`)
    return { success: true }

  } catch (error) {
    console.error(`[STORAGE] 삭제 오류 (${bucket}):`, error)
    return {
      success: false,
      error: '파일 삭제 중 오류가 발생했습니다'
    }
  }
}

/**
 * 서명된 URL 생성 (비공개 파일용)
 */
export async function createSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<{ success: boolean, signedUrl?: string, error?: string }> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) {
      return {
        success: false,
        error: '서명된 URL 생성에 실패했습니다'
      }
    }

    return {
      success: true,
      signedUrl: data.signedUrl
    }

  } catch (error) {
    return {
      success: false,
      error: '서명된 URL 생성 중 오류가 발생했습니다'
    }
  }
}

/**
 * 만료된 파일 정리 (클라이언트에서 호출용)
 */
export async function requestCleanup(bucket: string): Promise<{ success: boolean, error?: string }> {
  try {
    const response = await fetch('/api/storage/cleanup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ bucket })
    })

    const result = await response.json()
    return result

  } catch (error) {
    return {
      success: false,
      error: '정리 요청 중 오류가 발생했습니다'
    }
  }
}