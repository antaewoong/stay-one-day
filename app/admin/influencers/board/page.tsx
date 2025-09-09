'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  MessageSquare,
  Search,
  Plus,
  Heart,
  Eye,
  MessageCircle,
  ArrowLeft,
  Filter,
  Pin,
  Trash2,
  Edit,
  Calendar,
  User,
  TrendingUp,
  Star
} from 'lucide-react'
import Link from 'next/link'
import OptimizedImage from '@/components/optimized-image'

interface InfluencerPost {
  id: string
  influencer_id: string
  influencer_name: string
  influencer_profile_image?: string
  title: string
  content: string
  post_type: 'general' | 'collaboration_request' | 'showcase' | 'question'
  images: string[]
  tags: string[]
  likes_count: number
  comments_count: number
  views_count: number
  is_featured: boolean
  status: 'published' | 'draft' | 'hidden'
  created_at: string
  updated_at: string
}

export default function InfluencerBoardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [posts, setPosts] = useState<InfluencerPost[]>([])
  const [filteredPosts, setFilteredPosts] = useState<InfluencerPost[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 20

  // Mock data for development
  const mockPosts: InfluencerPost[] = [
    {
      id: '1',
      influencer_id: '1',
      influencer_name: '여행러버_지은',
      influencer_profile_image: 'https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=150&h=150&fit=crop&crop=face',
      title: '제주도 감성 펜션 협업 후기 📸',
      content: '안녕하세요! 지난주 제주도 감성 펜션에서 2박 3일 동안 머물며 촬영한 컨텐츠를 공유드려요. 숙소 분위기가 정말 좋아서 인스타그램 반응도 폭발적이었답니다! 특히 노을 뷰가 정말 예술이었어요 ✨\n\n다음에 또 협업 기회가 있다면 꼭 다시 방문하고 싶습니다. 호스트분도 너무 친절하셨고, 체크인/아웃 과정도 매우 스무스했어요!',
      post_type: 'showcase',
      images: [
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop'
      ],
      tags: ['제주도', '펜션', '협업후기', '인스타그램'],
      likes_count: 24,
      comments_count: 8,
      views_count: 156,
      is_featured: true,
      status: 'published',
      created_at: '2024-02-10T14:30:00Z',
      updated_at: '2024-02-10T14:30:00Z'
    },
    {
      id: '2',
      influencer_id: '2',
      influencer_name: '감성캠핑_민수',
      influencer_profile_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      title: '강원도 글램핑장 협업 문의',
      content: '안녕하세요! 캠핑 콘텐츠 전문 인플루언서입니다.\n\n현재 3월 중순경 강원도 글램핑장과 협업을 원하고 있습니다. 제 채널 특성상 자연 속에서의 힐링 컨텐츠를 주로 다루고 있어서, 글램핑장과 궁합이 잘 맞을 것 같아요.\n\n팔로워: 28,000명 (인스타그램)\n평균 좋아요: 1,200~1,800개\n영상 조회수: 평균 12,000회\n\n관심 있으신 호스트분들은 댓글이나 DM으로 연락 부탁드립니다!',
      post_type: 'collaboration_request',
      images: [],
      tags: ['강원도', '글램핑', '협업요청', '힐링'],
      likes_count: 15,
      comments_count: 12,
      views_count: 89,
      is_featured: false,
      status: 'published',
      created_at: '2024-02-09T09:15:00Z',
      updated_at: '2024-02-09T09:15:00Z'
    },
    {
      id: '3',
      influencer_id: '3',
      influencer_name: '펜션리뷰_소영',
      influencer_profile_image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      title: '협업 시 주의사항 공유드려요',
      content: '인플루언서 활동을 한 지 2년이 되면서 느낀 점들을 공유해드립니다.\n\n1. 계약서는 반드시 작성하기\n2. 촬영 일정과 컨텐츠 업로드 일정 명확히 하기\n3. 사용할 수 있는 사진/영상 범위 확인하기\n4. 협업비 지급 시기 명시하기\n\n서로 윈윈하는 좋은 협업 문화를 만들어가요! 궁금한 점 있으시면 언제든 댓글 남겨주세요 😊',
      post_type: 'general',
      images: [],
      tags: ['협업팁', '주의사항', '인플루언서'],
      likes_count: 42,
      comments_count: 18,
      views_count: 203,
      is_featured: false,
      status: 'published',
      created_at: '2024-02-08T16:45:00Z',
      updated_at: '2024-02-08T16:45:00Z'
    },
    {
      id: '4',
      influencer_id: '4',
      influencer_name: '힐링스테이_준호',
      influencer_profile_image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      title: '숙박업 사진 촬영 팁 질문드려요',
      content: '안녕하세요! 숙박업 전문 인플루언서로 활동하고 있는데, 최근 촬영 퀄리티를 더 높이고 싶어서 질문드려요.\n\n특히 실내 조명이 어두운 펜션이나 독채에서 촬영할 때 어떤 장비나 설정을 사용하시는지 궁금합니다.\n\n현재 사용 장비:\n- 카메라: 소니 A7 III\n- 렌즈: 24-70mm F2.8\n- 조명: 휴대용 LED 패널 1개\n\n더 자연스럽고 감성적인 사진을 찍고 싶어요. 조언 부탁드립니다! 🙏',
      post_type: 'question',
      images: [
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'
      ],
      tags: ['사진촬영', '장비', '조명', '팁'],
      likes_count: 18,
      comments_count: 25,
      views_count: 134,
      is_featured: false,
      status: 'published',
      created_at: '2024-02-07T11:20:00Z',
      updated_at: '2024-02-07T11:20:00Z'
    }
  ]

  useEffect(() => {
    checkAdminAuth()
    loadPosts()
  }, [])

  useEffect(() => {
    filterPosts()
  }, [posts, searchTerm, typeFilter])

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

  const loadPosts = async () => {
    setLoading(true)
    try {
      // For now, use mock data
      setPosts(mockPosts)
      setTotalPages(1)
    } catch (error) {
      console.error('게시글 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterPosts = () => {
    let filtered = posts
    
    if (searchTerm) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.influencer_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(post => post.post_type === typeFilter)
    }
    
    setFilteredPosts(filtered)
  }

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'general':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'collaboration_request':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'showcase':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'question':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPostTypeText = (type: string) => {
    switch (type) {
      case 'general':
        return '일반'
      case 'collaboration_request':
        return '협업요청'
      case 'showcase':
        return '후기'
      case 'question':
        return '질문'
      default:
        return '일반'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/influencers" className="flex items-center text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5 mr-1" />
            인플루언서 관리
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-7 h-7 text-blue-600" />
              인플루언서 커뮤니티
            </h1>
            <p className="text-gray-500">인플루언서들의 게시글 및 소통 현황</p>
          </div>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          공지 작성
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">전체 게시글</p>
                <p className="text-2xl font-bold text-gray-900">{posts.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">협업 요청</p>
                <p className="text-2xl font-bold text-green-600">
                  {posts.filter(post => post.post_type === 'collaboration_request').length}
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
                <p className="text-sm font-medium text-gray-600">후기 게시글</p>
                <p className="text-2xl font-bold text-purple-600">
                  {posts.filter(post => post.post_type === 'showcase').length}
                </p>
              </div>
              <Star className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 조회수</p>
                <p className="text-2xl font-bold text-orange-600">
                  {posts.reduce((sum, post) => sum + post.views_count, 0).toLocaleString()}
                </p>
              </div>
              <Eye className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="제목, 내용, 작성자로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="게시글 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 유형</SelectItem>
                <SelectItem value="general">일반</SelectItem>
                <SelectItem value="collaboration_request">협업요청</SelectItem>
                <SelectItem value="showcase">후기</SelectItem>
                <SelectItem value="question">질문</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 게시글 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>게시글 목록 ({filteredPosts.length}개)</span>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              정렬
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>게시글이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPosts.map((post) => (
                <div key={post.id} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {post.influencer_profile_image ? (
                          <OptimizedImage
                            src={post.influencer_profile_image}
                            alt={post.influencer_name}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{post.influencer_name}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {formatDate(post.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getPostTypeColor(post.post_type)}`}>
                        {getPostTypeText(post.post_type)}
                      </Badge>
                      {post.is_featured && (
                        <Pin className="w-4 h-4 text-yellow-600" />
                      )}
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{post.title}</h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">{post.content}</p>
                  
                  {post.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                      {post.images.slice(0, 4).map((image, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <OptimizedImage
                            src={image}
                            alt={`${post.title} ${index + 1}`}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {post.tags.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      {post.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {post.likes_count}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {post.comments_count}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {post.views_count}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}