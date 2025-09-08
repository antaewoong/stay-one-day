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
  
  // Hook은 항상 같은 순서로 호출되어야 함
  useEffect(() => {
    // 로그인 페이지에서는 인증 체크를 하지 않음
    if (pathname === '/host/login') {
      return
    }

    const checkAuth = () => {
      const hostUser = sessionStorage.getItem('hostUser')
      if (!hostUser) {
        setIsAuthenticated(false)
        router.push('/host/login')
      } else {
        setIsAuthenticated(true)
      }
    }

    checkAuth()
  }, [router, pathname])

  // 로그인 페이지에서는 레이아웃 없이 순수한 페이지만 렌더링
  if (pathname === '/host/login') {
    return <>{children}</>
  }

  // 인증 상태 확인 중
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  // 인증되지 않은 경우
  if (!isAuthenticated) {
    return null
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