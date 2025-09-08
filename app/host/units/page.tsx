'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Search, 
  Building2, 
  Edit, 
  Trash2, 
  Eye,
  Users,
  Bed,
  Bath,
  Square,
  DollarSign,
  Calendar,
  Settings
} from 'lucide-react'

interface AccommodationUnit {
  id: string
  accommodation_id: string
  accommodation_name: string
  unit_name: string
  unit_type: string
  unit_number: string
  floor_number?: number
  base_price: number
  weekend_price: number
  peak_season_price: number
  base_capacity: number
  max_capacity: number
  bedrooms: number
  bathrooms: number
  area_sqm?: number
  amenities: string[]
  features: string[]
  is_active: boolean
  maintenance_notes?: string
  last_cleaned_at?: string
  created_at: string
  image_count: number
  reservation_count: number
}

export default function HostUnitsPage() {
  const [units, setUnits] = useState<AccommodationUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [accommodationFilter, setAccommodationFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [hostData, setHostData] = useState<any>(null)

  const [accommodations, setAccommodations] = useState<{id: string, name: string}[]>([])

  useEffect(() => {
    const userData = sessionStorage.getItem('hostUser')
    if (userData) {
      const parsedData = JSON.parse(userData)
      setHostData(parsedData)
      loadUnits(parsedData.host_id)
    }
  }, [])

  const loadUnits = async (hostId: string) => {
    try {
      setLoading(true)
      
      let url = `/api/accommodations?hostId=${hostId}&includeUnits=true`
      
      const response = await fetch(url)
      const result = await response.json()
      
      if (result.success && result.data) {
        // Update accommodations list for filter
        const accommodationsList = result.data.map((acc: any) => ({
          id: acc.id,
          name: acc.name
        }))
        setAccommodations(accommodationsList)
        
        // Flatten units from all accommodations
        const allUnits: AccommodationUnit[] = []
        
        result.data.forEach((accommodation: any) => {
          if (accommodation.units && accommodation.units.length > 0) {
            accommodation.units.forEach((unit: any) => {
              allUnits.push({
                id: unit.id,
                accommodation_id: accommodation.id,
                accommodation_name: accommodation.name,
                unit_name: unit.unit_name || unit.name,
                unit_type: unit.unit_type || 'room',
                unit_number: unit.unit_number || '1',
                floor_number: unit.floor_number,
                base_price: unit.base_price || 0,
                weekend_price: unit.weekend_price || unit.base_price || 0,
                peak_season_price: unit.peak_season_price || unit.base_price || 0,
                base_capacity: unit.base_capacity || 2,
                max_capacity: unit.max_capacity || unit.base_capacity || 4,
                bedrooms: unit.bedrooms || 1,
                bathrooms: unit.bathrooms || 1,
                area_sqm: unit.area_sqm,
                amenities: unit.amenities || [],
                features: unit.features || [],
                is_active: unit.is_active !== false,
                maintenance_notes: unit.maintenance_notes,
                last_cleaned_at: unit.last_cleaned_at,
                created_at: unit.created_at,
                image_count: unit.image_count || 0,
                reservation_count: unit.reservation_count || 0
              })
            })
          }
        })
        
        let filteredUnits = allUnits

        // 숙소별 필터 적용
        if (accommodationFilter !== 'all') {
          filteredUnits = filteredUnits.filter(u => u.accommodation_id === accommodationFilter)
        }

        // 상태 필터 적용
        if (statusFilter !== 'all') {
          if (statusFilter === 'active') {
            filteredUnits = filteredUnits.filter(u => u.is_active)
          } else if (statusFilter === 'inactive') {
            filteredUnits = filteredUnits.filter(u => !u.is_active)
          }
        }

        // 타입 필터 적용
        if (typeFilter !== 'all') {
          filteredUnits = filteredUnits.filter(u => u.unit_type === typeFilter)
        }

        // 검색 필터 적용
        if (searchQuery) {
          filteredUnits = filteredUnits.filter(u => 
            u.unit_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.unit_number.includes(searchQuery) ||
            u.accommodation_name.toLowerCase().includes(searchQuery.toLowerCase())
          )
        }

        setUnits(filteredUnits)
      } else {
        console.log('유닛이 없거나 API 호출 실패')
        setUnits([])
      }
    } catch (error) {
      console.error('유닛 목록 로드 실패:', error)
      setUnits([])
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    if (hostData) {
      const timeoutId = setTimeout(() => {
        loadUnits(hostData.host_id)
      }, 300)

      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery, accommodationFilter, statusFilter, typeFilter, hostData])

  const handleDeleteUnit = async (unitId: string, unitName: string) => {
    if (!confirm(`'${unitName}' 유닛을 삭제하시겠습니까?`)) return

    try {
      const response = await fetch(`/api/accommodations/units/${unitId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()

      if (result.success) {
        await loadUnits(hostData?.host_id)
        alert('유닛이 삭제되었습니다.')
      } else {
        alert('유닛 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('유닛 삭제 실패:', error)
      alert('유닛 삭제에 실패했습니다.')
    }
  }

  const toggleUnitStatus = async (unitId: string) => {
    try {
      const unit = units.find(u => u.id === unitId)
      if (!unit) return

      const response = await fetch(`/api/accommodations/units/${unitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !unit.is_active
        })
      })

      const result = await response.json()

      if (result.success) {
        await loadUnits(hostData?.host_id)
        alert('상태가 변경되었습니다.')
      } else {
        alert('상태 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('상태 변경 실패:', error)
      alert('상태 변경에 실패했습니다.')
    }
  }

  const getUnitTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      'villa': '빌라',
      'private_house': '독채',
      'room': '객실',
      'studio': '스튜디오'
    }
    return typeMap[type] || type
  }

  const getUnitTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'villa': 'bg-purple-100 text-purple-800',
      'private_house': 'bg-green-100 text-green-800',
      'room': 'bg-blue-100 text-blue-800',
      'studio': 'bg-orange-100 text-orange-800'
    }
    return colorMap[type] || 'bg-gray-100 text-gray-800'
  }

  const formatArea = (sqm?: number) => {
    if (!sqm) return '-'
    const pyeong = sqm / 3.3058
    return `${sqm}㎡ (${pyeong.toFixed(1)}평)`
  }

  const totalUnits = units.length
  const activeUnits = units.filter(u => u.is_active).length
  const totalReservations = units.reduce((sum, u) => sum + u.reservation_count, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">룸/유닛 관리</h1>
          <p className="text-sm text-gray-600 mt-1">
            총 {totalUnits}개 유닛 • 활성 {activeUnits}개 • 총 예약 {totalReservations}건
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/host/units/pricing">
              <Calendar className="w-4 h-4 mr-2" />
              가격 설정
            </Link>
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" asChild>
            <Link href="/host/units/add">
              <Plus className="w-4 h-4 mr-2" />
              유닛 추가
            </Link>
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">전체 유닛</p>
                <p className="text-2xl font-bold text-gray-900">{totalUnits}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">활성 유닛</p>
                <p className="text-2xl font-bold text-green-600">{activeUnits}</p>
              </div>
              <Settings className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 예약</p>
                <p className="text-2xl font-bold text-purple-600">{totalReservations}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">평균 수익</p>
                <p className="text-2xl font-bold text-orange-600">₩2.8M</p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-white">
          <CardTitle className="text-gray-900">검색 및 필터</CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="유닛명, 호수, 숙소명으로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-300 bg-white"
                />
              </div>
            </div>
            
            <Select value={accommodationFilter} onValueChange={setAccommodationFilter}>
              <SelectTrigger className="border-gray-300 bg-white">
                <SelectValue placeholder="숙소 선택" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="all">전체 숙소</SelectItem>
                {accommodations.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="border-gray-300 bg-white">
                <SelectValue placeholder="유형 선택" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="all">전체 유형</SelectItem>
                <SelectItem value="villa">빌라</SelectItem>
                <SelectItem value="private_house">독채</SelectItem>
                <SelectItem value="room">객실</SelectItem>
                <SelectItem value="studio">스튜디오</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-gray-300 bg-white">
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="active">활성</SelectItem>
                <SelectItem value="inactive">비활성</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 유닛 목록 */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-white">
          <CardTitle className="text-gray-900">등록된 유닛 ({units.length}개)</CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          ) : units.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 유닛이 없습니다</h3>
              <p className="text-gray-500 mb-4">첫 번째 유닛을 등록해보세요!</p>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/host/units/add">
                  <Plus className="w-4 h-4 mr-2" />
                  유닛 등록하기
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>유닛 정보</TableHead>
                    <TableHead>숙소</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>시설</TableHead>
                    <TableHead>가격</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>예약/이미지</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.map((unit) => (
                    <TableRow key={unit.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{unit.unit_name}</div>
                          <div className="text-sm text-gray-500">
                            {unit.unit_number}호
                            {unit.floor_number && ` • ${unit.floor_number}층`}
                          </div>
                          {unit.area_sqm && (
                            <div className="text-xs text-gray-400 mt-1">
                              {formatArea(unit.area_sqm)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">{unit.accommodation_name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getUnitTypeColor(unit.unit_type)}>
                          {getUnitTypeText(unit.unit_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{unit.base_capacity}-{unit.max_capacity}명</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Bed className="w-3 h-3" />
                            <span>{unit.bedrooms}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Bath className="w-3 h-3" />
                            <span>{unit.bathrooms}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            ₩{unit.base_price.toLocaleString()}
                          </div>
                          <div className="text-gray-500">
                            주말 ₩{unit.weekend_price.toLocaleString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge className={unit.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {unit.is_active ? '활성' : '비활성'}
                          </Badge>
                          {unit.maintenance_notes && (
                            <div className="text-xs text-orange-600">
                              {unit.maintenance_notes}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          <div>예약 {unit.reservation_count}건</div>
                          <div>이미지 {unit.image_count}장</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 justify-end">
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/host/units/${unit.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/host/units/${unit.id}/edit`}>
                              <Edit className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleUnitStatus(unit.id)}
                            className={unit.is_active ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteUnit(unit.id, unit.unit_name)}
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