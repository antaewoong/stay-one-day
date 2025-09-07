import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  // 관리자 페이지 보호 (로그인 페이지 제외)
  if (req.nextUrl.pathname.startsWith('/admin') && 
      req.nextUrl.pathname !== '/admin/login') {
    
    const authToken = req.cookies.get('admin-auth')
    
    if (!authToken) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD
    
    // 환경변수 슈퍼 관리자 또는 데이터베이스 관리자 토큰 확인
    const isEnvAdmin = authToken.value === adminPassword
    const isDbAdmin = authToken.value.startsWith('db-admin-')
    
    if (!isEnvAdmin && !isDbAdmin) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  // 호스트 페이지 보호 (로그인 페이지 제외)
  if (req.nextUrl.pathname.startsWith('/host') && 
      req.nextUrl.pathname !== '/host/login') {
    
    const hostToken = req.cookies.get('host-auth')
    
    if (!hostToken) {
      return NextResponse.redirect(new URL('/host/login', req.url))
    }
    
    // 호스트 토큰 형식 확인: host-{id}
    if (!hostToken.value.startsWith('host-')) {
      return NextResponse.redirect(new URL('/host/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/host/:path*']
}