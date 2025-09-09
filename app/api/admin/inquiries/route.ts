import { NextRequest, NextResponse } from 'next/server'
import { validateAdminAuth, supabaseService } from '@/lib/auth/admin-service'

export async function GET() {
  try {
    // Service Role로 RLS 우회하여 문의사항 목록 조회
    const { data: inquiriesData, error: inquiriesError } = await supabaseService
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false })

    if (inquiriesError) {
      console.error('문의사항 조회 오류:', inquiriesError)
      return NextResponse.json(
        { error: inquiriesError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true,
      inquiries: inquiriesData || [],
      count: inquiriesData?.length || 0
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