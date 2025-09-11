'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import { 
  CalendarIcon, 
  Loader2, 
  Send, 
  AlertCircle,
  Users,
  MapPin,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Building2,
  Plus,
  Minus
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'react-hot-toast'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface Accommodation {
  id: string
  name: string
  address: string
  region: string
  base_price: number
  max_capacity: number
  images: string[]
  description: string
}

interface CollaborationPeriod {
  id: string
  year: number
  month: number
  is_open: boolean
  application_start_date: string
  application_end_date: string
  collaboration_start_date: string
  collaboration_end_date: string
  max_applications: number
  current_applications: number
  announcement: string
}

export default function InfluencerApplyPage() {
  const router = useRouter()
  const supabase = createClient()
  const [influencer, setInfluencer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentPeriod, setCurrentPeriod] = useState<CollaborationPeriod | null>(null)
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [useDate, setUseDate] = useState<Date>()
  const [calendarOpen, setCalendarOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    accommodation_id: '',
    guest_count: 2,
    request_type: 'barter' as 'barter' | 'paid',
    message: ''
  })

  useEffect(() => {
    checkAuthAndLoadData()
  }, [router])

  const checkAuthAndLoadData = async () => {
    try {
      setLoading(true)
      
      // Supabase Auth 세션 체크
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.log('인증되지 않은 사용자, 로그인 페이지로 이동')
        router.push('/influencer/login')
        return
      }

      console.log('✅ 인증된 사용자:', user.id)

      // influencers 테이블에서 인플루언서 정보 조회
      const { data: influencerData, error: influencerError } = await supabase
        .from('influencers')
        .select('*')
        .eq('email', user.email)
        .eq('status', 'active')
        .single()

      if (influencerError || !influencerData) {
        console.error('인플루언서 정보 조회 실패:', influencerError)
        toast.error('인플루언서 정보를 찾을 수 없습니다.')
        router.push('/influencer/login')
        return
      }

      console.log('✅ 인플루언서 정보 조회 성공:', influencerData.name)
      setInfluencer(influencerData)
      
      await loadPageData()
    } catch (error) {
      console.error('인증 체크 중 오류:', error)
      router.push('/influencer/login')
    } finally {
      setLoading(false)
    }
  }

  const loadPageData = async () => {
    try {
      console.log('📊 페이지 데이터 로드 중...')
      
      // 현재 협업 기간 정보 로드
      const periodResponse = await fetch('/api/influencer/current-period')
      const periodResult = await periodResponse.json()
      
      console.log('📅 협업 기간 조회 결과:', periodResult)
      
      if (periodResult.success && periodResult.period) {
        setCurrentPeriod(periodResult.period)
        
        // 협업 신청이 오픈된 경우에만 숙소 목록 로드
        if (periodResult.period.is_open) {
          console.log('🏠 협업 숙소 목록 로드 중...')
          const accoResponse = await fetch('/api/accommodations?status=active&collaboration_only=true&limit=50')
          const accoResult = await accoResponse.json()
          
          console.log('🏠 협업 숙소 조회 결과:', accoResult)
          
          if (accoResult.data && Array.isArray(accoResult.data)) {
            setAccommodations(accoResult.data)
            console.log('✅ 협업 숙소 로드 완료:', accoResult.data.length, '개')
          } else {
            console.error('❌ 협업 숙소 조회 실패:', accoResult.error || '데이터 형식 오류')
            toast.error('협업 가능한 숙소를 불러오는데 실패했습니다.')
          }
        } else {
          console.log('📋 협업 신청이 오픈되지 않음, 숙소 목록 로드 생략')
        }
      } else {
        console.error('❌ 협업 기간 조회 실패:', periodResult.message)
      }
    } catch (error) {
      console.error('💥 페이지 데이터 로드 실패:', error)
      toast.error('페이지를 불러올 수 없습니다.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentPeriod?.is_open) {
      toast.error('현재 협업 신청 기간이 아닙니다.')
      return
    }

    if (!useDate) {
      toast.error('이용 날짜를 선택해주세요.')
      return
    }
    
    if (!formData.accommodation_id) {
      toast.error('숙소를 선택해주세요.')
      return
    }

    // 날짜 검증 (협업 기간 내인지 확인)
    const collabStart = new Date(currentPeriod.collaboration_start_date)
    const collabEnd = new Date(currentPeriod.collaboration_end_date)
    
    if (useDate < collabStart || useDate > collabEnd) {
      toast.error(`협업 기간(${format(collabStart, 'MM/dd')} ~ ${format(collabEnd, 'MM/dd')}) 내에서 날짜를 선택해주세요.`)
      return
    }

    setSubmitting(true)
    
    try {
      // 선택된 숙소 정보 조회
      const selectedAccommodation = accommodations.find(acc => acc.id === formData.accommodation_id)
      if (!selectedAccommodation) {
        toast.error('숙소 정보를 찾을 수 없습니다.')
        return
      }

      // 중복 신청 확인
      const applicationStart = new Date(currentPeriod.application_start_date)
      const applicationEnd = new Date(currentPeriod.application_end_date)
      
      const { data: existingRequest } = await supabase
        .from('influencer_collaboration_requests')
        .select('id')
        .eq('influencer_id', influencer.id)
        .eq('accommodation_id', formData.accommodation_id)
        .gte('created_at', applicationStart.toISOString())
        .lte('created_at', applicationEnd.toISOString())
        .maybeSingle()

      if (existingRequest) {
        toast.error('이미 이 숙소에 협업 신청을 하셨습니다.')
        return
      }

      // 협업 요청 생성
      const { data: collaborationRequest, error: createError } = await supabase
        .from('influencer_collaboration_requests')
        .insert({
          influencer_id: influencer.id,
          accommodation_id: formData.accommodation_id,
          host_id: selectedAccommodation.host_id,
          request_type: formData.request_type,
          proposed_rate: formData.request_type === 'paid' ? totalCost : null,
          message: formData.message || '',
          check_in_date: format(useDate, 'yyyy-MM-dd'),
          check_out_date: format(useDate, 'yyyy-MM-dd'),
          guest_count: formData.guest_count,
          status: 'pending',
          final_status: 'pending'
        })
        .select()
        .single()

      if (createError) {
        console.error('협업 요청 생성 에러:', createError)
        toast.error('협업 신청에 실패했습니다.')
        return
      }

      // 현재 신청 수 증가
      const { error: updateError } = await supabase
        .from('collaboration_periods')
        .update({ 
          current_applications: currentPeriod.current_applications + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentPeriod.id)

      if (updateError) {
        console.error('신청 수 업데이트 에러:', updateError)
      }

      toast.success(`협업 신청이 완료되었습니다. ${selectedAccommodation.name} 호스트의 승인을 기다려주세요.`)
      router.push('/influencer/my-applications')
    } catch (error) {
      console.error('협업 신청 실패:', error)
      toast.error('서버 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>로딩 중...</span>
        </div>
      </div>
    )
  }

  if (!currentPeriod) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">협업 신청 정보 없음</h2>
              <p className="text-gray-600">현재 진행 중인 협업 모집이 없습니다.</p>
              <Button 
                className="mt-4"
                onClick={() => router.push('/influencer/dashboard')}
              >
                대시보드로 돌아가기
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!currentPeriod.is_open) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                {currentPeriod.year}년 {currentPeriod.month}월 협업 모집
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Badge variant="secondary" className="mb-4">
                <Clock className="mr-2 h-4 w-4" />
                모집 예정
              </Badge>
              
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {currentPeriod.announcement}
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 p-4 rounded-lg mb-6 text-sm space-y-2">
                <div><span className="font-medium">신청 기간:</span> {format(new Date(currentPeriod.application_start_date), 'PPP', { locale: ko })} ~ {format(new Date(currentPeriod.application_end_date), 'PPP', { locale: ko })}</div>
                <div><span className="font-medium">협업 기간:</span> {format(new Date(currentPeriod.collaboration_start_date), 'PPP', { locale: ko })} ~ {format(new Date(currentPeriod.collaboration_end_date), 'PPP', { locale: ko })}</div>
                <div><span className="font-medium">모집 인원:</span> {currentPeriod.max_applications}명</div>
              </div>

              <Button onClick={() => router.push('/influencer/dashboard')}>
                대시보드로 돌아가기
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* 상단 네비게이션 */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => router.push('/influencer/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            대시보드
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">협업 신청</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center">
              {currentPeriod.year}년 {currentPeriod.month}월 협업 신청
            </CardTitle>
            <div className="text-center">
              <Badge className="bg-green-600">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                신청 가능 ({currentPeriod.current_applications}/{currentPeriod.max_applications})
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {currentPeriod.announcement}
              </AlertDescription>
            </Alert>

            <div className="bg-blue-50 p-4 rounded-lg mb-6 text-sm space-y-2">
              <div><span className="font-medium">신청 마감:</span> {format(new Date(currentPeriod.application_end_date), 'PPP pp', { locale: ko })}</div>
              <div><span className="font-medium">협업 기간:</span> {format(new Date(currentPeriod.collaboration_start_date), 'MM/dd')} ~ {format(new Date(currentPeriod.collaboration_end_date), 'MM/dd')}</div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 숙소 선택 */}
              <div>
                <Label htmlFor="accommodation">희망 숙소 *</Label>
                <Select value={formData.accommodation_id} onValueChange={(value) => setFormData(prev => ({ ...prev, accommodation_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="숙소를 선택해주세요" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {accommodations.map(accommodation => (
                      <SelectItem key={accommodation.id} value={accommodation.id}>
                        <div className="flex items-center gap-3 w-full">
                          {/* 숙소 이미지 */}
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                            {accommodation.images && accommodation.images.length > 0 ? (
                              <img
                                src={accommodation.images[0]}
                                alt={accommodation.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* 숙소 정보 */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{accommodation.name}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {accommodation.region}
                            </div>
                          </div>
                          
                          {/* 인원 및 가격 정보 */}
                          <div className="text-xs text-gray-500 flex-shrink-0 text-right">
                            <div className="flex items-center gap-1 mb-1">
                              <Users className="w-3 h-3" />
                              최대 {accommodation.max_capacity}명
                            </div>
                            <div>₩{accommodation.base_price?.toLocaleString()}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 이용 날짜 */}
              <div>
                <Label>이용 날짜 *</Label>
                
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal h-12">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {useDate ? format(useDate, 'PPP', { locale: ko }) : '날짜를 선택해주세요'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white">
                    <Calendar
                      mode="single"
                      selected={useDate}
                      onSelect={(date) => {
                        setUseDate(date)
                        setCalendarOpen(false)
                      }}
                      disabled={(date) => {
                        if (!currentPeriod) return true
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const startDate = new Date(currentPeriod.collaboration_start_date)
                        const endDate = new Date(currentPeriod.collaboration_end_date)
                        
                        return date < today || date < startDate || date > endDate
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <div className="text-xs text-gray-500 mt-2">
                  협업 기간: {format(new Date(currentPeriod.collaboration_start_date), 'MM월 dd일', { locale: ko })} ~ {format(new Date(currentPeriod.collaboration_end_date), 'MM월 dd일', { locale: ko })}
                </div>
              </div>

              {/* 인원 */}
              <div>
                <Label htmlFor="guest_count">예정 인원 *</Label>
                <div className="flex items-center justify-center gap-3 p-4 border rounded-lg bg-gray-50">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0"
                    disabled={formData.guest_count <= 1}
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      guest_count: Math.max(1, prev.guest_count - 1) 
                    }))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-2 min-w-0 px-6">
                    <Users className="h-4 w-4 text-gray-600" />
                    <span className="text-lg font-medium">{formData.guest_count}명</span>
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0"
                    disabled={formData.guest_count >= 20}
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      guest_count: Math.min(20, prev.guest_count + 1) 
                    }))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="text-sm text-gray-600 mt-2">
                  <div className="flex items-center gap-1">
                    <span>• 무상협업 기준: 최대 4명</span>
                  </div>
                  <div className="flex items-center gap-1 text-orange-600">
                    <span>• 기준인원 초과 시 추가 비용이 발생합니다</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600">
                    <span>• 유상협업: 기본료의 30% + 초과인원 추가비</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>• 최대 수용인원: 20명</span>
                  </div>
                </div>
              </div>

              {/* 협업 유형 선택 */}
              <div>
                <Label className="text-base font-semibold mb-4 block">협업 유형 선택 *</Label>
                
                {/* 무상 협업 옵션 */}
                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all mb-3 ${
                    formData.request_type === 'barter' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, request_type: 'barter' }))}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="radio"
                          name="request_type"
                          value="barter"
                          checked={formData.request_type === 'barter'}
                          onChange={() => setFormData(prev => ({ ...prev, request_type: 'barter' }))}
                          className="text-blue-600"
                        />
                        <span className="font-semibold text-lg">무상 협업</span>
                      </div>
                      <p className="text-sm text-gray-600 ml-6">
                        숙박 무료 제공 + 콘텐츠 제작<br/>
                        <span className="text-orange-600 font-medium">
                          ※ 무료 제공시 일반 이용 대비 일부 제한이 있을 수 있습니다.
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">무료</div>
                      <div className="text-xs text-gray-500">콘텐츠 제작만</div>
                    </div>
                  </div>
                </div>

                {/* 유상 협업 옵션 */}
                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    formData.request_type === 'paid' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, request_type: 'paid' }))}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="radio"
                          name="request_type"
                          value="paid"
                          checked={formData.request_type === 'paid'}
                          onChange={() => setFormData(prev => ({ ...prev, request_type: 'paid' }))}
                          className="text-purple-600"
                        />
                        <span className="font-semibold text-lg">유상 협업</span>
                      </div>
                      <p className="text-sm text-gray-600 ml-6">
                        <span className="font-medium text-purple-600">70% 할인된 가격 (30% 비용 지급)</span><br/>
                        블로그 지수 관리나 가족 여행으로 실제 활용하려는 인플루언서를 위한 옵션입니다.
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">30%</div>
                      <div className="text-xs text-gray-500">할인된 가격</div>
                      <div className="text-xs text-purple-600 font-medium">정가의 30%만</div>
                    </div>
                  </div>
                </div>

              </div>

              {/* 예상 비용 안내 */}
              {formData.accommodation_id && useDate && (
                <div className="bg-gray-50 border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">💰 예상 비용</h3>
                  {(() => {
                    const selectedAccommodation = accommodations.find(acc => acc.id === formData.accommodation_id)
                    if (!selectedAccommodation) return null
                    
                    const dayUsePrice = selectedAccommodation.base_price // 당일 이용 가격
                    const basePersons = 4 // 기준 인원
                    const extraPersons = Math.max(0, formData.guest_count - basePersons)
                    const extraPersonFee = extraPersons * 30000 // 초과 인원당 3만원
                    
                    const discountedPrice = Math.round(dayUsePrice * 0.3)
                    const totalExtraFee = extraPersonFee
                    const finalPrice = discountedPrice + totalExtraFee
                    
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span>{selectedAccommodation.name}</span>
                          <span className="text-gray-600">₩{dayUsePrice.toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(useDate, 'PPP', { locale: ko })} 이용 예정 • {formData.guest_count}명
                        </div>
                        
                        {formData.request_type === 'barter' ? (
                          <>
                            {extraPersons > 0 && (
                              <div className="bg-orange-50 border border-orange-200 rounded p-2 text-sm">
                                <div className="text-orange-700 font-medium">⚠️ 기준인원 초과</div>
                                <div className="text-orange-600 text-xs">
                                  기준 {basePersons}명 초과 {extraPersons}명 • 추가비용 ₩{totalExtraFee.toLocaleString()}
                                </div>
                              </div>
                            )}
                            <div className="flex justify-between items-center font-semibold text-green-600 border-t pt-2">
                              <span>최종 금액 (무상 협업)</span>
                              <span className="text-xl">
                                {extraPersons > 0 ? `₩${totalExtraFee.toLocaleString()}` : '무료'}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between items-center text-sm text-red-600">
                              <span>할인 금액 (70% 할인)</span>
                              <span>-₩{(dayUsePrice - discountedPrice).toLocaleString()}</span>
                            </div>
                            {extraPersons > 0 && (
                              <div className="flex justify-between items-center text-sm text-orange-600">
                                <span>초과인원 비용 ({extraPersons}명 × ₩30,000)</span>
                                <span>+₩{totalExtraFee.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center font-semibold text-purple-600 border-t pt-2">
                              <span>최종 금액 (30% 지급 + 추가비)</span>
                              <span className="text-xl">₩{finalPrice.toLocaleString()}</span>
                            </div>
                            <div className="text-xs text-gray-500 text-center">
                              일반 이용 대비 70% 절약!
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* 메시지 */}
              <div>
                <Label htmlFor="message">호스트에게 전달할 메시지</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="협업에 대한 구체적인 내용, 제작할 콘텐츠 유형, 일정 등을 자세히 작성해주세요."
                  rows={6}
                />
              </div>

              <Button 
                type="submit" 
                disabled={submitting || currentPeriod.current_applications >= currentPeriod.max_applications} 
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    신청 중...
                  </>
                ) : currentPeriod.current_applications >= currentPeriod.max_applications ? (
                  '모집 마감'
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    협업 신청하기
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}