// GPT 제안대로 withAdminAuth 미들웨어 사용하여 완전 재작성
import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/middleware/withAdminAuth'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// GPT 제안: 미들웨어를 사용한 GET 핸들러 - 숙소 목록 조회
export const GET = (req: NextRequest) =>
  withAdminAuth(req, async (req: NextRequest, ctx: any) => {
    try {
      console.log('✅ 관리자 숙소 조회 인증 성공:', ctx.adminEmail)
      
      // Service role client 사용 (GPT 제안대로 RLS 우회)
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // 숙소 목록 조회 (관리자는 모든 숙소 접근 가능)
      const { data: accommodations, error } = await supabaseAdmin
        .from('accommodations')
        .select('id, name, region as location, status')
        .eq('status', 'active')
        .order('name')

      if (error) {
        console.error('숙소 목록 조회 에러:', error)
        return NextResponse.json(
          { error: '숙소 목록을 불러올 수 없습니다', details: error },
          { status: 500 }
        )
      }

      console.log(`✅ 숙소 목록 조회 성공: ${accommodations?.length || 0}개 숙소`)

      return NextResponse.json({
        success: true,
        data: accommodations || []
      })

    } catch (error) {
      console.error('숙소 목록 조회 에러:', error)
      return NextResponse.json(
        { error: '숙소 목록을 불러올 수 없습니다', details: error },
        { status: 500 }
      )
    }
  })