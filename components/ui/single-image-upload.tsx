'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, X, ImageIcon } from 'lucide-react'
import { browserSB } from '@/lib/supabase/client'

interface SingleImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onError?: (error: string) => void
  bucket?: string
  folder?: string
  maxSizeMB?: number
  accept?: string
  className?: string
  label?: string
}

export function SingleImageUpload({ 
  value, 
  onChange, 
  onError,
  bucket = 'hero-slides',
  folder = '',
  maxSizeMB = 10,
  accept = 'image/*',
  className = '',
  label = '이미지'
}: SingleImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 크기 체크
    if (file.size > maxSizeMB * 1024 * 1024) {
      onError?.(`파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`)
      return
    }

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      onError?.('이미지 파일만 업로드 가능합니다.')
      return
    }

    try {
      setUploading(true)
      
      // 파일명 생성 (timestamp + 원본 확장자)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = folder ? `${folder}/${fileName}` : fileName

      // Supabase Storage에 업로드
      const supabase = browserSB()
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        onError?.(error.message || '파일 업로드에 실패했습니다.')
        return
      }

      // 공개 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      onChange(publicUrl)

    } catch (error) {
      console.error('Upload error:', error)
      onError?.('파일 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = async () => {
    if (value && value.includes(bucket)) {
      try {
        // URL에서 파일 경로 추출
        const url = new URL(value)
        const pathSegments = url.pathname.split('/')
        const bucketIndex = pathSegments.findIndex(segment => segment === bucket)
        const filePath = pathSegments.slice(bucketIndex + 1).join('/')
        
        // Storage에서 파일 삭제
        const supabase = browserSB()
        await supabase.storage.from(bucket).remove([filePath])
      } catch (error) {
        console.error('Delete error:', error)
      }
    }
    
    onChange('')
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Label>{label}</Label>
      
      {/* 미리보기 */}
      {value && (
        <div className="relative inline-block">
          <img 
            src={value} 
            alt="Preview" 
            className="w-full max-w-xs h-32 object-cover rounded-lg border border-gray-200"
          />
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="absolute top-2 right-2 w-6 h-6 p-0"
            onClick={handleRemove}
            disabled={uploading}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* 업로드 버튼 */}
      {!value && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            autoComplete="off"
          />
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-600 mb-4">
            클릭하여 이미지를 업로드하세요
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? '업로드 중...' : '이미지 선택'}
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            최대 {maxSizeMB}MB, JPG, PNG, WebP 형식
          </p>
        </div>
      )}
    </div>
  )
}