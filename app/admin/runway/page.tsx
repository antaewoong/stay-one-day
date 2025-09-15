'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Video, Play, Pause, Settings, Users, DollarSign, Clock,
  AlertCircle, CheckCircle2, Upload, Download, Eye, Brain,
  BarChart3, TrendingUp, Calendar, Filter, RefreshCw
} from 'lucide-react'

interface RunwayJob {
  id: string
  hostId: string
  hostName: string
  accommodationName: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  type: 'image_to_video' | 'text_to_video' | 'video_to_video'
  createdAt: string
  completedAt?: string
  duration: number
  cost: number
  credits: number
  prompt?: string
  sourceImage?: string
  resultVideo?: string
  quality: 'standard' | 'hd' | '4k'
}

interface RunwayStats {
  totalJobs: number
  activeJobs: number
  completedJobs: number
  failedJobs: number
  totalCostUSD: number
  totalCredits: number
  monthlyUsage: {
    jobs: number
    cost: number
    credits: number
  }
  topHosts: Array<{
    hostName: string
    jobCount: number
    totalCost: number
  }>
  qualityDistribution: {
    standard: number
    hd: number
    '4k': number
  }
}

export default function AdminRunwayPage() {
  const [jobs, setJobs] = useState<RunwayJob[]>([])
  const [stats, setStats] = useState<RunwayStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchRunwayData()
  }, [])

  const fetchRunwayData = async () => {
    try {
      setLoading(true)

      // Mock 데이터 (실제로는 API에서 가져옴)
      const mockJobs: RunwayJob[] = [
        {
          id: '1',
          hostId: 'host1',
          hostName: '김호스트',
          accommodationName: '가평 힐링펜션',
          status: 'completed',
          type: 'image_to_video',
          createdAt: '2024-01-15T10:30:00Z',
          completedAt: '2024-01-15T10:45:00Z',
          duration: 4,
          cost: 10.5,
          credits: 35,
          prompt: '아름다운 펜션 외관에서 따뜻한 빛이 새어나오는 저녁 풍경',
          quality: 'hd',
          sourceImage: '/runway/source1.jpg',
          resultVideo: '/runway/result1.mp4'
        },
        {
          id: '2',
          hostId: 'host2',
          hostName: '박호스트',
          accommodationName: '제주 오션뷰',
          status: 'processing',
          type: 'text_to_video',
          createdAt: '2024-01-15T11:00:00Z',
          duration: 8,
          cost: 24.0,
          credits: 80,
          prompt: '제주도 바다 위로 떠오르는 일출과 함께 보이는 럭셔리 빌라',
          quality: '4k'
        },
        {
          id: '3',
          hostId: 'host3',
          hostName: '최호스트',
          accommodationName: '강릉 감성스테이',
          status: 'failed',
          type: 'image_to_video',
          createdAt: '2024-01-15T09:15:00Z',
          duration: 4,
          cost: 0,
          credits: 0,
          quality: 'standard'
        }
      ]

      const mockStats: RunwayStats = {
        totalJobs: 156,
        activeJobs: 12,
        completedJobs: 132,
        failedJobs: 12,
        totalCostUSD: 2150.75,
        totalCredits: 7200,
        monthlyUsage: {
          jobs: 45,
          cost: 650.25,
          credits: 2180
        },
        topHosts: [
          { hostName: '김호스트', jobCount: 23, totalCost: 345.60 },
          { hostName: '박호스트', jobCount: 18, totalCost: 287.40 },
          { hostName: '최호스트', jobCount: 15, totalCost: 234.50 }
        ],
        qualityDistribution: {
          standard: 45,
          hd: 78,
          '4k': 33
        }
      }

      setJobs(mockJobs)
      setStats(mockStats)
    } catch (error) {
      console.error('Runway 데이터 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: RunwayJob['status']) => {
    const config = {
      queued: { variant: 'secondary' as const, icon: Clock, text: '대기중', color: 'text-yellow-600' },
      processing: { variant: 'default' as const, icon: Play, text: '생성중', color: 'text-blue-600' },
      completed: { variant: 'default' as const, icon: CheckCircle2, text: '완료', color: 'text-green-600' },
      failed: { variant: 'destructive' as const, icon: AlertCircle, text: '실패', color: 'text-red-600' }
    }

    const { variant, icon: Icon, text, color } = config[status]
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className={`w-3 h-3 ${color}`} />
        {text}
      </Badge>
    )
  }

  const getTypeBadge = (type: RunwayJob['type']) => {
    const typeNames = {
      'image_to_video': '이미지→영상',
      'text_to_video': '텍스트→영상',
      'video_to_video': '영상→영상'
    }
    return <Badge variant="outline">{typeNames[type]}</Badge>
  }

  const getQualityBadge = (quality: RunwayJob['quality']) => {
    const config = {
      standard: { text: 'SD', color: 'bg-gray-500' },
      hd: { text: 'HD', color: 'bg-blue-500' },
      '4k': { text: '4K', color: 'bg-purple-500' }
    }
    const { text, color } = config[quality]
    return <Badge className={`${color} text-white`}>{text}</Badge>
  }

  const filteredJobs = jobs.filter(job => {
    const matchesFilter = filter === 'all' || job.status === filter
    const matchesSearch = !searchQuery ||
      job.hostName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.accommodationName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Runway AI 영상 관리
          </h1>
          <p className="text-gray-600 mt-2">
            호스트들의 AI 영상 제작 현황 및 사용량 관리
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchRunwayData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            사용량 리포트
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">시스템 개요</TabsTrigger>
          <TabsTrigger value="jobs">작업 현황</TabsTrigger>
          <TabsTrigger value="costs">비용 관리</TabsTrigger>
          <TabsTrigger value="settings">설정</TabsTrigger>
        </TabsList>

        {/* 시스템 개요 */}
        <TabsContent value="overview" className="space-y-6">
          {stats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">총 작업 수</CardTitle>
                    <Video className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalJobs}</div>
                    <p className="text-xs text-muted-foreground">
                      활성 {stats.activeJobs}개 작업
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">완료율</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round((stats.completedJobs / stats.totalJobs) * 100)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats.completedJobs}/{stats.totalJobs} 완료
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">총 비용</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${stats.totalCostUSD.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      이번 달 ${stats.monthlyUsage.cost.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">크레딧 사용</CardTitle>
                    <Brain className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalCredits.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      이번 달 {stats.monthlyUsage.credits.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>상위 사용자</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.topHosts.map((host, index) => (
                        <div key={host.hostName} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="w-6 h-6 text-xs p-0 flex items-center justify-center">
                              {index + 1}
                            </Badge>
                            <span className="font-medium">{host.hostName}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">${host.totalCost.toFixed(2)}</div>
                            <div className="text-xs text-gray-500">{host.jobCount}개 작업</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>품질별 분포</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(stats.qualityDistribution).map(([quality, count]) => (
                        <div key={quality} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2">
                              {getQualityBadge(quality as any)}
                              {quality === 'standard' ? 'Standard' :
                               quality === 'hd' ? 'HD 1080p' : '4K Ultra HD'}
                            </span>
                            <span>{count}개</span>
                          </div>
                          <Progress value={(count / stats.totalJobs) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* 작업 현황 */}
        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>작업 필터링</CardTitle>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="호스트명 또는 숙소명 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">전체</option>
                    <option value="queued">대기중</option>
                    <option value="processing">생성중</option>
                    <option value="completed">완료</option>
                    <option value="failed">실패</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <Card key={job.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Video className="w-6 h-6 text-gray-400" />
                        </div>

                        <div>
                          <h3 className="font-semibold">{job.accommodationName}</h3>
                          <p className="text-sm text-gray-600">by {job.hostName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(job.status)}
                            {getTypeBadge(job.type)}
                            {getQualityBadge(job.quality)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-bold">${job.cost.toFixed(2)}</div>
                        <div className="text-sm text-gray-600">{job.credits} 크레딧</div>
                        <div className="text-xs text-gray-500">{job.duration}초</div>
                      </div>
                    </div>

                    {job.prompt && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{job.prompt}</p>
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span>생성: {new Date(job.createdAt).toLocaleString()}</span>
                      {job.completedAt && (
                        <span>완료: {new Date(job.completedAt).toLocaleString()}</span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 비용 관리 */}
        <TabsContent value="costs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>월별 사용량</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>작업 수</span>
                    <span className="font-semibold">{stats?.monthlyUsage.jobs || 0}개</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>총 비용</span>
                    <span className="font-semibold text-green-600">
                      ${stats?.monthlyUsage.cost.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>크레딧 소모</span>
                    <span className="font-semibold">{stats?.monthlyUsage.credits.toLocaleString() || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>비용 최적화 제안</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      4K 품질 사용을 25% 줄이면 월 $150 절약 가능
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      짧은 영상(4초 이하)으로 제한하면 40% 비용 절감
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 설정 */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Runway ML API 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="api-key">API 키</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="sk-..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="monthly-budget">월 예산 한도 (USD)</Label>
                <Input
                  id="monthly-budget"
                  type="number"
                  placeholder="1000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="default-quality">기본 품질</Label>
                <select className="w-full px-3 py-2 border rounded-md mt-1">
                  <option value="standard">Standard</option>
                  <option value="hd">HD</option>
                  <option value="4k">4K</option>
                </select>
              </div>
              <Button>설정 저장</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}