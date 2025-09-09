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
  const [checkInDate, setCheckInDate] = useState<Date>()
  const [checkOutDate, setCheckOutDate] = useState<Date>()
  
  const [formData, setFormData] = useState({
    accommodation_id: '',
    guest_count: 2,
    request_type: 'barter' as 'paid' | 'barter' | 'partnership',
    proposed_rate: 0,
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

    if (!checkInDate || !checkOutDate) {
      toast.error('체크인/체크아웃 날짜를 선택해주세요.')
      return
    }
    
    if (!formData.accommodation_id) {
      toast.error('숙소를 선택해주세요.')
      return
    }

    // 날짜 검증 (협업 기간 내인지 확인)
    const collabStart = new Date(currentPeriod.collaboration_start_date)
    const collabEnd = new Date(currentPeriod.collaboration_end_date)
    
    if (checkInDate < collabStart || checkOutDate > collabEnd) {
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
          proposed_rate: formData.request_type === 'paid' ? formData.proposed_rate : null,
          message: formData.message,
          check_in_date: format(checkInDate, 'yyyy-MM-dd'),
          check_out_date: format(checkOutDate, 'yyyy-MM-dd'),
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
                            ₩{accommodation.price_per_night?.toLocaleString()}/박
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 체크인/체크아웃 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>체크인 날짜 *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkInDate ? format(checkInDate, 'PPP', { locale: ko }) : '날짜 선택'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={checkInDate}
                        onSelect={setCheckInDate}
                        disabled={(date) => 
                          date < new Date(currentPeriod.collaboration_start_date) || 
                          date > new Date(currentPeriod.collaboration_end_date)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>체크아웃 날짜 *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkOutDate ? format(checkOutDate, 'PPP', { locale: ko }) : '날짜 선택'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={checkOutDate}
                        onSelect={setCheckOutDate}
                        disabled={(date) => 
                          date < new Date(currentPeriod.collaboration_start_date) || 
                          date > new Date(currentPeriod.collaboration_end_date) ||
                          (checkInDate && date <= checkInDate)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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

              {/* 협업 유형 */}
              <div>
                <Label>협업 유형 *</Label>
                <Select value={formData.request_type} onValueChange={(value: 'paid' | 'barter' | 'partnership') => setFormData(prev => ({ ...prev, request_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="barter">물물교환 (무료 숙박 + 콘텐츠 제작)</SelectItem>
                    <SelectItem value="paid">유료 협업 (숙박비 + 추가 수수료)</SelectItem>
                    <SelectItem value="partnership">파트너십 (장기 협업)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 희망 수수료 (유료일 때만) */}
              {formData.request_type === 'paid' && (
                <div>
                  <Label htmlFor="proposed_rate">희망 수수료 (원)</Label>
                  <Input
                    id="proposed_rate"
                    type="number"
                    value={formData.proposed_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, proposed_rate: parseInt(e.target.value) || 0 }))}
                    placeholder="희망하는 수수료를 입력해주세요"
                  />
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