import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type UserRole = 'customer' | 'host' | 'admin' | 'super_admin' | 'influencer'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // 현재 경로
  const pathname = req.nextUrl.pathname
  
  // 정적 파일들은 건너뛰기
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return res
  }

  try {
    // 🔐 RLS 정책 준수: Supabase 세션 확인
    let supabase
    let session = null
    let sessionError = null
    
    try {
      supabase = createMiddlewareClient({ req, res })
      const authResult = await supabase.auth.getSession()
      session = authResult.data.session
      sessionError = authResult.error
    } catch (cookieError) {
      console.error('Cookie parsing error:', cookieError)
      // 쿠키 오류 시 기본값으로 처리
      session = null
      sessionError = null
    }
    
    console.log('Middleware - pathname:', pathname)
    console.log('Middleware - session:', session?.user?.id || 'no session')
    console.log('Middleware - session error:', sessionError)
    
    let userRole: UserRole = 'customer'
    
    if (session?.user?.id && supabase) {
      // RLS 정책에 의해 user_roles 테이블에서 역할 조회
      try {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single()
        
        if (roleData?.role) {
          userRole = roleData.role as UserRole
        }
      } catch (roleError) {
        console.error('Role fetch error:', roleError)
      }
    }
    
    // 권한 체크 함수
    const canAccessPage = (userRole: UserRole, pathname: string): boolean => {
      // Public pages - 모든 사용자 접근 가능
      const publicPages = ['/', '/spaces', '/terms', '/privacy', '/contact', '/login', '/auth', '/host/login', '/admin/login', '/influencer/login']
      if (publicPages.some(page => pathname.startsWith(page))) {
        return true
      }
      
      // Admin pages - 관리자만
      if (pathname.startsWith('/admin')) {
        return ['admin', 'super_admin'].includes(userRole)
      }
      
      // Host pages - 호스트 이상
      if (pathname.startsWith('/host')) {
        return ['host', 'admin', 'super_admin'].includes(userRole)
      }
      
      // Influencer pages - 인플루언서만
      if (pathname.startsWith('/influencer')) {
        return userRole === 'influencer' || ['admin', 'super_admin'].includes(userRole)
      }
      
      // Customer pages - 로그인한 사용자
      if (['/profile', '/reservations', '/wishlist', '/payment'].some(page => pathname.startsWith(page))) {
        return true // 로그인만 필요
      }
      
      return false
    }
    
    // 로그인이 필요한 페이지들 (로그인 페이지는 제외)
    const protectedPages = ['/admin', '/host', '/influencer', '/profile', '/reservations', '/wishlist', '/payment']
    const loginPages = ['/admin/login', '/host/login', '/influencer/login']
    const isLoginPage = loginPages.some(page => pathname === page)
    const needsAuth = protectedPages.some(page => pathname.startsWith(page)) && !isLoginPage
    
    // 로그인하지 않은 사용자가 보호된 페이지 접근 시
    if (needsAuth && !session) {
      let loginUrl = '/login'
      if (pathname.startsWith('/admin')) {
        loginUrl = '/admin/login'
      } else if (pathname.startsWith('/host')) {
        loginUrl = '/host/login'
      } else if (pathname.startsWith('/influencer')) {
        loginUrl = '/influencer/login'
      }
      
      const redirectUrl = new URL(loginUrl, req.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    // 로그인한 사용자의 권한 체크
    if (session && !canAccessPage(userRole, pathname)) {
      // 권한 없음 - 역할에 따른 기본 페이지로 리다이렉트
      let redirectPath = '/'
      
      switch (userRole) {
        case 'super_admin':
        case 'admin':
          redirectPath = '/admin'
          break
        case 'host':
          redirectPath = '/host'
          break
        case 'influencer':
          redirectPath = '/influencer'
          break
        case 'customer':
          redirectPath = '/profile'
          break
      }
      
      return NextResponse.redirect(new URL(redirectPath, req.url))
    }
    
    // 특별한 로그인 리다이렉트 처리
    if (pathname === '/login' && session) {
      // 이미 로그인한 사용자는 적절한 대시보드로
      let redirectPath = '/'
      
      switch (userRole) {
        case 'super_admin':
        case 'admin':
          redirectPath = '/admin'
          break
        case 'host':
          redirectPath = '/host'
          break
        case 'influencer':
          redirectPath = '/influencer'
          break
        case 'customer':
          redirectPath = '/'
          break
      }
      
      return NextResponse.redirect(new URL(redirectPath, req.url))
    }
    
    return res
    
  } catch (error) {
    console.error('Middleware error:', error)
    // 에러 발생 시 계속 진행
    return res
  }
}

export const config = {
  matcher: [
    // 임시로 미들웨어 비활성화 - 쿠키 파싱 오류 해결 후 재활성화 예정
    '/middleware-disabled'
  ],
}