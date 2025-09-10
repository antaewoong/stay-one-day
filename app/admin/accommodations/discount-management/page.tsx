'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Building2,
  Percent,
  Calendar,
  Users,
  Check,
  X,
  AlertCircle,
  Tag
} from 'lucide-react'

interface DiscountCode {
  id: string
  code: string
  name: string
  type: 'percentage' | 'fixed'
  value: number
  minAmount?: number
  maxDiscount?: number
  startDate: string
  endDate: string
  maxUses?: number
  currentUses: number
  isActive: boolean
  description: string
  createdAt: string
}

interface Accommodation {
  id: string
  name: string
  host_name: string
  base_price: number
  region: string
  status: string
}

interface AccommodationDiscount {
  id: string
  accommodation_id: string
  discount_code_id: string
  is_active: boolean
  applied_at: string
  accommodation: Accommodation
  discount_code: DiscountCode
}

export default function DiscountManagementPage() {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([])
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [accommodationDiscounts, setAccommodationDiscounts] = useState<AccommodationDiscount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'codes' | 'applications'>('codes')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedCodeId, setSelectedCodeId] = useState('')

  // 새 할인코드 폼
  const [newCode, setNewCode] = useState({
    code: '',
    name: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    minAmount: 0,
    maxDiscount: 0,
    startDate: '',
    endDate: '',
    maxUses: 0,
    description: ''
  })

  // 목업 데이터 로드
  useEffect(() => {
    const mockDiscountCodes: DiscountCode[] = [
      {
        id: 'DC001',
        code: 'WELCOME10',
        name: '신규 고객 10% 할인',
        type: 'percentage',
        value: 10,
        minAmount: 50000,
        maxDiscount: 20000,
        startDate: '2025-09-01',
        endDate: '2025-12-31',
        maxUses: 1000,
        currentUses: 245,
        isActive: true,
        description: '신규 고객을 위한 10% 할인 코드 (최대 2만원)',
        createdAt: '2025-09-01T00:00:00Z'
      },
      {
        id: 'DC002',
        code: 'SUMMER2025',
        name: '여름 시즌 특가',
        type: 'fixed',
        value: 15000,
        minAmount: 80000,
        startDate: '2025-06-01',
        endDate: '2025-08-31',
        maxUses: 500,
        currentUses: 342,
        isActive: false,
        description: '여름 시즌 15,000원 할인',
        createdAt: '2025-06-01T00:00:00Z'
      }
    ]

    const mockAccommodations: Accommodation[] = [
      {
        id: 'acc1',
        name: '구공스테이 청주점',
        host_name: '김호스트',
        base_price: 120000,
        region: '충북',
        status: 'active'
      },
      {
        id: 'acc2', 
        name: '구공스테이 도고점',
        host_name: '이호스트',
        base_price: 150000,
        region: '충남',
        status: 'active'
      }
    ]

    const mockAccommodationDiscounts: AccommodationDiscount[] = [
      {
        id: 'ad1',
        accommodation_id: 'acc1',
        discount_code_id: 'DC001',
        is_active: true,
        applied_at: '2025-09-05T00:00:00Z',
        accommodation: mockAccommodations[0],
        discount_code: mockDiscountCodes[0]
      },
      {
        id: 'ad2',
        accommodation_id: 'acc2',
        discount_code_id: 'DC001',
        is_active: false,
        applied_at: '2025-09-03T00:00:00Z',
        accommodation: mockAccommodations[1],
        discount_code: mockDiscountCodes[0]
      }
    ]

    setTimeout(() => {
      setDiscountCodes(mockDiscountCodes)
      setAccommodations(mockAccommodations)
      setAccommodationDiscounts(mockAccommodationDiscounts)
      setLoading(false)
    }, 1000)
  }, [])

  const handleCreateCode = () => {
    if (!newCode.code || !newCode.name || !newCode.value) {
      alert('필수 항목을 모두 입력해주세요.')
      return
    }

    const discountCode: DiscountCode = {
      id: `DC${String(discountCodes.length + 1).padStart(3, '0')}`,
      ...newCode,
      currentUses: 0,
      isActive: true,
      createdAt: new Date().toISOString()
    }

    setDiscountCodes(prev => [...prev, discountCode])
    setNewCode({
      code: '',
      name: '',
      type: 'percentage',
      value: 0,
      minAmount: 0,
      maxDiscount: 0,
      startDate: '',
      endDate: '',
      maxUses: 0,
      description: ''
    })
    setIsCreateDialogOpen(false)
    alert('할인코드가 성공적으로 생성되었습니다.')
  }

  const handleAssignToAccommodation = (accommodationId: string) => {
    if (!selectedCodeId) return

    // 이미 같은 숙소에 같은 할인코드가 적용되어 있는지 확인
    const existingAssignment = accommodationDiscounts.find(
      ad => ad.accommodation_id === accommodationId && ad.discount_code_id === selectedCodeId
    )

    if (existingAssignment) {
      alert('이미 해당 숙소에 이 할인코드가 적용되어 있습니다.')
      return
    }

    const newAssignment: AccommodationDiscount = {
      id: `ad${accommodationDiscounts.length + 1}`,
      accommodation_id: accommodationId,
      discount_code_id: selectedCodeId,
      is_active: true,
      applied_at: new Date().toISOString(),
      accommodation: accommodations.find(acc => acc.id === accommodationId)!,
      discount_code: discountCodes.find(code => code.id === selectedCodeId)!
    }

    setAccommodationDiscounts(prev => [...prev, newAssignment])
    alert('할인코드가 숙소에 성공적으로 적용되었습니다.')
  }

  const toggleAssignmentStatus = (assignmentId: string) => {
    setAccommodationDiscounts(prev => prev.map(assignment => 
      assignment.id === assignmentId 
        ? { ...assignment, is_active: !assignment.is_active }
        : assignment
    ))
  }

  const removeAssignment = (assignmentId: string) => {
    if (confirm('정말로 이 할인코드 적용을 삭제하시겠습니까?')) {
      setAccommodationDiscounts(prev => prev.filter(assignment => assignment.id !== assignmentId))
      alert('할인코드 적용이 삭제되었습니다.')
    }
  }

  const toggleCodeStatus = (codeId: string) => {
    setDiscountCodes(prev => prev.map(code => 
      code.id === codeId ? { ...code, isActive: !code.isActive } : code
    ))
  }

  const getStatusBadge = (application: AccommodationDiscount) => {
    if (application.is_active) {
      return <Badge className="bg-green-100 text-green-800">적용 중</Badge>
    }
    return <Badge variant="outline" className="text-gray-600 border-gray-600">비활성</Badge>
  }

  const filteredCodes = discountCodes.filter(code =>
    code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    code.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredApplications = accommodationDiscounts.filter(app =>
    app.accommodation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.discount_code.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">로딩 중...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">숙소할인관리</h1>
          <p className="text-gray-600">할인코드 생성 및 숙소별 적용 관리</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                할인코드 생성
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>새 할인코드 생성</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="code">할인코드</Label>
                  <Input
                    id="code"
                    value={newCode.code}
                    onChange={(e) => setNewCode(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="예: WELCOME10"
                  />
                </div>
                <div>
                  <Label htmlFor="name">코드명</Label>
                  <Input
                    id="name"
                    value={newCode.name}
                    onChange={(e) => setNewCode(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="예: 신규 고객 10% 할인"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>할인 유형</Label>
                    <Select value={newCode.type} onValueChange={(value) => setNewCode(prev => ({ ...prev, type: value as 'percentage' | 'fixed' }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">퍼센트 할인</SelectItem>
                        <SelectItem value="fixed">정액 할인</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>할인값</Label>
                    <Input
                      type="number"
                      value={newCode.value}
                      onChange={(e) => setNewCode(prev => ({ ...prev, value: Number(e.target.value) }))}
                      placeholder={newCode.type === 'percentage' ? "10" : "15000"}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>최소 주문금액</Label>
                    <Input
                      type="number"
                      value={newCode.minAmount}
                      onChange={(e) => setNewCode(prev => ({ ...prev, minAmount: Number(e.target.value) }))}
                      placeholder="50000"
                    />
                  </div>
                  <div>
                    <Label>최대 할인금액</Label>
                    <Input
                      type="number"
                      value={newCode.maxDiscount}
                      onChange={(e) => setNewCode(prev => ({ ...prev, maxDiscount: Number(e.target.value) }))}
                      placeholder="20000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>시작일</Label>
                    <Input
                      type="date"
                      value={newCode.startDate}
                      onChange={(e) => setNewCode(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>종료일</Label>
                    <Input
                      type="date"
                      value={newCode.endDate}
                      onChange={(e) => setNewCode(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>최대 사용 횟수</Label>
                  <Input
                    type="number"
                    value={newCode.maxUses}
                    onChange={(e) => setNewCode(prev => ({ ...prev, maxUses: Number(e.target.value) }))}
                    placeholder="1000"
                  />
                </div>
                <div>
                  <Label>설명</Label>
                  <Textarea
                    value={newCode.description}
                    onChange={(e) => setNewCode(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="할인코드에 대한 설명을 입력하세요"
                  />
                </div>
                <Button onClick={handleCreateCode} className="w-full">
                  생성하기
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('codes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'codes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Tag className="w-4 h-4 inline mr-2" />
            할인코드 관리
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'applications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            숙소별 적용 현황
          </button>
        </nav>
      </div>

      {/* 검색 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={activeTab === 'codes' ? "할인코드명 또는 코드 검색..." : "숙소명 또는 할인코드 검색..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 할인코드 관리 탭 */}
      {activeTab === 'codes' && (
        <Card>
          <CardHeader>
            <CardTitle>할인코드 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>코드</TableHead>
                    <TableHead>코드명</TableHead>
                    <TableHead>할인값</TableHead>
                    <TableHead>사용 현황</TableHead>
                    <TableHead>기간</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-mono font-medium">{code.code}</TableCell>
                      <TableCell>{code.name}</TableCell>
                      <TableCell>
                        {code.type === 'percentage' ? `${code.value}%` : `₩${code.value.toLocaleString()}`}
                        {code.maxDiscount && code.type === 'percentage' && (
                          <div className="text-xs text-gray-500">최대 ₩{code.maxDiscount.toLocaleString()}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {code.currentUses} / {code.maxUses || '무제한'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(code.startDate).toLocaleDateString('ko-KR')} ~ 
                          <br />
                          {new Date(code.endDate).toLocaleDateString('ko-KR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={code.isActive}
                            onCheckedChange={() => toggleCodeStatus(code.id)}
                          />
                          <span className="text-sm">
                            {code.isActive ? '활성' : '비활성'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedCodeId(code.id)}
                              >
                                숙소 할당
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>숙소에 할인코드 할당</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>선택된 할인코드: <strong>{code.code}</strong></Label>
                                </div>
                                <div className="space-y-2">
                                  <Label>숙소 선택</Label>
                                  {accommodations.map((accommodation) => (
                                    <div key={accommodation.id} className="flex items-center justify-between p-3 border rounded-lg">
                                      <div>
                                        <div className="font-medium">{accommodation.name}</div>
                                        <div className="text-sm text-gray-500">
                                          호스트: {accommodation.host_name} | 기본가격: ₩{accommodation.base_price.toLocaleString()}
                                        </div>
                                      </div>
                                      <Button
                                        size="sm"
                                        onClick={() => handleAssignToAccommodation(accommodation.id)}
                                      >
                                        할당
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button size="sm" variant="ghost">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 숙소별 적용 현황 탭 */}
      {activeTab === 'applications' && (
        <Card>
          <CardHeader>
            <CardTitle>숙소별 할인코드 적용 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>숙소명</TableHead>
                    <TableHead>호스트</TableHead>
                    <TableHead>할인코드</TableHead>
                    <TableHead>할인값</TableHead>
                    <TableHead>적용일</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">{application.accommodation.name}</TableCell>
                      <TableCell>{application.accommodation.host_name}</TableCell>
                      <TableCell className="font-mono">{application.discount_code.code}</TableCell>
                      <TableCell>
                        {application.discount_code.type === 'percentage' 
                          ? `${application.discount_code.value}%` 
                          : `₩${application.discount_code.value.toLocaleString()}`}
                      </TableCell>
                      <TableCell>
                        {new Date(application.applied_at).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(application)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={application.is_active}
                              onCheckedChange={() => toggleAssignmentStatus(application.id)}
                            />
                            <span className="text-sm">
                              {application.is_active ? '활성' : '비활성'}
                            </span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => removeAssignment(application.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 안내사항 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800 mb-1">할인코드 적용 프로세스</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>1. 관리자가 할인코드를 생성합니다.</p>
                <p>2. 호스트와 오프라인 협의를 통해 할인코드 적용을 결정합니다.</p>
                <p>3. 관리자가 해당 숙소에 할인코드를 직접 적용합니다.</p>
                <p>4. 적용된 할인코드는 고객이 해당 숙소 예약 시 즉시 사용할 수 있습니다.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}