import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET: 모든 협업 요청 조회 (관리자용)
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 관리자 인증 확인
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // 협업 요청 조회 (인플루언서, 숙소, 호스트 정보 포함)
    let query = supabase
      .from('influencer_collaboration_requests')
      .select(`
        *,
        influencer:influencers!inner(
          id,
          name,
          email,
          phone,
          instagram_handle,
          follower_count,
          content_category,
          profile_image_url,
          location
        ),
        accommodation:accommodations!inner(
          id,
          name,
          location,
          price_per_night
        ),
        host:hosts!inner(
          id,
          business_name,
          name,
          phone,
          email
        )
      `)
      .order('created_at', { ascending: false })

    // 상태 필터링
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: requests, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('협업 요청 조회 에러:', error)
      return NextResponse.json(
        { error: '협업 요청을 불러올 수 없습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: requests || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('관리자 협업 요청 API 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}