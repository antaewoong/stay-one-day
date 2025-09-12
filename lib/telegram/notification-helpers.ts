/**
 * 텔레그램 알림 헬퍼 함수들
 * 실제 비즈니스 로직에서 쉽게 알림을 보낼 수 있도록 도와주는 유틸리티
 */

import { telegramNotification } from './notification-service'

/**
 * 내부 웹훅 호출을 통한 알림 전송
 */
async function triggerNotification(eventType: string, data: any): Promise<boolean> {
  try {
    const webhookSecret = process.env.INTERNAL_WEBHOOK_SECRET || 'fallback-secret'
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/api/notifications/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webhookSecret}`
      },
      body: JSON.stringify({ eventType, data })
    })

    return response.ok
  } catch (error) {
    console.error('알림 트리거 실패:', error)
    return false
  }
}

/**
 * 직접 알림 전송 (웹훅 우회)
 */
export const NotificationHelpers = {
  /**
   * 새 예약 생성 알림
   */
  async notifyNewBooking(bookingData: {
    id?: string
    guest_name?: string
    property_name?: string
    host_name?: string
    check_in?: string
    check_out?: string
    total_price?: number
    guest_count?: number
    phone?: string
    email?: string
    special_requests?: string
  }): Promise<boolean> {
    console.log('📝 새 예약 알림 전송 중...', bookingData.guest_name)
    return await telegramNotification.notifyNewBooking(bookingData)
  },

  /**
   * 새 메시지/연락 알림
   */
  async notifyNewMessage(messageData: {
    id?: string
    sender_name?: string
    name?: string
    email?: string
    phone?: string
    message?: string
    subject?: string
    source?: string
  }): Promise<boolean> {
    console.log('💬 새 메시지 알림 전송 중...', messageData.sender_name || messageData.name)
    return await telegramNotification.notifyNewMessage(messageData)
  },

  /**
   * 새 문의 접수 알림
   */
  async notifyNewInquiry(inquiryData: {
    id?: string
    type?: string
    customer_name?: string
    email?: string
    phone?: string
    content?: string
    property_id?: string
    preferred_date?: string
  }): Promise<boolean> {
    console.log('❓새 문의 알림 전송 중...', inquiryData.customer_name)
    return await telegramNotification.notifyNewInquiry(inquiryData)
  },

  /**
   * 결제 완료 알림
   */
  async notifyPaymentCompleted(paymentData: {
    id?: string
    customer_name?: string
    name?: string
    amount?: number
    payment_method?: string
    booking_id?: string
    transaction_id?: string
  }): Promise<boolean> {
    console.log('💰 결제 완료 알림 전송 중...', paymentData.customer_name || paymentData.name)
    return await telegramNotification.notifyPaymentEvent(paymentData, 'completed')
  },

  /**
   * 결제 실패 알림
   */
  async notifyPaymentFailed(paymentData: {
    id?: string
    customer_name?: string
    name?: string
    amount?: number
    payment_method?: string
    booking_id?: string
    error_message?: string
  }): Promise<boolean> {
    console.log('❌ 결제 실패 알림 전송 중...', paymentData.customer_name || paymentData.name)
    return await telegramNotification.notifyPaymentEvent(paymentData, 'failed')
  },

  /**
   * 환불 처리 알림
   */
  async notifyPaymentRefunded(paymentData: {
    id?: string
    customer_name?: string
    name?: string
    amount?: number
    payment_method?: string
    booking_id?: string
    refund_reason?: string
  }): Promise<boolean> {
    console.log('↩️ 환불 처리 알림 전송 중...', paymentData.customer_name || paymentData.name)
    return await telegramNotification.notifyPaymentEvent(paymentData, 'refunded')
  },

  /**
   * 시스템 경고 알림
   */
  async notifySystemAlert(alertData: {
    type?: string
    message?: string
    severity?: 'info' | 'warning' | 'error' | 'critical'
    action_required?: boolean
    details?: any
  }): Promise<boolean> {
    console.log('🚨 시스템 알림 전송 중...', alertData.type)
    return await telegramNotification.notifySystemAlert(alertData)
  },

  /**
   * 예약 취소 알림
   */
  async notifyBookingCancelled(bookingData: {
    id?: string
    guest_name?: string
    property_name?: string
    check_in?: string
    check_out?: string
    cancellation_reason?: string
    cancelled_by?: string
  }): Promise<boolean> {
    console.log('🚫 예약 취소 알림 전송 중...', bookingData.guest_name)
    
    const notification = {
      type: 'booking',
      title: '🚫 예약이 취소되었습니다',
      message: `
<b>📋 취소된 예약 정보</b>
• <b>고객명:</b> ${bookingData.guest_name || '익명'}
• <b>숙소:</b> ${bookingData.property_name || '미정'}
• <b>체크인:</b> ${bookingData.check_in ? new Date(bookingData.check_in).toLocaleDateString('ko-KR') : '미정'}
• <b>체크아웃:</b> ${bookingData.check_out ? new Date(bookingData.check_out).toLocaleDateString('ko-KR') : '미정'}
• <b>취소사유:</b> ${bookingData.cancellation_reason || '사유 없음'}
• <b>취소자:</b> ${bookingData.cancelled_by || '고객'}
• <b>취소시간:</b> ${new Date().toLocaleString('ko-KR')}

<i>환불 처리가 필요한지 확인해주세요.</i>
      `.trim(),
      priority: 'high' as const
    }

    return await telegramNotification.sendNotificationToAllAdmins(notification)
  },

  /**
   * 리뷰 등록 알림
   */
  async notifyNewReview(reviewData: {
    id?: string
    guest_name?: string
    property_name?: string
    rating?: number
    comment?: string
    booking_id?: string
  }): Promise<boolean> {
    console.log('⭐ 새 리뷰 알림 전송 중...', reviewData.guest_name)
    
    const stars = '⭐'.repeat(reviewData.rating || 0)
    const notification = {
      type: 'message' as const,
      title: '⭐ 새로운 리뷰가 등록되었습니다!',
      message: `
<b>📝 리뷰 정보</b>
• <b>고객명:</b> ${reviewData.guest_name || '익명'}
• <b>숙소:</b> ${reviewData.property_name || '미정'}
• <b>평점:</b> ${stars} (${reviewData.rating || 0}/5)

<b>💭 리뷰 내용:</b>
${reviewData.comment || '내용 없음'}

<i>고객의 소중한 피드백을 확인해보세요.</i>
      `.trim(),
      priority: 'normal' as const
    }

    return await telegramNotification.sendNotificationToAllAdmins(notification)
  },

  /**
   * 긴급 상황 알림
   */
  async notifyEmergency(emergencyData: {
    type?: string
    location?: string
    description?: string
    contact_info?: string
    action_required?: string
  }): Promise<boolean> {
    console.log('🆘 긴급 상황 알림 전송 중...', emergencyData.type)
    
    const notification = {
      type: 'system' as const,
      title: '🆘 긴급 상황 발생!',
      message: `
<b>🚨 긴급 상황</b>
• <b>유형:</b> ${emergencyData.type || '일반 긴급상황'}
• <b>장소:</b> ${emergencyData.location || '위치 미상'}
• <b>상황:</b> ${emergencyData.description || '상세 내용 없음'}
• <b>연락처:</b> ${emergencyData.contact_info || '없음'}
• <b>발생시간:</b> ${new Date().toLocaleString('ko-KR')}

${emergencyData.action_required ? `<b>⚠️ 필요 조치:</b> ${emergencyData.action_required}` : ''}

<b>🔥 즉시 대응이 필요합니다!</b>
      `.trim(),
      priority: 'urgent' as const
    }

    return await telegramNotification.sendNotificationToAllAdmins(notification)
  }
}

/**
 * 웹훅 기반 알림 헬퍼 (선택적으로 사용)
 */
export const WebhookHelpers = {
  async notifyNewBooking(data: any) { return await triggerNotification('booking.created', data) },
  async notifyNewMessage(data: any) { return await triggerNotification('message.received', data) },
  async notifyNewInquiry(data: any) { return await triggerNotification('inquiry.submitted', data) },
  async notifyPaymentCompleted(data: any) { return await triggerNotification('payment.completed', data) },
  async notifyPaymentFailed(data: any) { return await triggerNotification('payment.failed', data) },
  async notifyPaymentRefunded(data: any) { return await triggerNotification('payment.refunded', data) },
  async notifySystemAlert(data: any) { return await triggerNotification('system.alert', data) }
}