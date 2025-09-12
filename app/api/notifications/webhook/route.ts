import { NextRequest, NextResponse } from 'next/server'
import { telegramNotification } from '@/lib/telegram/notification-service'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * 내부 알림 트리거 웹훅
 * 예약, 메시지, 문의 등 이벤트 발생 시 텔레그램 알림 전송
 */
export async function POST(request: NextRequest) {
  try {
    // 내부 요청 검증 (보안)
    const authHeader = request.headers.get('Authorization')
    const internalSecret = process.env.INTERNAL_WEBHOOK_SECRET || 'fallback-secret'
    
    if (authHeader !== `Bearer ${internalSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { eventType, data } = body

    console.log(`📣 알림 이벤트 수신: ${eventType}`)

    let success = false

    switch (eventType) {
      case 'booking.created':
        success = await telegramNotification.notifyNewBooking(data)
        break

      case 'message.received':
        success = await telegramNotification.notifyNewMessage(data)
        break

      case 'inquiry.submitted':
        success = await telegramNotification.notifyNewInquiry(data)
        break

      case 'payment.completed':
        success = await telegramNotification.notifyPaymentEvent(data, 'completed')
        break

      case 'payment.failed':
        success = await telegramNotification.notifyPaymentEvent(data, 'failed')
        break

      case 'payment.refunded':
        success = await telegramNotification.notifyPaymentEvent(data, 'refunded')
        break

      case 'system.alert':
        success = await telegramNotification.notifySystemAlert(data)
        break

      default:
        console.warn(`알 수 없는 이벤트 타입: ${eventType}`)
        return NextResponse.json({ error: 'Unknown event type' }, { status: 400 })
    }

    if (success) {
      console.log(`✅ ${eventType} 알림 전송 완료`)
      return NextResponse.json({ success: true })
    } else {
      console.error(`❌ ${eventType} 알림 전송 실패`)
      return NextResponse.json({ error: 'Notification failed' }, { status: 500 })
    }

  } catch (error) {
    console.error('알림 웹훅 처리 실패:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * 테스트용 알림 전송
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const testType = searchParams.get('test')

    if (!testType) {
      return NextResponse.json({
        message: 'Available tests: booking, message, inquiry, payment, system',
        usage: '/api/notifications/webhook?test=booking'
      })
    }

    let success = false
    const testData = generateTestData(testType)

    switch (testType) {
      case 'booking':
        success = await telegramNotification.notifyNewBooking(testData)
        break
      case 'message':
        success = await telegramNotification.notifyNewMessage(testData)
        break
      case 'inquiry':
        success = await telegramNotification.notifyNewInquiry(testData)
        break
      case 'payment':
        success = await telegramNotification.notifyPaymentEvent(testData, 'completed')
        break
      case 'system':
        success = await telegramNotification.notifySystemAlert(testData)
        break
      default:
        return NextResponse.json({ error: 'Invalid test type' }, { status: 400 })
    }

    return NextResponse.json({
      success,
      message: success ? `${testType} 테스트 알림이 전송되었습니다` : '알림 전송에 실패했습니다'
    })

  } catch (error) {
    console.error('테스트 알림 실패:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
}

/**
 * 테스트 데이터 생성
 */
function generateTestData(type: string) {
  const baseTime = new Date()

  switch (type) {
    case 'booking':
      return {
        id: 'test-booking-001',
        guest_name: '김테스트',
        property_name: 'Stay OneDay 강남점',
        host_name: '강남호스트',
        check_in: new Date(baseTime.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        check_out: new Date(baseTime.getTime() + 48 * 60 * 60 * 1000).toISOString(),
        total_price: 120000,
        guest_count: 2,
        created_at: baseTime.toISOString()
      }

    case 'message':
      return {
        id: 'test-message-001',
        sender_name: '이고객',
        email: 'customer@example.com',
        phone: '010-1234-5678',
        message: '안녕하세요, 내일 체크인 예정인데 주차 가능한가요? 그리고 늦은 체크인이 가능한지 문의드립니다.',
        created_at: baseTime.toISOString()
      }

    case 'inquiry':
      return {
        id: 'test-inquiry-001',
        type: '예약 문의',
        customer_name: '박문의',
        email: 'inquiry@example.com',
        phone: '010-9876-5432',
        content: '다음 주말 2박 3일 예약하고 싶은데, 펜션 시설과 주변 관광지 정보를 알려주세요.',
        created_at: baseTime.toISOString()
      }

    case 'payment':
      return {
        id: 'test-payment-001',
        customer_name: '최결제',
        amount: 150000,
        payment_method: '신용카드',
        booking_id: 'booking-123',
        created_at: baseTime.toISOString()
      }

    case 'system':
      return {
        type: '시스템 점검',
        message: '예약 시스템 정기 점검이 완료되었습니다. 모든 서비스가 정상 작동 중입니다.',
        severity: 'info',
        action_required: false,
        created_at: baseTime.toISOString()
      }

    default:
      return { message: '테스트 데이터', created_at: baseTime.toISOString() }
  }
}