'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import Header from '@/components/header'

export default function UpdateImagesPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const updateImages = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/accommodations/update-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '이미지 업데이트에 실패했습니다.')
        return
      }

      setResult(data)
    } catch (err) {
      console.error('이미지 업데이트 오류:', err)
      setError('서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">이미지 업데이트 관리</h1>
          <p className="text-gray-800 font-medium">구공스테이 청주점의 이미지를 업데이트합니다.</p>
        </div>

        <div className="grid gap-6">
          {/* 업데이트 실행 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black font-bold">
                구공스테이 청주점 이미지 업데이트
                <Badge variant="secondary" className="bg-gray-200 text-black">90staycj 폴더</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">업데이트될 이미지 목록:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  {Array.from({length: 10}, (_, i) => (
                    <li key={i}>• /images/90staycj/{i + 1}.jpg</li>
                  ))}
                </ul>
              </div>

              <Button 
                onClick={updateImages} 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />
                    <span className="text-white">업데이트 중...</span>
                  </>
                ) : (
                  <span className="text-white">이미지 업데이트 실행</span>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 결과 표시 */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900 mb-1">오류 발생</h4>
                    <p className="text-red-800">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {result && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900 mb-2">업데이트 완료</h4>
                    <p className="text-green-800 mb-3">{result.message}</p>
                    
                    {result.data && (
                      <div className="bg-white p-3 rounded border">
                        <h5 className="font-medium text-gray-900 mb-2">업데이트된 숙소 정보:</h5>
                        <div className="text-sm text-gray-700 space-y-1">
                          <p><strong>ID:</strong> {result.data.id}</p>
                          <p><strong>이름:</strong> {result.data.name}</p>
                          <p><strong>이미지 개수:</strong> {result.data.images?.length || 0}개</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 참고 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">참고 정보</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 space-y-2">
              <p>• 이 기능은 구공스테이 청주점의 이미지를 /public/images/90staycj/ 폴더의 이미지들로 업데이트합니다.</p>
              <p>• 총 10장의 이미지가 설정되며, 첫 번째 이미지가 메인 이미지로 사용됩니다.</p>
              <p>• 업데이트 후 상세 페이지에서 이미지 확인이 가능합니다.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}