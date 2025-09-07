'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Users, 
  Building2, 
  TrendingUp, 
  DollarSign,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  Star,
  Eye,
  Settings
} from 'lucide-react'

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview')

  // 샘플 데이터
  const stats = {
    totalBusinesses: 12,
    pendingApplications: 3,
    totalSpaces: 28,
    monthlyRevenue: 2450000,
    totalCommission: 122500,
    avgRating: 4.7
  }

  // 입점 대기 리스트
  const pendingBusinesses = [
    {
      id: 1,
      businessName: '청주 프리미엄 풀빌라',
      ownerName: '김영수',
      email: 'pool@example.com',
      phone: '010-1234-5678',
      address: '충북 청주시',
      description: '프라이빗 풀빌라, 최대 15명 수용 가능',
      appliedAt: '2024-01-15',
      status: 'pending'
    },
    {
      id: 2,
      businessName: '대전 로얄스테이',
      ownerName: '박민정',
      email: 'royal@example.com', 
      phone: '010-2345-6789',
      address: '대전광역시',
      description: '고급 펜션, 바베큐 시설 완비',
      appliedAt: '2024-01-14',
      status: 'pending'
    }
  ]

  // 등록된 사업체 리스트
  const activeBusinesses = [
    {
      id: 1,
      businessName: '구공스테이 청주',
      ownerName: '이철수',
      spaces: 2,
      monthlyRevenue: 1200000,
      commission: 60000,
      rating: 4.8,
      status: 'active'
    },
    {
      id: 2,
      businessName: '세종 힐링스테이',
      ownerName: '최영희',
      spaces: 1,
      monthlyRevenue: 800000,
      commission: 40000,
      rating: 4.6,
      status: 'active'
    }
  ]

  const [inviteData, setInviteData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    message: '안녕하세요! Stay One Day는 고품격 풀빌라/펜션을 위한 당일치기 공간대여 플랫폼입니다...'
  })

  const handleApprove = (businessId: number) => {
    console.log('사업체 승인:', businessId)
    // 승인 로직
  }

  const handleReject = (businessId: number) => {
    console.log('사업체 거부:', businessId)
    // 거부 로직
  }

  const handleSendInvite = () => {
    console.log('초대 발송:', inviteData)
    // 초대 발송 로직
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 관리자 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">Stay One Day Admin</h1>
              </div>
              <Badge variant="outline" className="text-red-600 border-red-200">
                관리자 시스템
              </Badge>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <span className="text-sm font-medium">관리자</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">관리자 대시보드</h2>
          <p className="text-gray-600">Stay One Day 플랫폼을 관리하고 모니터링하세요</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">등록 사업체</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBusinesses}개</div>
              <p className="text-xs text-muted-foreground">
                승인 대기 {stats.pendingApplications}개
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 공간수</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSpaces}개</div>
              <p className="text-xs text-muted-foreground">
                전월 대비 +15%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">월 총 매출</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₩{stats.monthlyRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                전월 대비 +28%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">플랫폼 수수료</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₩{stats.totalCommission.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                수수료율 5%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 메인 탭 */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="businesses">사업체관리</TabsTrigger>
            <TabsTrigger value="prospect">발굴/초대</TabsTrigger>
            <TabsTrigger value="analytics">분석</TabsTrigger>
          </TabsList>

          {/* 개요 탭 */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* 승인 대기 */}
              <Card>
                <CardHeader>
                  <CardTitle>승인 대기 중인 사업체</CardTitle>
                  <CardDescription>검토가 필요한 신규 입점 신청</CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingBusinesses.length > 0 ? (
                    <div className="space-y-4">
                      {pendingBusinesses.slice(0, 3).map((business) => (
                        <div key={business.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{business.businessName}</p>
                            <p className="text-sm text-gray-500">{business.ownerName} • {business.address}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={() => handleApprove(business.id)}>
                              승인
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleReject(business.id)}>
                              거부
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full">
                        전체 보기
                      </Button>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">승인 대기 중인 사업체가 없습니다</p>
                  )}
                </CardContent>
              </Card>

              {/* 최근 활동 */}
              <Card>
                <CardHeader>
                  <CardTitle>플랫폼 현황</CardTitle>
                  <CardDescription>주요 지표 요약</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">평균 평점</span>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="font-medium">{stats.avgRating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">이번 달 새 사업체</span>
                    <span className="font-medium">+3개</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">이번 달 예약</span>
                    <span className="font-medium">127건</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">취소율</span>
                    <span className="font-medium text-green-600">2.1%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 사업체 관리 탭 */}
          <TabsContent value="businesses">
            <Card>
              <CardHeader>
                <CardTitle>등록된 사업체</CardTitle>
                <CardDescription>현재 플랫폼에서 활동 중인 사업체 목록</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeBusinesses.map((business) => (
                    <div key={business.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium">{business.businessName}</h3>
                          <Badge variant="outline" className="text-green-600">
                            활성
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>대표: {business.ownerName}</div>
                          <div>공간: {business.spaces}개</div>
                          <div>월매출: ₩{business.monthlyRevenue.toLocaleString()}</div>
                          <div>평점: {business.rating}⭐</div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          상세
                        </Button>
                        <Button size="sm" variant="outline">
                          관리
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 발굴/초대 탭 */}
          <TabsContent value="prospect">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* 직접 초대 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="w-5 h-5 mr-2" />
                    사업체 직접 초대
                  </CardTitle>
                  <CardDescription>
                    양질의 풀빌라/펜션을 발굴하여 직접 초대하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="businessName">사업체명</Label>
                      <Input
                        id="businessName"
                        placeholder="청주 프리미엄 풀빌라"
                        value={inviteData.businessName}
                        onChange={(e) => setInviteData({...inviteData, businessName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ownerName">대표자명</Label>
                      <Input
                        id="ownerName"
                        placeholder="홍길동"
                        value={inviteData.ownerName}
                        onChange={(e) => setInviteData({...inviteData, ownerName: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">이메일</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="business@example.com"
                        value={inviteData.email}
                        onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">연락처</Label>
                      <Input
                        id="phone"
                        placeholder="010-0000-0000"
                        value={inviteData.phone}
                        onChange={(e) => setInviteData({...inviteData, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message">초대 메시지</Label>
                    <Textarea
                      id="message"
                      rows={4}
                      placeholder="개인화된 초대 메시지를 작성하세요"
                      value={inviteData.message}
                      onChange={(e) => setInviteData({...inviteData, message: e.target.value})}
                    />
                  </div>

                  <Button onClick={handleSendInvite} className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    초대장 발송
                  </Button>
                </CardContent>
              </Card>

              {/* 입점 문의 안내 */}
              <Card>
                <CardHeader>
                  <CardTitle>입점 문의 안내</CardTitle>
                  <CardDescription>
                    사업체가 직접 문의할 수 있는 채널 관리
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">공식 입점 문의</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        <span className="font-mono">info@nuklabs.com</span>
                      </div>
                      <p className="mt-2">
                        고품격 풀빌라/펜션 운영 사업자님의 입점 문의를 받고 있습니다.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">최근 입점 문의</h4>
                    <div className="space-y-2">
                      <div className="p-3 border rounded-lg text-sm">
                        <div className="font-medium">춘천 레이크뷰 펜션</div>
                        <div className="text-gray-500">lake@example.com • 어제</div>
                      </div>
                      <div className="p-3 border rounded-lg text-sm">
                        <div className="font-medium">제주 오션풀빌라</div>
                        <div className="text-gray-500">ocean@example.com • 2일 전</div>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    모든 문의 보기
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 분석 탭 */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>플랫폼 분석</CardTitle>
                <CardDescription>상세한 통계 및 분석 정보</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-500 py-8">분석 기능 구현 예정</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}