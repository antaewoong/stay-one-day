'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Plus, Upload, Check, AlertCircle, Clock, Mail,
  Camera, Info, Star, AlertTriangle, ArrowLeft, Loader2
} from 'lucide-react'
import { useSupabase } from '@/components/providers/supabase-provider'

interface SlotSpec {
  key: string
  label: string
  count: number
  required: boolean
  hint?: string
  constraints?: {
    orientation?: 'portrait' | 'landscape' | 'square'
    min_px?: number
    max_size_mb?: number
  }
  alternatives?: string[]
  policy?: 'consent_required' | 'optional'
}

interface ArchetypeSpec {
  min_total: number
  max_total: number
  max_generate: number
  slots: SlotSpec[]
}

interface TemplateWithSlotSpec {
  id: string
  archetype: string
  name: string
  description: string
  estimated_duration: number
  slotSpec: ArchetypeSpec
  weekStart: string
  version: number
}

interface VideoJob {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  templateName: string
  accommodationName: string
  createdAt: string
  emailStatus: 'pending' | 'sent' | 'delivered' | 'failed'
}

interface UploadedSlot {
  slot: string
  files: File[]
}

export default function ContentStudioPage() {
  const { user } = useSupabase()

  // 주요 상태
  const [view, setView] = useState<'list' | 'create'>('list')
  const [loading, setLoading] = useState(true)

  // 데이터
  const [templates, setTemplates] = useState<TemplateWithSlotSpec[]>([])
  const [videoJobs, setVideoJobs] = useState<VideoJob[]>([])
  const [accommodationId, setAccommodationId] = useState<string>('')

  // 생성 프로세스
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateWithSlotSpec | null>(null)
  const [uploadedSlots, setUploadedSlots] = useState<UploadedSlot[]>([])
  const [consentGiven, setConsentGiven] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)

  // 초기화
  useEffect(() => {
    if (user) {
      fetchVideoJobs()
      // TODO: 실제 숙소 ID를 사용자 세션에서 가져오는 로직 필요
      setAccommodationId('mock-accommodation-id')
    }
  }, [user])

  useEffect(() => {
    if (accommodationId) {
      fetchActiveTemplates()
    }
  }, [accommodationId])

  // 실시간 검증
  useEffect(() => {
    if (selectedTemplate && uploadedSlots.length > 0) {
      validateCurrentUpload()
    }
  }, [selectedTemplate, uploadedSlots])

  // 데이터 페칭
  const fetchVideoJobs = async () => {
    try {
      // Mock data - 실제 API로 교체 예정
      const mockJobs: VideoJob[] = [
        {
          id: '1',
          status: 'completed',
          templateName: '에너지 몽타주',
          accommodationName: '가평 힐링 펜션',
          createdAt: '2024-01-15',
          emailStatus: 'delivered'
        },
        {
          id: '2',
          status: 'processing',
          templateName: '스토리 투어',
          accommodationName: '제주 오션뷰 빌라',
          createdAt: '2024-01-14',
          emailStatus: 'pending'
        }
      ]

      setVideoJobs(mockJobs)
    } catch (error) {
      console.error('영상 작업 목록 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchActiveTemplates = async () => {
    try {
      const response = await fetch(`/api/video/templates/active?accommodationId=${accommodationId}`)
      const data = await response.json()

      if (data.success) {
        setTemplates(data.templates || [])
      } else {
        console.error('템플릿 조회 실패:', data.error)
      }
    } catch (error) {
      console.error('템플릿 조회 실패:', error)
    }
  }

  // 파일 업로드 핸들러
  const handleFileUpload = (slotKey: string, files: FileList | null) => {
    if (!files || files.length === 0) return

    const newFiles = Array.from(files)

    // 파일 크기 및 형식 검증
    for (const file of newFiles) {
      if (file.size > 8 * 1024 * 1024) {
        alert(`${file.name}: 파일 크기는 8MB 이하여야 합니다.`)
        return
      }
      if (!file.type.startsWith('image/')) {
        alert(`${file.name}: 이미지 파일만 업로드 가능합니다.`)
        return
      }
    }

    setUploadedSlots(prev => {
      const existingSlot = prev.find(s => s.slot === slotKey)
      if (existingSlot) {
        return prev.map(s =>
          s.slot === slotKey
            ? { ...s, files: [...s.files, ...newFiles] }
            : s
        )
      } else {
        return [...prev, { slot: slotKey, files: newFiles }]
      }
    })
  }

  const removeFile = (slotKey: string, fileIndex: number) => {
    setUploadedSlots(prev =>
      prev.map(s =>
        s.slot === slotKey
          ? { ...s, files: s.files.filter((_, i) => i !== fileIndex) }
          : s
      ).filter(s => s.files.length > 0)
    )
  }

  // 실시간 검증
  const validateCurrentUpload = async () => {
    if (!selectedTemplate) return

    try {
      // 매니페스트 생성
      const manifest = uploadedSlots.flatMap(slot =>
        slot.files.map((file, index) => ({
          slot: slot.slot,
          file: `${slot.slot}_${index}.${file.name.split('.').pop()}`
        }))
      )

      // 이미지 메타데이터 생성
      const uploadedImages = await Promise.all(
        uploadedSlots.flatMap(slot =>
          slot.files.map(async (file, index) => {
            const imageData = await getImageDimensions(file)
            return {
              filename: `${slot.slot}_${index}.${file.name.split('.').pop()}`,
              slot: slot.slot,
              fileSize: file.size,
              width: imageData.width,
              height: imageData.height
            }
          })
        )
      )

      // 클라이언트 사이드 기본 검증
      const validation = performBasicValidation(selectedTemplate.slotSpec, manifest, uploadedImages)
      setValidationResult(validation)

    } catch (error) {
      console.error('검증 실패:', error)
    }
  }

  // 이미지 크기 가져오기
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.width, height: img.height })
      img.src = URL.createObjectURL(file)
    })
  }

  // 기본 검증 로직
  const performBasicValidation = (slotSpec: ArchetypeSpec, manifest: any[], uploadedImages: any[]) => {
    const errors: string[] = []
    const warnings: string[] = []

    // 필수 슬롯 검증
    const slotCounts: Record<string, number> = {}
    manifest.forEach(item => {
      slotCounts[item.slot] = (slotCounts[item.slot] || 0) + 1
    })

    const requiredSlots = slotSpec.slots.filter(s => s.required)
    const missingRequired = requiredSlots.filter(slot => !slotCounts[slot.key])

    if (missingRequired.length > 0) {
      errors.push(...missingRequired.map(slot => `필수 슬롯 누락: ${slot.label}`))
    }

    // 총 개수 검증
    if (manifest.length < slotSpec.min_total) {
      warnings.push(`최소 ${slotSpec.min_total}개 이미지 필요 (현재: ${manifest.length}개)`)
    }
    if (manifest.length > slotSpec.max_total) {
      warnings.push(`권장 최대 ${slotSpec.max_total}개 초과`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      requiredFulfilled: requiredSlots.length - missingRequired.length,
      requiredTotal: requiredSlots.length,
      totalUploaded: manifest.length,
      selectedForGeneration: Math.min(manifest.length, slotSpec.max_generate),
      costEstimate: {
        totalShots: Math.min(manifest.length, slotSpec.max_generate),
        estimatedCostUSD: Math.min(manifest.length, slotSpec.max_generate) * 1.25,
        processingTimeMinutes: Math.ceil(Math.min(manifest.length, slotSpec.max_generate) * 2.5)
      }
    }
  }

  // 제출 가능 여부
  const canSubmit = () => {
    if (!selectedTemplate || !validationResult) return false

    const needsConsent = selectedTemplate.slotSpec.slots.some(slot =>
      slot.policy === 'consent_required' &&
      uploadedSlots.some(u => u.slot === slot.key && u.files.length > 0)
    )

    return validationResult.isValid &&
           validationResult.totalUploaded >= selectedTemplate.slotSpec.min_total &&
           (!needsConsent || consentGiven)
  }

  // 제출 핸들러
  const handleSubmit = async () => {
    if (!canSubmit() || !selectedTemplate) return

    setSubmitting(true)
    try {
      // 매니페스트 생성
      const manifest = uploadedSlots.flatMap(slot =>
        slot.files.map((file, index) => ({
          slot: slot.slot,
          file: `${slot.slot}_${index}.${file.name.split('.').pop()}`
        }))
      )

      // FormData 생성
      const formData = new FormData()
      formData.append('accommodationId', accommodationId)
      formData.append('templateId', selectedTemplate.id)
      formData.append('manifest', JSON.stringify(manifest))

      // 파일들 추가
      uploadedSlots.forEach(slot => {
        slot.files.forEach(file => {
          formData.append('files', file)
        })
      })

      const response = await fetch('/api/video/jobs', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        alert('영상 제작 요청이 완료되었습니다! 완성되면 이메일로 알려드립니다.')

        // 초기화
        setView('list')
        setSelectedTemplate(null)
        setUploadedSlots([])
        setConsentGiven(false)
        setValidationResult(null)

        // 목록 새로고침
        fetchVideoJobs()
      } else {
        alert(`제작 요청 실패: ${result.error}`)
      }
    } catch (error) {
      console.error('제작 요청 실패:', error)
      alert('제작 요청 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  // 상태 표시 컴포넌트들
  const getStatusBadge = (status: VideoJob['status']) => {
    const statusConfig = {
      queued: { variant: 'secondary' as const, icon: Clock, text: '대기중' },
      processing: { variant: 'default' as const, icon: Upload, text: '생성중' },
      completed: { variant: 'default' as const, icon: Check, text: '완료' },
      failed: { variant: 'destructive' as const, icon: AlertCircle, text: '실패' }
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    )
  }

  const getEmailBadge = (emailStatus: VideoJob['emailStatus']) => {
    const emailConfig = {
      pending: { variant: 'secondary' as const, text: '준비중' },
      sent: { variant: 'default' as const, text: '발송됨' },
      delivered: { variant: 'default' as const, text: '전달됨' },
      failed: { variant: 'destructive' as const, text: '실패' }
    }

    const config = emailConfig[emailStatus]

    return (
      <Badge variant={config.variant} className="gap-1">
        <Mail className="w-3 h-3" />
        {config.text}
      </Badge>
    )
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 제작 뷰
  if (view === 'create' && selectedTemplate) {
    const needsConsent = selectedTemplate.slotSpec.slots.some(slot =>
      slot.policy === 'consent_required' &&
      uploadedSlots.some(u => u.slot === slot.key && u.files.length > 0)
    )

    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => setView('list')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{selectedTemplate.name}</h1>
            <p className="text-gray-600">{selectedTemplate.description}</p>
            <p className="text-sm text-blue-600 mt-1">
              주간 트렌드 팩 v{selectedTemplate.version} ({selectedTemplate.weekStart} 주차)
            </p>
          </div>
        </div>

        {/* 진행률 및 비용 예상 */}
        {validationResult && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* 진행률 */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold">업로드 진행률</h3>
                    <Badge variant={validationResult.isValid ? "default" : "secondary"}>
                      {validationResult.requiredFulfilled}/{validationResult.requiredTotal} 필수 완료
                    </Badge>
                  </div>
                  <Progress
                    value={validationResult.requiredTotal > 0
                      ? (validationResult.requiredFulfilled / validationResult.requiredTotal) * 100
                      : 0}
                    className="mb-3"
                  />
                  <div className="text-sm text-gray-600">
                    <p>총 업로드: {validationResult.totalUploaded}개</p>
                    <p>권장 범위: {selectedTemplate.slotSpec.min_total}~{selectedTemplate.slotSpec.max_total}개</p>
                  </div>
                </div>

                {/* 비용 예상 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">비용 및 시간 예상</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>생성할 샷 수:</span>
                      <span className="font-medium">{validationResult.selectedForGeneration}개</span>
                    </div>
                    <div className="flex justify-between">
                      <span>예상 비용:</span>
                      <span className="font-medium text-green-600">
                        ${validationResult.costEstimate.estimatedCostUSD.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>예상 시간:</span>
                      <span className="font-medium">{validationResult.costEstimate.processingTimeMinutes}분</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 경고 및 오류 */}
              {(validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
                <div className="mt-4 space-y-2">
                  {validationResult.errors.map((error: string, index: number) => (
                    <Alert key={`error-${index}`} variant="destructive">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ))}
                  {validationResult.warnings.map((warning: string, index: number) => (
                    <Alert key={`warning-${index}`}>
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>{warning}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 슬롯별 업로더 */}
        <div className="grid gap-6">
          {selectedTemplate.slotSpec.slots.map((slot) => {
            const uploadedFiles = uploadedSlots.find(u => u.slot === slot.key)?.files || []

            return (
              <Card key={slot.key}>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-lg">{slot.label}</CardTitle>
                    {slot.required && <Star className="w-4 h-4 text-red-500" />}
                    <Badge variant={slot.required ? "default" : "secondary"}>
                      {slot.required ? '필수' : '선택'} {slot.count}개
                    </Badge>
                    {uploadedFiles.length > 0 && (
                      <Badge variant="outline">
                        {uploadedFiles.length}개 업로드됨
                      </Badge>
                    )}
                  </div>

                  {slot.hint && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      {slot.hint}
                    </p>
                  )}

                  {slot.alternatives && (
                    <p className="text-xs text-blue-600">
                      💡 대체 가능: {slot.alternatives.join(', ')}
                    </p>
                  )}

                  {slot.constraints && (
                    <div className="text-xs text-gray-500 space-y-1">
                      {slot.constraints.orientation && (
                        <p>📐 권장 비율: {slot.constraints.orientation === 'portrait' ? '세로형' :
                          slot.constraints.orientation === 'landscape' ? '가로형' : '정사각형'}</p>
                      )}
                      {slot.constraints.min_px && (
                        <p>📏 최소 해상도: {slot.constraints.min_px}px</p>
                      )}
                      {slot.constraints.max_size_mb && (
                        <p>💾 최대 크기: {slot.constraints.max_size_mb}MB</p>
                      )}
                    </div>
                  )}
                </CardHeader>

                <CardContent>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      id={`upload-${slot.key}`}
                      onChange={(e) => handleFileUpload(slot.key, e.target.files)}
                    />
                    <Label
                      htmlFor={`upload-${slot.key}`}
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Camera className="w-8 h-8 text-gray-400" />
                      <span className="font-medium">사진 선택</span>
                      <span className="text-sm text-gray-500">
                        {slot.count}개 권장 • 여러 장 한번에 선택 가능
                      </span>
                    </Label>
                  </div>

                  {/* 업로드된 파일 미리보기 */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`${slot.label} ${index + 1}`}
                              className="w-full h-24 object-cover rounded border"
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute -top-2 -right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeFile(slot.key, index)}
                            >
                              ×
                            </Button>
                            <p className="text-xs text-center mt-1 text-gray-500 truncate">
                              {file.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* 동의 체크박스 */}
        {needsConsent && (
          <Card className="mt-6 border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent"
                  checked={consentGiven}
                  onCheckedChange={(checked) => setConsentGiven(!!checked)}
                />
                <div>
                  <Label htmlFor="consent" className="font-medium text-orange-900">
                    초상권 및 저작권 동의 (필수)
                  </Label>
                  <p className="text-sm text-orange-700 mt-1">
                    업로드한 사진에 포함된 사람의 초상권과 저작권에 대한
                    적절한 권한을 보유하고 있음을 확인합니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 제출 버튼 */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">
                  예상 제작 시간: {selectedTemplate.estimated_duration}분
                </p>
                <p className="text-sm text-gray-600">
                  완성되면 이메일로 다운로드 링크를 보내드립니다 (72시간 유효)
                </p>
              </div>
              <Button
                size="lg"
                disabled={!canSubmit() || submitting}
                onClick={handleSubmit}
                className="gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    제작 요청 중...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    영상 제작 요청
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 메인 뷰 (목록)
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">컨텐츠 스튜디오</h1>
          <p className="text-gray-600">AI 영상 제작 및 관리</p>
        </div>

        <Button
          className="gap-2"
          onClick={() => {
            if (templates.length > 0) {
              setSelectedTemplate(templates[0])
              setView('create')
            }
          }}
          disabled={templates.length === 0}
        >
          <Plus className="w-4 h-4" />
          새 영상 제작
        </Button>
      </div>

      {/* 이번 주 추천 템플릿 */}
      {templates.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🔥 이번 주 트렌드 템플릿</CardTitle>
            <p className="text-sm text-gray-600">
              소셜미디어 트렌드를 분석해 매주 자동 업데이트됩니다
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-200"
                  onClick={() => {
                    setSelectedTemplate(template)
                    setView('create')
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        v{template.version}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {template.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div>필수 슬롯: {template.slotSpec.slots.filter(s => s.required).length}개</div>
                      <div>예상 시간: {template.estimated_duration}분</div>
                      <div>최소 사진: {template.slotSpec.min_total}장</div>
                      <div>최대 생성: {template.slotSpec.max_generate}개</div>
                    </div>

                    <div className="mt-3 pt-3 border-t">
                      <Badge variant="secondary" className="text-xs">
                        {template.archetype} 스타일
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 기존 작업 목록 */}
      <div className="grid gap-6">
        {videoJobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Camera className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">첫 영상을 만들어보세요</h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                트렌드 분석 기반 템플릿으로 숙소 사진을 AI가 자동으로 마케팅 영상으로 제작합니다
              </p>
              <Button
                className="gap-2"
                onClick={() => {
                  if (templates.length > 0) {
                    setSelectedTemplate(templates[0])
                    setView('create')
                  }
                }}
                disabled={templates.length === 0}
              >
                <Plus className="w-4 h-4" />
                영상 제작 시작
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <h2 className="text-2xl font-bold">제작된 영상</h2>
            <div className="grid gap-4">
              {videoJobs.map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                          <div className="w-8 h-10 bg-gray-300 rounded-sm"></div>
                        </div>

                        <div>
                          <h3 className="font-semibold text-lg">{job.accommodationName}</h3>
                          <p className="text-gray-600 mb-2">{job.templateName}</p>
                          <p className="text-sm text-gray-500">
                            생성일: {new Date(job.createdAt).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 items-end">
                        {getStatusBadge(job.status)}
                        {getEmailBadge(job.emailStatus)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}