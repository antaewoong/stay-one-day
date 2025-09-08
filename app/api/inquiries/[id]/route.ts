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

// 특정 문의사항 조회 (GET)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: inquiry, error } = await supabaseAdmin
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
      .eq('id', params.id)
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: inquiry
    })

  } catch (error: any) {
    console.error('문의 상세 조회 실패:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// 문의사항 상태 업데이트 (PUT)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status, title, content, category } = await req.json()

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status) updateData.status = status
    if (title) updateData.title = title
    if (content) updateData.content = content
    if (category) updateData.category = category

    const { data, error } = await supabaseAdmin
      .from('inquiries')
      .update(updateData)
      .eq('id', params.id)
      .select()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data[0],
      message: '문의사항이 업데이트되었습니다'
    })

  } catch (error: any) {
    console.error('문의사항 업데이트 실패:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// 문의사항 삭제 (DELETE)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('inquiries')
      .delete()
      .eq('id', params.id)
      .select()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: '문의사항이 삭제되었습니다'
    })

  } catch (error: any) {
    console.error('문의사항 삭제 실패:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}