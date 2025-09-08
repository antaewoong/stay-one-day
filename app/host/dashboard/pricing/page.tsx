'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, Calendar, Save, Settings } from 'lucide-react'

interface RoomStatus {
  id: string
  accommodation_id: string
  room_id?: string
  date: string
  status: 'available' | 'booked_platform' | 'manual_closed' | 'maintenance' | 'blocked'
  price: number
  base_price: number
  notes?: string
  reservation_id?: string
  guest_name?: string
  guest_phone?: string
  created_at: string
  updated_at: string
}

interface PricingCalendarDay {
  date: Date
  dateString: string
  status: RoomStatus['status']
  price: number
  isToday: boolean
  isCurrentMonth: boolean
  notes?: string
  reservation?: {
    guest_name?: string
    guest_phone?: string
  }
}

export default function HostPricingPage() {
  const supabase = createClient()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [roomStatuses, setRoomStatuses] = useState<RoomStatus[]>([])
  const [selectedAccommodation, setSelectedAccommodation] = useState<string>('')
  const [selectedRoom, setSelectedRoom] = useState<string>('')
  const [accommodations, setAccommodations] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<PricingCalendarDay | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const [hostData, setHostData] = useState<any>(null)

  useEffect(() => {
    // 호스트 정보 초기화
    const userData = sessionStorage.getItem('hostUser')
    if (userData) {
      setHostData(JSON.parse(userData))
    }
  }, [])

  useEffect(() => {
    if (hostData) {
      loadData()
    }
  }, [hostData, currentDate, selectedAccommodation])

  const loadData = async () => {
    try {
      setLoading(true)

      if (!hostData?.host_id) {
        console.error('호스트 정보가 없습니다')
        return
      }

      // 호스트 UUID 가져오기
      const { data: hostIdData } = await supabase
        .from('hosts')
        .select('id')
        .eq('host_id', hostData.host_id)
        .single()

      if (!hostIdData) {
        console.error('호스트 정보를 찾을 수 없습니다')
        return
      }

      // Load accommodations for this host
      const { data: accData, error: accError } = await supabase
        .from('accommodations')
        .select('id, name, accommodation_type')
        .eq('host_id', hostIdData.id)
        .eq('status', 'active')

      if (accError) {
        console.error('숙소 데이터 로드 실패:', accError)
        setAccommodations([])
      } else {
        setAccommodations(accData || [])
      }

      // Load rooms for selected accommodation
      if (selectedAccommodation) {
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('id, name, accommodation_id')
          .eq('accommodation_id', selectedAccommodation)

        if (roomError) {
          console.error('객실 데이터 로드 실패:', roomError)
          setRooms([])
        } else {
          setRooms(roomData || [])
        }

        if (!selectedRoom && roomData?.[0]) {
          setSelectedRoom(roomData[0].id)
        }
      }

      if (!selectedAccommodation && accData?.[0]) {
        setSelectedAccommodation(accData[0].id)
        return
      }

      // Load room statuses for current month
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      
      let query = supabase
        .from('room_statuses')
        .select('*')
        .eq('accommodation_id', selectedAccommodation)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date')
      
      if (selectedRoom) {
        query = query.eq('room_id', selectedRoom)
      }

      const { data: statusData, error: statusError } = await query

      if (statusError) {
        console.error('객실 상태 데이터 로드 실패:', statusError)
        setRoomStatuses([])
      } else {
        setRoomStatuses(statusData || [])
      }

    } catch (error) {
      console.error('데이터 로드 실패:', error)
      setAccommodations([])
      setRooms([])
      setRoomStatuses([])
    } finally {
      setLoading(false)
    }
  }

  const generateCalendarDays = (): PricingCalendarDay[] => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days: PricingCalendarDay[] = []
    const today = new Date()

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      
      const dateString = date.toISOString().split('T')[0]
      const roomStatus = roomStatuses.find(rs => rs.date === dateString)
      
      days.push({
        date,
        dateString,
        status: roomStatus?.status || 'available',
        price: roomStatus?.price || 550000,
        isToday: date.toDateString() === today.toDateString(),
        isCurrentMonth: date.getMonth() === month,
        notes: roomStatus?.notes,
        reservation: roomStatus?.guest_name ? {
          guest_name: roomStatus.guest_name,
          guest_phone: roomStatus.guest_phone
        } : undefined
      })
    }

    return days
  }

  const getStatusColor = (status: RoomStatus['status']) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'booked_platform': return 'bg-orange-100 text-orange-800'
      case 'manual_closed': return 'bg-purple-100 text-purple-800'
      case 'maintenance': return 'bg-red-100 text-red-800'
      case 'blocked': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: RoomStatus['status']) => {
    switch (status) {
      case 'available': return '예약 가능'
      case 'booked_platform': return '예약 완료'
      case 'manual_closed': return '수동 마감'
      case 'maintenance': return '정비'
      case 'blocked': return '차단'
      default: return status
    }
  }

  const handlePriceChange = async (dateString: string, newPrice: number) => {
    try {
      const { error } = await supabase
        .from('room_statuses')
        .upsert({
          accommodation_id: selectedAccommodation,
          room_id: selectedRoom,
          date: dateString,
          price: newPrice,
          base_price: 550000,
          status: 'available',
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      // Update local state
      setRoomStatuses(prev => {
        const existing = prev.find(rs => rs.date === dateString)
        if (existing) {
          return prev.map(rs => rs.date === dateString ? {...rs, price: newPrice} : rs)
        } else {
          return [...prev, {
            id: `new-${dateString}`,
            accommodation_id: selectedAccommodation,
            room_id: selectedRoom,
            date: dateString,
            status: 'available',
            price: newPrice,
            base_price: 550000,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]
        }
      })

    } catch (error) {
      console.error('가격 업데이트 실패:', error)
      // Mock update for demo
      setRoomStatuses(prev => {
        const existing = prev.find(rs => rs.date === dateString)
        if (existing) {
          return prev.map(rs => rs.date === dateString ? {...rs, price: newPrice} : rs)
        }
        return prev
      })
    }
  }

  const handleStatusUpdate = async (data: Partial<RoomStatus>) => {
    if (!selectedDay) return

    try {
      const updateData = {
        accommodation_id: selectedAccommodation,
        room_id: selectedRoom,
        date: selectedDay.dateString,
        ...data,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('room_statuses')
        .upsert(updateData)

      if (error) throw error

      // Update local state
      setRoomStatuses(prev => {
        const existing = prev.find(rs => rs.date === selectedDay.dateString)
        if (existing) {
          return prev.map(rs => rs.date === selectedDay.dateString ? {...rs, ...data} : rs)
        } else {
          return [...prev, {
            id: `new-${selectedDay.dateString}`,
            ...updateData
          } as RoomStatus]
        }
      })

      setModalOpen(false)
      
    } catch (error) {
      console.error('상태 업데이트 실패:', error)
      alert('상태 업데이트에 실패했습니다.')
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
      return newDate
    })
  }

  const calendarDays = generateCalendarDays()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">객실 예약 상태</h1>
        <div className="flex items-center gap-4">
          <Select value={selectedAccommodation} onValueChange={(value) => {
            setSelectedAccommodation(value)
            setSelectedRoom('')
          }}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="숙소 선택" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg">
              {accommodations.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name} ({acc.accommodation_type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {rooms.length > 0 && (
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="객실 선택" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월 객실 상태
          </h2>
          <Button variant="outline" onClick={() => navigateMonth('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Status Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 rounded"></div>
              <span className="text-sm">예약 가능</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-100 rounded"></div>
              <span className="text-sm">플랫폼 예약 완료</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-100 rounded"></div>
              <span className="text-sm">수동 마감 (외부 예약)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 rounded"></div>
              <span className="text-sm">정비/차단</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : (
            <div className="space-y-4">
              {/* Calendar Header */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                  <div key={day} className="p-2 text-center font-medium text-gray-600">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Body */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`
                      min-h-[120px] p-2 border rounded-lg cursor-pointer hover:bg-gray-50
                      ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                      ${day.isToday ? 'ring-2 ring-blue-500' : ''}
                    `}
                    onClick={() => {
                      if (day.isCurrentMonth) {
                        setSelectedDay(day)
                        setModalOpen(true)
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                        {day.date.getDate()}
                      </span>
                      {day.isCurrentMonth && (
                        <Badge className={getStatusColor(day.status)} variant="secondary">
                          {getStatusText(day.status)}
                        </Badge>
                      )}
                    </div>
                    
                    {day.isCurrentMonth && day.status === 'available' && (
                      <div className="space-y-1">
                        <Input
                          type="number"
                          value={day.price}
                          onChange={(e) => handlePriceChange(day.dateString, parseInt(e.target.value) || 0)}
                          className="text-xs h-8"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="text-xs text-gray-500">원</div>
                      </div>
                    )}

                    {day.isCurrentMonth && day.status !== 'available' && day.reservation && (
                      <div className="text-xs text-gray-600">
                        <div>{day.reservation.guest_name}</div>
                        <div>{day.reservation.guest_phone}</div>
                      </div>
                    )}

                    {day.isCurrentMonth && day.notes && (
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {day.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>객실 상태 변경</DialogTitle>
          </DialogHeader>
          {selectedDay && (
            <RoomStatusForm
              day={selectedDay}
              onSubmit={handleStatusUpdate}
              onCancel={() => setModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface RoomStatusFormProps {
  day: PricingCalendarDay
  onSubmit: (data: Partial<RoomStatus>) => void
  onCancel: () => void
}

function RoomStatusForm({ day, onSubmit, onCancel }: RoomStatusFormProps) {
  const [status, setStatus] = useState<RoomStatus['status']>(day.status)
  const [price, setPrice] = useState(day.price.toString())
  const [notes, setNotes] = useState(day.notes || '')
  const [guestName, setGuestName] = useState(day.reservation?.guest_name || '')
  const [guestPhone, setGuestPhone] = useState(day.reservation?.guest_phone || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const data: Partial<RoomStatus> = {
      status,
      price: parseInt(price) || 0,
      notes: notes || undefined,
      guest_name: status !== 'available' ? guestName || undefined : undefined,
      guest_phone: status !== 'available' ? guestPhone || undefined : undefined
    }

    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>객실 일 : {day.date.toLocaleDateString('ko-KR')}</Label>
      </div>

      <div>
        <Label htmlFor="status">상태</Label>
        <Select value={status} onValueChange={(value: RoomStatus['status']) => setStatus(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg">
            <SelectItem value="available">예약 가능</SelectItem>
            <SelectItem value="booked_platform">플랫폼 예약</SelectItem>
            <SelectItem value="manual_closed">수동 마감</SelectItem>
            <SelectItem value="maintenance">정비</SelectItem>
            <SelectItem value="blocked">차단</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {status === 'available' && (
        <div>
          <Label htmlFor="price">가격 (원)</Label>
          <Input
            id="price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="550000"
          />
        </div>
      )}

      {status !== 'available' && (
        <>
          <div>
            <Label htmlFor="guestName">예약자명</Label>
            <Input
              id="guestName"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="김○○"
            />
          </div>
          <div>
            <Label htmlFor="guestPhone">연락처</Label>
            <Input
              id="guestPhone"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="010-****-****"
            />
          </div>
        </>
      )}

      <div>
        <Label htmlFor="notes">메모</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="추가 메모..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit">
          <Save className="w-4 h-4 mr-2" />
          저장
        </Button>
      </div>
    </form>
  )
}