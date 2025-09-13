import { NextRequest, NextResponse } from 'next/server'
import { withHostAuth } from '@/lib/auth/withHostAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withHostAuth(async ({ req, supabase, roleIds }) => {
  try {
    const hostId = roleIds.hostId!
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''

    // 호스트의 숙소들 조회 (인증된 호스트만)
    let query = supabase
      .from('accommodations')
      .select('*')
      .eq('host_id', hostId)
      .order('created_at', { ascending: false })

    // 상태 필터 적용
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // 검색어 적용
    if (search) {
      query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`)
    }

    const { data: accommodations, error } = await query

    if (error) {
      console.error('숙소 조회 실패:', error)
      return NextResponse.json({ 
        ok: false, 
        code: 'QUERY_ERROR',
        message: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      data: accommodations || []
    })

  } catch (error) {
    console.error('호스트 숙소 API 에러:', error)
    return NextResponse.json(
      { ok: false, code: 'QUERY_ERROR', message: 'Failed to load accommodations data' },
      { status: 500 }
    )
  }
})