'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { seedDatabase } from '@/lib/seed-data'
import { 
  Database,
  Play,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react'
import Header from '@/components/header'

export default function SeedPage() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSeedDatabase = async () => {
    setIsSeeding(true)
    setSeedResult(null)
    
    try {
      const result = await seedDatabase()
      setSeedResult(result)
    } catch (error) {
      setSeedResult({
        success: false,
        message: '데이터베이스 시드 중 예상치 못한 오류가 발생했습니다.'
      })
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              데이터베이스 시드 관리
            </h1>
            <p className="text-gray-600">
              Stay One Day 플랫폼의 테스트 데이터를 관리합니다
            </p>
          </div>

          {/* 시드 실행 카드 */}
          <Card className="border-0 shadow-lg mb-8">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">데이터베이스 시드 실행</CardTitle>
              <CardDescription>
                테스트용 숙소, 예약, 리뷰 데이터를 데이터베이스에 추가합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={handleSeedDatabase}
                disabled={isSeeding}
                size="lg"
                className="mb-6"
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    시드 실행 중...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    시드 실행하기
                  </>
                )}
              </Button>

              {seedResult && (
                <div className={`p-4 rounded-lg ${
                  seedResult.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center justify-center mb-2">
                    {seedResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                    )}
                    <span className={`font-medium ${
                      seedResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {seedResult.success ? '성공!' : '실패'}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    seedResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {seedResult.message}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 시드 데이터 정보 */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-bold text-blue-600">8</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">테스트 숙소</h3>
                <p className="text-sm text-gray-600">다양한 지역과 타입의 숙소 데이터</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-bold text-green-600">5</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">예약 데이터</h3>
                <p className="text-sm text-gray-600">다양한 상태의 예약 테스트 데이터</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-bold text-yellow-600">6</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">리뷰 데이터</h3>
                <p className="text-sm text-gray-600">실제와 같은 고객 리뷰 데이터</p>
              </CardContent>
            </Card>
          </div>

          {/* 포함된 데이터 상세 */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">포함된 테스트 데이터</CardTitle>
              <CardDescription>
                시드 실행 시 추가되는 데이터의 상세 내용입니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* 숙소 카테고리 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">숙소 카테고리</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    '프라이빗 독채형',
                    '물놀이 가능 풀빌라', 
                    '자연 속 완벽한 휴식',
                    '반려견 동반 가능',
                    '키즈 전용',
                    '배달음식 이용 편리'
                  ].map((category) => (
                    <Badge key={category} variant="secondary" className="bg-blue-100 text-blue-800">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 지역 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">포함 지역</h4>
                <div className="flex flex-wrap gap-2">
                  {['청주', '세종', '대전', '충북', '충남'].map((region) => (
                    <Badge key={region} variant="outline" className="border-green-200 text-green-800">
                      {region}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 편의시설 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">제공 편의시설</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Wi-Fi', '주차장', '에어컨', '주방', 'TV', 
                    '수영장', '바베큐 시설', '반려견 용품', '키즈 놀이터'
                  ].map((amenity) => (
                    <Badge key={amenity} variant="outline" className="border-purple-200 text-purple-800">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 주의사항 */}
          <Card className="border-0 shadow-md mt-8 bg-yellow-50 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 mb-2">주의사항</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• 기존 데이터와 중복될 수 있으니 개발 환경에서만 사용하세요</li>
                    <li>• 이미지는 Unsplash의 샘플 이미지를 사용합니다</li>
                    <li>• 실제 서비스 전에는 모든 테스트 데이터를 제거해야 합니다</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}