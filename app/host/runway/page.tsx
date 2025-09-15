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
  Video, Play, Pause, Settings, Clock, DollarSign, Brain, Upload, Download,
  CheckCircle2, AlertCircle, Eye, Heart, Share2, TrendingUp, Plus, X, Sparkles
} from 'lucide-react'

interface RunwayProject {
  id: string
  name: string
  type: 'image_to_video' | 'text_to_video' | 'video_to_video'
  status: 'draft' | 'processing' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
  duration: number
  cost: number
  credits: number
  prompt?: string
  sourceImage?: string
  resultVideo?: string
  quality: 'standard' | 'hd' | '4k'
  views?: number
  likes?: number
  shares?: number
}

interface HostRunwayStats {
  totalProjects: number
  completedProjects: number
  processingProjects: number
  totalSpent: number
  creditsUsed: number
  monthlyUsage: {
    projects: number
    spent: number
    credits: number
  }
  popularContent: Array<{
    name: string
    views: number
    engagement: number
  }>
}

export default function HostRunwayPage() {
  const [projects, setProjects] = useState<RunwayProject[]>([])
  const [stats, setStats] = useState<HostRunwayStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [newProject, setNewProject] = useState({
    name: '',
    type: 'image_to_video' as const,
    prompt: '',
    quality: 'hd' as const
  })

  useEffect(() => {
    fetchRunwayData()
  }, [])

  const fetchRunwayData = async () => {
    try {
      setLoading(true)

      // Mock 데이터 (실제로는 API에서 가져옴)
      const mockProjects: RunwayProject[] = [
        {
          id: '1',
          name: '펜션 외관 영상',
          type: 'image_to_video',
          status: 'completed',
          createdAt: '2024-09-14T10:30:00Z',
          completedAt: '2024-09-14T10:45:00Z',
          duration: 4,
          cost: 12.5,
          credits: 42,
          prompt: '따뜻한 조명이 켜진 펜션 외관, 저녁 황혼의 아늑한 분위기',
          quality: 'hd',
          sourceImage: '/runway/source1.jpg',
          resultVideo: '/runway/result1.mp4',
          views: 1250,
          likes: 89,
          shares: 23
        },
        {
          id: '2',
          name: '키즈풀 이용 영상',
          type: 'text_to_video',
          status: 'processing',
          createdAt: '2024-09-14T14:20:00Z',
          duration: 6,
          cost: 18.0,
          credits: 60,
          prompt: '아이들이 즐겁게 놀고 있는 키즈풀, 부모들이 지켜보는 평화로운 오후',
          quality: '4k'
        },
        {
          id: '3',
          name: '바베큐 파티 영상',
          type: 'image_to_video',
          status: 'failed',
          createdAt: '2024-09-14T09:15:00Z',
          duration: 4,
          cost: 0,
          credits: 0,
          quality: 'standard',
          prompt: '가족들이 즐기는 바베큐 파티 분위기'
        }
      ]

      const mockStats: HostRunwayStats = {
        totalProjects: 15,
        completedProjects: 12,
        processingProjects: 2,
        totalSpent: 285.50,
        creditsUsed: 950,
        monthlyUsage: {
          projects: 8,
          spent: 125.75,
          credits: 420
        },
        popularContent: [
          { name: '펜션 외관 영상', views: 1250, engagement: 8.5 },
          { name: '수영장 영상', views: 890, engagement: 7.2 },
          { name: '조식 준비 영상', views: 654, engagement: 6.8 }
        ]
      }

      setProjects(mockProjects)
      setStats(mockStats)
    } catch (error) {
      console.error('Runway 데이터 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: RunwayProject['status']) => {
    const config = {
      draft: { variant: 'secondary' as const, text: '초안', color: 'text-gray-600' },
      processing: { variant: 'default' as const, text: '생성 중', color: 'text-blue-600' },
      completed: { variant: 'default' as const, text: '완료', color: 'text-green-600' },
      failed: { variant: 'destructive' as const, text: '실패', color: 'text-red-600' }
    }

    const { variant, text, color } = config[status]
    return <Badge variant={variant}>{text}</Badge>
  }

  const getTypeBadge = (type: RunwayProject['type']) => {
    const typeNames = {
      'image_to_video': '이미지→영상',
      'text_to_video': '텍스트→영상',
      'video_to_video': '영상→영상'
    }
    return <Badge variant="outline">{typeNames[type]}</Badge>
  }

  const getQualityBadge = (quality: RunwayProject['quality']) => {
    const config = {
      standard: { text: 'SD', color: 'bg-gray-500' },
      hd: { text: 'HD', color: 'bg-blue-500' },
      '4k': { text: '4K', color: 'bg-purple-500' }
    }
    const { text, color } = config[quality]
    return <Badge className={`${color} text-white`}>{text}</Badge>
  }

  const handleCreateProject = async () => {
    // 새 프로젝트 생성 로직
    console.log('새 프로젝트 생성:', newProject)
  }

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
            Runway AI 영상 제작
          </h1>
          <p className="text-gray-600 mt-2">
            AI를 활용한 마케팅 영상 제작 및 관리
          </p>
        </div>

        <Button onClick={() => setActiveTab('create')} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          새 프로젝트
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="projects">내 프로젝트</TabsTrigger>
          <TabsTrigger value="analytics">성과 분석</TabsTrigger>
          <TabsTrigger value="create">새 프로젝트</TabsTrigger>
        </TabsList>

        {/* 개요 */}
        <TabsContent value="overview" className="space-y-6">
          {stats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">총 프로젝트</CardTitle>
                    <Video className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalProjects}</div>
                    <p className="text-xs text-muted-foreground">
                      완료 {stats.completedProjects}개
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
                      {Math.round((stats.completedProjects / stats.totalProjects) * 100)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats.processingProjects}개 생성 중
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">총 사용 금액</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      이번 달 ${stats.monthlyUsage.spent.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">사용 크레딧</CardTitle>
                    <Brain className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.creditsUsed.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      이번 달 {stats.monthlyUsage.credits.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>인기 콘텐츠</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.popularContent.map((content, index) => (
                      <div key={content.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="w-6 h-6 text-xs p-0 flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <span className="font-medium">{content.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">{content.views.toLocaleString()}회</div>
                          <div className="text-xs text-gray-500">{content.engagement}% 참여율</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* 내 프로젝트 */}
        <TabsContent value="projects" className="space-y-6">
          <div className="space-y-4">
            {projects.map((project) => (
              <Card key={project.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Video className="w-6 h-6 text-gray-400" />
                    </div>

                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(project.status)}
                        {getTypeBadge(project.type)}
                        {getQualityBadge(project.quality)}
                      </div>
                      {project.prompt && (
                        <p className="text-xs text-gray-600 mt-1 max-w-md truncate">
                          {project.prompt}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold">${project.cost.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">{project.credits} 크레딧</div>
                    {project.status === 'completed' && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Eye className="w-3 h-3" />
                        <span>{project.views}</span>
                        <Heart className="w-3 h-3" />
                        <span>{project.likes}</span>
                        <Share2 className="w-3 h-3" />
                        <span>{project.shares}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>생성: {new Date(project.createdAt).toLocaleString()}</span>
                  {project.completedAt && (
                    <span>완료: {new Date(project.completedAt).toLocaleString()}</span>
                  )}
                </div>

                {project.status === 'processing' && (
                  <div className="mt-3">
                    <Progress value={65} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">생성 중... 약 5분 소요</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 성과 분석 */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>영상 성과 분석</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">3.2K</div>
                  <p className="text-sm text-gray-600">총 조회수</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">7.8%</div>
                  <p className="text-sm text-gray-600">평균 참여율</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">156</div>
                  <p className="text-sm text-gray-600">총 공유수</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 새 프로젝트 */}
        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                새 AI 영상 프로젝트
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="project-name">프로젝트 이름</Label>
                <Input
                  id="project-name"
                  placeholder="예: 펜션 홍보 영상"
                  value={newProject.name}
                  onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="project-type">생성 방식</Label>
                <select
                  id="project-type"
                  value={newProject.type}
                  onChange={(e) => setNewProject(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border rounded-md mt-1"
                >
                  <option value="image_to_video">이미지에서 영상 생성</option>
                  <option value="text_to_video">텍스트에서 영상 생성</option>
                  <option value="video_to_video">영상 편집/변환</option>
                </select>
              </div>

              <div>
                <Label htmlFor="project-prompt">프롬프트 (영상 설명)</Label>
                <Textarea
                  id="project-prompt"
                  placeholder="생성하고 싶은 영상에 대해 자세히 설명해주세요..."
                  value={newProject.prompt}
                  onChange={(e) => setNewProject(prev => ({ ...prev, prompt: e.target.value }))}
                  className="mt-1 h-24"
                />
              </div>

              <div>
                <Label htmlFor="project-quality">품질</Label>
                <select
                  id="project-quality"
                  value={newProject.quality}
                  onChange={(e) => setNewProject(prev => ({ ...prev, quality: e.target.value as any }))}
                  className="w-full px-3 py-2 border rounded-md mt-1"
                >
                  <option value="standard">Standard (빠름, 저비용)</option>
                  <option value="hd">HD (권장)</option>
                  <option value="4k">4K (고품질, 고비용)</option>
                </select>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  HD 품질 기준 약 15-30 크레딧이 소요되며, 생성에 5-10분이 걸립니다.
                </AlertDescription>
              </Alert>

              <Button onClick={handleCreateProject} className="w-full bg-purple-600 hover:bg-purple-700">
                <Sparkles className="w-4 h-4 mr-2" />
                AI 영상 생성 시작
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}