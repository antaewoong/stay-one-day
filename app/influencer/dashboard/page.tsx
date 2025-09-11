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
import { createClient } from '@/lib/supabase/client'

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
  accommodations: {
    id: string
    name: string
    address: string
    region: string
    city: string
    base_price: number
    images: string[]
  }
  check_in_date: string
  created_at: string
}

export default function InfluencerDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [influencer, setInfluencer] = useState<InfluencerData | null>(null)
  const [currentPeriod, setCurrentPeriod] = useState<CollaborationPeriod | null>(null)
  const [myApplications, setMyApplications] = useState<MyApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInfluencerData()
  }, [router])

  const loadInfluencerData = async () => {
    try {
      console.log('🔍 인플루언서 대시보드 인증 확인 시작')
      
      // Supabase Auth에서 현재 사용자 확인
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.log('❌ 인증되지 않은 사용자, 로그인 페이지로 이동')
        router.push('/influencer/login')
        return
      }

      console.log('✅ 인증된 사용자:', user.id)

      // influencers 테이블에서 인플루언서 정보 조회 (RLS 정책 적용)
      const { data: influencerData, error: influencerError } = await supabase
        .from('influencers')
        .select('*')
        .eq('auth_user_id', user.id)
        .eq('status', 'active')
        .single()

      if (influencerError || !influencerData) {
        console.error('❌ 인플루언서 정보 조회 실패:', influencerError?.message)
        router.push('/influencer/login')
        return
      }

      console.log('✅ 인플루언서 정보 조회 성공:', influencerData.name)
      setInfluencer(influencerData)
      loadDashboardData(influencerData.id)
    } catch (error) {
      console.error('💥 인플루언서 데이터 로드 에러:', error)
      router.push('/influencer/login')
    }
  }

  const loadDashboardData = async (influencerId: string) => {
    try {
      console.log('📊 대시보드 데이터 로드 시작, influencerId:', influencerId)
      
      // 현재 협업 기간 정보 로드 (Supabase에서 직접)
      const { data: periodData, error: periodError } = await supabase
        .from('collaboration_periods')
        .select('*')
        .eq('is_open', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!periodError && periodData) {
        setCurrentPeriod(periodData)
      }

      // 내 신청 현황 로드 (RLS 정책으로 보안, 조인 없이 단계별 조회)
      console.log('📋 내 신청 현황 직접 조회, influencerId:', influencerId)
      
      // 1단계: 내 신청 정보만 먼저 가져오기
      const { data: requestsData, error: requestsError } = await supabase
        .from('influencer_collaboration_requests')
        .select(`
          id,
          accommodation_id,
          request_type,
          proposed_rate,
          message,
          check_in_date,
          check_out_date,
          guest_count,
          status,
          final_status,
          admin_notes,
          review_submitted_at,
          review_content,
          review_links,
          created_at,
          updated_at
        `)
        .eq('influencer_id', influencerId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (requestsError) {
        console.error('❌ 신청 현황 조회 에러:', requestsError)
      } else if (requestsData && requestsData.length > 0) {
        // 2단계: 숙소 정보 별도로 가져오기
        const accommodationIds = requestsData.map(req => req.accommodation_id)
        const { data: accommodationsData, error: accommodationsError } = await supabase
          .from('accommodations')
          .select('id, name, address, region, city, base_price, images')
          .in('id', accommodationIds)

        if (!accommodationsError && accommodationsData) {
          // 3단계: 데이터 조합
          const combinedData = requestsData.map(request => ({
            ...request,
            accommodations: accommodationsData.find(acc => acc.id === request.accommodation_id)
          }))
          
          setMyApplications(combinedData as MyApplication[])
          console.log('✅ 신청 현황 조회 성공:', combinedData.length, '건')
        } else {
          console.error('❌ 숙소 정보 조회 에러:', accommodationsError)
        }
      } else {
        console.log('📋 신청 현황 없음')
        setMyApplications([])
      }
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/influencer/login')
    } catch (error) {
      console.error('로그아웃 에러:', error)
      router.push('/influencer/login')
    }
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
                <p className="text-sm text-gray-600 hidden sm:block">인플루언서 협업 플랫폼</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="text-right hidden md:block">
                <div className="font-medium">{influencer.name}</div>
                <div className="text-sm text-gray-600">{influencer.email}</div>
              </div>
              <div className="block md:hidden">
                <div className="text-sm font-medium">{influencer.name}</div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-1 md:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">로그아웃</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* 왼쪽 컬럼 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 웰컴 카드 */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  안녕하세요, {influencer.name}님!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 md:gap-4">
                  <div className="text-center p-3 md:p-4 bg-blue-50 rounded-lg">
                    <div className="text-lg md:text-2xl font-bold text-blue-600">
                      {influencer.follower_count?.toLocaleString()}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600">팔로워</div>
                  </div>
                  <div className="text-center p-3 md:p-4 bg-green-50 rounded-lg">
                    <div className="text-lg md:text-2xl font-bold text-green-600">
                      {myApplications.filter(app => app.status === 'accepted').length}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600">승인된 협업</div>
                  </div>
                  <div className="text-center p-3 md:p-4 bg-purple-50 rounded-lg">
                    <div className="text-lg md:text-2xl font-bold text-purple-600">
                      {myApplications.filter(app => app.final_status === 'completed').length}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600">완료된 협업</div>
                  </div>
                </div>
                <div className="mt-4 text-xs md:text-sm text-gray-600">
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
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    최근 신청 현황
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/influencer/my-applications')}
                    className="text-xs"
                  >
                    <span className="hidden sm:inline">전체 보기</span>
                    <span className="sm:hidden">전체</span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {myApplications.length === 0 ? (
                  <div className="text-center py-6 md:py-8 text-gray-500">
                    <AlertCircle className="mx-auto h-8 md:h-12 w-8 md:w-12 text-gray-400 mb-3 md:mb-4" />
                    <p className="text-sm md:text-base">아직 신청한 협업이 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    {myApplications.slice(0, 3).map((application) => (
                      <div key={application.id} className="border rounded-lg p-3 md:p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm md:text-base truncate">{application.accommodations.name}</h4>
                            <p className="text-xs md:text-sm text-gray-600 truncate">
                              {application.accommodations.region} {application.accommodations.city}
                            </p>
                          </div>
                          <div className="ml-2 flex-shrink-0">
                            {getStatusBadge(application.status, application.final_status)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">
                            체크인: {format(new Date(application.check_in_date), 'MM/dd', { locale: ko })}
                          </div>
                          <div className="text-xs text-gray-500">
                            신청일: {format(new Date(application.created_at), 'MM/dd', { locale: ko })}
                          </div>
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
                    {influencer.last_login_at 
                      ? format(new Date(influencer.last_login_at), 'PPP pp', { locale: ko })
                      : '로그인 기록 없음'
                    }
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