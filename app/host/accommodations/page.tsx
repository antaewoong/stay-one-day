'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Edit, Trash2, Eye, MapPin } from 'lucide-react'
import { hostGet } from '@/lib/host-api'

interface HostAccommodation {
  id: string
  name: string
  accommodation_type: string
  address: string
  region: string
  base_price: number
  max_capacity: number
  status: string
  is_featured: boolean
  images: string[]
  created_at: string
}

export default function HostAccommodationsPage() {
  const supabase = createClient()
  const [accommodations, setAccommodations] = useState<HostAccommodation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [hostData, setHostData] = useState<any>(null)

  useEffect(() => {
    // 호스트 정보 가져오기
    const userData = sessionStorage.getItem('hostUser')
    console.log('=== 초기 호스트 데이터 로드 ===')
    console.log('sessionStorage userData:', userData)
    
    if (userData) {
      const parsedData = JSON.parse(userData)
      console.log('파싱된 데이터:', parsedData)
      setHostData(parsedData)
      
      const hostUUID = parsedData.id  // 이미 UUID가 있음
      console.log('사용할 호스트 UUID:', hostUUID)
      
      loadAccommodations(hostUUID)
    } else {
      console.log('sessionStorage에 hostUser 데이터 없음')
    }
  }, [])

  const loadAccommodations = async (hostUUID: string) => {
    try {
      setLoading(true)
      console.log('=== 숙소 API 호출 ===')
      console.log('호스트 UUID:', hostUUID)
      
      // API를 통해서 숙소 조회 (RLS 문제 해결)
      const response = await hostGet(`/api/host/accommodations?hostId=${hostUUID}`)
      const result = await response.json()
      
      console.log('API 응답:', result)
      
      if (!response.ok) {
        throw new Error(result.error || 'API 호출 실패')
      }
      
      if (result.success) {
        setAccommodations(result.data || [])
        return
      } else {
        throw new Error(result.error || '데이터 로드 실패')
      }

    } catch (error) {
      console.error('숙소 목록 로드 실패:', error)
      setAccommodations([])
    } finally {
      setLoading(false)
    }
  }

  // 검색 및 필터 변경시 재로드
  useEffect(() => {
    if (hostData && hostData.id) {
      const timeoutId = setTimeout(() => {
        loadAccommodationsWithFilter(hostData.id)
      }, 300)

      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery, statusFilter, hostData])

  const loadAccommodationsWithFilter = async (hostUUID: string) => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        hostId: hostUUID,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery })
      })
      
      const response = await hostGet(`/api/host/accommodations?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setAccommodations(result.data || [])
      } else {
        throw new Error(result.error || '데이터 로드 실패')
      }
    } catch (error) {
      console.error('숙소 목록 로드 실패:', error)
      setAccommodations([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`'${name}' 숙소를 정말 삭제하시겠습니까?`)) return

    try {
      const response = await fetch(`/api/accommodations/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('삭제 실패')

      alert('숙소가 삭제되었습니다.')
      if (hostData && hostData.id) {
        loadAccommodations(hostData.id)  // UUID 사용
      }
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '활성'
      case 'pending': return '승인대기'
      case 'inactive': return '비활성'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">내 숙소 관리</h1>
        <div className="text-sm text-gray-500">
          * 새 숙소 등록은 관리자에게 문의하세요
        </div>
      </div>

      {/* 검색 및 필터 */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-gray-50">
          <CardTitle className="text-gray-900">검색 및 필터</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="숙소명 또는 위치로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-green-300 focus:ring-green-500"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px] border-gray-200">
                <SelectValue placeholder="승인 상태" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="active">활성</SelectItem>
                <SelectItem value="pending">승인대기</SelectItem>
                <SelectItem value="inactive">비활성</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 숙소 목록 */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-gray-50">
          <CardTitle className="text-gray-900">등록된 숙소 ({accommodations.length}개)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          ) : accommodations.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 숙소가 없습니다</h3>
              <p className="text-gray-500 mb-4">첫 번째 숙소를 등록해보세요!</p>
              <div className="text-center text-gray-500">
                <p className="mb-2">새 숙소 등록은 관리자에게 문의하세요</p>
                <p className="text-sm">관리자 연락처: admin@stayoneday.com</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">이미지</TableHead>
                    <TableHead>숙소명</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>지역</TableHead>
                    <TableHead>인원</TableHead>
                    <TableHead>가격</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>추천</TableHead>
                    <TableHead>등록일</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accommodations.map((accommodation) => (
                    <TableRow key={accommodation.id} className="hover:bg-gray-50">
                      <TableCell>
                        {accommodation.images?.[0] ? (
                          <img
                            src={accommodation.images[0]}
                            alt={accommodation.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{accommodation.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-[200px]">
                            {accommodation.address}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-green-200 text-green-800">
                          {accommodation.accommodation_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700">{accommodation.region}</TableCell>
                      <TableCell className="text-gray-700">{accommodation.max_capacity}명</TableCell>
                      <TableCell className="font-medium text-gray-900">
                        ₩{accommodation.base_price.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(accommodation.status)}>
                          {getStatusText(accommodation.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={accommodation.is_featured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>
                          {accommodation.is_featured ? '추천' : '일반'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {new Date(accommodation.created_at).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 justify-end">
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/spaces/${accommodation.id}`} target="_blank">
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/host/accommodations/${accommodation.id}/edit`}>
                              <Edit className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(accommodation.id, accommodation.name)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}