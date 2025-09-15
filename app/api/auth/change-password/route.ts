export const runtime = 'edge'
import { NextResponse } from 'next/server'
import { getUserClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const supabase = getUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: '현재 비밀번호와 새 비밀번호가 필요합니다' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: '새 비밀번호는 8자 이상이어야 합니다' },
        { status: 400 }
      )
    }

    // 현재 비밀번호 검증
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword
    })

    if (signInError) {
      return NextResponse.json(
        { error: '현재 비밀번호가 올바르지 않습니다' },
        { status: 400 }
      )
    }

    // 비밀번호 변경
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (updateError) {
      return NextResponse.json(
        { error: '비밀번호 변경에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다'
    })

  } catch (error: any) {
    console.error('비밀번호 변경 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}