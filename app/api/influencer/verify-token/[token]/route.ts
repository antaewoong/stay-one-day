import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// GET: 토큰 검증 및 인플루언서 정보 반환
export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const token = params.token

    // JWT 토큰 검증
    let influencerId: string
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { influencerId: string, exp: number }
      influencerId = decoded.influencerId
      
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

    // 인플루언서 정보 조회
    const { data: influencer, error } = await supabase
      .from('influencers')
      .select('*')
      .eq('id', influencerId)
      .eq('status', 'active')
      .single()

    if (error || !influencer) {
      return NextResponse.json(
        { success: false, message: '인플루언서를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      influencer
    })
  } catch (error) {
    console.error('토큰 검증 에러:', error)
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}