'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Loader2, Send } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Influencer {
  id: string
  name: string
  email: string
  phone: string
  instagram_handle: string
  youtube_channel: string
  tiktok_handle: string
  follower_count: number
  content_category: string[]
}

interface Accommodation {
  id: string
  name: string
  location: string
  price_per_night: number
}

export default function InfluencerRequestPage() {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [influencer, setInfluencer] = useState<Influencer | null>(null)
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
    loadInfluencerData()
    loadAccommodations()
  }, [token])

  const loadInfluencerData = async () => {
    try {
      const response = await fetch(`/api/influencer/verify-token/${token}`)
      const result = await response.json()
      
      if (result.success) {
        setInfluencer(result.influencer)
      } else {
        alert('유효하지 않은 링크입니다.')
      }
    } catch (error) {
      console.error('인플루언서 정보 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAccommodations = async () => {
    try {
      const response = await fetch('/api/accommodations?status=active&limit=50')
      const result = await response.json()
      
      if (result.success) {
        setAccommodations(result.data)
      }
    } catch (error) {
      console.error('숙소 목록 로드 실패:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!checkInDate || !checkOutDate) {
      alert('체크인/체크아웃 날짜를 선택해주세요.')
      return
    }
    
    if (!formData.accommodation_id) {
      alert('숙소를 선택해주세요.')
      return
    }

    setSubmitting(true)
    
    try {
      const response = await fetch('/api/influencer/collaboration-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
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
        alert('협업 신청이 완료되었습니다! 호스트의 승인을 기다려주세요.')
        // 폼 초기화
        setFormData({
          accommodation_id: '',
          guest_count: 2,
          request_type: 'barter',
          proposed_rate: 0,
          message: ''
        })
        setCheckInDate(undefined)
        setCheckOutDate(undefined)
      } else {
        alert(result.message || '협업 신청에 실패했습니다.')
      }
    } catch (error) {
      console.error('협업 신청 실패:', error)
      alert('서버 오류가 발생했습니다.')
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

  if (!influencer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">접근 불가</h2>
            <p className="text-gray-600">유효하지 않은 링크이거나 만료된 링크입니다.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">스테이 원데이 협업 신청</CardTitle>
            <div className="text-center text-gray-600">
              <p>안녕하세요, <span className="font-semibold text-blue-600">{influencer.name}</span>님!</p>
              <p className="text-sm mt-1">아래 양식을 작성하여 협업을 신청해주세요.</p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* 인플루언서 정보 표시 */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">내 정보</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>📧 {influencer.email}</div>
                <div>📱 {influencer.phone}</div>
                {influencer.instagram_handle && <div>📷 {influencer.instagram_handle}</div>}
                {influencer.youtube_channel && <div>🎥 {influencer.youtube_channel}</div>}
                <div>👥 팔로워 {influencer.follower_count?.toLocaleString()}명</div>
                <div>🏷️ {influencer.content_category?.join(', ')}</div>
              </div>
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
                        {accommodation.name} - {accommodation.location} (₩{accommodation.price_per_night?.toLocaleString()}/박)
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
                        disabled={(date) => date < new Date() || date < new Date()}
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
                        disabled={(date) => date < new Date() || (checkInDate && date <= checkInDate)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* 인원 */}
              <div>
                <Label htmlFor="guest_count">예정 인원 (변경 불가) *</Label>
                <Select value={formData.guest_count.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, guest_count: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <SelectItem key={num} value={num.toString()}>{num}명</SelectItem>
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

              <Button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    신청 중...
                  </>
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