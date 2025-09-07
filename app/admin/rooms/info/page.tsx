'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Plus, 
  Edit, 
  Save,
  Users,
  DollarSign,
  Baby,
  User,
  Clock,
  Info
} from 'lucide-react'

interface RoomInfo {
  id: number
  stayName: string
  roomType: string
  capacity: {
    basic: number
    max: number
  }
  pricing: {
    basePrice: number
    adultExtraFee: number
    teenExtraFee: number
    childExtraFee: number
    infantFee: number
  }
  timePolicy: {
    checkIn: string
    checkOut: string
    earlyCheckInFee?: number
    lateCheckOutFee?: number
  }
  additionalInfo: {
    extraPersonDescription: string
    specialNotes?: string
  }
  status: 'active' | 'inactive'
  updatedAt: string
}

export default function RoomInfoPage() {
  const [selectedRoom, setSelectedRoom] = useState<RoomInfo | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Mock data - 객실 정보 데이터
  const roomInfos: RoomInfo[] = [
    {
      id: 1,
      stayName: '구공스테이 청주 본디',
      roomType: '프리미엄 풀빌라',
      capacity: {
        basic: 4,
        max: 8
      },
      pricing: {
        basePrice: 150000,
        adultExtraFee: 20000,
        teenExtraFee: 15000,
        childExtraFee: 10000,
        infantFee: 0
      },
      timePolicy: {
        checkIn: '15:00',
        checkOut: '23:00',
        earlyCheckInFee: 30000,
        lateCheckOutFee: 20000
      },
      additionalInfo: {
        extraPersonDescription: '기본 4명 + 추가인원 최대 4명까지 가능합니다. 침구류는 별도 요청 시 제공됩니다.',
        specialNotes: '수영장 이용 시간: 06:00-22:00, 바베큐 시설 이용 가능'
      },
      status: 'active',
      updatedAt: '2025-08-15'
    },
    {
      id: 2,
      stayName: '구공스테이 소소한옥',
      roomType: '전통 한옥',
      capacity: {
        basic: 4,
        max: 6
      },
      pricing: {
        basePrice: 120000,
        adultExtraFee: 15000,
        teenExtraFee: 10000,
        childExtraFee: 5000,
        infantFee: 0
      },
      timePolicy: {
        checkIn: '15:00',
        checkOut: '23:00'
      },
      additionalInfo: {
        extraPersonDescription: '기본 4명 + 추가인원 최대 2명까지 가능합니다. 한옥 특성상 침구 준비에 시간이 소요될 수 있습니다.',
        specialNotes: '전통 온돌 난방, 한복 체험 가능'
      },
      status: 'active',
      updatedAt: '2025-08-10'
    },
    {
      id: 3,
      stayName: '구공스테이 옥천 키즈',
      roomType: '키즈 전용 빌라',
      capacity: {
        basic: 4,
        max: 8
      },
      pricing: {
        basePrice: 160000,
        adultExtraFee: 25000,
        teenExtraFee: 20000,
        childExtraFee: 15000,
        infantFee: 5000
      },
      timePolicy: {
        checkIn: '15:00',
        checkOut: '23:00',
        earlyCheckInFee: 25000
      },
      additionalInfo: {
        extraPersonDescription: '기본 4명(성인 2명 + 아이 2명) + 추가인원 최대 4명까지 가능합니다. 유아용 침구 및 용품 완비.',
        specialNotes: '키즈풀장, 놀이터, 안전시설 완비. 보호자 동반 필수'
      },
      status: 'active',
      updatedAt: '2025-08-20'
    },
    {
      id: 4,
      stayName: '구공스테이 사천 안토이비토',
      roomType: '오션뷰 풀빌라',
      capacity: {
        basic: 4,
        max: 10
      },
      pricing: {
        basePrice: 170000,
        adultExtraFee: 30000,
        teenExtraFee: 25000,
        childExtraFee: 15000,
        infantFee: 0
      },
      timePolicy: {
        checkIn: '15:00',
        checkOut: '23:00',
        earlyCheckInFee: 40000,
        lateCheckOutFee: 30000
      },
      additionalInfo: {
        extraPersonDescription: '기본 4명 + 추가인원 최대 6명까지 가능합니다. 대형 빌라로 단체 이용에 적합합니다.',
        specialNotes: '사계절 온수풀, 오션뷰 테라스, 바베큐 시설 완비'
      },
      status: 'active',
      updatedAt: '2025-08-25'
    }
  ]

  const handleEditRoom = (room: RoomInfo) => {
    setSelectedRoom(room)
    setIsDialogOpen(true)
  }

  const handleSaveRoom = () => {
    console.log('Saving room info:', selectedRoom)
    setIsDialogOpen(false)
    setSelectedRoom(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">객실 기본정보 관리</h1>
          <p className="text-gray-600">스테이별 기준인원, 최대인원, 추가비용 등 기본 정보를 관리합니다.</p>
        </div>
        <Button onClick={() => {
          setSelectedRoom(null)
          setIsDialogOpen(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          객실 정보 추가
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 객실</p>
                <p className="text-2xl font-bold">{roomInfos.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">평균 기본인원</p>
                <p className="text-2xl font-bold">
                  {Math.round(roomInfos.reduce((sum, room) => sum + room.capacity.basic, 0) / roomInfos.length)}명
                </p>
              </div>
              <User className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">평균 기본가격</p>
                <p className="text-2xl font-bold">
                  ₩{Math.round(roomInfos.reduce((sum, room) => sum + room.pricing.basePrice, 0) / roomInfos.length / 1000)}K
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">표준 이용시간</p>
                <p className="text-2xl font-bold">8시간</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>객실 정보 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>스테이명 / 객실타입</TableHead>
                <TableHead>인원</TableHead>
                <TableHead>기본가격</TableHead>
                <TableHead>추가인원 요금</TableHead>
                <TableHead>이용시간</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roomInfos.map((room) => (
                <TableRow key={room.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{room.stayName}</p>
                      <p className="text-sm text-gray-500">{room.roomType}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">기본 {room.capacity.basic}명</p>
                      <p className="text-gray-500">최대 {room.capacity.max}명</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">₩{room.pricing.basePrice.toLocaleString()}</p>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-1">
                      <div>성인: ₩{room.pricing.adultExtraFee.toLocaleString()}</div>
                      <div>청소년: ₩{room.pricing.teenExtraFee.toLocaleString()}</div>
                      <div>아동: ₩{room.pricing.childExtraFee.toLocaleString()}</div>
                      {room.pricing.infantFee > 0 && (
                        <div>유아: ₩{room.pricing.infantFee.toLocaleString()}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{room.timePolicy.checkIn} - {room.timePolicy.checkOut}</p>
                      {room.timePolicy.earlyCheckInFee && (
                        <p className="text-xs text-gray-500">
                          조기입실: +₩{room.timePolicy.earlyCheckInFee.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleEditRoom(room)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Room Info Details Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {roomInfos.slice(0, 2).map((room) => (
          <Card key={room.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{room.stayName}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => handleEditRoom(room)}>
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-600">{room.roomType}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">인원</span>
                  </div>
                  <p className="text-lg font-bold">기본 {room.capacity.basic}명</p>
                  <p className="text-xs text-gray-600">최대 {room.capacity.max}명</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">기본가격</span>
                  </div>
                  <p className="text-lg font-bold">₩{room.pricing.basePrice.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">8시간 이용</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">추가인원 요금</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span>성인:</span>
                    <span>₩{room.pricing.adultExtraFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>청소년:</span>
                    <span>₩{room.pricing.teenExtraFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>아동:</span>
                    <span>₩{room.pricing.childExtraFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>유아:</span>
                    <span>₩{room.pricing.infantFee.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">추가 정보</h4>
                <p className="text-xs text-gray-600 mb-2">
                  {room.additionalInfo.extraPersonDescription}
                </p>
                {room.additionalInfo.specialNotes && (
                  <p className="text-xs text-blue-600">
                    {room.additionalInfo.specialNotes}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit/Add Room Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRoom ? '객실 정보 수정' : '새 객실 정보 추가'}
            </DialogTitle>
            <DialogDescription>
              스테이의 기본 정보와 요금 정책을 설정합니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">스테이 선택</label>
                <Select defaultValue={selectedRoom?.stayName}>
                  <SelectTrigger>
                    <SelectValue placeholder="스테이를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="구공스테이 청주 본디">구공스테이 청주 본디</SelectItem>
                    <SelectItem value="구공스테이 소소한옥">구공스테이 소소한옥</SelectItem>
                    <SelectItem value="구공스테이 옥천 키즈">구공스테이 옥천 키즈</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">객실 타입</label>
                <Input 
                  placeholder="예: 프리미엄 풀빌라"
                  defaultValue={selectedRoom?.roomType}
                />
              </div>
            </div>

            {/* Capacity Settings */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                인원 설정
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">기준인원</label>
                  <Input 
                    type="number" 
                    placeholder="4"
                    defaultValue={selectedRoom?.capacity.basic}
                  />
                  <p className="text-xs text-gray-500 mt-1">기본 요금에 포함되는 인원</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">최대인원</label>
                  <Input 
                    type="number" 
                    placeholder="8"
                    defaultValue={selectedRoom?.capacity.max}
                  />
                  <p className="text-xs text-gray-500 mt-1">시설 최대 수용 인원</p>
                </div>
              </div>
            </div>

            {/* Pricing Settings */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                요금 설정
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">기본 가격</label>
                  <Input 
                    type="number" 
                    placeholder="150000"
                    defaultValue={selectedRoom?.pricing.basePrice}
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">성인 추가비용</label>
                    <Input 
                      type="number" 
                      placeholder="20000"
                      defaultValue={selectedRoom?.pricing.adultExtraFee}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">청소년 추가비용</label>
                    <Input 
                      type="number" 
                      placeholder="15000"
                      defaultValue={selectedRoom?.pricing.teenExtraFee}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">아동 추가비용</label>
                    <Input 
                      type="number" 
                      placeholder="10000"
                      defaultValue={selectedRoom?.pricing.childExtraFee}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">유아 추가비용</label>
                    <Input 
                      type="number" 
                      placeholder="0"
                      defaultValue={selectedRoom?.pricing.infantFee}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Time Policy Settings */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                시간 정책
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">체크인 시간</label>
                  <Input 
                    type="time"
                    defaultValue={selectedRoom?.timePolicy.checkIn}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">체크아웃 시간</label>
                  <Input 
                    type="time"
                    defaultValue={selectedRoom?.timePolicy.checkOut}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">조기입실 요금</label>
                  <Input 
                    type="number"
                    placeholder="30000"
                    defaultValue={selectedRoom?.timePolicy.earlyCheckInFee}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">연장 요금</label>
                  <Input 
                    type="number"
                    placeholder="20000"
                    defaultValue={selectedRoom?.timePolicy.lateCheckOutFee}
                  />
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Info className="w-4 h-4" />
                추가 정보
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">추가인원 안내</label>
                  <Textarea
                    placeholder="추가인원 이용 시 주의사항이나 안내사항을 입력하세요."
                    rows={3}
                    defaultValue={selectedRoom?.additionalInfo.extraPersonDescription}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">특별 안내사항</label>
                  <Textarea
                    placeholder="시설 이용 시간, 특별 서비스 등을 입력하세요."
                    rows={3}
                    defaultValue={selectedRoom?.additionalInfo.specialNotes}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveRoom}>
              <Save className="w-4 h-4 mr-2" />
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}