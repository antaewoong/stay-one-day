'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { X, CheckCircle } from 'lucide-react'

interface PartnerInquiryModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PartnerInquiryModal({ isOpen, onClose }: PartnerInquiryModalProps) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    phone: '',
    websiteUrl: '',
    location: '',
    spaceType: '',
    dailyRate: '',
    averageIdleDays: '',
    parkingSpaces: '',
    amenities: '',
    notes: '',
    privacyConsent: false,
    marketingConsent: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsSubmitting(true)
      
      const response = await fetch('/api/partner-inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('문의 접수에 실패했습니다.')
      }

      setIsSubmitted(true)
    } catch (error) {
      console.error('Error submitting inquiry:', error)
      alert('문의 접수에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  const handleClose = () => {
    setIsSubmitted(false)
    setFormData({
      businessName: '',
      contactName: '',
      phone: '',
      websiteUrl: '',
      location: '',
      spaceType: '',
      dailyRate: '',
      averageIdleDays: '',
      parkingSpaces: '',
      amenities: '',
      notes: '',
      privacyConsent: false,
      marketingConsent: false
    })
    onClose()
  }

  if (!isOpen) return null

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-8 relative">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full mx-auto flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-gray-900" />
            </div>
            <h3 className="text-xl font-light text-gray-900 mb-4">문의가 접수되었습니다</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-8">
              입점 문의를 주셔서 감사합니다.<br />
              담당자가 검토 후 영업일 기준 2-3일 내에<br />
              연락드리겠습니다.
            </p>
            <Button 
              onClick={handleClose} 
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 text-sm font-medium rounded-md"
            >
              확인
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden relative">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-light text-gray-900 mb-2">입점 문의</h2>
          <p className="text-gray-600 text-sm">
            스테이 원데이와 함께할 파트너가 되어주세요
          </p>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* 필수 정보 */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">
                필수 정보
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-sm text-gray-700 mb-2 block">사업자명 *</Label>
                  <Input
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder=""
                    className="border-gray-200 focus:border-gray-900 focus:ring-0 text-sm"
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-700 mb-2 block">담당자 *</Label>
                  <Input
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    placeholder=""
                    className="border-gray-200 focus:border-gray-900 focus:ring-0 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <Label className="text-sm text-gray-700 mb-2 block">연락처 *</Label>
                <Input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="010-1234-5678"
                  className="border-gray-200 focus:border-gray-900 focus:ring-0 text-sm"
                  required
                />
              </div>

              <div className="mb-4">
                <Label className="text-sm text-gray-700 mb-2 block">홈페이지 또는 스마트플레이스 URL *</Label>
                <Input
                  name="websiteUrl"
                  type="url"
                  value={formData.websiteUrl}
                  onChange={handleChange}
                  placeholder="https://example.com 또는 네이버 플레이스 URL"
                  className="border-gray-200 focus:border-gray-900 focus:ring-0 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-sm text-gray-700 mb-2 block">지역 *</Label>
                  <Input
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder=""
                    className="border-gray-200 focus:border-gray-900 focus:ring-0 text-sm"
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-700 mb-2 block">공간 유형 *</Label>
                  <select
                    name="spaceType"
                    value={formData.spaceType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:border-gray-900 focus:outline-none"
                    required
                  >
                    <option value="">선택해주세요</option>
                    <option value="pension">펜션</option>
                    <option value="villa">풀빌라</option>
                    <option value="hotel">호텔</option>
                    <option value="other">기타</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-sm text-gray-700 mb-2 block">하루 이용요금(희망) *</Label>
                  <Input
                    name="dailyRate"
                    value={formData.dailyRate}
                    onChange={handleChange}
                    placeholder=""
                    className="border-gray-200 focus:border-gray-900 focus:ring-0 text-sm"
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-700 mb-2 block">비숙박일 평균(추정) *</Label>
                  <Input
                    name="averageIdleDays"
                    value={formData.averageIdleDays}
                    onChange={handleChange}
                    placeholder=""
                    className="border-gray-200 focus:border-gray-900 focus:ring-0 text-sm"
                    required
                  />
                </div>
              </div>

            </div>

            {/* 선택 정보 */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">
                선택 정보
              </h3>
              
              <div className="mb-4">
                <Label className="text-sm text-gray-700 mb-2 block">주차 가능대수</Label>
                <Input
                  name="parkingSpaces"
                  value={formData.parkingSpaces}
                  onChange={handleChange}
                  placeholder=""
                  className="border-gray-200 focus:border-gray-900 focus:ring-0 text-sm"
                />
              </div>

              <div className="mb-4">
                <Label className="text-sm text-gray-700 mb-2 block">부대시설</Label>
                <Textarea
                  name="amenities"
                  value={formData.amenities}
                  onChange={handleChange}
                  placeholder=""
                  rows={3}
                  className="border-gray-200 focus:border-gray-900 focus:ring-0 text-sm resize-none"
                />
              </div>

              <div>
                <Label className="text-sm text-gray-700 mb-2 block">특이사항</Label>
                <Textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder=""
                  rows={3}
                  className="border-gray-200 focus:border-gray-900 focus:ring-0 text-sm resize-none"
                />
              </div>
            </div>

            {/* 동의 항목 */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">
                동의 항목
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="privacyConsent"
                    checked={formData.privacyConsent}
                    onChange={(e) => handleCheckboxChange('privacyConsent', e.target.checked)}
                    className="mt-1 h-4 w-4 text-gray-900 border-gray-300 rounded focus:ring-0"
                  />
                  <label htmlFor="privacyConsent" className="text-sm text-gray-600">
                    <span className="font-medium text-gray-900">[필수]</span> 개인정보 수집·이용에 동의합니다.
                  </label>
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="marketingConsent"
                    checked={formData.marketingConsent}
                    onChange={(e) => handleCheckboxChange('marketingConsent', e.target.checked)}
                    className="mt-1 h-4 w-4 text-gray-900 border-gray-300 rounded focus:ring-0"
                  />
                  <label htmlFor="marketingConsent" className="text-sm text-gray-600">
                    <span className="text-gray-700">[선택]</span> 마케팅 정보 수신에 동의합니다.
                  </label>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4 border-t border-gray-100">
              <Button 
                type="button" 
                onClick={handleClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 rounded-md"
              >
                취소
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white rounded-md font-medium"
                disabled={!formData.privacyConsent || isSubmitting}
              >
                {isSubmitting ? '접수중...' : '입점문의 보내기'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}