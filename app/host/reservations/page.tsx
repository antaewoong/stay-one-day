'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Calendar, Users, MapPin, Phone, Mail, CheckCircle, XCircle, Clock, CreditCard, AlertCircle } from 'lucide-react'

interface Reservation {
  id: string
  guest_name: string
  guest_phone: string
  guest_email: string
  accommodation_name: string
  check_in: string
  check_out: string
  guests: number
  total_amount: number
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
  payment_status: 'paid' | 'pending' | 'failed' | 'refunded'
  created_at: string
  special_requests?: string
}

export default function HostReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [hostData, setHostData] = useState<any>(null)

  useEffect(() => {
    const userData = sessionStorage.getItem('hostUser')
    if (userData) {
      const parsedData = JSON.parse(userData)
      setHostData(parsedData)
      loadReservations(parsedData.host_id)
    }
  }, [])

  const loadReservations = async (hostId: string) => {
    try {
      setLoading(true)
      
      // 호스트별 더미 예약 데이터
      const hostReservationsData = getHostReservations(hostId)
      
      let filteredReservations = hostReservationsData

      // 상태 필터 적용
      if (statusFilter !== 'all') {
        filteredReservations = filteredReservations.filter(r => r.status === statusFilter)
      }

      // 검색 필터 적용
      if (searchQuery) {
        filteredReservations = filteredReservations.filter(r => 
          r.guest_name.includes(searchQuery) || 
          r.accommodation_name.includes(searchQuery) ||
          r.guest_phone.includes(searchQuery)
        )
      }

      setReservations(filteredReservations)
    } catch (error) {
      console.error('예약 목록 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const getHostReservations = (hostId: string): Reservation[] => {
    const reservationDataMap: Record<string, Reservation[]> = {
      'host-1': [
        {
          id: '1',
          guest_name: '김민수',
          guest_phone: '010-1234-5678',
          guest_email: 'kim@example.com',
          accommodation_name: '구공스테이 풀빌라',
          check_in: '2024-02-15',
          check_out: '2024-02-17',
          guests: 4,
          total_amount: 360000,
          status: 'confirmed',
          payment_status: 'paid',
          created_at: '2024-02-10T10:00:00Z',
          special_requests: '늦은 체크인 요청'
        },
        {
          id: '2',
          guest_name: '박지영',
          guest_phone: '010-2345-6789',
          guest_email: 'park@example.com',
          accommodation_name: '구공스테이 독채',
          check_in: '2024-02-20',
          check_out: '2024-02-22',
          guests: 2,
          total_amount: 280000,
          status: 'pending',
          payment_status: 'pending',
          created_at: '2024-02-18T14:30:00Z'
        },
        {
          id: '3',
          guest_name: '최서연',
          guest_phone: '010-3456-7890',
          guest_email: 'choi@example.com',
          accommodation_name: '구공스테이 풀빌라',
          check_in: '2024-01-25',
          check_out: '2024-01-27',
          guests: 6,
          total_amount: 420000,
          status: 'completed',
          payment_status: 'paid',
          created_at: '2024-01-20T09:15:00Z',
          special_requests: '바베큐 준비 요청'
        }
      ],
      'host-2': [
        {
          id: '4',
          guest_name: '이준호',
          guest_phone: '010-4567-8901',
          guest_email: 'lee@example.com',
          accommodation_name: '스테이도고 펜션',
          check_in: '2024-02-18',
          check_out: '2024-02-19',
          guests: 2,
          total_amount: 150000,
          status: 'completed',
          payment_status: 'paid',
          created_at: '2024-02-15T16:20:00Z'
        },
        {
          id: '5',
          guest_name: '정미영',
          guest_phone: '010-5678-9012',
          guest_email: 'jung@example.com',
          accommodation_name: '스테이도고 펜션',
          check_in: '2024-02-25',
          check_out: '2024-02-26',
          guests: 3,
          total_amount: 180000,
          status: 'confirmed',
          payment_status: 'paid',
          created_at: '2024-02-22T11:45:00Z'
        }
      ],
      'host-3': [
        {
          id: '6',
          guest_name: '강동욱',
          guest_phone: '010-6789-0123',
          guest_email: 'kang@example.com',
          accommodation_name: '마담아네뜨 글램핑',
          check_in: '2024-02-28',
          check_out: '2024-03-01',
          guests: 2,
          total_amount: 200000,
          status: 'pending',
          payment_status: 'pending',
          created_at: '2024-02-25T13:30:00Z',
          special_requests: '애견 동반'
        }
      ]
    }

    return reservationDataMap[hostId] || []
  }

  useEffect(() => {
    if (hostData) {
      const timeoutId = setTimeout(() => {
        loadReservations(hostData.host_id)
      }, 300)

      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery, statusFilter, hostData])

  const handleStatusUpdate = async (reservationId: string, newStatus: string) => {
    try {
      // 실제 환경에서는 Supabase 업데이트
      setReservations(prev => 
        prev.map(r => r.id === reservationId ? { ...r, status: newStatus as any } : r)
      )
      alert('예약 상태가 변경되었습니다.')
    } catch (error) {
      console.error('상태 변경 실패:', error)
      alert('상태 변경에 실패했습니다.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return '확정'
      case 'pending': return '대기'
      case 'cancelled': return '취소'
      case 'completed': return '완료'
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      default: return null
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid': return '결제완료'
      case 'pending': return '결제대기'
      case 'failed': return '결제실패'
      case 'refunded': return '환불완료'
      default: return status
    }
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CreditCard className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'failed': return <AlertCircle className="w-4 h-4" />
      case 'refunded': return <XCircle className="w-4 h-4" />
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">예약 관리</h1>
        <div className="text-sm text-gray-600">
          총 {reservations.length}개의 예약
        </div>
      </div>

      {/* 검색 및 필터 */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-white">
          <CardTitle className="text-gray-900">검색 및 필터</CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="게스트명, 숙소명, 전화번호로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-300 bg-white"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px] border-gray-300 bg-white">
                <SelectValue placeholder="예약 상태" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="confirmed">확정</SelectItem>
                <SelectItem value="pending">대기</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="cancelled">취소</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 예약 목록 */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-white">
          <CardTitle className="text-gray-900">예약 목록</CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">예약이 없습니다</h3>
              <p className="text-gray-500">검색 조건을 변경해보세요</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>게스트 정보</TableHead>
                    <TableHead>숙소</TableHead>
                    <TableHead>체크인/체크아웃</TableHead>
                    <TableHead>인원</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>예약상태</TableHead>
                    <TableHead>결제상태</TableHead>
                    <TableHead>예약일</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((reservation) => (
                    <TableRow key={reservation.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{reservation.guest_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Phone className="w-3 h-3" />
                            <span>{reservation.guest_phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Mail className="w-3 h-3" />
                            <span>{reservation.guest_email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">{reservation.accommodation_name}</span>
                        </div>
                        {reservation.special_requests && (
                          <div className="text-xs text-gray-500 mt-1">
                            요청: {reservation.special_requests}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-gray-900">{reservation.check_in}</div>
                          <div className="text-gray-500">~ {reservation.check_out}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700">{reservation.guests}명</TableCell>
                      <TableCell className="font-medium text-gray-900">
                        ₩{reservation.total_amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={`flex items-center gap-1 ${getStatusColor(reservation.status)}`}>
                          {getStatusIcon(reservation.status)}
                          {getStatusText(reservation.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`flex items-center gap-1 ${getPaymentStatusColor(reservation.payment_status)}`}>
                          {getPaymentStatusIcon(reservation.payment_status)}
                          {getPaymentStatusText(reservation.payment_status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {new Date(reservation.created_at).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          {reservation.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleStatusUpdate(reservation.id, 'confirmed')}
                                className="text-green-600 border-green-600 hover:bg-green-50"
                              >
                                승인
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleStatusUpdate(reservation.id, 'cancelled')}
                                className="text-red-600 border-red-600 hover:bg-red-50"
                              >
                                취소
                              </Button>
                            </>
                          )}
                          {reservation.status === 'confirmed' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleStatusUpdate(reservation.id, 'completed')}
                              className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            >
                              완료
                            </Button>
                          )}
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