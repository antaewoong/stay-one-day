import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/middleware/withAdminAuth'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// GET: 공지사항 목록 조회
export const GET = (req: NextRequest) =>
  withAdminAuth(req, async (request: NextRequest, ctx: any) => {
    try {
      console.log('✅ 관리자 인증 성공:', ctx.adminEmail)
      
      // Service role client 사용 (GPT 권장)
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const target = searchParams.get('target') || 'all'
    const offset = (page - 1) * limit

    // 공지사항 조회 (최신순)
    let query = supabaseAdmin
      .from('notices')
      .select('*')
      .eq('status', 'published')
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
    console.error('공지사항 API 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', details: error },
      { status: 500 }
    )
  }
})

// POST: 새 공지사항 생성
export const POST = (req: NextRequest) =>
  withAdminAuth(req, async (request: NextRequest, ctx: any) => {
    try {
      console.log('✅ 관리자 인증 성공:', ctx.adminEmail)
      
      // Service role client 사용 (GPT 권장)
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

    const body = await request.json()
    const { title, content, is_important, target_audience, author_name, author_role } = body

    if (!title?.trim()) {
      return NextResponse.json(
        { error: '제목을 입력해주세요' },
        { status: 400 }
      )
    }

    // 공지사항 생성
    const { data: notice, error } = await supabaseAdmin
      .from('notices')
      .insert({
        title: title.trim(),
        content: content?.trim() || '',
        admin_id: ctx.adminId,
        notice_type: 'general',
        target_audience: target_audience || 'all',
        is_pinned: is_important || false,
        status: 'published'
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
      { error: '서버 오류가 발생했습니다', details: error },
      { status: 500 }
    )
  }
})