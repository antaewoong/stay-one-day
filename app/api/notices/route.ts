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

// 공지사항 조회 (GET)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const important = searchParams.get('important') === 'true'
    
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('notices')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (important) {
      query = query.eq('is_important', true)
    }

    const { data: notices, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) throw error

    // 총 개수 조회
    const { count: totalCount } = await supabaseAdmin
      .from('notices')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)

    return NextResponse.json({
      success: true,
      data: notices,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    })

  } catch (error: any) {
    console.error('공지사항 조회 실패:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// 공지사항 생성 (POST) - 관리자만
export async function POST(req: NextRequest) {
  try {
    const { title, content, isImportant = false, authorId, authorName } = await req.json()

    if (!title || !content || !authorId || !authorName) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('notices')
      .insert({
        title,
        content,
        is_important: isImportant,
        author_id: authorId,
        author_name: authorName
      })
      .select()

    if (error) throw error

    // 관리자 로그 기록
    await supabaseAdmin
      .from('admin_logs')
      .insert({
        admin_id: authorId,
        admin_name: authorName,
        action: '공지사항 작성',
        target_type: 'notice',
        target_id: data[0].id,
        details: { title }
      })

    return NextResponse.json({
      success: true,
      data: data[0],
      message: '공지사항이 작성되었습니다'
    })

  } catch (error: any) {
    console.error('공지사항 작성 실패:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}