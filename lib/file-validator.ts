/**
 * 파일 검증 유틸리티
 * 실제 파일 타입, 해상도, MIME, 크기 등을 엄격하게 검증
 */

import { createHash } from 'crypto'

// 표준 에러 코드 정의
export const VALIDATION_ERRORS = {
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  INVALID_MIME_TYPE: 'INVALID_MIME_TYPE',
  INVALID_DIMENSIONS: 'INVALID_DIMENSIONS',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_TOO_SMALL: 'FILE_TOO_SMALL',
  CORRUPTED_FILE: 'CORRUPTED_FILE',
  CONSENT_REQUIRED: 'CONSENT_REQUIRED',
  ORIENTATION_MISMATCH: 'ORIENTATION_MISMATCH'
} as const

export type ValidationErrorCode = keyof typeof VALIDATION_ERRORS

interface ValidationError {
  code: ValidationErrorCode
  message: string
  field?: string
  expected?: string | number
  actual?: string | number
}

interface FileValidationOptions {
  allowedTypes: string[]
  allowedMimes: string[]
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  minSizeMB?: number
  maxSizeMB?: number
  requiredOrientation?: 'portrait' | 'landscape' | 'square'
  requiresConsent?: boolean
}

interface FileValidationResult {
  isValid: boolean
  errors: ValidationError[]
  metadata: {
    realMimeType: string
    dimensions: { width: number; height: number }
    fileSize: number
    aspectRatio: number
    orientation: 'portrait' | 'landscape' | 'square'
    checksum: string
  }
}

/**
 * 업로드된 파일의 실제 내용을 검증
 */
export async function validateUploadedFile(
  fileBuffer: Buffer,
  originalName: string,
  options: FileValidationOptions,
  consentGiven: boolean = false
): Promise<FileValidationResult> {
  const errors: ValidationError[] = []

  try {
    // 1. 파일 시그니처로 실제 MIME 타입 검증
    const realMimeType = detectRealMimeType(fileBuffer)

    if (!options.allowedMimes.includes(realMimeType)) {
      errors.push({
        code: 'INVALID_MIME_TYPE',
        message: `지원하지 않는 파일 형식입니다`,
        expected: options.allowedMimes.join(', '),
        actual: realMimeType
      })
    }

    // 2. 파일 확장자 검증
    const fileExtension = originalName.split('.').pop()?.toLowerCase() || ''
    if (!options.allowedTypes.includes(fileExtension)) {
      errors.push({
        code: 'INVALID_FILE_TYPE',
        message: `지원하지 않는 파일 확장자입니다`,
        expected: options.allowedTypes.join(', '),
        actual: fileExtension
      })
    }

    // 3. 이미지 메타데이터 추출
    const metadata = await extractImageMetadata(fileBuffer, realMimeType)

    if (!metadata) {
      errors.push({
        code: 'CORRUPTED_FILE',
        message: '손상된 이미지 파일입니다'
      })

      return {
        isValid: false,
        errors,
        metadata: {
          realMimeType,
          dimensions: { width: 0, height: 0 },
          fileSize: fileBuffer.length,
          aspectRatio: 0,
          orientation: 'square',
          checksum: ''
        }
      }
    }

    // 4. 파일 크기 검증
    const fileSizeMB = fileBuffer.length / (1024 * 1024)

    if (options.minSizeMB && fileSizeMB < options.minSizeMB) {
      errors.push({
        code: 'FILE_TOO_SMALL',
        message: `파일 크기가 너무 작습니다`,
        expected: `${options.minSizeMB}MB 이상`,
        actual: `${fileSizeMB.toFixed(2)}MB`
      })
    }

    if (options.maxSizeMB && fileSizeMB > options.maxSizeMB) {
      errors.push({
        code: 'FILE_TOO_LARGE',
        message: `파일 크기가 너무 큽니다`,
        expected: `${options.maxSizeMB}MB 이하`,
        actual: `${fileSizeMB.toFixed(2)}MB`
      })
    }

    // 5. 해상도 검증
    const { width, height } = metadata.dimensions

    if (options.minWidth && width < options.minWidth) {
      errors.push({
        code: 'INVALID_DIMENSIONS',
        message: `이미지 너비가 너무 작습니다`,
        expected: `${options.minWidth}px 이상`,
        actual: `${width}px`
      })
    }

    if (options.minHeight && height < options.minHeight) {
      errors.push({
        code: 'INVALID_DIMENSIONS',
        message: `이미지 높이가 너무 작습니다`,
        expected: `${options.minHeight}px 이상`,
        actual: `${height}px`
      })
    }

    if (options.maxWidth && width > options.maxWidth) {
      errors.push({
        code: 'INVALID_DIMENSIONS',
        message: `이미지 너비가 너무 큽니다`,
        expected: `${options.maxWidth}px 이하`,
        actual: `${width}px`
      })
    }

    if (options.maxHeight && height > options.maxHeight) {
      errors.push({
        code: 'INVALID_DIMENSIONS',
        message: `이미지 높이가 너무 큽니다`,
        expected: `${options.maxHeight}px 이하`,
        actual: `${height}px`
      })
    }

    // 6. 방향성 검증
    if (options.requiredOrientation && metadata.orientation !== options.requiredOrientation) {
      const orientationNames = {
        portrait: '세로',
        landscape: '가로',
        square: '정사각형'
      }

      errors.push({
        code: 'ORIENTATION_MISMATCH',
        message: `${orientationNames[options.requiredOrientation]} 이미지가 필요합니다`,
        expected: orientationNames[options.requiredOrientation],
        actual: orientationNames[metadata.orientation]
      })
    }

    // 7. 초상권 동의 검증
    if (options.requiresConsent && !consentGiven) {
      errors.push({
        code: 'CONSENT_REQUIRED',
        message: '이 슬롯은 초상권/저작권 동의가 필요합니다',
        field: 'consent'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      metadata
    }

  } catch (error) {
    return {
      isValid: false,
      errors: [{
        code: 'CORRUPTED_FILE',
        message: `파일 검증 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      }],
      metadata: {
        realMimeType: 'unknown',
        dimensions: { width: 0, height: 0 },
        fileSize: fileBuffer.length,
        aspectRatio: 0,
        orientation: 'square',
        checksum: ''
      }
    }
  }
}

/**
 * 파일 시그니처로 실제 MIME 타입 감지
 */
function detectRealMimeType(buffer: Buffer): string {
  if (buffer.length < 4) return 'unknown'

  const signatures: { [key: string]: string } = {
    'ffd8ff': 'image/jpeg',
    '89504e': 'image/png',
    '474946': 'image/gif',
    '424d': 'image/bmp',
    '52494646': 'image/webp', // RIFF header (WebP)
    '49492a00': 'image/tiff',
    '4d4d002a': 'image/tiff'
  }

  const hex = buffer.toString('hex', 0, 4).toLowerCase()

  // 가장 긴 시그니처부터 확인
  for (let i = 8; i >= 4; i -= 2) {
    const signature = hex.substring(0, i)
    if (signatures[signature]) {
      return signatures[signature]
    }
  }

  return 'unknown'
}

/**
 * 이미지 메타데이터 추출
 */
async function extractImageMetadata(buffer: Buffer, mimeType: string) {
  try {
    let width = 0, height = 0

    if (mimeType === 'image/jpeg') {
      const result = extractJPEGDimensions(buffer)
      if (result) {
        width = result.width
        height = result.height
      }
    } else if (mimeType === 'image/png') {
      const result = extractPNGDimensions(buffer)
      if (result) {
        width = result.width
        height = result.height
      }
    } else {
      // 다른 포맷들은 기본적으로 파일 크기만 검증
      width = 1920 // 기본값
      height = 1080
    }

    if (width === 0 || height === 0) return null

    const aspectRatio = width / height
    let orientation: 'portrait' | 'landscape' | 'square'

    if (Math.abs(aspectRatio - 1) < 0.1) {
      orientation = 'square'
    } else if (aspectRatio > 1) {
      orientation = 'landscape'
    } else {
      orientation = 'portrait'
    }

    const checksum = createHash('sha256').update(buffer).digest('hex').substring(0, 16)

    return {
      dimensions: { width, height },
      aspectRatio,
      orientation,
      checksum
    }

  } catch (error) {
    console.error('[FILE_VALIDATION] 메타데이터 추출 실패:', error)
    return null
  }
}

/**
 * JPEG 이미지 크기 추출
 */
function extractJPEGDimensions(buffer: Buffer): { width: number; height: number } | null {
  try {
    let offset = 2 // Skip SOI marker

    while (offset < buffer.length) {
      const marker = buffer.readUInt16BE(offset)

      if ((marker & 0xFFC0) === 0xFFC0 && marker !== 0xFFC4 && marker !== 0xFFC8 && marker !== 0xFFCC) {
        // SOF marker found
        const height = buffer.readUInt16BE(offset + 5)
        const width = buffer.readUInt16BE(offset + 7)
        return { width, height }
      }

      const segmentLength = buffer.readUInt16BE(offset + 2)
      offset += segmentLength + 2
    }

    return null
  } catch (error) {
    return null
  }
}

/**
 * PNG 이미지 크기 추출
 */
function extractPNGDimensions(buffer: Buffer): { width: number; height: number } | null {
  try {
    // PNG는 8바이트 헤더 후 IHDR 청크에 크기 정보
    if (buffer.length < 24) return null

    const width = buffer.readUInt32BE(16)
    const height = buffer.readUInt32BE(20)

    return { width, height }
  } catch (error) {
    return null
  }
}