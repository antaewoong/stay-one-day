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
  Download,
  TrendingUp,
  TrendingDown,
  CreditCard,
  DollarSign,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  BarChart3,
  PieChart
} from 'lucide-react'

interface PaymentStats {
  totalAmount: number
  totalCount: number
  successCount: number
  failedCount: number
  refundCount: number
  avgAmount: number
  cardPayments: number
  kakaoPayments: number
  tossPayments: number
  bankTransfers: number
}

interface Payment {
  id: string
  reservationNumber: string
  guestName: string
  amount: number
  method: 'card' | 'kakao_pay' | 'toss_pay' | 'bank_transfer'
  status: 'paid' | 'pending' | 'cancelled' | 'refunded' | 'partial_refund'
  transactionId?: string
  createdAt: string
  paidAt?: string
  refundedAt?: string
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats>({
    totalAmount: 0,
    totalCount: 0,
    successCount: 0,
    failedCount: 0,
    refundCount: 0,
    avgAmount: 0,
    cardPayments: 0,
    kakaoPayments: 0,
    tossPayments: 0,
    bankTransfers: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('today')

  // 임시 목업 데이터 (토스 PG 연동 후 실제 API로 교체 예정)
  useEffect(() => {
    const mockPayments: Payment[] = [
      {
        id: 'PAY001',
        reservationNumber: 'RES94645301',
        guestName: '김철수',
        amount: 250000,
        method: 'card',
        status: 'paid',
        transactionId: 'tx_abc123',
        createdAt: '2025-09-06T14:30:00Z',
        paidAt: '2025-09-06T14:30:15Z'
      },
      {
        id: 'PAY002',
        reservationNumber: 'RES94645402',
        guestName: '박영희',
        amount: 180000,
        method: 'kakao_pay',
        status: 'paid',
        transactionId: 'tx_def456',
        createdAt: '2025-09-06T16:45:00Z',
        paidAt: '2025-09-06T16:45:08Z'
      },
      {
        id: 'PAY003',
        reservationNumber: 'RES94645403',
        guestName: '이민수',
        amount: 320000,
        method: 'toss_pay',
        status: 'pending',
        transactionId: 'tx_ghi789',
        createdAt: '2025-09-06T18:20:00Z'
      },
      {
        id: 'PAY004',
        reservationNumber: 'RES94645404',
        guestName: '최현우',
        amount: 200000,
        method: 'card',
        status: 'refunded',
        transactionId: 'tx_jkl012',
        createdAt: '2025-09-05T10:15:00Z',
        paidAt: '2025-09-05T10:15:20Z',
        refundedAt: '2025-09-06T09:30:00Z'
      },
      {
        id: 'PAY005',
        reservationNumber: 'RES94645405',
        guestName: '강동현',
        amount: 185000,
        method: 'bank_transfer',
        status: 'cancelled',
        createdAt: '2025-09-06T20:00:00Z'
      }
    ]

    // 통계 계산
    const totalAmount = mockPayments.reduce((sum, p) => sum + p.amount, 0)
    const totalCount = mockPayments.length
    const successCount = mockPayments.filter(p => p.status === 'paid').length
    const failedCount = mockPayments.filter(p => p.status === 'cancelled').length
    const refundCount = mockPayments.filter(p => p.status === 'refunded').length
    const cardPayments = mockPayments.filter(p => p.method === 'card').length
    const kakaoPayments = mockPayments.filter(p => p.method === 'kakao_pay').length
    const tossPayments = mockPayments.filter(p => p.method === 'toss_pay').length
    const bankTransfers = mockPayments.filter(p => p.method === 'bank_transfer').length

    const mockStats: PaymentStats = {
      totalAmount,
      totalCount,
      successCount,
      failedCount,
      refundCount,
      avgAmount: totalCount > 0 ? Math.round(totalAmount / totalCount) : 0,
      cardPayments,
      kakaoPayments,
      tossPayments,
      bankTransfers
    }

    setTimeout(() => {
      setPayments(mockPayments)
      setStats(mockStats)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.reservationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         payment.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         payment.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter
    
    return matchesSearch && matchesStatus && matchesMethod
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3 mr-1" />, label: '결제완료' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3 mr-1" />, label: '결제대기' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3 mr-1" />, label: '결제취소' },
      refunded: { color: 'bg-gray-100 text-gray-800', icon: <AlertCircle className="w-3 h-3 mr-1" />, label: '환불완료' },
      partial_refund: { color: 'bg-orange-100 text-orange-800', icon: <AlertCircle className="w-3 h-3 mr-1" />, label: '부분환불' }
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

  const getMethodLabel = (method: string) => {
    const labels = {
      card: '카드결제',
      kakao_pay: '카카오페이',
      toss_pay: '토스페이',
      bank_transfer: '계좌이체'
    }
    return labels[method as keyof typeof labels] || method
  }

  const successRate = stats.totalCount > 0 ? (stats.successCount / stats.totalCount * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">결제 통계</h1>
          <p className="text-gray-600">결제 현황 및 통계 정보</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            차트 보기
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
                <p className="text-sm text-gray-600">총 결제금액</p>
                <p className="text-2xl font-bold">₩{stats.totalAmount.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">평균 ₩{stats.avgAmount.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">결제 성공률</p>
                <p className="text-2xl font-bold text-green-600">{successRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">{stats.successCount}/{stats.totalCount} 건</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">결제 실패</p>
                <p className="text-2xl font-bold text-red-600">{stats.failedCount}</p>
                <p className="text-xs text-gray-500 mt-1">취소/실패</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">환불</p>
                <p className="text-2xl font-bold text-orange-600">{stats.refundCount}</p>
                <p className="text-xs text-gray-500 mt-1">환불 처리</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 결제 방법 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              결제 방법별 분포
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">카드결제</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(stats.cardPayments / stats.totalCount * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{stats.cardPayments}건</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">카카오페이</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full" 
                      style={{ width: `${(stats.kakaoPayments / stats.totalCount * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{stats.kakaoPayments}건</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">토스페이</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(stats.tossPayments / stats.totalCount * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{stats.tossPayments}건</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">계좌이체</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(stats.bankTransfers / stats.totalCount * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{stats.bankTransfers}건</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              오늘의 결제 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">결제 완료</span>
                </div>
                <span className="text-lg font-bold text-green-600">{stats.successCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium">결제 대기</span>
                </div>
                <span className="text-lg font-bold text-yellow-600">
                  {payments.filter(p => p.status === 'pending').length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium">결제 실패</span>
                </div>
                <span className="text-lg font-bold text-red-600">{stats.failedCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 결제 목록 */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>결제 내역</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="예약번호, 게스트명 검색..."
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
                  <SelectItem value="paid">결제완료</SelectItem>
                  <SelectItem value="pending">결제대기</SelectItem>
                  <SelectItem value="cancelled">결제취소</SelectItem>
                  <SelectItem value="refunded">환불완료</SelectItem>
                </SelectContent>
              </Select>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="결제수단" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="all">전체 수단</SelectItem>
                  <SelectItem value="card">카드결제</SelectItem>
                  <SelectItem value="kakao_pay">카카오페이</SelectItem>
                  <SelectItem value="toss_pay">토스페이</SelectItem>
                  <SelectItem value="bank_transfer">계좌이체</SelectItem>
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
                      <TableHead>결제ID</TableHead>
                      <TableHead>예약번호</TableHead>
                      <TableHead>게스트명</TableHead>
                      <TableHead>결제금액</TableHead>
                      <TableHead>결제수단</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>거래ID</TableHead>
                      <TableHead>결제일시</TableHead>
                      <TableHead>관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.id} className="hover:bg-gray-50">
                        <TableCell className="font-mono">{payment.id}</TableCell>
                        <TableCell className="font-medium">{payment.reservationNumber}</TableCell>
                        <TableCell>{payment.guestName}</TableCell>
                        <TableCell className="font-medium">₩{payment.amount.toLocaleString()}</TableCell>
                        <TableCell>{getMethodLabel(payment.method)}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {payment.transactionId || '-'}
                        </TableCell>
                        <TableCell>
                          {payment.paidAt 
                            ? new Date(payment.paidAt).toLocaleString('ko-KR')
                            : payment.refundedAt
                            ? `환불: ${new Date(payment.refundedAt).toLocaleString('ko-KR')}`
                            : new Date(payment.createdAt).toLocaleString('ko-KR')
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {payment.status === 'paid' && (
                              <Button size="sm" variant="outline" className="text-red-600 border-red-600">
                                환불
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

            {!loading && filteredPayments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                검색 조건에 맞는 결제 내역이 없습니다.
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
                현재 표시되는 결제 데이터는 목업 데이터입니다. 토스페이먼츠 PG 연동이 완료되면 실제 결제 데이터와 연동하여 통계 및 관리 기능이 활성화됩니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}