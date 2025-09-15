import { NextRequest, NextResponse } from 'next/server'
import { withHostAuth } from '@/lib/auth/withHostAuth'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: 호스트용 공지사항 목록 조회
export const GET = withHostAuth(async ({ req, supabase, roleIds }) => {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '5')
    const important = searchParams.get('important') === 'true' // 중요 공지만

    // Service role client 사용
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 호스트가 볼 수 있는 공지사항 조회 (published, target_audience가 'all' 또는 'hosts')
    let query = supabaseAdmin
      .from('notices')
      .select('id, title, content, notice_type, is_pinned, created_at, start_date, end_date')
      .eq('status', 'published')
      .in('target_audience', ['all', 'hosts'])
      .order('created_at', { ascending: false })

    // 중요 공지만 필터링
    if (important) {
      query = query.eq('is_pinned', true)
    }

    // 현재 시간 기준으로 유효한 공지만 (start_date <= now <= end_date or 날짜 제한 없음)
    const now = new Date().toISOString()
    query = query.or(
      `and(start_date.lte.${now},end_date.gte.${now}),and(start_date.is.null,end_date.is.null)`
    )

    // 제한 적용
    query = query.limit(limit)

    const { data: notices, error } = await query

    if (error) {
      console.error('호스트 공지사항 조회 실패:', error)
      return NextResponse.json(
        { success: false, error: '공지사항 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: notices || [],
      count: notices?.length || 0
    })

  } catch (error) {
    console.error('호스트 공지사항 API 에러:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
})