'use client'

import { useState, useEffect } from 'react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Filter,
  Download,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard
} from 'lucide-react'

interface Settlement {
  id: string
  hostName: string
  period: string
  reservationCount: number
  totalRevenue: number
  platformFee: number
  netAmount: number
  feeRate: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  settlementDate?: string
  createdAt: string
}

export default function AdminSettlementPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')

  // 임시 목업 데이터 (토스 PG 연동 후 실제 API로 교체 예정)
  useEffect(() => {
    const mockSettlements: Settlement[] = [
      {
        id: 'SETT001',
        hostName: '구공스테이 청주',
        period: '2025-08',
        reservationCount: 24,
        totalRevenue: 4800000,
        platformFee: 240000,
        netAmount: 4560000,
        feeRate: 5.0,
        status: 'completed',
        settlementDate: '2025-09-05',
        createdAt: '2025-09-01T00:00:00Z'
      },
      {
        id: 'SETT002',
        hostName: '구공스테이 도고',
        period: '2025-08',
        reservationCount: 18,
        totalRevenue: 3600000,
        platformFee: 180000,
        netAmount: 3420000,
        feeRate: 5.0,
        status: 'processing',
        createdAt: '2025-09-01T00:00:00Z'
      },
      {
        id: 'SETT003',
        hostName: '청평오늘하루',
        period: '2025-08',
        reservationCount: 32,
        totalRevenue: 6400000,
        platformFee: 320000,
        netAmount: 6080000,
        feeRate: 5.0,
        status: 'pending',
        createdAt: '2025-09-01T00:00:00Z'
      },
      {
        id: 'SETT004',
        hostName: '구공스테이 북면',
        period: '2025-08',
        reservationCount: 15,
        totalRevenue: 3000000,
        platformFee: 150000,
        netAmount: 2850000,
        feeRate: 5.0,
        status: 'pending',
        createdAt: '2025-09-01T00:00:00Z'
      }
    ]

    setTimeout(() => {
      setSettlements(mockSettlements)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredSettlements = settlements.filter(settlement => {
    const matchesSearch = settlement.hostName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         settlement.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || settlement.status === statusFilter
    const matchesPeriod = periodFilter === 'all' || settlement.period === periodFilter
    
    return matchesSearch && matchesStatus && matchesPeriod
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3 mr-1" />, label: '대기중' },
      processing: { color: 'bg-blue-100 text-blue-800', icon: <AlertCircle className="w-3 h-3 mr-1" />, label: '처리중' },
      completed: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3 mr-1" />, label: '완료' },
      failed: { color: 'bg-red-100 text-red-800', icon: <AlertCircle className="w-3 h-3 mr-1" />, label: '실패' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return <Badge>Unknown</Badge>
    
    return (
      <Badge className={config.color}>
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  // 통계 계산
  const totalRevenue = filteredSettlements.reduce((sum, s) => sum + s.totalRevenue, 0)
  const totalPlatformFee = filteredSettlements.reduce((sum, s) => sum + s.platformFee, 0)
  const totalReservations = filteredSettlements.reduce((sum, s) => sum + s.reservationCount, 0)
  const completedSettlements = filteredSettlements.filter(s => s.status === 'completed').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">정산 리포트</h1>
          <p className="text-gray-600">호스트별 정산 현황 및 수수료 관리</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            정산 생성
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            엑셀 다운로드
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 매출</p>
                <p className="text-2xl font-bold">₩{totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">플랫폼 수수료</p>
                <p className="text-2xl font-bold text-blue-600">₩{totalPlatformFee.toLocaleString()}</p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 예약</p>
                <p className="text-2xl font-bold">{totalReservations}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">정산 완료</p>
                <p className="text-2xl font-bold text-green-600">{completedSettlements}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>정산 목록</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="호스트명 또는 정산ID 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="pending">대기중</SelectItem>
                  <SelectItem value="processing">처리중</SelectItem>
                  <SelectItem value="completed">완료</SelectItem>
                  <SelectItem value="failed">실패</SelectItem>
                </SelectContent>
              </Select>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="기간" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="all">전체 기간</SelectItem>
                  <SelectItem value="2025-08">2025년 8월</SelectItem>
                  <SelectItem value="2025-07">2025년 7월</SelectItem>
                  <SelectItem value="2025-06">2025년 6월</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-gray-200 bg-white">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">로딩 중...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>정산ID</TableHead>
                      <TableHead>호스트명</TableHead>
                      <TableHead>정산 기간</TableHead>
                      <TableHead>예약 건수</TableHead>
                      <TableHead>총 매출</TableHead>
                      <TableHead>플랫폼 수수료</TableHead>
                      <TableHead>정산 금액</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>정산일</TableHead>
                      <TableHead>관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSettlements.map((settlement) => (
                      <TableRow key={settlement.id} className="hover:bg-gray-50">
                        <TableCell className="font-mono">{settlement.id}</TableCell>
                        <TableCell className="font-medium">{settlement.hostName}</TableCell>
                        <TableCell>{settlement.period}</TableCell>
                        <TableCell>{settlement.reservationCount}건</TableCell>
                        <TableCell className="font-medium">₩{settlement.totalRevenue.toLocaleString()}</TableCell>
                        <TableCell className="text-blue-600">
                          ₩{settlement.platformFee.toLocaleString()} ({settlement.feeRate}%)
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          ₩{settlement.netAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(settlement.status)}</TableCell>
                        <TableCell>
                          {settlement.settlementDate 
                            ? new Date(settlement.settlementDate).toLocaleDateString('ko-KR')
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {settlement.status === 'pending' && (
                              <Button size="sm" variant="outline" className="text-blue-600 border-blue-600">
                                승인
                              </Button>
                            )}
                            <Button size="sm" variant="ghost">
                              상세
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {!loading && filteredSettlements.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                검색 조건에 맞는 정산 내역이 없습니다.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 주의사항 */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800 mb-1">개발 안내</h3>
              <p className="text-sm text-yellow-700">
                현재 표시되는 데이터는 목업 데이터입니다. 토스페이먼츠 PG 연동이 완료되면 실제 결제 데이터와 연동하여 정산 기능이 활성화됩니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}