import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// 삭제 요청 목록 조회 (GET)
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending, approved, rejected
    const type = searchParams.get('type') // accommodation, user, etc

    let query = supabase
      .from('delete_requests')
      .select(`
        id,
        request_type,
        target_id,
        reason,
        status,
        host_id,
        created_at,
        processed_at,
        admin_notes,
        hosts!inner(
          name,
          email,
          phone
        ),
        accommodations!inner(
          name,
          address,
          accommodation_type
        )
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (type) {
      query = query.eq('request_type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('삭제 요청 목록 조회 실패:', error)
      return NextResponse.json({ error: '삭제 요청 조회에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ data })

  } catch (error) {
    console.error('삭제 요청 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 새 삭제 요청 생성 (POST)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    const {
      request_type, // 'accommodation', 'user', etc
      target_id,    // 삭제할 대상의 ID
      reason,       // 삭제 사유
      host_id       // 요청자 호스트 ID
    } = body

    // 필수 필드 검증
    if (!request_type || !target_id || !reason || !host_id) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 이미 삭제 요청이 있는지 확인
    const { data: existingRequest } = await supabase
      .from('delete_requests')
      .select('id')
      .eq('request_type', request_type)
      .eq('target_id', target_id)
      .eq('status', 'pending')
      .single()

    if (existingRequest) {
      return NextResponse.json(
        { error: '이미 처리 중인 삭제 요청이 있습니다.' },
        { status: 400 }
      )
    }

    // 권한 확인 (본인의 것만 삭제 요청 가능)
    if (request_type === 'accommodation') {
      const { data: accommodation, error: checkError } = await supabase
        .from('accommodations')
        .select('host_id')
        .eq('id', target_id)
        .single()

      if (checkError || !accommodation || accommodation.host_id !== host_id) {
        return NextResponse.json(
          { error: '본인의 숙소만 삭제 요청할 수 있습니다.' },
          { status: 403 }
        )
      }
    }

    // 삭제 요청 생성
    const { data, error } = await supabase
      .from('delete_requests')
      .insert({
        request_type,
        target_id,
        reason,
        host_id,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('삭제 요청 생성 실패:', error)
      return NextResponse.json(
        { error: '삭제 요청 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: '삭제 요청이 성공적으로 생성되었습니다.',
      data 
    })

  } catch (error) {
    console.error('삭제 요청 생성 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}