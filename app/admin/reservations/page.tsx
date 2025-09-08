'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { Search, Eye, Phone, Mail, Calendar, Users, DollarSign, MapPin } from 'lucide-react'

interface ReservationWithAccommodation {
  id: string
  reservation_number: string
  checkin_date: string
  checkout_date: string
  guest_count: number
  guest_name: string
  guest_phone: string
  guest_email: string
  total_amount: number
  payment_status: string
  status: string
  special_requests: string | null
  created_at: string
  accommodations: {
    name: string
    region: string
    accommodation_type: string
  }
}

export default function AdminReservationsPage() {
  const supabase = createClient()
  const [reservations, setReservations] = useState<ReservationWithAccommodation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  useEffect(() => {
    loadReservations()
  }, [])

  const loadReservations = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('reservations')
        .select(`
          *,
          accommodations!inner(name, region, accommodation_type)
        `)
        .order('created_at', { ascending: false })

      // 필터 적용
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }
      
      if (paymentFilter !== 'all') {
        query = query.eq('payment_status', paymentFilter)
      }

      if (dateFilter !== 'all') {
        const today = new Date()
        const filterDate = new Date()
        
        switch (dateFilter) {
          case 'today':
            filterDate.setDate(today.getDate())
            query = query.eq('checkin_date', filterDate.toISOString().split('T')[0])
            break
          case 'tomorrow':
            filterDate.setDate(today.getDate() + 1)
            query = query.eq('checkin_date', filterDate.toISOString().split('T')[0])
            break
          case 'this_week':
            const weekStart = new Date(today.setDate(today.getDate() - today.getDay()))
            const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6))
            query = query.gte('checkin_date', weekStart.toISOString().split('T')[0])
                        .lte('checkin_date', weekEnd.toISOString().split('T')[0])
            break
        }
      }

      if (searchQuery) {
        query = query.or(`guest_name.ilike.%${searchQuery}%,guest_phone.ilike.%${searchQuery}%,reservation_number.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) throw error

      setReservations(data || [])
    } catch (error) {
      console.error('예약 목록 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 검색 및 필터 변경시 재로드
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadReservations()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, statusFilter, paymentFilter, dateFilter])

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error

      loadReservations()
      alert('예약 상태가 변경되었습니다.')
    } catch (error) {
      console.error('상태 변경 실패:', error)
      alert('상태 변경에 실패했습니다.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'no_show': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-purple-100 text-purple-800'
      case 'partial_refund': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return '확정'
      case 'cancelled': return '취소'
      case 'completed': return '완료'
      case 'no_show': return '노쇼'
      default: return status
    }
  }

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid': return '결제완료'
      case 'pending': return '결제대기'
      case 'cancelled': return '결제취소'
      case 'refunded': return '환불완료'
      case 'partial_refund': return '부분환불'
      default: return status
    }
  }

  // 통계 계산
  const stats = {
    total: reservations.length,
    today: reservations.filter(r => r.checkin_date === new Date().toISOString().split('T')[0]).length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    revenue: reservations.filter(r => r.payment_status === 'paid').reduce((sum, r) => sum + r.total_amount, 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">예약 관리</h1>
        <div className="text-sm text-gray-600">
          총 {reservations.length}건의 예약
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">전체 예약</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">오늘 체크인</p>
                <p className="text-2xl font-bold">{stats.today}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">확정 예약</p>
                <p className="text-2xl font-bold">{stats.confirmed}</p>
              </div>
              <Badge className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 매출</p>
                <p className="text-2xl font-bold">₩{stats.revenue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardHeader>
          <CardTitle>검색 및 필터</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="예약자명, 전화번호, 예약번호로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-[140px]">
                <SelectValue placeholder="날짜" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="all">전체 기간</SelectItem>
                <SelectItem value="today">오늘</SelectItem>
                <SelectItem value="tomorrow">내일</SelectItem>
                <SelectItem value="this_week">이번 주</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[120px]">
                <SelectValue placeholder="예약상태" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="confirmed">확정</SelectItem>
                <SelectItem value="cancelled">취소</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="no_show">노쇼</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full md:w-[120px]">
                <SelectValue placeholder="결제상태" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="all">전체 결제</SelectItem>
                <SelectItem value="paid">결제완료</SelectItem>
                <SelectItem value="pending">결제대기</SelectItem>
                <SelectItem value="cancelled">결제취소</SelectItem>
                <SelectItem value="refunded">환불완료</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 예약 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>예약 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              조건에 맞는 예약이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>예약번호</TableHead>
                    <TableHead>예약자</TableHead>
                    <TableHead>숙소</TableHead>
                    <TableHead>체크인/아웃</TableHead>
                    <TableHead>인원</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>결제상태</TableHead>
                    <TableHead>예약상태</TableHead>
                    <TableHead>예약일</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-mono text-sm">
                        {reservation.reservation_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{reservation.guest_name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {reservation.guest_phone}
                          </div>
                          {reservation.guest_email && (
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {reservation.guest_email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{reservation.accommodations.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {reservation.accommodations.region}
                          </div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {reservation.accommodations.accommodation_type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(reservation.checkin_date).toLocaleDateString('ko-KR')}</div>
                          <div className="text-gray-500">~</div>
                          <div>{new Date(reservation.checkout_date).toLocaleDateString('ko-KR')}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          {reservation.guest_count}명
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          ₩{reservation.total_amount.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPaymentStatusColor(reservation.payment_status)}>
                          {getPaymentStatusText(reservation.payment_status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={reservation.status}
                          onValueChange={(value) => handleStatusChange(reservation.id, value)}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg">
                            <SelectItem value="confirmed">확정</SelectItem>
                            <SelectItem value="cancelled">취소</SelectItem>
                            <SelectItem value="completed">완료</SelectItem>
                            <SelectItem value="no_show">노쇼</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {new Date(reservation.created_at).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 justify-end">
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}