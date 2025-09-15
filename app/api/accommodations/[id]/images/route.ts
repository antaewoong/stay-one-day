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

    // Service Role 키로 서명 URL 생성
    const supabaseServiceRole = createServiceRoleClient()

    // 각 이미지에 대해 서명 URL 생성
    const signedImages = await Promise.allSettled(
      accommodation.images.map(async (imageUrl: string) => {
        try {
          // URL에서 파일 경로 추출
          const urlParts = imageUrl.split('/accommodation-images/')
          if (urlParts.length !== 2) {
            throw new Error('Invalid image URL format')
          }

          const filePath = urlParts[1]

          // 24시간 만료 서명 URL 생성
          const { data, error } = await supabaseServiceRole.storage
            .from('accommodation-images')
            .createSignedUrl(filePath, 24 * 60 * 60) // 24시간

          if (error) {
            console.error('Signed URL creation error:', error)
            throw error
          }

          return {
            original_url: imageUrl,
            signed_url: data.signedUrl,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          }
        } catch (error) {
          console.error('Error processing image:', imageUrl, error)
          return {
            original_url: imageUrl,
            signed_url: null,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })
    )

    // 성공한 서명 URL만 필터링
    const validImages = signedImages
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value)
      .filter(image => image.signed_url !== null)

    return NextResponse.json({
      accommodation_id: accommodationId,
      images: validImages,
      total_images: accommodation.images.length,
      valid_images: validImages.length,
      cache_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}