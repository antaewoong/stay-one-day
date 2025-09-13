import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/middleware/withAdminAuth'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
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
      
      const offset = (page - 1) * limit

      // 데이터 조회
      let query = supabaseAdmin
        .from('admin_accounts')
        .select('id,email,role,is_active,created_at,last_login')
        .order('created_at', { ascending: false })

      // 검색 필터링
      if (search) {
        query = query.ilike('email', `%${search}%`)
      }

      const { data, error } = await query.range(offset, offset + limit - 1)

      if (error) {
        console.error('관리자 조회 실패:', error)
        return NextResponse.json({ error: '관리자 조회에 실패했습니다.' }, { status: 500 })
      }

      // 카운트 조회 (별도 쿼리)
      let countQuery = supabaseAdmin
        .from('admin_accounts')
        .select('*', { count: 'exact', head: true })

      if (search) {
        countQuery = countQuery.ilike('email', `%${search}%`)
      }

      const { count, error: countError } = await countQuery

      if (countError) {
        console.error('관리자 카운트 조회 실패:', countError)
      }

      return NextResponse.json({
        success: true,
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      })

    } catch (error) {
      console.error('관리자 API 오류:', error)
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
      const { email, password, role = 'admin' } = body

      if (!email?.trim() || !password?.trim()) {
        return NextResponse.json({ error: '이메일과 비밀번호는 필수입니다' }, { status: 400 })
      }

      // 1. Supabase Auth에 관리자 계정 생성
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email.trim(),
        password: password,
        email_confirm: true,
        user_metadata: {
          role: role
        }
      })

      if (authError) {
        return NextResponse.json({ error: `인증 시스템 오류: ${authError.message}` }, { status: 400 })
      }

      // 2. admin_accounts 테이블에 관리자 정보 저장
      const { data: admin, error: adminError } = await supabaseAdmin
        .from('admin_accounts')
        .insert({
          auth_user_id: authData.user.id,
          email: email.trim(),
          role: role,
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (adminError) {
        // 관리자 테이블 생성 실패 시 Auth 사용자 롤백
        try {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        } catch (deleteError) {
          console.error('Auth 관리자 삭제 실패:', deleteError)
        }
        return NextResponse.json({ error: `관리자 생성 실패: ${adminError.message}` }, { status: 400 })
      }

      return NextResponse.json({
        data: admin,
        message: '관리자 계정이 생성되었습니다'
      })

    } catch (error) {
      console.error('관리자 생성 API 오류:', error)
      return NextResponse.json({ error: '서버 오류가 발생했습니다.', details: error }, { status: 500 })
    }
  })