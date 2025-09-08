'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Phone, 
  Ban, 
  CheckCircle,
  Clock,
  Users,
  Bell,
  Settings,
  AlertTriangle,
  Building2,
  MessageSquare
} from 'lucide-react'
import Link from 'next/link'

interface MobileQuickActionsProps {
  todayCheckins?: number
  todayCheckouts?: number
  pendingBookings?: number
  hostId?: string
}

export default function MobileQuickActions({ 
  todayCheckins = 0, 
  todayCheckouts = 0, 
  pendingBookings = 0,
  hostId = ''
}: MobileQuickActionsProps) {
  return (
    <div className="space-y-4">
      {/* 오늘의 현황 */}
      <Card className="border shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Bell className="w-4 h-4 mr-2 text-blue-600" />
              오늘의 현황
            </h3>
            <Badge className="bg-blue-50 text-blue-700">
              {new Date().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-1">
                <Users className="w-4 h-4 text-white" />
              </div>
              <p className="text-lg font-bold text-green-900">{todayCheckins}</p>
              <p className="text-xs text-green-700">체크인</p>
            </div>
            
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-1">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <p className="text-lg font-bold text-blue-900">{todayCheckouts}</p>
              <p className="text-xs text-blue-700">체크아웃</p>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-1">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <p className="text-lg font-bold text-orange-900">{pendingBookings}</p>
              <p className="text-xs text-orange-700">대기예약</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 호스트 관리 센터 */}
      <Card className="border shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-blue-600" />
              호스트 관리 센터
            </h3>
            <Badge className="bg-blue-100 text-blue-700 text-xs">
              {hostId}
            </Badge>
          </div>
          
          {/* 핵심 빠른 관리 메뉴 */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center space-y-2 bg-white border-2 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200"
              asChild
            >
              <Link href="/host/reservations">
                <div className="text-center">
                  <Calendar className="w-7 h-7 text-emerald-600 mx-auto" />
                  <span className="text-xs font-bold text-emerald-900 mt-1 block">예약현황</span>
                  <span className="text-[10px] text-emerald-700">
                    오늘 {todayCheckins}입실 {todayCheckouts}퇴실
                  </span>
                </div>
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center space-y-2 bg-white border-2 border-blue-100 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
              asChild
            >
              <Link href="/host/accommodations">
                <div className="text-center">
                  <Settings className="w-7 h-7 text-blue-600 mx-auto" />
                  <span className="text-xs font-bold text-blue-900 mt-1 block">객실관리</span>
                  <span className="text-[10px] text-blue-700">방막기/방열기</span>
                </div>
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center space-y-2 bg-white border-2 border-orange-100 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
              asChild
            >
              <Link href="/host/reservations">
                <div className="text-center">
                  <Phone className="w-7 h-7 text-orange-600 mx-auto" />
                  <span className="text-xs font-bold text-orange-900 mt-1 block">전화예약</span>
                  <span className="text-[10px] text-orange-700">즉시 등록</span>
                </div>
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center space-y-2 bg-white border-2 border-purple-100 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
              asChild
            >
              <Link href="/host">
                <div className="text-center">
                  <MessageSquare className="w-7 h-7 text-purple-600 mx-auto" />
                  <span className="text-xs font-bold text-purple-900 mt-1 block">리뷰관리</span>
                  <span className="text-[10px] text-purple-700">신규 답변</span>
                </div>
              </Link>
            </Button>
          </div>

          {/* PC 전체 관리 메뉴 링크 */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button 
              variant="outline" 
              size="sm"
              className="w-full h-12 flex items-center justify-center space-x-2 bg-gray-50 hover:bg-gray-100 border-gray-200"
              asChild
            >
              <Link href="/host" className="flex items-center">
                <Building2 className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">PC에서 전체 관리 메뉴 보기</span>
                <div className="w-2 h-2 bg-blue-500 rounded-full ml-1"></div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}