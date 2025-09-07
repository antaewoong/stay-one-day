'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Search, Bell, User, Menu, X, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminHeader() {
  const [currentDate] = useState(new Date())
  const router = useRouter()
  const supabase = createClient()
  
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
              <div className="text-xs text-gray-400">총 객실</div>
              <div className="text-gray-500">오늘 입실 예약이 없습니다</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 min-w-[120px] text-center">
              <div className="text-sm text-gray-500 mb-1">오늘 퇴실</div>
              <div className="text-sm text-gray-600 mb-2">객실명 | 예약자</div>
              <div className="text-xs text-gray-400">총 객실</div>
              <div className="text-gray-500">오늘 퇴실 예약이 없습니다</div>
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
            <span className="text-xs text-gray-400">예약 더보기</span>
          </div>
          <div className="text-gray-500 text-sm">등록된 공지사항이 없습니다.</div>
        </div>
        
        {/* 문의사항 */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-800">문의사항</h3>
          </div>
          <div className="text-gray-500 text-sm">등록된 문의사항이 없습니다.</div>
        </div>
        
        {/* 메뉴얼 */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-800">메뉴얼</h3>
          </div>
          <div className="text-gray-500 text-sm">준비중 입니다.</div>
        </div>
      </div>
    </header>
  )
}