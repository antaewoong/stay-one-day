'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Menu, User, LogOut, Bell, Home } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function HostHeader() {
  const [currentDate] = useState(new Date())
  const [hostData, setHostData] = useState<any>(null)
  const [todayStats, setTodayStats] = useState({
    checkins: 0,
    checkouts: 0,
    reservations: 0
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const userData = sessionStorage.getItem('hostUser')
    if (userData) {
      setHostData(JSON.parse(userData))
      loadTodayStats(JSON.parse(userData))
    }
  }, [])

  const loadTodayStats = async (hostInfo: any) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // 호스트 정보 가져오기
      const { data: hostData } = await supabase
        .from('hosts')
        .select('id')
        .eq('host_id', hostInfo.host_id)
        .single()

      if (!hostData) return

      // 호스트의 숙소들 가져오기
      const { data: accommodations } = await supabase
        .from('accommodations')
        .select('id')
        .eq('host_id', hostData.id)

      if (!accommodations || accommodations.length === 0) return

      const accommodationIds = accommodations.map(acc => acc.id)

      // 오늘의 체크인 예약 가져오기
      const { data: todayCheckins } = await supabase
        .from('reservations')
        .select('id')
        .in('accommodation_id', accommodationIds)
        .eq('checkin_date', today)
        .eq('status', 'confirmed')

      // 오늘의 체크아웃 예약 가져오기  
      const { data: todayCheckouts } = await supabase
        .from('reservations')
        .select('id')
        .in('accommodation_id', accommodationIds)
        .eq('checkout_date', today)
        .eq('status', 'confirmed')

      // 오늘의 신규 예약 가져오기
      const { data: todayReservations } = await supabase
        .from('reservations')
        .select('id')
        .in('accommodation_id', accommodationIds)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)

      setTodayStats({
        checkins: todayCheckins?.length || 0,
        checkouts: todayCheckouts?.length || 0,
        reservations: todayReservations?.length || 0
      })
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
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Side - Date */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Menu className="w-5 h-5" />
            <span className="font-medium">{formatDate(currentDate)}</span>
          </div>
        </div>

        {/* Center - Today & Stats */}
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">Today</div>
            <div className="font-bold text-lg">{formatDate(currentDate)}</div>
          </div>
          
          {/* Today's Stats */}
          <div className="flex gap-6">
            <div className="bg-gray-50 rounded-lg p-4 min-w-[120px] text-center">
              <div className="text-sm text-gray-500 mb-1">오늘 체크인</div>
              <div className="text-sm text-gray-600 mb-2">예약자</div>
              <div className="text-xs text-gray-400">총 {todayStats.checkins}건</div>
              <div className="text-gray-500">
                {todayStats.checkins === 0 ? '오늘 체크인 예약이 없습니다' : `${todayStats.checkins}건의 체크인`}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 min-w-[120px] text-center">
              <div className="text-sm text-gray-500 mb-1">오늘 체크아웃</div>
              <div className="text-sm text-gray-600 mb-2">예약자</div>
              <div className="text-xs text-gray-400">총 {todayStats.checkouts}건</div>
              <div className="text-gray-500">
                {todayStats.checkouts === 0 ? '오늘 체크아웃 예약이 없습니다' : `${todayStats.checkouts}건의 체크아웃`}
              </div>
            </div>
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
            <Button variant="ghost" size="sm" onClick={handleLogout} title="로그아웃">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Sub sections - 모바일에서는 간소화 */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
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