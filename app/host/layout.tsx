'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Inter } from 'next/font/google'
import { AuthProvider, useAuth } from '@/lib/auth-context'

const inter = Inter({ subsets: ['latin'] })

function HostLayoutContent({ children }: { children: React.ReactNode }) {
  const { isHost, loading, hostId } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === '/host/login') {
      setIsLoading(false)
      return
    }

    // Check authentication after loading completes
    if (!loading) {
      if (!isHost) {
        router.replace('/host/login')
        return
      }
      setIsLoading(false)
    }
  }, [isHost, loading, pathname, router])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">인증을 확인하는 중...</p>
        </div>
      </div>
    )
  }

  // Show login page
  if (pathname === '/host/login') {
    return <div className={inter.className}>{children}</div>
  }

  // Show protected content
  if (isHost && hostId) {
    return (
      <div className={inter.className}>
        {/* Host Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  Stay One Day 호스트
                </h1>
                <span className="ml-3 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                  {hostId}
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  안전하게 로그인됨
                </span>
                <button
                  onClick={() => {
                    sessionStorage.clear()
                    router.push('/host/login')
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </div>
    )
  }

  // Fallback
  return null
}

export default function HostLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <HostLayoutContent>{children}</HostLayoutContent>
    </AuthProvider>
  )
}