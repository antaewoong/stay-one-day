'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, TrendingUp, Bell } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { hostGet } from '@/lib/host-api'

export default function CompactStatusBar() {
  const [dashboardData, setDashboardData] = useState<any>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await hostGet('/api/host/dashboard')
        const result = await response.json()
        
        if (result.ok) {
          setDashboardData(result.data)
        }
      } catch (error) {
        console.error('컴팩트 상태바 데이터 로드 실패:', error)
      }
    }

    loadData()
  }, [])

  return (
    <div className="hidden md:block px-4 lg:px-8 mb-4">
      <Card className="border-0 shadow-md bg-white/90 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-8">
            
            {/* 오늘의 현황 */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">오늘의 현황</h3>
                <div className="flex space-x-4 text-xs text-gray-600 mt-1">
                  <span>체크인: <strong className="text-blue-600">{dashboardData?.today?.checkins || 0}</strong></span>
                  <span>체크아웃: <strong className="text-emerald-600">{dashboardData?.today?.checkouts || 0}</strong></span>
                  <span>대기: <strong className="text-amber-600">{dashboardData?.today?.pendingBookings || 0}</strong></span>
                </div>
              </div>
            </div>

            {/* 빠른액션 */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm mb-2">빠른액션</h3>
                <div className="flex space-x-2">
                  <Button asChild size="sm" variant="outline" className="text-xs h-7 px-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                    <Link href="/host/reservations/new">전화예약</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="text-xs h-7 px-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                    <Link href="/host/calendar">방막기</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="text-xs h-7 px-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                    <Link href="/host/accommodations">숙소관리</Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* 알림 */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">알림</h3>
                <div className="text-xs text-gray-600 mt-1 space-y-1">
                  <div className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-2"></div>
                    <span>새 예약 요청 (2시간 전)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></div>
                    <span>체크인 알림 (오늘 15:00)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  )
}