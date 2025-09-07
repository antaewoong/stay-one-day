'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Search, 
  Plus, 
  Edit, 
  Eye, 
  Trash2, 
  Building2,
  MapPin,
  Users,
  Star,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'

interface Stay {
  id: number
  name: string
  location: string
  category: string
  capacity: {
    basic: number
    max: number
  }
  price: number
  rating: number
  reviews: number
  status: 'active' | 'inactive' | 'maintenance'
  tags: string[]
  images: number
  description: string
  checkIn: string
  checkOut: string
  createdAt: string
  updatedAt: string
}

export default function StaysPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Mock data - Stay One Day 스테이 데이터
  const stays: Stay[] = [
    {
      id: 1,
      name: '구공스테이 청주 본디',
      location: '충북 청주시',
      category: '프라이빗독채',
      capacity: { basic: 4, max: 8 },
      price: 150000,
      rating: 4.9,
      reviews: 127,
      status: 'active',
      tags: ['수영장', '바베큐', '주차가능', '반려견동반'],
      images: 24,
      description: '청주 최고의 독채 풀빌라입니다. 전용 수영장과 바베큐 시설을 갖추고 있습니다.',
      checkIn: '15:00',
      checkOut: '23:00',
      createdAt: '2025-01-15',
      updatedAt: '2025-08-15'
    },
    {
      id: 2,
      name: '구공스테이 소소한옥',
      location: '경북 안동시',
      category: '한옥체험',
      capacity: { basic: 4, max: 6 },
      price: 120000,
      rating: 4.8,
      reviews: 89,
      status: 'active',
      tags: ['전통한옥', '조용함', '자연경관'],
      images: 18,
      description: '전통 한옥에서의 특별한 하루를 경험해보세요.',
      checkIn: '15:00',
      checkOut: '23:00',
      createdAt: '2025-02-01',
      updatedAt: '2025-08-10'
    },
    {
      id: 3,
      name: '구공스테이 옥천 키즈',
      location: '충북 옥천군',
      category: '키즈전용',
      capacity: { basic: 4, max: 8 },
      price: 160000,
      rating: 4.7,
      reviews: 42,
      status: 'active',
      tags: ['키즈풀장', '놀이시설', '안전시설'],
      images: 32,
      description: '아이들을 위한 전용 공간과 안전한 놀이시설이 완비되어 있습니다.',
      checkIn: '15:00',
      checkOut: '23:00',
      createdAt: '2025-03-01',
      updatedAt: '2025-08-20'
    },
    {
      id: 4,
      name: '구공스테이 사천 안토이비토',
      location: '경남 사천시',
      category: '사계절온수풀',
      capacity: { basic: 4, max: 10 },
      price: 170000,
      rating: 4.6,
      reviews: 35,
      status: 'maintenance',
      tags: ['온수풀', '오션뷰', '바베큐'],
      images: 26,
      description: '사계절 이용 가능한 온수풀과 바다 전망을 즐길 수 있습니다.',
      checkIn: '15:00',
      checkOut: '23:00',
      createdAt: '2025-04-01',
      updatedAt: '2025-08-25'
    },
    {
      id: 5,
      name: '구공스테이 남해 디풀&애견',
      location: '경남 남해군',
      category: '반려견동반',
      capacity: { basic: 4, max: 8 },
      price: 160000,
      rating: 4.7,
      reviews: 58,
      status: 'active',
      tags: ['애견동반', '독립수영장', '넓은마당'],
      images: 22,
      description: '반려견과 함께 즐길 수 있는 전용 공간이 마련되어 있습니다.',
      checkIn: '15:00',
      checkOut: '23:00',
      createdAt: '2025-05-01',
      updatedAt: '2025-08-12'
    }
  ]

  const categories = [
    'all', '프라이빗독채', '한옥체험', '키즈전용', 
    '사계절온수풀', '반려견동반', '배달편리', '독채형'
  ]

  const filteredStays = stays.filter(stay => {
    const matchesSearch = stay.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         stay.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || stay.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || stay.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">운영중</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">미운영</Badge>
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800">점검중</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const toggleStayStatus = (stayId: number) => {
    // 실제로는 API 호출이 들어갈 부분
    console.log('Toggling status for stay:', stayId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">스테이 관리</h1>
          <p className="text-gray-600">Stay One Day에 등록된 스테이를 관리합니다.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          스테이 추가
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">전체 스테이</p>
                <p className="text-2xl font-bold">{stays.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">운영중</p>
                <p className="text-2xl font-bold text-green-600">
                  {stays.filter(s => s.status === 'active').length}
                </p>
              </div>
              <ToggleRight className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">평균 평점</p>
                <p className="text-2xl font-bold">4.7</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 리뷰</p>
                <p className="text-2xl font-bold">
                  {stays.reduce((sum, stay) => sum + stay.reviews, 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>스테이 목록</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="스테이명, 지역 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="active">운영중</SelectItem>
                  <SelectItem value="inactive">미운영</SelectItem>
                  <SelectItem value="maintenance">점검중</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="카테고리" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? '전체' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>스테이 정보</TableHead>
                  <TableHead>위치</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>인원/가격</TableHead>
                  <TableHead>평점</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStays.map((stay) => (
                  <TableRow key={stay.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{stay.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{stay.name}</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {stay.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {stay.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{stay.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {stay.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{stay.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>기본 {stay.capacity.basic}명 / 최대 {stay.capacity.max}명</div>
                        <div className="font-medium">₩{stay.price.toLocaleString()}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span className="text-sm">{stay.rating}</span>
                        <span className="text-xs text-gray-500">({stay.reviews})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(stay.status)}
                        <button
                          onClick={() => toggleStayStatus(stay.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {stay.status === 'active' ? (
                            <ToggleRight className="w-4 h-4 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredStays.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' 
                ? '검색 조건에 맞는 스테이가 없습니다.' 
                : '등록된 스테이가 없습니다.'
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}