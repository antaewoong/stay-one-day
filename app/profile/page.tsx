'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { 
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Heart,
  Star,
  Shield,
  Camera,
  Edit,
  Save,
  Settings,
  CreditCard,
  Bell,
  Globe,
  Lock,
  Trash2,
  Award,
  Clock,
  Eye,
  MessageCircle,
  Gift,
  Bookmark,
  History
} from 'lucide-react'
import Header from '@/components/header'
import Link from 'next/link'

interface UserProfile {
  id: string
  full_name: string
  email: string
  phone: string
  avatar_url: string
  bio: string
  birth_date: string
  location: string
  join_date: string
  verified: boolean
  host_status: string
  preferences: {
    language: string
    currency: string
    notifications: {
      email: boolean
      sms: boolean
      push: boolean
    }
  }
}

interface UserStats {
  total_bookings: number
  total_nights: number
  favorite_destinations: string[]
  member_since: string
  average_rating: number
  reviews_count: number
  wishlist_count: number
}

export default function ProfilePage() {
  const supabase = createClient()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editingData, setEditingData] = useState<Partial<UserProfile>>({})

  // 실제 사용자 데이터 로드
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          setLoading(false)
          return
        }

        // 사용자 기본 정보 설정
        const userProfile: UserProfile = {
          id: user.id,
          full_name: user.user_metadata?.full_name || '사용자',
          email: user.email || '',
          phone: user.user_metadata?.phone || '',
          avatar_url: user.user_metadata?.avatar_url || '/api/placeholder/150/150',
          bio: '스테이원데이 사용자입니다.',
          birth_date: '',
          location: '한국',
          join_date: user.created_at,
          verified: true,
          host_status: 'guest',
          preferences: {
            language: 'ko',
            currency: 'KRW',
            notifications: {
              email: true,
              sms: true,
              push: true
            }
          }
        }

        // 예약 통계 가져오기
        const { data: reservations } = await supabase
          .from('reservations')
          .select('*')
          .eq('guest_email', user.email)

        const userStats: UserStats = {
          total_bookings: reservations?.length || 0,
          total_nights: reservations?.reduce((sum, r) => {
            const checkin = new Date(r.checkin_date)
            const checkout = new Date(r.checkout_date)
            const diffTime = Math.abs(checkout.getTime() - checkin.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            return sum + diffDays
          }, 0) || 0,
          favorite_destinations: ['청주', '대전', '세종'],
          member_since: user.created_at,
          average_rating: 4.8,
          reviews_count: 0,
          wishlist_count: 0
        }

        setUser(userProfile)
        setUserStats(userStats)
        setEditingData(userProfile)
      } catch (error) {
        console.error('사용자 데이터 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [])

  const handleSaveProfile = async () => {
    if (!user || !editingData) return
    
    // 실제로는 Supabase에 저장
    setUser({ ...user, ...editingData })
    setIsEditing(false)
    
    // 성공 메시지 표시
    alert('프로필이 성공적으로 업데이트되었습니다!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">프로필 로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user || !userStats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">사용자 정보를 불러올 수 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* 프로필 헤더 */}
          <Card className="border-0 shadow-lg mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-32"></div>
            <CardContent className="p-0">
              <div className="px-6 pb-6">
                <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-16">
                  <div className="relative">
                    <img 
                      src={user.avatar_url} 
                      alt={user.full_name}
                      className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                    <button className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow">
                      <Camera className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  
                  <div className="flex-1 mt-4 md:mt-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-2xl font-bold text-gray-900">{user.full_name}</h1>
                      {user.verified && (
                        <Shield className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{user.bio}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {user.location}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(user.join_date).getFullYear()}년부터 회원
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant={isEditing ? "default" : "outline"} 
                      onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                    >
                      {isEditing ? (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          저장
                        </>
                      ) : (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          편집
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 통계 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-0 shadow-md text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600 mb-1">{userStats.total_bookings}</div>
                <div className="text-sm text-gray-600">총 예약 수</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600 mb-1">{userStats.total_nights}</div>
                <div className="text-sm text-gray-600">총 숙박일</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600 mb-1">{userStats.average_rating}</div>
                <div className="text-sm text-gray-600">평균 평점</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600 mb-1">{userStats.wishlist_count}</div>
                <div className="text-sm text-gray-600">위시리스트</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid grid-cols-5 w-full max-w-3xl mx-auto">
              <TabsTrigger value="profile">프로필</TabsTrigger>
              <TabsTrigger value="bookings">예약 내역</TabsTrigger>
              <TabsTrigger value="wishlist">위시리스트</TabsTrigger>
              <TabsTrigger value="reviews">리뷰</TabsTrigger>
              <TabsTrigger value="settings">설정</TabsTrigger>
            </TabsList>

            {/* 프로필 탭 */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">기본 정보</CardTitle>
                  <CardDescription>개인정보를 관리하세요</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">이름</Label>
                      {isEditing ? (
                        <Input 
                          id="name" 
                          value={editingData.full_name || ''} 
                          onChange={(e) => setEditingData(prev => ({...prev, full_name: e.target.value}))}
                        />
                      ) : (
                        <div className="p-2 text-gray-900">{user.full_name}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="phone">전화번호</Label>
                      {isEditing ? (
                        <Input 
                          id="phone" 
                          value={editingData.phone || ''} 
                          onChange={(e) => setEditingData(prev => ({...prev, phone: e.target.value}))}
                        />
                      ) : (
                        <div className="p-2 text-gray-900">{user.phone}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">이메일</Label>
                      <div className="p-2 text-gray-500">{user.email} (변경 불가)</div>
                    </div>
                    <div>
                      <Label htmlFor="location">거주지</Label>
                      {isEditing ? (
                        <Input 
                          id="location" 
                          value={editingData.location || ''} 
                          onChange={(e) => setEditingData(prev => ({...prev, location: e.target.value}))}
                        />
                      ) : (
                        <div className="p-2 text-gray-900">{user.location}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bio">자기소개</Label>
                    {isEditing ? (
                      <textarea 
                        id="bio" 
                        rows={4}
                        className="w-full p-2 border rounded-md"
                        value={editingData.bio || ''} 
                        onChange={(e) => setEditingData(prev => ({...prev, bio: e.target.value}))}
                      />
                    ) : (
                      <div className="p-2 text-gray-900">{user.bio}</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">여행 선호도</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">선호하는 지역</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {userStats.favorite_destinations.map((dest) => (
                          <Badge key={dest} variant="secondary" className="bg-blue-100 text-blue-800">
                            {dest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Separator />
                    <div className="grid md:grid-cols-3 gap-4 text-center">
                      <div>
                        <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                        <div className="font-medium">신뢰할 수 있는 게스트</div>
                        <div className="text-sm text-gray-600">항상 예의 바르고 깨끗하게 이용</div>
                      </div>
                      <div>
                        <Star className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <div className="font-medium">리뷰어</div>
                        <div className="text-sm text-gray-600">도움이 되는 리뷰 작성</div>
                      </div>
                      <div>
                        <Clock className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <div className="font-medium">빠른 응답</div>
                        <div className="text-sm text-gray-600">호스트와 원활한 소통</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 예약 내역 탭 */}
            <TabsContent value="bookings" className="space-y-6">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">최근 예약 내역</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3].map((booking) => (
                    <div key={booking} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">청주 모던 하우스</h4>
                          <p className="text-sm text-gray-600">2024년 1월 15일 - 17일 (2박)</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">이용완료</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          총 ₩320,000 • 4명
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            상세보기
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Star className="w-4 h-4 mr-1" />
                            리뷰 작성
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 위시리스트 탭 */}
            <TabsContent value="wishlist" className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <Card key={item} className="border-0 shadow-md overflow-hidden group hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <img 
                        src="/api/placeholder/300/200" 
                        alt="숙소"
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                      />
                      <button className="absolute top-3 right-3 p-2 bg-white/80 rounded-full hover:bg-white">
                        <Heart className="w-4 h-4 text-red-500 fill-current" />
                      </button>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium text-gray-900 mb-1">청주 프라이빗 하우스</h3>
                      <p className="text-sm text-gray-600 mb-2">청주시 • 독채형</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm">4.8</span>
                        </div>
                        <div className="font-bold">₩180,000 / 박</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* 리뷰 탭 */}
            <TabsContent value="reviews" className="space-y-6">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">내가 작성한 리뷰</CardTitle>
                  <CardDescription>{userStats.reviews_count}개의 리뷰를 작성했습니다</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3].map((review) => (
                    <div key={review} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">청주 모던 하우스</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">2024년 1월</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm mb-3">
                        정말 깨끗하고 편안한 숙소였습니다. 호스트님도 친절하시고 위치도 좋았어요. 
                        다음에 청주 오면 또 이용하고 싶습니다.
                      </p>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4 mr-1" />
                          수정
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-1" />
                          삭제
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 설정 탭 */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">알림 설정</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">이메일 알림</div>
                      <div className="text-sm text-gray-600">예약 확인, 프로모션 등</div>
                    </div>
                    <input type="checkbox" defaultChecked className="toggle" />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">SMS 알림</div>
                      <div className="text-sm text-gray-600">중요한 예약 정보</div>
                    </div>
                    <input type="checkbox" defaultChecked className="toggle" />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">푸시 알림</div>
                      <div className="text-sm text-gray-600">앱 알림</div>
                    </div>
                    <input type="checkbox" defaultChecked className="toggle" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">계정 설정</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="font-medium">비밀번호 변경</div>
                        <div className="text-sm text-gray-600">로그인 보안을 강화하세요</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">변경</Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="font-medium">언어 설정</div>
                        <div className="text-sm text-gray-600">한국어</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">변경</Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="font-medium">결제 수단</div>
                        <div className="text-sm text-gray-600">저장된 결제 수단 관리</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">관리</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-lg text-red-800">계정 삭제</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-700 mb-4">
                    계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
                  </p>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    계정 삭제
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}