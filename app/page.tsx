import { createClient } from '@/lib/supabase/server'
import HeroSection from '@/components/home/HeroSection'
import HomeClient from './home-client'

export const revalidate = 60 // 1분마다 재검증

interface HeroSlide {
  id: string
  title: string
  subtitle?: string
  description?: string
  public_url?: string
  image_url: string
  inline_data_uri?: string
  width?: number
  height?: number
  file_hash?: string
  slide_order: number
  active: boolean
}

async function getHeroSlides(): Promise<HeroSlide[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('hero_slides')
    .select(`
      id,
      title,
      subtitle,
      description,
      image_url,
      public_url,
      inline_data_uri,
      width,
      height,
      file_hash,
      slide_order,
      active
    `)
    .eq('active', true)
    .order('slide_order', { ascending: true })

  if (error) {
    console.error('Failed to fetch hero slides:', error)
    return []
  }

  return data || []
}

async function getInitialStayData() {
  const supabase = createClient()

  try {
    // 평점 데이터 로드
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('accommodation_id, rating')

    let ratingsMap: Record<string, { average: number; count: number }> = {}

    if (reviewsData && reviewsData.length > 0) {
      const groupedReviews: Record<string, number[]> = {}

      reviewsData.forEach(review => {
        if (!groupedReviews[review.accommodation_id]) {
          groupedReviews[review.accommodation_id] = []
        }
        groupedReviews[review.accommodation_id].push(review.rating)
      })

      Object.keys(groupedReviews).forEach(accommodationId => {
        const ratings = groupedReviews[accommodationId]
        const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        ratingsMap[accommodationId] = {
          average: Math.round(average * 10) / 10,
          count: ratings.length
        }
      })
    }

    // 숙소 데이터 로드
    const accommodationResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '')}/rest/v1/accommodations?limit=1000`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      next: { revalidate: 60 }
    })

    const accommodations = accommodationResponse.ok ? await accommodationResponse.json() : []

    // 섹션 설정 로드
    const sectionsResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '')}/rest/v1/site_sections`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      next: { revalidate: 60 }
    })

    const sectionsData = sectionsResponse.ok ? await sectionsResponse.json() : []

    // 스테이 데이터 초기화
    let featuredStays: any[] = []
    let poolvillaStays: any[] = []
    let privateStays: any[] = []
    let kidsStays: any[] = []
    let partyStays: any[] = []
    let newStays: any[] = []

    // 섹션별 데이터 처리
    if (sectionsData && sectionsData.length > 0) {
      sectionsData.forEach((section: any) => {
        if (!section.active) return

        let selectedAccommodations = []

        if (section.auto_fill_by_category && section.category_filter) {
          const filterValue = section.category_filter === '키즈 전용' ? '키즈' : section.category_filter
          selectedAccommodations = accommodations
            .filter((acc: any) => {
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
        } else if (section.accommodation_ids && section.accommodation_ids.length > 0) {
          selectedAccommodations = section.accommodation_ids
            .map((id: string) => accommodations.find((acc: any) => acc.id === id))
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
              featuredStays = selectedAccommodations
              break
            case 'poolvilla':
              poolvillaStays = selectedAccommodations
              break
            case 'private':
              privateStays = selectedAccommodations
              break
            case 'kids':
              kidsStays = selectedAccommodations
              break
            case 'party':
              partyStays = selectedAccommodations
              break
            case 'new':
              newStays = selectedAccommodations
              break
          }
        }
      })
    } else {
      // 기본값: Stay Cheongju만 추천에 표시
      const defaultStay = accommodations.find((acc: any) => acc.name.includes('청주'))
      if (defaultStay) {
        featuredStays = [{
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
      featuredStays,
      poolvillaStays,
      privateStays,
      kidsStays,
      partyStays,
      newStays
    }

  } catch (error) {
    console.error('Failed to load initial stay data:', error)
    return {
      featuredStays: [],
      poolvillaStays: [],
      privateStays: [],
      kidsStays: [],
      partyStays: [],
      newStays: []
    }
  }
}

export default async function HomePage() {
  // 서버에서 데이터 미리 로드
  const [heroSlides, initialData] = await Promise.all([
    getHeroSlides(),
    getInitialStayData()
  ])

  return (
    <div className="fullscreen-container bg-white">
      {/* 히어로 섹션 - SSR로 즉시 렌더링 */}
      <HeroSection slides={heroSlides} />

      {/* 나머지 컨텐츠 - 클라이언트 컴포넌트로 */}
      <HomeClient heroSlides={heroSlides} initialData={initialData} />
    </div>
  )
}