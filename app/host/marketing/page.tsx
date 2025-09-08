'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  Users, 
  Building2, 
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  Calendar,
  Download,
  RefreshCw,
  Target,
  Globe,
  Smartphone,
  Search,
  Activity,
  DollarSign,
  Zap,
  AlertCircle,
  Home,
  Star,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import { useHostStats } from '@/lib/hooks/useHostStats'

// 색상 팔레트
const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
  teal: '#14B8A6'
}

const DEVICE_COLORS = [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.warning]
const TRAFFIC_COLORS = [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.purple, CHART_COLORS.pink]

export default function HostMarketingPage() {
  const [period, setPeriod] = useState('month')
  const [hostId, setHostId] = useState<string>('')

  // 세션 스토리지에서 호스트 정보 가져오기
  useEffect(() => {
    const hostUser = sessionStorage.getItem('hostUser')
    if (hostUser) {
      try {
        const parsedHostUser = JSON.parse(hostUser)
        if (parsedHostUser.id) {
          setHostId(parsedHostUser.id)
        }
      } catch (error) {
        console.error('호스트 정보 파싱 실패:', error)
      }
    }
  }, [])

  const { stats, loading, error, refresh } = useHostStats(hostId, period)

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">데이터 로드 실패</h3>
            <p className="text-sm text-gray-600 mt-2">{error}</p>
          </div>
          <Button onClick={refresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">마케팅 분석</h1>
          <p className="text-gray-600">내 숙소의 마케팅 성과와 방문자 분석을 확인합니다</p>
        </div>
        <div className="flex gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">일간</SelectItem>
              <SelectItem value="week">주간</SelectItem>
              <SelectItem value="month">월간</SelectItem>
              <SelectItem value="year">연간</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            내보내기
          </Button>
        </div>
      </div>

      {/* 핵심 성과 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">총 방문자</p>
                <p className="text-3xl font-bold text-blue-900">{stats?.marketing.totalVisitors.toLocaleString() || '0'}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600" />
            </div>
            <div className="flex items-center mt-3">
              <span className="text-sm text-blue-700">순방문자: {stats?.marketing.uniqueVisitors.toLocaleString() || '0'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">숙소 조회</p>
                <p className="text-3xl font-bold text-green-900">{stats?.accommodations.views.toLocaleString() || '0'}</p>
              </div>
              <Eye className="w-10 h-10 text-green-600" />
            </div>
            <div className="flex items-center mt-3">
              <span className="text-sm text-green-700">활성 숙소: {stats?.accommodations.active || '0'}개</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">예약 전환율</p>
                <p className="text-3xl font-bold text-purple-900">{stats?.reservations.conversionRate.toFixed(2) || '0'}%</p>
              </div>
              <Target className="w-10 h-10 text-purple-600" />
            </div>
            <div className="flex items-center mt-3">
              <span className="text-sm text-purple-700">총 예약: {stats?.reservations.confirmed || '0'}건</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">수익</p>
                <p className="text-3xl font-bold text-orange-900">₩{stats?.reservations.revenue.toLocaleString() || '0'}</p>
              </div>
              <DollarSign className="w-10 h-10 text-orange-600" />
            </div>
            <div className="flex items-center mt-3">
              <span className="text-sm text-orange-700">평균: ₩{stats?.reservations.avgOrderValue.toLocaleString() || '0'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 성과 분석 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ROAS</p>
                <p className="text-2xl font-bold">{stats?.performance.roas.toFixed(2) || '0'}x</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="flex items-center mt-2 text-xs">
              <span className="text-gray-600">광고 투자 수익률</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">이탈률</p>
                <p className="text-2xl font-bold">{stats?.marketing.bounceRate.toFixed(1) || '0'}%</p>
              </div>
              <MousePointer className="w-8 h-8 text-red-600" />
            </div>
            <div className="flex items-center mt-2 text-xs">
              <Badge className={`${(stats?.marketing.bounceRate || 0) < 40 ? 'bg-green-100 text-green-800' : (stats?.marketing.bounceRate || 0) < 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                {(stats?.marketing.bounceRate || 0) < 40 ? '우수' : (stats?.marketing.bounceRate || 0) < 60 ? '양호' : '개선 필요'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">획득 단가</p>
                <p className="text-2xl font-bold">₩{stats?.performance.costPerAcquisition.toLocaleString() || '0'}</p>
              </div>
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex items-center mt-2 text-xs">
              <span className="text-gray-600">예약 1건당 비용</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ROI</p>
                <p className="text-2xl font-bold">{stats?.performance.returnOnInvestment.toFixed(1) || '0'}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex items-center mt-2 text-xs">
              <span className="text-gray-600">투자 수익률</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 트렌드 차트 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              성과 트렌드 ({period})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.trends || []}>
                  <defs>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.warning} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={CHART_COLORS.warning} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="visitors" stackId="1" stroke={CHART_COLORS.primary} fill="url(#colorVisitors)" name="방문자" />
                  <Area type="monotone" dataKey="views" stackId="2" stroke={CHART_COLORS.secondary} fill="url(#colorViews)" name="숙소 조회" />
                  <Area type="monotone" dataKey="revenue" stackId="3" stroke={CHART_COLORS.warning} fill="url(#colorRevenue)" name="수익" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              디바이스 분포
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.marketing.devices || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ device, percentage }) => `${device} ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="sessions"
                  >
                    {stats?.marketing.devices?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 트래픽 소스 & 숙소 현황 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              트래픽 소스 분석
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.marketing.topSources?.map((source, index) => (
                <div key={index} className="group hover:bg-gray-50 p-3 rounded-lg transition-all">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: TRAFFIC_COLORS[index % TRAFFIC_COLORS.length] }}
                      ></div>
                      <span className="text-sm font-medium group-hover:text-blue-600">{source.source}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">{source.visitors.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Progress value={stats?.marketing.totalVisitors ? (source.visitors / stats.marketing.totalVisitors) * 100 : 0} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>전환: {source.conversions}건</span>
                      <span>수익: ₩{source.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-6 text-gray-500">
                  <Globe className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">트래픽 데이터를 분석하는 중...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              내 숙소 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 text-center">
                <p className="text-2xl font-bold text-green-700">{stats?.accommodations.active || '0'}</p>
                <p className="text-sm text-green-600 font-medium">활성 숙소</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200 text-center">
                <p className="text-2xl font-bold text-yellow-700">{stats?.accommodations.pending || '0'}</p>
                <p className="text-sm text-yellow-600 font-medium">승인 대기</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">총 숙소</span>
                <span className="font-bold">{stats?.accommodations.total || '0'}개</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">총 조회수</span>
                <span className="font-bold">{stats?.accommodations.views.toLocaleString() || '0'}회</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">숙소당 평균 조회</span>
                <span className="font-bold">
                  {stats?.accommodations.total && stats.accommodations.total > 0 ? 
                    Math.round(stats.accommodations.views / stats.accommodations.total) : '0'}회
                </span>
              </div>
              
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">조회 → 예약 전환율</span>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-green-600">{stats?.reservations.conversionRate.toFixed(2) || '0'}%</span>
                    {(stats?.reservations.conversionRate || 0) > 3 ? (
                      <ArrowUpRight className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 예약 현황 상세 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            예약 현황 상세
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-2xl font-bold text-green-700">{stats?.reservations.confirmed || '0'}</p>
              <p className="text-sm text-green-600 font-medium">확정된 예약</p>
              <div className="mt-2">
                <Progress value={stats?.reservations.total ? (stats.reservations.confirmed / stats.reservations.total) * 100 : 0} className="h-2" />
              </div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-2xl font-bold text-yellow-700">{stats?.reservations.pending || '0'}</p>
              <p className="text-sm text-yellow-600 font-medium">대기 중</p>
              <div className="mt-2">
                <Progress value={stats?.reservations.total ? (stats.reservations.pending / stats.reservations.total) * 100 : 0} className="h-2" />
              </div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-2xl font-bold text-red-700">{stats?.reservations.cancelled || '0'}</p>
              <p className="text-sm text-red-600 font-medium">취소됨</p>
              <div className="mt-2">
                <Progress value={stats?.reservations.total ? (stats.reservations.cancelled / stats.reservations.total) * 100 : 0} className="h-2" />
              </div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-2xl font-bold text-blue-700">₩{stats?.reservations.avgOrderValue.toLocaleString() || '0'}</p>
              <p className="text-sm text-blue-600 font-medium">평균 예약 금액</p>
              <div className="mt-2">
                <Badge className="bg-blue-100 text-blue-800">
                  {stats?.reservations.avgOrderValue && stats.reservations.avgOrderValue > 100000 ? '고가' : 
                   stats?.reservations.avgOrderValue && stats.reservations.avgOrderValue > 50000 ? '중가' : '저가'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-lg font-medium">마케팅 데이터 분석 중...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}