/**
 * 전체 숙소 페이지 서버 사이드 데이터 로딩 컴포넌트
 * CSR에서 SSR로 데이터 처리 이동
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'
import SpacesClient from './spaces-client'

interface Accommodation {
  id: string
  name: string
  description: string
  accommodation_type: string
  region: string
  address: string
  detailed_address: string
  max_capacity: number
  bedrooms: number
  bathrooms: number
  base_price: number
  weekend_price: number
  checkin_time: string
  checkout_time: string
  is_featured: boolean
  status: string
  created_at: string
  images?: string[]
}

// 서버 사이드에서 데이터 로딩
async function getSpacesPageData() {
  const supabase = createServiceRoleClient()

  try {
    // 1. 전체 활성 숙소 데이터 로드
    const { data: accommodationsData, error: accommodationsError } = await supabase
      .from('accommodations')
      .select(`
        id,
        name,
        description,
        accommodation_type,
        region,
        address,
        detailed_address,
        max_capacity,
        bedrooms,
        bathrooms,
        base_price,
        weekend_price,
        checkin_time,
        checkout_time,
        is_featured,
        status,
        created_at,
        images
      `)
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })

    const allAccommodations: Accommodation[] = accommodationsData || []

    // 2. 컬렉션별 카운트 계산
    const collectionCounts = {
      all: allAccommodations.length,
      recommended: allAccommodations.filter(acc => acc.is_featured).length,
      poolvilla: allAccommodations.filter(acc =>
        acc.name.toLowerCase().includes('풀빌라') ||
        acc.name.toLowerCase().includes('pool') ||
        acc.description?.toLowerCase().includes('풀빌라') ||
        acc.description?.toLowerCase().includes('수영장')
      ).length,
      private: allAccommodations.filter(acc =>
        acc.accommodation_type === '독채형'
      ).length,
      trending: Math.floor(allAccommodations.length * 0.3), // 임시로 30%
      luxury: Math.floor(allAccommodations.length * 0.4) // 임시로 40%
    }

    console.log('서버에서 로드된 숙소 데이터:', {
      총숙소수: allAccommodations.length,
      추천숙소수: collectionCounts.recommended,
      풀빌라수: collectionCounts.poolvilla,
      독채형수: collectionCounts.private
    })

    return {
      accommodations: allAccommodations,
      collectionCounts,
      error: accommodationsError
    }

  } catch (error) {
    console.error('숙소 페이지 데이터 로드 실패:', error)
    return {
      accommodations: [],
      collectionCounts: {
        all: 0,
        recommended: 0,
        poolvilla: 0,
        private: 0,
        trending: 0,
        luxury: 0
      },
      error: error
    }
  }
}

// 캐시된 데이터 로딩 함수 (5분 캐시)
const getCachedSpacesPageData = unstable_cache(
  getSpacesPageData,
  ['spaces-page-data'],
  {
    revalidate: 300, // 5분
    tags: ['spaces-data', 'accommodations']
  }
)

export default async function SpacesServer() {
  const spacesData = await getCachedSpacesPageData()

  return <SpacesClient initialData={spacesData} />
}