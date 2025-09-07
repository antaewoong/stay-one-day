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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Waves,
  Utensils,
  Flame,
  Clock,
  Zap,
  Palette,
  Eye,
  EyeOff
} from 'lucide-react'

interface RoomOption {
  id: number
  roomId: number
  roomName: string
  optionType: '미온수풀' | '그릴' | '불멍' | '얼리버드체크인' | '기타'
  optionName: string
  description: string
  price: number
  isActive: boolean
  isDefault: boolean
  category: 'pool' | 'dining' | 'fire' | 'checkin' | 'other'
  availableTime?: string
  maxCapacity?: number
  additionalNotes: string
  createdAt: string
  updatedAt: string
}

export default function RoomOptionsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedOption, setSelectedOption] = useState<RoomOption | null>(null)

  // Mock data
  const options: RoomOption[] = [
    {
      id: 1,
      roomId: 1,
      roomName: '구공스테이 청주 본디',
      optionType: '미온수풀',
      optionName: '실내 온수풀 이용',
      description: '사계절 이용 가능한 실내 온수풀입니다. 수온 28-30도 유지',
      price: 0,
      isActive: true,
      isDefault: true,
      category: 'pool',
      availableTime: '24시간',
      maxCapacity: 8,
      additionalNotes: '수영복 필수 착용, 샤워 후 입수',
      createdAt: '2025-01-15',
      updatedAt: '2025-08-15'
    },
    {
      id: 2,
      roomId: 1,
      roomName: '구공스테이 청주 본디',
      optionType: '그릴',
      optionName: '바베큐 그릴 이용',
      description: '야외 바베큐 시설 및 그릴 이용 서비스',
      price: 30000,
      isActive: true,
      isDefault: false,
      category: 'dining',
      availableTime: '15:00-22:00',
      maxCapacity: 8,
      additionalNotes: '숯, 그릴망 제공. 식재료는 별도 준비',
      createdAt: '2025-01-15',
      updatedAt: '2025-08-10'
    },
    {
      id: 3,
      roomId: 2,
      roomName: '구공스테이 소소한옥',
      optionType: '불멍',
      optionName: '전통 화로 불멍',
      description: '한옥 마당에서 즐기는 전통 화로 체험',
      price: 20000,
      isActive: true,
      isDefault: false,
      category: 'fire',
      availableTime: '18:00-23:00',
      maxCapacity: 6,
      additionalNotes: '장작, 화로대 제공. 안전수칙 준수 필수',
      createdAt: '2025-02-01',
      updatedAt: '2025-08-12'
    },
    {
      id: 4,
      roomId: 3,
      roomName: '구공스테이 옥천 키즈',
      optionType: '얼리버드체크인',
      optionName: '얼리 체크인 (12:00)',
      description: '정규 체크인 시간보다 3시간 일찍 입실',
      price: 50000,
      isActive: true,
      isDefault: false,
      category: 'checkin',
      availableTime: '12:00',
      additionalNotes: '사전 예약 필수. 청소 완료 후 이용 가능',
      createdAt: '2025-03-01',
      updatedAt: '2025-08-20'
    },
    {
      id: 5,
      roomId: 4,
      roomName: '구공스테이 사천 안토이비토',
      optionType: '미온수풀',
      optionName: '사계절 온수풀 이용',
      description: '바다 전망이 보이는 사계절 온수풀',
      price: 0,
      isActive: true,
      isDefault: true,
      category: 'pool',
      availableTime: '24시간',
      maxCapacity: 10,
      additionalNotes: '오션뷰 온수풀, 수온 자동 조절',
      createdAt: '2025-04-01',
      updatedAt: '2025-08-25'
    },
    {
      id: 6,
      roomId: 5,
      roomName: '구공스테이 남해 디풀&애견',
      optionType: '그릴',
      optionName: '반려견 동반 바베큐',
      description: '반려견과 함께 즐기는 바베큐 시설',
      price: 25000,
      isActive: true,
      isDefault: false,
      category: 'dining',
      availableTime: '15:00-21:00',
      maxCapacity: 8,
      additionalNotes: '반려견 전용 공간 분리. 리드줄 필수',
      createdAt: '2025-05-01',
      updatedAt: '2025-08-12'
    }
  ]

  const categories = [
    { value: 'all', label: '전체' },
    { value: 'pool', label: '수영장/풀' },
    { value: 'dining', label: '바베큐/그릴' },
    { value: 'fire', label: '불멍/화로' },
    { value: 'checkin', label: '체크인 옵션' },
    { value: 'other', label: '기타' }
  ]

  const filteredOptions = options.filter(option => {
    const matchesSearch = option.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         option.optionName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || option.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  const getOptionIcon = (category: string) => {
    switch (category) {
      case 'pool':
        return <Waves className="w-4 h-4 text-blue-500" />
      case 'dining':
        return <Utensils className="w-4 h-4 text-green-500" />
      case 'fire':
        return <Flame className="w-4 h-4 text-red-500" />
      case 'checkin':
        return <Clock className="w-4 h-4 text-orange-500" />
      default:
        return <Palette className="w-4 h-4 text-purple-500" />
    }
  }

  const getCategoryBadge = (category: string) => {
    const colors = {
      pool: 'bg-blue-100 text-blue-800',
      dining: 'bg-green-100 text-green-800',
      fire: 'bg-red-100 text-red-800',
      checkin: 'bg-orange-100 text-orange-800',
      other: 'bg-purple-100 text-purple-800'
    }
    
    const labels = {
      pool: '수영장',
      dining: '바베큐',
      fire: '불멍',
      checkin: '체크인',
      other: '기타'
    }
    
    return (
      <Badge className={colors[category as keyof typeof colors]}>
        {labels[category as keyof typeof labels]}
      </Badge>
    )
  }

  const openDialog = (option?: RoomOption) => {
    setSelectedOption(option || null)
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setSelectedOption(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">객실 옵션 관리</h1>
          <p className="text-gray-600">객실별 부가 옵션 및 서비스를 관리합니다.</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          옵션 추가
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">전체 옵션</p>
                <p className="text-2xl font-bold">{options.length}</p>
              </div>
              <Zap className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">활성 옵션</p>
                <p className="text-2xl font-bold text-green-600">
                  {options.filter(o => o.isActive).length}
                </p>
              </div>
              <Eye className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">유료 옵션</p>
                <p className="text-2xl font-bold">
                  {options.filter(o => o.price > 0).length}
                </p>
              </div>
              <Palette className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">평균 가격</p>
                <p className="text-2xl font-bold">
                  ₩{Math.round(options.reduce((sum, o) => sum + o.price, 0) / options.length).toLocaleString()}
                </p>
              </div>
              <Zap className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>옵션 목록</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="객실명, 옵션명 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="카테고리" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
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
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>객실 정보</TableHead>
                  <TableHead>옵션 정보</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>가격</TableHead>
                  <TableHead>이용 시간</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOptions.map((option) => (
                  <TableRow key={option.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{option.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.roomName}</span>
                        <span className="text-xs text-gray-500">Room #{option.roomId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {getOptionIcon(option.category)}
                          <span className="font-medium">{option.optionName}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {option.description}
                        </p>
                        {option.additionalNotes && (
                          <p className="text-xs text-blue-600 mt-1">
                            📝 {option.additionalNotes}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getCategoryBadge(option.category)}
                      {option.isDefault && (
                        <Badge variant="outline" className="ml-1 text-xs">
                          기본포함
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {option.price === 0 ? (
                          <span className="text-green-600 font-medium">무료</span>
                        ) : (
                          <span className="font-medium">₩{option.price.toLocaleString()}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {option.availableTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            {option.availableTime}
                          </div>
                        )}
                        {option.maxCapacity && (
                          <div className="text-xs text-gray-500 mt-1">
                            최대 {option.maxCapacity}명
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {option.isActive ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Eye className="w-3 h-3 mr-1" />
                            활성
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">
                            <EyeOff className="w-3 h-3 mr-1" />
                            비활성
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openDialog(option)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredOptions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchQuery || categoryFilter !== 'all'
                ? '검색 조건에 맞는 옵션이 없습니다.'
                : '등록된 옵션이 없습니다.'
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedOption ? '옵션 수정' : '새 옵션 추가'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roomId">객실 선택</Label>
                <Select defaultValue={selectedOption?.roomId.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="객실을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">구공스테이 청주 본디</SelectItem>
                    <SelectItem value="2">구공스테이 소소한옥</SelectItem>
                    <SelectItem value="3">구공스테이 옥천 키즈</SelectItem>
                    <SelectItem value="4">구공스테이 사천 안토이비토</SelectItem>
                    <SelectItem value="5">구공스테이 남해 디풀&애견</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="optionType">옵션 유형</Label>
                <Select defaultValue={selectedOption?.optionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="옵션 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="미온수풀">미온수풀</SelectItem>
                    <SelectItem value="그릴">그릴/바베큐</SelectItem>
                    <SelectItem value="불멍">불멍/화로</SelectItem>
                    <SelectItem value="얼리버드체크인">얼리버드 체크인</SelectItem>
                    <SelectItem value="기타">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="optionName">옵션명</Label>
              <Input
                id="optionName"
                placeholder="옵션명을 입력하세요"
                defaultValue={selectedOption?.optionName}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">옵션 설명</Label>
              <Textarea
                id="description"
                placeholder="옵션에 대한 상세 설명을 입력하세요"
                defaultValue={selectedOption?.description}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">추가 비용 (원)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0"
                  defaultValue={selectedOption?.price}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxCapacity">최대 이용 인원</Label>
                <Input
                  id="maxCapacity"
                  type="number"
                  placeholder="인원수"
                  defaultValue={selectedOption?.maxCapacity}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="availableTime">이용 가능 시간</Label>
              <Input
                id="availableTime"
                placeholder="예: 15:00-23:00, 24시간"
                defaultValue={selectedOption?.availableTime}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalNotes">추가 안내사항</Label>
              <Textarea
                id="additionalNotes"
                placeholder="이용 시 주의사항이나 추가 안내사항을 입력하세요"
                defaultValue={selectedOption?.additionalNotes}
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch id="isActive" defaultChecked={selectedOption?.isActive ?? true} />
                <Label htmlFor="isActive">활성화</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="isDefault" defaultChecked={selectedOption?.isDefault ?? false} />
                <Label htmlFor="isDefault">기본 포함 옵션</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeDialog}>
                취소
              </Button>
              <Button onClick={closeDialog}>
                {selectedOption ? '수정 완료' : '추가 완료'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}