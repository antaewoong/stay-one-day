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

// 리뷰에 답글 작성 (POST)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const {
      reply,
      hostId,
      hostName
    } = await req.json()

    if (!reply || !hostId || !hostName) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다' },
        { status: 400 }
      )
    }

    // 리뷰 존재 확인
    const { data: review, error: reviewError } = await supabaseAdmin
      .from('reviews')
      .select(`
        id,
        accommodations (
          host_id
        )
      `)
      .eq('id', params.id)
      .single()

    if (reviewError) throw reviewError

    // 호스트 권한 확인
    if (review.accommodations?.host_id !== hostId) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    // 답글 업데이트
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .update({
        host_reply: reply,
        reply_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data[0],
      message: '답글이 등록되었습니다'
    })

  } catch (error: any) {
    console.error('리뷰 답글 작성 실패:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}