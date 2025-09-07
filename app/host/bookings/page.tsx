'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Users, MapPin, Phone, Mail, CheckCircle, XCircle, Clock } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import Header from '@/components/header'

interface BookingData {
  id: string
  check_in: string
  check_out: string
  guests: number
  total_price: number
  status: string
  created_at: string
  space: {
    title: string
    location: string
  }
  user: {
    email: string
    phone?: string
  }
}

export default function HostBookingsPage() {
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          check_in,
          check_out,
          guests,
          total_price,
          status,
          created_at,
          space:spaces(title, location),
          user:users(email, phone)
        `)
        .eq('space.host_id', user.id)
        .order('created_at', { ascending: false })

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

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId)

      if (error) {
        console.error('예약 상태 업데이트 오류:', error)
        alert('상태 업데이트에 실패했습니다.')
        return
      }

      // 상태 업데이트 후 목록 새로고침
      fetchBookings()
      alert(`예약이 ${getStatusLabel(newStatus)}되었습니다.`)
    } catch (error) {
      console.error('상태 업데이트 중 오류:', error)
      alert('오류가 발생했습니다.')
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return '확정'
      case 'pending': return '대기'
      case 'cancelled': return '취소'
      default: return status
    }
  }

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

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true
    return booking.status === filter
  })

  const getStayDuration = (checkIn: string, checkOut: string) => {
    const nights = differenceInDays(new Date(checkOut), new Date(checkIn))
    return `${nights}박 ${nights + 1}일`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">예약 현황</h1>
          <p className="text-gray-600">숙소 예약 현황을 확인하고 관리하세요</p>
        </div>

        {/* 필터 */}
        <div className="mb-6">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              전체
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              대기중
            </Button>
            <Button
              variant={filter === 'confirmed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('confirmed')}
            >
              확정
            </Button>
            <Button
              variant={filter === 'cancelled' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('cancelled')}
            >
              취소
            </Button>
          </div>
        </div>

        {/* 예약 목록 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">예약을 불러오는 중...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {filter === 'all' ? '예약이 없습니다.' : `${getStatusLabel(filter)} 예약이 없습니다.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* 숙소 정보 */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">
                            {booking.space?.title || '숙소명 없음'}
                          </h3>
                          <p className="text-gray-600 flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {booking.space?.location || '위치 정보 없음'}
                          </p>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>

                      {/* 예약 정보 */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          <div>
                            <div className="font-medium">
                              {format(new Date(booking.check_in), 'yyyy.MM.dd(EEE)', { locale: ko })} - {format(new Date(booking.check_out), 'MM.dd(EEE)', { locale: ko })}
                            </div>
                            <div className="text-sm text-gray-500">
                              {getStayDuration(booking.check_in, booking.check_out)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center text-gray-600">
                          <Users className="w-4 h-4 mr-2" />
                          <span>{booking.guests}명</span>
                        </div>
                      </div>

                      {/* 게스트 정보 */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">게스트 정보</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Mail className="w-4 h-4 mr-2" />
                            <span>{booking.user?.email || '이메일 정보 없음'}</span>
                          </div>
                          {booking.user?.phone && (
                            <div className="flex items-center text-gray-600">
                              <Phone className="w-4 h-4 mr-2" />
                              <span>{booking.user.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 금액 및 액션 */}
                    <div className="lg:w-64 space-y-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {booking.total_price.toLocaleString()}원
                        </div>
                        <div className="text-sm text-gray-500">
                          예약일: {format(new Date(booking.created_at), 'yyyy.MM.dd', { locale: ko })}
                        </div>
                      </div>

                      {/* 상태별 액션 버튼 */}
                      {booking.status === 'pending' && (
                        <div className="space-y-2">
                          <Button
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            예약 확정
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            예약 취소
                          </Button>
                        </div>
                      )}

                      {booking.status === 'confirmed' && (
                        <div className="text-center py-4">
                          <div className="flex items-center justify-center text-green-600">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            <span className="font-medium">확정된 예약</span>
                          </div>
                        </div>
                      )}

                      {booking.status === 'cancelled' && (
                        <div className="text-center py-4">
                          <div className="flex items-center justify-center text-red-600">
                            <XCircle className="w-5 h-5 mr-2" />
                            <span className="font-medium">취소된 예약</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}