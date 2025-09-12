import { NextRequest, NextResponse } from 'next/server'
import { telegramAuth } from '@/lib/telegram/auth-service'
import { telegramCommands } from '@/lib/telegram/commands'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * 텔레그램 웹훅 엔드포인트
 * RLS 정책을 완벽히 준수하며 관리자만 접근 가능
 */
export async function POST(request: NextRequest) {
  try {
    // 웹훅 보안 검증
    if (!await verifyTelegramWebhook(request)) {
      await telegramAuth.logSecurityEvent(0, 'webhook_verification_failed', {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      })
      
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message, callback_query } = body

    // 메시지 처리
    if (message) {
      await handleTelegramMessage(message)
    }

    // 콜백 쿼리 처리
    if (callback_query) {
      await handleCallbackQuery(callback_query)
    }

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('텔레그램 웹훅 처리 실패:', error)
    
    // 보안 이벤트 로그
    await telegramAuth.logSecurityEvent(0, 'webhook_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * 텔레그램 웹훅 보안 검증
 */
async function verifyTelegramWebhook(request: NextRequest): Promise<boolean> {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      console.error('❌ TELEGRAM_BOT_TOKEN이 설정되지 않음')
      return false
    }

    const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET
    if (secretToken) {
      const providedToken = request.headers.get('x-telegram-bot-api-secret-token')
      if (providedToken !== secretToken) {
        console.error('❌ 텔레그램 시크릿 토큰 불일치')
        return false
      }
    }

    // IP 화이트리스트 검증 (선택사항)
    const allowedIPs = process.env.TELEGRAM_ALLOWED_IPS?.split(',') || []
    if (allowedIPs.length > 0) {
      const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      if (!clientIP || !allowedIPs.includes(clientIP)) {
        console.error(`❌ 허용되지 않은 IP에서 웹훅 요청: ${clientIP}`)
        return false
      }
    }

    return true

  } catch (error) {
    console.error('웹훅 검증 실패:', error)
    return false
  }
}

/**
 * 텔레그램 메시지 처리 (RLS 정책 준수)
 */
async function handleTelegramMessage(message: any) {
  const chatId = message.chat.id
  const userId = message.from?.id
  const text = message.text?.trim()

  try {
    // 보안 로그 (모든 메시지 기록)
    await telegramAuth.logSecurityEvent(chatId, 'message_received', {
      user_id: userId,
      username: message.from?.username,
      message_length: text?.length || 0,
      message_type: message.chat?.type || 'private'
    })

    // 관리자 인증 확인
    const { isValid, admin } = await telegramAuth.authenticateAdmin(chatId)
    
    if (!isValid) {
      // 인증되지 않은 사용자의 접근 시도
      await telegramAuth.logSecurityEvent(chatId, 'unauthorized_access_attempt', {
        user_id: userId,
        username: message.from?.username,
        first_name: message.from?.first_name,
        attempted_command: text
      })

      // 등록 명령어가 아닌 경우 차단
      if (!text?.startsWith('/register') && !text?.startsWith('/start')) {
        await sendTelegramMessage(chatId, `🚫 <b>접근 거부</b>

이 봇은 승인된 관리자만 사용할 수 있습니다.
관리자 등록이 필요하시면 시스템 관리자에게 문의하세요.

<i>모든 접근 시도는 보안 목적으로 로그에 기록됩니다.</i>`)
        return
      }
    }

    // 인증된 관리자의 명령어 처리
    await telegramCommands.processMessage(message)

    // 명령어 사용 로그 (관리자만)
    if (isValid && admin && text?.startsWith('/')) {
      const command = text.split(' ')[0]
      await telegramAuth.logSecurityEvent(chatId, 'command_executed', {
        admin_id: admin.adminId,
        command,
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error(`메시지 처리 실패 (${chatId}):`, error)
    
    await telegramAuth.logSecurityEvent(chatId, 'message_processing_error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    // 오류 발생시 안전한 응답
    await sendTelegramMessage(chatId, '❌ 메시지 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
  }
}

/**
 * 콜백 쿼리 처리
 */
async function handleCallbackQuery(callbackQuery: any) {
  const chatId = callbackQuery.message?.chat?.id
  const data = callbackQuery.data

  if (!chatId) return

  try {
    // 관리자 인증 확인
    const { isValid, admin } = await telegramAuth.authenticateAdmin(chatId)
    
    if (!isValid) {
      await telegramAuth.logSecurityEvent(chatId, 'unauthorized_callback_attempt', {
        callback_data: data
      })
      return
    }

    // 콜백 쿼리 로그
    await telegramAuth.logSecurityEvent(chatId, 'callback_executed', {
      admin_id: admin?.adminId,
      callback_data: data
    })

    // 콜백 쿼리별 처리
    switch (data) {
      case 'refresh_stats':
        // 통계 새로고침
        await telegramCommands.processMessage({
          chat: { id: chatId },
          text: '/stats',
          message_id: callbackQuery.message.message_id
        })
        break
        
      case 'detailed_stats':
        await sendTelegramMessage(chatId, '📊 상세 통계 기능은 준비 중입니다.')
        break
        
      default:
        await sendTelegramMessage(chatId, '❓ 알 수 없는 작업입니다.')
    }

  } catch (error) {
    console.error('콜백 쿼리 처리 실패:', error)
  }
}

/**
 * 안전한 텔레그램 메시지 전송
 */
async function sendTelegramMessage(chatId: number, text: string, options: any = {}) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) return

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...options
      }),
    })

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`)
    }

  } catch (error) {
    console.error('텔레그램 메시지 전송 실패:', error)
  }
}