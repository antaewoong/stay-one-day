'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Trash2, 
  Save,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban
} from 'lucide-react'

interface StayRule {
  id: number
  stayName: string
  category: 'checkin' | 'checkout' | 'usage' | 'facility' | 'safety' | 'penalty'
  title: string
  content: string
  isRequired: boolean
  penalty?: {
    amount: number
    description: string
  }
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export default function StayRulesPage() {
  const [selectedRule, setSelectedRule] = useState<StayRule | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Mock data - 스테이 규정 데이터
  const stayRules: StayRule[] = [
    {
      id: 1,
      stayName: '구공스테이 청주 본디',
      category: 'checkin',
      title: '체크인 시간 및 절차',
      content: `• 체크인 시간: 15:00~18:00
• 늦은 체크인 시 사전 연락 필수
• 신분증 지참 필수
• 인원 확인 후 입실 가능`,
      isRequired: true,
      status: 'active',
      createdAt: '2025-01-15',
      updatedAt: '2025-08-15'
    },
    {
      id: 2,
      stayName: '구공스테이 청주 본디',
      category: 'checkout',
      title: '체크아웃 및 정리',
      content: `• 체크아웃 시간: 23:00 엄수
• 쓰레기 분리수거 필수
• 사용한 그릇 세척 후 제자리
• 에어컨, 전등 소등 확인`,
      isRequired: true,
      status: 'active',
      createdAt: '2025-01-15',
      updatedAt: '2025-08-15'
    },
    {
      id: 3,
      stayName: '구공스테이 청주 본디',
      category: 'usage',
      title: '수영장 이용 규칙',
      content: `• 수영장 이용시간: 06:00~22:00
• 음주 후 수영 금지
• 어린이는 반드시 보호자 동반
• 수영장 주변 미끄러짐 주의`,
      isRequired: true,
      status: 'active',
      createdAt: '2025-01-15',
      updatedAt: '2025-08-15'
    },
    {
      id: 4,
      stayName: '구공스테이 청주 본디',
      category: 'facility',
      title: '바베큐 시설 이용',
      content: `• 바베큐 이용시간: 18:00~21:00
• 숯, 그릴 사용 후 정리 필수
• 화재 예방을 위한 안전 수칙 준수
• 기름때 제거 후 마무리`,
      isRequired: false,
      penalty: {
        amount: 50000,
        description: '청소비 추가 부과'
      },
      status: 'active',
      createdAt: '2025-01-20',
      updatedAt: '2025-08-10'
    },
    {
      id: 5,
      stayName: '구공스테이 소소한옥',
      category: 'safety',
      title: '한옥 이용 시 주의사항',
      content: `• 한옥 구조상 문턱 주의
• 전통 가구 손상 금지
• 실내에서 신발 착용 금지
• 화기 사용 시 각별한 주의`,
      isRequired: true,
      status: 'active',
      createdAt: '2025-02-01',
      updatedAt: '2025-07-15'
    },
    {
      id: 6,
      stayName: '구공스테이 옥천 키즈',
      category: 'safety',
      title: '어린이 안전 수칙',
      content: `• 놀이시설 이용 시 보호자 감독 필수
• 키즈풀장 이용 시간 제한 (09:00~20:00)
• 안전장비 착용 권장
• 위험 구역 출입 금지`,
      isRequired: true,
      status: 'active',
      createdAt: '2025-03-01',
      updatedAt: '2025-08-05'
    }
  ]

  const categories = [
    { value: 'all', label: '전체' },
    { value: 'checkin', label: '체크인' },
    { value: 'checkout', label: '체크아웃' },
    { value: 'usage', label: '이용규칙' },
    { value: 'facility', label: '시설이용' },
    { value: 'safety', label: '안전수칙' },
    { value: 'penalty', label: '위약금' }
  ]

  const filteredRules = stayRules.filter(rule => 
    categoryFilter === 'all' || rule.category === categoryFilter
  )

  const getCategoryBadge = (category: string) => {
    const categoryMap: { [key: string]: { label: string; color: string } } = {
      checkin: { label: '체크인', color: 'bg-blue-100 text-blue-800' },
      checkout: { label: '체크아웃', color: 'bg-green-100 text-green-800' },
      usage: { label: '이용규칙', color: 'bg-purple-100 text-purple-800' },
      facility: { label: '시설이용', color: 'bg-yellow-100 text-yellow-800' },
      safety: { label: '안전수칙', color: 'bg-red-100 text-red-800' },
      penalty: { label: '위약금', color: 'bg-orange-100 text-orange-800' }
    }
    
    const cat = categoryMap[category]
    return <Badge className={cat?.color || ''}>{cat?.label || category}</Badge>
  }

  const handleEditRule = (rule: StayRule) => {
    setSelectedRule(rule)
    setIsDialogOpen(true)
  }

  const handleSaveRule = () => {
    // 실제로는 API 호출이 들어갈 부분
    console.log('Saving rule:', selectedRule)
    setIsDialogOpen(false)
    setSelectedRule(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">스테이 규정 관리</h1>
          <p className="text-gray-600">각 스테이별 이용규칙과 주의사항을 관리합니다.</p>
        </div>
        <Button onClick={() => {
          setSelectedRule(null)
          setIsDialogOpen(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          규정 추가
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">전체 규정</p>
                <p className="text-2xl font-bold">{stayRules.length}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">필수 규정</p>
                <p className="text-2xl font-bold text-red-600">
                  {stayRules.filter(r => r.isRequired).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">위약금 규정</p>
                <p className="text-2xl font-bold">
                  {stayRules.filter(r => r.penalty).length}
                </p>
              </div>
              <Ban className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">활성 규정</p>
                <p className="text-2xl font-bold text-green-600">
                  {stayRules.filter(r => r.status === 'active').length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>규정 목록</CardTitle>
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
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>스테이</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>규정 제목</TableHead>
                <TableHead>필수여부</TableHead>
                <TableHead>위약금</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.map((rule) => (
                <TableRow key={rule.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{rule.id}</TableCell>
                  <TableCell className="font-medium">{rule.stayName}</TableCell>
                  <TableCell>{getCategoryBadge(rule.category)}</TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="font-medium truncate">{rule.title}</p>
                      <p className="text-sm text-gray-500 truncate">{rule.content}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {rule.isRequired ? (
                      <Badge className="bg-red-100 text-red-800">필수</Badge>
                    ) : (
                      <Badge variant="outline">선택</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {rule.penalty ? (
                      <div className="text-sm">
                        <p className="font-medium text-red-600">₩{rule.penalty.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{rule.penalty.description}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">없음</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={rule.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {rule.status === 'active' ? '활성' : '비활성'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEditRule(rule)}>
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
        </CardContent>
      </Card>

      {/* Edit/Add Rule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRule ? '규정 수정' : '새 규정 추가'}
            </DialogTitle>
            <DialogDescription>
              스테이 이용 규정을 추가하거나 수정합니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">스테이 선택</label>
                <Select defaultValue={selectedRule?.stayName}>
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
                <label className="text-sm font-medium mb-2 block">카테고리</label>
                <Select defaultValue={selectedRule?.category}>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.slice(1).map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">규정 제목</label>
              <Input 
                placeholder="규정 제목을 입력하세요"
                defaultValue={selectedRule?.title}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">규정 내용</label>
              <Textarea
                placeholder="상세한 규정 내용을 입력하세요"
                rows={6}
                defaultValue={selectedRule?.content}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  defaultChecked={selectedRule?.isRequired}
                  className="rounded"
                />
                <span className="text-sm font-medium">필수 규정</span>
              </label>
            </div>

            <div className="border-t pt-4">
              <label className="flex items-center gap-2 mb-4">
                <input type="checkbox" className="rounded" />
                <span className="text-sm font-medium">위약금 설정</span>
              </label>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">위약금 금액</label>
                  <Input 
                    type="number"
                    placeholder="0"
                    defaultValue={selectedRule?.penalty?.amount}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">위약금 설명</label>
                  <Input 
                    placeholder="위약금 부과 사유"
                    defaultValue={selectedRule?.penalty?.description}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveRule}>
              <Save className="w-4 h-4 mr-2" />
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}