import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

// POST: 인플루언서용 협업신청 토큰 생성
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { influencer_id, expires_in_days = 30 } = body

    if (!influencer_id) {
      return NextResponse.json(
        { error: '인플루언서 ID가 필요합니다' },
        { status: 400 }
      )
    }

    // 인플루언서 존재 확인
    const { data: influencer, error: influencerError } = await supabase
      .from('influencers')
      .select('id, name, email, status')
      .eq('id', influencer_id)
      .single()

    if (influencerError || !influencer) {
      return NextResponse.json(
        { error: '인플루언서를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (influencer.status !== 'active') {
      return NextResponse.json(
        { error: '비활성화된 인플루언서입니다' },
        { status: 400 }
      )
    }

    // JWT 토큰 생성 (30일 유효)
    const expiresIn = expires_in_days * 24 * 60 * 60 // seconds
    const token = jwt.sign(
      { 
        influencerId: influencer_id,
        exp: Math.floor(Date.now() / 1000) + expiresIn
      },
      process.env.JWT_SECRET || 'your-secret-key'
    )

    // 협업신청 링크 생성
    const collaborationLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/influencer/request/${token}`

    return NextResponse.json({
      success: true,
      data: {
        influencer: {
          id: influencer.id,
          name: influencer.name,
          email: influencer.email
        },
        token,
        collaboration_link: collaborationLink,
        expires_at: new Date(Date.now() + (expires_in_days * 24 * 60 * 60 * 1000)).toISOString(),
        expires_in_days
      }
    })
  } catch (error) {
    console.error('토큰 생성 API 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// GET: 모든 인플루언서 목록 (토큰 생성용)
export async function GET() {
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

    const { data: influencers, error } = await supabase
      .from('influencers')
      .select('id, name, email, phone, instagram_handle, follower_count, status')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('인플루언서 목록 조회 에러:', error)
      return NextResponse.json(
        { error: '인플루언서 목록을 불러올 수 없습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: influencers || []
    })
  } catch (error) {
    console.error('인플루언서 목록 API 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}