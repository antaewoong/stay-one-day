'use client'

import { useState, useEffect } from 'react'
import KakaoMap from '@/components/KakaoMap'

export default function MapTestPage() {
  const [kakaoLoaded, setKakaoLoaded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    
    // 카카오맵 스크립트 직접 로드
    const loadKakaoScript = () => {
      console.log('📍 카카오맵 스크립트 로딩 시작')
      
      // 이미 로드된 경우
      if (window.kakao && window.kakao.maps && window.kakao.maps.LatLng) {
        setKakaoLoaded(true)
        console.log('✅ 카카오맵 이미 로드됨')
        return
      }

      // 이미 스크립트가 있는지 확인
      const existingScript = document.querySelector('script[src*="dapi.kakao.com"]')
      if (existingScript) {
        console.log('⏳ 카카오맵 스크립트 이미 있음, 로딩 대기...')
        
        // 기존 스크립트 로딩 완료 대기
        const waitForExistingScript = () => {
          if (window.kakao && window.kakao.maps && window.kakao.maps.load) {
            console.log('✅ 기존 SDK 감지, 라이브러리 로딩...')
            window.kakao.maps.load(() => {
              console.log('✅ 기존 스크립트 라이브러리 로드 완료')
              setKakaoLoaded(true)
            })
          } else if (window.kakao && window.kakao.maps && window.kakao.maps.LatLng) {
            console.log('✅ 기존 스크립트 이미 완료')
            setKakaoLoaded(true)
          } else {
            setTimeout(waitForExistingScript, 100)
          }
        }
        
        waitForExistingScript()
        
        return
      }

      console.log('🔄 새 카카오맵 스크립트 생성 중...')
      const script = document.createElement('script')
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services,clusterer,drawing&autoload=false`
      script.async = true
      
      script.onload = () => {
        console.log('✅ 카카오맵 SDK 로드 완료')
        
        // autoload=false이므로 수동으로 지도 라이브러리 로드
        if (window.kakao && window.kakao.maps && window.kakao.maps.load) {
          window.kakao.maps.load(() => {
            console.log('✅ 카카오맵 라이브러리 로드 완료')
            setKakaoLoaded(true)
          })
        } else {
          // fallback: SDK가 즉시 사용 가능한 경우
          setTimeout(() => {
            if (window.kakao && window.kakao.maps && window.kakao.maps.LatLng) {
              console.log('✅ 카카오맵 라이브러리 사용 가능')
              setKakaoLoaded(true)
            }
          }, 100)
        }
      }
      
      script.onerror = () => {
        console.error('❌ 카카오맵 스크립트 로드 실패')
      }

      document.head.appendChild(script)
    }

    loadKakaoScript()
  }, [])

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">카카오맵 테스트</h1>
        
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">API 상태</h2>
            <div className="space-y-2">
              <p>카카오맵 키: {process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ? '✅ 설정됨' : '❌ 없음'}</p>
              {isMounted && (
                <>
                  <p>카카오맵 API: {kakaoLoaded ? '✅ 로드됨' : '❌ 로드 안됨'}</p>
                  <p>Window.kakao: {typeof window !== 'undefined' && window.kakao ? '✅ 있음' : '❌ 없음'}</p>
                </>
              )}
              {!isMounted && (
                <>
                  <p>카카오맵 API: ⏳ 로딩 중...</p>
                  <p>Window.kakao: ⏳ 로딩 중...</p>
                </>
              )}
            </div>
          </div>

          {kakaoLoaded && (
            <>
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">테스트 지도 1 - 청주시청</h2>
                <div className="border rounded-lg overflow-hidden">
                  <KakaoMap
                    latitude={36.6424341}
                    longitude={127.4890319}
                    level={3}
                    height="300px"
                    showMarker={true}
                    markerTitle="청주시청"
                  />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">테스트 지도 2 - 세종시청</h2>
                <div className="border rounded-lg overflow-hidden">
                  <KakaoMap
                    latitude={36.4800984}
                    longitude={127.2889851}
                    level={3}
                    height="300px"
                    showMarker={true}
                    markerTitle="세종시청"
                  />
                </div>
              </div>
            </>
          )}

          {!kakaoLoaded && isMounted && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-yellow-800">⏳ 카카오맵을 로딩 중입니다...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}