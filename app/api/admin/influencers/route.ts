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
      const status = searchParams.get('status')
      const category = searchParams.get('content_category')
      const search = searchParams.get('search')
      
      const offset = (page - 1) * limit

      // 데이터 조회
      let query = supabaseAdmin
        .from('influencers')
        .select('id,name,email,phone,instagram_handle,youtube_channel,tiktok_handle,follower_count,engagement_rate,content_category,status,created_at')
        .order('created_at', { ascending: false })

      // 필터 적용
      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      if (category && category !== 'all') {
        query = query.eq('content_category', category)
      }

      if (search) {
        query = query.or(`
          name.ilike.%${search}%,
          email.ilike.%${search}%,
          instagram_handle.ilike.%${search}%
        `)
      }

      const { data, error } = await query.range(offset, offset + limit - 1)

      if (error) {
        console.error('인플루언서 조회 실패:', error)
        return NextResponse.json({ error: '인플루언서 조회에 실패했습니다.' }, { status: 500 })
      }

      // 카운트 조회 (별도 쿼리)
      let countQuery = supabaseAdmin
        .from('influencers')
        .select('*', { count: 'exact', head: true })

      if (status && status !== 'all') {
        countQuery = countQuery.eq('status', status)
      }

      if (category && category !== 'all') {
        countQuery = countQuery.eq('content_category', category)
      }

      if (search) {
        countQuery = countQuery.or(`
          name.ilike.%${search}%,
          email.ilike.%${search}%,
          instagram_handle.ilike.%${search}%
        `)
      }

      const { count, error: countError } = await countQuery

      if (countError) {
        console.error('인플루언서 카운트 조회 실패:', countError)
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
      console.error('인플루언서 API 오류:', error)
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
      const { name, email, phone, instagram_handle, youtube_channel, tiktok_handle, follower_count, engagement_rate, content_category, password } = body

      if (!name?.trim() || !email?.trim()) {
        return NextResponse.json({ error: '이름과 이메일은 필수입니다.' }, { status: 400 })
      }

      // 1. Supabase Auth에 인플루언서 계정 생성
      let authUser = null
      const defaultPassword = password || 'influencer123!'

      try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: defaultPassword,
          email_confirm: true,
          user_metadata: {
            name: name,
            role: 'influencer'
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
            role: 'influencer'
          })

      } catch (authError: any) {
        return NextResponse.json({ error: '인증 계정 생성에 실패했습니다.' }, { status: 400 })
      }

      // 2. 인플루언서 테이블에 정보 저장
      const insertData = {
        auth_user_id: authUser?.id || null,
        name: name,
        email: email,
        phone: phone || null,
        password_hash: defaultPassword,
        instagram_handle: instagram_handle || null,
        youtube_channel: youtube_channel || null,
        tiktok_handle: tiktok_handle || null,
        follower_count: follower_count || 0,
        engagement_rate: engagement_rate || 0,
        content_category: content_category || null,
        status: 'active'
      }

      const { data: influencer, error: influencerError } = await supabaseAdmin
        .from('influencers')
        .insert(insertData)
        .select()
        .single()

      if (influencerError) {
        // 인플루언서 테이블 생성 실패 시 Auth 사용자 롤백
        if (authUser) {
          try {
            await supabaseAdmin.auth.admin.deleteUser(authUser.id)
          } catch (deleteError) {
            console.error('Auth 인플루언서 삭제 실패:', deleteError)
          }
        }
        return NextResponse.json({ error: `인플루언서 생성 실패: ${influencerError.message}` }, { status: 400 })
      }

      return NextResponse.json({
        data: influencer,
        message: '인플루언서가 성공적으로 추가되었습니다'
      })

    } catch (error) {
      console.error('인플루언서 생성 API 오류:', error)
      return NextResponse.json({ error: '서버 오류가 발생했습니다.', details: error }, { status: 500 })
    }
  })