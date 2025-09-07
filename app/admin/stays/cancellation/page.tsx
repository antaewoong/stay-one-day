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
  Trash2, 
  Save,
  Calendar,
  Percent,
  DollarSign,
  Clock
} from 'lucide-react'

interface CancellationPolicy {
  id: number
  stayName: string
  policyName: string
  conditions: {
    daysBeforeCheckIn: number
    cancellationFeeType: 'percentage' | 'fixed'
    cancellationFee: number
    refundRate: number
  }[]
  isDefault: boolean
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export default function CancellationPage() {
  const [selectedPolicy, setSelectedPolicy] = useState<CancellationPolicy | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Mock data - 취소 정책 데이터
  const cancellationPolicies: CancellationPolicy[] = [
    {
      id: 1,
      stayName: '구공스테이 청주 본디',
      policyName: '표준 취소 정책',
      conditions: [
        {
          daysBeforeCheckIn: 7,
          cancellationFeeType: 'percentage',
          cancellationFee: 0,
          refundRate: 100
        },
        {
          daysBeforeCheckIn: 3,
          cancellationFeeType: 'percentage',
          cancellationFee: 30,
          refundRate: 70
        },
        {
          daysBeforeCheckIn: 1,
          cancellationFeeType: 'percentage',
          cancellationFee: 50,
          refundRate: 50
        },
        {
          daysBeforeCheckIn: 0,
          cancellationFeeType: 'percentage',
          cancellationFee: 100,
          refundRate: 0
        }
      ],
      isDefault: true,
      status: 'active',
      createdAt: '2025-01-15',
      updatedAt: '2025-08-15'
    },
    {
      id: 2,
      stayName: '구공스테이 소소한옥',
      policyName: '프리미엄 취소 정책',
      conditions: [
        {
          daysBeforeCheckIn: 14,
          cancellationFeeType: 'percentage',
          cancellationFee: 0,
          refundRate: 100
        },
        {
          daysBeforeCheckIn: 7,
          cancellationFeeType: 'percentage',
          cancellationFee: 20,
          refundRate: 80
        },
        {
          daysBeforeCheckIn: 3,
          cancellationFeeType: 'percentage',
          cancellationFee: 50,
          refundRate: 50
        },
        {
          daysBeforeCheckIn: 0,
          cancellationFeeType: 'percentage',
          cancellationFee: 100,
          refundRate: 0
        }
      ],
      isDefault: false,
      status: 'active',
      createdAt: '2025-02-01',
      updatedAt: '2025-07-20'
    },
    {
      id: 3,
      stayName: '구공스테이 옥천 키즈',
      policyName: '키즈 전용 취소 정책',
      conditions: [
        {
          daysBeforeCheckIn: 5,
          cancellationFeeType: 'percentage',
          cancellationFee: 0,
          refundRate: 100
        },
        {
          daysBeforeCheckIn: 2,
          cancellationFeeType: 'fixed',
          cancellationFee: 30000,
          refundRate: 80
        },
        {
          daysBeforeCheckIn: 0,
          cancellationFeeType: 'percentage',
          cancellationFee: 70,
          refundRate: 30
        }
      ],
      isDefault: false,
      status: 'active',
      createdAt: '2025-03-01',
      updatedAt: '2025-08-05'
    },
    {
      id: 4,
      stayName: '구공스테이 사천 안토이비토',
      policyName: '성수기 취소 정책',
      conditions: [
        {
          daysBeforeCheckIn: 10,
          cancellationFeeType: 'percentage',
          cancellationFee: 10,
          refundRate: 90
        },
        {
          daysBeforeCheckIn: 5,
          cancellationFeeType: 'percentage',
          cancellationFee: 40,
          refundRate: 60
        },
        {
          daysBeforeCheckIn: 1,
          cancellationFeeType: 'percentage',
          cancellationFee: 80,
          refundRate: 20
        },
        {
          daysBeforeCheckIn: 0,
          cancellationFeeType: 'percentage',
          cancellationFee: 100,
          refundRate: 0
        }
      ],
      isDefault: false,
      status: 'inactive',
      createdAt: '2025-04-01',
      updatedAt: '2025-06-15'
    }
  ]

  const handleEditPolicy = (policy: CancellationPolicy) => {
    setSelectedPolicy(policy)
    setIsDialogOpen(true)
  }

  const handleSavePolicy = () => {
    console.log('Saving policy:', selectedPolicy)
    setIsDialogOpen(false)
    setSelectedPolicy(null)
  }

  const formatCancellationFee = (condition: any) => {
    if (condition.cancellationFeeType === 'percentage') {
      return `${condition.cancellationFee}%`
    } else {
      return `₩${condition.cancellationFee.toLocaleString()}`
    }
  }

  const getPolicyStatusBadge = (isDefault: boolean, status: string) => {
    if (isDefault) {
      return <Badge className="bg-blue-100 text-blue-800">기본정책</Badge>
    }
    return (
      <Badge className={status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
        {status === 'active' ? '활성' : '비활성'}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">스테이 취소 요금 관리</h1>
          <p className="text-gray-600">각 스테이별 예약 취소 정책과 환불 규정을 관리합니다.</p>
        </div>
        <Button onClick={() => {
          setSelectedPolicy(null)
          setIsDialogOpen(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          취소 정책 추가
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">전체 정책</p>
                <p className="text-2xl font-bold">{cancellationPolicies.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">활성 정책</p>
                <p className="text-2xl font-bold text-green-600">
                  {cancellationPolicies.filter(p => p.status === 'active').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">기본 정책</p>
                <p className="text-2xl font-bold">
                  {cancellationPolicies.filter(p => p.isDefault).length}
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
                <p className="text-sm text-gray-600">평균 환불율</p>
                <p className="text-2xl font-bold">65%</p>
              </div>
              <Percent className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>취소 정책 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>스테이명</TableHead>
                <TableHead>정책명</TableHead>
                <TableHead>취소 조건</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>최종 수정</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cancellationPolicies.map((policy) => (
                <TableRow key={policy.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{policy.id}</TableCell>
                  <TableCell className="font-medium">{policy.stayName}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{policy.policyName}</p>
                      <p className="text-sm text-gray-500">
                        {policy.conditions.length}개 조건
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {policy.conditions.slice(0, 3).map((condition, index) => (
                        <div key={index} className="text-xs bg-gray-50 rounded px-2 py-1">
                          {condition.daysBeforeCheckIn}일 전: {formatCancellationFee(condition)} 취소수수료
                        </div>
                      ))}
                      {policy.conditions.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{policy.conditions.length - 3}개 더...
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getPolicyStatusBadge(policy.isDefault, policy.status)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {policy.updatedAt}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEditPolicy(policy)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      {!policy.isDefault && (
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Policy Detail Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cancellationPolicies.filter(p => p.status === 'active').slice(0, 2).map((policy) => (
          <Card key={policy.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{policy.policyName}</CardTitle>
                {getPolicyStatusBadge(policy.isDefault, policy.status)}
              </div>
              <p className="text-sm text-gray-600">{policy.stayName}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {policy.conditions.map((condition, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">
                        {condition.daysBeforeCheckIn === 0 
                          ? '당일' 
                          : `${condition.daysBeforeCheckIn}일 전`
                        }
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">
                        취소수수료: {formatCancellationFee(condition)}
                      </p>
                      <p className="text-xs text-green-600">
                        환불: {condition.refundRate}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit/Add Policy Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPolicy ? '취소 정책 수정' : '새 취소 정책 추가'}
            </DialogTitle>
            <DialogDescription>
              예약 취소 시점에 따른 취소 수수료와 환불 정책을 설정합니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">스테이 선택</label>
                <Select defaultValue={selectedPolicy?.stayName}>
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
                <label className="text-sm font-medium mb-2 block">정책명</label>
                <Input 
                  placeholder="정책명을 입력하세요"
                  defaultValue={selectedPolicy?.policyName}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-4 block">취소 조건 설정</label>
              <div className="space-y-4">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="grid grid-cols-5 gap-4 p-4 border rounded-lg">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">체크인 전</label>
                      <div className="flex items-center gap-1">
                        <Input type="number" placeholder="0" className="text-sm" />
                        <span className="text-sm text-gray-500">일</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">수수료 타입</label>
                      <Select>
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">비율(%)</SelectItem>
                          <SelectItem value="fixed">고정금액</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">취소 수수료</label>
                      <Input type="number" placeholder="0" className="text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">환불율 (%)</label>
                      <Input type="number" placeholder="0" max="100" className="text-sm" />
                    </div>
                    <div className="flex items-end">
                      <Button variant="outline" size="sm" className="text-red-600">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="mt-2">
                <Plus className="w-4 h-4 mr-2" />
                조건 추가
              </Button>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t">
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  defaultChecked={selectedPolicy?.isDefault}
                  className="rounded"
                />
                <span className="text-sm font-medium">기본 정책으로 설정</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSavePolicy}>
              <Save className="w-4 h-4 mr-2" />
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}