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
  LogOut,
  Phone,
  Eye,
  EyeOff,
  Send,
  Star
} from 'lucide-react'

interface CheckOutSMS {
  id: number
  roomId: number
  roomName: string
  templateName: string
  messageContent: string
  sendTiming: 'before_checkout' | 'checkout_time' | 'after_checkout' | 'manual'
  sendTime?: string
  isActive: boolean
  variables: string[]
  category: 'thanks' | 'checklist' | 'review' | 'penalty'
  priority: 'high' | 'normal' | 'low'
  characterCount: number
  estimatedCost: number
  sentCount: number
  successRate: number
  createdAt: string
  updatedAt: string
}

export default function CheckOutSMSPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<CheckOutSMS | null>(null)

  // Mock data
  const smsTemplates: CheckOutSMS[] = [
    {
      id: 1,
      roomId: 1,
      roomName: '구공스테이 청주 본디',
      templateName: '퇴실 감사 인사',
      messageContent: '[구공스테이 청주] {고객명}님, 즐거운 시간 보내셨나요? 23:00까지 퇴실 부탁드립니다. 쓰레기 분리수거와 정리정돈 부탁드려요. 다음에도 찾아주세요! 감사합니다.',
      sendTiming: 'before_checkout',
      sendTime: '22:00',
      isActive: true,
      variables: ['고객명'],
      category: 'thanks',
      priority: 'high',
      characterCount: 95,
      estimatedCost: 19,
      sentCount: 234,
      successRate: 98.7,
      createdAt: '2025-01-15',
      updatedAt: '2025-08-15'
    },
    {
      id: 2,
      roomId: 1,
      roomName: '구공스테이 청주 본디',
      templateName: '퇴실 체크리스트',
      messageContent: '[구공스테이] 퇴실 전 체크사항: ✓ 쓰레기 분리수거 ✓ 에어컨/난방 OFF ✓ 수영장 정리 ✓ 문단속. 확인 후 퇴실 부탁드립니다. 감사합니다!',
      sendTiming: 'checkout_time',
      sendTime: '22:30',
      isActive: true,
      variables: [],
      category: 'checklist',
      priority: 'high',
      characterCount: 89,
      estimatedCost: 18,
      sentCount: 234,
      successRate: 97.4,
      createdAt: '2025-01-15',
      updatedAt: '2025-08-10'
    },
    {
      id: 3,
      roomId: 2,
      roomName: '구공스테이 소소한옥',
      templateName: '한옥 퇴실 안내',
      messageContent: '[구공스테이 소소한옥] {고객명}님 한옥에서의 특별한 시간이 어떠셨나요? 전통찻잔은 싱크대에, 방문은 꼭 잠가주세요. 또 뵙겠습니다. 감사합니다.',
      sendTiming: 'before_checkout',
      sendTime: '21:30',
      isActive: true,
      variables: ['고객명'],
      category: 'thanks',
      priority: 'normal',
      characterCount: 87,
      estimatedCost: 17,
      sentCount: 145,
      successRate: 99.3,
      createdAt: '2025-02-01',
      updatedAt: '2025-08-12'
    },
    {
      id: 4,
      roomId: 3,
      roomName: '구공스테이 옥천 키즈',
      templateName: '키즈 안전 퇴실',
      messageContent: '[구공스테이 키즈] 아이들과 즐거운 시간 되셨나요? 장난감 정리, 키즈풀 안전펜스 확인 부탁드립니다. 안전하게 귀가하세요! 리뷰 작성 부탁드려요 ⭐',
      sendTiming: 'checkout_time',
      sendTime: '22:00',
      isActive: true,
      variables: [],
      category: 'review',
      priority: 'normal',
      characterCount: 95,
      estimatedCost: 19,
      sentCount: 78,
      successRate: 98.7,
      createdAt: '2025-03-01',
      updatedAt: '2025-08-20'
    },
    {
      id: 5,
      roomId: 4,
      roomName: '구공스테이 사천 안토이비토',
      templateName: '오션뷰 퇴실 인사',
      messageContent: '[구공스테이 사천] 바다 전망과 함께한 시간이 기억에 남으시길! 온수풀 덮개 덮기, 바베큐 그릴 정리 확인 부탁드립니다. 안전한 귀가 되세요.',
      sendTiming: 'before_checkout',
      sendTime: '21:00',
      isActive: false,
      variables: [],
      category: 'checklist',
      priority: 'normal',
      characterCount: 89,
      estimatedCost: 18,
      sentCount: 18,
      successRate: 94.4,
      createdAt: '2025-04-01',
      updatedAt: '2025-08-25'
    },
    {
      id: 6,
      roomId: 5,
      roomName: '구공스테이 남해 디풀&애견',
      templateName: '반려견 퇴실 안내',
      messageContent: '[구공스테이 남해] 반려견과 함께한 특별한 시간! 반려견 털 청소, 배변봉투 수거 확인 부탁드립니다. 다음에도 함께 와주세요! 🐕',
      sendTiming: 'checkout_time',
      sendTime: '22:15',
      isActive: true,
      variables: [],
      category: 'checklist',
      priority: 'high',
      characterCount: 86,
      estimatedCost: 17,
      sentCount: 52,
      successRate: 96.2,
      createdAt: '2025-05-01',
      updatedAt: '2025-08-12'
    }
  ]

  const categories = [
    { value: 'all', label: '전체' },
    { value: 'thanks', label: '감사 인사' },
    { value: 'checklist', label: '퇴실 체크리스트' },
    { value: 'review', label: '리뷰 요청' },
    { value: 'penalty', label: '위약금/패널티' }
  ]

  const sendTimingOptions = [
    { value: 'before_checkout', label: '퇴실 1시간 전' },
    { value: 'checkout_time', label: '퇴실 시간' },
    { value: 'after_checkout', label: '퇴실 후' },
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
      thanks: 'bg-blue-100 text-blue-800',
      checklist: 'bg-yellow-100 text-yellow-800',
      review: 'bg-green-100 text-green-800',
      penalty: 'bg-red-100 text-red-800'
    }
    
    const labels = {
      thanks: '감사',
      checklist: '체크',
      review: '리뷰',
      penalty: '패널티'
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
      before_checkout: '퇴실전',
      checkout_time: '퇴실시',
      after_checkout: '퇴실후',
      manual: '수동'
    }
    
    return labels[timing as keyof typeof labels] || timing
  }

  const openDialog = (template?: CheckOutSMS) => {
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
          <h1 className="text-2xl font-bold text-gray-900">퇴실 안내문자 관리</h1>
          <p className="text-gray-600">객실별 퇴실 안내 문자 템플릿을 관리합니다.</p>
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
              <LogOut className="w-8 h-8 text-purple-500" />
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
                          <LogOut className="w-3 h-3 text-gray-400" />
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
                    <SelectItem value="thanks">감사 인사</SelectItem>
                    <SelectItem value="checklist">퇴실 체크리스트</SelectItem>
                    <SelectItem value="review">리뷰 요청</SelectItem>
                    <SelectItem value="penalty">위약금/패널티</SelectItem>
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
                placeholder="SMS 메시지 내용을 입력하세요. {고객명}, {예약번호} 등의 변수를 사용할 수 있습니다."
                defaultValue={selectedTemplate?.messageContent}
                rows={4}
                className="resize-none"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>변수: {`{고객명}, {예약번호}, {연락처}, {퇴실시간}`}</span>
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