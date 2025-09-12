'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Filter,
  Eye,
  Edit,
  Phone,
  MessageSquare,
  Calendar,
  Users,
  MapPin,
  Clock,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download
} from 'lucide-react'
import { apiFetch } from '@/lib/auth-helpers'

interface Reservation {
  id: string
  reservation_number: string
  checkin_date: string
  checkout_date: string
  guest_count: number
  guest_name: string
  guest_phone: string
  guest_email: string
  base_amount: number
  additional_amount: number
  discount_amount: number
  total_amount: number
  payment_method: string | null
  payment_status: 'pending' | 'paid' | 'cancelled' | 'refunded' | 'partial_refund'
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  special_requests: string | null
  created_at: string
  updated_at: string
  accommodation: {
    id: string
    name: string
    accommodation_type: string
    address: string
    host: {
      id: string
      business_name: string
      representative_name: string
    }
  }
}

export default function ReservationInfoPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('today')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  // 데이터 로딩
  useEffect(() => {
    fetchReservations()
  }, [pagination.page, statusFilter, paymentFilter, searchQuery])

  const fetchReservations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(paymentFilter !== 'all' && { payment_status: paymentFilter }),
        ...(searchQuery && { search: searchQuery })
      })

      const result = await apiFetch(`/api/admin/reservations?${params}`)

      if (result.success) {
        setReservations(result.data || [])
        setPagination(result.pagination || pagination)
      } else {
        console.error('예약 조회 실패:', result.error)
      }
    } catch (error) {
      console.error('예약 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const statusOptions = [
    { value: 'all', label: '전체' },
    { value: 'confirmed', label: '예약확정' },
    { value: 'completed', label: '이용완료' },
    { value: 'cancelled', label: '예약취소' },
    { value: 'no_show', label: '노쇼' }
  ]

  const paymentOptions = [
    { value: 'all', label: '전체' },
    { value: 'pending', label: '결제대기' },
    { value: 'paid', label: '결제완료' },
    { value: 'cancelled', label: '결제취소' },
    { value: 'refunded', label: '환불완료' }
  ]

  const dateOptions = [
    { value: 'today', label: '오늘' },
    { value: 'week', label: '이번주' },
    { value: 'month', label: '이번달' },
    { value: 'all', label: '전체' }
  ]

  const filteredReservations = reservations

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="w-3 h-3 mr-1" />, label: '예약확정' },
      completed: { color: 'bg-gray-100 text-gray-800', icon: <CheckCircle className="w-3 h-3 mr-1" />, label: '이용완료' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3 mr-1" />, label: '예약취소' },
      no_show: { color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="w-3 h-3 mr-1" />, label: '노쇼' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return <Badge>Unknown</Badge>
    
    return (
      <Badge className={config.color}>
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: '결제대기' },
      paid: { color: 'bg-green-100 text-green-800', label: '결제완료' },
      cancelled: { color: 'bg-red-100 text-red-800', label: '결제취소' },
      refunded: { color: 'bg-gray-100 text-gray-800', label: '환불완료' },
      partial_refund: { color: 'bg-orange-100 text-orange-800', label: '부분환불' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return <Badge>Unknown</Badge>
    
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getPaymentMethodLabel = (method: string | null) => {
    if (!method) return '미설정'
    const labels = {
      card: '카드결제',
      kakao_pay: '카카오페이',
      bank_transfer: '계좌이체',
      toss_pay: '토스페이'
    }
    
    return labels[method as keyof typeof labels] || method
  }

  const openDialog = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setSelectedReservation(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">예약 정보 관리</h1>
          <p className="text-gray-600">전체 예약 현황 및 상세 정보를 관리합니다.</p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          엑셀 다운로드
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">전체 예약</p>
                <p className="text-2xl font-bold">{reservations.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">예약확정</p>
                <p className="text-2xl font-bold text-blue-600">
                  {reservations.filter(r => r.status === 'confirmed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">이용중</p>
                <p className="text-2xl font-bold text-green-600">
                  {reservations.filter(r => r.status === 'confirmed').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">이용완료</p>
                <p className="text-2xl font-bold">
                  {reservations.filter(r => r.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 매출</p>
                <p className="text-2xl font-bold text-green-600">
                  ₩{reservations.filter(r => r.payment_status === 'paid').reduce((sum, r) => sum + r.total_amount, 0).toLocaleString()}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>예약 목록</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="예약번호, 고객명, 스테이명 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="예약상태" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="결제방법" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  {paymentOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>예약번호</TableHead>
                  <TableHead>스테이 정보</TableHead>
                  <TableHead>고객 정보</TableHead>
                  <TableHead>이용 일시</TableHead>
                  <TableHead>인원/요금</TableHead>
                  <TableHead>결제 정보</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((reservation) => (
                  <TableRow key={reservation.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{reservation.reservation_number}</span>
                        <span className="text-xs text-gray-500">{new Date(reservation.created_at).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{reservation.accommodation.name}</span>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{reservation.accommodation.accommodation_type}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{reservation.guest_name}</span>
                        <span className="text-sm text-gray-600">{reservation.guest_phone}</span>
                        <span className="text-xs text-gray-500">{reservation.guest_email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {reservation.checkin_date} - {reservation.checkout_date}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          체크인/아웃
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span>총 {reservation.guest_count}명</span>
                        </div>
                        <span className="font-medium mt-1">₩{reservation.total_amount.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm">{getPaymentMethodLabel(reservation.payment_method)}</span>
                        {getPaymentStatusBadge(reservation.payment_status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(reservation.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openDialog(reservation)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredReservations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchQuery || statusFilter !== 'all' || paymentFilter !== 'all'
                ? '검색 조건에 맞는 예약이 없습니다.'
                : '등록된 예약이 없습니다.'
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>예약 상세 정보</DialogTitle>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">예약 정보</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">예약번호</Label>
                      <p className="text-lg font-mono">{selectedReservation.reservationNumber}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">스테이</Label>
                      <p className="font-medium">{selectedReservation.stayName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">예약 상태</Label>
                      <div className="mt-1">
                        {getStatusBadge(selectedReservation.reservationStatus)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">예약 일시</Label>
                      <p>{selectedReservation.createdAt}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">고객 정보</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">이름</Label>
                      <p className="font-medium">{selectedReservation.customerName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">연락처</Label>
                      <p>{selectedReservation.customerPhone}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">이메일</Label>
                      <p>{selectedReservation.customerEmail}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 이용 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">이용 정보</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">이용 날짜</Label>
                      <p className="font-medium">{selectedReservation.checkInDate}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">이용 시간</Label>
                      <p className="font-medium">{selectedReservation.usageTime}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">총 인원</Label>
                      <p className="font-medium">
                        {selectedReservation.totalGuests}명
                        <span className="text-sm text-gray-500 ml-1">
                          (기본 {selectedReservation.baseGuests}명 + 추가 {selectedReservation.extraGuests}명)
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 결제 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">결제 정보</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>기본 요금</span>
                        <span>₩{selectedReservation.basePrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>추가 인원비</span>
                        <span>₩{selectedReservation.extraFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>옵션 요금</span>
                        <span>₩{selectedReservation.optionFee.toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-3 flex justify-between font-bold">
                        <span>총 결제금액</span>
                        <span>₩{selectedReservation.totalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">결제 방법</Label>
                        <p className="font-medium">{getPaymentMethodLabel(selectedReservation.paymentMethod)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">결제 상태</Label>
                        <div className="mt-1">
                          {getPaymentStatusBadge(selectedReservation.paymentStatus)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 특수 요청사항 */}
              {selectedReservation.specialRequests && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">특수 요청사항</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-800">{selectedReservation.specialRequests}</p>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline">
                  <Phone className="w-4 h-4 mr-2" />
                  고객 연락
                </Button>
                <Button variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  SMS 발송
                </Button>
                <Button variant="outline" onClick={closeDialog}>
                  닫기
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}