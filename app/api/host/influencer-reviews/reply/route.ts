import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // 세션 쿠키에서 호스트 인증 토큰 확인
    const cookieStore = cookies()
    const hostAuth = cookieStore.get('hostAuth')?.value === 'true'
    const sessionHostId = cookieStore.get('hostId')?.value

    if (!hostAuth || !sessionHostId) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const supabase = createRouteHandlerClient({ cookies })
    
    const body = await request.json()
    const { reviewId, hostId, reply } = body

    if (!reviewId || !reply?.trim()) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다' },
        { status: 400 }
      )
    }

    // 세션 hostId와 요청 hostId 일치 확인
    if (hostId && hostId !== sessionHostId) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
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