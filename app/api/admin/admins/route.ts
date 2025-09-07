import { NextRequest, NextResponse } from 'next/server'
import { validateAdminAuth, supabaseService } from '@/lib/auth/admin-service'

export async function GET() {
  try {
    const { data: admins, error } = await supabaseService
      .from('admin_accounts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get admins error:', error)
      return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 })
    }

    return NextResponse.json({ admins })
  } catch (error) {
    console.error('Get admins error:', error)
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // 관리자 인증 확인
  const authResult = await validateAdminAuth(request)
  if (!authResult.isValid) {
    return authResult.error!
  }

  try {
    const body = await request.json()
    const { username, password, name, email, role = 'admin' } = body

    if (!username || !password || !name) {
      return NextResponse.json(
        { error: '필수 필드를 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseService
      .from('admin_accounts')
      .insert({
        username,
        password_hash: password, // 실제로는 bcrypt 해시화 필요
        name,
        email,
        role,
        is_active: true
      })
      .select()

    if (error) {
      console.error('Create admin error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create admin' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, admin: data[0] })
  } catch (error) {
    console.error('Create admin error:', error)
    return NextResponse.json(
      { error: 'Failed to create admin' },
      { status: 500 }
    )
  }
}