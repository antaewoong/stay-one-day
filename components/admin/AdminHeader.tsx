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
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-2">
      <div className="flex items-center justify-between">
        {/* Left Side - Date */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-sm font-medium">{formatDate(currentDate)}</span>
          </div>
        </div>

        {/* Center - Compact Stats */}
        <div className="hidden lg:flex items-center gap-6">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">체크인: <strong className="text-blue-600">{todayStats.checkins}</strong></span>
            <span className="text-gray-600">체크아웃: <strong className="text-emerald-600">{todayStats.checkouts}</strong></span>
            <span className="text-gray-600">대기문의: <strong className="text-red-600">{inquiries.length}</strong></span>
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
    </header>
  )
}