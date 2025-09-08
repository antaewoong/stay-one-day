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

// 문의 답변 조회 (GET)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: replies, error } = await supabaseAdmin
      .from('inquiry_replies')
      .select('*')
      .eq('inquiry_id', params.id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: replies
    })

  } catch (error: any) {
    console.error('문의 답변 조회 실패:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// 문의 답변 작성 (POST)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const {
      content,
      authorId,
      authorName,
      isAdminReply = false
    } = await req.json()

    if (!content || !authorId || !authorName) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다' },
        { status: 400 }
      )
    }

    // 문의사항 존재 확인
    const { data: inquiry, error: inquiryError } = await supabaseAdmin
      .from('inquiries')
      .select('*')
      .eq('id', params.id)
      .single()

    if (inquiryError) throw inquiryError

    // 답변 작성
    const { data: reply, error } = await supabaseAdmin
      .from('inquiry_replies')
      .insert({
        inquiry_id: params.id,
        author_id: authorId,
        author_name: authorName,
        content,
        is_admin_reply: isAdminReply
      })
      .select()

    if (error) throw error

    // 문의 상태 업데이트
    let newStatus = inquiry.status
    if (isAdminReply && inquiry.status === 'pending') {
      newStatus = 'answered'
    }

    await supabaseAdmin
      .from('inquiries')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    // 답변자가 관리자인 경우 문의자에게 알림
    if (isAdminReply && inquiry.inquirer_id) {
      await supabaseAdmin
        .from('host_notifications')
        .insert({
          host_id: inquiry.inquirer_id,
          title: '문의에 대한 답변이 등록되었습니다',
          content: `${inquiry.title} - ${content.substring(0, 50)}...`,
          type: 'inquiry_reply',
          related_id: params.id,
          related_type: 'inquiry'
        })
    }

    // 관리자 로그 (관리자 답변인 경우)
    if (isAdminReply) {
      await supabaseAdmin
        .from('admin_logs')
        .insert({
          admin_id: authorId,
          admin_name: authorName,
          action: '문의 답변',
          target_type: 'inquiry',
          target_id: params.id,
          details: { inquiry_title: inquiry.title }
        })
    }

    return NextResponse.json({
      success: true,
      data: reply[0],
      message: '답변이 작성되었습니다'
    })

  } catch (error: any) {
    console.error('문의 답변 작성 실패:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}