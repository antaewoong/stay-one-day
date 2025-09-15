// 🎯 GA4 실제 구현 - stayoneday.co.kr 전용
'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-38W0M72LQ3'

// GA4 스크립트 컴포넌트
export function GoogleAnalytics() {
  // GA_MEASUREMENT_ID가 유효하지 않으면 렌더링하지 않음
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
        onLoad={() => {
          console.log('GA4 script loaded successfully')
        }}
        onError={(e) => {
          console.warn('GA4 script failed to load:', e)
        }}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        onLoad={() => {
          try {
            window.dataLayer = window.dataLayer || [];
            function gtag(...args: any[]) {
              window.dataLayer.push(args);
            }
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', GA_MEASUREMENT_ID, {
              anonymize_ip: true,
              send_page_view: false
            });
            console.log('GA4 initialized successfully');
          } catch (error) {
            console.warn('GA4 initialization failed:', error);
          }
        }}
      />
    </>
  )
}

// 페이지뷰 추적 훅
export function usePageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      // 페이지 URL 구성
      const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
      
      // GA4 페이지뷰 이벤트
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: url,
        page_title: document.title,
        page_location: `https://stayoneday.co.kr${url}`,
        content_group1: 'Stay One Day',
        content_group2: pathname.split('/')[1] || 'home',
        content_group3: pathname.split('/')[2] || '',
        // UTM 파라미터 자동 캡처
        campaign_source: searchParams.get('utm_source'),
        campaign_medium: searchParams.get('utm_medium'),
        campaign_name: searchParams.get('utm_campaign'),
        campaign_term: searchParams.get('utm_term'),
        campaign_content: searchParams.get('utm_content')
      })

      // 맞춤 페이지뷰 이벤트 (Stay One Day 전용)
      window.gtag('event', 'page_view_enhanced', {
        page_path: url,
        page_title: document.title,
        page_category: getPageCategory(pathname),
        user_engagement: 'active'
      })
    }
  }, [pathname, searchParams])
}

// Stay One Day 맞춤 이벤트 함수들
export const trackAccommodationView = (accommodationId: string, accommodationName: string, location: string, price: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    // GA4 향상된 전자상거래 - 상품 조회
    window.gtag('event', 'view_item', {
      currency: 'KRW',
      value: price,
      items: [{
        item_id: accommodationId,
        item_name: accommodationName,
        item_category: '숙소',
        item_category2: location,
        item_variant: 'standard',
        price: price,
        quantity: 1
      }]
    })

    // Stay One Day 맞춤 이벤트
    window.gtag('event', 'accommodation_view', {
      accommodation_id: accommodationId,
      accommodation_name: accommodationName,
      location: location,
      price: price,
      event_category: 'engagement',
      event_label: accommodationName
    })
  }
}

export const trackBookingStart = (accommodationId: string, accommodationName: string, checkInDate: string, checkOutDate: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    // GA4 전자상거래 - 체크아웃 시작
    window.gtag('event', 'begin_checkout', {
      currency: 'KRW',
      items: [{
        item_id: accommodationId,
        item_name: accommodationName,
        item_category: '숙소',
        quantity: 1
      }]
    })

    // Stay One Day 맞춤 이벤트
    window.gtag('event', 'booking_start', {
      accommodation_id: accommodationId,
      accommodation_name: accommodationName,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      event_category: 'ecommerce',
      event_label: 'booking_funnel_start'
    })
  }
}

export const trackBookingComplete = (reservationData: {
  reservationId: string
  accommodationId: string
  accommodationName: string
  totalAmount: number
  checkInDate: string
  checkOutDate: string
  guestCount: number
  location: string
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    const { reservationId, accommodationId, accommodationName, totalAmount, checkInDate, checkOutDate, guestCount, location } = reservationData

    // GA4 전자상거래 - 구매 완료
    window.gtag('event', 'purchase', {
      transaction_id: reservationId,
      currency: 'KRW',
      value: totalAmount,
      affiliation: 'Stay One Day',
      items: [{
        item_id: accommodationId,
        item_name: accommodationName,
        item_category: '숙소',
        item_category2: location,
        price: totalAmount,
        quantity: 1
      }]
    })

    // Stay One Day 맞춤 전환 이벤트
    window.gtag('event', 'booking_complete', {
      transaction_id: reservationId,
      accommodation_id: accommodationId,
      accommodation_name: accommodationName,
      total_amount: totalAmount,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      guest_count: guestCount,
      location: location,
      nights: calculateNights(checkInDate, checkOutDate),
      event_category: 'ecommerce',
      event_label: 'conversion_success',
      conversion_value: totalAmount
    })

    // 전환 목표 달성
    window.gtag('event', 'conversion', {
      send_to: `${GA_MEASUREMENT_ID}/booking_complete`,
      value: totalAmount,
      currency: 'KRW',
      transaction_id: reservationId
    })
  }
}

export const trackSearch = (searchQuery: string, location: string, checkIn: string, checkOut: string, results: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    // GA4 사이트 내 검색
    window.gtag('event', 'search', {
      search_term: searchQuery,
      search_results: results
    })

    // Stay One Day 맞춤 검색 이벤트
    window.gtag('event', 'accommodation_search', {
      search_query: searchQuery,
      search_location: location,
      check_in_date: checkIn,
      check_out_date: checkOut,
      results_count: results,
      event_category: 'engagement',
      event_label: 'search_accommodation'
    })
  }
}

export const trackUserEngagement = (engagementType: 'scroll' | 'click' | 'form_interaction', details: any) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'user_engagement', {
      engagement_time_msec: details.duration || 0,
      engagement_type: engagementType,
      page_title: document.title,
      page_location: window.location.href,
      event_category: 'engagement',
      event_label: engagementType,
      ...details
    })
  }
}

export const trackHostAction = (action: string, hostId: string, details: any = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'host_action', {
      action_type: action,
      host_id: hostId,
      event_category: 'host_engagement',
      event_label: action,
      ...details
    })
  }
}

export const trackMarketingCampaign = (campaignData: {
  source: string
  medium: string
  campaign: string
  content?: string
  term?: string
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'campaign_interaction', {
      campaign_source: campaignData.source,
      campaign_medium: campaignData.medium,
      campaign_name: campaignData.campaign,
      campaign_content: campaignData.content,
      campaign_term: campaignData.term,
      event_category: 'marketing',
      event_label: `${campaignData.source}_${campaignData.medium}`
    })
  }
}

// 유틸리티 함수들
function getPageCategory(pathname: string): string {
  const segments = pathname.split('/')
  
  if (segments[1] === 'admin') return 'admin'
  if (segments[1] === 'host') return 'host'
  if (segments[1] === 'accommodations') return 'accommodation_listing'
  if (segments[1] === 'search') return 'search_results'
  if (segments[1] === 'booking') return 'booking_process'
  if (segments[1] === 'about') return 'about'
  if (segments[1] === 'contact') return 'contact'
  
  return 'home'
}

function calculateNights(checkIn: string, checkOut: string): number {
  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)
  const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// 글로벌 gtag 타입 선언
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

// React 컴포넌트에서 사용할 수 있는 추적 훅
export function useGA4Tracking() {
  return {
    trackAccommodationView,
    trackBookingStart,
    trackBookingComplete,
    trackSearch,
    trackUserEngagement,
    trackHostAction,
    trackMarketingCampaign
  }
}