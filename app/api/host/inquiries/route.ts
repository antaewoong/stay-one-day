import { NextRequest, NextResponse } from 'next/server'
import { withHostAuth } from '@/lib/auth/withHostAuth'
import { createClient } from '@supabase/supabase-js'
import { NotificationHelpers } from '@/lib/telegram/notification-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: 호스트의 문의사항 조회
export const GET = withHostAuth(async ({ req, supabase, roleIds }) => {
  try {
    const hostId = roleIds.hostId!
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')

    const offset = (page - 1) * limit

    // Service role client 사용
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 호스트 정보로 host_id(문자열) 가져오기
    const { data: hostData } = await supabaseAdmin
      .from('hosts')
      .select('host_id')
      .eq('id', hostId)
      .single()

    if (!hostData) {
      return NextResponse.json(
        { success: false, error: '호스트 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    let query = supabaseAdmin
      .from('inquiries')
      .select(`
        *,
        inquiry_replies (
          id,
          content,
          author_name,
          is_admin_reply,
          created_at
        )
      `)
      .eq('user_type', 'host')
      .eq('user_id', hostData.host_id)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: inquiries, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error('호스트 문의사항 조회 실패:', error)
      return NextResponse.json(
        { success: false, error: '문의사항 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    // 총 개수 조회
    let countQuery = supabaseAdmin
      .from('inquiries')
      .select('*', { count: 'exact', head: true })
      .eq('user_type', 'host')
      .eq('user_id', hostData.host_id)

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status)
    }

    const { count: totalCount } = await countQuery

    return NextResponse.json({
      success: true,
      data: inquiries || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    })

  } catch (error) {
    console.error('호스트 문의사항 API 에러:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
})

// POST: 호스트 문의사항 생성
export const POST = withHostAuth(async ({ req, supabase, roleIds, user }) => {
  try {
    const hostId = roleIds.hostId!
    const {
      title,
      content,
      category = 'general',
      priority = 'medium'
    } = await req.json()

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: '제목과 내용은 필수입니다' },
        { status: 400 }
      )
    }

    // Service role client 사용
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 호스트 정보 가져오기
    const { data: hostData } = await supabaseAdmin
      .from('hosts')
      .select('host_id, business_name, email, representative_name, phone')
      .eq('id', hostId)
      .single()

    if (!hostData) {
      return NextResponse.json(
        { success: false, error: '호스트 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 문의사항 생성
    const { data: inquiry, error } = await supabaseAdmin
      .from('inquiries')
      .insert({
        title,
        content,
        category,
        priority,
        user_type: 'host',
        user_id: hostData.host_id,
        contact_name: hostData.representative_name || hostData.business_name,
        contact_email: hostData.email,
        contact_phone: hostData.phone,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('호스트 문의사항 생성 실패:', error)
      return NextResponse.json(
        { success: false, error: '문의사항 등록에 실패했습니다' },
        { status: 500 }
      )
    }

    // 텔레그램 알림 전송 (비동기 처리)
    NotificationHelpers.notifyNewInquiry({
      id: inquiry.id,
      type: 'host',
      customer_name: hostData.representative_name || hostData.business_name,
      email: hostData.email,
      phone: hostData.phone,
      content: `${title}\n\n${content}`,
      property_id: hostData.host_id
    }).catch(error => {
      console.error('호스트 문의 알림 전송 실패:', error)
    })

    return NextResponse.json({
      success: true,
      data: inquiry,
      message: '문의사항이 성공적으로 접수되었습니다'
    })

  } catch (error) {
    console.error('호스트 문의사항 생성 API 에러:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
})