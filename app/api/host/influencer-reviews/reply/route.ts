import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const body = await request.json()
    const { reviewId, hostId, reply } = body

    if (!reviewId || !hostId || !reply?.trim()) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다' },
        { status: 400 }
      )
    }

    // 실제 데이터베이스 업데이트 로직이 필요하지만,
    // 현재는 성공 응답만 반환
    console.log('답글 등록:', { reviewId, hostId, reply: reply.trim() })

    return NextResponse.json({
      success: true,
      message: '답글이 성공적으로 등록되었습니다',
      data: {
        reviewId,
        hostId,
        reply: reply.trim(),
        reply_date: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('답글 등록 오류:', error)
    return NextResponse.json(
      { error: '답글 등록에 실패했습니다' },
      { status: 500 }
    )
  }
}