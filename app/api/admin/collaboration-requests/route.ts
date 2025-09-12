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
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const offset = (page - 1) * limit

      // 협업 요청 조회 (인플루언서, 숙소, 호스트 정보 포함)
      let query = supabaseAdmin
        .from('influencer_collaboration_requests')
        .select(`
          *,
          influencer:influencers!inner(
            id,
            name,
            email,
            phone,
            instagram_handle,
            follower_count,
            content_category,
            profile_image_url,
            location
          ),
          accommodation:accommodations!inner(
            id,
            name,
            location,
            price_per_night
          ),
          host:hosts!inner(
            id,
            business_name,
            name,
            phone,
            email
          )
        `)
        .order('created_at', { ascending: false })

      // 상태 필터링
      if (status !== 'all') {
        query = query.eq('status', status)
      }

      const { data: requests, error, count } = await query
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('협업 요청 조회 에러:', error)
        return NextResponse.json(
          { error: '협업 요청을 불러올 수 없습니다' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: requests || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      })
    } catch (error) {
      console.error('관리자 협업 요청 API 에러:', error)
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다' },
        { status: 500 }
      )
    }
  })