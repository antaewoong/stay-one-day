import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/middleware/withAdminAuth'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 긴급 데이터 정리 API
export const POST = withAdminAuth(async (req, supabase, { userId, admin }) => {
  try {
    console.log('🚨 긴급 히어로 슬라이드 데이터 정리 시작')

    // 현재 슬라이드 수 확인
    const { count: beforeCount } = await supabaseAdmin
      .from('hero_slides')
      .select('*', { count: 'exact', head: true })

    console.log(`현재 슬라이드 수: ${beforeCount}개`)

    // Service Role로 모든 슬라이드 삭제
    const { error: deleteError } = await supabaseAdmin
      .from('hero_slides')
      .delete()
      .neq('id', '')

    if (deleteError) {
      console.error('삭제 실패:', deleteError)
      return NextResponse.json({ ok: false, error: deleteError.message }, { status: 500 })
    }

    // 삭제 후 확인
    const { count: afterCount } = await supabaseAdmin
      .from('hero_slides')
      .select('*', { count: 'exact', head: true })

    console.log(`정리 후 슬라이드 수: ${afterCount}개`)

    return NextResponse.json({
      ok: true,
      message: '긴급 데이터 정리 완료',
      beforeCount,
      afterCount,
      deletedCount: (beforeCount || 0) - (afterCount || 0)
    })

  } catch (error) {
    console.error('긴급 정리 실패:', error)
    return NextResponse.json({
      ok: false,
      error: '긴급 정리 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
})