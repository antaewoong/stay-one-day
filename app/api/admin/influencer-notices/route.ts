import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/middleware/withAdminAuth'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (request: NextRequest, db: any, ctx: any) => {
    try {
      console.log('✅ 관리자 인증 성공:', ctx.admin)
      
      // Service role client 사용
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      const { searchParams } = new URL(request.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const status = searchParams.get('status')
      const type = searchParams.get('type')
      
      const offset = (page - 1) * limit

      // 데이터 조회
      let query = supabaseAdmin
        .from('influencer_notices')
        .select('*')
        .order('created_at', { ascending: false })

      // 상태 필터링
      if (status === 'active') {
        query = query.eq('is_active', true)
      } else if (status === 'inactive') {
        query = query.eq('is_active', false)
      }

      // 타입 필터링
      if (type && type !== 'all') {
        query = query.eq('notice_type', type)
      }

      const { data, error } = await query.range(offset, offset + limit - 1)

      if (error) {
        console.error('인플루언서 공지사항 조회 실패:', error)
        return NextResponse.json({ error: '인플루언서 공지사항 조회에 실패했습니다.' }, { status: 500 })
      }

      // 카운트 조회 (별도 쿼리)
      let countQuery = supabaseAdmin
        .from('influencer_notices')
        .select('*', { count: 'exact', head: true })

      if (status === 'active') {
        countQuery = countQuery.eq('is_active', true)
      } else if (status === 'inactive') {
        countQuery = countQuery.eq('is_active', false)
      }

      if (type && type !== 'all') {
        countQuery = countQuery.eq('notice_type', type)
      }

      const { count, error: countError } = await countQuery

      if (countError) {
        console.error('인플루언서 공지사항 카운트 조회 실패:', countError)
      }

      return NextResponse.json({
        success: true,
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      })

    } catch (error) {
      console.error('인플루언서 공지사항 API 오류:', error)
      return NextResponse.json({ error: '서버 오류가 발생했습니다.', details: error }, { status: 500 })
    }
  })

export const POST = withAdminAuth(async (request: NextRequest, db: any, ctx: any) => {
    try {
      console.log('✅ 관리자 인증 성공:', ctx.admin)
      
      // Service role client 사용
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      const body = await request.json()
      const { title, content, notice_type, target_month, target_year, is_active = true } = body

      if (!title?.trim() || !content?.trim()) {
        return NextResponse.json({ error: '제목과 내용은 필수입니다.' }, { status: 400 })
      }

      const { data: notice, error } = await supabaseAdmin
        .from('influencer_notices')
        .insert({
          title: title,
          content: content,
          notice_type: notice_type || null,
          target_month: target_month || null,
          target_year: target_year || null,
          is_active: is_active,
          created_by: ctx.admin?.auth_user_id || ctx.userId
        })
        .select()
        .single()

      if (error) {
        console.error('인플루언서 공지사항 생성 실패:', error)
        return NextResponse.json({ error: `공지사항 생성 실패: ${error.message}` }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        data: notice,
        message: '공지사항이 성공적으로 생성되었습니다'
      })

    } catch (error) {
      console.error('인플루언서 공지사항 생성 API 오류:', error)
      return NextResponse.json({ error: '서버 오류가 발생했습니다.', details: error }, { status: 500 })
    }
  })

export const DELETE = withAdminAuth(async (request: NextRequest, db: any, ctx: any) => {
    try {
      console.log('✅ 관리자 인증 성공:', ctx.admin)
      
      // Service role client 사용
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      const searchParams = new URL(request.url).searchParams
      const id = searchParams.get('id')
      
      if (!id) {
        return NextResponse.json({ error: 'ID가 필요합니다' }, { status: 400 })
      }

      const { error } = await supabaseAdmin
        .from('influencer_notices')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('인플루언서 공지사항 삭제 실패:', error)
        return NextResponse.json({ error: `공지사항 삭제 실패: ${error.message}` }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: '공지사항이 삭제되었습니다'
      })

    } catch (error) {
      console.error('인플루언서 공지사항 삭제 API 오류:', error)
      return NextResponse.json({ error: '서버 오류가 발생했습니다.', details: error }, { status: 500 })
    }
  })