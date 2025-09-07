'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Trash2, Settings, Search, Tag } from 'lucide-react'

interface DiscountCode {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed_amount'
  discount_value: number
  description: string
  max_uses?: number
  current_uses: number
  valid_from: string
  valid_until?: string
  is_active: boolean
  created_at: string
}

interface AccommodationCodeAssignment {
  id: string
  accommodation_id: string
  discount_code_id: string
  is_active: boolean
  accommodation: {
    id: string
    name: string
    accommodation_type: string
    region: string
  }
  discount_code: DiscountCode
}

interface Accommodation {
  id: string
  name: string
  accommodation_type: string
  region: string
  status: string
}

export default function DiscountCodesPage() {
  const supabase = createClient()
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([])
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [codeAssignments, setCodeAssignments] = useState<AccommodationCodeAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedCode, setSelectedCode] = useState<DiscountCode | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [newCode, setNewCode] = useState({
    code: '',
    discount_value: 5,
    description: '',
    max_uses: undefined as number | undefined,
    valid_until: ''
  })

  // Mock data
  const mockDiscountCodes: DiscountCode[] = [
    {
      id: '1',
      code: 'STAY5',
      discount_type: 'percentage',
      discount_value: 5,
      description: '5% 할인 코드',
      current_uses: 12,
      max_uses: 100,
      valid_from: '2024-01-01',
      valid_until: '2024-12-31',
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z'
    },
    {
      id: '2',
      code: 'STAY10',
      discount_type: 'percentage',
      discount_value: 10,
      description: '10% 할인 코드',
      current_uses: 8,
      max_uses: 50,
      valid_from: '2024-01-01',
      valid_until: '2024-12-31',
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z'
    },
    {
      id: '3',
      code: 'STAY15',
      discount_type: 'percentage',
      discount_value: 15,
      description: '15% 할인 코드',
      current_uses: 3,
      max_uses: 30,
      valid_from: '2024-01-01',
      valid_until: '2024-12-31',
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z'
    },
    {
      id: '4',
      code: 'STAY20',
      discount_type: 'percentage',
      discount_value: 20,
      description: '20% 할인 코드',
      current_uses: 1,
      max_uses: 20,
      valid_from: '2024-01-01',
      valid_until: '2024-12-31',
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z'
    }
  ]

  const mockAccommodations: Accommodation[] = [
    { id: '1', name: '구공스테이 청주점', accommodation_type: '독채', region: '충북 청주', status: 'active' },
    { id: '2', name: '구공스테이 서울점', accommodation_type: '펜션', region: '서울 강남', status: 'active' },
    { id: '3', name: '스테이 도고', accommodation_type: '풀빌라', region: '충남 아산', status: 'active' }
  ]

  const mockCodeAssignments: AccommodationCodeAssignment[] = [
    {
      id: '1',
      accommodation_id: '1',
      discount_code_id: '1',
      is_active: true,
      accommodation: mockAccommodations[0],
      discount_code: mockDiscountCodes[0]
    },
    {
      id: '2',
      accommodation_id: '1',
      discount_code_id: '2',
      is_active: true,
      accommodation: mockAccommodations[0],
      discount_code: mockDiscountCodes[1]
    },
    {
      id: '3',
      accommodation_id: '3',
      discount_code_id: '3',
      is_active: true,
      accommodation: mockAccommodations[2],
      discount_code: mockDiscountCodes[2]
    }
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load discount codes
      const { data: codesData, error: codesError } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false })

      // Load accommodations
      const { data: accData, error: accError } = await supabase
        .from('accommodations')
        .select('id, name, accommodation_type, region, status')
        .eq('status', 'active')

      // Load code assignments
      const { data: assignmentsData, error: assignError } = await supabase
        .from('accommodation_discount_codes')
        .select(`
          *,
          accommodation:accommodations(id, name, accommodation_type, region),
          discount_code:discount_codes(*)
        `)

      if (codesError || accError || assignError) {
        console.warn('Using mock data')
        setDiscountCodes(mockDiscountCodes)
        setAccommodations(mockAccommodations)
        setCodeAssignments(mockCodeAssignments)
      } else {
        setDiscountCodes(codesData || [])
        setAccommodations(accData || [])
        setCodeAssignments(assignmentsData || [])
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error)
      setDiscountCodes(mockDiscountCodes)
      setAccommodations(mockAccommodations)
      setCodeAssignments(mockCodeAssignments)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCode = async () => {
    try {
      const codeData = {
        code: newCode.code.toUpperCase(),
        discount_type: 'percentage',
        discount_value: newCode.discount_value,
        description: newCode.description,
        max_uses: newCode.max_uses,
        current_uses: 0,
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: newCode.valid_until || null,
        is_active: true
      }

      const { error } = await supabase
        .from('discount_codes')
        .insert(codeData)

      if (error) throw error

      // Mock creation for demo
      const newCodeData: DiscountCode = {
        id: `new-${Date.now()}`,
        ...codeData,
        created_at: new Date().toISOString()
      }

      setDiscountCodes(prev => [newCodeData, ...prev])
      setShowCreateModal(false)
      setNewCode({
        code: '',
        discount_value: 5,
        description: '',
        max_uses: undefined,
        valid_until: ''
      })
      
    } catch (error) {
      console.error('코드 생성 실패:', error)
      alert('코드 생성에 실패했습니다.')
    }
  }

  const handleToggleCodeForAccommodation = async (accommodationId: string, codeId: string, isActive: boolean) => {
    try {
      if (isActive) {
        // Add assignment
        const { error } = await supabase
          .from('accommodation_discount_codes')
          .insert({
            accommodation_id: accommodationId,
            discount_code_id: codeId,
            is_active: true
          })

        if (error) throw error

        // Mock assignment for demo
        const accommodation = accommodations.find(acc => acc.id === accommodationId)
        const discountCode = discountCodes.find(code => code.id === codeId)
        
        if (accommodation && discountCode) {
          const newAssignment: AccommodationCodeAssignment = {
            id: `new-${Date.now()}`,
            accommodation_id: accommodationId,
            discount_code_id: codeId,
            is_active: true,
            accommodation,
            discount_code: discountCode
          }
          setCodeAssignments(prev => [...prev, newAssignment])
        }
      } else {
        // Remove assignment
        const { error } = await supabase
          .from('accommodation_discount_codes')
          .delete()
          .eq('accommodation_id', accommodationId)
          .eq('discount_code_id', codeId)

        if (error) throw error

        setCodeAssignments(prev => 
          prev.filter(assignment => 
            !(assignment.accommodation_id === accommodationId && assignment.discount_code_id === codeId)
          )
        )
      }
    } catch (error) {
      console.error('코드 할당 실패:', error)
      alert('코드 할당에 실패했습니다.')
    }
  }

  const isCodeAssignedToAccommodation = (accommodationId: string, codeId: string) => {
    return codeAssignments.some(
      assignment => assignment.accommodation_id === accommodationId && 
                   assignment.discount_code_id === codeId && 
                   assignment.is_active
    )
  }

  const getCodeUsageColor = (currentUses: number, maxUses: number | undefined) => {
    if (!maxUses) return 'text-gray-600'
    const percentage = (currentUses / maxUses) * 100
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 70) return 'text-orange-600'
    return 'text-green-600'
  }

  const filteredCodes = discountCodes.filter(code =>
    code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    code.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">할인 코드 관리</h1>
          <p className="text-gray-600">개별 협의 기반 할인 코드 시스템</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          새 코드 생성
        </Button>
      </div>

      {/* 검색 */}
      <Card>
        <CardHeader>
          <CardTitle>코드 검색</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="코드명 또는 설명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 할인 코드 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>할인 코드 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>코드</TableHead>
                    <TableHead>할인율</TableHead>
                    <TableHead>설명</TableHead>
                    <TableHead>사용 현황</TableHead>
                    <TableHead>활성화된 숙소</TableHead>
                    <TableHead>유효기간</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCodes.map((code) => {
                    const assignedAccommodations = codeAssignments.filter(
                      assignment => assignment.discount_code_id === code.id && assignment.is_active
                    )
                    
                    return (
                      <TableRow key={code.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-blue-600" />
                            <span className="font-mono font-bold">{code.code}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{code.discount_value}%</Badge>
                        </TableCell>
                        <TableCell>{code.description}</TableCell>
                        <TableCell>
                          <span className={getCodeUsageColor(code.current_uses, code.max_uses)}>
                            {code.current_uses}{code.max_uses ? ` / ${code.max_uses}` : ''}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {assignedAccommodations.slice(0, 2).map((assignment) => (
                              <Badge key={assignment.id} variant="secondary" className="text-xs">
                                {assignment.accommodation.name}
                              </Badge>
                            ))}
                            {assignedAccommodations.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{assignedAccommodations.length - 2}
                              </Badge>
                            )}
                            {assignedAccommodations.length === 0 && (
                              <span className="text-gray-400 text-sm">미할당</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {code.valid_until ? 
                            new Date(code.valid_until).toLocaleDateString('ko-KR') : 
                            '무제한'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant={code.is_active ? 'default' : 'secondary'}>
                            {code.is_active ? '활성' : '비활성'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 justify-end">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                setSelectedCode(code)
                                setShowAssignModal(true)
                              }}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 코드 생성 모달 */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 할인 코드 생성</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="code">코드명</Label>
              <Input
                id="code"
                value={newCode.code}
                onChange={(e) => setNewCode(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="STAY25"
                className="font-mono"
              />
            </div>
            
            <div>
              <Label htmlFor="discount_value">할인율 (%)</Label>
              <Select 
                value={newCode.discount_value.toString()}
                onValueChange={(value) => setNewCode(prev => ({ ...prev, discount_value: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="15">15%</SelectItem>
                  <SelectItem value="20">20%</SelectItem>
                  <SelectItem value="25">25%</SelectItem>
                  <SelectItem value="30">30%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={newCode.description}
                onChange={(e) => setNewCode(prev => ({ ...prev, description: e.target.value }))}
                placeholder="코드 설명을 입력하세요"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="max_uses">최대 사용 횟수 (선택사항)</Label>
              <Input
                id="max_uses"
                type="number"
                value={newCode.max_uses || ''}
                onChange={(e) => setNewCode(prev => ({ ...prev, max_uses: e.target.value ? parseInt(e.target.value) : undefined }))}
                placeholder="무제한"
              />
            </div>
            
            <div>
              <Label htmlFor="valid_until">유효기간 (선택사항)</Label>
              <Input
                id="valid_until"
                type="date"
                value={newCode.valid_until}
                onChange={(e) => setNewCode(prev => ({ ...prev, valid_until: e.target.value }))}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                취소
              </Button>
              <Button onClick={handleCreateCode} disabled={!newCode.code || !newCode.description}>
                생성
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 숙소별 코드 할당 모달 */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCode?.code} 코드 할당 관리
            </DialogTitle>
            <p className="text-sm text-gray-600">
              이 코드를 사용할 수 있는 숙소를 선택하세요
            </p>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {accommodations.map((accommodation) => (
              <div key={accommodation.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{accommodation.name}</div>
                  <div className="text-sm text-gray-500">
                    {accommodation.accommodation_type} • {accommodation.region}
                  </div>
                </div>
                
                <Checkbox
                  checked={selectedCode ? isCodeAssignedToAccommodation(accommodation.id, selectedCode.id) : false}
                  onCheckedChange={(checked) => {
                    if (selectedCode) {
                      handleToggleCodeForAccommodation(accommodation.id, selectedCode.id, checked as boolean)
                    }
                  }}
                />
              </div>
            ))}
          </div>
          
          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowAssignModal(false)}>
              완료
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}