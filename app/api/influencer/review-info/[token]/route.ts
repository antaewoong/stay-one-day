import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

// GET: 협업 정보 조회 (리뷰 제출용)
export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const token = params.token

    // JWT 토큰 검증 (리뷰 제출용 토큰)
    let collaborationId: string
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { collaborationId: string, exp: number }
      collaborationId = decoded.collaborationId
      
      // 토큰 만료 확인
      if (decoded.exp * 1000 < Date.now()) {
        return NextResponse.json(
          { success: false, message: '만료된 링크입니다.' },
          { status: 400 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 토큰입니다.' },
        { status: 400 }
      )
    }

    // 협업 정보 조회 (승인된 협업만)
    const { data: collaboration, error } = await supabase
      .from('influencer_collaboration_requests')
      .select(`
        id,
        check_in_date,
        check_out_date,
        status,
        final_status,
        review_submitted_at,
        influencer:influencers!inner(
          name,
          email
        ),
        accommodation:accommodations!inner(
          name,
          location
        )
      `)
      .eq('id', collaborationId)
      .eq('status', 'accepted')
      .single()

    if (error || !collaboration) {
      return NextResponse.json(
        { success: false, message: '협업 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이미 리뷰를 제출했는지 확인
    if (collaboration.review_submitted_at) {
      return NextResponse.json(
        { success: false, message: '이미 리뷰를 제출하였습니다.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      collaboration
    })
  } catch (error) {
    console.error('협업 정보 조회 에러:', error)
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}