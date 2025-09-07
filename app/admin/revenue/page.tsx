'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, TrendingUp, DollarSign, Home, Users, Download, Filter, Building } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { ko } from 'date-fns/locale'
import Header from '@/components/header'

interface HostRevenue {
  host_id: string
  host_email: string
  total_revenue: number
  total_bookings: number
  commission: number
  net_revenue: number
  space_count: number
}

interface BookingData {
  id: string
  check_in: string
  check_out: string
  guests: number
  total_price: number
  status: string
  space: {
    title: string
    host_id: string
  }
  user: {
    email: string
  }
}

export default function AdminRevenuePage() {
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [hostRevenues, setHostRevenues] = useState<HostRevenue[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('this-month')
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [selectedPeriod])

  const fetchData = async () => {
    setLoading(true)
    try {
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

      // 예약 데이터 조회
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          check_in,
          check_out,
          guests,
          total_price,
          status,
          space:spaces(title, host_id),
          user:users(email)
        `)
        .gte('check_in', startDate.toISOString())
        .lte('check_out', endDate.toISOString())
        .order('check_in', { ascending: false })

      if (bookingsError) {
        console.error('예약 데이터 조회 오류:', bookingsError)
        return
      }

      setBookings(bookings || [])

      // 호스트별 정산 데이터 계산
      const hostRevenueMap = new Map<string, HostRevenue>()
      const confirmedBookings = (bookings || []).filter(b => b.status === 'confirmed')

      // 호스트 이메일 정보 조회
      const hostIds = Array.from(new Set(confirmedBookings.map(b => b.space?.host_id).filter(Boolean)))
      const { data: hosts } = await supabase
        .from('users')
        .select('id, email')
        .in('id', hostIds)

      const hostEmailMap = new Map(hosts?.map(h => [h.id, h.email]) || [])

      // 호스트별 숙소 개수 조회
      const { data: spaceCounts } = await supabase
        .from('spaces')
        .select('host_id')
        .in('host_id', hostIds)

      const spaceCountMap = new Map<string, number>()
      spaceCounts?.forEach(space => {
        const count = spaceCountMap.get(space.host_id) || 0
        spaceCountMap.set(space.host_id, count + 1)
      })

      confirmedBookings.forEach(booking => {
        const hostId = booking.space?.host_id
        if (!hostId) return

        const existingRevenue = hostRevenueMap.get(hostId) || {
          host_id: hostId,
          host_email: hostEmailMap.get(hostId) || 'Unknown',
          total_revenue: 0,
          total_bookings: 0,
          commission: 0,
          net_revenue: 0,
          space_count: spaceCountMap.get(hostId) || 0
        }

        const revenue = booking.total_price
        const commission = Math.round(revenue * 0.1) // 10% 수수료
        const netRevenue = revenue - commission

        hostRevenueMap.set(hostId, {
          ...existingRevenue,
          total_revenue: existingRevenue.total_revenue + revenue,
          total_bookings: existingRevenue.total_bookings + 1,
          commission: existingRevenue.commission + commission,
          net_revenue: existingRevenue.net_revenue + netRevenue
        })
      })

      setHostRevenues(Array.from(hostRevenueMap.values()).sort((a, b) => b.total_revenue - a.total_revenue))
      
    } catch (error) {
      console.error('데이터 조회 중 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePlatformStats = () => {
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed')
    
    const totalRevenue = confirmedBookings.reduce((sum, booking) => sum + booking.total_price, 0)
    const totalCommission = hostRevenues.reduce((sum, host) => sum + host.commission, 0)
    const totalBookings = confirmedBookings.length
    const totalHosts = hostRevenues.length
    
    return {
      totalRevenue,
      totalCommission,
      totalBookings,
      totalHosts
    }
  }

  const stats = calculatePlatformStats()

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'this-month': return '이번 달'
      case 'last-month': return '지난 달'
      case 'last-3-months': return '최근 3개월'
      default: return '이번 달'
    }
  }

  const exportToCSV = () => {
    const csvContent = [
      ['호스트 이메일', '총 매출', '예약 건수', '수수료', '정산금액', '숙소 수'],
      ...hostRevenues.map(host => [
        host.host_email,
        host.total_revenue,
        host.total_bookings,
        host.commission,
        host.net_revenue,
        host.space_count
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `정산현황_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">전체 정산 현황</h1>
          <p className="text-gray-600">플랫폼 전체 수익 및 호스트 정산 현황을 확인하세요</p>
        </div>

        {/* 필터 및 내보내기 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
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
          
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            CSV 내보내기
          </Button>
        </div>

        {/* 플랫폼 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                총 거래액
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
                <TrendingUp className="w-4 h-4 mr-2" />
                플랫폼 수수료
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalCommission.toLocaleString()}원
              </div>
              <p className="text-xs text-gray-500 mt-1">10% 수수료 기준</p>
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
                <Building className="w-4 h-4 mr-2" />
                활성 호스트
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalHosts}명
              </div>
              <p className="text-xs text-gray-500 mt-1">예약이 있는 호스트</p>
            </CardContent>
          </Card>
        </div>

        {/* 호스트별 정산 현황 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              호스트별 정산 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">데이터를 불러오는 중...</p>
              </div>
            ) : hostRevenues.length === 0 ? (
              <div className="text-center py-8">
                <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">해당 기간에 정산 데이터가 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">호스트</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">숙소 수</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">예약 건수</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">총 매출</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">수수료</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">정산금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hostRevenues.map((host) => (
                      <tr key={host.host_id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{host.host_email}</div>
                            <div className="text-sm text-gray-500">ID: {host.host_id.slice(0, 8)}...</div>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 text-gray-900">
                          {host.space_count}개
                        </td>
                        <td className="text-right py-3 px-4 text-gray-900">
                          {host.total_bookings}건
                        </td>
                        <td className="text-right py-3 px-4 text-gray-900 font-medium">
                          {host.total_revenue.toLocaleString()}원
                        </td>
                        <td className="text-right py-3 px-4 text-red-600">
                          -{host.commission.toLocaleString()}원
                        </td>
                        <td className="text-right py-3 px-4 text-green-600 font-semibold">
                          {host.net_revenue.toLocaleString()}원
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}