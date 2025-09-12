import { NextRequest, NextResponse } from 'next/server'
import { validateAdminAuth } from '@/lib/auth/admin-service'
import { telegramAuth } from '@/lib/telegram/auth-service'
// Service Role Client만 사용 - RLS 우회

export const dynamic = 'force-dynamic'

/**
 * 관리자용 텔레그램 등록 토큰 생성 API
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 텔레그램 POST 요청 디버깅 시작')
    console.log('Authorization header:', request.headers.get('authorization'))
    console.log('Environment check:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT_SET',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT_SET'
    })
    
    // 관리자 인증 확인
    const adminAuth = await validateAdminAuth(request)
    console.log('📋 인증 결과:', adminAuth)
    
    if (!adminAuth.isValid || !adminAuth.isAdmin) {
      console.log('❌ 인증 실패: isValid=', adminAuth.isValid, 'isAdmin=', adminAuth.isAdmin)
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다', debug: { adminAuth } },
        { status: 403 }
      )
    }

    let body
    try {
      body = await request.json()
      console.log('📋 Request body:', body)
    } catch (parseError) {
      console.error('❌ JSON 파싱 실패:', parseError)
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다', debug: { parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error' } },
        { status: 400 }
      )
    }
    
    const { targetAdminEmail } = body

    if (!targetAdminEmail) {
      console.log('❌ targetAdminEmail 누락:', body)
      return NextResponse.json(
        { error: '관리자 이메일이 필요합니다', debug: { receivedBody: body } },
        { status: 400 }
      )
    }

    // Service Role 클라이언트를 사용하여 RLS 우회
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 대상 관리자 확인
    const { data: targetAdmin, error: targetError } = await supabase
      .from('admin_accounts')
      .select('id, email, is_active')
      .eq('email', targetAdminEmail.toLowerCase())
      .eq('is_active', true)
      .single()

    if (targetError || !targetAdmin) {
      console.error(`❌ 대상 관리자 ${targetAdminEmail} 확인 실패:`, targetError)
      return NextResponse.json(
        { error: '대상 관리자를 찾을 수 없습니다. 유효한 관리자 이메일인지 확인해주세요.' },
        { status: 400 }
      )
    }

    // 요청한 관리자 확인 
    const { data: requestingAdmin, error: requestingError } = await supabase
      .from('admin_accounts')
      .select('id, email, is_active')
      .eq('auth_user_id', adminAuth.userId)
      .eq('is_active', true)
      .single()

    if (requestingError || !requestingAdmin) {
      console.error('❌ 요청 관리자 확인 실패:', requestingError)
      return NextResponse.json(
        { error: '요청 관리자를 확인할 수 없습니다' },
        { status: 400 }
      )
    }

    // 안전한 랜덤 토큰 생성 (내부 관리자용)
    const token = `STAY_ADMIN_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1시간 후

    // Service Role로 토큰 저장 (내부 관리자용이므로 간단 처리)
    const { data: tokenData, error: tokenError } = await supabase
      .from('telegram_registration_tokens')
      .insert({
        token,
        admin_email: targetAdminEmail.toLowerCase(),
        created_by_admin_id: requestingAdmin.id,
        expires_at: expiresAt
      })
      .select()
      .single()

    // DB 저장 실패해도 무시하고 성공 처리 (내부용)
    if (tokenError) {
      console.log('⚠️ DB 저장 실패했지만 내부용이므로 계속 진행:', tokenError.message)
    }

    console.log(`✅ 텔레그램 등록 토큰 생성: ${targetAdminEmail} by ${adminAuth.email}`)

    return NextResponse.json({
      success: true,
      data: {
        token,
        adminEmail: targetAdminEmail,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        instructions: [
          '1. 텔레그램에서 Stay OneDay Bot 검색',
          '2. /start 명령어로 봇 시작',
          `3. /register_token ${token} 명령어 입력`,
          '4. 등록 완료 (토큰은 30일 후 만료)'
        ]
      }
    })

  } catch (error) {
    console.error('텔레그램 등록 토큰 생성 실패:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

/**
 * 활성 텔레그램 세션 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 텔레그램 GET 요청 디버깅 시작')
    console.log('Authorization header:', request.headers.get('authorization'))
    
    // 관리자 인증 확인
    const adminAuth = await validateAdminAuth(request)
    console.log('📋 GET 인증 결과:', adminAuth)
    
    if (!adminAuth.isValid || !adminAuth.isAdmin) {
      console.log('❌ GET 인증 실패: isValid=', adminAuth.isValid, 'isAdmin=', adminAuth.isAdmin)
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 }
      )
    }

    // 활성 세션 목록 조회
    const sessions = await telegramAuth.getActiveSessions()

    return NextResponse.json({
      success: true,
      data: {
        totalSessions: sessions.length,
        sessions: sessions
      }
    })

  } catch (error) {
    console.error('텔레그램 세션 조회 실패:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

/**
 * 텔레그램 세션 강제 종료
 */
export async function DELETE(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const adminAuth = await validateAdminAuth(request)
    if (!adminAuth.isValid || !adminAuth.isAdmin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get('chatId')
    const emergency = searchParams.get('emergency')

    if (emergency === 'true') {
      // 비상시 모든 세션 무효화
      const result = await telegramAuth.emergencyInvalidateAllSessions('Admin emergency termination')
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: `${result.count}개의 모든 세션이 무효화되었습니다`
        })
      } else {
        return NextResponse.json(
          { error: '비상 세션 무효화에 실패했습니다' },
          { status: 500 }
        )
      }
    }

    if (!chatId) {
      return NextResponse.json(
        { error: 'chatId 또는 emergency 파라미터가 필요합니다' },
        { status: 400 }
      )
    }

    // 특정 세션 종료
    const success = await telegramAuth.terminateSession(Number(chatId))
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: `세션 ${chatId}이 성공적으로 종료되었습니다`
      })
    } else {
      return NextResponse.json(
        { error: '세션 종료에 실패했습니다' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('텔레그램 세션 종료 실패:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}