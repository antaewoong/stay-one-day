'use client'

import { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Upload,
  X,
  Star,
  Image as ImageIcon,
  AlertCircle,
  Check,
  Loader2
} from 'lucide-react'
import {
  validateImageFiles,
  formatFileSize,
  getAcceptedFileTypes,
  getFilesFromDropEvent,
  DEFAULT_IMAGE_CONFIG,
  type ImageUploadConfig,
  type UploadProgress
} from '@/lib/utils/image-upload'

interface ImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  mainImageIndex?: number
  onMainImageChange?: (index: number) => void
  config?: ImageUploadConfig
  disabled?: boolean
}

export function ImageUpload({
  images,
  onChange,
  mainImageIndex = 0,
  onMainImageChange,
  config = DEFAULT_IMAGE_CONFIG,
  disabled = false
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 파일 업로드 처리
  const handleFileUpload = useCallback(async (files: File[]) => {
    if (disabled) return

    setErrors([])
    
    // 기존 이미지 개수 + 새 파일 개수가 제한을 초과하는지 확인
    if (images.length + files.length > config.maxFiles) {
      setErrors([`최대 ${config.maxFiles}장까지만 업로드할 수 있습니다. (현재: ${images.length}장)`])
      return
    }

    const validation = validateImageFiles(files, config)
    
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    // 업로드 진행률 초기화
    const initialProgress: UploadProgress[] = validation.validFiles.map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'pending'
    }))
    setUploadProgress(initialProgress)

    try {
      const newImageUrls: string[] = []

      for (let i = 0; i < validation.validFiles.length; i++) {
        const file = validation.validFiles[i]
        
        // 업로드 상태 업데이트
        setUploadProgress(prev => 
          prev.map((item, index) => 
            index === i 
              ? { ...item, status: 'uploading', progress: 50 }
              : item
          )
        )

        // 실제 업로드 로직 (Supabase Storage 등)
        // 여기서는 임시로 Object URL 사용
        const imageUrl = URL.createObjectURL(file)
        newImageUrls.push(imageUrl)

        // 완료 상태 업데이트
        setUploadProgress(prev => 
          prev.map((item, index) => 
            index === i 
              ? { ...item, status: 'completed', progress: 100 }
              : item
          )
        )

        // 0.5초 대기 (시연용)
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // 새 이미지들을 기존 이미지 배열에 추가
      onChange([...images, ...newImageUrls])
      
      // 업로드 진행률 초기화
      setTimeout(() => setUploadProgress([]), 2000)

    } catch (error) {
      setErrors(['업로드 중 오류가 발생했습니다.'])
      setUploadProgress(prev => 
        prev.map(item => ({ ...item, status: 'error', error: '업로드 실패' }))
      )
    }
  }, [images, onChange, config, disabled])

  // 드래그 앤 드롭 이벤트 핸들러
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = getFilesFromDropEvent(e.nativeEvent)
    handleFileUpload(files)
  }, [handleFileUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  // 파일 선택 핸들러
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFileUpload(files)
    
    // input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFileUpload])

  // 이미지 삭제
  const handleImageRemove = useCallback((index: number) => {
    if (disabled) return
    
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
    
    // 메인 이미지 인덱스 조정
    if (onMainImageChange) {
      if (index === mainImageIndex && newImages.length > 0) {
        onMainImageChange(0) // 첫 번째 이미지를 메인으로
      } else if (index < mainImageIndex) {
        onMainImageChange(mainImageIndex - 1) // 인덱스 조정
      } else if (mainImageIndex >= newImages.length) {
        onMainImageChange(Math.max(0, newImages.length - 1))
      }
    }
  }, [images, onChange, mainImageIndex, onMainImageChange, disabled])

  // 메인 이미지 설정
  const handleSetMainImage = useCallback((index: number) => {
    if (disabled || !onMainImageChange) return
    onMainImageChange(index)
  }, [onMainImageChange, disabled])

  return (
    <div className="space-y-4">
      {/* 업로드 영역 */}
      <Card 
        className={`transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : ''} ${disabled ? 'opacity-50' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Upload className="w-6 h-6 text-gray-500" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">이미지 업로드</h3>
              <p className="text-gray-600 text-sm mb-2">
                드래그 & 드롭하거나 클릭하여 이미지를 업로드하세요
              </p>
              <p className="text-gray-500 text-xs">
                최대 {config.maxFiles}장, 각 파일 최대 {formatFileSize(config.maxFileSize)}
              </p>
              <p className="text-gray-500 text-xs">
                지원 형식: JPG, PNG, WebP
              </p>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              파일 선택
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={getAcceptedFileTypes(config)}
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* 업로드 진행률 */}
      {uploadProgress.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">업로드 중...</h4>
            <div className="space-y-2">
              {uploadProgress.map((progress, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="truncate">{progress.fileName}</span>
                      <span className="text-gray-500">{progress.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all ${
                          progress.status === 'completed' ? 'bg-green-500' :
                          progress.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                  </div>
                  {progress.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin" />}
                  {progress.status === 'completed' && <Check className="w-4 h-4 text-green-500" />}
                  {progress.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 오류 메시지 */}
      {errors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800 mb-2">업로드 오류</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 업로드된 이미지 목록 */}
      {images.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">업로드된 이미지 ({images.length}/{config.maxFiles})</h4>
              {onMainImageChange && (
                <p className="text-sm text-gray-600">
                  별표(⭐) 표시된 이미지가 메인 이미지로 표시됩니다
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <div className="relative aspect-square rounded-lg overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={`업로드된 이미지 ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    
                    {/* 메인 이미지 표시 */}
                    {index === mainImageIndex && onMainImageChange && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="default" className="bg-yellow-500 text-white">
                          <Star className="w-3 h-3 mr-1" />
                          메인
                        </Badge>
                      </div>
                    )}

                    {/* 호버 시 컨트롤 */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100">
                      {onMainImageChange && index !== mainImageIndex && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSetMainImage(index)}
                          disabled={disabled}
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => handleImageRemove(index)}
                        disabled={disabled}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    이미지 {index + 1}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}