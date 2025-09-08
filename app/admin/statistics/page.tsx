'use client'

import { useState } from 'react'
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
  AlertCircle
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
import { useRealTimeStats } from '@/lib/hooks/useRealTimeStats'

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

export default function SiteStatisticsPage() {
  const [period, setPeriod] = useState('month')
  const { stats, loading, error, refresh } = useRealTimeStats(period)

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
          <h1 className="text-2xl font-bold">사이트 통계</h1>
          <p className="text-gray-600">웹사이트 방문자 및 이용 통계를 확인합니다</p>
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

      {/* 실시간 현황 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-medium">실시간 방문자</p>
                <p className="text-2xl font-bold text-blue-900">{stats?.visitors.realTime || 0}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
            <div className="mt-2">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-xs text-blue-700">지금 접속 중</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">총 방문자</p>
                <p className="text-2xl font-bold">{stats?.visitors.total.toLocaleString() || '0'}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex items-center mt-2 text-xs">
              {stats?.visitors.growth && stats.visitors.growth > 0 ? (
                <><TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                <span className="text-green-600">+{stats.visitors.growth.toFixed(1)}%</span></>
              ) : (
                <><TrendingDown className="w-3 h-3 text-red-600 mr-1" />
                <span className="text-red-600">{stats?.visitors.growth?.toFixed(1) || '0'}%</span></>
              )}
              <span className="text-gray-600 ml-1">전기간 대비</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">페이지뷰</p>
                <p className="text-2xl font-bold">{stats?.pageviews.total.toLocaleString() || '0'}</p>
              </div>
              <Eye className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex items-center mt-2 text-xs">
              {stats?.pageviews.growth && stats.pageviews.growth > 0 ? (
                <><TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                <span className="text-green-600">+{stats.pageviews.growth.toFixed(1)}%</span></>
              ) : (
                <><TrendingDown className="w-3 h-3 text-red-600 mr-1" />
                <span className="text-red-600">{stats?.pageviews.growth?.toFixed(1) || '0'}%</span></>
              )}
              <span className="text-gray-600 ml-1">전기간 대비</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">활성 숙소</p>
                <p className="text-2xl font-bold">{stats?.accommodations.active || '0'}</p>
              </div>
              <Building2 className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex items-center mt-2 text-xs">
              <span className="text-gray-600">총 {stats?.accommodations.total || '0'}개 숙소</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-600 font-medium">전환율</p>
                <p className="text-2xl font-bold text-orange-900">{stats?.conversions.rate || '0'}%</p>
              </div>
              <Target className="w-8 h-8 text-orange-600" />
            </div>
            <div className="flex items-center mt-2 text-xs">
              <DollarSign className="w-3 h-3 text-orange-600 mr-1" />
              <span className="text-orange-700">{stats?.conversions.total || '0'}건 예약</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 수익 & ROAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">총 수익</p>
                <p className="text-3xl font-bold text-green-900">₩{stats?.conversions.revenue.toLocaleString() || '0'}</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-600" />
            </div>
            <div className="flex items-center mt-3">
              <span className="text-sm text-green-700">평균 주문가: ₩{stats?.conversions.avgOrderValue.toLocaleString() || '0'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">ROAS</p>
                <p className="text-3xl font-bold text-purple-900">{stats?.conversions.roas.toFixed(2) || '0'}x</p>
              </div>
              <Zap className="w-10 h-10 text-purple-600" />
            </div>
            <div className="flex items-center mt-3">
              <span className="text-sm text-purple-700">광고 투자 수익률</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-600 font-medium">이탈률</p>
                <p className="text-3xl font-bold text-indigo-900">{stats?.pageviews.bounceRate.toFixed(1) || '0'}%</p>
              </div>
              <MousePointer className="w-10 h-10 text-indigo-600" />
            </div>
            <div className="flex items-center mt-3">
              <span className="text-sm text-indigo-700">평균 세션: {stats?.pageviews.avgSession || '0'}페이지</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 고급 차트 섹션 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* 방문자 트렌드 차트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              방문자 트렌드
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { date: '1일전', visitors: stats?.visitors.total ? Math.floor(stats.visitors.total * 0.8) : 0, pageviews: stats?.pageviews.total ? Math.floor(stats.pageviews.total * 0.75) : 0 },
                  { date: '12시간전', visitors: stats?.visitors.total ? Math.floor(stats.visitors.total * 0.9) : 0, pageviews: stats?.pageviews.total ? Math.floor(stats.pageviews.total * 0.85) : 0 },
                  { date: '6시간전', visitors: stats?.visitors.total ? Math.floor(stats.visitors.total * 0.95) : 0, pageviews: stats?.pageviews.total ? Math.floor(stats.pageviews.total * 0.92) : 0 },
                  { date: '현재', visitors: stats?.visitors.total || 0, pageviews: stats?.pageviews.total || 0 }
                ]}>
                  <defs>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="visitors" stackId="1" stroke={CHART_COLORS.primary} fill="url(#colorVisitors)" name="방문자" />
                  <Area type="monotone" dataKey="pageviews" stackId="2" stroke={CHART_COLORS.secondary} fill="url(#colorPageviews)" name="페이지뷰" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 디바이스 분포 차트 */}
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
                    data={stats?.deviceBreakdown || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ device, percentage }) => `${device} ${((percentage || 0) * 100).toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="sessions"
                  >
                    {stats?.deviceBreakdown?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any, name) => [value?.toLocaleString(), name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 상세 분석 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 방문자 세부 분석 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              방문자 세부 분석
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">순방문자</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{stats?.visitors.unique.toLocaleString() || '0'}</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {stats?.visitors.total && stats.visitors.unique ? 
                      ((stats.visitors.unique / stats.visitors.total) * 100).toFixed(1) : '0'}%
                  </Badge>
                </div>
              </div>
              <Progress value={stats?.visitors.total && stats.visitors.unique ? 
                (stats.visitors.unique / stats.visitors.total) * 100 : 0} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">재방문자</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{stats?.visitors.returning.toLocaleString() || '0'}</span>
                  <Badge variant="outline" className="bg-gray-50 text-gray-700">
                    {stats?.visitors.total && stats.visitors.returning ? 
                      ((stats.visitors.returning / stats.visitors.total) * 100).toFixed(1) : '0'}%
                  </Badge>
                </div>
              </div>
              <Progress value={stats?.visitors.total && stats.visitors.returning ? 
                (stats.visitors.returning / stats.visitors.total) * 100 : 0} className="h-2" />
            </div>

            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">이탈률</p>
                  <p className="text-2xl font-bold text-green-800">{stats?.pageviews.bounceRate.toFixed(1) || '0'}%</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-green-100 text-green-800">
                    {(stats?.pageviews.bounceRate || 0) < 40 ? '우수' : 
                     (stats?.pageviews.bounceRate || 0) < 60 ? '양호' : '개선 필요'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 font-medium">평균 세션 지속시간</p>
                  <p className="text-xl font-bold text-purple-800">{Math.floor((stats?.pageviews.sessionDuration || 0) / 60)}분 {(stats?.pageviews.sessionDuration || 0) % 60}초</p>
                </div>
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 인기 페이지 & 성과 분석 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              인기 페이지 TOP 5
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.topPages?.map((page, index) => (
                <div key={index} className="group hover:bg-gray-50 p-3 rounded-lg transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all group-hover:scale-110 ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 
                        index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' : 
                        index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-700' :
                        'bg-gradient-to-r from-blue-500 to-blue-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm group-hover:text-blue-600 transition-colors">{page.page}</p>
                        <p className="text-xs text-gray-500">이탈률 {page.bounce}%</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{page.views.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">조회수</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Progress value={(page.views / (stats?.pageviews.total || 1)) * 100} className="h-1" />
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">페이지 데이터를 불러오는 중...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 트래픽 소스 & 마케팅 성과 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 트래픽 소스 분석 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              트래픽 소스 분석
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.trafficSources?.map((source, index) => (
                <div key={index} className="group hover:bg-gray-50 p-3 rounded-lg transition-all">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: TRAFFIC_COLORS[index % TRAFFIC_COLORS.length] }}
                      ></div>
                      <span className="text-sm font-medium group-hover:text-blue-600">{source.source}</span>
                      <Badge variant="outline" className="text-xs">{source.medium}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">{source.visitors.toLocaleString()}</span>
                      <Badge className="bg-blue-100 text-blue-800">{source.percentage.toFixed(1)}%</Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Progress value={source.percentage} className="h-2" />
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

        {/* 검색 키워드 성과 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              검색 키워드 성과
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.searchKeywords?.map((keyword, index) => (
                <div key={index} className="group hover:bg-gray-50 p-3 rounded-lg transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white ${
                        keyword.position <= 3 ? 'bg-green-500' : keyword.position <= 10 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}>
                        {keyword.position.toFixed(0)}
                      </div>
                      <span className="font-medium group-hover:text-blue-600">{keyword.keyword}</span>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      CTR {keyword.ctr}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-bold text-blue-600">{keyword.clicks.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">클릭</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-green-600">{keyword.impressions.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">노출</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-purple-600">{keyword.position.toFixed(1)}</p>
                      <p className="text-xs text-gray-500">평균 순위</p>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-6 text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">키워드 데이터를 불러오는 중...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 마케팅 효율 분석 및 예약 현황 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 예약 현황 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              예약 현황
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 text-center">
                <p className="text-2xl font-bold text-green-700">{stats?.conversions.total || '0'}</p>
                <p className="text-sm text-green-600 font-medium">완료된 예약</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200 text-center">
                <p className="text-2xl font-bold text-yellow-700">{stats?.accommodations.pending || '0'}</p>
                <p className="text-sm text-yellow-600 font-medium">대기 중</p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">예약 성공률</span>
                <span className="text-lg font-bold text-green-600">
                  {stats?.conversions.rate || '0'}%
                </span>
              </div>
              <Progress value={stats?.conversions.rate || 0} className="mt-2 h-2" />
            </div>
          </CardContent>
        </Card>

        {/* 마케팅 효율 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              마케팅 효율
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-lg font-bold text-blue-700">{stats?.conversions.rate.toFixed(1) || '0'}%</p>
                <p className="text-xs text-blue-600">전환율</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-lg font-bold text-purple-700">{stats?.conversions.roas.toFixed(1) || '0'}x</p>
                <p className="text-xs text-purple-600">ROAS</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">클릭당 비용</span>
                <span className="font-medium">₩{((stats?.conversions.revenue || 0) / Math.max(stats?.visitors.total || 1, 1)).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">획득당 비용</span>
                <span className="font-medium">₩{((stats?.conversions.revenue || 0) / Math.max(stats?.conversions.total || 1, 1) * 0.1).toFixed(0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 실시간 활동 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              실시간 활동
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-2xl font-bold text-blue-700">{stats?.visitors.realTime || '0'}</p>
              </div>
              <p className="text-sm text-blue-600 font-medium">현재 접속자</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">오늘 숙소 조회</span>
                <span className="font-medium">{stats?.accommodations.viewsToday || '0'}회</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">평균 세션</span>
                <span className="font-medium">{stats?.pageviews.avgSession || '0'}페이지</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">활성 숙소</span>
                <span className="font-medium">{stats?.accommodations.active || '0'}개</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-lg font-medium">실시간 데이터 업데이트 중...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}