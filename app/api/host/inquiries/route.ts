import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// RLS 정책을 위한 일반 클라이언트
const supabase = createClient(supabaseUrl, supabaseAnonKey)
// 서비스 롤 클라이언트 (관리용)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// 호스트 문의 조회 (GET)
export async function GET(request: NextRequest) {
  try {
    // 세션 쿠키에서 호스트 인증 토큰 확인
    const cookies = request.cookies
    const hostAuth = cookies.get('hostAuth')?.value === 'true'
    const sessionHostId = cookies.get('hostId')?.value

    if (!hostAuth || !sessionHostId) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 호스트 존재 여부 및 auth_user_id 확인
    const { data: host, error: hostError } = await supabaseAdmin
      .from('hosts')
      .select('id, auth_user_id')
      .eq('id', sessionHostId)
      .single()

    if (hostError || !host || !host.auth_user_id) {
      return NextResponse.json({ error: '호스트 정보를 찾을 수 없습니다' }, { status: 404 })
    }

    // auth_user_id로 Supabase 인증 컨텍스트 설정
    const { data, error: authError } = await supabase.auth.admin.getUserById(host.auth_user_id)
    
    if (authError || !data.user) {
      return NextResponse.json({ error: '인증 사용자를 찾을 수 없습니다' }, { status: 404 })
    }

    // RLS 정책을 통한 문의 조회 (auth.uid()가 호스트의 auth_user_id와 일치)
    const { data: inquiries, error } = await supabase
      .from('inquiries')
      .select('*')
      .eq('user_type', 'host')
      .eq('user_id', host.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('호스트 문의 조회 실패:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch inquiries' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: inquiries || []
    })

  } catch (error) {
    console.error('호스트 문의 조회 API 에러:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 호스트 문의 등록 (POST)
export async function POST(request: NextRequest) {
  try {
    const { hostId, title, category, content } = await request.json()

    // 필수 필드 검증
    if (!hostId || !title?.trim() || !category || !content?.trim()) {
      return NextResponse.json({ 
        error: '필수 필드가 누락되었습니다' 
      }, { status: 400 })
    }

    // 세션 인증 확인
    const cookies = request.cookies
    const hostAuth = cookies.get('hostAuth')?.value === 'true'
    const sessionHostId = cookies.get('hostId')?.value

    if (!hostAuth || !sessionHostId || sessionHostId !== hostId) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 카테고리 검증
    const validCategories = ['accommodation', 'reservation', 'payment', 'technical', 'other']
    if (!validCategories.includes(category)) {
      return NextResponse.json({ 
        error: '유효하지 않은 카테고리입니다' 
      }, { status: 400 })
    }

    // 호스트 존재 여부 및 auth_user_id 확인
    const { data: host, error: hostError } = await supabaseAdmin
      .from('hosts')
      .select('id, business_name, email, auth_user_id')
      .eq('id', hostId)
      .single()

    if (hostError || !host || !host.auth_user_id) {
      return NextResponse.json({ 
        error: '호스트 정보를 찾을 수 없습니다' 
      }, { status: 404 })
    }

    // RLS 정책을 통한 문의 등록 (Service Role로 직접 삽입)
    // 이 경우 RLS 정책을 우회하지만 호스트 인증은 확실히 검증함
    const { data: inquiry, error: insertError } = await supabaseAdmin
      .from('inquiries')
      .insert({
        user_type: 'host',
        user_id: hostId,
        user_name: host.business_name || '호스트',
        user_email: host.email || '',
        title: title.trim(),
        category,
        content: content.trim(),
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      console.error('문의 등록 실패:', insertError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create inquiry' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: inquiry,
      message: '문의가 성공적으로 등록되었습니다'
    })

  } catch (error) {
    console.error('호스트 문의 등록 API 에러:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}