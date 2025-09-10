'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Menu, User, LogOut, Bell, Home } from 'lucide-react'

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
      const response = await fetch(`/api/host/stats?host_id=${encodeURIComponent(hostInfo.host_id)}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch host stats')
      }

      const result = await response.json()
      
      if (result.success) {
        setTodayStats(result.stats)
      } else {
        throw new Error(result.error || 'Unknown error')
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
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3">
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

      {/* 데스크탑 헤더 */}
      <div className="hidden lg:flex items-center justify-between">
        {/* Left Side - Date */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-600">
            <span className="font-medium">{formatDate(currentDate)}</span>
          </div>
        </div>

        {/* Center - Today's Stats */}
        <div className="flex items-center gap-6">
          <div className="bg-gray-50 rounded-lg px-4 py-2 text-center">
            <div className="text-xs text-gray-500">오늘 체크인</div>
            <div className="text-sm font-medium text-gray-900">{todayStats.checkins}건</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg px-4 py-2 text-center">
            <div className="text-xs text-gray-500">오늘 체크아웃</div>
            <div className="text-sm font-medium text-gray-900">{todayStats.checkouts}건</div>
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
            <div className="text-xs text-gray-400">{hostData?.name || '사용자'}</div>
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
      
      {/* 모바일 간단한 통계 */}
      <div className="lg:hidden mt-3 pt-3 border-t border-gray-100">
        <div className="flex justify-around text-center">
          <div>
            <div className="text-xs text-gray-500">체크인</div>
            <div className="text-sm font-medium text-gray-900">{todayStats.checkins}건</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">체크아웃</div>
            <div className="text-sm font-medium text-gray-900">{todayStats.checkouts}건</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">신규예약</div>
            <div className="text-sm font-medium text-green-600">{todayStats.reservations}건</div>
          </div>
        </div>
      </div>

      {/* 데스크탑 상세 섹션 */}
      <div className="hidden lg:block mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 오늘의 현황 */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-800">오늘의 현황</h3>
            <Home className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-gray-600 text-sm space-y-1">
            <div>체크인: {todayStats.checkins}건</div>
            <div>체크아웃: {todayStats.checkouts}건</div>
            <div>신규예약: {todayStats.reservations}건</div>
          </div>
        </div>
        
        {/* 빠른 액션 */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-800">빠른 액션</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/host/reservations')}>
              예약관리
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/host/calendar')}>
              달력보기
            </Button>
          </div>
        </div>
        
        {/* 알림 */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-800">알림</h3>
            <Bell className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-gray-600 text-sm space-y-1">
            <div>오늘 체크인: {todayStats.checkins}건</div>
            <div>오늘 체크아웃: {todayStats.checkouts}건</div>
            {todayStats.reservations > 0 && (
              <div className="text-green-600">신규 예약: {todayStats.reservations}건</div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}