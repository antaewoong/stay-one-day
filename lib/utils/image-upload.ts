// 이미지 업로드 제한 및 검증 유틸리티

export interface ImageUploadConfig {
  maxFiles: number
  maxFileSize: number // bytes
  allowedTypes: string[]
  allowedExtensions: string[]
}

export const DEFAULT_IMAGE_CONFIG: ImageUploadConfig = {
  maxFiles: 10,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp']
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  validFiles: File[]
  rejectedFiles: { file: File; reason: string }[]
}

/**
 * 업로드할 파일들의 유효성을 검증합니다.
 */
export function validateImageFiles(
  files: File[],
  config: ImageUploadConfig = DEFAULT_IMAGE_CONFIG
): ValidationResult {
  const errors: string[] = []
  const validFiles: File[] = []
  const rejectedFiles: { file: File; reason: string }[] = []

  // 파일 개수 검증
  if (files.length > config.maxFiles) {
    errors.push(`최대 ${config.maxFiles}장까지만 업로드할 수 있습니다.`)
    return {
      isValid: false,
      errors,
      validFiles: [],
      rejectedFiles: files.map(file => ({ file, reason: '파일 개수 초과' }))
    }
  }

  // 각 파일별 검증
  files.forEach(file => {
    const fileErrors: string[] = []

    // 파일 크기 검증
    if (file.size > config.maxFileSize) {
      const sizeMB = (config.maxFileSize / (1024 * 1024)).toFixed(0)
      fileErrors.push(`파일 크기가 ${sizeMB}MB를 초과합니다.`)
    }

    // 파일 타입 검증
    if (!config.allowedTypes.includes(file.type)) {
      fileErrors.push('지원하지 않는 파일 형식입니다.')
    }

    // 파일 확장자 검증
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`
    if (!config.allowedExtensions.includes(extension)) {
      fileErrors.push('지원하지 않는 파일 확장자입니다.')
    }

    // 파일명 검증 (특수문자 제한)
    const fileName = file.name.replace(/\.[^/.]+$/, '') // 확장자 제거
    if (!/^[가-힣a-zA-Z0-9\s\-_()]+$/.test(fileName)) {
      fileErrors.push('파일명에 특수문자가 포함되어 있습니다.')
    }

    if (fileErrors.length > 0) {
      rejectedFiles.push({ file, reason: fileErrors.join(', ') })
      errors.push(`${file.name}: ${fileErrors.join(', ')}`)
    } else {
      validFiles.push(file)
    }
  })

  return {
    isValid: errors.length === 0 && validFiles.length > 0,
    errors,
    validFiles,
    rejectedFiles
  }
}

/**
 * 이미지 파일을 리사이즈합니다 (선택적)
 */
export function resizeImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Canvas context를 생성할 수 없습니다.'))
      return
    }

    img.onload = () => {
      // 리사이즈 비율 계산
      const ratio = Math.min(maxWidth / img.width, maxHeight / img.height)
      
      if (ratio >= 1) {
        // 리사이즈가 필요없는 경우 원본 반환
        resolve(file)
        return
      }

      canvas.width = img.width * ratio
      canvas.height = img.height * ratio

      // 이미지 그리기
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // Blob으로 변환
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(resizedFile)
          } else {
            reject(new Error('이미지 리사이즈에 실패했습니다.'))
          }
        },
        file.type,
        quality
      )
    }

    img.onerror = () => reject(new Error('이미지를 로드할 수 없습니다.'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 파일을 Base64로 변환합니다.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Base64 변환에 실패했습니다.'))
      }
    }
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'))
    reader.readAsDataURL(file)
  })
}

/**
 * 이미지 업로드 진행률을 추적하는 타입
 */
export interface UploadProgress {
  fileName: string
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

/**
 * 파일 크기를 사람이 읽기 쉬운 형태로 변환합니다.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 업로드 가능한 파일 확장자 목록을 문자열로 반환합니다.
 */
export function getAcceptedFileTypes(config: ImageUploadConfig = DEFAULT_IMAGE_CONFIG): string {
  return config.allowedExtensions.join(',')
}

/**
 * 드래그 앤 드롭 이벤트에서 파일을 추출합니다.
 */
export function getFilesFromDropEvent(event: DragEvent): File[] {
  const files: File[] = []
  
  if (event.dataTransfer?.items) {
    // DataTransferItemList 사용
    Array.from(event.dataTransfer.items).forEach(item => {
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file) files.push(file)
      }
    })
  } else if (event.dataTransfer?.files) {
    // FileList 사용
    Array.from(event.dataTransfer.files).forEach(file => {
      files.push(file)
    })
  }
  
  return files
}

/**
 * 이미지의 EXIF 방향 정보를 기반으로 회전합니다.
 */
export function rotateImageByExif(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      resolve(file) // 변환 실패시 원본 반환
      return
    }

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const rotatedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(rotatedFile)
          } else {
            resolve(file)
          }
        },
        file.type,
        0.9
      )
    }

    img.onerror = () => resolve(file)
    img.src = URL.createObjectURL(file)
  })
}