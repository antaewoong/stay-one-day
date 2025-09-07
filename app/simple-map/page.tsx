'use client'

import { useEffect, useRef } from 'react'

export default function SimpleMapPage() {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadScript = () => {
      // 이미 스크립트가 있는지 확인
      if (document.querySelector('script[src*="dapi.kakao.com"]')) {
        console.log('스크립트 이미 있음')
        waitForKakao()
        return
      }

      console.log('스크립트 로딩 시작')
      const script = document.createElement('script')
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=76833d9162b866642e1966b546729715&autoload=false`
      script.onload = () => {
        console.log('스크립트 로드 완료')
        waitForKakao()
      }
      script.onerror = () => {
        console.error('스크립트 로드 실패')
      }
      document.head.appendChild(script)
    }

    const waitForKakao = () => {
      if (window.kakao && window.kakao.maps && window.kakao.maps.load) {
        console.log('카카오 SDK 감지됨, 지도 라이브러리 로딩 중...')
        window.kakao.maps.load(() => {
          console.log('카카오 지도 라이브러리 로드 완료')
          initMap()
        })
      } else {
        console.log('카카오 SDK 대기 중...')
        setTimeout(waitForKakao, 100)
      }
    }

    const initMap = () => {
      if (!mapRef.current) {
        console.log('지도 컨테이너 없음')
        return
      }

      if (!window.kakao || !window.kakao.maps || !window.kakao.maps.LatLng) {
        console.log('카카오 라이브러리 미완성, 재시도 중...')
        setTimeout(initMap, 100)
        return
      }

      try {
        console.log('지도 생성 시작')
        console.log('LatLng 생성자 확인:', typeof window.kakao.maps.LatLng)
        
        const options = {
          center: new window.kakao.maps.LatLng(33.450701, 126.570667),
          level: 3
        }
        
        const map = new window.kakao.maps.Map(mapRef.current, options)
        console.log('✅ 지도 생성 완료!', map)
      } catch (error) {
        console.error('❌ 지도 생성 에러:', error)
        // 한 번 더 시도
        setTimeout(initMap, 500)
      }
    }

    loadScript()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">간단한 카카오맵 테스트</h1>
      <div 
        ref={mapRef}
        id="simple-map"
        style={{ width: '500px', height: '400px', border: '1px solid #ccc' }}
      />
    </div>
  )
}