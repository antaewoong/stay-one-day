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
  Star,
  X
} from 'lucide-react'
import Link from 'next/link'
import OptimizedImage from '@/components/optimized-image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'react-hot-toast'

interface SocialMediaLink {
  platform: string
  url: string
}

interface Influencer {
  id: string
  name: string
  email: string
  phone?: string
  social_media_links: SocialMediaLink[]
  follower_count: number
  engagement_rate: number
  average_views: number
  content_category: string[]
  collaboration_rate: number
  preferred_collaboration_type: 'free' | 'paid'
  bio: string
  profile_image_url?: string
  location: string
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  created_at: string
  ai_evaluation?: any
  ai_evaluation_date?: string
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
  
  // 인플루언서 등록 모달 상태
  const [showAddModal, setShowAddModal] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null)
  const [newInfluencer, setNewInfluencer] = useState({
    name: '',
    email: '',
    phone: '',
    social_media_links: [{ platform: '', url: '' }],
    follower_count: 0,
    content_category: [] as string[],
    preferred_collaboration_type: 'free',
    bio: '',
    location: ''
  })

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

  // 인플루언서 등록 함수
  const handleAddInfluencer = async () => {
    try {
      setAddLoading(true)

      if (!newInfluencer.name.trim() || !newInfluencer.email.trim()) {
        toast.error('이름과 이메일은 필수입니다')
        return
      }

      const response = await fetch('/api/admin/influencers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newInfluencer)
      })

      if (!response.ok) {
        throw new Error('인플루언서 등록 실패')
      }

      const result = await response.json()
      if (result.success) {
        toast.success('인플루언서가 성공적으로 등록되었습니다')
        setShowAddModal(false)
        setNewInfluencer({
          name: '',
          email: '',
          phone: '',
          social_media_links: [{ platform: '', url: '' }],
          follower_count: 0,
          content_category: [],
          preferred_collaboration_type: 'free',
          bio: '',
          location: ''
        })
        await loadInfluencers()
      } else {
        throw new Error(result.error || '등록 실패')
      }
    } catch (error) {
      console.error('인플루언서 등록 오류:', error)
      toast.error('등록에 실패했습니다')
    } finally {
      setAddLoading(false)
    }
  }

  const addSocialMediaLink = () => {
    setNewInfluencer(prev => ({
      ...prev,
      social_media_links: [...prev.social_media_links, { platform: '', url: '' }]
    }))
  }

  const removeSocialMediaLink = (index: number) => {
    setNewInfluencer(prev => ({
      ...prev,
      social_media_links: prev.social_media_links.filter((_, i) => i !== index)
    }))
  }

  const handleSocialMediaLinkChange = (index: number, field: string, value: string) => {
    setNewInfluencer(prev => ({
      ...prev,
      social_media_links: prev.social_media_links.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }))
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
        return '유상협업'
      case 'free':
        return '무료협업'
      default:
        return '무료협업'
    }
  }

  const getAIGradeColor = (grade: string) => {
    switch (grade) {
      case 'SS':
        return 'bg-purple-100 text-purple-800'
      case 'S':
        return 'bg-red-100 text-red-800'
      case 'A':
        return 'bg-orange-100 text-orange-800'
      case 'B':
        return 'bg-yellow-100 text-yellow-800'
      case 'C':
        return 'bg-blue-100 text-blue-800'
      case 'D':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setShowAddModal(true)}
          >
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
                <SelectItem value="가족여행">가족여행</SelectItem>
                <SelectItem value="커플여행">커플여행</SelectItem>
                <SelectItem value="동성친구">동성친구</SelectItem>
                <SelectItem value="나홀로여행">나홀로여행</SelectItem>
                <SelectItem value="대가족모임">대가족모임</SelectItem>
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
                          {influencer.social_media_links?.map((link, index) => {
                            if (!link.platform || !link.url) return null
                            const Icon = link.platform === 'instagram' ? Instagram : 
                                        link.platform === 'youtube' ? Youtube : MessageCircle
                            return (
                              <Badge key={index} variant="outline" className="text-xs">
                                <Icon className="w-3 h-3 mr-1" />
                                {link.platform === 'instagram' ? influencer.follower_count.toLocaleString() : 
                                 link.platform === 'youtube' ? influencer.average_views.toLocaleString() : 
                                 link.platform}
                              </Badge>
                            )
                          })}
                          <Badge variant="outline" className="text-xs">
                            {getCollaborationTypeText(influencer.preferred_collaboration_type)}
                          </Badge>
                          <Badge className={`text-xs ${getStatusColor(influencer.status)}`}>
                            {getStatusText(influencer.status)}
                          </Badge>
                          {influencer.ai_evaluation?.grade && (
                            <Badge className={`text-xs ${getAIGradeColor(influencer.ai_evaluation.grade)}`}>
                              AI: {influencer.ai_evaluation.grade}급
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm">
                        <p className="font-medium text-gray-900">
                          {influencer.follower_count.toLocaleString()}명
                        </p>
                        <p className="text-gray-500">팔로워</p>
                        {influencer.ai_evaluation && (
                          <p className="text-xs text-blue-600 mt-1">
                            AI 점수: {influencer.ai_evaluation.overall_score}/100
                          </p>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => influencer.ai_evaluation && showAIEvaluation(influencer)}
                        disabled={!influencer.ai_evaluation}
                      >
                        {influencer.ai_evaluation ? <Eye className="w-4 h-4" /> : <MoreVertical className="w-4 h-4" />}
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

      {/* 인플루언서 등록 모달 */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl bg-white border shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">인플루언서 등록</DialogTitle>
            <DialogDescription className="text-gray-600">
              새로운 인플루언서를 등록합니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
            {/* 기본 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">이름 *</Label>
                <Input
                  id="name"
                  value={newInfluencer.name}
                  onChange={(e) => setNewInfluencer(prev => ({...prev, name: e.target.value}))}
                  placeholder="이름을 입력하세요"
                  className="bg-white border"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium">이메일 *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newInfluencer.email}
                  onChange={(e) => setNewInfluencer(prev => ({...prev, email: e.target.value}))}
                  placeholder="이메일을 입력하세요"
                  className="bg-white border"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="text-sm font-medium">전화번호</Label>
                <Input
                  id="phone"
                  value={newInfluencer.phone}
                  onChange={(e) => setNewInfluencer(prev => ({...prev, phone: e.target.value}))}
                  placeholder="010-0000-0000"
                  className="bg-white border"
                />
              </div>
              <div>
                <Label htmlFor="location" className="text-sm font-medium">지역</Label>
                <Input
                  id="location"
                  value={newInfluencer.location}
                  onChange={(e) => setNewInfluencer(prev => ({...prev, location: e.target.value}))}
                  placeholder="활동 지역"
                  className="bg-white border"
                />
              </div>
            </div>

            {/* 소셜 미디어 링크 */}
            <div>
              <Label className="text-sm font-medium mb-3 block">소셜 미디어 & 채널</Label>
              <div className="space-y-3">
                {newInfluencer.social_media_links.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <select
                      value={link.platform}
                      onChange={(e) => handleSocialMediaLinkChange(index, 'platform', e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-md bg-white min-w-[140px]"
                    >
                      <option value="">플랫폼 선택</option>
                      <option value="instagram">인스타그램</option>
                      <option value="youtube">유튜브</option>
                      <option value="tiktok">틱톡</option>
                      <option value="blog">블로그</option>
                      <option value="facebook">페이스북</option>
                      <option value="twitter">트위터</option>
                      <option value="linkedin">링크드인</option>
                      <option value="twitch">트위치</option>
                      <option value="other">기타</option>
                    </select>
                    <Input
                      value={link.url}
                      onChange={(e) => handleSocialMediaLinkChange(index, 'url', e.target.value)}
                      placeholder="채널 URL 또는 핸들 (@username)"
                      className="bg-white border flex-1"
                    />
                    {newInfluencer.social_media_links.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeSocialMediaLink(index)}
                        className="px-3 bg-white border-red-200 hover:bg-red-50 text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSocialMediaLink}
                  className="mt-2 bg-white border-blue-200 hover:bg-blue-50 text-blue-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  채널 추가
                </Button>
              </div>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="followers" className="text-sm font-medium">팔로워 수(대표채널)</Label>
                <Input
                  id="followers"
                  type="number"
                  value={newInfluencer.follower_count}
                  onChange={(e) => setNewInfluencer(prev => ({...prev, follower_count: parseInt(e.target.value) || 0}))}
                  placeholder="0"
                  className="bg-white border"
                />
              </div>
            </div>

            {/* 협업 유형 */}
            <div>
              <Label className="text-sm font-medium">선호 협업 유형</Label>
              <Select 
                value={newInfluencer.preferred_collaboration_type} 
                onValueChange={(value) => setNewInfluencer(prev => ({...prev, preferred_collaboration_type: value}))}
              >
                <SelectTrigger className="bg-white border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg">
                  <SelectItem value="free">무료 협업</SelectItem>
                  <SelectItem value="paid">유상 협업</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 콘텐츠 카테고리 */}
            <div>
              <Label className="text-sm font-medium mb-2 block">콘텐츠 카테고리</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  '가족여행', '커플여행', '동성친구', '나홀로여행', '대가족모임'
                ].map((category) => (
                  <Button
                    key={category}
                    type="button"
                    variant={newInfluencer.content_category.includes(category) ? "default" : "outline"}
                    size="sm"
                    className={`text-xs ${newInfluencer.content_category.includes(category) ? 'bg-blue-600 text-white' : 'bg-white border'}`}
                    onClick={() => handleCategoryToggle(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* 소개 */}
            <div>
              <Label htmlFor="bio" className="text-sm font-medium">소개</Label>
              <Textarea
                id="bio"
                value={newInfluencer.bio}
                onChange={(e) => setNewInfluencer(prev => ({...prev, bio: e.target.value}))}
                placeholder="인플루언서 소개를 입력하세요"
                className="bg-white border resize-none h-20"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowAddModal(false)}
              className="bg-white border"
            >
              취소
            </Button>
            <Button 
              onClick={handleAddInfluencer}
              disabled={addLoading || !newInfluencer.name.trim() || !newInfluencer.email.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {addLoading ? '등록 중...' : '등록하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI 평가 결과 모달 */}
      <Dialog open={showAIModal} onOpenChange={setShowAIModal}>
        <DialogContent className="max-w-4xl bg-white border shadow-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Star className="w-6 h-6 text-purple-600" />
              AI 인플루언서 평가 결과 - {selectedInfluencer?.name}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              AI가 분석한 인플루언서의 상세 평가 결과입니다.
            </DialogDescription>
          </DialogHeader>

          {selectedInfluencer?.ai_evaluation && (
            <div className="space-y-6 py-4">
              {/* 종합 점수 및 등급 */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="text-center">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedInfluencer.ai_evaluation.overall_score}/100
                    </div>
                    <div className="text-sm text-gray-600">종합 점수</div>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="p-4">
                    <div className={`text-2xl font-bold px-3 py-1 rounded-full inline-block ${getAIGradeColor(selectedInfluencer.ai_evaluation.grade)}`}>
                      {selectedInfluencer.ai_evaluation.grade}급
                    </div>
                    <div className="text-sm text-gray-600 mt-2">AI 등급</div>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="p-4">
                    <div className="text-lg font-semibold text-blue-600">
                      {selectedInfluencer.ai_evaluation.final_recommendation}
                    </div>
                    <div className="text-sm text-gray-600">최종 추천</div>
                  </CardContent>
                </Card>
              </div>

              {/* 상세 점수 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">세부 평가 점수</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedInfluencer.ai_evaluation.detailed_scores && Object.entries(selectedInfluencer.ai_evaluation.detailed_scores).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">
                          {key === 'blog_quality' && '블로그 품질'}
                          {key === 'sns_engagement' && 'SNS 참여도'}
                          {key === 'accommodation_marketing' && '숙박 마케팅 적합성'}
                          {key === 'target_audience' && '타겟 오디언스'}
                          {key === 'roi_prediction' && 'ROI 예측'}
                        </span>
                        <span className="font-bold text-blue-600">{value}/25</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 마케팅 인사이트 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">마케팅 인사이트</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">주요 타겟층</h4>
                      <p className="text-gray-600">{selectedInfluencer.ai_evaluation.marketing_insights?.primary_audience}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">최적 포스팅 시간</h4>
                      <p className="text-gray-600">{selectedInfluencer.ai_evaluation.marketing_insights?.peak_engagement_time}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">전문 분야</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedInfluencer.ai_evaluation.marketing_insights?.content_specialty?.map((specialty: string, index: number) => (
                          <Badge key={index} variant="secondary">{specialty}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">계절별 트렌드</h4>
                      <p className="text-gray-600">{selectedInfluencer.ai_evaluation.marketing_insights?.seasonal_trends}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 협업 분석 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">협업 분석</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">추천 협업 유형</h4>
                      <p className="text-blue-600 font-medium">{selectedInfluencer.ai_evaluation.collaboration_analysis?.recommended_collaboration_type}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">예상 전환율</h4>
                      <p className="text-green-600 font-medium">{selectedInfluencer.ai_evaluation.collaboration_analysis?.expected_conversion_rate}</p>
                    </div>
                    <div className="col-span-2">
                      <h4 className="font-semibold text-gray-900 mb-2">적합한 숙박 유형</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedInfluencer.ai_evaluation.collaboration_analysis?.optimal_accommodation_types?.map((type: string, index: number) => (
                          <Badge key={index} className="bg-blue-100 text-blue-800">{type}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 강점과 약점 */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-green-600">강점</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedInfluencer.ai_evaluation.strengths?.map((strength: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-orange-600">개선점</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedInfluencer.ai_evaluation.weaknesses?.map((weakness: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700">{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* 추천사항 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-blue-600">추천사항</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {selectedInfluencer.ai_evaluation.recommendations?.map((recommendation: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* 평가 일시 */}
              <div className="text-center text-sm text-gray-500">
                평가 일시: {selectedInfluencer.ai_evaluation_date ? new Date(selectedInfluencer.ai_evaluation_date).toLocaleString('ko-KR') : '정보 없음'}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowAIModal(false)} className="bg-gray-600 hover:bg-gray-700">
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )


  function handleCategoryToggle(category: string) {
    setNewInfluencer(prev => ({
      ...prev,
      content_category: prev.content_category.includes(category)
        ? prev.content_category.filter(c => c !== category)
        : [...prev.content_category, category]
    }))
  }

  function showAIEvaluation(influencer: Influencer) {
    setSelectedInfluencer(influencer)
    setShowAIModal(true)
  }

}