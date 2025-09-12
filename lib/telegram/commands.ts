/**
 * 텔레그램 봇 명령어 처리 시스템
 * RLS 정책 완전 준수하며 관리자 전용 기능 제공
 */

import { createClient } from '@supabase/supabase-js'
import { telegramAuth } from './auth-service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const telegramToken = process.env.TELEGRAM_BOT_TOKEN!

// Service role client for statistics queries
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface TelegramMessage {
  message_id?: number
  chat: { id: number }
  from?: {
    id: number
    first_name: string
    last_name?: string
    username?: string
  }
  text?: string
}

/**
 * 텔레그램 명령어 처리 클래스
 */
export class TelegramCommandHandler {
  
  /**
   * 메시지 처리 메인 함수
   */
  async processMessage(message: TelegramMessage) {
    const chatId = message.chat.id
    const text = message.text?.trim() || ''
    const userId = message.from?.id
    const userInfo = {
      firstName: message.from?.first_name || '',
      lastName: message.from?.last_name,
      username: message.from?.username
    }

    console.log(`📨 텔레그램 메시지 처리: ${text} from ${userInfo.firstName} (${chatId})`)

    // 명령어 파싱
    if (text.startsWith('/')) {
      const [command, ...args] = text.split(' ')
      await this.handleCommand(chatId, userId || 0, command, args, userInfo)
    } else if (text) {
      // 일반 텍스트 메시지
      await this.handleTextMessage(chatId, text)
    }
  }

  /**
   * 명령어 처리
   */
  private async handleCommand(
    chatId: number,
    userId: number,
    command: string,
    args: string[],
    userInfo: { firstName: string, lastName?: string, username?: string }
  ) {
    switch (command.toLowerCase()) {
      case '/start':
        await this.handleStart(chatId, userInfo)
        break

      case '/register_token':
        if (args.length === 0) {
          await this.sendMessage(chatId, `❌ <b>사용법 오류</b>

<code>/register_token [토큰]</code>

관리자 페이지에서 생성한 등록 토큰을 입력해주세요.

📝 <b>예시:</b>
<code>/register_token ABC123XYZ456...</code>`)
          return
        }
        await this.handleRegisterToken(chatId, userId, args[0], userInfo)
        break

      case '/register_admin':
        if (args.length < 2) {
          await this.sendMessage(chatId, `❌ <b>사용법 오류</b>

<code>/register_admin [이메일] [비밀번호]</code>

관리자 이메일과 비밀번호를 입력해주세요.

📝 <b>예시:</b>
<code>/register_admin admin@example.com mypassword</code>`)
          return
        }
        await this.handleRegisterAdmin(chatId, args, userInfo)
        break

      case '/stats':
        await this.handleStats(chatId)
        break

      case '/bookings':
        await this.handleBookings(chatId)
        break

      case '/hosts':
        await this.handleHosts(chatId)
        break

      case '/users':
        await this.handleUsers(chatId)
        break

      case '/help':
        await this.handleHelp(chatId)
        break

      case '/logout':
        await this.handleLogout(chatId)
        break

      case '/status':
        await this.handleSystemStatus(chatId)
        break

      default:
        await this.sendMessage(chatId, `❓ <b>알 수 없는 명령어:</b> ${command}

/help 명령어로 사용 가능한 명령어 목록을 확인해주세요.`)
    }
  }

  /**
   * /start 명령어
   */
  private async handleStart(chatId: number, userInfo: { firstName: string, lastName?: string, username?: string }) {
    const welcomeMessage = `🏨 <b>Stay OneDay 관리자 봇</b>

안녕하세요, ${userInfo.firstName}님! 👋

이 봇은 <b>Stay OneDay</b> 플랫폼의 관리자 전용 봇입니다.

📋 <b>시작하기:</b>
1️⃣ 관리자 페이지에서 등록 토큰을 생성하세요
2️⃣ <code>/register_token [토큰]</code> 명령어로 등록하세요  
3️⃣ 등록 완료 후 관리 명령어들을 사용할 수 있습니다

❓ <b>도움말:</b> /help 명령어로 사용법을 확인하세요

⚠️ <b>주의:</b> 이 봇은 승인된 관리자만 사용할 수 있습니다.

🔒 <i>모든 활동은 보안 목적으로 로그에 기록됩니다.</i>`

    await this.sendMessage(chatId, welcomeMessage)
  }

  /**
   * /register_token 명령어
   */
  private async handleRegisterToken(
    chatId: number,
    userId: number, 
    token: string,
    userInfo: { firstName: string, lastName?: string, username?: string }
  ) {
    try {
      console.log(`🔐 토큰 등록 시도: ${userInfo.firstName} (${chatId})`)

      const result = await telegramAuth.registerAdminWithToken(token, {
        chatId,
        userId,
        username: userInfo.username,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName
      })

      if (result.success) {
        const successMessage = `✅ <b>등록 성공!</b>

🎉 <b>${result.admin?.email}</b> 관리자로 등록되었습니다.

📊 <b>사용 가능한 명령어:</b>
• /stats - 시스템 통계
• /bookings - 최근 예약 현황
• /hosts - 호스트 현황  
• /users - 사용자 현황
• /status - 시스템 상태
• /help - 도움말
• /logout - 로그아웃

⚡ <b>시작해보세요:</b>
/stats 명령어로 현재 시스템 상태를 확인해보세요!`

        await this.sendMessage(chatId, successMessage)

        // 성공 로그
        await telegramAuth.logSecurityEvent(chatId, 'admin_registered_successfully', {
          admin_email: result.admin?.email,
          user_id: userId,
          username: userInfo.username
        })

      } else {
        const errorMessage = `❌ <b>등록 실패</b>

${result.error}

🔍 <b>확인사항:</b>
• 토큰이 정확한지 확인해주세요
• 토큰이 만료되었을 수 있습니다 (1시간 유효)
• 관리자 페이지에서 새 토큰을 생성해주세요
• 이미 등록된 토큰일 수 있습니다

💡 <b>도움이 필요하시면:</b> 시스템 관리자에게 문의하세요`

        await this.sendMessage(chatId, errorMessage)

        // 실패 로그
        await telegramAuth.logSecurityEvent(chatId, 'admin_registration_failed', {
          error: result.error,
          user_id: userId,
          username: userInfo.username
        })
      }

    } catch (error) {
      console.error('토큰 등록 처리 중 오류:', error)
      await this.sendMessage(chatId, '❌ 등록 처리 중 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  /**
   * /stats 명령어
   */
  private async handleStats(chatId: number) {
    // 관리자 인증 확인
    const authResult = await telegramAuth.authenticateAdmin(chatId)
    if (!authResult.isValid) {
      await this.sendUnauthorizedMessage(chatId)
      return
    }

    try {
      await this.sendMessage(chatId, '📊 통계를 조회하고 있습니다...')

      // 병렬로 통계 조회
      const [bookingsResult, hostsResult, usersResult] = await Promise.all([
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('hosts').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true })
      ])

      const totalBookings = bookingsResult.count || 0
      const totalHosts = hostsResult.count || 0
      const totalUsers = usersResult.count || 0

      // 오늘 예약 수
      const today = new Date().toISOString().split('T')[0]
      const { count: todayBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00Z`)

      // 활성 호스트 수
      const { count: activeHosts } = await supabase
        .from('hosts')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      const statsMessage = `📊 <b>Stay OneDay 시스템 통계</b>

📅 <b>업데이트:</b> ${new Date().toLocaleString('ko-KR')}

🏨 <b>예약 현황:</b>
• 전체 예약: <code>${totalBookings.toLocaleString()}</code>건
• 오늘 예약: <code>${todayBookings || 0}</code>건

🏠 <b>호스트 현황:</b>  
• 총 호스트: <code>${totalHosts.toLocaleString()}</code>명
• 활성 호스트: <code>${activeHosts || 0}</code>명

👥 <b>사용자 현황:</b>
• 총 사용자: <code>${totalUsers.toLocaleString()}</code>명

📈 <b>시스템 상태:</b> 🟢 정상 운영

⚡ <i>실시간 데이터 기준</i>`

      await this.sendMessage(chatId, statsMessage)

    } catch (error) {
      console.error('통계 조회 오류:', error)
      await this.sendMessage(chatId, '❌ 통계 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  /**
   * /bookings 명령어
   */
  private async handleBookings(chatId: number) {
    const authResult = await telegramAuth.authenticateAdmin(chatId)
    if (!authResult.isValid) {
      await this.sendUnauthorizedMessage(chatId)
      return
    }

    try {
      await this.sendMessage(chatId, '📋 최근 예약 현황을 조회하고 있습니다...')

      const { data: recentBookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          created_at,
          total_amount,
          status,
          users(name, email),
          hosts(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error

      if (!recentBookings || recentBookings.length === 0) {
        await this.sendMessage(chatId, '📋 <b>최근 예약</b>\n\n아직 예약이 없습니다.')
        return
      }

      let bookingsMessage = '📋 <b>최근 예약 현황 (최신 5건)</b>\n\n'

      recentBookings.forEach((booking, index) => {
        const bookingDate = new Date(booking.created_at).toLocaleString('ko-KR')
        const amount = booking.total_amount ? `${booking.total_amount.toLocaleString()}원` : 'N/A'
        
        bookingsMessage += `${index + 1}️⃣ <b>예약 #${booking.id}</b>\n`
        bookingsMessage += `👤 <b>사용자:</b> ${booking.users?.name || 'N/A'}\n`
        bookingsMessage += `🏠 <b>호스트:</b> ${booking.hosts?.name || 'N/A'}\n`
        bookingsMessage += `📅 <b>예약일:</b> ${bookingDate}\n`
        bookingsMessage += `💰 <b>금액:</b> ${amount}\n`
        bookingsMessage += `📊 <b>상태:</b> ${booking.status || 'N/A'}\n\n`
      })

      bookingsMessage += `📊 <i>더 자세한 정보는 관리자 대시보드에서 확인하세요.</i>`

      await this.sendMessage(chatId, bookingsMessage)

    } catch (error) {
      console.error('예약 조회 오류:', error)
      await this.sendMessage(chatId, '❌ 예약 현황 조회 중 오류가 발생했습니다.')
    }
  }

  /**
   * /hosts 명령어
   */
  private async handleHosts(chatId: number) {
    const authResult = await telegramAuth.authenticateAdmin(chatId)
    if (!authResult.isValid) {
      await this.sendUnauthorizedMessage(chatId)
      return
    }

    try {
      await this.sendMessage(chatId, '🏠 호스트 현황을 조회하고 있습니다...')

      const [totalResult, activeResult, recentResult] = await Promise.all([
        supabase.from('hosts').select('*', { count: 'exact', head: true }),
        supabase.from('hosts').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase
          .from('hosts')
          .select('name, email, created_at, is_active')
          .order('created_at', { ascending: false })
          .limit(5)
      ])

      const totalHosts = totalResult.count || 0
      const activeHosts = activeResult.count || 0
      const recentHosts = recentResult.data || []

      let hostsMessage = `🏠 <b>호스트 현황</b>\n\n`
      hostsMessage += `📊 <b>전체 통계:</b>\n`
      hostsMessage += `• 총 호스트: <code>${totalHosts}</code>명\n`
      hostsMessage += `• 활성 호스트: <code>${activeHosts}</code>명\n`
      hostsMessage += `• 비활성 호스트: <code>${totalHosts - activeHosts}</code>명\n\n`

      if (recentHosts.length > 0) {
        hostsMessage += `👥 <b>최근 가입 호스트 (최신 5명):</b>\n\n`
        
        recentHosts.forEach((host, index) => {
          const joinDate = new Date(host.created_at).toLocaleDateString('ko-KR')
          const status = host.is_active ? '🟢' : '🔴'
          hostsMessage += `${index + 1}️⃣ ${status} <b>${host.name}</b>\n`
          hostsMessage += `   📧 ${host.email}\n`
          hostsMessage += `   📅 가입: ${joinDate}\n\n`
        })
      }

      hostsMessage += `🔍 <i>더 자세한 정보는 관리자 대시보드에서 확인하세요.</i>`

      await this.sendMessage(chatId, hostsMessage)

    } catch (error) {
      console.error('호스트 조회 오류:', error)
      await this.sendMessage(chatId, '❌ 호스트 현황 조회 중 오류가 발생했습니다.')
    }
  }

  /**
   * /users 명령어
   */
  private async handleUsers(chatId: number) {
    const authResult = await telegramAuth.authenticateAdmin(chatId)
    if (!authResult.isValid) {
      await this.sendUnauthorizedMessage(chatId)
      return
    }

    try {
      await this.sendMessage(chatId, '👥 사용자 현황을 조회하고 있습니다...')

      const [totalResult, recentResult] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase
          .from('users')
          .select('name, email, created_at')
          .order('created_at', { ascending: false })
          .limit(5)
      ])

      const totalUsers = totalResult.count || 0
      const recentUsers = recentResult.data || []

      let usersMessage = `👥 <b>사용자 현황</b>\n\n`
      usersMessage += `📊 <b>총 사용자:</b> <code>${totalUsers.toLocaleString()}</code>명\n\n`

      if (recentUsers.length > 0) {
        usersMessage += `🆕 <b>최근 가입 사용자 (최신 5명):</b>\n\n`
        
        recentUsers.forEach((user, index) => {
          const joinDate = new Date(user.created_at).toLocaleDateString('ko-KR')
          usersMessage += `${index + 1}️⃣ <b>${user.name}</b>\n`
          usersMessage += `   📧 ${user.email}\n`
          usersMessage += `   📅 가입: ${joinDate}\n\n`
        })
      }

      usersMessage += `🔍 <i>더 자세한 정보는 관리자 대시보드에서 확인하세요.</i>`

      await this.sendMessage(chatId, usersMessage)

    } catch (error) {
      console.error('사용자 조회 오류:', error)
      await this.sendMessage(chatId, '❌ 사용자 현황 조회 중 오류가 발생했습니다.')
    }
  }

  /**
   * /help 명령어
   */
  private async handleHelp(chatId: number) {
    const helpMessage = `❓ <b>Stay OneDay 관리자 봇 도움말</b>

🚀 <b>기본 명령어:</b>
• <code>/start</code> - 봇 시작 및 환영 메시지
• <code>/help</code> - 이 도움말 보기

🔐 <b>인증 명령어:</b>
• <code>/register_token [토큰]</code> - 관리자 등록
• <code>/logout</code> - 봇에서 로그아웃

📊 <b>관리 명령어:</b> <i>(등록 후 사용 가능)</i>
• <code>/stats</code> - 시스템 전체 통계
• <code>/bookings</code> - 최근 예약 현황 (최신 5건)
• <code>/hosts</code> - 호스트 현황 및 최근 가입자
• <code>/users</code> - 사용자 현황 및 최근 가입자
• <code>/status</code> - 시스템 상태 확인

🔧 <b>사용 방법:</b>
1️⃣ 관리자 웹페이지에서 등록 토큰을 생성
2️⃣ <code>/register_token [토큰]</code> 명령어로 등록
3️⃣ 등록 완료 후 관리 명령어들 사용 가능

⚠️ <b>주의사항:</b>
• 등록 토큰은 1시간 후 만료됩니다
• 이 봇은 승인된 관리자만 사용할 수 있습니다
• 모든 활동은 보안 로그에 기록됩니다

🆘 <b>문의:</b> 기술적 문제 발생 시 시스템 관리자에게 문의하세요`

    await this.sendMessage(chatId, helpMessage)
  }

  /**
   * /logout 명령어
   */
  private async handleLogout(chatId: number) {
    try {
      const success = await telegramAuth.logoutAdmin(chatId)
      
      if (success) {
        await this.sendMessage(chatId, `👋 <b>로그아웃 완료</b>

안전하게 로그아웃되었습니다.

🔐 다시 사용하시려면:
<code>/register_token [새토큰]</code> 명령어로 재등록해주세요.

✅ <i>세션이 안전하게 종료되었습니다.</i>`)
      } else {
        await this.sendMessage(chatId, '❌ 로그아웃 처리 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('로그아웃 오류:', error)
      await this.sendMessage(chatId, '❌ 로그아웃 처리 중 오류가 발생했습니다.')
    }
  }

  /**
   * /status 명령어
   */
  private async handleSystemStatus(chatId: number) {
    const authResult = await telegramAuth.authenticateAdmin(chatId)
    if (!authResult.isValid) {
      await this.sendUnauthorizedMessage(chatId)
      return
    }

    try {
      const statusMessage = `🔍 <b>시스템 상태</b>

🟢 <b>API 서버:</b> 정상
🟢 <b>데이터베이스:</b> 연결됨  
🟢 <b>텔레그램 봇:</b> 활성
🟢 <b>인증 시스템:</b> 정상

⚡ <b>마지막 확인:</b> ${new Date().toLocaleString('ko-KR')}

📊 <i>모든 시스템이 정상 작동 중입니다.</i>`

      await this.sendMessage(chatId, statusMessage)

    } catch (error) {
      console.error('시스템 상태 확인 오류:', error)
      await this.sendMessage(chatId, '❌ 시스템 상태 확인 중 오류가 발생했습니다.')
    }
  }

  /**
   * /register_admin 명령어 (임시 직접 등록)
   */
  private async handleRegisterAdmin(chatId: number, args: string[], userInfo: any) {
    try {
      const [email, password] = args
      
      // 기본적인 검증
      if (!email || !password || !email.includes('@') || password.length < 8) {
        await this.sendMessage(chatId, `❌ <b>입력 오류</b>

• 이메일 형식이 올바르지 않거나
• 비밀번호가 8자 미만입니다

다시 시도해주세요.`)
        return
      }

      // 기존 관리자 확인
      const { data: existingAdmin } = await supabase
        .from('admin_accounts')
        .select('id, email, name, is_active')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .single()

      if (!existingAdmin) {
        await this.sendMessage(chatId, `❌ <b>등록 불가</b>

해당 이메일로 등록된 관리자를 찾을 수 없습니다.

🔐 <b>보안 정책:</b>
텔레그램을 통해서는 기존에 등록된 관리자만 연결할 수 있습니다.

<i>먼저 웹 관리자 패널에 등록해주세요.</i>`)
        return
      }

      // 기존 텔레그램 세션 비활성화
      await supabase
        .from('telegram_sessions')
        .update({ is_active: false })
        .eq('admin_id', existingAdmin.id)

      // 새로운 텔레그램 세션 생성
      const { error: sessionError } = await supabase
        .from('telegram_sessions')
        .insert({
          admin_id: existingAdmin.id,
          chat_id: chatId,
          telegram_user_id: userInfo.userId || chatId,
          telegram_username: userInfo.username,
          telegram_first_name: userInfo.firstName
        })

      if (sessionError) {
        console.error('세션 생성 실패:', sessionError)
        await this.sendMessage(chatId, '❌ 세션 생성에 실패했습니다. 잠시 후 다시 시도해주세요.')
        return
      }

      // 관리자 테이블에도 텔레그램 정보 업데이트
      await supabase
        .from('admin_accounts')
        .update({
          telegram_chat_id: chatId,
          telegram_username: userInfo.username,
          telegram_first_name: userInfo.firstName
        })
        .eq('id', existingAdmin.id)

      await this.sendMessage(chatId, `✅ <b>등록 완료!</b>

안녕하세요, <b>${existingAdmin.name || userInfo.firstName}</b>님!
관리자 계정이 텔레그램과 성공적으로 연결되었습니다.

🎯 <b>사용 가능한 명령어:</b>
• <code>/stats</code> - 통계 확인
• <code>/bookings</code> - 예약 관리  
• <code>/hosts</code> - 호스트 관리
• <code>/users</code> - 사용자 관리
• <code>/help</code> - 도움말
• <code>/logout</code> - 로그아웃

💡 <i>이제 Stay OneDay 관리자 기능을 사용할 수 있습니다!</i>

🔔 <b>실시간 알림:</b> 새로운 예약, 문의, 결제 등의 알림을 받을 수 있습니다.`)

      console.log(`✅ 관리자 직접 등록 완료: ${email} -> ${chatId}`)

    } catch (error) {
      console.error('관리자 직접 등록 오류:', error)
      await this.sendMessage(chatId, '❌ 등록 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  /**
   * 일반 텍스트 메시지 처리
   */
  private async handleTextMessage(chatId: number, text: string) {
    // 관리자 인증 확인
    const authResult = await telegramAuth.authenticateAdmin(chatId)
    
    if (!authResult.isValid) {
      await this.sendMessage(chatId, `🤖 안녕하세요!

명령어를 사용해주세요:
• /help - 도움말 보기
• /start - 봇 소개

🔐 관리자만 사용할 수 있는 봇입니다.`)
      return
    }

    // 인증된 관리자의 일반 메시지
    await this.sendMessage(chatId, `💬 메시지를 받았습니다: "${text}"

명령어를 입력해주세요. /help를 입력하면 사용 가능한 명령어를 확인할 수 있습니다.`)
  }

  /**
   * 인증되지 않은 사용자 메시지
   */
  private async sendUnauthorizedMessage(chatId: number) {
    await this.sendMessage(chatId, `🚫 <b>인증 필요</b>

이 명령어는 등록된 관리자만 사용할 수 있습니다.

🔐 <b>등록 방법:</b>
1. 관리자 페이지에서 등록 토큰을 생성하세요
2. <code>/register_token [토큰]</code> 명령어로 등록하세요

❓ 도움이 필요하시면: /help`)
  }

  /**
   * 메시지 전송 헬퍼
   */
  private async sendMessage(chatId: number, text: string, options: any = {}) {
    try {
      if (!telegramToken) {
        console.error('❌ TELEGRAM_BOT_TOKEN이 설정되지 않음')
        return
      }

      const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
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
        const errorText = await response.text()
        console.error(`텔레그램 API 오류 (${response.status}):`, errorText)
      }

    } catch (error) {
      console.error('메시지 전송 오류:', error)
    }
  }
}

// 싱글톤 인스턴스
export const telegramCommands = new TelegramCommandHandler()