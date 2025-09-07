'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    kakao: any
  }
}

interface KakaoMapProps {
  latitude: number
  longitude: number
  level?: number
  width?: string
  height?: string
  className?: string
  showMarker?: boolean
  markerTitle?: string
  onClick?: (map: any, mouseEvent: any) => void
}

export default function KakaoMap({
  latitude,
  longitude,
  level = 3,
  width = '100%',
  height = '200px',
  className = '',
  showMarker = true,
  markerTitle,
  onClick
}: KakaoMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const marker = useRef<any>(null)

  useEffect(() => {
    if (map.current) {
      console.log('⚡ 지도가 이미 초기화됨, 건너뜀')
      return
    }

    const waitForKakaoAndInit = () => {
      // 카카오 객체와 지도 라이브러리가 모두 로드될 때까지 대기
      if (!window.kakao || !window.kakao.maps || !window.kakao.maps.LatLng) {
        setTimeout(waitForKakaoAndInit, 100)
        return
      }

      initializeMap()
    }

    const initializeMap = () => {
      if (!mapContainer.current) {
        console.log('❌ 지도 컨테이너가 없음')
        return
      }

      try {
        console.log('🗺️ 지도 초기화 시작:', latitude, longitude)

        const options = {
          center: new window.kakao.maps.LatLng(latitude, longitude),
          level: level
        }

        // 지도 생성
        map.current = new window.kakao.maps.Map(mapContainer.current, options)
        console.log('✅ 지도 생성 완료')

        // 마커 생성
        if (showMarker) {
          const markerPosition = new window.kakao.maps.LatLng(latitude, longitude)
          marker.current = new window.kakao.maps.Marker({
            position: markerPosition,
            title: markerTitle
          })
          marker.current.setMap(map.current)
          console.log('✅ 마커 생성 완료')

          // 마커 클릭 이벤트
          if (markerTitle) {
            const infowindow = new window.kakao.maps.InfoWindow({
              content: `<div style="padding:5px;font-size:12px;">${markerTitle}</div>`
            })

            window.kakao.maps.event.addListener(marker.current, 'click', () => {
              infowindow.open(map.current, marker.current)
            })
          }
        }

        // 지도 클릭 이벤트
        if (onClick) {
          window.kakao.maps.event.addListener(map.current, 'click', onClick)
        }
      } catch (error) {
        console.error('❌ 지도 초기화 에러:', error)
        // 에러 발생 시 재시도
        setTimeout(waitForKakaoAndInit, 500)
      }
    }

    waitForKakaoAndInit()
  }, []) // 의존성 배열을 빈 배열로 유지

  // 좌표나 레벨이 변경되면 지도 업데이트
  useEffect(() => {
    if (map.current && window.kakao) {
      const newCenter = new window.kakao.maps.LatLng(latitude, longitude)
      map.current.setCenter(newCenter)
      map.current.setLevel(level)

      if (marker.current) {
        marker.current.setPosition(newCenter)
      }
    }
  }, [latitude, longitude, level])

  return (
    <div 
      ref={mapContainer}
      style={{ width, height }}
      className={className}
    />
  )
}