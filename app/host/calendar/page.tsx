'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  X,
  Lock,
  Users,
  Edit3,
  Eye,
  Plus,
  Minus,
  Copy,
  RotateCcw
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface CalendarDay {
  date: string
  day: number
  month: number
  year: number
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
  status: 'available' | 'reserved' | 'blocked' | 'maintenance' | 'payment_pending' | 'hold_expired'
  price: number
  basePrice: number
  reservationId?: string
  guestName?: string
  guestCount?: number
  checkInOut?: 'checkin' | 'checkout' | 'both'
  notes?: string
  isCustomPrice: boolean
  paymentMethod?: 'card' | 'bank_transfer' | 'virtual_account'
  holdExpiresAt?: string
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'expired'
}

interface Reservation {
  id: string
  guestName: string
  guestPhone: string
  checkIn: string
  checkOut: string
  guestCount: number
  totalAmount: number
  status: string
}

export default function HostCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([])
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)
  const [hostData, setHostData] = useState<any>(null)
  const [selectedUnit, setSelectedUnit] = useState('all')

  // 가격 설정 모달 상태
  const [priceSettings, setPriceSettings] = useState({
    price: 0,
    applyToWeekends: false,
    applyToMultiple: false,
    notes: ''
  })

  // 예약 차단 설정 상태
  const [blockSettings, setBlockSettings] = useState({
    reason: '',
    isMaintenanceMode: false
  })

  const [accommodations, setAccommodations] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = sessionStorage.getItem('hostUser')
    if (userData) {
      const parsedData = JSON.parse(userData)
      setHostData(parsedData)
    }
  }, [])

  useEffect(() => {
    if (hostData) {
      loadHostAccommodations()
    }
  }, [hostData])

  useEffect(() => {
    if (hostData && accommodations.length > 0) {
      generateCalendarData()
    }
  }, [currentDate, selectedUnit, hostData, accommodations])

  const loadHostAccommodations = async () => {
    try {
      setLoading(true)
      
      if (!hostData?.host_id) {
        console.error('호스트 정보가 없습니다')
        return
      }

      // 호스트 UUID 가져오기
      const { data: hostIdData, error: hostError } = await createClient()
        .from('hosts')
        .select('id')
        .eq('host_id', hostData.host_id)
        .single()

      if (hostError || !hostIdData) {
        console.error('호스트 정보를 찾을 수 없습니다:', hostError)
        setAccommodations([])
        setRooms([])
        return
      }

      // 호스트의 숙소들 가져오기
      const { data: accData, error: accError } = await createClient()
        .from('accommodations')
        .select('id, name, accommodation_type')
        .eq('host_id', hostIdData.id)
        .eq('status', 'active')

      if (accError) {
        console.error('숙소 데이터 로드 실패:', accError)
        setAccommodations([])
      } else {
        setAccommodations(accData || [])
        
        // 첫 번째 숙소가 있으면 기본 선택
        if (accData && accData.length > 0 && selectedUnit === 'all') {
          setSelectedUnit(accData[0].id)
        }
      }

      // 선택된 숙소의 객실들 가져오기 (필요한 경우)
      if (selectedUnit && selectedUnit !== 'all') {
        const { data: roomData, error: roomError } = await createClient()
          .from('rooms')
          .select('id, name')
          .eq('accommodation_id', selectedUnit)

        if (!roomError) {
          setRooms(roomData || [])
        }
      }

    } catch (error) {
      console.error('호스트 숙소 로드 실패:', error)
      setAccommodations([])
      setRooms([])
    } finally {
      setLoading(false)
    }
  }

  const generateCalendarData = async () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    // 마지막 날짜 계산 (42일간)
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 41)
    
    // 한번에 해당 기간의 예약 데이터 조회
    let reservationsMap = new Map()
    
    if (selectedUnit && selectedUnit !== 'all') {
      try {
        const { data: reservationsData } = await createClient()
          .from('reservations')
          .select('*')
          .eq('accommodation_id', selectedUnit)
          .gte('checkin_date', startDate.toISOString().split('T')[0])
          .lte('checkout_date', endDate.toISOString().split('T')[0])
          .in('status', ['confirmed', 'pending'])

        if (reservationsData) {
          // 예약 데이터를 날짜별로 매핑
          reservationsData.forEach(reservation => {
            const checkinDate = new Date(reservation.checkin_date)
            const checkoutDate = new Date(reservation.checkout_date)
            
            // 체크인부터 체크아웃까지 모든 날짜에 예약 표시
            for (let d = new Date(checkinDate); d < checkoutDate; d.setDate(d.getDate() + 1)) {
              const dateStr = d.toISOString().split('T')[0]
              reservationsMap.set(dateStr, reservation)
            }
          })
        }
      } catch (error) {
        console.log('예약 데이터 조회 실패:', error)
      }
    }
    
    const days: CalendarDay[] = []
    const today = new Date()
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      
      const dayData = generateDayDataWithReservations(date, today, year, month, reservationsMap)
      days.push(dayData)
    }
    
    setCalendarData(days)
  }

  const generateDayData = async (date: Date, today: Date, currentYear: number, currentMonth: number): Promise<CalendarDay> => {
    const dateStr = date.toISOString().split('T')[0]
    const isCurrentMonth = date.getMonth() === currentMonth
    const isToday = date.toDateString() === today.toDateString()
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    
    // 실제 DB에서 데이터 가져오기
    const realData = await getRealDataForDate(date, isWeekend)
    
    return {
      date: dateStr,
      day: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
      isCurrentMonth,
      isToday,
      isWeekend,
      ...realData
    }
  }

  const generateDayDataWithReservations = (
    date: Date, 
    today: Date, 
    currentYear: number, 
    currentMonth: number, 
    reservationsMap: Map<string, any>
  ): CalendarDay => {
    const dateStr = date.toISOString().split('T')[0]
    const isCurrentMonth = date.getMonth() === currentMonth
    const isToday = date.toDateString() === today.toDateString()
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    const basePrice = isWeekend ? 320000 : 280000
    
    // 예약 데이터 확인
    const reservation = reservationsMap.get(dateStr)
    
    if (reservation) {
      const isCheckin = reservation.checkin_date === dateStr
      const isCheckout = reservation.checkout_date === dateStr
      
      return {
        date: dateStr,
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        isCurrentMonth,
        isToday,
        isWeekend,
        status: 'reserved' as const,
        price: basePrice,
        basePrice,
        reservationId: reservation.id,
        guestName: reservation.guest_name,
        guestCount: reservation.guest_count,
        checkInOut: isCheckin && isCheckout ? 'both' as const :
                   isCheckin ? 'checkin' as const :
                   isCheckout ? 'checkout' as const : undefined,
        isCustomPrice: false,
        paymentStatus: reservation.payment_status === 'paid' ? 'completed' as const : 'pending' as const
      }
    }
    
    // 기본값: 예약 가능
    return {
      date: dateStr,
      day: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
      isCurrentMonth,
      isToday,
      isWeekend,
      status: 'available' as const,
      price: basePrice,
      basePrice,
      isCustomPrice: false
    }
  }

  const getRealDataForDate = async (date: Date, isWeekend: boolean) => {
    try {
      const dateStr = date.toISOString().split('T')[0]
      const basePrice = isWeekend ? 320000 : 280000

      if (!selectedUnit || selectedUnit === 'all') {
        return {
          status: 'available' as const,
          price: basePrice,
          basePrice,
          isCustomPrice: false
        }
      }

      // 예약 정보 확인만 수행 (room_statuses 테이블이 존재하지 않으므로 제거)
      try {
        const { data: reservationData, error } = await createClient()
          .from('reservations')
          .select('*')
          .eq('accommodation_id', selectedUnit)
          .lte('checkin_date', dateStr)
          .gte('checkout_date', dateStr)
          .in('status', ['confirmed', 'pending'])
          .maybeSingle()

        if (reservationData) {
          const isCheckin = reservationData.checkin_date === dateStr
          const isCheckout = reservationData.checkout_date === dateStr
          
          return {
            status: 'reserved' as const,
            price: basePrice,
            basePrice,
            reservationId: reservationData.id,
            guestName: reservationData.guest_name,
            guestCount: reservationData.guest_count,
            checkInOut: isCheckin && isCheckout ? 'both' as const :
                       isCheckin ? 'checkin' as const :
                       isCheckout ? 'checkout' as const : undefined,
            isCustomPrice: false,
            paymentStatus: reservationData.payment_status === 'paid' ? 'completed' as const : 'pending' as const
          }
        }
      } catch (reservationError) {
        // 예약 조회 실패는 무시하고 계속 진행
        console.log('예약 데이터 조회 실패 (정상):', reservationError)
      }

      // 기본값: 예약 가능
      return {
        status: 'available' as const,
        price: basePrice,
        basePrice,
        isCustomPrice: false
      }

    } catch (error) {
      console.error('날짜별 데이터 로드 실패:', error)
      const basePrice = isWeekend ? 320000 : 280000
      return {
        status: 'available' as const,
        price: basePrice,
        basePrice,
        isCustomPrice: false
      }
    }
  }


  const getDayClassNames = (day: CalendarDay) => {
    const base = "relative p-2 min-h-[80px] border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
    const selected = selectedDates.includes(day.date) ? "ring-2 ring-blue-500" : ""
    const currentMonth = day.isCurrentMonth ? "" : "bg-gray-100 text-gray-400"
    const today = day.isToday ? "bg-blue-50 border-blue-300" : ""
    
    let status = ""
    switch (day.status) {
      case 'reserved':
        status = "bg-red-100 border-red-300"
        break
      case 'blocked':
        status = "bg-gray-300 border-gray-400"
        break
      case 'maintenance':
        status = "bg-orange-100 border-orange-300"
        break
      case 'payment_pending':
        status = "bg-amber-100 border-amber-300 animate-pulse"
        break
      case 'hold_expired':
        status = "bg-gray-300 border-gray-500 opacity-60"
        break
      case 'available':
        status = day.isCustomPrice ? "bg-green-100 border-green-300" : ""
        break
    }
    
    return `${base} ${selected} ${currentMonth} ${today} ${status}`
  }

  const getStatusText = (status: string) => {
    const statusMap = {
      'available': '예약가능',
      'reserved': '예약됨',
      'blocked': '예약차단',
      'maintenance': '정비중',
      'payment_pending': '결제대기',
      'hold_expired': '홀드만료'
    }
    return statusMap[status as keyof typeof statusMap] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap = {
      'available': 'bg-green-100 text-green-800',
      'reserved': 'bg-red-100 text-red-800',
      'blocked': 'bg-gray-100 text-gray-800',
      'maintenance': 'bg-orange-100 text-orange-800',
      'payment_pending': 'bg-amber-100 text-amber-800',
      'hold_expired': 'bg-gray-300 text-gray-700'
    }
    return colorMap[status as keyof typeof colorMap] || 'bg-gray-100 text-gray-800'
  }

  const handleDateClick = (day: CalendarDay) => {
    if (!day.isCurrentMonth) return
    
    setSelectedDay(day)
    
    if (day.status === 'reserved') {
      setShowReservationModal(true)
    } else {
      setShowPriceModal(true)
      setPriceSettings({
        price: day.price,
        applyToWeekends: false,
        applyToMultiple: false,
        notes: day.notes || ''
      })
    }
  }

  const handleDateSelect = (day: CalendarDay) => {
    if (!day.isCurrentMonth) return
    
    const dateStr = day.date
    setSelectedDates(prev => 
      prev.includes(dateStr) 
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    )
  }

  const handlePriceSave = () => {
    if (!selectedDay) return
    
    const updatedCalendar = calendarData.map(day => 
      day.date === selectedDay.date 
        ? { ...day, price: priceSettings.price, isCustomPrice: true, notes: priceSettings.notes }
        : day
    )
    
    setCalendarData(updatedCalendar)
    setShowPriceModal(false)
    setPriceSettings({ price: 0, applyToWeekends: false, applyToMultiple: false, notes: '' })
  }

  const handleBlockDates = () => {
    const updatedCalendar = calendarData.map(day => 
      selectedDates.includes(day.date)
        ? { 
            ...day, 
            status: blockSettings.isMaintenanceMode ? 'maintenance' as const : 'blocked' as const,
            price: 0,
            notes: blockSettings.reason
          }
        : day
    )
    
    setCalendarData(updatedCalendar)
    setSelectedDates([])
    setBlockSettings({ reason: '', isMaintenanceMode: false })
  }

  const handleUnblockDates = () => {
    const updatedCalendar = calendarData.map(day => 
      selectedDates.includes(day.date) && (day.status === 'blocked' || day.status === 'maintenance')
        ? { ...day, status: 'available' as const, price: day.basePrice, notes: '' }
        : day
    )
    
    setCalendarData(updatedCalendar)
    setSelectedDates([])
  }

  const handleBulkPriceUpdate = () => {
    const updatedCalendar = calendarData.map(day => 
      selectedDates.includes(day.date)
        ? { ...day, price: priceSettings.price, isCustomPrice: true }
        : day
    )
    
    setCalendarData(updatedCalendar)
    setSelectedDates([])
    setPriceSettings({ price: 0, applyToWeekends: false, applyToMultiple: false, notes: '' })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    setCurrentDate(newDate)
  }

  const resetToToday = () => {
    setCurrentDate(new Date())
  }

  const selectedCount = selectedDates.length
  const monthYear = currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
  
  const totalDaysInMonth = calendarData.filter(d => d.isCurrentMonth).length
  const availableDays = calendarData.filter(d => d.isCurrentMonth && d.status === 'available').length
  const reservedDays = calendarData.filter(d => d.isCurrentMonth && d.status === 'reserved').length
  const blockedDays = calendarData.filter(d => d.isCurrentMonth && (d.status === 'blocked' || d.status === 'maintenance')).length

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">달력 데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">예약 달력</h1>
          <p className="text-sm text-gray-600 mt-1">
            일자별 예약 상태 및 가격 관리
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedUnit} onValueChange={setSelectedUnit}>
            <SelectTrigger className="w-[200px] bg-white border border-gray-200 shadow-lg">
              <SelectValue placeholder="숙소 선택" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg">
              <SelectItem value="all">전체 숙소</SelectItem>
              {accommodations.map(acc => (
                <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 통계 및 범례 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">이번 달 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{availableDays}</div>
                <div className="text-sm text-gray-600">예약가능</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{reservedDays}</div>
                <div className="text-sm text-gray-600">예약됨</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{blockedDays}</div>
                <div className="text-sm text-gray-600">차단됨</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {((reservedDays / totalDaysInMonth) * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">예약률</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">달력 범례</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                <span className="text-sm">예약가능 (커스텀 가격)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                <span className="text-sm">예약됨</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-300 border border-gray-400 rounded"></div>
                <span className="text-sm">예약차단</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
                <span className="text-sm">정비중</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-blue-50 border border-blue-300 rounded"></div>
                <span className="text-sm">오늘</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 선택된 날짜 관리 도구 */}
      {selectedCount > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedCount}개 날짜 선택됨
                </span>
                <Button size="sm" variant="outline" onClick={() => setSelectedDates([])}>
                  <X className="w-4 h-4 mr-1" />
                  선택해제
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="가격"
                    value={priceSettings.price || ''}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setPriceSettings(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                    className="w-32"
                  />
                  <Button size="sm" onClick={handleBulkPriceUpdate}>
                    <DollarSign className="w-4 h-4 mr-1" />
                    가격적용
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="차단사유"
                    value={blockSettings.reason}
                    onChange={(e) => setBlockSettings(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-32"
                  />
                  <Button size="sm" variant="destructive" onClick={handleBlockDates}>
                    <Lock className="w-4 h-4 mr-1" />
                    차단
                  </Button>
                </div>
                <Button size="sm" variant="outline" onClick={handleUnblockDates}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  차단해제
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 달력 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-xl font-semibold">{monthYear}</h2>
              <Button variant="outline" onClick={() => navigateMonth('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={resetToToday}>
                <CalendarIcon className="w-4 h-4 mr-2" />
                오늘
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              클릭: 가격/상태 수정 | Shift+클릭: 다중 선택
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-0 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 bg-gray-50 border">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-0">
            {calendarData.map((day, index) => (
              <div
                key={index}
                className={getDayClassNames(day)}
                onClick={(e) => {
                  if (e.shiftKey) {
                    handleDateSelect(day)
                  } else {
                    handleDateClick(day)
                  }
                }}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm ${day.isToday ? 'font-bold text-blue-600' : ''}`}>
                      {day.day}
                    </span>
                    {day.isCustomPrice && (
                      <Badge className="text-xs bg-yellow-100 text-yellow-800 px-1 py-0">
                        커스텀
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {/* 방막기/방열기 배지 */}
                      {day.status === 'blocked' && (
                        <Badge className="text-xs bg-red-500 text-white mb-1">
                          방막기
                        </Badge>
                      )}
                      {day.status === 'available' && day.isWeekend && (
                        <Badge className="text-xs bg-blue-500 text-white mb-1">
                          방열기
                        </Badge>
                      )}
                      
                      {/* 한국 공휴일 표시 */}
                      {day.isWeekend && new Date(day.date).getDay() === 0 && (
                        <Badge className="text-xs bg-red-100 text-red-800 mb-1">
                          일요일
                        </Badge>
                      )}
                      
                      {day.status === 'reserved' && (
                        <div className="text-xs text-red-700 font-medium mb-1">
                          {day.guestName}
                          {day.checkInOut === 'checkin' && ' 체크인'}
                          {day.checkInOut === 'checkout' && ' 체크아웃'}
                        </div>
                      )}
                      
                      {day.notes && (
                        <div className="text-xs text-gray-600 truncate">
                          📝 {day.notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-1">
                      {day.status === 'available' ? (
                        <div className="text-xs font-medium text-green-700">
                          ₩{day.price.toLocaleString()}
                        </div>
                      ) : day.status === 'blocked' ? (
                        <div className="text-xs font-medium text-red-600">
                          차단됨
                        </div>
                      ) : (
                        <Badge className={`text-xs ${getStatusColor(day.status)}`}>
                          {getStatusText(day.status)}
                        </Badge>
                      )}
                      
                      {day.guestCount && (
                        <div className="flex items-center text-xs text-gray-600 mt-1">
                          <Users className="w-3 h-3 mr-1" />
                          {day.guestCount}명
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 가격 설정 모달 */}
      <Dialog open={showPriceModal} onOpenChange={setShowPriceModal}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>
              {selectedDay?.date} 가격 및 상태 설정
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>가격 (원)</Label>
              <Input
                type="number"
                value={priceSettings.price || ''}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setPriceSettings(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                placeholder="가격을 입력하세요"
              />
              {selectedDay && (
                <p className="text-xs text-gray-500 mt-1">
                  기본 가격: ₩{selectedDay.basePrice.toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <Label>메모</Label>
              <Textarea
                value={priceSettings.notes}
                onChange={(e) => setPriceSettings(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="특별한 안내사항이나 메모"
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="custom-price"
                checked={priceSettings.price !== selectedDay?.basePrice}
                onCheckedChange={(checked) => {
                  if (!checked && selectedDay) {
                    setPriceSettings(prev => ({ ...prev, price: selectedDay.basePrice }))
                  }
                }}
              />
              <Label htmlFor="custom-price" className="text-sm">
                커스텀 가격 설정
              </Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowPriceModal(false)}>
                취소
              </Button>
              <Button onClick={handlePriceSave}>
                저장
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 예약 정보 모달 */}
      <Dialog open={showReservationModal} onOpenChange={setShowReservationModal}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>예약 정보</DialogTitle>
          </DialogHeader>
          {selectedDay && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">예약자</Label>
                  <p className="font-medium">{selectedDay.guestName}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">인원</Label>
                  <p className="font-medium">{selectedDay.guestCount}명</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">날짜</Label>
                  <p className="font-medium">{selectedDay.date}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">금액</Label>
                  <p className="font-medium">₩{selectedDay.price.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" asChild>
                  <a href={`/host/reservations?id=${selectedDay.reservationId}`}>
                    <Eye className="w-4 h-4 mr-2" />
                    예약 상세보기
                  </a>
                </Button>
                <Button variant="outline" onClick={() => setShowReservationModal(false)}>
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