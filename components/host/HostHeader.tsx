'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Menu, User, LogOut, Bell, Home } from 'lucide-react'
import { hostGet } from '@/lib/host-api'

export default function HostHeader() {
  const [currentDate] = useState(new Date())
  const [hostData, setHostData] = useState<any>(null)
  const [todayStats, setTodayStats] = useState({
    checkins: 0,
    checkouts: 0,
    reservations: 0
  })
  const router = useRouter()

  useEffect(() => {
    const userData = sessionStorage.getItem('hostUser')
    if (userData) {
      setHostData(JSON.parse(userData))
      loadTodayStats(JSON.parse(userData))
    }
  }, [])

  const loadTodayStats = async (hostInfo: any) => {
    try {
      const response = await hostGet('/api/host/stats')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch host stats')
      }

      if (result.ok) {
        // API 응답 형식에 맞게 매핑
        setTodayStats({
          checkins: result.data.today_reservations || 0,
          checkouts: result.data.today_reservations || 0,
          reservations: result.data.today_reservations || 0
        })
      } else {
        throw new Error(result.message || 'Unknown error')
      }
    } catch (error) {
      console.error('오늘 통계 로드 실패:', error)
      setTodayStats({
        checkins: 0,
        checkouts: 0,
        reservations: 0
      })
    }
  }
  
  const handleLogout = () => {
    // 세션 스토리지 삭제
    sessionStorage.removeItem('hostUser')
    
    // 쿠키 삭제 (미들웨어 인증 쿠키)
    document.cookie = 'host-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    
    router.push('/host/login')
  }
  
  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString()
    const day = date.getDate().toString()
    const weekDay = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
    
    return `${year}.${month}.${day} (${weekDay})`
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-2">
      {/* 모바일 헤더 */}
      <div className="lg:hidden flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-800">{hostData?.business_name || '호스트'}</div>
          <div className="text-xs text-gray-500">{formatDate(currentDate)}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" title="알림" className="p-2">
            <Bell className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout} 
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-1" />
            로그아웃
          </Button>
        </div>
      </div>

      {/* 데스크탑 헤더 - 컴팩트 */}
      <div className="hidden lg:flex items-center justify-between">
        {/* Left Side - Date */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-sm font-medium">{formatDate(currentDate)}</span>
          </div>
        </div>

        {/* Right Side - Host Info & Actions */}
        <div className="flex items-center gap-4">
          {/* Host Info */}
          <div className="text-right">
            <div className="text-sm">
              <span className="font-medium text-green-600">호스트</span>
              <span className="text-gray-500 ml-1">({hostData?.business_name || '호스트'})</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" title="알림">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" title="프로필">
              <User className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout} 
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-1" />
              로그아웃
            </Button>
          </div>
        </div>
      </div>

    </header>
  )
}