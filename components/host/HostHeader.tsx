'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Bell, 
  Settings, 
  User,
  LogOut,
  DollarSign,
  Calendar,
  Star
} from 'lucide-react'

export default function HostHeader() {
  const router = useRouter()
  const [hostUser, setHostUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const userData = sessionStorage.getItem('hostUser')
    if (userData) {
      setHostUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem('hostUser')
    router.push('/host/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-green-600 to-green-700">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <div>
              <h1 className="text-xl font-light tracking-tight text-gray-900">
                stay<span className="font-medium">oneday</span>
              </h1>
              <p className="text-sm text-gray-600">호스트 시스템</p>
            </div>
          </div>
          {hostUser && (
            <Badge className="text-xs px-2 py-1 bg-green-100 text-green-800 border-green-200">
              {hostUser.isAdmin ? 'Admin Override' : 'Host'}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="검색..."
              className="pl-10 w-80 border-gray-200 focus:border-gray-300 focus:ring-0 bg-gray-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* 빠른 통계 */}
          <div className="hidden lg:flex items-center space-x-4 px-4 py-2 bg-gray-50 rounded-lg">
            <div className="flex items-center text-sm">
              <DollarSign className="w-4 h-4 text-green-600 mr-1" />
              <span className="font-medium text-gray-900">₩2,850,000</span>
              <span className="text-gray-500 ml-1">월수익</span>
            </div>
            <div className="flex items-center text-sm">
              <Calendar className="w-4 h-4 text-blue-600 mr-1" />
              <span className="font-medium text-gray-900">23</span>
              <span className="text-gray-500 ml-1">월예약</span>
            </div>
            <div className="flex items-center text-sm">
              <Star className="w-4 h-4 text-yellow-600 mr-1" />
              <span className="font-medium text-gray-900">4.8</span>
              <span className="text-gray-500 ml-1">평점</span>
            </div>
          </div>
          
          <Button variant="outline" size="sm" className="border-gray-200 hover:bg-gray-50">
            <Bell className="w-4 h-4 mr-2" />
            알림 
            <Badge className="ml-1 bg-red-500 text-white text-xs">5</Badge>
          </Button>

          <Button variant="outline" size="sm" className="border-gray-200 hover:bg-gray-50">
            <Settings className="w-4 h-4 mr-2" />
            설정
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
          >
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </Button>

          {hostUser && (
            <div className="flex items-center space-x-2 pl-4 border-l border-gray-200">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {hostUser.name ? hostUser.name[0] : 'H'}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{hostUser.name || '호스트'}</div>
                <div className="text-xs text-gray-500">{hostUser.business_name || '사업자명'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}