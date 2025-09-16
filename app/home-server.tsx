/**
 * 홈페이지 서버 사이드 데이터 로딩 컴포넌트
 * CSR에서 SSR로 데이터 처리 이동
 */

import { createClient } from '@/lib/supabase/server'
import HomeClient from './home-client'
import HeroServer from './hero-server'

// 서버 사이드에서 데이터 로딩
async function getHomePageData() {
  const supabase = createClient()

  try {
    // 1. 평점 데이터 로드
    const { data: reviewsData, error: reviewError } = await supabase
      .from('reviews')
      .select('accommodation_id, rating')

    let ratingsMap: Record<string, { average: number; count: number }> = {}

    if (!reviewError && reviewsData && reviewsData.length > 0) {
      // 숙소별로 그룹화
      const groupedReviews: Record<string, number[]> = {}

      reviewsData.forEach(review => {
        if (!groupedReviews[review.accommodation_id]) {
          groupedReviews[review.accommodation_id] = []
        }
        groupedReviews[review.accommodation_id].push(review.rating)
      })

      // 평균 계산
      Object.keys(groupedReviews).forEach(accommodationId => {
        const ratings = groupedReviews[accommodationId]
        const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        ratingsMap[accommodationId] = {
          average: Math.round(average * 10) / 10,
          count: ratings.length
        }
      })
    }

    // 2. 숙소 데이터 로드 (직접 Supabase에서)
    const { data: accommodationsData, error: accommodationsError } = await supabase
      .from('accommodations')
      .select(`
        *,
        accommodation_amenities (
          amenity_name
        )
      `)
      .eq('status', 'active')
      .limit(1000)

    let allAccommodations: any[] = []
    if (!accommodationsError && accommodationsData) {
      allAccommodations = accommodationsData
    }

    // 3. 사이트 섹션 설정 로드 (직접 Supabase에서)
    const { data: sectionsData, error: sectionsError } = await supabase
      .from('site_sections')
      .select('*')
      .eq('active', true)

    const sections = sectionsData || []

    // 4. 섹션별 숙소 데이터 처리
    const processedSections: Record<string, any[]> = {
      featured: [],
      poolvilla: [],
      private: [],
      kids: [],
      party: [],
      new: []
    }

    if (sections.length > 0) {
      sections.forEach((section: any) => {
        if (!section.active) return

        let selectedAccommodations = []

        // 자동 필터링이 활성화된 경우
        if (section.auto_fill_by_category && section.category_filter) {
          selectedAccommodations = allAccommodations
            .filter((acc: any) => {
              const filterValue = section.category_filter === '키즈 전용' ? '키즈' : section.category_filter
              return acc.accommodation_types?.includes(filterValue) ||
                     acc.accommodation_type === filterValue ||
                     acc.accommodation_types?.includes(section.category_filter) ||
                     acc.accommodation_type === section.category_filter
            })
            .slice(0, section.max_items || 6)
            .map((acc: any) => ({
              id: acc.id,
              name: acc.name,
              image: acc.images?.[0] || '',
              location: acc.region,
              type: acc.accommodation_type,
              price: acc.base_price,
              capacity: acc.max_capacity,
              rating: ratingsMap[acc.id]?.average || 0,
              ratingCount: ratingsMap[acc.id]?.count || 0,
              reviews: 100,
              badges: ["추천"],
              amenities: acc.accommodation_amenities?.slice(0, 4).map((amenity: any) => amenity.amenity_name) || []
            }))
        }
        // 수동 선택된 숙소가 있는 경우
        else if (section.accommodation_ids && section.accommodation_ids.length > 0) {
          selectedAccommodations = section.accommodation_ids
            .map((id: string) => allAccommodations.find((acc: any) => acc.id === id))
            .filter(Boolean)
            .map((acc: any) => ({
              id: acc.id,
              name: acc.name,
              image: acc.images?.[0] || '',
              location: acc.region,
              type: acc.accommodation_type,
              price: acc.base_price,
              capacity: acc.max_capacity,
              rating: ratingsMap[acc.id]?.average || 0,
              ratingCount: ratingsMap[acc.id]?.count || 0,
              reviews: 100,
              badges: ["추천"],
              amenities: acc.accommodation_amenities?.slice(0, 4).map((amenity: any) => amenity.amenity_name) || []
            }))
        }

        if (selectedAccommodations.length > 0) {
          switch (section.section_id) {
            case 'recommended':
              processedSections.featured = selectedAccommodations
              break
            case 'poolvilla':
              processedSections.poolvilla = selectedAccommodations
              break
            case 'private':
              processedSections.private = selectedAccommodations
              break
            case 'kids':
              processedSections.kids = selectedAccommodations
              break
            case 'party':
              processedSections.party = selectedAccommodations
              break
            case 'new':
              processedSections.new = selectedAccommodations
              break
          }
        }
      })
    } else {
      // 기본값: Stay Cheongju만 추천에 표시
      const defaultStay = allAccommodations.find((acc: any) => acc.name.includes('청주'))
      if (defaultStay) {
        processedSections.featured = [{
          id: defaultStay.id,
          name: defaultStay.name,
          image: defaultStay.images?.[0] || '',
          location: defaultStay.region,
          type: defaultStay.accommodation_type,
          price: defaultStay.base_price,
          capacity: defaultStay.max_capacity,
          rating: 4.8,
          reviews: 100,
          badges: ["추천"],
          amenities: defaultStay.accommodation_amenities?.slice(0, 4).map((amenity: any) => amenity.amenity_name) || []
        }]
      }
    }

    return {
      accommodationRatings: ratingsMap,
      allAccommodations,
      ...processedSections
    }

  } catch (error) {
    console.error('홈페이지 데이터 로드 실패:', error)
    return {
      accommodationRatings: {},
      allAccommodations: [],
      featured: [],
      poolvilla: [],
      private: [],
      kids: [],
      party: [],
      new: []
    }
  }
}

export default async function HomeServer() {
  const homeData = await getHomePageData()

  return (
    <>
      <HeroServer />
      <HomeClient initialData={homeData} />
    </>
  )
}