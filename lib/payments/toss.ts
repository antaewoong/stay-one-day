// 토스페이먼츠 연동 유틸리티

export interface TossPaymentConfig {
  clientKey: string
  secretKey: string
  successUrl: string
  failUrl: string
}

export interface PaymentRequest {
  orderId: string
  orderName: string
  amount: number
  customerName: string
  customerEmail: string
  customerMobilePhone?: string
}

export interface PaymentResult {
  paymentKey: string
  orderId: string
  amount: number
  status: string
  approvedAt: string
  method: string
  card?: {
    number: string
    company: string
    type: string
  }
}

export class TossPayments {
  private config: TossPaymentConfig

  constructor(config: TossPaymentConfig) {
    this.config = config
  }

  // 결제 요청
  async requestPayment(paymentData: PaymentRequest) {
    // TODO: 토스 페이먼츠 SDK 설치 후 구현
    // const tossPayments = await import('@tosspayments/payment-sdk')
    
    throw new Error('TossPayments SDK not installed. Install @tosspayments/payment-sdk first.')
    
    // return tossPayments.requestPayment('카드', {
    //   amount: paymentData.amount,
    //   orderId: paymentData.orderId,
    //   orderName: paymentData.orderName,
    //   customerName: paymentData.customerName,
    //   customerEmail: paymentData.customerEmail,
    //   customerMobilePhone: paymentData.customerMobilePhone,
    //   successUrl: this.config.successUrl,
    //   failUrl: this.config.failUrl,
    // })
  }

  // 결제 승인
  async confirmPayment(paymentKey: string, orderId: string, amount: number): Promise<PaymentResult> {
    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(this.config.secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    })

    if (!response.ok) {
      throw new Error('결제 승인 실패')
    }

    return await response.json()
  }

  // 결제 취소/환불
  async cancelPayment(paymentKey: string, cancelReason: string) {
    const response = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(this.config.secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cancelReason,
      }),
    })

    if (!response.ok) {
      throw new Error('결제 취소 실패')
    }

    return await response.json()
  }

  // 결제 내역 조회
  async getPayment(paymentKey: string) {
    const response = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(this.config.secretKey + ':').toString('base64')}`,
      },
    })

    if (!response.ok) {
      throw new Error('결제 정보 조회 실패')
    }

    return await response.json()
  }

  // 정산 데이터 조회 (토스 페이먼츠 API)
  async getSettlements(startDate: string, endDate: string) {
    const response = await fetch(`https://api.tosspayments.com/v1/settlements?startDate=${startDate}&endDate=${endDate}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(this.config.secretKey + ':').toString('base64')}`,
      },
    })

    if (!response.ok) {
      throw new Error('정산 데이터 조회 실패')
    }

    return await response.json()
  }
}

// 환경 변수에서 설정 로드
export const tossPaymentsConfig: TossPaymentConfig = {
  clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '',
  secretKey: process.env.TOSS_SECRET_KEY || '',
  successUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success`,
  failUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/fail`,
}

export const tossPayments = new TossPayments(tossPaymentsConfig)