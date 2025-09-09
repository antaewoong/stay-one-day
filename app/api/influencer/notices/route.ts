import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET: 인플루언서용 공지사항 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 인플루언서용 공지사항 조회 (활성화된 공지사항만)
    const { data: notices, error } = await supabase
      .from('notices')
      .select('*')
      .eq('status', 'published')
      .in('target_audience', ['all', 'influencers'])
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('공지사항 조회 에러:', error)
      return NextResponse.json(
        { success: false, error: '공지사항을 불러올 수 없습니다' },
        { status: 500 }
      )
    }

    // 전체 개수 조회
    const { count, error: countError } = await supabase
      .from('notices')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .in('target_audience', ['all', 'influencers'])

    if (countError) {
      console.error('공지사항 개수 조회 에러:', countError)
    }

    return NextResponse.json({
      success: true,
      data: notices || [],
      total: count || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('인플루언서 공지사항 API 에러:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}