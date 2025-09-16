import { createClient } from '@/lib/supabase/server'
import HeroSection from '@/components/home/HeroSection'

async function getHeroSlides() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('hero_slides')
    .select('*')
    .eq('active', true)
    .order('slide_order', { ascending: true })

  if (error) {
    console.error('Failed to fetch hero slides:', error)
    return []
  }

  // 출판된 이미지만 사용: public_url 우선, 없으면 기존 image_url
  const slides = (data || []).map(slide => ({
    ...slide,
    // 출판 파이프라인: public_url이 있으면 사용, 없으면 fallback
    image_url: slide.public_url || slide.image_url?.replace(/\n/g, '').replace(/\s+/g, ''),
    // 첫 번째 슬라이드는 inline_data_uri 사용 가능
    inline_data_uri: slide.inline_data_uri,
    width: slide.width || 2560,
    height: slide.height || 1440
  }))

  return slides
}

export default async function HeroServer() {
  const slides = await getHeroSlides()

  if (slides.length === 0) {
    return null // 로딩 화면 없음
  }

  return <HeroSection slides={slides} />
}