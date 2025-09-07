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
import { Plus, Search, Edit, Trash2, Eye, MapPin, EyeOff } from 'lucide-react'

interface AccommodationWithImages {
  id: string
  name: string
  accommodation_type: string
  address: string
  region: string
  base_price: number
  max_capacity: number
  status: string
  is_featured: boolean
  host_id: string
  images: string[]
  created_at: string
}

export default function AccommodationsPage() {
  const supabase = createClient()
  const [accommodations, setAccommodations] = useState<AccommodationWithImages[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    loadAccommodations()
  }, [])

  const loadAccommodations = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('accommodations')
        .select('*')
        .order('created_at', { ascending: false })

      // 필터 적용
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }
      
      if (typeFilter !== 'all') {
        query = query.eq('accommodation_type', typeFilter)
      }

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) throw error

      setAccommodations(data || [])
    } catch (error) {
      console.error('숙소 목록 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 검색 및 필터 변경시 재로드
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadAccommodations()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, statusFilter, typeFilter])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`'${name}' 숙소를 정말 삭제하시겠습니까?`)) return

    try {
      const { error } = await supabase
        .from('accommodations')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('숙소가 삭제되었습니다.')
      loadAccommodations()
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('accommodations')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error

      loadAccommodations()
    } catch (error) {
      console.error('상태 변경 실패:', error)
      alert('상태 변경에 실패했습니다.')
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
      case 'pending': return '대기'
      case 'inactive': return '비활성'
      default: return status
    }
  }

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    const newFeatured = !currentFeatured
    const action = newFeatured ? '추천 설정' : '추천 해제'
    
    if (!confirm(`이 숙소를 ${action} 하시겠습니까?`)) return

    try {
      const { error } = await supabase
        .from('accommodations')
        .update({ is_featured: newFeatured })
        .eq('id', id)

      if (error) throw error

      alert(`숙소가 ${action}되었습니다.`)
      loadAccommodations()
    } catch (error) {
      console.error('상태 변경 실패:', error)
      alert('상태 변경에 실패했습니다.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">숙소 관리</h1>
        <Button asChild>
          <Link href="/admin/accommodations/add">
            <Plus className="w-4 h-4 mr-2" />
            새 숙소 등록
          </Link>
        </Button>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardHeader>
          <CardTitle>검색 및 필터</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="숙소명 또는 주소로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent className="!bg-white !border !border-gray-200 !shadow-lg">
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="active">활성</SelectItem>
                <SelectItem value="pending">대기</SelectItem>
                <SelectItem value="inactive">비활성</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="유형 필터" />
              </SelectTrigger>
              <SelectContent className="!bg-white !border !border-gray-200 !shadow-lg">
                <SelectItem value="all">전체 유형</SelectItem>
                <SelectItem value="풀빌라">풀빌라</SelectItem>
                <SelectItem value="독채">독채</SelectItem>
                <SelectItem value="펜션">펜션</SelectItem>
                <SelectItem value="글램핑">글램핑</SelectItem>
                <SelectItem value="캠핑">캠핑</SelectItem>
                <SelectItem value="기타">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 숙소 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>숙소 목록 ({accommodations.length}개)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : accommodations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              등록된 숙소가 없습니다.
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
                    <TableRow key={accommodation.id}>
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
                          <div className="font-medium">{accommodation.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-[200px]">
                            {accommodation.address}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{accommodation.accommodation_type}</Badge>
                      </TableCell>
                      <TableCell>{accommodation.region}</TableCell>
                      <TableCell>{accommodation.max_capacity}명</TableCell>
                      <TableCell>₩{accommodation.base_price.toLocaleString()}</TableCell>
                      <TableCell>
                        <Select
                          value={accommodation.status}
                          onValueChange={(value) => handleStatusChange(accommodation.id, value)}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="!bg-white !border !border-gray-200 !shadow-lg">
                            <SelectItem value="active">활성</SelectItem>
                            <SelectItem value="pending">대기</SelectItem>
                            <SelectItem value="inactive">비활성</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge className={accommodation.is_featured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>
                          {accommodation.is_featured ? '추천' : '일반'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(accommodation.created_at).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="sm" variant="ghost" asChild title="숙소 미리보기">
                            <Link href={`/spaces/${accommodation.id}`} target="_blank" className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span className="text-xs">미리보기</span>
                            </Link>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleToggleFeatured(accommodation.id, accommodation.is_featured)}
                            className={`flex items-center gap-1 ${accommodation.is_featured ? 'text-yellow-600 hover:text-yellow-700' : 'text-gray-600 hover:text-gray-700'}`}
                            title={accommodation.is_featured ? '추천 해제' : '추천 설정'}
                          >
                            {accommodation.is_featured ? (
                              <>
                                <EyeOff className="w-4 h-4" />
                                <span className="text-xs">추천해제</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4" />
                                <span className="text-xs">추천설정</span>
                              </>
                            )}
                          </Button>
                          <Button size="sm" variant="ghost" asChild title="숙소 정보 수정">
                            <Link href={`/admin/accommodations/${accommodation.id}/edit`} className="flex items-center gap-1">
                              <Edit className="w-4 h-4" />
                              <span className="text-xs">편집</span>
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(accommodation.id, accommodation.name)}
                            className="text-red-600 hover:text-red-700 flex items-center gap-1"
                            title="숙소 삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-xs">삭제</span>
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