import { NextRequest, NextResponse } from 'next/server'
import { validateAdminAuth, supabaseService } from '@/lib/auth/admin-service'

export async function GET() {
  try {
    const { data, error } = await supabaseService
      .from('hero_slides')
      .select('*')
      .order('slide_order', { ascending: true })

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch slides' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // 관리자 인증 확인
  const authResult = await validateAdminAuth(request)
  if (!authResult.isValid) {
    return authResult.error!
  }

  try {
    const slides = await request.json()
    // 기존 슬라이드 모두 삭제
    await supabaseService.from('hero_slides').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // 새 슬라이드들 삽입
    const { data, error } = await supabaseService
      .from('hero_slides')
      .insert(slides)

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save slides' }, { status: 500 })
  }
}