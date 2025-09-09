'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft,
  Search,
  Calendar,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  FileText
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Application {
  id: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  final_status: 'pending' | 'in_progress' | 'review_pending' | 'completed'
  accommodation: {
    id: string
    name: string
    location: string
    images?: string[]
  }
  check_in_date: string
  check_out_date: string
  guest_count: number
  request_type: 'free' | 'paid'
  message: string
  created_at: string
  updated_at: string
  host_response?: string
}

export default function MyApplicationsPage() {
  const router = useRouter()
  const [influencer, setInfluencer] = useState<any>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    // 인플루언서 로그인 체크
    const userData = sessionStorage.getItem('influencerUser')
    if (!userData) {
      router.push('/influencer/login')
      return
    }

    const influencerData = JSON.parse(userData)
    setInfluencer(influencerData)
    loadApplications(influencerData.id)
  }, [router])

  useEffect(() => {
    // 필터 적용
    let filtered = applications

    // 검색 필터
    if (searchQuery.trim()) {
      filtered = filtered.filter(app => 
        app.accommodation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.accommodation.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter)
    }

    setFilteredApplications(filtered)
  }, [applications, searchQuery, statusFilter])

  const loadApplications = async (influencerId: string) => {
    try {
      const response = await fetch(`/api/influencer/my-applications?influencer_id=${influencerId}`)
      const result = await response.json()
      
      if (result.success) {
        setApplications(result.data)
      } else {
        console.error('신청 내역 로드 실패:', result.error)
      }
    } catch (error) {
      console.error('신청 내역 로드 에러:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string, finalStatus: string) => {
    if (status === 'pending') {
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-300">
          <Clock className="mr-1 w-3 h-3" />
          대기중
        </Badge>
      )
    } else if (status === 'accepted') {
      if (finalStatus === 'completed') {
        return (
          <Badge className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="mr-1 w-3 h-3" />
            완료
          </Badge>
        )
      } else if (finalStatus === 'in_progress') {
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700">
            <FileText className="mr-1 w-3 h-3" />
            진행중
          </Badge>
        )
      } else if (finalStatus === 'review_pending') {
        return (
          <Badge className="bg-orange-600 hover:bg-orange-700">
            <AlertCircle className="mr-1 w-3 h-3" />
            검토대기
          </Badge>
        )
      }
      return (
        <Badge className="bg-blue-600 hover:bg-blue-700">
          <CheckCircle className="mr-1 w-3 h-3" />
          승인됨
        </Badge>
      )
    } else if (status === 'rejected') {
      return (
        <Badge variant="destructive">
          <X className="mr-1 w-3 h-3" />
          거부됨
        </Badge>
      )
    }
    return <Badge variant="secondary">{status}</Badge>
  }

  const getRequestTypeBadge = (requestType: string) => {
    return requestType === 'free' ? (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        무상 협업
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
        유상 협업 (30%)
      </Badge>
    )
  }

  if (loading) {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/influencer/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            대시보드
          </Button>
          <div>
            <h1 className="text-2xl font-bold">내 신청 현황</h1>
            <p className="text-gray-600">협업 신청 내역과 진행 상황을 확인할 수 있습니다</p>
          </div>
        </div>

        {/* 필터 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="숙소명이나 지역으로 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="상태 필터" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="pending">대기중</SelectItem>
                    <SelectItem value="accepted">승인됨</SelectItem>
                    <SelectItem value="rejected">거부됨</SelectItem>
                    <SelectItem value="completed">완료</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {applications.length}
              </div>
              <div className="text-sm text-gray-600">총 신청</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {applications.filter(app => app.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">대기중</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-green-600">
                {applications.filter(app => app.status === 'accepted').length}
              </div>
              <div className="text-sm text-gray-600">승인됨</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {applications.filter(app => app.final_status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">완료</div>
            </CardContent>
          </Card>
        </div>

        {/* 신청 내역 목록 */}
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">신청 내역이 없습니다</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || statusFilter !== 'all' 
                  ? '검색 조건에 맞는 신청이 없습니다' 
                  : '아직 협업 신청을 하지 않았습니다'}
              </p>
              <Button onClick={() => router.push('/influencer/apply')}>
                협업 신청하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <Card key={application.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* 숙소 정보 */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-1">
                            {application.accommodation.name}
                          </h3>
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <MapPin className="w-4 h-4 mr-1" />
                            {application.accommodation.location}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {format(new Date(application.check_in_date), 'PPP', { locale: ko })}
                            </div>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {application.guest_count}명
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(application.status, application.final_status)}
                          {getRequestTypeBadge(application.request_type)}
                        </div>
                      </div>

                      {/* 메시지 */}
                      {application.message && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-4">
                          <div className="text-sm font-medium text-gray-700 mb-1">신청 메시지</div>
                          <div className="text-sm text-gray-600 whitespace-pre-wrap">
                            {application.message}
                          </div>
                        </div>
                      )}

                      {/* 호스트 응답 */}
                      {application.host_response && (
                        <div className="bg-blue-50 p-3 rounded-lg mb-4">
                          <div className="text-sm font-medium text-blue-700 mb-1">호스트 응답</div>
                          <div className="text-sm text-blue-600 whitespace-pre-wrap">
                            {application.host_response}
                          </div>
                        </div>
                      )}

                      {/* 하단 정보 */}
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t">
                        <div>신청일: {format(new Date(application.created_at), 'PPP pp', { locale: ko })}</div>
                        {application.updated_at !== application.created_at && (
                          <div>수정일: {format(new Date(application.updated_at), 'PPP pp', { locale: ko })}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}