'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CalendarIcon, 
  Loader2, 
  Send, 
  AlertCircle,
  Users,
  MapPin,
  Clock,
  CheckCircle2
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'react-hot-toast'

interface Accommodation {
  id: string
  name: string
  location: string
  price_per_night: number
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
  const [influencer, setInfluencer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentPeriod, setCurrentPeriod] = useState<CollaborationPeriod | null>(null)
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [useDate, setUseDate] = useState<Date>()
  
  const [formData, setFormData] = useState({
    accommodation_id: '',
    guest_count: 2,
    request_type: 'free' as 'free' | 'paid',
    message: ''
  })

  useEffect(() => {
    // 인플루언서 로그인 체크
    const userData = sessionStorage.getItem('influencerUser')
    if (!userData) {
      router.push('/influencer/login')
      return
    }

    const influencerData = JSON.parse(userData)
    setInfluencer(influencerData)
    
    loadPageData()
  }, [router])

  const loadPageData = async () => {
    try {
      setLoading(true)
      
      // 현재 협업 기간 정보 로드
      const periodResponse = await fetch('/api/influencer/current-period')
      const periodResult = await periodResponse.json()
      
      if (periodResult.success && periodResult.period) {
        setCurrentPeriod(periodResult.period)
        
        // 협업 신청이 오픈된 경우에만 숙소 목록 로드
        if (periodResult.period.is_open) {
          const accoResponse = await fetch('/api/accommodations?status=active&limit=50')
          const accoResult = await accoResponse.json()
          
          if (accoResult.success) {
            setAccommodations(accoResult.data)
          }
        }
      }
    } catch (error) {
      console.error('페이지 데이터 로드 실패:', error)
      toast.error('페이지를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
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
      const response = await fetch('/api/influencer/submit-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          influencer_id: influencer.id,
          accommodation_id: formData.accommodation_id,
          request_type: formData.request_type,
          message: formData.message,
          use_date: format(useDate, 'yyyy-MM-dd'),
          guest_count: formData.guest_count
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success('협업 신청이 완료되었습니다!')
        router.push('/influencer/my-applications')
      } else {
        toast.error(result.message || '협업 신청에 실패했습니다.')
      }
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
                  <SelectContent>
                    {accommodations.map(accommodation => (
                      <SelectItem key={accommodation.id} value={accommodation.id}>
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="font-medium">{accommodation.name}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {accommodation.location}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            ₩{accommodation.price_per_night?.toLocaleString()}/당일이용
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {useDate ? format(useDate, 'PPP', { locale: ko }) : '날짜를 선택해주세요'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={useDate}
                      onSelect={setUseDate}
                      disabled={(date) => 
                        date < new Date(currentPeriod.collaboration_start_date) || 
                        date > new Date(currentPeriod.collaboration_end_date) ||
                        date < new Date()
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <div className="text-xs text-gray-500 mt-1">
                  당일 이용 서비스입니다. 원하는 이용 날짜를 선택해주세요.
                </div>
              </div>

              {/* 인원 */}
              <div>
                <Label htmlFor="guest_count">예정 인원 *</Label>
                <Select value={formData.guest_count.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, guest_count: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {num}명
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 협업 유형 선택 */}
              <div>
                <Label className="text-base font-semibold mb-4 block">협업 유형 선택 *</Label>
                
                {/* 무상 협업 옵션 */}
                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all mb-3 ${
                    formData.request_type === 'free' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, request_type: 'free' }))}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="radio"
                          name="request_type"
                          value="free"
                          checked={formData.request_type === 'free'}
                          onChange={() => setFormData(prev => ({ ...prev, request_type: 'free' }))}
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
                        블로그 지수 관리가 필요한 인플루언서를 위한 옵션입니다.
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
                    
                    const dayUsePrice = selectedAccommodation.price_per_night // 당일 이용 가격 (1일 가격과 동일)
                    const discountedPrice = Math.round(dayUsePrice * 0.3)
                    
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span>{selectedAccommodation.name} (당일 이용)</span>
                          <span className="text-gray-600">₩{dayUsePrice.toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(useDate, 'PPP', { locale: ko })} 이용 예정
                        </div>
                        
                        {formData.request_type === 'free' ? (
                          <div className="flex justify-between items-center font-semibold text-green-600 border-t pt-2">
                            <span>최종 금액 (무상 협업)</span>
                            <span className="text-xl">무료</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-center text-sm text-red-600">
                              <span>할인 금액 (70% 할인)</span>
                              <span>-₩{(dayUsePrice - discountedPrice).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center font-semibold text-purple-600 border-t pt-2">
                              <span>최종 금액 (30% 지급)</span>
                              <span className="text-xl">₩{discountedPrice.toLocaleString()}</span>
                            </div>
                            <div className="text-xs text-gray-500 text-center">
                              일반 당일 이용 대비 70% 절약!
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