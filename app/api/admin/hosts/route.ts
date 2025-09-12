import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/middleware/withAdminAuth'
import { createClient } from '@supabase/supabase-js'

export const GET = (req: NextRequest) =>
  withAdminAuth(req, async (request: NextRequest, ctx: any) => {
    try {
      console.log('✅ 관리자 인증 성공:', ctx.adminEmail)
      
      // Service role client 사용 (GPT 권장)
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      // Service Role로 RLS 우회하여 호스트 목록 조회
      const { data: hostData, error: hostsError } = await supabaseAdmin
      .from('hosts')
      .select(`
        id,
        representative_name,
        email,
        phone,
        business_name,
        business_number,
        address,
        status,
        host_id,
        password_hash,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (hostsError) {
      console.error('호스트 조회 오류:', hostsError)
      return NextResponse.json(
        { error: hostsError.message },
        { status: 400 }
      )
    }

    // 각 호스트의 숙소 수를 별도로 조회
    const hostsWithAccommodationCount = await Promise.all(
      (hostData || []).map(async (host) => {
        const { count } = await supabaseAdmin
          .from('accommodations')
          .select('id', { count: 'exact' })
          .eq('host_id', host.id)

        return {
          ...host,
          accommodation_count: count || 0
        }
      })
    )

    // 호스트 데이터 형식 변환
    const hosts = hostsWithAccommodationCount.map((host) => ({
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
      accommodation_count: host.accommodation_count
    }))

    return NextResponse.json({ 
      success: true,
      hosts,
      count: hosts.length
    })
  } catch (error) {
    console.error('호스트 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error },
      { status: 500 }
    )
  }
})

export const POST = (req: NextRequest) =>
  withAdminAuth(req, async (request: NextRequest, ctx: any) => {
    try {
      console.log('✅ 관리자 인증 성공:', ctx.adminEmail)
      
      // Service role client 사용 (GPT 권장)
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    const body = await request.json()
    const { name, email, phone, password, business_name, business_number, address, status } = body

    // 1. 먼저 Supabase Auth에 사용자 생성
    let authUser = null
    if (email && password) {
      try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true,
          user_metadata: {
            name: name,
            role: 'host',
            business_name: business_name || name
          }
        })

        if (authError) {
          console.error('Supabase Auth 사용자 생성 실패:', authError)
          return NextResponse.json(
            { error: `인증 시스템 오류: ${authError.message}` },
            { status: 400 }
          )
        }

        authUser = authData.user
        console.log('✅ Supabase Auth 사용자 생성 성공:', authUser.id)

        // user_roles 테이블에 역할 추가
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: authUser.id,
            role: 'host'
          })

        if (roleError && !roleError.message.includes('duplicate')) {
          console.error('사용자 역할 설정 실패:', roleError.message)
        }
      } catch (authCreateError) {
        console.error('Auth 생성 중 오류:', authCreateError)
        return NextResponse.json(
          { error: '인증 계정 생성에 실패했습니다.' },
          { status: 400 }
        )
      }
    }

    // 2. hosts 테이블에 정보 저장 (auth_user_id 포함)
    const hostData = {
      auth_user_id: authUser?.id || null, // Supabase Auth ID 연결
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

    const { data: host, error: hostError } = await supabaseAdmin
      .from('hosts')
      .insert(hostData)
      .select()
      .single()

    console.log('Supabase 응답:', { host, error: hostError })

    if (hostError) {
      console.error('호스트 생성 오류:', hostError)
      
      // 호스트 테이블 생성 실패 시 Auth 사용자도 삭제
      if (authUser) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(authUser.id)
          console.log('❌ Auth 사용자 롤백 완료')
        } catch (deleteError) {
          console.error('Auth 사용자 삭제 실패:', deleteError)
        }
      }
      
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

    console.log('✅ 호스트 생성 완료 (Auth + DB):', host)

    return NextResponse.json({ 
      success: true, 
      host: {
        ...host,
        has_auth_account: !!authUser
      },
      message: authUser 
        ? '호스트 계정이 생성되었습니다. (인증 계정 포함)'
        : '호스트 정보가 저장되었습니다. (인증 계정은 별도 생성 필요)'
    })
  } catch (error) {
    console.error('호스트 등록 실패:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error },
      { status: 500 }
    )
  }
})

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

    const { data: host, error: hostError } = await supabaseAdmin
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
      { error: '서버 오류가 발생했습니다.', details: error },
      { status: 500 }
    )
  }
})