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

// 문의사항 조회 (GET)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const userId = searchParams.get('userId') // 사용자별 문의 조회
    
    const offset = (page - 1) * limit

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
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (userId) {
      query = query.eq('inquirer_id', userId)
    }

    const { data: inquiries, error } = await query
      .range(offset, offset + limit - 1)

    if (error) throw error

    // 총 개수 조회
    let countQuery = supabaseAdmin
      .from('inquiries')
      .select('*', { count: 'exact', head: true })

    if (status) countQuery = countQuery.eq('status', status)
    if (category) countQuery = countQuery.eq('category', category)
    if (userId) countQuery = countQuery.eq('inquirer_id', userId)

    const { count: totalCount } = await countQuery

    return NextResponse.json({
      success: true,
      data: inquiries,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    })

  } catch (error: any) {
    console.error('문의사항 조회 실패:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// 문의사항 생성 (POST)
export async function POST(req: NextRequest) {
  try {
    const {
      title,
      content,
      category = 'general',
      inquirerId,
      inquirerName,
      inquirerEmail,
      inquirerPhone
    } = await req.json()

    if (!title || !content || !inquirerName || !inquirerEmail) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('inquiries')
      .insert({
        title,
        content,
        category,
        inquirer_id: inquirerId,
        inquirer_name: inquirerName,
        inquirer_email: inquirerEmail,
        inquirer_phone: inquirerPhone,
        status: 'pending'
      })
      .select()

    if (error) throw error

    // 호스트에게 알림 (호스트 관련 문의인 경우)
    if (inquirerId && category === 'host') {
      await supabaseAdmin
        .from('host_notifications')
        .insert({
          host_id: inquirerId,
          title: '새로운 문의가 접수되었습니다',
          content: `${title} - ${content.substring(0, 50)}...`,
          type: 'inquiry',
          related_id: data[0].id,
          related_type: 'inquiry'
        })
    }

    return NextResponse.json({
      success: true,
      data: data[0],
      message: '문의사항이 접수되었습니다'
    })

  } catch (error: any) {
    console.error('문의사항 생성 실패:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}