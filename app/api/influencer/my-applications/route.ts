import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET: 인플루언서의 협업 신청 현황 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { searchParams } = new URL(request.url)
    const influencerId = searchParams.get('influencer_id')
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    if (!influencerId) {
      return NextResponse.json(
        { success: false, error: 'Influencer ID가 필요합니다' },
        { status: 400 }
      )
    }

    // 협업 신청 조회 (숙소 정보 포함)
    let query = supabase
      .from('influencer_collaboration_requests')
      .select(`
        id,
        request_type,
        proposed_rate,
        message,
        check_in_date,
        check_out_date,
        guest_count,
        status,
        final_status,
        admin_notes,
        review_submitted_at,
        review_content,
        review_links,
        created_at,
        updated_at,
        accommodation:accommodations!inner(
          id,
          name,
          location,
          price_per_night,
          images
        )
      `)
      .eq('influencer_id', influencerId)
      .order('created_at', { ascending: false })

    // 상태 필터링
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: applications, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('협업 신청 조회 에러:', error)
      return NextResponse.json(
        { success: false, error: '협업 신청 내역을 불러올 수 없습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: applications || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('내 협업 신청 API 에러:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}