import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET: 모든 인플루언서 공지사항 조회 (관리자용)
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
    const type = searchParams.get('type') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // 공지사항 조회
    let query = supabase
      .from('influencer_notices')
      .select('*')
      .order('created_at', { ascending: false })

    // 상태 필터링
    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }

    // 타입 필터링
    if (type !== 'all') {
      query = query.eq('notice_type', type)
    }

    const { data: notices, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('공지사항 조회 에러:', error)
      return NextResponse.json(
        { error: '공지사항을 불러올 수 없습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: notices || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('관리자 공지사항 API 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// POST: 새 공지사항 작성 (관리자용)
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
      title,
      content,
      notice_type = 'collaboration',
      target_month,
      target_year,
      is_active = true
    } = body

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: '제목과 내용은 필수입니다' },
        { status: 400 }
      )
    }

    // 공지사항 생성
    const { data: notice, error } = await supabase
      .from('influencer_notices')
      .insert({
        title: title.trim(),
        content: content.trim(),
        notice_type,
        target_month: target_month || null,
        target_year: target_year || null,
        is_active,
        created_by: session.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('공지사항 생성 에러:', error)
      return NextResponse.json(
        { error: '공지사항 작성에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '공지사항이 성공적으로 작성되었습니다',
      data: notice
    })

  } catch (error) {
    console.error('공지사항 작성 에러:', error)
    return NextResponse.json(
      { error: '공지사항 작성에 실패했습니다' },
      { status: 500 }
    )
  }
}