'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Users,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Instagram,
  Youtube,
  MessageCircle,
  MessageSquare,
  TrendingUp,
  ArrowLeft,
  Eye,
  Mail,
  Phone,
  MapPin,
  Star
} from 'lucide-react'
import Link from 'next/link'
import OptimizedImage from '@/components/optimized-image'

interface Influencer {
  id: string
  name: string
  email: string
  phone?: string
  instagram_handle?: string
  youtube_channel?: string
  tiktok_handle?: string
  blog_url?: string
  follower_count: number
  engagement_rate: number
  average_views: number
  content_category: string[]
  collaboration_rate: number
  preferred_collaboration_type: 'paid' | 'barter' | 'both'
  bio: string
  profile_image_url?: string
  location: string
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  created_at: string
}

export default function AdminInfluencersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [filteredInfluencers, setFilteredInfluencers] = useState<Influencer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    checkAdminAuth()
  }, [])

  useEffect(() => {
    loadInfluencers()
  }, [currentPage, statusFilter, categoryFilter])

  useEffect(() => {
    filterInfluencers()
  }, [influencers, searchTerm])

  const checkAdminAuth = () => {
    const adminUser = sessionStorage.getItem('adminUser')
    if (!adminUser) {
      router.push('/admin/login')
      return
    }
    
    const adminData = JSON.parse(adminUser)
    if (adminData.role !== 'admin' && adminData.role !== 'super_admin') {
      router.push('/admin')
      return
    }
  }

  const loadInfluencers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/influencers?page=${currentPage}&limit=${itemsPerPage}&status=${statusFilter}&category=${categoryFilter}`)
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setInfluencers(result.data)
          setTotalPages(result.pagination.totalPages)
        }
      }
    } catch (error) {
      console.error('인플루언서 목록 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterInfluencers = () => {
    let filtered = influencers
    
    if (searchTerm) {
      filtered = filtered.filter(influencer => 
        influencer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        influencer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        influencer.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredInfluencers(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '활성'
      case 'inactive':
        return '비활성'
      case 'pending':
        return '대기중'
      case 'suspended':
        return '정지'
      default:
        return '알수없음'
    }
  }

  const getCollaborationTypeText = (type: string) => {
    switch (type) {
      case 'paid':
        return '유료협업'
      case 'barter':
        return '제휴협업'
      case 'both':
        return '전체'
      default:
        return '전체'
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5 mr-1" />
            관리자 대시보드
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-7 h-7 text-blue-600" />
              인플루언서 관리
            </h1>
            <p className="text-gray-500">인플루언서 등록 현황 및 관리</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/influencers/board">
              <MessageSquare className="w-4 h-4 mr-2" />
              커뮤니티 게시판
            </Link>
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            인플루언서 등록
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">전체 인플루언서</p>
                <p className="text-2xl font-bold text-gray-900">{influencers.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">활성 인플루언서</p>
                <p className="text-2xl font-bold text-green-600">
                  {influencers.filter(inf => inf.status === 'active').length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">대기중</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {influencers.filter(inf => inf.status === 'pending').length}
                </p>
              </div>
              <MessageCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">평균 팔로워</p>
                <p className="text-2xl font-bold text-purple-600">
                  {influencers.length > 0 
                    ? Math.round(influencers.reduce((sum, inf) => sum + inf.follower_count, 0) / influencers.length / 1000) + 'K'
                    : '0'
                  }
                </p>
              </div>
              <Star className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="이름, 이메일, 지역으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="active">활성</SelectItem>
                <SelectItem value="inactive">비활성</SelectItem>
                <SelectItem value="pending">대기중</SelectItem>
                <SelectItem value="suspended">정지</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 카테고리</SelectItem>
                <SelectItem value="여행">여행</SelectItem>
                <SelectItem value="캠핑">캠핑</SelectItem>
                <SelectItem value="펜션">펜션</SelectItem>
                <SelectItem value="힐링">힐링</SelectItem>
                <SelectItem value="라이프스타일">라이프스타일</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 인플루언서 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>인플루언서 목록 ({filteredInfluencers.length}명)</span>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              필터
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          ) : filteredInfluencers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>등록된 인플루언서가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInfluencers.map((influencer) => (
                <div key={influencer.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {influencer.profile_image_url ? (
                          <OptimizedImage
                            src={influencer.profile_image_url}
                            alt={influencer.name}
                            width={48}
                            height={48}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <Users className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{influencer.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {influencer.email}
                          </div>
                          {influencer.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {influencer.phone}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {influencer.location}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {influencer.instagram_handle && (
                            <Badge variant="outline" className="text-xs">
                              <Instagram className="w-3 h-3 mr-1" />
                              {influencer.follower_count.toLocaleString()}
                            </Badge>
                          )}
                          {influencer.youtube_channel && (
                            <Badge variant="outline" className="text-xs">
                              <Youtube className="w-3 h-3 mr-1" />
                              {influencer.average_views.toLocaleString()}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {getCollaborationTypeText(influencer.preferred_collaboration_type)}
                          </Badge>
                          <Badge className={`text-xs ${getStatusColor(influencer.status)}`}>
                            {getStatusText(influencer.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm">
                        <p className="font-medium text-gray-900">
                          {influencer.collaboration_rate.toLocaleString()}원
                        </p>
                        <p className="text-gray-500">협업비용</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {influencer.bio && (
                    <p className="text-sm text-gray-600 mt-3 pl-16">{influencer.bio}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3 pl-16">
                    {influencer.content_category.map((category, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            이전
          </Button>
          <span className="text-sm text-gray-600">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  )
}