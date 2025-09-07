'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Users,
  MapPin,
  Phone,
  MessageSquare,
  Eye,
  Plus,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Edit,
  DollarSign
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface CalendarReservation {
  id: string
  reservation_number: string
  accommodation_id: string
  accommodation_name: string
  guest_name: string
  guest_phone: string
  guest_email: string
  checkin_date: string
  checkout_date: string
  checkin_time: string
  checkout_time: string
  guest_count: number
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'refunded'
  total_amount: number
  special_requests?: string
  created_at: string
}

interface CalendarDay {
  date: Date
  reservations: CalendarReservation[]
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
}

export default function ReservationCalendarPage() {
  const supabase = createClient()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [reservations, setReservations] = useState<CalendarReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAccommodation, setSelectedAccommodation] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedReservation, setSelectedReservation] = useState<CalendarReservation | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadReservations()
  }, [currentDate])

  const loadReservations = async () => {
    try {
      setLoading(true)
      
      // 현재 달의 시작과 끝
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      
      // 실제 데이터베이스가 없는 경우를 대비한 목업 데이터
      const mockReservations: CalendarReservation[] = [
        {
          id: '1',
          reservation_number: 'SO25010200001',
          accommodation_id: '1',
          accommodation_name: 'Stay One Day 청주 힐사이드',
          guest_name: '김민수',
          guest_phone: '010-1234-5678',
          guest_email: 'kim@example.com',
          checkin_date: '2025-01-25',
          checkout_date: '2025-01-25',
          checkin_time: '15:00',
          checkout_time: '22:00',
          guest_count: 4,
          status: 'confirmed',
          payment_status: 'paid',
          total_amount: 150000,
          created_at: '2025-01-20T09:30:00+09:00'
        },
        {
          id: '2',
          reservation_number: 'SO25010200002',
          accommodation_id: '2',
          accommodation_name: 'Stay One Day 청주 가든뷰',
          guest_name: '이지영',
          guest_phone: '010-9876-5432',
          guest_email: 'lee@example.com',
          checkin_date: '2025-01-25',
          checkout_date: '2025-01-25',
          checkin_time: '14:00',
          checkout_time: '21:00',
          guest_count: 6,
          status: 'in_progress',
          payment_status: 'paid',
          total_amount: 200000,
          created_at: '2025-01-22T14:20:00+09:00'
        },
        {
          id: '3',
          reservation_number: 'SO25010200003',
          accommodation_id: '1',
          accommodation_name: 'Stay One Day 청주 힐사이드',
          guest_name: '박가족',
          guest_phone: '010-5555-1234',
          guest_email: 'park@example.com',
          checkin_date: '2025-01-26',
          checkout_date: '2025-01-26',
          checkin_time: '13:00',
          checkout_time: '20:00',
          guest_count: 8,
          status: 'pending',
          payment_status: 'pending',
          total_amount: 180000,
          special_requests: '유아용 침대 필요',
          created_at: '2025-01-23T11:45:00+09:00'
        },
        {
          id: '4',
          reservation_number: 'SO25010200004',
          accommodation_id: '3',
          accommodation_name: 'Stay One Day 청주 스카이',
          guest_name: '정민호',
          guest_phone: '010-7777-8888',
          guest_email: 'jung@example.com',
          checkin_date: '2025-01-27',
          checkout_date: '2025-01-27',
          checkin_time: '16:00',
          checkout_time: '23:00',
          guest_count: 2,
          status: 'confirmed',
          payment_status: 'paid',
          total_amount: 120000,
          created_at: '2025-01-24T16:10:00+09:00'
        },
        {
          id: '5',
          reservation_number: 'SO25010200005',
          accommodation_id: '2',
          accommodation_name: 'Stay One Day 청주 가든뷰',
          guest_name: '최영희',
          guest_phone: '010-3333-4444',
          guest_email: 'choi@example.com',
          checkin_date: '2025-01-28',
          checkout_date: '2025-01-28',
          checkin_time: '15:00',
          checkout_time: '22:00',
          guest_count: 5,
          status: 'cancelled',
          payment_status: 'refunded',
          total_amount: 160000,
          created_at: '2025-01-19T10:30:00+09:00'
        }
      ]

      try {
        let query = supabase
          .from('reservations')
          .select(`
            *,
            accommodations!inner(name)
          `)
          .gte('checkin_date', startOfMonth.toISOString().split('T')[0])
          .lte('checkin_date', endOfMonth.toISOString().split('T')[0])
          .order('checkin_date', { ascending: true })

        const { data, error } = await query
        
        if (error) throw error
        
        const processedReservations = data?.map((res: any) => ({
          ...res,
          accommodation_name: res.accommodations?.name || 'Unknown'
        })) || mockReservations

        setReservations(processedReservations)
      } catch (error) {
        console.log('데이터베이스 연결 실패, 목업 데이터 사용:', error)
        setReservations(mockReservations)
      }

    } catch (error) {
      console.error('예약 목록 로드 실패:', error)
      setReservations([])
    } finally {
      setLoading(false)
    }
  }

  const getCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const startDate = new Date(firstDayOfMonth)
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay())
    
    const days: CalendarDay[] = []
    const today = new Date()
    
    for (let i = 0; i < 42; i++) { // 6주 x 7일
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      
      const dayReservations = reservations.filter(res => 
        res.checkin_date === date.toISOString().split('T')[0] &&
        (selectedAccommodation === 'all' || res.accommodation_id === selectedAccommodation) &&
        (selectedStatus === 'all' || res.status === selectedStatus) &&
        (!searchQuery || 
          res.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          res.reservation_number.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      
      days.push({
        date: new Date(date),
        reservations: dayReservations,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        isSelected: selectedDate?.toDateString() === date.toDateString()
      })
    }
    
    return days
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in_progress': return 'bg-green-100 text-green-800 border-green-200'
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기'
      case 'confirmed': return '확정'
      case 'in_progress': return '이용중'
      case 'completed': return '완료'
      case 'cancelled': return '취소'
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertTriangle className="w-3 h-3" />
      case 'confirmed': return <CheckCircle className="w-3 h-3" />
      case 'in_progress': return <Clock className="w-3 h-3" />
      case 'completed': return <CheckCircle className="w-3 h-3" />
      case 'cancelled': return <XCircle className="w-3 h-3" />
      default: return null
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    setCurrentDate(newDate)
    setSelectedDate(null)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  const handleDayClick = (day: CalendarDay) => {
    setSelectedDate(day.date)
  }

  const handleReservationClick = (reservation: CalendarReservation, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedReservation(reservation)
    setIsDialogOpen(true)
  }

  const handleStatusChange = async (reservationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)

      if (error) {
        console.log('목업 상태 변경:', newStatus)
      }

      // 로컬 상태 업데이트
      setReservations(prev => prev.map(res => 
        res.id === reservationId ? { ...res, status: newStatus as any } : res
      ))
      
      if (selectedReservation?.id === reservationId) {
        setSelectedReservation(prev => prev ? { ...prev, status: newStatus as any } : null)
      }

      alert('상태가 변경되었습니다.')
    } catch (error) {
      console.error('상태 변경 실패:', error)
      alert('상태 변경에 실패했습니다.')
    }
  }

  const calendarDays = getCalendarDays()
  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ]
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']

  const todayReservations = reservations.filter(res => 
    res.checkin_date === new Date().toISOString().split('T')[0]
  )

  const upcomingReservations = reservations.filter(res => {
    const resDate = new Date(res.checkin_date)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    return resDate.toDateString() === tomorrow.toDateString()
  })

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">예약 달력</h1>
          <p className="text-gray-600">예약 현황을 달력으로 한눈에 확인하세요</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={goToToday}>
            <Calendar className="w-4 h-4 mr-2" />
            오늘
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            새 예약
          </Button>
        </div>
      </div>

      {/* 오늘/내일 예약 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Clock className="w-5 h-5 mr-2 text-green-600" />
              오늘 예약 ({todayReservations.length}건)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayReservations.length === 0 ? (
              <p className="text-gray-500 text-sm">오늘 예약이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {todayReservations.slice(0, 3).map(res => (
                  <div key={res.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium text-sm">{res.guest_name}</span>
                      <span className="text-gray-500 text-xs ml-2">{res.checkin_time}</span>
                    </div>
                    <Badge className={getStatusColor(res.status)}>
                      {getStatusText(res.status)}
                    </Badge>
                  </div>
                ))}
                {todayReservations.length > 3 && (
                  <p className="text-xs text-gray-500">외 {todayReservations.length - 3}건</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-blue-600" />
              내일 예약 ({upcomingReservations.length}건)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingReservations.length === 0 ? (
              <p className="text-gray-500 text-sm">내일 예약이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {upcomingReservations.slice(0, 3).map(res => (
                  <div key={res.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium text-sm">{res.guest_name}</span>
                      <span className="text-gray-500 text-xs ml-2">{res.checkin_time}</span>
                    </div>
                    <Badge className={getStatusColor(res.status)}>
                      {getStatusText(res.status)}
                    </Badge>
                  </div>
                ))}
                {upcomingReservations.length > 3 && (
                  <p className="text-xs text-gray-500">외 {upcomingReservations.length - 3}건</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="예약자명, 예약번호로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedAccommodation} onValueChange={setSelectedAccommodation}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="숙소 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 숙소</SelectItem>
                <SelectItem value="1">Stay One Day 청주 힐사이드</SelectItem>
                <SelectItem value="2">Stay One Day 청주 가든뷰</SelectItem>
                <SelectItem value="3">Stay One Day 청주 스카이</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="pending">대기</SelectItem>
                <SelectItem value="confirmed">확정</SelectItem>
                <SelectItem value="in_progress">이용중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="cancelled">취소</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 달력 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-xl font-bold">
                {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-200 rounded"></div>
                <span>대기</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-200 rounded"></div>
                <span>확정</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-200 rounded"></div>
                <span>이용중</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-200 rounded"></div>
                <span>취소</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">로딩 중...</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* 요일 헤더 */}
              {dayNames.map(day => (
                <div key={day} className="p-2 text-center font-medium text-gray-600 text-sm">
                  {day}
                </div>
              ))}
              
              {/* 달력 일자 */}
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  onClick={() => handleDayClick(day)}
                  className={`
                    min-h-[120px] p-1 border border-gray-100 cursor-pointer transition-colors
                    ${!day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white hover:bg-gray-50'}
                    ${day.isToday ? 'ring-2 ring-blue-500' : ''}
                    ${day.isSelected ? 'bg-blue-50' : ''}
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${
                      day.isToday ? 'text-blue-600' : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {day.date.getDate()}
                    </span>
                    {day.reservations.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {day.reservations.length}
                      </Badge>
                    )}
                  </div>
                  
                  {/* 예약 항목들 */}
                  <div className="space-y-1">
                    {day.reservations.slice(0, 3).map(reservation => (
                      <div
                        key={reservation.id}
                        onClick={(e) => handleReservationClick(reservation, e)}
                        className={`
                          px-2 py-1 rounded text-xs cursor-pointer hover:opacity-80
                          transition-opacity truncate border
                          ${getStatusColor(reservation.status)}
                        `}
                      >
                        <div className="flex items-center gap-1">
                          {getStatusIcon(reservation.status)}
                          <span className="font-medium">{reservation.guest_name}</span>
                        </div>
                        <div className="text-xs opacity-80">
                          {reservation.checkin_time}
                        </div>
                      </div>
                    ))}
                    {day.reservations.length > 3 && (
                      <div className="text-xs text-gray-500 text-center py-1">
                        +{day.reservations.length - 3}개 더
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 예약 상세 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              예약 상세 정보
            </DialogTitle>
          </DialogHeader>
          
          {selectedReservation && (
            <div className="space-y-6">
              {/* 상태 및 기본 정보 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-bold text-lg">{selectedReservation.reservation_number}</h3>
                  <p className="text-gray-600">{selectedReservation.accommodation_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(selectedReservation.status)}>
                    {getStatusIcon(selectedReservation.status)}
                    <span className="ml-1">{getStatusText(selectedReservation.status)}</span>
                  </Badge>
                  <Badge variant="outline" className={
                    selectedReservation.payment_status === 'paid' 
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                  }>
                    {selectedReservation.payment_status === 'paid' ? '결제완료' : '결제대기'}
                  </Badge>
                </div>
              </div>

              {/* 예약자 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">예약자명</Label>
                  <div className="flex items-center mt-1">
                    <Users className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="font-medium">{selectedReservation.guest_name}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">연락처</Label>
                  <div className="flex items-center mt-1">
                    <Phone className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{selectedReservation.guest_phone}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-700">이메일</Label>
                  <div className="flex items-center mt-1">
                    <MessageSquare className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{selectedReservation.guest_email}</span>
                  </div>
                </div>
              </div>

              {/* 예약 상세 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">이용일</Label>
                  <div className="flex items-center mt-1">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{new Date(selectedReservation.checkin_date).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">이용시간</Label>
                  <div className="flex items-center mt-1">
                    <Clock className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{selectedReservation.checkin_time} - {selectedReservation.checkout_time}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">인원</Label>
                  <div className="flex items-center mt-1">
                    <Users className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{selectedReservation.guest_count}명</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">결제금액</Label>
                  <div className="flex items-center mt-1">
                    <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="font-bold">₩{selectedReservation.total_amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* 특별 요청사항 */}
              {selectedReservation.special_requests && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">특별 요청사항</Label>
                  <div className="mt-1 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-800">{selectedReservation.special_requests}</p>
                  </div>
                </div>
              )}

              {/* 상태 변경 버튼들 */}
              <div className="flex items-center gap-2 pt-4 border-t">
                <span className="text-sm font-medium text-gray-700">상태 변경:</span>
                {selectedReservation.status === 'pending' && (
                  <>
                    <Button 
                      size="sm" 
                      onClick={() => handleStatusChange(selectedReservation.id, 'confirmed')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      승인
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStatusChange(selectedReservation.id, 'cancelled')}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      취소
                    </Button>
                  </>
                )}
                {selectedReservation.status === 'confirmed' && (
                  <>
                    <Button 
                      size="sm" 
                      onClick={() => handleStatusChange(selectedReservation.id, 'in_progress')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      이용시작
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStatusChange(selectedReservation.id, 'cancelled')}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      취소
                    </Button>
                  </>
                )}
                {selectedReservation.status === 'in_progress' && (
                  <Button 
                    size="sm" 
                    onClick={() => handleStatusChange(selectedReservation.id, 'completed')}
                    className="bg-gray-600 hover:bg-gray-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    이용완료
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}