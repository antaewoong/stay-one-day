'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { setupSampleData, resetDatabase } from '@/lib/supabase/setup'
import { getAccommodations } from '@/lib/supabase/accommodations'

export default function DevSetupPage() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [data, setData] = useState<any>(null)

  const handleSetupData = async () => {
    setLoading(true)
    setStatus('샘플 데이터 생성 중...')
    
    try {
      const result = await setupSampleData()
      if (result.success) {
        setStatus('✅ 샘플 데이터 생성 완료!')
      } else {
        setStatus('❌ 샘플 데이터 생성 실패: ' + result.error)
      }
    } catch (error) {
      setStatus('❌ 오류: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const handleResetData = async () => {
    setLoading(true)
    setStatus('데이터베이스 초기화 중...')
    
    try {
      const result = await resetDatabase()
      if (result.success) {
        setStatus('✅ 데이터베이스 초기화 완료!')
      } else {
        setStatus('❌ 데이터베이스 초기화 실패: ' + result.error)
      }
    } catch (error) {
      setStatus('❌ 오류: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const handleTestQuery = async () => {
    setLoading(true)
    setStatus('데이터 조회 테스트 중...')
    
    try {
      const result = await getAccommodations({ limit: 10 })
      setData(result)
      setStatus(`✅ 데이터 조회 완료! ${result.data.length}개 숙소 발견`)
    } catch (error) {
      setStatus('❌ 데이터 조회 실패: ' + error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Stay One Day - 개발 설정
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>데이터베이스 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Supabase 데이터베이스에 샘플 데이터를 생성하거나 초기화합니다.
              </p>
              
              <div className="space-y-2">
                <Button 
                  onClick={handleSetupData}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? '처리 중...' : '샘플 데이터 생성'}
                </Button>
                
                <Button 
                  onClick={handleResetData}
                  disabled={loading}
                  variant="destructive"
                  className="w-full"
                >
                  {loading ? '처리 중...' : '데이터베이스 초기화'}
                </Button>
                
                <Button 
                  onClick={handleTestQuery}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? '처리 중...' : '데이터 조회 테스트'}
                </Button>
              </div>
              
              {status && (
                <div className="p-4 bg-gray-100 rounded-lg">
                  <p className="text-sm font-mono">{status}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>조회 결과</CardTitle>
            </CardHeader>
            <CardContent>
              {data ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    총 {data.total}개 중 {data.data.length}개 표시
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {data.data.map((accommodation: any) => (
                      <div key={accommodation.id} className="p-3 bg-white rounded border">
                        <h4 className="font-semibold">{accommodation.name}</h4>
                        <p className="text-sm text-gray-600">{accommodation.region}</p>
                        <p className="text-sm text-blue-600">₩{accommodation.base_price.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">데이터 조회 테스트를 실행해주세요.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>사용 방법</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>먼저 Supabase 대시보드에서 테이블이 생성되어 있는지 확인하세요.</li>
              <li>"샘플 데이터 생성" 버튼을 클릭하여 초기 데이터를 생성합니다.</li>
              <li>"데이터 조회 테스트" 버튼으로 데이터가 올바르게 생성되었는지 확인합니다.</li>
              <li>문제가 있으면 "데이터베이스 초기화" 후 다시 생성해보세요.</li>
              <li>설정 완료 후 <a href="/spaces" className="text-blue-600 hover:underline">/spaces 페이지</a>에서 결과를 확인하세요.</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}