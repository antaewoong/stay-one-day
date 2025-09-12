import { NextRequest, NextResponse } from 'next/server'
import { NotificationHelpers } from '@/lib/telegram/notification-helpers'

export async function POST(request: NextRequest) {
  const TOSS_PAYMENTS_SECRET_KEY = process.env.TOSS_PAYMENTS_SECRET_KEY

  if (!TOSS_PAYMENTS_SECRET_KEY) {
    return NextResponse.json(
      { error: 'TOSS_PAYMENTS_SECRET_KEY is not configured' },
      { status: 500 }
    )
  }
  try {
    const { paymentKey, orderId, amount } = await request.json()

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 토스페이먼츠 결제 승인 API 호출
    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(TOSS_PAYMENTS_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount
      })
    })

    const paymentData = await response.json()

    if (!response.ok) {
      console.error('토스페이먼츠 결제 승인 실패:', paymentData)
      return NextResponse.json(
        { 
          error: '결제 승인에 실패했습니다.',
          details: paymentData 
        },
        { status: response.status }
      )
    }

    // 결제 성공 알림 전송 (비동기 처리)
    if (paymentData.status === 'DONE') {
      NotificationHelpers.notifyPaymentCompleted({
        id: paymentData.paymentKey,
        customer_name: paymentData.customerName || '고객',
        amount: paymentData.totalAmount,
        payment_method: paymentData.method,
        booking_id: orderId,
        transaction_id: paymentData.paymentKey
      }).catch(error => {
        console.error('결제 완료 알림 전송 실패:', error)
      })
    } else if (paymentData.status === 'FAILED') {
      NotificationHelpers.notifyPaymentFailed({
        id: paymentData.paymentKey,
        customer_name: paymentData.customerName || '고객',
        amount: paymentData.totalAmount,
        payment_method: paymentData.method,
        booking_id: orderId,
        error_message: paymentData.failure?.message || '알 수 없는 오류'
      }).catch(error => {
        console.error('결제 실패 알림 전송 실패:', error)
      })
    }

    // 성공적인 결제 승인
    return NextResponse.json({
      success: true,
      payment: paymentData
    })

  } catch (error) {
    console.error('결제 승인 처리 중 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}