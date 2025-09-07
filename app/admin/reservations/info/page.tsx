'use client'

import { useState } from 'react'
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

interface Reservation {
  id: number
  reservationNumber: string
  stayId: number
  stayName: string
  customerName: string
  customerPhone: string
  customerEmail: string
  checkInDate: string
  checkOutDate: string
  usageTime: string
  baseGuests: number
  extraGuests: number
  totalGuests: number
  basePrice: number
  extraFee: number
  optionFee: number
  totalPrice: number
  paymentMethod: 'card' | 'transfer' | 'kakaopay'
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded'
  reservationStatus: 'confirmed' | 'in_use' | 'completed' | 'cancelled' | 'no_show'
  specialRequests: string
  createdAt: string
  updatedAt: string
}

export default function ReservationInfoPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('today')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)

  // Mock data
  const reservations: Reservation[] = [
    {
      id: 1,
      reservationNumber: 'SO25090200001',
      stayId: 1,
      stayName: '구공스테이 청주 본디',
      customerName: '김민수',
      customerPhone: '010-1234-5678',
      customerEmail: 'kim@example.com',
      checkInDate: '2025-09-02',
      checkOutDate: '2025-09-02',
      usageTime: '15:00-23:00',
      baseGuests: 4,
      extraGuests: 2,
      totalGuests: 6,
      basePrice: 150000,
      extraFee: 60000,
      optionFee: 30000,
      totalPrice: 240000,
      paymentMethod: 'card',
      paymentStatus: 'completed',
      reservationStatus: 'confirmed',
      specialRequests: '바베큐 그릴 이용 희망',
      createdAt: '2025-09-01 14:30',
      updatedAt: '2025-09-01 14:30'
    },
    {
      id: 2,
      reservationNumber: 'SO25090200002',
      stayId: 2,
      stayName: '구공스테이 소소한옥',
      customerName: '이지영',
      customerPhone: '010-9876-5432',
      customerEmail: 'lee@example.com',
      checkInDate: '2025-09-02',
      checkOutDate: '2025-09-02',
      usageTime: '15:00-23:00',
      baseGuests: 4,
      extraGuests: 0,
      totalGuests: 4,
      basePrice: 120000,
      extraFee: 0,
      optionFee: 20000,
      totalPrice: 140000,
      paymentMethod: 'kakaopay',
      paymentStatus: 'completed',
      reservationStatus: 'in_use',
      specialRequests: '한옥 체험과 전통차 준비 부탁드립니다',
      createdAt: '2025-09-01 16:45',
      updatedAt: '2025-09-02 15:00'
    },
    {
      id: 3,
      reservationNumber: 'SO25090200003',
      stayId: 3,
      stayName: '구공스테이 옥천 키즈',
      customerName: '박가족',
      customerPhone: '010-5555-1234',
      customerEmail: 'park@example.com',
      checkInDate: '2025-09-03',
      checkOutDate: '2025-09-03',
      usageTime: '12:00-23:00',
      baseGuests: 4,
      extraGuests: 2,
      totalGuests: 6,
      basePrice: 160000,
      extraFee: 60000,
      optionFee: 50000,
      totalPrice: 270000,
      paymentMethod: 'card',
      paymentStatus: 'completed',
      reservationStatus: 'confirmed',
      specialRequests: '아이 2명 동반, 얼리 체크인 신청',
      createdAt: '2025-09-01 10:20',
      updatedAt: '2025-09-01 10:20'
    },
    {
      id: 4,
      reservationNumber: 'SO25090200004',
      stayId: 1,
      stayName: '구공스테이 청주 본디',
      customerName: '최현우',
      customerPhone: '010-7777-9999',
      customerEmail: 'choi@example.com',
      checkInDate: '2025-09-01',
      checkOutDate: '2025-09-01',
      usageTime: '15:00-23:00',
      baseGuests: 4,
      extraGuests: 4,
      totalGuests: 8,
      basePrice: 150000,
      extraFee: 120000,
      optionFee: 30000,
      totalPrice: 300000,
      paymentMethod: 'transfer',
      paymentStatus: 'completed',
      reservationStatus: 'completed',
      specialRequests: '대가족 모임, 바베큐 준비 필요',
      createdAt: '2025-08-30 09:15',
      updatedAt: '2025-09-01 23:30'
    },
    {
      id: 5,
      reservationNumber: 'SO25090200005',
      stayId: 5,
      stayName: '구공스테이 남해 디풀&애견',
      customerName: '강동현',
      customerPhone: '010-2222-8888',
      customerEmail: 'kang@example.com',
      checkInDate: '2025-09-05',
      checkOutDate: '2025-09-05',
      usageTime: '15:00-23:00',
      baseGuests: 4,
      extraGuests: 0,
      totalGuests: 4,
      basePrice: 160000,
      extraFee: 0,
      optionFee: 25000,
      totalPrice: 185000,
      paymentMethod: 'card',
      paymentStatus: 'pending',
      reservationStatus: 'confirmed',
      specialRequests: '반려견 2마리 동반 (소형견)',
      createdAt: '2025-09-02 08:45',
      updatedAt: '2025-09-02 08:45'
    }
  ]

  const statusOptions = [
    { value: 'all', label: '전체' },
    { value: 'confirmed', label: '예약확정' },
    { value: 'in_use', label: '이용중' },
    { value: 'completed', label: '이용완료' },
    { value: 'cancelled', label: '예약취소' },
    { value: 'no_show', label: '노쇼' }
  ]

  const paymentOptions = [
    { value: 'all', label: '전체' },
    { value: 'card', label: '카드결제' },
    { value: 'kakaopay', label: '카카오페이' },
    { value: 'transfer', label: '계좌이체' }
  ]

  const dateOptions = [
    { value: 'today', label: '오늘' },
    { value: 'week', label: '이번주' },
    { value: 'month', label: '이번달' },
    { value: 'all', label: '전체' }
  ]

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = reservation.reservationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reservation.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reservation.stayName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || reservation.reservationStatus === statusFilter
    const matchesPayment = paymentFilter === 'all' || reservation.paymentMethod === paymentFilter
    
    return matchesSearch && matchesStatus && matchesPayment
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="w-3 h-3 mr-1" />, label: '예약확정' },
      in_use: { color: 'bg-green-100 text-green-800', icon: <Clock className="w-3 h-3 mr-1" />, label: '이용중' },
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
      completed: { color: 'bg-green-100 text-green-800', label: '결제완료' },
      failed: { color: 'bg-red-100 text-red-800', label: '결제실패' },
      refunded: { color: 'bg-gray-100 text-gray-800', label: '환불완료' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return <Badge>Unknown</Badge>
    
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      card: '카드결제',
      kakaopay: '카카오페이',
      transfer: '계좌이체'
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
                  {reservations.filter(r => r.reservationStatus === 'confirmed').length}
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
                  {reservations.filter(r => r.reservationStatus === 'in_use').length}
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
                  {reservations.filter(r => r.reservationStatus === 'completed').length}
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
                  ₩{reservations.filter(r => r.paymentStatus === 'completed').reduce((sum, r) => sum + r.totalPrice, 0).toLocaleString()}
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
                <SelectContent>
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
                <SelectContent>
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
                        <span className="font-medium">{reservation.reservationNumber}</span>
                        <span className="text-xs text-gray-500">{reservation.createdAt}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{reservation.stayName}</span>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>#{reservation.stayId}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{reservation.customerName}</span>
                        <span className="text-sm text-gray-600">{reservation.customerPhone}</span>
                        <span className="text-xs text-gray-500">{reservation.customerEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {reservation.checkInDate}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {reservation.usageTime}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span>기본 {reservation.baseGuests}명</span>
                          {reservation.extraGuests > 0 && (
                            <span className="text-blue-600">+{reservation.extraGuests}</span>
                          )}
                        </div>
                        <span className="font-medium mt-1">₩{reservation.totalPrice.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm">{getPaymentMethodLabel(reservation.paymentMethod)}</span>
                        {getPaymentStatusBadge(reservation.paymentStatus)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(reservation.reservationStatus)}
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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