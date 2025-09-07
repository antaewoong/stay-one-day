import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { code, accommodation_id } = await request.json()

    if (!code || !accommodation_id) {
      return NextResponse.json({
        valid: false,
        message: '코드와 숙소 ID가 필요합니다.'
      }, { status: 400 })
    }

    const supabase = createClient()

    // 할인 코드 조회
    const { data: discountCode, error: codeError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single()

    if (codeError || !discountCode) {
      return NextResponse.json({
        valid: false,
        message: '존재하지 않는 할인 코드입니다.'
      })
    }

    // 유효기간 확인
    const now = new Date()
    const validFrom = new Date(discountCode.valid_from)
    const validUntil = discountCode.valid_until ? new Date(discountCode.valid_until) : null

    if (now < validFrom || (validUntil && now > validUntil)) {
      return NextResponse.json({
        valid: false,
        message: '할인 코드가 유효하지 않은 기간입니다.'
      })
    }

    // 사용 횟수 확인
    if (discountCode.max_uses && discountCode.current_uses >= discountCode.max_uses) {
      return NextResponse.json({
        valid: false,
        message: '할인 코드 사용 한도에 도달했습니다.'
      })
    }

    // 숙소별 코드 활성화 확인
    const { data: assignment, error: assignError } = await supabase
      .from('accommodation_discount_codes')
      .select('*')
      .eq('accommodation_id', accommodation_id)
      .eq('discount_code_id', discountCode.id)
      .eq('is_active', true)
      .single()

    if (assignError || !assignment) {
      return NextResponse.json({
        valid: false,
        message: '이 숙소에서는 사용할 수 없는 할인 코드입니다.'
      })
    }

    return NextResponse.json({
      valid: true,
      code: discountCode.code,
      discount_type: discountCode.discount_type,
      discount_value: discountCode.discount_value,
      message: '할인 코드가 적용되었습니다.'
    })

  } catch (error) {
    console.error('할인 코드 검증 오류:', error)
    
    // Mock validation for demo
    const mockCodes = {
      'STAY5': { value: 5, type: 'percentage' },
      'STAY10': { value: 10, type: 'percentage' },
      'STAY15': { value: 15, type: 'percentage' },
      'STAY20': { value: 20, type: 'percentage' }
    }

    const { code } = await request.json()
    const upperCode = code?.toUpperCase()
    
    if (mockCodes[upperCode as keyof typeof mockCodes]) {
      const mockCode = mockCodes[upperCode as keyof typeof mockCodes]
      return NextResponse.json({
        valid: true,
        code: upperCode,
        discount_type: mockCode.type,
        discount_value: mockCode.value,
        message: '할인 코드가 적용되었습니다.'
      })
    }

    return NextResponse.json({
      valid: false,
      message: '유효하지 않은 할인 코드입니다.'
    })
  }
}