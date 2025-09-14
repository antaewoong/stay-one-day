import { NextRequest, NextResponse } from 'next/server'
import { testEmailConnection, sendInfluencerWelcomeEmail } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'test'

    if (action === 'test') {
      // SMTP 연결 테스트
      const result = await testEmailConnection()

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: '✅ Gmail SMTP 연결 성공! 이메일 발송이 가능합니다.',
          config: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            user: process.env.SMTP_USER,
            from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`
          }
        })
      } else {
        return NextResponse.json({
          success: false,
          message: '❌ Gmail SMTP 연결 실패',
          error: result.error,
          troubleshooting: {
            '1': 'Gmail 계정에서 2단계 인증이 활성화되어 있는지 확인하세요',
            '2': 'Google 계정 설정에서 앱 비밀번호를 생성했는지 확인하세요',
            '3': '.env.local의 SMTP_PASS에 16자리 앱 비밀번호를 입력했는지 확인하세요',
            '4': 'SMTP_USER에 info@nuklabs.com이 정확히 입력되어 있는지 확인하세요'
          }
        }, { status: 500 })
      }
    }

    if (action === 'send') {
      // 테스트 이메일 발송
      const to = searchParams.get('to') || process.env.SMTP_USER

      if (!to) {
        return NextResponse.json({
          success: false,
          message: '받는 사람 이메일 주소가 필요합니다. ?action=send&to=test@example.com'
        }, { status: 400 })
      }

      const result = await sendInfluencerWelcomeEmail({
        name: '테스트 인플루언서',
        email: to,
        temporaryPassword: 'testpassword123!'
      })

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: `✅ 테스트 이메일 발송 성공! ${to}에서 확인해보세요.`,
          messageId: result.messageId
        })
      } else {
        return NextResponse.json({
          success: false,
          message: '❌ 테스트 이메일 발송 실패',
          error: result.error
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: false,
      message: '지원하지 않는 액션입니다.',
      availableActions: {
        test: '/api/test-email?action=test (SMTP 연결 테스트)',
        send: '/api/test-email?action=send&to=email@example.com (테스트 이메일 발송)'
      }
    }, { status: 400 })

  } catch (error) {
    console.error('이메일 테스트 API 오류:', error)
    return NextResponse.json({
      success: false,
      message: '이메일 테스트 중 오류가 발생했습니다.',
      error: error
    }, { status: 500 })
  }
}