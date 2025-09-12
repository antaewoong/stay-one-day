/**
 * 텔레그램 실시간 알림 서비스
 * 예약, 메시지, 중요 이벤트 발생 시 관리자들에게 즉시 알림 전송
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface NotificationData {
  type: 'booking' | 'message' | 'inquiry' | 'payment' | 'system' | 'emergency'
  title: string
  message: string
  data?: any
  priority?: 'low' | 'normal' | 'high' | 'urgent'
}

export class TelegramNotificationService {
  private botToken: string

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || ''
  }

  /**
   * 모든 활성 관리자에게 알림 전송
   */
  async sendNotificationToAllAdmins(notification: NotificationData): Promise<boolean> {
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // 텔레그램에 연결된 활성 관리자들 조회
      const { data: activeSessions, error } = await supabase
        .from('telegram_sessions')
        .select(`
          chat_id,
          admin_accounts!inner(id, email, name, is_active)
        `)
        .eq('is_active', true)
        .eq('admin_accounts.is_active', true)

      if (error || !activeSessions || activeSessions.length === 0) {
        console.log('📵 활성화된 텔레그램 관리자 세션이 없습니다')
        return false
      }

      console.log(`📢 ${activeSessions.length}명의 관리자에게 알림 전송 중...`)

      // 각 관리자에게 동시 알림 전송
      const results = await Promise.allSettled(
        activeSessions.map(session => 
          this.sendTelegramMessage(session.chat_id, this.formatNotificationMessage(notification))
        )
      )

      const successCount = results.filter(result => result.status === 'fulfilled').length
      console.log(`✅ ${successCount}/${activeSessions.length}명에게 알림 전송 완료`)

      return successCount > 0

    } catch (error) {
      console.error('전체 관리자 알림 전송 실패:', error)
      return false
    }
  }

  /**
   * 특정 관리자에게 알림 전송
   */
  async sendNotificationToAdmin(adminEmail: string, notification: NotificationData): Promise<boolean> {
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      const { data: session, error } = await supabase
        .from('telegram_sessions')
        .select(`
          chat_id,
          admin_accounts!inner(email, is_active)
        `)
        .eq('is_active', true)
        .eq('admin_accounts.email', adminEmail.toLowerCase())
        .eq('admin_accounts.is_active', true)
        .single()

      if (error || !session) {
        console.log(`📵 관리자 ${adminEmail}의 활성 텔레그램 세션이 없습니다`)
        return false
      }

      return await this.sendTelegramMessage(session.chat_id, this.formatNotificationMessage(notification))

    } catch (error) {
      console.error(`관리자 ${adminEmail} 알림 전송 실패:`, error)
      return false
    }
  }

  /**
   * 새 예약 알림
   */
  async notifyNewBooking(bookingData: any): Promise<boolean> {
    const notification: NotificationData = {
      type: 'booking',
      title: '🏨 새로운 예약이 들어왔습니다!',
      message: this.formatBookingMessage(bookingData),
      data: bookingData,
      priority: 'high'
    }

    return await this.sendNotificationToAllAdmins(notification)
  }

  /**
   * 새 메시지/문의 알림
   */
  async notifyNewMessage(messageData: any): Promise<boolean> {
    const notification: NotificationData = {
      type: 'message',
      title: '💬 새로운 메시지가 도착했습니다!',
      message: this.formatMessageNotification(messageData),
      data: messageData,
      priority: 'normal'
    }

    return await this.sendNotificationToAllAdmins(notification)
  }

  /**
   * 새 문의 알림
   */
  async notifyNewInquiry(inquiryData: any): Promise<boolean> {
    const notification: NotificationData = {
      type: 'inquiry',
      title: '❓ 새로운 문의가 접수되었습니다!',
      message: this.formatInquiryMessage(inquiryData),
      data: inquiryData,
      priority: 'normal'
    }

    return await this.sendNotificationToAllAdmins(notification)
  }

  /**
   * 결제 관련 알림
   */
  async notifyPaymentEvent(paymentData: any, eventType: 'completed' | 'failed' | 'refunded'): Promise<boolean> {
    const titles = {
      completed: '💰 결제가 완료되었습니다!',
      failed: '❌ 결제가 실패했습니다!',
      refunded: '↩️ 환불이 처리되었습니다!'
    }

    const notification: NotificationData = {
      type: 'payment',
      title: titles[eventType],
      message: this.formatPaymentMessage(paymentData, eventType),
      data: paymentData,
      priority: eventType === 'failed' ? 'high' : 'normal'
    }

    return await this.sendNotificationToAllAdmins(notification)
  }

  /**
   * 시스템 알림 (긴급)
   */
  async notifySystemAlert(alertData: any): Promise<boolean> {
    const notification: NotificationData = {
      type: 'system',
      title: '🚨 시스템 알림',
      message: this.formatSystemAlert(alertData),
      data: alertData,
      priority: 'urgent'
    }

    return await this.sendNotificationToAllAdmins(notification)
  }

  /**
   * 예약 메시지 포맷팅
   */
  private formatBookingMessage(bookingData: any): string {
    const checkInDate = bookingData.check_in ? new Date(bookingData.check_in).toLocaleDateString('ko-KR') : '미정'
    const checkOutDate = bookingData.check_out ? new Date(bookingData.check_out).toLocaleDateString('ko-KR') : '미정'
    const guestName = bookingData.guest_name || '익명'
    const propertyName = bookingData.property_name || bookingData.host_name || '숙소'
    const totalPrice = bookingData.total_price ? `${bookingData.total_price.toLocaleString()}원` : '미정'

    return `
<b>📋 예약 정보</b>
• <b>고객명:</b> ${guestName}
• <b>숙소:</b> ${propertyName}
• <b>체크인:</b> ${checkInDate}
• <b>체크아웃:</b> ${checkOutDate}
• <b>결제금액:</b> ${totalPrice}
• <b>예약시간:</b> ${new Date().toLocaleString('ko-KR')}

<i>관리자 패널에서 자세한 정보를 확인해보세요.</i>
    `.trim()
  }

  /**
   * 메시지 알림 포맷팅
   */
  private formatMessageNotification(messageData: any): string {
    const senderName = messageData.sender_name || messageData.name || '익명'
    const messagePreview = messageData.message ? 
      (messageData.message.length > 100 ? messageData.message.substring(0, 100) + '...' : messageData.message)
      : '내용 없음'
    
    return `
<b>👤 발신자:</b> ${senderName}
<b>📱 연락처:</b> ${messageData.phone || messageData.email || '없음'}

<b>📝 메시지 내용:</b>
${messagePreview}

<i>빠른 답변을 위해 관리자 패널을 확인해주세요.</i>
    `.trim()
  }

  /**
   * 문의 메시지 포맷팅
   */
  private formatInquiryMessage(inquiryData: any): string {
    const inquiryType = inquiryData.type || '일반 문의'
    const customerName = inquiryData.customer_name || '익명'
    
    return `
<b>📋 문의 유형:</b> ${inquiryType}
<b>👤 고객명:</b> ${customerName}
<b>📧 이메일:</b> ${inquiryData.email || '없음'}
<b>📱 연락처:</b> ${inquiryData.phone || '없음'}

<b>📝 문의 내용:</b>
${inquiryData.content || '내용 없음'}

<i>고객 대응을 위해 관리자 패널에서 확인해주세요.</i>
    `.trim()
  }

  /**
   * 결제 메시지 포맷팅
   */
  private formatPaymentMessage(paymentData: any, eventType: string): string {
    const amount = paymentData.amount ? `${paymentData.amount.toLocaleString()}원` : '미정'
    const customerName = paymentData.customer_name || paymentData.name || '익명'
    const paymentMethod = paymentData.payment_method || '미정'
    
    const statusEmoji = {
      completed: '✅',
      failed: '❌', 
      refunded: '↩️'
    }

    return `
${statusEmoji[eventType]} <b>결제 ${eventType === 'completed' ? '완료' : eventType === 'failed' ? '실패' : '환불'}</b>

<b>👤 고객:</b> ${customerName}
<b>💳 결제수단:</b> ${paymentMethod}
<b>💰 금액:</b> ${amount}
<b>⏰ 시간:</b> ${new Date().toLocaleString('ko-KR')}

<i>결제 상세 내역은 관리자 패널에서 확인하세요.</i>
    `.trim()
  }

  /**
   * 시스템 알림 포맷팅
   */
  private formatSystemAlert(alertData: any): string {
    return `
🚨 <b>시스템 경고</b>

<b>유형:</b> ${alertData.type || '일반 알림'}
<b>내용:</b> ${alertData.message || '내용 없음'}
<b>발생시간:</b> ${new Date().toLocaleString('ko-KR')}

${alertData.action_required ? '<b>⚠️ 즉시 조치가 필요합니다!</b>' : ''}

<i>시스템 상태를 확인하고 필요한 조치를 취해주세요.</i>
    `.trim()
  }

  /**
   * 알림 메시지 포맷팅
   */
  private formatNotificationMessage(notification: NotificationData): string {
    const priorityEmoji = {
      low: '🔵',
      normal: '🟡', 
      high: '🟠',
      urgent: '🔴'
    }

    const emoji = priorityEmoji[notification.priority || 'normal']

    return `${emoji} ${notification.title}

${notification.message}

<i>Stay OneDay 관리자 알림 • ${new Date().toLocaleString('ko-KR')}</i>`
  }

  /**
   * 텔레그램 메시지 전송
   */
  private async sendTelegramMessage(chatId: number, message: string): Promise<boolean> {
    try {
      if (!this.botToken) {
        console.error('❌ TELEGRAM_BOT_TOKEN이 설정되지 않음')
        return false
      }

      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          disable_notification: false
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error(`텔레그램 API 오류 (${chatId}):`, errorData)
        return false
      }

      return true

    } catch (error) {
      console.error(`텔레그램 메시지 전송 실패 (${chatId}):`, error)
      return false
    }
  }
}

// 싱글톤 인스턴스
export const telegramNotification = new TelegramNotificationService()