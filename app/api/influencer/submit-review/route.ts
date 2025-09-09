import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

// POST: 인플루언서 리뷰 제출
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { token, review_content, review_links } = body

    // 토큰 검증 (리뷰 제출용)
    let collaborationId: string
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { collaborationId: string }
      collaborationId = decoded.collaborationId
    } catch (error) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 토큰입니다.' },
        { status: 400 }
      )
    }

    // 입력값 검증
    if (!review_content?.trim()) {
      return NextResponse.json(
        { success: false, message: '리뷰 내용을 입력해주세요.' },
        { status: 400 }
      )
    }

    if (!review_links || review_links.length === 0) {
      return NextResponse.json(
        { success: false, message: '최소 하나의 리뷰 링크를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 협업 요청 존재 확인 및 중복 제출 방지
    const { data: existingCollaboration, error: fetchError } = await supabase
      .from('influencer_collaboration_requests')
      .select('id, status, final_status, review_submitted_at')
      .eq('id', collaborationId)
      .eq('status', 'accepted')
      .single()

    if (fetchError || !existingCollaboration) {
      return NextResponse.json(
        { success: false, message: '협업 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (existingCollaboration.review_submitted_at) {
      return NextResponse.json(
        { success: false, message: '이미 리뷰를 제출하였습니다.' },
        { status: 400 }
      )
    }

    // 링크 데이터 구조화
    const structuredLinks = review_links.reduce((acc: any, link: any) => {
      if (link.url && link.url.trim()) {
        acc[link.platform] = {
          url: link.url.trim(),
          description: link.description || ''
        }
      }
      return acc
    }, {})

    // 리뷰 정보 업데이트
    const { data: updatedCollaboration, error: updateError } = await supabase
      .from('influencer_collaboration_requests')
      .update({
        review_content: review_content.trim(),
        review_links: structuredLinks,
        review_submitted_at: new Date().toISOString(),
        final_status: 'review_pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', collaborationId)
      .select()
      .single()

    if (updateError) {
      console.error('리뷰 제출 에러:', updateError)
      return NextResponse.json(
        { success: false, message: '리뷰 제출에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '리뷰가 성공적으로 제출되었습니다. 호스트가 확인 후 협업이 완료됩니다.',
      data: updatedCollaboration
    })
  } catch (error) {
    console.error('리뷰 제출 API 에러:', error)
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}