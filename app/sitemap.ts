import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/client'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://stay-oneday.com'
  const supabase = createClient()

  // 기본 정적 페이지들
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/spaces`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/reservations`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/promotion`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/pre-order`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/profile`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/host`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
  ]

  // 숙소 페이지들 (동적으로 생성)
  let accommodationPages: MetadataRoute.Sitemap = []
  
  try {
    const { data: accommodations } = await supabase
      .from('accommodations')
      .select('id, updated_at')
      .eq('status', 'active')

    if (accommodations) {
      accommodationPages = accommodations.map((accommodation) => ({
        url: `${baseUrl}/spaces/${accommodation.id}`,
        lastModified: new Date(accommodation.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    }
  } catch (error) {
    console.error('사이트맵 생성 중 오류:', error)
    // 개발 환경에서는 더미 데이터 사용
    accommodationPages = Array.from({ length: 20 }, (_, i) => ({
      url: `${baseUrl}/spaces/${i + 1}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  }

  // 지역별 페이지들
  const regionPages = ['청주', '세종', '대전', '충북', '충남'].map((region) => ({
    url: `${baseUrl}/spaces?region=${encodeURIComponent(region)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  // 카테고리별 페이지들
  const categoryPages = [
    '프라이빗 독채형',
    '물놀이 가능 풀빌라',
    '자연 속 완벽한 휴식',
    '반려견 동반 가능',
    '키즈 전용',
    '배달음식 이용 편리'
  ].map((category) => ({
    url: `${baseUrl}/spaces?category=${encodeURIComponent(category)}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }))

  return [
    ...staticPages,
    ...accommodationPages,
    ...regionPages,
    ...categoryPages,
  ]
}