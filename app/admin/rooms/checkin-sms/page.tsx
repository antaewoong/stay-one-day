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
  MessageSquare,
  Clock,
  MapPin,
  Phone,
  Eye,
  EyeOff,
  Send
} from 'lucide-react'

interface CheckInSMS {
  id: number
  roomId: number
  roomName: string
  templateName: string
  messageContent: string
  sendTiming: 'booking' | 'day_before' | 'check_in_time' | 'manual'
  sendTime?: string
  isActive: boolean
  variables: string[]
  category: 'welcome' | 'info' | 'access' | 'emergency'
  priority: 'high' | 'normal' | 'low'
  characterCount: number
  estimatedCost: number
  sentCount: number
  successRate: number
  createdAt: string
  updatedAt: string
}

export default function CheckInSMSPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<CheckInSMS | null>(null)

  // Mock data
  const smsTemplates: CheckInSMS[] = [
    {
      id: 1,
      roomId: 1,
      roomName: '구공스테이 청주 본디',
      templateName: '입실 환영 인사',
      messageContent: '[구공스테이 청주] 안녕하세요! {고객명}님, 오늘 15:00부터 입실 가능합니다. 주소: {숙소주소}, 비밀번호: {출입번호}. 궁금한 점이 있으시면 연락주세요. 즐거운 시간 되세요! - 구공스테이',
      sendTiming: 'check_in_time',
      sendTime: '14:00',
      isActive: true,
      variables: ['고객명', '숙소주소', '출입번호'],
      category: 'welcome',
      priority: 'high',
      characterCount: 112,
      estimatedCost: 22,
      sentCount: 245,
      successRate: 98.4,
      createdAt: '2025-01-15',
      updatedAt: '2025-08-15'
    },
    {
      id: 2,
      roomId: 1,
      roomName: '구공스테이 청주 본디',
      templateName: '시설 이용 안내',
      messageContent: '[구공스테이] 수영장 이용시간: 24시간, 바베큐장: 15-22시까지 이용 가능합니다. 쓰레기는 분리수거 부탁드리며, 소음에 주의해 주세요. 문의: {연락처}',
      sendTiming: 'check_in_time',
      sendTime: '15:30',
      isActive: true,
      variables: ['연락처'],
      category: 'info',
      priority: 'normal',
      characterCount: 89,
      estimatedCost: 18,
      sentCount: 230,
      successRate: 97.8,
      createdAt: '2025-01-15',
      updatedAt: '2025-08-10'
    },
    {
      id: 3,
      roomId: 2,
      roomName: '구공스테이 소소한옥',
      templateName: '한옥 입실 안내',
      messageContent: '[구공스테이 소소한옥] {고객명}님 환영합니다. 한옥 특성상 문턱이 높으니 조심하시기 바랍니다. Wi-Fi: {와이파이정보}, 전통차는 자유롭게 드세요. 조용한 휴식 되세요.',
      sendTiming: 'check_in_time',
      sendTime: '14:30',
      isActive: true,
      variables: ['고객명', '와이파이정보'],
      category: 'welcome',
      priority: 'high',
      characterCount: 98,
      estimatedCost: 20,
      sentCount: 156,
      successRate: 99.2,
      createdAt: '2025-02-01',
      updatedAt: '2025-08-12'
    },
    {
      id: 4,
      roomId: 3,
      roomName: '구공스테이 옥천 키즈',
      templateName: '키즈 안전 안내',
      messageContent: '[구공스테이 키즈] 아이들과 함께 안전한 시간 보내세요! 키즈풀 이용시 보호자 동반 필수, 놀이시설 안전수칙 준수 바랍니다. 응급상황시: {응급연락처}',
      sendTiming: 'check_in_time',
      sendTime: '14:00',
      isActive: true,
      variables: ['응급연락처'],
      category: 'emergency',
      priority: 'high',
      characterCount: 94,
      estimatedCost: 19,
      sentCount: 87,
      successRate: 98.9,
      createdAt: '2025-03-01',
      updatedAt: '2025-08-20'
    },
    {
      id: 5,
      roomId: 4,
      roomName: '구공스테이 사천 안토이비토',
      templateName: '오션뷰 풀빌라 안내',
      messageContent: '[구공스테이 사천] 바다 전망과 함께하는 특별한 하루! 온수풀 24시간 이용 가능, 일몰 시간: {일몰시간}. 바다 산책로 추천드립니다. 문의: {연락처}',
      sendTiming: 'day_before',
      sendTime: '18:00',
      isActive: false,
      variables: ['일몰시간', '연락처'],
      category: 'info',
      priority: 'normal',
      characterCount: 87,
      estimatedCost: 17,
      sentCount: 23,
      successRate: 95.7,
      createdAt: '2025-04-01',
      updatedAt: '2025-08-25'
    }
  ]

  const categories = [
    { value: 'all', label: '전체' },
    { value: 'welcome', label: '환영 인사' },
    { value: 'info', label: '이용 안내' },
    { value: 'access', label: '출입 정보' },
    { value: 'emergency', label: '안전/응급' }
  ]

  const sendTimingOptions = [
    { value: 'booking', label: '예약 완료시' },
    { value: 'day_before', label: '입실 전날' },
    { value: 'check_in_time', label: '입실 당일' },
    { value: 'manual', label: '수동 발송' }
  ]

  const filteredTemplates = smsTemplates.filter(template => {
    const matchesSearch = template.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.templateName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  const getCategoryBadge = (category: string) => {
    const colors = {
      welcome: 'bg-blue-100 text-blue-800',
      info: 'bg-green-100 text-green-800',
      access: 'bg-purple-100 text-purple-800',
      emergency: 'bg-red-100 text-red-800'
    }
    
    const labels = {
      welcome: '환영',
      info: '안내',
      access: '출입',
      emergency: '응급'
    }
    
    return (
      <Badge className={colors[category as keyof typeof colors]}>
        {labels[category as keyof typeof labels]}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      normal: 'bg-yellow-100 text-yellow-800',
      low: 'bg-gray-100 text-gray-800'
    }
    
    const labels = {
      high: '높음',
      normal: '보통',
      low: '낮음'
    }
    
    return (
      <Badge variant="outline" className={colors[priority as keyof typeof colors]}>
        {labels[priority as keyof typeof labels]}
      </Badge>
    )
  }

  const getSendTimingLabel = (timing: string) => {
    const labels = {
      booking: '예약시',
      day_before: '전날',
      check_in_time: '당일',
      manual: '수동'
    }
    
    return labels[timing as keyof typeof labels] || timing
  }

  const openDialog = (template?: CheckInSMS) => {
    setSelectedTemplate(template || null)
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setSelectedTemplate(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">입실 안내문자 관리</h1>
          <p className="text-gray-600">객실별 입실 안내 문자 템플릿을 관리합니다.</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          템플릿 추가
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">전체 템플릿</p>
                <p className="text-2xl font-bold">{smsTemplates.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">활성 템플릿</p>
                <p className="text-2xl font-bold text-green-600">
                  {smsTemplates.filter(t => t.isActive).length}
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
                <p className="text-sm text-gray-600">총 발송수</p>
                <p className="text-2xl font-bold">
                  {smsTemplates.reduce((sum, t) => sum + t.sentCount, 0).toLocaleString()}
                </p>
              </div>
              <Send className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">평균 성공률</p>
                <p className="text-2xl font-bold">
                  {(smsTemplates.reduce((sum, t) => sum + t.successRate, 0) / smsTemplates.length).toFixed(1)}%
                </p>
              </div>
              <Phone className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>SMS 템플릿 목록</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="객실명, 템플릿명 검색..."
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
                  <TableHead>객실/템플릿</TableHead>
                  <TableHead>메시지 내용</TableHead>
                  <TableHead>발송 조건</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>통계</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{template.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{template.roomName}</span>
                        <span className="text-sm text-gray-600">{template.templateName}</span>
                        <div className="flex items-center gap-1 mt-1">
                          {getPriorityBadge(template.priority)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col max-w-md">
                        <p className="text-sm text-gray-800 line-clamp-2">
                          {template.messageContent}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{template.characterCount}자</span>
                          <span>₩{template.estimatedCost}</span>
                        </div>
                        {template.variables.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {template.variables.map((variable, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {variable}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {getSendTimingLabel(template.sendTiming)}
                        </div>
                        {template.sendTime && (
                          <span className="text-xs text-gray-500 mt-1">
                            {template.sendTime}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getCategoryBadge(template.category)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          <span>{template.sentCount.toLocaleString()}회</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          성공률 {template.successRate}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {template.isActive ? (
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
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openDialog(template)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Send className="w-4 h-4" />
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

          {filteredTemplates.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchQuery || categoryFilter !== 'all'
                ? '검색 조건에 맞는 템플릿이 없습니다.'
                : '등록된 템플릿이 없습니다.'
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? '템플릿 수정' : '새 템플릿 추가'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roomId">객실 선택</Label>
                <Select defaultValue={selectedTemplate?.roomId.toString()}>
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
                <Label htmlFor="templateName">템플릿명</Label>
                <Input
                  id="templateName"
                  placeholder="템플릿명을 입력하세요"
                  defaultValue={selectedTemplate?.templateName}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">카테고리</Label>
                <Select defaultValue={selectedTemplate?.category}>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome">환영 인사</SelectItem>
                    <SelectItem value="info">이용 안내</SelectItem>
                    <SelectItem value="access">출입 정보</SelectItem>
                    <SelectItem value="emergency">안전/응급</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">우선순위</Label>
                <Select defaultValue={selectedTemplate?.priority}>
                  <SelectTrigger>
                    <SelectValue placeholder="우선순위 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">높음</SelectItem>
                    <SelectItem value="normal">보통</SelectItem>
                    <SelectItem value="low">낮음</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="messageContent">메시지 내용</Label>
              <Textarea
                id="messageContent"
                placeholder="SMS 메시지 내용을 입력하세요. {고객명}, {숙소주소} 등의 변수를 사용할 수 있습니다."
                defaultValue={selectedTemplate?.messageContent}
                rows={4}
                className="resize-none"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>변수: {`{고객명}, {숙소주소}, {출입번호}, {연락처}, {와이파이정보}`}</span>
                <span>0/90자 (예상비용: ₩0)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sendTiming">발송 시점</Label>
                <Select defaultValue={selectedTemplate?.sendTiming}>
                  <SelectTrigger>
                    <SelectValue placeholder="발송 시점 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {sendTimingOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sendTime">발송 시간</Label>
                <Input
                  id="sendTime"
                  type="time"
                  defaultValue={selectedTemplate?.sendTime}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch id="isActive" defaultChecked={selectedTemplate?.isActive ?? true} />
                <Label htmlFor="isActive">활성화</Label>
              </div>
              <Button variant="outline">
                <Send className="w-4 h-4 mr-2" />
                테스트 발송
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeDialog}>
                취소
              </Button>
              <Button onClick={closeDialog}>
                {selectedTemplate ? '수정 완료' : '추가 완료'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}