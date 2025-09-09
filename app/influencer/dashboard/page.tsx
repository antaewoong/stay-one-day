'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  Calendar, 
  FileText, 
  TrendingUp, 
  Users, 
  LogOut,
  Loader2,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface InfluencerData {
  id: string
  name: string
  email: string
  username: string
  instagram_handle: string
  follower_count: number
  content_category: string[]
  last_login_at: string
}

interface CollaborationPeriod {
  id: string
  year: number
  month: number
  is_open: boolean
  application_start_date: string
  application_end_date: string
  max_applications: number
  current_applications: number
  announcement: string
}

interface MyApplication {
  id: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  final_status: 'pending' | 'in_progress' | 'review_pending' | 'completed'
  accommodation: {
    name: string
    location: string
  }
  check_in_date: string
  created_at: string
}

export default function InfluencerDashboard() {
  const router = useRouter()
  const [influencer, setInfluencer] = useState<InfluencerData | null>(null)
  const [currentPeriod, setCurrentPeriod] = useState<CollaborationPeriod | null>(null)
  const [myApplications, setMyApplications] = useState<MyApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = sessionStorage.getItem('influencerUser')
    if (!userData) {
      router.push('/influencer/login')
      return
    }

    const influencerData = JSON.parse(userData)
    setInfluencer(influencerData)
    loadDashboardData(influencerData.id)
  }, [router])

  const loadDashboardData = async (influencerId: string) => {
    try {
      // 현재 협업 기간 정보 로드
      const periodResponse = await fetch('/api/influencer/current-period')
      if (periodResponse.ok) {
        const periodResult = await periodResponse.json()
        if (periodResult.success) {
          setCurrentPeriod(periodResult.period)
        }
      }

      // 내 신청 현황 로드
      const appsResponse = await fetch(`/api/influencer/my-applications?influencer_id=${influencerId}&limit=5`)
      if (appsResponse.ok) {
        const appsResult = await appsResponse.json()
        if (appsResult.success) {
          setMyApplications(appsResult.data)
        }
      }
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('influencerUser')
    router.push('/influencer/login')
  }

  const getStatusBadge = (status: string, finalStatus: string) => {
    if (status === 'pending') {
      return <Badge variant="outline" className="text-yellow-600"><Clock className="mr-1 w-3 h-3" />대기중</Badge>
    } else if (status === 'accepted') {
      if (finalStatus === 'completed') {
        return <Badge className="bg-green-600"><CheckCircle className="mr-1 w-3 h-3" />완료</Badge>
      }
      return <Badge className="bg-blue-600"><CheckCircle className="mr-1 w-3 h-3" />승인</Badge>
    } else if (status === 'rejected') {
      return <Badge variant="destructive">거부</Badge>
    }
    return <Badge variant="secondary">{status}</Badge>
  }

  if (loading || !influencer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>로딩 중...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">스테이 원데이</h1>
                <p className="text-sm text-gray-600">인플루언서 협업 플랫폼</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-medium">{influencer.name}</div>
                <div className="text-sm text-gray-600">{influencer.email}</div>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽 컬럼 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 웰컴 카드 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  안녕하세요, {influencer.name}님!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {influencer.follower_count?.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">팔로워</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {myApplications.filter(app => app.status === 'accepted').length}
                    </div>
                    <div className="text-sm text-gray-600">승인된 협업</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {myApplications.filter(app => app.final_status === 'completed').length}
                    </div>
                    <div className="text-sm text-gray-600">완료된 협업</div>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <span className="font-medium">콘텐츠 카테고리:</span> {influencer.content_category?.join(', ')}
                </div>
              </CardContent>
            </Card>

            {/* 현재 협업 기간 정보 */}
            {currentPeriod && (
              <Card className={currentPeriod.is_open ? 'border-green-200 bg-green-50' : 'border-gray-200'}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {currentPeriod.year}년 {currentPeriod.month}월 협업 모집
                    {currentPeriod.is_open ? (
                      <Badge className="bg-green-600">모집 중</Badge>
                    ) : (
                      <Badge variant="secondary">모집 예정</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="font-medium">신청 기간:</span>{' '}
                      {format(new Date(currentPeriod.application_start_date), 'MM월 dd일', { locale: ko })} ~ {' '}
                      {format(new Date(currentPeriod.application_end_date), 'MM월 dd일', { locale: ko })}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">모집 인원:</span>{' '}
                      {currentPeriod.current_applications}/{currentPeriod.max_applications}명
                    </div>
                    <div className="bg-white p-3 rounded border text-sm">
                      {currentPeriod.announcement}
                    </div>
                    {currentPeriod.is_open && (
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => router.push('/influencer/apply')}
                      >
                        협업 신청하러 가기
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 최근 신청 현황 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    최근 신청 현황
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/influencer/my-applications')}
                  >
                    전체 보기
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {myApplications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>아직 신청한 협업이 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myApplications.slice(0, 3).map((application) => (
                      <div key={application.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{application.accommodation.name}</h4>
                            <p className="text-sm text-gray-600">{application.accommodation.location}</p>
                          </div>
                          {getStatusBadge(application.status, application.final_status)}
                        </div>
                        <div className="text-xs text-gray-500">
                          체크인: {format(new Date(application.check_in_date), 'PPP', { locale: ko })}
                        </div>
                        <div className="text-xs text-gray-500">
                          신청일: {format(new Date(application.created_at), 'PPP', { locale: ko })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽 사이드바 */}
          <div className="space-y-6">
            {/* 빠른 메뉴 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">빠른 메뉴</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/influencer/notices')}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  공지사항
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/influencer/apply')}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  협업 신청
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/influencer/my-applications')}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  내 신청 현황
                </Button>
              </CardContent>
            </Card>

            {/* 인플루언서 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">내 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium">아이디</div>
                  <div className="text-sm text-gray-600">@{influencer.username}</div>
                </div>
                {influencer.instagram_handle && (
                  <div>
                    <div className="text-sm font-medium">인스타그램</div>
                    <div className="text-sm text-gray-600">{influencer.instagram_handle}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium">최근 로그인</div>
                  <div className="text-sm text-gray-600">
                    {format(new Date(influencer.last_login_at), 'PPP pp', { locale: ko })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}