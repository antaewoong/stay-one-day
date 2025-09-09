import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET: 특정 공지사항 조회 (조회수 증가)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id } = params

    // 공지사항 조회
    const { data: notice, error } = await supabase
      .from('notices')
      .select('*')
      .eq('id', id)
.eq('status', 'published')
      .single()

    if (error || !notice) {
      return NextResponse.json(
        { error: '공지사항을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 조회수 증가
    await supabase
      .from('notices')
      .update({ view_count: (notice.view_count || 0) + 1 })
      .eq('id', id)

    return NextResponse.json({
      success: true,
      data: {
        ...notice,
        view_count: (notice.view_count || 0) + 1
      }
    })
  } catch (error) {
    console.error('공지사항 조회 API 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 관리자 인증 확인 함수
function checkAdminAuth(request: NextRequest) {
  const adminSession = request.headers.get('x-admin-session')
  
  if (adminSession) {
    try {
      const adminData = JSON.parse(adminSession)
      if (adminData.role === 'admin' || adminData.role === 'super_admin') {
        return { isValid: true, adminId: adminData.id, adminName: adminData.name }
      }
    } catch (error) {
      console.error('Admin session parsing error:', error)
    }
  }
  
  return { isValid: false }
}

// PUT: 공지사항 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 관리자 인증 확인
    const adminAuth = checkAdminAuth(request)
    
    // Supabase 세션 또는 관리자 세션 확인
    const { data: { session } } = await supabase.auth.getSession()
    if (!session && !adminAuth.isValid) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { title, content, is_important, target_audience, is_published } = body

    if (!title?.trim()) {
      return NextResponse.json(
        { error: '제목을 입력해주세요' },
        { status: 400 }
      )
    }

    // 공지사항 수정
    const { data: notice, error } = await supabase
      .from('notices')
      .update({
        title: title.trim(),
        content: content?.trim() || '',
        is_pinned: is_important || false,
        target_audience: target_audience || 'all',
        status: 'published'
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('공지사항 수정 에러:', error)
      return NextResponse.json(
        { error: '공지사항 수정에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: notice })
  } catch (error) {
    console.error('공지사항 수정 API 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// DELETE: 공지사항 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 관리자 인증 확인
    const adminAuth = checkAdminAuth(request)
    
    // Supabase 세션 또는 관리자 세션 확인
    const { data: { session } } = await supabase.auth.getSession()
    if (!session && !adminAuth.isValid) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const { id } = params

    // 공지사항 삭제
    const { error } = await supabase
      .from('notices')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('공지사항 삭제 에러:', error)
      return NextResponse.json(
        { error: '공지사항 삭제에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: '공지사항이 삭제되었습니다' })
  } catch (error) {
    console.error('공지사항 삭제 API 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}