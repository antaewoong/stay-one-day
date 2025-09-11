import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // 세션 쿠키에서 호스트 인증 토큰 확인
    const cookies = request.cookies
    const hostAuth = cookies.get('hostAuth')?.value === 'true'
    const sessionHostId = cookies.get('hostId')?.value

    if (!hostAuth || !sessionHostId) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const requestedHostId = searchParams.get('hostId')
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''

    // URL 파라미터의 hostId와 세션의 hostId가 일치하는지 확인
    if (requestedHostId && requestedHostId !== sessionHostId) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    console.log('숙소 API - 호스트 ID:', sessionHostId)

    // 호스트 존재 여부 및 auth_user_id 확인
    const { data: host, error: hostError } = await supabaseAdmin
      .from('hosts')
      .select('id, auth_user_id')
      .eq('id', sessionHostId)
      .single()

    if (hostError || !host || !host.auth_user_id) {
      return NextResponse.json({ error: '호스트를 찾을 수 없습니다' }, { status: 404 })
    }

    // 호스트의 숙소들 조회 (인증된 호스트만)
    let query = supabaseAdmin
      .from('accommodations')
      .select('*')
      .eq('host_id', host.id)
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