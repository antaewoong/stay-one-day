import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// 특정 공지사항 조회 (GET)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: notice, error } = await supabaseAdmin
      .from('notices')
      .select('*')
      .eq('id', params.id)
      .eq('is_published', true)
      .single()

    if (error) throw error

    // 조회수 증가
    await supabaseAdmin
      .from('notices')
      .update({ view_count: notice.view_count + 1 })
      .eq('id', params.id)

    return NextResponse.json({
      success: true,
      data: { ...notice, view_count: notice.view_count + 1 }
    })

  } catch (error: any) {
    console.error('공지사항 상세 조회 실패:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// 공지사항 수정 (PUT) - 관리자만
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { title, content, isImportant, authorId, authorName } = await req.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: '제목과 내용은 필수입니다' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('notices')
      .update({
        title,
        content,
        is_important: isImportant,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()

    if (error) throw error

    // 관리자 로그 기록
    if (authorId && authorName) {
      await supabaseAdmin
        .from('admin_logs')
        .insert({
          admin_id: authorId,
          admin_name: authorName,
          action: '공지사항 수정',
          target_type: 'notice',
          target_id: params.id,
          details: { title }
        })
    }

    return NextResponse.json({
      success: true,
      data: data[0],
      message: '공지사항이 수정되었습니다'
    })

  } catch (error: any) {
    console.error('공지사항 수정 실패:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// 공지사항 삭제 (DELETE) - 관리자만
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const authorId = searchParams.get('authorId')
    const authorName = searchParams.get('authorName')

    // 소프트 삭제 (is_published = false)
    const { data, error } = await supabaseAdmin
      .from('notices')
      .update({ is_published: false })
      .eq('id', params.id)
      .select('title')

    if (error) throw error

    // 관리자 로그 기록
    if (authorId && authorName && data[0]) {
      await supabaseAdmin
        .from('admin_logs')
        .insert({
          admin_id: authorId,
          admin_name: authorName,
          action: '공지사항 삭제',
          target_type: 'notice',
          target_id: params.id,
          details: { title: data[0].title }
        })
    }

    return NextResponse.json({
      success: true,
      message: '공지사항이 삭제되었습니다'
    })

  } catch (error: any) {
    console.error('공지사항 삭제 실패:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}