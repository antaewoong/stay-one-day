'use client'

import { useEffect } from 'react'
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals'

interface VitalsMetric {
  name: string
  value: number
  id: string
  delta: number
}

function sendToAnalytics(metric: VitalsMetric) {
  // 개발 환경에서는 콘솔에 로그
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 [${metric.name}]:`, {
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
      rating: getVitalRating(metric.name, metric.value)
    })
  }

  // 실제 환경에서는 분석 서비스로 전송
  // Google Analytics, Mixpanel, 등으로 전송 가능
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      custom_parameter_1: metric.value,
      custom_parameter_2: metric.id,
      custom_parameter_3: metric.delta
    })
  }
}

function getVitalRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  switch (name) {
    case 'CLS':
      return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor'
    case 'INP':
      return value <= 200 ? 'good' : value <= 500 ? 'needs-improvement' : 'poor'
    case 'FCP':
      return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor'
    case 'LCP':
      return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor'
    case 'TTFB':
      return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor'
    default:
      return 'good'
  }
}

export default function PerformanceMonitor() {
  useEffect(() => {
    // Core Web Vitals 측정
    onCLS(sendToAnalytics)
    onINP(sendToAnalytics)
    onFCP(sendToAnalytics)
    onLCP(sendToAnalytics)
    onTTFB(sendToAnalytics)

    // 추가적인 성능 측정
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Navigation Timing API를 사용한 로딩 시간 측정
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart
        const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
        const firstByte = navigation.responseStart - navigation.requestStart
        
        console.log('📈 추가 성능 메트릭:', {
          pageLoadTime: `${loadTime}ms`,
          domContentLoaded: `${domContentLoaded}ms`,
          timeToFirstByte: `${firstByte}ms`
        })
      }

      // Resource Timing API를 사용한 리소스 로딩 시간 측정
      const resources = performance.getEntriesByType('resource')
      const slowResources = resources.filter((resource: PerformanceEntry) => {
        return resource.duration > 1000 // 1초 이상 걸린 리소스
      })

      if (slowResources.length > 0) {
        console.warn('⚠️ 느린 리소스 감지:', slowResources.map(r => ({
          name: r.name,
          duration: `${Math.round(r.duration)}ms`
        })))
      }

      // Memory API (Chrome만 지원)
      if ('memory' in performance) {
        const memory = (performance as any).memory
        console.log('💾 메모리 사용량:', {
          used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
          total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
          limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`
        })
      }
    }

    // 네트워크 정보 (지원되는 브라우저에서만)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      console.log('🌐 네트워크 정보:', {
        effectiveType: connection.effectiveType,
        downlink: `${connection.downlink}Mbps`,
        rtt: `${connection.rtt}ms`
      })
    }

  }, [])

  // 개발 환경에서만 성능 모니터링 컴포넌트 표시
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/80 text-white text-xs p-2 rounded max-w-xs">
      <div className="font-bold mb-1">🚀 성능 모니터링</div>
      <div>콘솔에서 상세 메트릭을 확인하세요</div>
    </div>
  )
}

// 글로벌 타입 확장
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}