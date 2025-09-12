import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/middleware/withAdminAuth'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// GET: 모든 협업 요청 조회 (관리자용)
export const GET = (req: NextRequest) =>
  withAdminAuth(req, async (request: NextRequest, ctx: any) => {
    try {
      console.log('✅ 관리자 인증 성공:', ctx.adminEmail)
      
      // Service role client 사용 (GPT 권장)
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { searchParams } = new URL(request.url)
      const status = searchParams.get('status') || 'all'
      const limit = parseInt(searchParams.get('limit') || '50')

      // 협업 요청 조회 (안전한 쿼리)
      let query = supabaseAdmin
        .from('influencer_collaboration_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(isNaN(limit) ? 50 : limit)

      // 상태 필터링
      if (status !== 'all') {
        query = query.eq('status', status)
      }

      const { data: requests, error } = await query

      if (error) {
        console.error('협업 요청 조회 에러:', error)
        return NextResponse.json(
          { error: '협업 요청을 불러올 수 없습니다' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: requests || []
      })

    } catch (error) {
      console.error('협업 요청 API 에러:', error)
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다', details: error },
        { status: 500 }
      )
    }
  })

// PUT: 협업 요청 상태 업데이트
export const PUT = (req: NextRequest) =>
  withAdminAuth(req, async (request: NextRequest, ctx: any) => {
    try {
      console.log('✅ 관리자 인증 성공:', ctx.adminEmail)
      
      // Service role client 사용 (GPT 권장)
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const body = await request.json()
      const { request_id, status, admin_notes } = body

      if (!request_id || !status) {
        return NextResponse.json(
          { error: '요청 ID와 상태는 필수입니다' },
          { status: 400 }
        )
      }

      const { data, error } = await supabaseAdmin
        .from('influencer_collaboration_requests')
        .update({
          status,
          admin_notes: admin_notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', request_id)
        .select()
        .single()

      if (error) {
        console.error('협업 요청 업데이트 에러:', error)
        return NextResponse.json(
          { error: '협업 요청 상태 변경에 실패했습니다' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: '협업 요청이 성공적으로 처리되었습니다',
        data
      })

    } catch (error) {
      console.error('협업 요청 업데이트 에러:', error)
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다', details: error },
        { status: 500 }
      )
    }
  })