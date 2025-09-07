import { NextRequest, NextResponse } from 'next/server'
import { validateAdminAuth, supabaseService } from '@/lib/auth/admin-service'

export async function GET() {
  try {
    // Service Role로 RLS 우회하여 호스트 목록 조회
    const { data: hostData, error: hostsError } = await supabaseService
      .from('hosts')
      .select('*')
      .order('created_at', { ascending: false })

    if (hostsError) {
      console.error('호스트 조회 오류:', hostsError)
      return NextResponse.json(
        { error: hostsError.message },
        { status: 400 }
      )
    }

    // 호스트 데이터 형식 변환
    const hosts = (hostData || []).map((host) => ({
      id: host.id,
      name: host.representative_name || '이름 없음',
      email: host.email || '이메일 없음',
      phone: host.phone || '',
      business_name: host.business_name || '',
      business_number: host.business_number || '',
      address: host.address || '',
      status: host.status || 'pending',
      host_id: host.host_id || null,
      password: host.password_hash || null,
      created_at: host.created_at,
      accommodation_count: 0
    }))

    return NextResponse.json({ 
      success: true,
      hosts,
      count: hosts.length
    })
  } catch (error) {
    console.error('호스트 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
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
    const { name, email, phone, password, business_name, business_number, address, status } = body

    // hosts 테이블에 정보 저장
    const hostData = {
      business_name: business_name || name,
      business_number: business_number || null,
      representative_name: name,
      phone,
      email,
      password_hash: password,
      address: address || '',
      status: status || 'pending',
      created_at: new Date().toISOString()
    }

    console.log('저장할 호스트 데이터:', hostData)

    const { data: host, error: hostError } = await supabaseService
      .from('hosts')
      .insert(hostData)
      .select()
      .single()

    console.log('Supabase 응답:', { host, error: hostError })

    if (hostError) {
      console.error('호스트 생성 오류:', hostError)
      return NextResponse.json(
        { error: `데이터베이스 오류: ${hostError.message}` },
        { status: 400 }
      )
    }

    if (!host) {
      console.error('호스트 데이터가 생성되지 않음')
      return NextResponse.json(
        { error: '호스트 데이터 생성 실패' },
        { status: 400 }
      )
    }

    console.log('호스트 생성 성공:', host)

    return NextResponse.json({ 
      success: true, 
      host,
      message: '호스트 계정이 생성되었습니다.'
    })
  } catch (error) {
    console.error('호스트 등록 실패:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  // 관리자 인증 확인
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const token = authHeader.replace('Bearer ', '')
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD
  
  // 슈퍼 어드민 패스워드 체크
  if (token !== adminPassword) {
    // JWT 토큰으로 관리자 권한 확인
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single()
      
      if (adminError || !adminUser || !['admin', 'super_admin', 'manager'].includes(adminUser.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const body = await request.json()
    const { id, name, email, phone, password, host_id, business_name, business_number, address, status } = body

    // hosts 테이블 정보 업데이트
    const hostData = {
      business_name: business_name || name,
      business_number: business_number || null,
      representative_name: name,
      phone,
      email,
      host_id: host_id || null,
      password_hash: password || null,
      address: address || '',
      status: status || 'pending'
    }

    console.log('업데이트할 호스트 데이터:', hostData)

    const { data: host, error: hostError } = await supabaseService
      .from('hosts')
      .update(hostData)
      .eq('id', id)
      .select()
      .single()

    if (hostError) {
      console.error('호스트 업데이트 오류:', hostError)
      return NextResponse.json(
        { error: `데이터베이스 오류: ${hostError.message}` },
        { status: 400 }
      )
    }

    console.log('호스트 업데이트 성공:', host)

    return NextResponse.json({ 
      success: true, 
      host,
      message: '호스트 정보가 업데이트되었습니다.'
    })
  } catch (error) {
    console.error('호스트 업데이트 실패:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}