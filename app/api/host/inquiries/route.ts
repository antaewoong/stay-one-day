import { NextRequest, NextResponse } from 'next/server'
import { withHostAuth } from '@/lib/auth/withHostAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 호스트 문의 조회 (GET)
export const GET = withHostAuth(async ({ req, supabase, roleIds }) => {
  try {
    const hostId = roleIds.hostId!

    // 호스트 문의 조회
    const { data: inquiries, error } = await supabase
      .from('inquiries')
      .select('*')
      .eq('user_type', 'host')
      .eq('user_id', hostId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('호스트 문의 조회 실패:', error)
      return NextResponse.json({ 
        ok: false, 
        code: 'QUERY_ERROR',
        message: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      data: inquiries || []
    })

  } catch (error) {
    console.error('호스트 문의 조회 API 에러:', error)
    return NextResponse.json(
      { ok: false, code: 'QUERY_ERROR', message: 'Failed to load inquiries data' },
      { status: 500 }
    )
  }
})

// 호스트 문의 등록 (POST)
export const POST = withHostAuth(async ({ req, supabase, roleIds }) => {
  try {
    const hostId = roleIds.hostId!
    const { title, category, content } = await req.json()

    // 필수 필드 검증
    if (!title?.trim() || !category || !content?.trim()) {
      return NextResponse.json({ 
        ok: false,
        code: 'MISSING_PARAM',
        message: '필수 필드가 누락되었습니다' 
      }, { status: 400 })
    }

    // 카테고리 검증
    const validCategories = ['accommodation', 'reservation', 'payment', 'technical', 'other']
    if (!validCategories.includes(category)) {
      return NextResponse.json({ 
        ok: false,
        code: 'INVALID_PARAM',
        message: '유효하지 않은 카테고리입니다' 
      }, { status: 400 })
    }

    // 문의 등록
    const { data: inquiry, error: insertError } = await supabase
      .from('inquiries')
      .insert({
        user_type: 'host',
        user_id: hostId,
        user_name: '호스트',
        user_email: '',
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
        ok: false, 
        code: 'QUERY_ERROR',
        message: insertError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      data: inquiry,
      message: '문의가 성공적으로 등록되었습니다'
    })

  } catch (error) {
    console.error('호스트 문의 등록 API 에러:', error)
    return NextResponse.json(
      { ok: false, code: 'QUERY_ERROR', message: 'Failed to create inquiry' },
      { status: 500 }
    )
  }
})