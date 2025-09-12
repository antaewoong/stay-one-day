import { NextRequest, NextResponse } from 'next/server'
import { validateAdminAuth, supabaseService } from '@/lib/auth/admin-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userType = searchParams.get('userType') // 'all', 'host', 'customer'
    const status = searchParams.get('status') // 'all', 'pending', 'processing', 'completed'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 기본 쿼리 - 호스트와 고객 정보 조인
    let query = supabaseService
      .from('inquiries')
      .select(`
        *,
        host_info:hosts(business_name, representative_name, email),
        customer_info:users(name, email)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 사용자 유형 필터
    if (userType && userType !== 'all') {
      query = query.eq('user_type', userType)
    }

    // 상태 필터  
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: inquiriesData, error: inquiriesError } = await query

    if (inquiriesError) {
      console.error('문의사항 조회 오류:', inquiriesError)
      return NextResponse.json(
        { error: inquiriesError.message },
        { status: 400 }
      )
    }

    // 추가 정보 매핑
    const enrichedInquiries = inquiriesData?.map(inquiry => ({
      ...inquiry,
      user_name: inquiry.user_type === 'host' 
        ? inquiry.host_info?.business_name || '알 수 없음'
        : inquiry.customer_info?.name || '알 수 없음',
      user_email: inquiry.user_type === 'host'
        ? inquiry.host_info?.email || ''
        : inquiry.customer_info?.email || '',
      user_display: inquiry.user_type === 'host'
        ? `${inquiry.host_info?.business_name} (${inquiry.host_info?.representative_name})`
        : inquiry.customer_info?.name || '고객'
    })) || []

    // 통계 정보
    const { data: stats } = await supabaseService
      .from('inquiries')
      .select('status, user_type')

    const statistics = {
      total: stats?.length || 0,
      pending: stats?.filter(s => s.status === 'pending').length || 0,
      processing: stats?.filter(s => s.status === 'processing').length || 0,
      completed: stats?.filter(s => s.status === 'completed').length || 0,
      host_inquiries: stats?.filter(s => s.user_type === 'host').length || 0,
      customer_inquiries: stats?.filter(s => s.user_type === 'customer').length || 0
    }

    return NextResponse.json({ 
      success: true,
      inquiries: enrichedInquiries,
      count: enrichedInquiries.length,
      statistics,
      pagination: {
        offset,
        limit,
        hasMore: inquiriesData?.length === limit
      }
    })
  } catch (error) {
    console.error('문의사항 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  // 관리자 인증 확인
  const authResult = await validateAdminAuth(request)
  if (!authResult.isValid) {
    return authResult.error!
  }

  try {
    const body = await request.json()
    const { id, status, admin_response, priority } = body

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status) updateData.status = status
    if (admin_response) {
      updateData.admin_response = admin_response
      updateData.responded_at = new Date().toISOString()
      updateData.admin_id = authResult.adminId || null
    }
    if (priority) updateData.priority = priority

    const { data: inquiry, error: inquiryError } = await supabaseService
      .from('inquiries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (inquiryError) {
      console.error('문의사항 업데이트 오류:', inquiryError)
      return NextResponse.json(
        { error: `데이터베이스 오류: ${inquiryError.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      inquiry,
      message: '문의사항이 업데이트되었습니다.'
    })
  } catch (error) {
    console.error('문의사항 업데이트 실패:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}