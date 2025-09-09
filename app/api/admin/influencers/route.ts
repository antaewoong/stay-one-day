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
      instagram_handle,
      youtube_channel,
      tiktok_handle,
      blog_url,
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
        instagram_handle: instagram_handle || null,
        youtube_channel: youtube_channel || null,
        tiktok_handle: tiktok_handle || null,
        blog_url: blog_url || null,
        follower_count: follower_count || 0,
        engagement_rate: engagement_rate || 0,
        content_category: content_category || [],
        collaboration_rate: collaboration_rate || 0,
        preferred_collaboration_type: preferred_collaboration_type || 'both',
        bio: bio || null,
        location: location || null,
        username: name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        password_hash: '$2b$10$dummy.hash.for.testing.purposes.only',
        is_verified: true,
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