'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import { 
  Building2, 
  Search, 
  MapPin, 
  Users, 
  DollarSign,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react'

interface Accommodation {
  id: string
  name: string
  accommodation_type: string
  address: string
  region: string
  max_capacity: number
  base_price: number
  status: string
  is_collaboration_available: boolean
  images: string[]
  host_id: string
}

export default function CollaborationAccommodationsPage() {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState('')
  
  const supabase = createClient()

  useEffect(() => {
    fetchAccommodations()
  }, [])

  const fetchAccommodations = async () => {
    try {
      setLoading(true)
      setError('')
      
      const { data: accommodations, error } = await supabase
        .from('accommodations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('숙소 목록 조회 실패:', error)
        setError('숙소 목록을 불러오는데 실패했습니다.')
        return
      }

      setAccommodations(accommodations || [])
    } catch (error) {
      console.error('숙소 목록 조회 중 오류:', error)
      setError('숙소 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const toggleCollaboration = async (accommodationId: string, currentStatus: boolean) => {
    try {
      setUpdating(accommodationId)
      setError('')
      
      // RLS 정책으로 처리 - 직접 Supabase 사용
      const { error } = await supabase
        .from('accommodations')
        .update({ 
          is_collaboration_available: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', accommodationId)

      if (error) {
        console.error('협찬 설정 업데이트 실패:', error)
        setError('협찬 설정 업데이트에 실패했습니다.')
        return
      }

      // 로컬 상태 업데이트
      setAccommodations(prev => 
        prev.map(acc => 
          acc.id === accommodationId 
            ? { ...acc, is_collaboration_available: !currentStatus }
            : acc
        )
      )
    } catch (error) {
      console.error('협찬 설정 업데이트 중 오류:', error)
      setError('협찬 설정 업데이트에 실패했습니다.')
    } finally {
      setUpdating(null)
    }
  }

  // 필터링된 숙소 목록
  const filteredAccommodations = accommodations.filter(acc => {
    const matchesSearch = acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         acc.address.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'collaboration_enabled' && acc.is_collaboration_available) ||
                         (filterStatus === 'collaboration_disabled' && !acc.is_collaboration_available) ||
                         (filterStatus === 'active' && acc.status === 'active') ||
                         (filterStatus === 'inactive' && acc.status !== 'active')
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
      inactive: 'bg-gray-100 text-gray-800'
    }
    
    const labels = {
      active: '활성',
      pending: '대기',
      suspended: '정지',
      inactive: '비활성'
    }
    
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.inactive}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>숙소 목록을 불러오는 중...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">협찬 신청 숙소 관리</h1>
        <p className="text-muted-foreground">인플루언서 협찬 신청에 노출될 숙소를 관리합니다.</p>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* 검색 및 필터 */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="숙소명, 주소로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                전체
              </Button>
              <Button
                variant={filterStatus === 'collaboration_enabled' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('collaboration_enabled')}
              >
                협찬 허용
              </Button>
              <Button
                variant={filterStatus === 'collaboration_disabled' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('collaboration_disabled')}
              >
                협찬 비허용
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('active')}
              >
                활성 숙소
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 숙소 목록 */}
      <div className="grid gap-6">
        {filteredAccommodations.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>검색 조건에 맞는 숙소가 없습니다.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredAccommodations.map((accommodation) => (
            <Card key={accommodation.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* 숙소 이미지 */}
                  <div className="lg:w-48 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {accommodation.images && accommodation.images.length > 0 ? (
                      <img
                        src={accommodation.images[0]}
                        alt={accommodation.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* 숙소 정보 */}
                  <div className="flex-1">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold">{accommodation.name}</h3>
                          {getStatusBadge(accommodation.status)}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{accommodation.address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>최대 {accommodation.max_capacity}명</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            <span>{accommodation.base_price.toLocaleString()}원/1day</span>
                          </div>
                        </div>
                      </div>

                      {/* 협찬 설정 */}
                      <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                          {accommodation.is_collaboration_available ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                          <span className="font-medium">
                            협찬 {accommodation.is_collaboration_available ? '허용' : '비허용'}
                          </span>
                        </div>
                        <Switch
                          checked={accommodation.is_collaboration_available}
                          onCheckedChange={() => toggleCollaboration(accommodation.id, accommodation.is_collaboration_available)}
                          disabled={updating === accommodation.id}
                        />
                        {updating === accommodation.id && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 통계 정보 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>협찬 설정 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{accommodations.length}</div>
              <div className="text-sm text-muted-foreground">전체 숙소</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {accommodations.filter(acc => acc.is_collaboration_available).length}
              </div>
              <div className="text-sm text-muted-foreground">협찬 허용</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {accommodations.filter(acc => !acc.is_collaboration_available).length}
              </div>
              <div className="text-sm text-muted-foreground">협찬 비허용</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {accommodations.filter(acc => acc.status === 'active').length}
              </div>
              <div className="text-sm text-muted-foreground">활성 숙소</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}