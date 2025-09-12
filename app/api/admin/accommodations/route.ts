import { NextRequest, NextResponse } from 'next/server'
import { validateAdminAuth } from '@/lib/auth/admin-service'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Service role client for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const authResult = await validateAdminAuth(request)
    if (!authResult.isValid || !authResult.isAdmin) {
      return authResult.error || NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 401 }
      )
    }

    // 숙소 목록 조회 (관리자는 모든 숙소 접근 가능)
    const { data: accommodations, error } = await supabaseAdmin
      .from('accommodations')
      .select('id, name, region as location, status')
      .eq('status', 'active')
      .order('name')

    if (error) {
      console.error('숙소 목록 조회 에러:', error)
      return NextResponse.json(
        { error: '숙소 목록을 불러올 수 없습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: accommodations || []
    })

  } catch (error) {
    console.error('숙소 목록 조회 에러:', error)
    return NextResponse.json(
      { error: '숙소 목록을 불러올 수 없습니다' },
      { status: 500 }
    )
  }
}