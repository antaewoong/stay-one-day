/**
 * CSRF 토큰 생성/갱신 API
 * P1-2: CSRF 가드 구현의 일부
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateCSRFToken, getCSRFCookieOptions } from '@/lib/csrf-guard'

export async function GET(request: NextRequest) {
  try {
    // 새로운 CSRF 토큰 생성
    const csrfToken = generateCSRFToken()
    const cookieOptions = getCSRFCookieOptions()

    // 응답 생성
    const response = NextResponse.json({
      success: true,
      message: 'CSRF 토큰이 생성되었습니다'
    })

    // 쿠키와 헤더에 토큰 설정
    response.cookies.set('csrf_token', csrfToken, cookieOptions)
    response.headers.set('X-CSRF-Token', csrfToken)

    return response

  } catch (error) {
    console.error('[CSRF_TOKEN] 토큰 생성 오류:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'CSRF 토큰 생성에 실패했습니다'
      },
      { status: 500 }
    )
  }
}

// POST 요청도 같은 로직으로 처리
export async function POST(request: NextRequest) {
  return GET(request)
}