'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, TrendingUp, DollarSign, Home, Users, Clock, Filter } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { ko } from 'date-fns/locale'
import Header from '@/components/header'

interface BookingData {
  id: string
  check_in: string
  check_out: string
  guests: number
  total_price: number
  status: string
  space: {
    title: string
    location: string
  }
  user: {
    email: string
  }
}

export default function HostRevenuePage() {
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('this-month')
  const supabase = createClient()

  useEffect(() => {
    fetchBookings()
  }, [selectedPeriod])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let startDate, endDate
      
      switch (selectedPeriod) {
        case 'this-month':
          startDate = startOfMonth(new Date())
          endDate = endOfMonth(new Date())
          break
        case 'last-month':
          const lastMonth = subMonths(new Date(), 1)
          startDate = startOfMonth(lastMonth)
          endDate = endOfMonth(lastMonth)
          break
        case 'last-3-months':
          startDate = subMonths(new Date(), 3)
          endDate = new Date()
          break
        default:
          startDate = startOfMonth(new Date())
          endDate = endOfMonth(new Date())
      }

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          check_in,
          check_out,
          guests,
          total_price,
          status,
          space:spaces(title, location),
          user:users(email)
        `)
        .eq('space.host_id', user.id)
        .gte('check_in', startDate.toISOString())
        .lte('check_out', endDate.toISOString())
        .order('check_in', { ascending: false })

      if (error) {
        console.error('예약 데이터 조회 오류:', error)
        return
      }

      setBookings(bookings || [])
    } catch (error) {
      console.error('데이터 조회 중 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed')
    
    const totalRevenue = confirmedBookings.reduce((sum, booking) => sum + booking.total_price, 0)
    const totalBookings = confirmedBookings.length
    const totalGuests = confirmedBookings.reduce((sum, booking) => sum + booking.guests, 0)
    
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0
    
    return {
      totalRevenue,
      totalBookings,
      totalGuests,
      avgBookingValue
    }
  }

  const stats = calculateStats()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">확정</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">대기</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">취소</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'this-month': return '이번 달'
      case 'last-month': return '지난 달'
      case 'last-3-months': return '최근 3개월'
      default: return '이번 달'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">수익 현황</h1>
          <p className="text-gray-600">호스트 수익 및 예약 현황을 확인하세요</p>
        </div>

        {/* 필터 */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="this-month">이번 달</option>
              <option value="last-month">지난 달</option>
              <option value="last-3-months">최근 3개월</option>
            </select>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                총 수익
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalRevenue.toLocaleString()}원
              </div>
              <p className="text-xs text-gray-500 mt-1">{getPeriodLabel(selectedPeriod)} 기준</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                총 예약
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalBookings}건
              </div>
              <p className="text-xs text-gray-500 mt-1">확정된 예약만</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                총 게스트
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalGuests}명
              </div>
              <p className="text-xs text-gray-500 mt-1">누적 게스트 수</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                평균 예약금액
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(stats.avgBookingValue).toLocaleString()}원
              </div>
              <p className="text-xs text-gray-500 mt-1">예약당 평균</p>
            </CardContent>
          </Card>
        </div>

        {/* 예약 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              예약 상세 내역
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">데이터를 불러오는 중...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8">
                <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">해당 기간에 예약이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {booking.space?.title || '숙소명 없음'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {booking.space?.location || '위치 정보 없음'}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span>
                            {format(new Date(booking.check_in), 'MM.dd', { locale: ko })} - {format(new Date(booking.check_out), 'MM.dd', { locale: ko })}
                          </span>
                          <span>{booking.guests}명</span>
                          <span>{booking.user?.email || '게스트 정보 없음'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-3 sm:mt-0">
                        {getStatusBadge(booking.status)}
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {booking.total_price.toLocaleString()}원
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}