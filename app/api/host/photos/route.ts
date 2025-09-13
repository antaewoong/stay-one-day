import { NextResponse } from 'next/server'
import { withHostAuth } from '@/lib/auth/withHostAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withHostAuth(async ({ req, supabase, roleIds }) => {
  try {
    const hostId = roleIds.hostId!

    // 호스트의 숙소 ID들 가져오기
    const { data: accommodations, error: accError } = await supabase
      .from('accommodations')
      .select('id, name')
      .eq('host_id', hostId)
      .eq('status', 'active')

    if (accError) {
      console.error('숙소 데이터 로드 실패:', accError)
      return NextResponse.json({ ok: false, code: 'QUERY_ERROR', message: accError.message }, { status: 500 })
    }

    if (!accommodations || accommodations.length === 0) {
      return NextResponse.json({ 
        ok: true, 
        data: { 
          photos: [], 
          accommodations: [] 
        } 
      })
    }

    const accommodationIds = accommodations.map(acc => acc.id)

    // 숙소 이미지들 가져오기
    const { data: images, error: imagesError } = await supabase
      .from('accommodation_images')
      .select(`
        id,
        accommodation_id,
        image_url,
        image_type,
        display_order,
        alt_text,
        created_at,
        accommodations!inner(name)
      `)
      .in('accommodation_id', accommodationIds)
      .order('display_order')

    if (imagesError) {
      console.error('이미지 데이터 로드 실패:', imagesError)
      return NextResponse.json({ ok: false, code: 'QUERY_ERROR', message: imagesError.message }, { status: 500 })
    }

    // 데이터 변환
    const transformedPhotos = (images || []).map(photo => ({
      id: photo.id,
      accommodation_id: photo.accommodation_id,
      accommodation_name: photo.accommodations?.name || 'Unknown',
      image_url: photo.image_url,
      image_order: photo.display_order || 1,
      file_name: photo.image_url?.split('/').pop() || 'unknown.jpg',
      file_size: 0, // 실제로는 파일 크기 정보가 필요
      uploaded_at: photo.created_at || new Date().toISOString(),
      is_main: photo.display_order === 1,
      image_type: photo.image_type,
      alt_text: photo.alt_text
    }))

    return NextResponse.json({ 
      ok: true, 
      data: { 
        photos: transformedPhotos,
        accommodations 
      } 
    })

  } catch (error) {
    console.error('Photos API error:', error)
    return NextResponse.json(
      { ok: false, code: 'QUERY_ERROR', message: 'Failed to load photos data' },
      { status: 500 }
    )
  }
})