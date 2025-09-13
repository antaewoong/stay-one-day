import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/middleware/withAdminAuth'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (request: NextRequest, db: any, ctx: any) => {
    try {
      console.log('✅ 관리자 인증 성공:', ctx.admin)
      
      // Service role client 사용
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      const { searchParams } = new URL(request.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const search = searchParams.get('search')
      const status = searchParams.get('status')
      
      const offset = (page - 1) * limit

      // 데이터 조회
      let query = supabaseAdmin
        .from('hosts')
        .select('id,representative_name,business_name,email,phone,business_number,address,status,created_at')
        .order('created_at', { ascending: false })

      // 필터 적용
      if (search) {
        query = query.or(`
          representative_name.ilike.%${search}%,
          business_name.ilike.%${search}%,
          email.ilike.%${search}%
        `)
      }

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      const { data, error } = await query.range(offset, offset + limit - 1)

      if (error) {
        console.error('호스트 조회 실패:', error)
        return NextResponse.json({ error: '호스트 조회에 실패했습니다.' }, { status: 500 })
      }

      // 카운트 조회
      let countQuery = supabaseAdmin
        .from('hosts')
        .select('*', { count: 'exact', head: true })

      if (search) {
        countQuery = countQuery.or(`
          representative_name.ilike.%${search}%,
          business_name.ilike.%${search}%,
          email.ilike.%${search}%
        `)
      }

      if (status && status !== 'all') {
        countQuery = countQuery.eq('status', status)
      }

      const { count, error: countError } = await countQuery

      if (countError) {
        console.error('호스트 카운트 조회 실패:', countError)
      }

      // 각 호스트의 숙소 수 조회
      const hostsWithAccommodationCount = await Promise.all(
        (data || []).map(async (host) => {
          const { count: accommodationCount } = await supabaseAdmin
            .from('accommodations')
            .select('*', { count: 'exact', head: true })
            .eq('host_id', host.id)

          return {
            id: host.id,
            name: host.representative_name || '이름 없음',
            business_name: host.business_name || '',
            email: host.email || '이메일 없음',
            phone: host.phone || '',
            business_number: host.business_number || '',
            address: host.address || '',
            status: host.status || 'pending',
            created_at: host.created_at,
            accommodation_count: accommodationCount || 0
          }
        })
      )

      return NextResponse.json({
        data: hostsWithAccommodationCount || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      })

    } catch (error) {
      console.error('호스트 API 오류:', error)
      return NextResponse.json({ error: '서버 오류가 발생했습니다.', details: error }, { status: 500 })
    }
  })

export const POST = withAdminAuth(async (request: NextRequest, db: any, ctx: any) => {
    try {
      console.log('✅ 관리자 인증 성공:', ctx.admin)
      
      // Service role client 사용
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      const body = await request.json()
      const { name, business_name, email, phone, business_number, address, status = 'pending', password } = body

      if (!name?.trim() || !email?.trim()) {
        return NextResponse.json({ error: '이름과 이메일은 필수입니다.' }, { status: 400 })
      }

      // 1. Supabase Auth에 사용자 생성 (이메일과 비밀번호가 있는 경우)
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
            return NextResponse.json({ error: `인증 시스템 오류: ${authError.message}` }, { status: 400 })
          }

          authUser = authData.user

          // user_roles 테이블에 역할 추가
          await supabaseAdmin
            .from('user_roles')
            .insert({
              user_id: authUser.id,
              role: 'host'
            })

        } catch (authError: any) {
          return NextResponse.json({ error: '인증 계정 생성에 실패했습니다.' }, { status: 400 })
        }
      }

      // 2. hosts 테이블에 정보 저장
      const insertData = {
        auth_user_id: authUser?.id || null,
        representative_name: name,
        business_name: business_name || name,
        business_number: business_number || null,
        email: email,
        phone: phone || null,
        password_hash: password || null,
        address: address || '',
        status: status,
        created_at: new Date().toISOString()
      }

      const { data: host, error: hostError } = await supabaseAdmin
        .from('hosts')
        .insert(insertData)
        .select()
        .single()

      if (hostError) {
        // 호스트 테이블 생성 실패 시 Auth 사용자 롤백
        if (authUser) {
          try {
            await supabaseAdmin.auth.admin.deleteUser(authUser.id)
          } catch (deleteError) {
            console.error('Auth 사용자 삭제 실패:', deleteError)
          }
        }
        return NextResponse.json({ error: `호스트 생성 실패: ${hostError.message}` }, { status: 400 })
      }

      return NextResponse.json({
        data: {
          ...host,
          has_auth_account: !!authUser
        },
        message: authUser 
          ? '호스트 계정이 생성되었습니다. (인증 계정 포함)'
          : '호스트 정보가 저장되었습니다. (인증 계정은 별도 생성 필요)'
      })

    } catch (error) {
      console.error('호스트 생성 API 오류:', error)
      return NextResponse.json({ error: '서버 오류가 발생했습니다.', details: error }, { status: 500 })
    }
  })