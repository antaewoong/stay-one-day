import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/middleware/withAdminAuth'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// GET: 공지사항 목록 조회
export const GET = withAdminAuth(async (request: NextRequest, db: any, ctx: any) => {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const offset = (page - 1) * limit

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 공지사항 목록 조회
    const { data: notices, error, count } = await supabaseAdmin
      .from('notices')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('공지사항 조회 실패:', error)
      return NextResponse.json(
        { success: false, error: '공지사항 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    console.log(`✅ 공지사항 목록 조회: ${notices?.length || 0}개`)

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
      { success: false, error: '서버 오류가 발생했습니다', details: error },
      { status: 500 }
    )
  }
})

// POST: 새 공지사항 생성
export const POST = withAdminAuth(async (request: NextRequest, db: any, ctx: any) => {
  try {
    const body = await request.json()
    const { title, content, notice_type, target_audience, is_pinned, is_popup, start_date, end_date, status } = body

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: '제목과 내용은 필수입니다' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 새 공지사항 생성
    const { data: newNotice, error } = await supabaseAdmin
      .from('notices')
      .insert({
        admin_id: ctx.admin?.auth_user_id,
        title,
        content,
        notice_type: notice_type || 'general',
        target_audience: target_audience || 'all',
        is_pinned: is_pinned || false,
        is_popup: is_popup || false,
        start_date: start_date ? new Date(start_date).toISOString() : null,
        end_date: end_date ? new Date(end_date).toISOString() : null,
        status: status || 'published',
        view_count: 0
      })
      .select()
      .single()

    if (error) {
      console.error('공지사항 생성 실패:', error)
      return NextResponse.json(
        { success: false, error: '공지사항 생성에 실패했습니다' },
        { status: 500 }
      )
    }

    console.log(`✅ 새 공지사항 생성: ${title} by ${ctx.admin?.email}`)

    return NextResponse.json({
      success: true,
      data: newNotice,
      message: '공지사항이 성공적으로 생성되었습니다'
    })

  } catch (error) {
    console.error('공지사항 생성 API 에러:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
})