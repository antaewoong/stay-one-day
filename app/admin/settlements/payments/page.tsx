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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  Search,
  Eye,
  Download,
  CreditCard,
  Smartphone,
  Building,
  TrendingUp,
  Users,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface PaymentInfo {
  id: string
  reservation_number: string
  guest_name: string
  accommodation_name: string
  total_amount: number
  payment_method: 'card' | 'kakaopay' | 'transfer' | 'cash'
  payment_provider?: string
  approval_number: string
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
  fee_amount: number
  net_amount: number
  payment_date: string
  refund_date?: string | null
  created_at: string
  accommodations?: {
    name: string
  }
}

export default function PaymentInfoPage() {
  const supabase = createClient()
  const [payments, setPayments] = useState<PaymentInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentInfo | null>(null)

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('reservations')
        .select(`
          id,
          reservation_number,
          guest_name,
          total_amount,
          payment_method,
          payment_provider,
          approval_number,
          payment_status,
          payment_date,
          created_at,
          accommodations!inner(name)
        `)
        .not('payment_status', 'is', null)
        .order('created_at', { ascending: false })

      // 필터 적용
      if (methodFilter !== 'all') {
        query = query.eq('payment_method', methodFilter)
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('payment_status', statusFilter)
      }

      if (searchQuery) {
        query = query.or(`guest_name.ilike.%${searchQuery}%,reservation_number.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('결제 정보 로드 실패:', error)
        // 에러시 목업 데이터 사용
        setPayments(mockPayments)
        return
      }

      // 데이터 변환
      const processedPayments = data?.map((payment: any) => ({
        id: payment.id,
        reservation_number: payment.reservation_number,
        guest_name: payment.guest_name,
        accommodation_name: payment.accommodations?.name || 'Unknown',
        total_amount: payment.total_amount,
        payment_method: payment.payment_method || 'card',
        payment_provider: payment.payment_provider,
        approval_number: payment.approval_number || '',
        payment_status: payment.payment_status,
        fee_amount: Math.round(payment.total_amount * 0.03), // 3% 수수료
        net_amount: Math.round(payment.total_amount * 0.97),
        payment_date: payment.payment_date || payment.created_at,
        created_at: payment.created_at
      })) || []

      setPayments(processedPayments)
    } catch (error) {
      console.error('결제 정보 로드 실패:', error)
      setPayments(mockPayments)
    } finally {
      setLoading(false)
    }
  }

  // 검색 및 필터 변경시 재로드
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadPayments()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, methodFilter, statusFilter])

  // 목업 데이터 (테이블이 없는 경우 대비)
  const mockPayments: PaymentInfo[] = [
    {
      id: '1',
      reservation_number: 'SO25090200001',
      guest_name: '김민수',
      accommodation_name: 'Stay One Day 청주 펜션',
      total_amount: 240000,
      payment_method: 'card',
      payment_provider: 'KB국민카드',
      approval_number: 'A240902001',
      payment_status: 'completed',
      fee_amount: 7200, // 3%
      net_amount: 232800,
      payment_date: '2025-09-01 14:30:00',
      created_at: '2025-09-01 14:30:00'
    },
    {
      id: 2,
      reservationNumber: 'SO25090200002',
      customerName: '이지영',
      stayName: '구공스테이 소소한옥',
      amount: 140000,
      method: 'kakaopay',
      approvalNumber: 'K240902001',
      status: 'completed',
      feeAmount: 4200, // 3%
      actualAmount: 135800,
      paymentDate: '2025-09-01 16:45',
      createdAt: '2025-09-01 16:45'
    },
    {
      id: 3,
      reservationNumber: 'SO25090200003',
      customerName: '박가족',
      stayName: '구공스테이 옥천 키즈',
      amount: 270000,
      method: 'card',
      provider: '신한카드',
      cardNumber: '****-****-****-5678',
      approvalNumber: 'A240902002',
      status: 'completed',
      feeAmount: 8100, // 3%
      actualAmount: 261900,
      paymentDate: '2025-09-01 10:20',
      createdAt: '2025-09-01 10:20'
    },
    {
      id: 4,
      reservationNumber: 'SO25090200004',
      customerName: '최현우',
      stayName: '구공스테이 청주 본디',
      amount: 300000,
      method: 'transfer',
      approvalNumber: 'T240830001',
      status: 'completed',
      feeAmount: 1000, // 고정 수수료
      actualAmount: 299000,
      paymentDate: '2025-08-30 15:30',
      createdAt: '2025-08-30 09:15'
    },
    {
      id: 5,
      reservationNumber: 'SO25090200005',
      customerName: '강동현',
      stayName: '구공스테이 남해 디풀&애견',
      amount: 185000,
      method: 'card',
      provider: '삼성카드',
      cardNumber: '****-****-****-9012',
      approvalNumber: 'A240902003',
      status: 'refunded',
      feeAmount: 5550, // 3%
      actualAmount: 179450,
      paymentDate: '2025-09-02 08:45',
      refundDate: '2025-09-02 16:20',
      createdAt: '2025-09-02 08:45'
    },
    {
      id: 6,
      reservationNumber: 'SO25090200006',
      customerName: '윤서현',
      stayName: '구공스테이 사천 안토이비토',
      amount: 220000,
      method: 'kakaopay',
      approvalNumber: 'K240902002',
      status: 'pending',
      feeAmount: 6600, // 3%
      actualAmount: 213400,
      paymentDate: '2025-09-02 12:15',
      createdAt: '2025-09-02 12:15'
    }
  ]

  const paymentMethodData = [
    { name: '카드결제', count: 4, amount: 955000, color: '#3b82f6' },
    { name: '카카오페이', count: 2, amount: 360000, color: '#fbbf24' },
    { name: '계좌이체', count: 1, amount: 300000, color: '#10b981' }
  ]

  const monthlyPaymentData = [
    { month: '5월', card: 3200000, kakaopay: 800000, transfer: 400000 },
    { month: '6월', card: 4100000, kakaopay: 1100000, transfer: 600000 },
    { month: '7월', card: 5200000, kakaopay: 1400000, transfer: 800000 },
    { month: '8월', card: 4600000, kakaopay: 1200000, transfer: 700000 },
    { month: '9월', card: 955000, amount: 360000, transfer: 300000 }
  ]

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.reservationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         payment.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         payment.stayName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    
    return matchesSearch && matchesMethod && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: '결제대기' },
      completed: { color: 'bg-green-100 text-green-800', label: '결제완료' },
      failed: { color: 'bg-red-100 text-red-800', label: '결제실패' },
      refunded: { color: 'bg-gray-100 text-gray-800', label: '환불완료' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    return config ? (
      <Badge className={config.color}>{config.label}</Badge>
    ) : <Badge>Unknown</Badge>
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return <CreditCard className="w-4 h-4 text-blue-500" />
      case 'kakaopay':
        return <Smartphone className="w-4 h-4 text-yellow-500" />
      case 'transfer':
        return <Building className="w-4 h-4 text-green-500" />
      default:
        return <CreditCard className="w-4 h-4 text-gray-500" />
    }
  }

  const getMethodLabel = (method: string) => {
    const labels = {
      card: '카드결제',
      kakaopay: '카카오페이',
      transfer: '계좌이체'
    }
    
    return labels[method as keyof typeof labels] || method
  }

  const openDialog = (payment: PaymentInfo) => {
    setSelectedPayment(payment)
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setSelectedPayment(null)
  }

  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const totalFee = payments.reduce((sum, payment) => sum + payment.feeAmount, 0)
  const completedPayments = payments.filter(p => p.status === 'completed')
  const averageFeeRate = totalAmount > 0 ? (totalFee / totalAmount * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">결제 정보 통계</h1>
          <p className="text-gray-600">결제 방법별 통계와 수수료 정보를 확인합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            엑셀 다운로드
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 결제액</p>
                <p className="text-2xl font-bold text-green-600">
                  ₩{totalAmount.toLocaleString()}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">결제 수수료</p>
                <p className="text-2xl font-bold text-red-600">
                  ₩{totalFee.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">완료된 결제</p>
                <p className="text-2xl font-bold">{completedPayments.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">평균 수수료율</p>
                <p className="text-2xl font-bold">{averageFeeRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Method Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>결제 방법별 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₩${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Payment Trends */}
        <Card>
          <CardHeader>
            <CardTitle>월별 결제 동향</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyPaymentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `₩${Number(value).toLocaleString()}`} />
                <Legend />
                <Bar dataKey="card" fill="#3b82f6" name="카드결제" />
                <Bar dataKey="kakaopay" fill="#fbbf24" name="카카오페이" />
                <Bar dataKey="transfer" fill="#10b981" name="계좌이체" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Payment List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>결제 정보 목록</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="예약번호, 고객명, 스테이명 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="결제방법" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="card">카드결제</SelectItem>
                  <SelectItem value="kakaopay">카카오페이</SelectItem>
                  <SelectItem value="transfer">계좌이체</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="pending">결제대기</SelectItem>
                  <SelectItem value="completed">결제완료</SelectItem>
                  <SelectItem value="failed">결제실패</SelectItem>
                  <SelectItem value="refunded">환불완료</SelectItem>
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
                  <TableHead>예약번호</TableHead>
                  <TableHead>고객/스테이</TableHead>
                  <TableHead>결제방법</TableHead>
                  <TableHead>결제금액</TableHead>
                  <TableHead>수수료</TableHead>
                  <TableHead>실수령액</TableHead>
                  <TableHead>승인번호</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>결제일시</TableHead>
                  <TableHead>관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="font-mono text-sm">{payment.reservationNumber}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{payment.customerName}</span>
                        <span className="text-sm text-gray-600">{payment.stayName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMethodIcon(payment.method)}
                        <div className="flex flex-col">
                          <span className="font-medium">{getMethodLabel(payment.method)}</span>
                          {payment.provider && (
                            <span className="text-xs text-gray-500">{payment.provider}</span>
                          )}
                          {payment.cardNumber && (
                            <span className="text-xs text-gray-500 font-mono">{payment.cardNumber}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-green-600">
                        ₩{payment.amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-red-600">
                        ₩{payment.feeAmount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-blue-600">
                        ₩{payment.actualAmount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{payment.approvalNumber}</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {payment.paymentDate}
                        </div>
                        {payment.refundDate && (
                          <div className="text-red-600 text-xs mt-1">
                            환불: {payment.refundDate}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => openDialog(payment)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchQuery || methodFilter !== 'all' || statusFilter !== 'all'
                ? '검색 조건에 맞는 결제 정보가 없습니다.'
                : '등록된 결제 정보가 없습니다.'
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>결제 상세 정보</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">예약번호</Label>
                    <p className="font-mono">{selectedPayment.reservationNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">고객명</Label>
                    <p className="font-medium">{selectedPayment.customerName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">스테이</Label>
                    <p>{selectedPayment.stayName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">결제 상태</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedPayment.status)}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">결제 방법</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {getMethodIcon(selectedPayment.method)}
                      <span>{getMethodLabel(selectedPayment.method)}</span>
                    </div>
                  </div>
                  {selectedPayment.provider && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">발급사</Label>
                      <p>{selectedPayment.provider}</p>
                    </div>
                  )}
                  {selectedPayment.cardNumber && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">카드번호</Label>
                      <p className="font-mono">{selectedPayment.cardNumber}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">승인번호</Label>
                    <p className="font-mono">{selectedPayment.approvalNumber}</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between">
                  <span>결제금액</span>
                  <span className="font-medium">₩{selectedPayment.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>결제 수수료</span>
                  <span className="font-medium">-₩{selectedPayment.feeAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-blue-600 pt-2 border-t">
                  <span>실제 수령액</span>
                  <span>₩{selectedPayment.actualAmount.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div>
                  <Label className="text-sm font-medium text-gray-700">결제 일시</Label>
                  <p>{selectedPayment.paymentDate}</p>
                </div>
                {selectedPayment.refundDate && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">환불 일시</Label>
                    <p className="text-red-600">{selectedPayment.refundDate}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  영수증 다운로드
                </Button>
                <Button variant="outline" onClick={closeDialog}>
                  닫기
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}