import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || 'all'
    const category = searchParams.get('category') || 'all'
    const search = searchParams.get('search') || ''
    const offset = (page - 1) * limit

    // 인플루언서 조회
    let query = supabase
      .from('influencers')
      .select('*')
      .order('created_at', { ascending: false })

    // 상태 필터링
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // 검색 필터링
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,instagram_handle.ilike.%${search}%`)
    }

    // 카테고리 필터링
    if (category !== 'all') {
      query = query.contains('content_category', [category])
    }

    const { data: influencers, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('인플루언서 목록 조회 에러:', error)
      return NextResponse.json(
        { error: '인플루언서 목록을 불러올 수 없습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: influencers || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      filters: { status, category, search }
    })

  } catch (error) {
    console.error('인플루언서 목록 조회 에러:', error)
    return NextResponse.json(
      { error: '인플루언서 목록을 불러올 수 없습니다' },
      { status: 500 }
    )
  }
}

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
    const {
      name,
      email,
      phone,
      social_media_links,
      follower_count,
      engagement_rate,
      content_category,
      collaboration_rate,
      preferred_collaboration_type,
      bio,
      location
    } = body

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: '이름과 이메일은 필수입니다' },
        { status: 400 }
      )
    }

    // 인플루언서 생성
    const { data: influencer, error } = await supabase
      .from('influencers')
      .insert({
        name: name.trim(),
        email: email.trim(),
        phone: phone || null,
        social_media_links: social_media_links || [],
        follower_count: follower_count || 0,
        engagement_rate: engagement_rate || 0,
        content_category: content_category || [],
        collaboration_rate: collaboration_rate || 0,
        preferred_collaboration_type: preferred_collaboration_type || 'free',
        bio: bio || null,
        location: location || null,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('인플루언서 생성 에러:', error)
      return NextResponse.json(
        { error: '인플루언서 추가에 실패했습니다' },
        { status: 500 }
      )
    }

    // AI 평가 실행 (비동기, 실패해도 인플루언서 생성은 성공으로 처리)
    try {
      const aiEvaluationResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai/influencer-evaluation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          influencerData: influencer
        })
      })

      if (aiEvaluationResponse.ok) {
        const aiResult = await aiEvaluationResponse.json()
        
        // AI 평가 결과를 인플루언서 레코드에 업데이트
        await supabase
          .from('influencers')
          .update({
            ai_evaluation: aiResult.analysis,
            ai_evaluation_date: new Date().toISOString()
          })
          .eq('id', influencer.id)
      }
    } catch (aiError) {
      console.error('AI 평가 오류 (인플루언서 생성은 성공):', aiError)
    }

    return NextResponse.json({
      success: true,
      message: '인플루언서가 성공적으로 추가되었습니다',
      data: influencer
    })

  } catch (error) {
    console.error('인플루언서 등록 에러:', error)
    return NextResponse.json(
      { error: '인플루언서 등록에 실패했습니다' },
      { status: 500 }
    )
  }
}