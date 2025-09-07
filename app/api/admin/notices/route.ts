import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET: 공지사항 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const target = searchParams.get('target') || 'all'
    const offset = (page - 1) * limit

    // 공지사항 조회 (최신순)
    let query = supabase
      .from('notices')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    // 대상 필터링
    if (target !== 'all') {
      query = query.or(`target_audience.eq.all,target_audience.eq.${target}`)
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
      notices: notices || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('공지사항 API 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// POST: 새 공지사항 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 인증 확인
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, content, is_important, target_audience, author_name, author_role } = body

    if (!title?.trim()) {
      return NextResponse.json(
        { error: '제목을 입력해주세요' },
        { status: 400 }
      )
    }

    // 공지사항 생성
    const { data: notice, error } = await supabase
      .from('notices')
      .insert({
        title: title.trim(),
        content: content?.trim() || '',
        author_id: session.user.id,
        author_name: author_name || '관리자',
        author_role: author_role || 'admin',
        is_important: is_important || false,
        target_audience: target_audience || 'all'
      })
      .select()
      .single()

    if (error) {
      console.error('공지사항 생성 에러:', error)
      return NextResponse.json(
        { error: '공지사항 생성에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({ notice })
  } catch (error) {
    console.error('공지사항 생성 API 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}