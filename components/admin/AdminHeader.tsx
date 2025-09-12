'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { safe } from '@/lib/utils/safe-array'
import { Button } from '@/components/ui/button'
import { Search, Bell, User, Menu, X, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminHeader() {
  const [currentDate] = useState(new Date())
  const [todayStats, setTodayStats] = useState({
    checkins: 0,
    checkouts: 0
  })
  const [notices, setNotices] = useState([])
  const [inquiries, setInquiries] = useState([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadTodayStats()
    loadNotices()
    loadInquiries()
  }, [])

  const loadTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // 오늘의 체크인 예약 가져오기
      const { data: todayCheckins } = await supabase
        .from('reservations')
        .select('id, guest_name, accommodations(name)')
        .eq('checkin_date', today)
        .eq('status', 'confirmed')

      // 오늘의 체크아웃 예약 가져오기  
      const { data: todayCheckouts } = await supabase
        .from('reservations')
        .select('id, guest_name, accommodations(name)')
        .eq('checkout_date', today)
        .eq('status', 'confirmed')

      setTodayStats({
        checkins: todayCheckins?.length || 0,
        checkouts: todayCheckouts?.length || 0
      })
    } catch (error) {
      console.error('오늘 통계 로드 실패:', error)
    }
  }

  const loadNotices = async () => {
    try {
      const { data } = await supabase
        .from('notices')
        .select('id, title, content, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(3)

      setNotices(safe(data))
    } catch (error) {
      console.error('공지사항 로드 실패:', error)
    }
  }

  const loadInquiries = async () => {
    try {
      const { data } = await supabase
        .from('inquiries')
        .select('id, title, content, status, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(3)

      setInquiries(data || [])
    } catch (error) {
      console.error('문의사항 로드 실패:', error)
    }
  }
  
  const handleLogout = async () => {
    try {
      // Supabase 로그아웃
      await supabase.auth.signOut()
      
      // SessionStorage 클리어
      sessionStorage.clear()
      localStorage.clear()
      
      // 로그인 페이지로 이동
      router.push('/admin/login')
    } catch (error) {
      console.error('로그아웃 오류:', error)
      // 강제 로그아웃
      sessionStorage.clear()
      localStorage.clear()
      router.push('/admin/login')
    }
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
              <div className="text-sm text-gray-500 mb-1">오늘 입실</div>
              <div className="text-sm text-gray-600 mb-2">객실명 | 예약자</div>
              <div className="text-xs text-gray-400">총 {todayStats.checkins}건</div>
              <div className="text-gray-500">
                {todayStats.checkins === 0 ? '오늘 입실 예약이 없습니다' : `${todayStats.checkins}건의 체크인`}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 min-w-[120px] text-center">
              <div className="text-sm text-gray-500 mb-1">오늘 퇴실</div>
              <div className="text-sm text-gray-600 mb-2">객실명 | 예약자</div>
              <div className="text-xs text-gray-400">총 {todayStats.checkouts}건</div>
              <div className="text-gray-500">
                {todayStats.checkouts === 0 ? '오늘 퇴실 예약이 없습니다' : `${todayStats.checkouts}건의 체크아웃`}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - User & Stats */}
        <div className="flex items-center gap-4">
          {/* Statistics */}
          <div className="text-right">
            <div className="text-sm">
              <span className="font-medium text-red-600">관리자</span>
              <span className="text-gray-500 ml-1">(Admin)</span>
            </div>
          </div>
          
          {/* User Menu */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <User className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} title="로그아웃">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Sub sections */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        {/* 공지사항 */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-800">공지사항</h3>
            <span className="text-xs text-gray-400">최신 {notices.length}개</span>
          </div>
          <div className="space-y-2">
            {notices.length > 0 ? (
              notices.slice(0, 2).map((notice: any) => (
                <div key={notice.id} className="text-sm">
                  <div className="font-medium text-gray-700 truncate">{notice.title}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(notice.created_at).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm">등록된 공지사항이 없습니다.</div>
            )}
          </div>
        </div>
        
        {/* 문의사항 */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-800">문의사항</h3>
            <span className="text-xs text-red-400">처리 대기 {inquiries.length}개</span>
          </div>
          <div className="space-y-2">
            {inquiries.length > 0 ? (
              inquiries.slice(0, 2).map((inquiry: any) => (
                <div key={inquiry.id} className="text-sm">
                  <div className="font-medium text-gray-700 truncate">{inquiry.title}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(inquiry.created_at).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm">처리할 문의사항이 없습니다.</div>
            )}
          </div>
        </div>
        
        {/* 시스템 현황 */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-800">시스템 현황</h3>
          </div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">오늘 예약:</span>
              <span className="font-medium">{todayStats.checkins + todayStats.checkouts}건</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">활성 공지:</span>
              <span className="font-medium">{notices.length}개</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">대기 문의:</span>
              <span className="font-medium text-red-600">{inquiries.length}개</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}