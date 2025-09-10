import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hostId = searchParams.get('hostId')
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''

    if (!hostId) {
      return NextResponse.json({ error: 'Host ID required' }, { status: 400 })
    }

    console.log('숙소 API - 호스트 ID:', hostId)

    // 호스트의 숙소들 조회 (서비스 롤로 RLS 우회)
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

    console.log('숙소 조회 결과:', accommodations?.length || 0, '개')
    console.log('숙소 조회 에러:', error)

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: '숙소 데이터 조회 실패',
        debug: error 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: accommodations || []
    })

  } catch (error) {
    console.error('호스트 숙소 API 에러:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}