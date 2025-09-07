'use client'

import { useEffect } from 'react'

interface KakaoMapScriptProps {
  onLoad?: () => void
}

export default function KakaoMapScript({ onLoad }: KakaoMapScriptProps) {
  const kakaoMapKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY

  useEffect(() => {
    if (!kakaoMapKey) {
      console.warn('NEXT_PUBLIC_KAKAO_MAP_KEY가 설정되지 않았습니다.')
      return
    }

    // 이미 로드된 경우
    if (window.kakao && window.kakao.maps) {
      console.log('✅ 카카오맵 이미 로드됨')
      if (onLoad) onLoad()
      return
    }

    // 스크립트 태그가 이미 있는지 확인
    const existingScript = document.querySelector(`script[src*="dapi.kakao.com"]`)
    if (existingScript) {
      console.log('⏳ 카카오맵 스크립트 로딩 중...')
      return
    }

    // 새 스크립트 태그 생성
    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapKey}&libraries=services,clusterer,drawing`
    script.async = true
    
    script.onload = () => {
      console.log('✅ 카카오맵 SDK 로드 완료')
      if (onLoad) onLoad()
    }
    
    script.onerror = () => {
      console.error('❌ 카카오맵 SDK 로드 실패')
    }

    document.head.appendChild(script)

    return () => {
      // cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [kakaoMapKey, onLoad])

  return null
}