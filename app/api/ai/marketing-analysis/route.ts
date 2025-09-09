import { NextRequest, NextResponse } from 'next/server'
import { generateMarketingAnalysis, AccommodationData } from '@/lib/ai/gemini'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 인증 확인 (호스트 또는 관리자만)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const { accommodationId } = await request.json()
    
    if (!accommodationId) {
      return NextResponse.json(
        { error: '숙소 ID가 필요합니다' },
        { status: 400 }
      )
    }

    // 숙소 데이터 조회
    const { data: accommodation, error: accommodationError } = await supabase
      .from('accommodations')
      .select(`
        id,
        name,
        accommodation_type,
        region,
        base_price,
        max_capacity,
        amenities,
        description,
        images,
        keywords,
        accommodation_types
      `)
      .eq('id', accommodationId)
      .single()

    if (accommodationError || !accommodation) {
      return NextResponse.json(
        { error: '숙소를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 평점 데이터 조회
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('accommodation_id', accommodationId)

    const rating = reviews && reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : undefined

    // 경쟁 숙소 데이터 조회 (같은 지역, 비슷한 타입)
    const { data: competitors } = await supabase
      .from('accommodations')
      .select(`
        id,
        name,
        accommodation_type,
        region,
        base_price,
        max_capacity,
        amenities
      `)
      .eq('region', accommodation.region)
      .eq('accommodation_type', accommodation.accommodation_type)
      .neq('id', accommodationId)
      .limit(5)

    // AI 분석을 위한 데이터 구조 변환
    const accommodationData: AccommodationData = {
      id: accommodation.id,
      name: accommodation.name,
      type: accommodation.accommodation_type,
      location: accommodation.region,
      price: accommodation.base_price,
      capacity: accommodation.max_capacity,
      amenities: accommodation.amenities || [],
      description: accommodation.description || '',
      images: accommodation.images || [],
      rating: rating ? Math.round(rating * 10) / 10 : undefined,
      reviewCount: reviews?.length || 0,
      keywords: accommodation.keywords || accommodation.accommodation_types || []
    }

    const competitorData: AccommodationData[] = competitors?.map(comp => ({
      id: comp.id,
      name: comp.name,
      type: comp.accommodation_type,
      location: comp.region,
      price: comp.base_price,
      capacity: comp.max_capacity,
      amenities: comp.amenities || [],
      description: '',
      images: []
    })) || []

    console.log('🤖 AI 마케팅 분석 요청:', {
      숙소명: accommodationData.name,
      타입: accommodationData.type,
      경쟁숙소수: competitorData.length
    })

    // Google AI로 마케팅 분석 생성
    const analysis = await generateMarketingAnalysis(accommodationData, competitorData)

    return NextResponse.json({
      success: true,
      data: {
        accommodation: {
          name: accommodationData.name,
          type: accommodationData.type,
          location: accommodationData.location,
          price: accommodationData.price
        },
        analysis
      }
    })

  } catch (error) {
    console.error('마케팅 분석 API 에러:', error)
    return NextResponse.json(
      { error: '마케팅 분석 생성에 실패했습니다' },
      { status: 500 }
    )
  }
}