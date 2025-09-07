'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Search, 
  Eye, 
  MessageSquare, 
  CheckCircle,
  User,
  Calendar,
  Mail,
  Phone,
  Building,
  Loader2,
  Globe,
  MapPin
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface PartnershipInquiry {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone?: string
  business_type: string
  inquiry: string
  status: 'pending' | 'in_progress' | 'resolved' | 'closed'
  notes?: string
  created_at: string
  updated_at: string
}

interface PartnerInquiry {
  id: string
  business_name: string
  contact_name: string
  phone: string
  website_url: string
  location: string
  space_type: string
  daily_rate: string
  average_idle_days: string
  parking_spaces?: string
  amenities?: string
  notes?: string
  privacy_consent: boolean
  marketing_consent?: boolean
  status: 'pending' | 'in_progress' | 'resolved' | 'closed'
  admin_notes?: string
  created_at: string
  updated_at: string
}

interface ContactInquiry {
  id: string
  name: string
  contact: string
  message: string
  status: 'pending' | 'in_progress' | 'resolved' | 'closed'
  admin_notes?: string
  created_at: string
  updated_at: string
}

type InquiryType = 'partnership' | 'partner' | 'contact'

export default function InquiriesPage() {
  const supabase = createClient()
  const [partnershipInquiries, setPartnershipInquiries] = useState<PartnershipInquiry[]>([])
  const [partnerInquiries, setPartnerInquiries] = useState<PartnerInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState<InquiryType | 'all'>('all')
  const [selectedInquiry, setSelectedInquiry] = useState<PartnershipInquiry | PartnerInquiry | null>(null)
  const [selectedType, setSelectedType] = useState<InquiryType | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [response, setResponse] = useState('')
  const [responding, setResponding] = useState(false)

  useEffect(() => {
    loadInquiries()
  }, [])

  const loadInquiries = async () => {
    try {
      setLoading(true)
      
      // Partnership inquiries 목업 데이터
      const mockPartnershipInquiries: PartnershipInquiry[] = [
        {
          id: '1',
          company_name: '토스',
          contact_name: '이비즈',
          email: 'biz@toss.im',
          phone: '02-1234-5678',
          business_type: '핀테크',
          inquiry: '토스 앱 내에서 Stay OneDay 서비스를 연동하여 사용자들이 쉽게 독채 숙소를 예약할 수 있는 제휴를 논의하고 싶습니다.',
          status: 'pending',
          created_at: '2025-01-20T14:30:00+09:00',
          updated_at: '2025-01-20T14:30:00+09:00'
        },
        {
          id: '2', 
          company_name: '네이버',
          contact_name: '김파트너',
          email: 'partner@naver.com',
          business_type: '플랫폼',
          inquiry: '네이버 지도 및 검색에서 Stay OneDay 숙소들이 노출될 수 있도록 API 연동 및 마케팅 제휴를 진행하고자 합니다.',
          status: 'in_progress',
          notes: '1차 미팅 완료, 기술 검토 진행중',
          created_at: '2025-01-18T10:15:00+09:00',
          updated_at: '2025-01-19T16:20:00+09:00'
        }
      ]
      
      // Partner inquiries 목업 데이터
      const mockPartnerInquiries: PartnerInquiry[] = [
        {
          id: '1',
          business_name: '청주 힐사이드 펜션',
          contact_name: '김점주',
          phone: '010-1234-5678',
          website_url: 'https://hillside-pension.co.kr',
          location: '충청북도 청주시',
          space_type: '펜션',
          daily_rate: '300,000-500,000원',
          average_idle_days: '주중 2-3일',
          parking_spaces: '5대',
          amenities: 'BBQ 시설, 수영장, 족구장',
          privacy_consent: true,
          marketing_consent: true,
          status: 'pending',
          created_at: '2025-01-20T11:20:00+09:00',
          updated_at: '2025-01-20T11:20:00+09:00'
        },
        {
          id: '2',
          business_name: '제주 오션뷰 빌라',
          contact_name: '박바다',
          phone: '010-9876-5432',
          website_url: 'https://jeju-ocean-villa.com',
          location: '제주특별자치도 서귀포시',
          space_type: '독채펜션',
          daily_rate: '800,000-1,200,000원',
          average_idle_days: '주중 1-2일',
          parking_spaces: '3대',
          amenities: '오션뷰, 개별 수영장, 바베큐 시설, 넷플릭스',
          privacy_consent: true,
          status: 'resolved',
          admin_notes: '입점 승인 완료, 사진 촬영 일정 조율중',
          created_at: '2025-01-15T09:10:00+09:00',
          updated_at: '2025-01-18T14:30:00+09:00'
        }
      ]

      // 실제 환경에서는 Supabase에서 데이터 조회
      try {
        // Partnership inquiries 조회
        let partnershipQuery = supabase
          .from('partnership_inquiries')
          .select('*')
          .order('created_at', { ascending: false })

        if (statusFilter !== 'all') {
          partnershipQuery = partnershipQuery.eq('status', statusFilter)
        }

        if (searchQuery) {
          partnershipQuery = partnershipQuery.or(`company_name.ilike.%${searchQuery}%,contact_name.ilike.%${searchQuery}%,business_type.ilike.%${searchQuery}%`)
        }

        // Partner inquiries 조회  
        let partnerQuery = supabase
          .from('partner_inquiries')
          .select('*')
          .order('created_at', { ascending: false })

        if (statusFilter !== 'all') {
          partnerQuery = partnerQuery.eq('status', statusFilter)
        }

        if (searchQuery) {
          partnerQuery = partnerQuery.or(`business_name.ilike.%${searchQuery}%,contact_name.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`)
        }

        const [partnershipResult, partnerResult] = await Promise.all([
          partnershipQuery,
          partnerQuery
        ])

        if (partnershipResult.error || partnerResult.error) {
          throw new Error('데이터 조회 실패')
        }

        setPartnershipInquiries(partnershipResult.data || mockPartnershipInquiries)
        setPartnerInquiries(partnerResult.data || mockPartnerInquiries)
      } catch (error) {
        console.log('데이터베이스 연결 실패, 목업 데이터 사용:', error)
        setPartnershipInquiries(mockPartnershipInquiries)
        setPartnerInquiries(mockPartnerInquiries)
      }

    } catch (error) {
      console.error('문의사항 로드 실패:', error)
      setPartnershipInquiries([])
      setPartnerInquiries([])
    } finally {
      setLoading(false)
    }
  }

  // 검색 및 필터 변경시 재로드
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadInquiries()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, statusFilter, typeFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getBusinessTypeText = (type: string) => {
    switch (type) {
      case '핀테크': return '핀테크'
      case '플랫폼': return '플랫폼'
      case 'OTA': return 'OTA'
      case '여행사': return '여행사'
      case '마케팅': return '마케팅'
      default: return type
    }
  }
  
  const getSpaceTypeText = (type: string) => {
    switch (type) {
      case '펜션': return '펜션'
      case '독채펜션': return '독채펜션'
      case '풀빌라': return '풀빌라'
      case '한옥': return '한옥'
      case '전원주택': return '전원주택'
      default: return type
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중'
      case 'in_progress': return '처리중'
      case 'resolved': return '해결완료'
      case 'closed': return '종료'
      default: return status
    }
  }

  const handleViewDetail = (inquiry: PartnershipInquiry | PartnerInquiry, type: InquiryType) => {
    setSelectedInquiry(inquiry)
    setSelectedType(type)
    if (type === 'partnership') {
      setResponse((inquiry as PartnershipInquiry).notes || '')
    } else {
      setResponse((inquiry as PartnerInquiry).admin_notes || '')
    }
    setIsDetailOpen(true)
  }

  const handleRespond = async () => {
    if (!selectedInquiry || !response.trim() || !selectedType) return

    try {
      setResponding(true)

      // 실제 환경에서는 Supabase 업데이트
      const tableName = selectedType === 'partnership' ? 'partnership_inquiries' : 'partner_inquiries'
      const updateField = selectedType === 'partnership' ? 'notes' : 'admin_notes'
      
      const { error } = await supabase
        .from(tableName)
        .update({
          [updateField]: response,
          status: 'resolved',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedInquiry.id)

      if (error) {
        // 목업 처리
        console.log('목업 응답 처리:', response)
      }

      alert('응답이 등록되었습니다.')
      setIsDetailOpen(false)
      loadInquiries()
    } catch (error) {
      console.error('응답 등록 실패:', error)
      alert('응답 등록에 실패했습니다.')
    } finally {
      setResponding(false)
    }
  }

  // 필터링된 문의사항들 가져오기
  const getFilteredInquiries = () => {
    const allInquiries = []
    
    if (typeFilter === 'all' || typeFilter === 'partnership') {
      const filtered = partnershipInquiries.filter(inquiry => {
        const matchesSearch = !searchQuery || 
          inquiry.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inquiry.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inquiry.business_type.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter
        return matchesSearch && matchesStatus
      }).map(inquiry => ({ ...inquiry, type: 'partnership' as const }))
      allInquiries.push(...filtered)
    }
    
    if (typeFilter === 'all' || typeFilter === 'partner') {
      const filtered = partnerInquiries.filter(inquiry => {
        const matchesSearch = !searchQuery || 
          inquiry.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inquiry.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inquiry.location.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter
        return matchesSearch && matchesStatus
      }).map(inquiry => ({ ...inquiry, type: 'partner' as const }))
      allInquiries.push(...filtered)
    }
    
    return allInquiries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
  
  const filteredInquiries = getFilteredInquiries()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">제휴 및 입점 문의</h1>
          <p className="text-gray-600">제휴 문의와 입점 문의를 통합 관리합니다.</p>
        </div>
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
                  placeholder="회사명, 업체명, 문의자명으로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">전체 상태</option>
              <option value="pending">대기중</option>
              <option value="in_progress">처리중</option>
              <option value="resolved">해결완료</option>
              <option value="closed">종료</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as InquiryType | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">전체 문의</option>
              <option value="partnership">제휴 문의</option>
              <option value="partner">입점 문의</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* 문의사항 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>
            문의사항 목록 ({filteredInquiries.length}건)
            <span className="ml-2 text-sm font-normal text-gray-500">
              제휴: {partnershipInquiries.length}건 | 입점: {partnerInquiries.length}건
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p>로딩 중...</p>
            </div>
          ) : filteredInquiries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? '검색 결과가 없습니다.' : '등록된 문의사항이 없습니다.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">구분</TableHead>
                    <TableHead>회사/업체명</TableHead>
                    <TableHead className="w-32">문의자</TableHead>
                    <TableHead className="w-32">연락처</TableHead>
                    <TableHead className="w-24">유형</TableHead>
                    <TableHead className="w-20">상태</TableHead>
                    <TableHead className="w-32">등록일</TableHead>
                    <TableHead className="w-20">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInquiries.map((inquiry) => (
                    <TableRow key={`${inquiry.type}-${inquiry.id}`}>
                      <TableCell>
                        <Badge variant={inquiry.type === 'partnership' ? 'default' : 'secondary'}>
                          {inquiry.type === 'partnership' ? '제휴' : '입점'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium truncate">
                            {inquiry.type === 'partnership' 
                              ? (inquiry as PartnershipInquiry & {type: 'partnership'}).company_name
                              : (inquiry as PartnerInquiry & {type: 'partner'}).business_name
                            }
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {inquiry.type === 'partnership'
                              ? (inquiry as PartnershipInquiry & {type: 'partnership'}).inquiry.substring(0, 50) + '...'
                              : `${(inquiry as PartnerInquiry & {type: 'partner'}).location} · ${(inquiry as PartnerInquiry & {type: 'partner'}).space_type}`
                            }
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{inquiry.contact_name}</div>
                          <div className="text-gray-500">
                            {inquiry.type === 'partnership' 
                              ? (inquiry as PartnershipInquiry & {type: 'partnership'}).email
                              : (inquiry as PartnerInquiry & {type: 'partner'}).phone
                            }
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {inquiry.type === 'partnership'
                            ? (inquiry as PartnershipInquiry & {type: 'partnership'}).phone || '-'
                            : (inquiry as PartnerInquiry & {type: 'partner'}).website_url
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {inquiry.type === 'partnership'
                            ? getBusinessTypeText((inquiry as PartnershipInquiry & {type: 'partnership'}).business_type)
                            : getSpaceTypeText((inquiry as PartnerInquiry & {type: 'partner'}).space_type)
                          }
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(inquiry.status)}>
                          {getStatusText(inquiry.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(inquiry.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleViewDetail(inquiry, inquiry.type)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 상세보기 다이얼로그 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {selectedType === 'partnership' ? '제휴' : '입점'} 문의 상세보기
            </DialogTitle>
          </DialogHeader>
          
          {selectedInquiry && selectedType && (
            <div className="space-y-6">
              {/* 문의 기본정보 */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-600" />
                  <div>
                    <span className="text-sm text-gray-600">문의자: </span>
                    <span className="font-medium">{selectedInquiry.contact_name}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <Building className="w-4 h-4 mr-2 text-gray-600" />
                  <div>
                    <span className="text-sm text-gray-600">
                      {selectedType === 'partnership' ? '회사명' : '업체명'}: 
                    </span>
                    <span>
                      {selectedType === 'partnership'
                        ? (selectedInquiry as PartnershipInquiry).company_name
                        : (selectedInquiry as PartnerInquiry).business_name
                      }
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-gray-600" />
                  <span className="text-sm">
                    {selectedType === 'partnership'
                      ? (selectedInquiry as PartnershipInquiry).email
                      : '이메일 없음'
                    }
                  </span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-600" />
                  <span className="text-sm">
                    {selectedType === 'partnership'
                      ? (selectedInquiry as PartnershipInquiry).phone || '-'
                      : (selectedInquiry as PartnerInquiry).phone
                    }
                  </span>
                </div>
                {selectedType === 'partner' && (
                  <>
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-2 text-gray-600" />
                      <span className="text-sm">{(selectedInquiry as PartnerInquiry).website_url}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-gray-600" />
                      <span className="text-sm">{(selectedInquiry as PartnerInquiry).location}</span>
                    </div>
                  </>
                )}
              </div>

              {/* 문의내용 */}
              <div>
                <h3 className="font-semibold text-lg mb-2">문의내용</h3>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={selectedType === 'partnership' ? 'default' : 'secondary'}>
                    {selectedType === 'partnership' ? '제휴문의' : '입점문의'}
                  </Badge>
                  <Badge variant="outline">
                    {selectedType === 'partnership'
                      ? getBusinessTypeText((selectedInquiry as PartnershipInquiry).business_type)
                      : getSpaceTypeText((selectedInquiry as PartnerInquiry).space_type)
                    }
                  </Badge>
                  <Badge className={getStatusColor(selectedInquiry.status)}>
                    {getStatusText(selectedInquiry.status)}
                  </Badge>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {selectedType === 'partnership' ? (
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {(selectedInquiry as PartnershipInquiry).inquiry}
                    </p>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <div><strong>공간유형:</strong> {(selectedInquiry as PartnerInquiry).space_type}</div>
                      <div><strong>일일 요금:</strong> {(selectedInquiry as PartnerInquiry).daily_rate}</div>
                      <div><strong>평균 유휴일:</strong> {(selectedInquiry as PartnerInquiry).average_idle_days}</div>
                      {(selectedInquiry as PartnerInquiry).parking_spaces && (
                        <div><strong>주차공간:</strong> {(selectedInquiry as PartnerInquiry).parking_spaces}</div>
                      )}
                      {(selectedInquiry as PartnerInquiry).amenities && (
                        <div><strong>부대시설:</strong> {(selectedInquiry as PartnerInquiry).amenities}</div>
                      )}
                      {(selectedInquiry as PartnerInquiry).notes && (
                        <div><strong>추가사항:</strong> {(selectedInquiry as PartnerInquiry).notes}</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(selectedInquiry.created_at).toLocaleString('ko-KR')}
                </div>
              </div>

              {/* 기존 응답 */}
              {((selectedType === 'partnership' && (selectedInquiry as PartnershipInquiry).notes) ||
                (selectedType === 'partner' && (selectedInquiry as PartnerInquiry).admin_notes)) && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    응답 내역
                  </h4>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {selectedType === 'partnership'
                        ? (selectedInquiry as PartnershipInquiry).notes
                        : (selectedInquiry as PartnerInquiry).admin_notes
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* 응답 작성 */}
              <div>
                <h4 className="font-semibold mb-2">
                  {((selectedType === 'partnership' && (selectedInquiry as PartnershipInquiry).notes) ||
                    (selectedType === 'partner' && (selectedInquiry as PartnerInquiry).admin_notes))
                    ? '응답 수정' : '응답 작성'}
                </h4>
                <Textarea
                  placeholder="응답을 입력해주세요..."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={5}
                  className="mb-3"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleRespond}
                    disabled={!response.trim() || responding}
                  >
                    {responding ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        처리중...
                      </>
                    ) : (
                      '응답 등록'
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                    취소
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}