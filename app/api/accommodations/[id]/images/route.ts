import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const accommodationId = params.id

    if (!accommodationId) {
      return NextResponse.json(
        { error: 'Accommodation ID is required' },
        { status: 400 }
      )
    }

    // Service role 클라이언트 생성 (서명 URL 생성용)
    const supabase = createClient()

    // 숙소 정보와 이미지 목록 조회
    const { data: accommodation, error: accommodationError } = await supabase
      .from('accommodations')
      .select('id, images')
      .eq('id', accommodationId)
      .single()

    if (accommodationError) {
      console.error('Accommodation fetch error:', accommodationError)
      return NextResponse.json(
        { error: 'Accommodation not found' },
        { status: 404 }
      )
    }

    if (!accommodation || !accommodation.images || !Array.isArray(accommodation.images)) {
      return NextResponse.json({
        accommodation_id: accommodationId,
        images: []
      })
    }

    // 이미지들이 이미 public URL이므로 직접 반환 (성능 최적화)
    const validImages = accommodation.images
      .filter((imageUrl: string) => imageUrl && typeof imageUrl === 'string')
      .map((imageUrl: string) => ({
        original_url: imageUrl,
        public_url: imageUrl,
        is_public: true
      }))

    return NextResponse.json({
      accommodation_id: accommodationId,
      images: validImages,
      total_images: accommodation.images.length,
      valid_images: validImages.length,
      cache_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300'
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}