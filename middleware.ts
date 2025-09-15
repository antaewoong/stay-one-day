// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

// 1) CSRF/인증 예외 경로 (세션 동기화/대시보드 등 서버 내에서 자체 검증함)
const PASS = new Set<string>([
  '/api/auth/session',        // Supabase 세션 동기화 (POST)
  '/api/host/dashboard',      // 서버에서 권한검증
  '/api/keywords/popular',    // 공개/서비스용(필요 시)
  '/api/auth/change-password' // 로그인 상태에서만 내부 처리
])

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // A. 예외 경로는 모든 체크 이전에 즉시 통과
  if (PASS.has(pathname)) return NextResponse.next()

  // B. 혹시 남아있는 withHostAuth 전역 래퍼가 있었다면 여기서 차단/우회
  //    (이 주석 아래로 과거 로그/래퍼 호출이 있었다면 삭제하세요)

  // C. 기존 CSP/CSRF/보안 헤더 로직이 있다면 유지.
  //    단, POST CSRF 검증은 PASS 경로에는 적용하지 않음.

  return NextResponse.next()
}

// (선택) 매처를 쓰셨다면, api 전체를 제외하거나 아래처럼 최소화 권장
export const config = {
  // _next 정적, 이미지, 파비콘 제외. api는 내부 분기에서 처리.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}