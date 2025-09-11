'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import HostSidebar from '@/components/host/HostSidebar'
import HostHeader from '@/components/host/HostHeader'
import { Menu } from 'lucide-react'

export default function HostLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    
    // 로그인 페이지에서는 인증 체크를 하지 않음
    if (pathname === '/host/login') {
      setIsAuthenticated(true)
      return
    }

    const checkAuth = () => {
      // localStorage에서 Supabase 토큰 확인 + sessionStorage에서 호스트 데이터 확인
      const supabaseToken = localStorage.getItem('sb-fcmauibvdqbocwhloqov-auth-token')
      const hostUserData = sessionStorage.getItem('hostUser')
      
      console.log('Layout 인증 체크:', { 
        hasToken: !!supabaseToken, 
        hasHostData: !!hostUserData 
      })
      
      if (!supabaseToken && !hostUserData) {
        console.log('Layout: 인증 정보 없음, 로그인 페이지로 이동')
        setIsAuthenticated(false)
        router.replace('/host/login')
      } else {
        console.log('Layout: 인증 확인됨')
        setIsAuthenticated(true)
      }
    }

    checkAuth()
  }, [router, pathname])

  // 로그인 페이지에서는 레이아웃 없이 순수한 페이지만 렌더링
  if (pathname === '/host/login') {
    return <>{children}</>
  }

  // SSR/Hydration 호환성을 위해 mounted 상태 확인
  if (!mounted) {
    return null // 마운트되기 전까지 아무것도 렌더링하지 않음
  }

  // 인증되지 않은 경우 또는 인증 확인 중인 경우
  if (isAuthenticated === null || isAuthenticated === false) {
    return null // 빈 화면 표시하여 로딩 없이 바로 리다이렉트
  }

  return (
    <div className="host-layout flex h-screen bg-gray-50">
      <HostSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col min-h-0 lg:ml-0">
        {/* Mobile header with hamburger menu */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-green-600">Stay One Day</h1>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>
        
        <div className="flex-shrink-0">
          <HostHeader />
        </div>
        
        <main className="flex-1 overflow-y-auto p-6 min-h-0">
          {children}
        </main>
      </div>
    </div>
  )
}