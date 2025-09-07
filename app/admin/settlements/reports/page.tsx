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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  Calendar,
  Download,
  DollarSign,
  TrendingUp,
  Users,
  Building2,
  Filter,
  FileText,
  CreditCard,
  Percent,
  Eye
} from 'lucide-react'

interface SettlementReport {
  id: number
  period: string
  stayName: string
  totalRevenue: number
  platformFee: number
  netRevenue: number
  feeRate: number
  reservationCount: number
  averagePrice: number
  status: 'pending' | 'processing' | 'completed'
  settlementDate: string
  createdAt: string
}

export default function SettlementReportsPage() {
  const [periodFilter, setPeriodFilter] = useState<string>('month')
  const [stayFilter, setStayFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Mock data
  const reports: SettlementReport[] = [
    {
      id: 1,
      period: '2025년 8월',
      stayName: '구공스테이 청주 본디',
      totalRevenue: 4200000,
      platformFee: 210000,
      netRevenue: 3990000,
      feeRate: 5.0,
      reservationCount: 28,
      averagePrice: 150000,
      status: 'completed',
      settlementDate: '2025-09-01',
      createdAt: '2025-09-01'
    },
    {
      id: 2,
      period: '2025년 8월',
      stayName: '구공스테이 소소한옥',
      totalRevenue: 2800000,
      platformFee: 140000,
      netRevenue: 2660000,
      feeRate: 5.0,
      reservationCount: 20,
      averagePrice: 140000,
      status: 'completed',
      settlementDate: '2025-09-01',
      createdAt: '2025-09-01'
    },
    {
      id: 3,
      period: '2025년 8월',
      stayName: '구공스테이 옥천 키즈',
      totalRevenue: 3600000,
      platformFee: 180000,
      netRevenue: 3420000,
      feeRate: 5.0,
      reservationCount: 22,
      averagePrice: 163636,
      status: 'completed',
      settlementDate: '2025-09-01',
      createdAt: '2025-09-01'
    },
    {
      id: 4,
      period: '2025년 9월',
      stayName: '구공스테이 청주 본디',
      totalRevenue: 1200000,
      platformFee: 60000,
      netRevenue: 1140000,
      feeRate: 5.0,
      reservationCount: 8,
      averagePrice: 150000,
      status: 'processing',
      settlementDate: '2025-10-01',
      createdAt: '2025-09-02'
    },
    {
      id: 5,
      period: '2025년 9월',
      stayName: '구공스테이 남해 디풀&애견',
      totalRevenue: 925000,
      platformFee: 46250,
      netRevenue: 878750,
      feeRate: 5.0,
      reservationCount: 5,
      averagePrice: 185000,
      status: 'processing',
      settlementDate: '2025-10-01',
      createdAt: '2025-09-02'
    }
  ]

  const monthlyData = [
    { month: '5월', revenue: 8400000, fee: 420000, reservations: 56 },
    { month: '6월', revenue: 9200000, fee: 460000, reservations: 61 },
    { month: '7월', revenue: 11800000, fee: 590000, reservations: 78 },
    { month: '8월', revenue: 10600000, fee: 530000, reservations: 70 },
    { month: '9월', revenue: 2125000, fee: 106250, reservations: 13 }
  ]

  const stayPerformanceData = [
    { name: '청주 본디', value: 5400000, count: 36, color: '#3b82f6' },
    { name: '소소한옥', value: 2800000, count: 20, color: '#10b981' },
    { name: '옥천 키즈', value: 3600000, count: 22, color: '#8b5cf6' },
    { name: '사천 안토이비토', value: 0, count: 0, color: '#f59e0b' },
    { name: '남해 디풀&애견', value: 925000, count: 5, color: '#ef4444' }
  ]

  const filteredReports = reports.filter(report => {
    const matchesStay = stayFilter === 'all' || report.stayName.includes(stayFilter)
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter
    return matchesStay && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: '대기중' },
      processing: { color: 'bg-blue-100 text-blue-800', label: '처리중' },
      completed: { color: 'bg-green-100 text-green-800', label: '완료' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    return config ? (
      <Badge className={config.color}>{config.label}</Badge>
    ) : <Badge>Unknown</Badge>
  }

  const totalRevenue = reports.reduce((sum, report) => sum + report.totalRevenue, 0)
  const totalFee = reports.reduce((sum, report) => sum + report.platformFee, 0)
  const totalReservations = reports.reduce((sum, report) => sum + report.reservationCount, 0)
  const averageFeeRate = reports.length > 0 ? reports.reduce((sum, report) => sum + report.feeRate, 0) / reports.length : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">정산 리포트</h1>
          <p className="text-gray-600">매출 현황 및 정산 내역을 확인하고 관리합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            상세 리포트
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
                <p className="text-sm text-gray-600">총 매출액</p>
                <p className="text-2xl font-bold text-green-600">
                  ₩{totalRevenue.toLocaleString()}
                </p>
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
                <p className="text-2xl font-bold text-blue-600">
                  ₩{totalFee.toLocaleString()}
                </p>
              </div>
              <Percent className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 예약수</p>
                <p className="text-2xl font-bold">{totalReservations}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
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
        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>월별 매출 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `₩${Number(value).toLocaleString()}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" name="매출액" />
                <Bar dataKey="fee" fill="#ef4444" name="수수료" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stay Performance Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>스테이별 매출 비중</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stayPerformanceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stayPerformanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₩${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>정산 리포트 목록</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Select value={stayFilter} onValueChange={setStayFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="스테이 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 스테이</SelectItem>
                  <SelectItem value="청주">구공스테이 청주 본디</SelectItem>
                  <SelectItem value="소소한옥">구공스테이 소소한옥</SelectItem>
                  <SelectItem value="옥천">구공스테이 옥천 키즈</SelectItem>
                  <SelectItem value="사천">구공스테이 사천 안토이비토</SelectItem>
                  <SelectItem value="남해">구공스테이 남해 디풀&애견</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="pending">대기중</SelectItem>
                  <SelectItem value="processing">처리중</SelectItem>
                  <SelectItem value="completed">완료</SelectItem>
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
                  <TableHead>정산 기간</TableHead>
                  <TableHead>스테이명</TableHead>
                  <TableHead>총 매출액</TableHead>
                  <TableHead>플랫폼 수수료</TableHead>
                  <TableHead>실 정산액</TableHead>
                  <TableHead>예약 건수</TableHead>
                  <TableHead>평균 단가</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>정산 예정일</TableHead>
                  <TableHead>관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{report.period}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span>{report.stayName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-green-600">
                        ₩{report.totalRevenue.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-red-600">
                          ₩{report.platformFee.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({report.feeRate}%)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-blue-600">
                        ₩{report.netRevenue.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span>{report.reservationCount}건</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span>₩{Math.round(report.averagePrice).toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(report.status)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {report.settlementDate}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              조건에 맞는 정산 리포트가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>정산 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">이번 달 총 매출</Label>
              <p className="text-2xl font-bold text-green-600">
                ₩{reports.filter(r => r.period.includes('9월')).reduce((sum, r) => sum + r.totalRevenue, 0).toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">이번 달 수수료</Label>
              <p className="text-2xl font-bold text-red-600">
                ₩{reports.filter(r => r.period.includes('9월')).reduce((sum, r) => sum + r.platformFee, 0).toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">이번 달 실 정산액</Label>
              <p className="text-2xl font-bold text-blue-600">
                ₩{reports.filter(r => r.period.includes('9월')).reduce((sum, r) => sum + r.netRevenue, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}