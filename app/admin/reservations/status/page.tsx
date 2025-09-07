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
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  RotateCcw,
  MessageSquare,
  Phone,
  RefreshCw
} from 'lucide-react'

interface ReservationStatus {
  id: number
  reservationNumber: string
  stayName: string
  customerName: string
  customerPhone: string
  checkInDate: string
  usageTime: string
  currentStatus: 'confirmed' | 'in_use' | 'completed' | 'cancelled' | 'no_show'
  statusHistory: {
    status: string
    timestamp: string
    reason?: string
    updatedBy: string
  }[]
  totalPrice: number
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded'
  checkInTime?: string
  checkOutTime?: string
  notes: string
  lastUpdated: string
}

export default function ReservationStatusPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<ReservationStatus | null>(null)
  const [statusChangeReason, setStatusChangeReason] = useState('')

  // Mock data
  const reservations: ReservationStatus[] = [
    {
      id: 1,
      reservationNumber: 'SO25090200001',
      stayName: '구공스테이 청주 본디',
      customerName: '김민수',
      customerPhone: '010-1234-5678',
      checkInDate: '2025-09-02',
      usageTime: '15:00-23:00',
      currentStatus: 'confirmed',
      statusHistory: [
        {
          status: 'confirmed',
          timestamp: '2025-09-01 14:30',
          reason: '예약 완료 및 결제 확인',
          updatedBy: '시스템'
        }
      ],
      totalPrice: 240000,
      paymentStatus: 'completed',
      notes: '바베큐 그릴 이용 희망',
      lastUpdated: '2025-09-01 14:30'
    },
    {
      id: 2,
      reservationNumber: 'SO25090200002',
      stayName: '구공스테이 소소한옥',
      customerName: '이지영',
      customerPhone: '010-9876-5432',
      checkInDate: '2025-09-02',
      usageTime: '15:00-23:00',
      currentStatus: 'in_use',
      statusHistory: [
        {
          status: 'confirmed',
          timestamp: '2025-09-01 16:45',
          reason: '예약 완료 및 결제 확인',
          updatedBy: '시스템'
        },
        {
          status: 'in_use',
          timestamp: '2025-09-02 15:00',
          reason: '정시 체크인 완료',
          updatedBy: '관리자'
        }
      ],
      totalPrice: 140000,
      paymentStatus: 'completed',
      checkInTime: '15:00',
      notes: '한옥 체험과 전통차 준비 요청',
      lastUpdated: '2025-09-02 15:00'
    },
    {
      id: 3,
      reservationNumber: 'SO25090200003',
      stayName: '구공스테이 옥천 키즈',
      customerName: '박가족',
      customerPhone: '010-5555-1234',
      checkInDate: '2025-09-03',
      usageTime: '12:00-23:00',
      currentStatus: 'confirmed',
      statusHistory: [
        {
          status: 'confirmed',
          timestamp: '2025-09-01 10:20',
          reason: '얼리 체크인 옵션 추가 예약',
          updatedBy: '시스템'
        }
      ],
      totalPrice: 270000,
      paymentStatus: 'completed',
      notes: '아이 2명 동반, 얼리 체크인 12시',
      lastUpdated: '2025-09-01 10:20'
    },
    {
      id: 4,
      reservationNumber: 'SO25090200004',
      stayName: '구공스테이 청주 본디',
      customerName: '최현우',
      customerPhone: '010-7777-9999',
      checkInDate: '2025-09-01',
      usageTime: '15:00-23:00',
      currentStatus: 'completed',
      statusHistory: [
        {
          status: 'confirmed',
          timestamp: '2025-08-30 09:15',
          reason: '예약 완료',
          updatedBy: '시스템'
        },
        {
          status: 'in_use',
          timestamp: '2025-09-01 15:00',
          reason: '체크인 완료',
          updatedBy: '관리자'
        },
        {
          status: 'completed',
          timestamp: '2025-09-01 23:30',
          reason: '정상 체크아웃 완료',
          updatedBy: '관리자'
        }
      ],
      totalPrice: 300000,
      paymentStatus: 'completed',
      checkInTime: '15:00',
      checkOutTime: '23:30',
      notes: '대가족 모임, 바베큐 파티',
      lastUpdated: '2025-09-01 23:30'
    },
    {
      id: 5,
      reservationNumber: 'SO25090200005',
      stayName: '구공스테이 남해 디풀&애견',
      customerName: '강동현',
      customerPhone: '010-2222-8888',
      checkInDate: '2025-09-05',
      usageTime: '15:00-23:00',
      currentStatus: 'cancelled',
      statusHistory: [
        {
          status: 'confirmed',
          timestamp: '2025-09-02 08:45',
          reason: '예약 완료',
          updatedBy: '시스템'
        },
        {
          status: 'cancelled',
          timestamp: '2025-09-02 16:20',
          reason: '고객 사정으로 인한 예약 취소',
          updatedBy: '관리자'
        }
      ],
      totalPrice: 185000,
      paymentStatus: 'refunded',
      notes: '반려견 2마리 동반 예정이었으나 취소',
      lastUpdated: '2025-09-02 16:20'
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

  const statusChangeOptions = [
    { value: 'confirmed', label: '예약확정', description: '예약을 확정 상태로 변경' },
    { value: 'in_use', label: '이용중', description: '고객 체크인 완료' },
    { value: 'completed', label: '이용완료', description: '고객 체크아웃 완료' },
    { value: 'cancelled', label: '예약취소', description: '예약을 취소 처리' },
    { value: 'no_show', label: '노쇼', description: '고객 미출현으로 처리' }
  ]

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = reservation.reservationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reservation.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reservation.stayName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || reservation.currentStatus === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="w-3 h-3 mr-1" />, label: '예약확정' },
      in_use: { color: 'bg-green-100 text-green-800', icon: <Clock className="w-3 h-3 mr-1" />, label: '이용중' },
      completed: { color: 'bg-gray-100 text-gray-800', icon: <CheckCircle className="w-3 h-3 mr-1" />, label: '이용완료' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3 mr-1" />, label: '예약취소' },
      no_show: { color: 'bg-yellow-100 text-yellow-800', icon: <AlertTriangle className="w-3 h-3 mr-1" />, label: '노쇼' }
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

  const openDialog = (reservation: ReservationStatus) => {
    setSelectedReservation(reservation)
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setSelectedReservation(null)
    setStatusChangeReason('')
  }

  const handleStatusChange = (newStatus: string) => {
    if (selectedReservation && statusChangeReason) {
      // 실제로는 API 호출
      console.log('Status change:', {
        reservationId: selectedReservation.id,
        newStatus,
        reason: statusChangeReason
      })
      closeDialog()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">예약 상태 관리</h1>
          <p className="text-gray-600">예약 상태를 실시간으로 확인하고 관리합니다.</p>
        </div>
        <Button>
          <RefreshCw className="w-4 h-4 mr-2" />
          새로고침
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">예약확정</p>
                <p className="text-2xl font-bold text-blue-600">
                  {reservations.filter(r => r.currentStatus === 'confirmed').length}
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
                  {reservations.filter(r => r.currentStatus === 'in_use').length}
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
                  {reservations.filter(r => r.currentStatus === 'completed').length}
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
                <p className="text-sm text-gray-600">예약취소</p>
                <p className="text-2xl font-bold text-red-600">
                  {reservations.filter(r => r.currentStatus === 'cancelled').length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">노쇼</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {reservations.filter(r => r.currentStatus === 'no_show').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>예약 상태 목록</CardTitle>
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
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
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
                  <TableHead>스테이/고객 정보</TableHead>
                  <TableHead>이용 일시</TableHead>
                  <TableHead>현재 상태</TableHead>
                  <TableHead>체크인/아웃</TableHead>
                  <TableHead>마지막 업데이트</TableHead>
                  <TableHead>관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((reservation) => (
                  <TableRow key={reservation.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium font-mono">{reservation.reservationNumber}</span>
                        <span className="text-sm text-green-600">
                          ₩{reservation.totalPrice.toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{reservation.stayName}</span>
                        <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                          <User className="w-3 h-3" />
                          {reservation.customerName}
                        </div>
                        <span className="text-xs text-gray-500">{reservation.customerPhone}</span>
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
                      {getStatusBadge(reservation.currentStatus)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        {reservation.checkInTime && (
                          <div className="text-green-600">
                            체크인: {reservation.checkInTime}
                          </div>
                        )}
                        {reservation.checkOutTime && (
                          <div className="text-red-600">
                            체크아웃: {reservation.checkOutTime}
                          </div>
                        )}
                        {!reservation.checkInTime && reservation.currentStatus === 'confirmed' && (
                          <div className="text-gray-500">대기중</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {reservation.lastUpdated}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openDialog(reservation)}>
                          <Edit className="w-4 h-4" />
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
              {searchQuery || statusFilter !== 'all'
                ? '검색 조건에 맞는 예약이 없습니다.'
                : '등록된 예약이 없습니다.'
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Change Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>예약 상태 변경</DialogTitle>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-6">
              {/* 예약 기본 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">예약 정보</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">예약번호</Label>
                    <p className="font-mono">{selectedReservation.reservationNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">현재 상태</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedReservation.currentStatus)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">스테이</Label>
                    <p>{selectedReservation.stayName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">고객</Label>
                    <p>{selectedReservation.customerName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">이용 날짜</Label>
                    <p>{selectedReservation.checkInDate}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">이용 시간</Label>
                    <p>{selectedReservation.usageTime}</p>
                  </div>
                </CardContent>
              </Card>

              {/* 상태 변경 이력 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">상태 변경 이력</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedReservation.statusHistory.map((history, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <RotateCcw className="w-4 h-4 text-gray-500" />
                          {getStatusBadge(history.status)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{history.reason}</p>
                          <div className="text-xs text-gray-500 mt-1">
                            {history.timestamp} · {history.updatedBy}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 상태 변경 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">상태 변경</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="newStatus">새 상태 선택</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="변경할 상태를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusChangeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-col">
                              <span>{option.label}</span>
                              <span className="text-xs text-gray-500">{option.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="reason">변경 사유</Label>
                    <Textarea
                      id="reason"
                      placeholder="상태 변경 사유를 입력하세요..."
                      value={statusChangeReason}
                      onChange={(e) => setStatusChangeReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeDialog}>
                  취소
                </Button>
                <Button 
                  disabled={!statusChangeReason}
                  onClick={() => handleStatusChange('confirmed')}
                >
                  상태 변경
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}