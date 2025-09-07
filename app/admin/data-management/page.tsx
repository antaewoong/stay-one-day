'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, AlertCircle, Database, Upload } from 'lucide-react'
import Header from '@/components/header'

interface ActionResult {
  success: boolean
  message: string
  data?: any
}

export default function DataManagementPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, ActionResult>>({})

  const executeAction = async (action: string, endpoint: string) => {
    setLoading(action)
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      const result: ActionResult = {
        success: response.ok,
        message: data.message || data.error || '작업이 완료되었습니다.',
        data: data.data
      }

      setResults(prev => ({ ...prev, [action]: result }))

    } catch (err) {
      console.error(`${action} 실행 오류:`, err)
      setResults(prev => ({ 
        ...prev, 
        [action]: { 
          success: false, 
          message: '서버 오류가 발생했습니다.' 
        }
      }))
    } finally {
      setLoading(null)
    }
  }

  const ActionCard = ({ 
    title, 
    description, 
    actionKey, 
    endpoint, 
    icon: Icon,
    variant = 'default'
  }: {
    title: string
    description: string
    actionKey: string
    endpoint: string
    icon: any
    variant?: 'default' | 'primary' | 'secondary'
  }) => {
    const result = results[actionKey]
    const isLoading = loading === actionKey

    return (
      <Card className="relative">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            <Icon className="w-5 h-5" />
            {title}
            {result && (
              <Badge 
                variant={result.success ? "default" : "destructive"}
                className={result.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
              >
                {result.success ? "성공" : "실패"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700 leading-relaxed">{description}</p>
          
          <Button 
            onClick={() => executeAction(actionKey, endpoint)}
            disabled={isLoading}
            className={`w-full font-semibold ${
              variant === 'primary' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : variant === 'secondary'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-800 hover:bg-gray-900 text-white'
            }`}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                실행 중...
              </>
            ) : (
              <>
                <Icon className="w-4 h-4 mr-2" />
                {title} 실행
              </>
            )}
          </Button>

          {result && (
            <div className={`p-4 rounded-lg border ${
              result.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className={`font-medium mb-1 ${
                    result.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {result.success ? '작업 완료' : '작업 실패'}
                  </p>
                  <p className={`text-sm ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.message}
                  </p>
                  
                  {result.data && (
                    <div className="mt-3 p-3 bg-white rounded border">
                      <p className="text-sm font-medium text-gray-900 mb-2">결과 데이터:</p>
                      <div className="text-xs text-gray-700 space-y-1">
                        {result.data.accommodationsCount && (
                          <div>숙소 개수: {result.data.accommodationsCount}</div>
                        )}
                        {result.data.hostId && (
                          <div>호스트 ID: {result.data.hostId}</div>
                        )}
                        {result.data.totalCommands && (
                          <div>
                            실행된 명령: {result.data.successCount}/{result.data.totalCommands}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">데이터베이스 관리</h1>
          <p className="text-gray-800 font-medium">
            개발 및 테스트를 위한 데이터베이스 스키마 및 샘플 데이터 관리
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 스키마 수정 */}
          <ActionCard
            title="데이터베이스 스키마 수정"
            description="API와 데이터베이스 스키마 간의 불일치를 해결합니다. 필요한 컬럼을 추가하고 인덱스를 생성하여 최적화합니다."
            actionKey="fix-schema"
            endpoint="/api/admin/fix-schema"
            icon={Database}
            variant="primary"
          />

          {/* 샘플 데이터 추가 */}
          <ActionCard
            title="샘플 숙소 데이터 추가"
            description="테스트용 샘플 숙소 데이터를 데이터베이스에 추가합니다. 다양한 타입의 숙소와 실제 이미지가 포함됩니다."
            actionKey="seed-data"
            endpoint="/api/admin/seed-data"
            icon={Upload}
            variant="secondary"
          />

          {/* 청주 이미지 업데이트 */}
          <ActionCard
            title="청주 숙소 이미지 업데이트"
            description="구공스테이 청주점의 실제 이미지를 업데이트합니다. 총 10장의 고품질 이미지가 적용됩니다."
            actionKey="update-images"
            endpoint="/api/accommodations/update-images"
            icon={Upload}
          />

          {/* 실제 데이터 삽입 */}
          <ActionCard
            title="실제 숙소 데이터 삽입"
            description="실제 운영을 위한 숙소 데이터를 삽입합니다. 검증된 숙소 정보와 올바른 가격 정보가 포함됩니다."
            actionKey="insert-real"
            endpoint="/api/insert-real-data"
            icon={Database}
          />
        </div>

        {/* 작업 결과 요약 */}
        {Object.keys(results).length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-black">작업 결과 요약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Object.entries(results).map(([key, result]) => (
                  <div 
                    key={key}
                    className={`p-4 rounded-lg border ${
                      result.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {result.success ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${
                        result.success ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {key}
                      </span>
                    </div>
                    <p className={`text-xs ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.success ? '완료' : '실패'}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 주의사항 */}
        <Card className="mt-8 border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-900 mb-2">주의사항</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• 스키마 수정은 먼저 실행하세요 (한 번만 실행)</li>
                  <li>• 샘플 데이터 추가는 개발/테스트 환경에서만 사용하세요</li>
                  <li>• 프로덕션 환경에서는 실제 데이터만 사용하세요</li>
                  <li>• 작업 실패 시 에러 메시지를 확인하고 다시 시도하세요</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}