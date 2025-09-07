'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Send, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function PartnershipPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    businessType: '',
    inquiry: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // 실제 구현에서는 API 호출
    setIsSubmitted(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5 mr-2" />
                홈으로
              </Link>
              <div className="text-lg font-light tracking-tight">
                stay<span className="font-medium">oneday</span>
              </div>
            </div>
          </div>
        </div>

        {/* 성공 메시지 */}
        <div className="container mx-auto px-4 py-16 max-w-lg text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-gray-700" />
            </div>
            <h1 className="text-2xl font-light text-gray-900 mb-4">문의가 접수되었습니다</h1>
            <p className="text-gray-600 leading-relaxed">
              제휴문의를 주셔서 감사합니다.<br />
              담당자가 검토 후 영업일 기준 2-3일 내에<br />
              회신드리겠습니다.
            </p>
          </div>
          <div className="space-y-4">
            <Button 
              onClick={() => setIsSubmitted(false)} 
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 text-sm font-medium"
            >
              다른 문의 작성하기
            </Button>
            <div>
              <Link href="/" className="text-gray-600 hover:text-gray-900 underline text-sm">
                홈페이지로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" />
              홈으로
            </Link>
            <div className="text-lg font-light tracking-tight">
              stay<span className="font-medium">oneday</span>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-light text-gray-900 mb-4">제휴 문의</h1>
          <p className="text-gray-600 leading-relaxed">
            스테이 원데이와 함께 성장할 파트너를 찾고 있습니다.<br />
            다양한 협력 방안에 대해 논의해보세요.
          </p>
        </div>
        
        {/* 제휴 분야 안내 */}
        <div className="mb-12 p-8 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-medium text-gray-900 mb-6">제휴 분야</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="text-gray-700">• 마케팅 및 광고 협력</p>
              <p className="text-gray-700">• 기술 연동 및 API 제휴</p>
              <p className="text-gray-700">• 콘텐츠 파트너십</p>
            </div>
            <div className="space-y-2">
              <p className="text-gray-700">• 기업 복리후생 서비스</p>
              <p className="text-gray-700">• 브랜드 협력</p>
              <p className="text-gray-700">• 기타 사업 협력</p>
            </div>
          </div>
        </div>

        {/* 문의 폼 */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="companyName" className="text-sm font-medium text-gray-900 mb-2 block">
                회사명 *
              </Label>
              <Input
                id="companyName"
                name="companyName"
                type="text"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="회사명을 입력하세요"
                className="border-gray-200 focus:border-gray-400 focus:ring-0"
                required
              />
            </div>
            <div>
              <Label htmlFor="contactName" className="text-sm font-medium text-gray-900 mb-2 block">
                담당자명 *
              </Label>
              <Input
                id="contactName"
                name="contactName"
                type="text"
                value={formData.contactName}
                onChange={handleChange}
                placeholder="담당자명을 입력하세요"
                className="border-gray-200 focus:border-gray-400 focus:ring-0"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-900 mb-2 block">
                이메일 *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contact@company.com"
                className="border-gray-200 focus:border-gray-400 focus:ring-0"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-gray-900 mb-2 block">
                연락처
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="010-1234-5678"
                className="border-gray-200 focus:border-gray-400 focus:ring-0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="businessType" className="text-sm font-medium text-gray-900 mb-2 block">
              제휴 분야 *
            </Label>
            <select
              id="businessType"
              name="businessType"
              value={formData.businessType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:border-gray-400 focus:outline-none"
              required
            >
              <option value="">선택해주세요</option>
              <option value="marketing">마케팅 및 광고 협력</option>
              <option value="tech">기술 연동 및 API 제휴</option>
              <option value="content">콘텐츠 파트너십</option>
              <option value="corporate">기업 복리후생 서비스</option>
              <option value="brand">브랜드 협력</option>
              <option value="other">기타</option>
            </select>
          </div>

          <div>
            <Label htmlFor="inquiry" className="text-sm font-medium text-gray-900 mb-2 block">
              문의 내용 *
            </Label>
            <Textarea
              id="inquiry"
              name="inquiry"
              value={formData.inquiry}
              onChange={handleChange}
              placeholder="제휴 제안 내용, 협력 방향, 기대 효과 등을 자세히 작성해주세요.&#10;&#10;예시:&#10;- 제휴 제안 배경&#10;- 구체적인 협력 방안&#10;- 상호 기대 효과&#10;- 제안하는 조건"
              rows={8}
              className="border-gray-200 focus:border-gray-400 focus:ring-0 resize-none"
              required
            />
            <p className="mt-2 text-xs text-gray-500">
              최소 100자 이상 작성해주세요. ({formData.inquiry.length}/100)
            </p>
          </div>

          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="privacy"
              className="mt-1 h-4 w-4 text-gray-900 border-gray-300 rounded focus:ring-0 focus:ring-offset-0"
              required
            />
            <label htmlFor="privacy" className="text-sm text-gray-600 leading-relaxed">
              개인정보 수집 및 이용에 동의합니다. 
              <Link href="/privacy" className="text-gray-900 underline hover:text-gray-700 ml-1">
                개인정보처리방침 보기
              </Link>
            </label>
          </div>

          <div className="pt-6">
            <Button 
              type="submit" 
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 font-medium"
              disabled={formData.inquiry.length < 100}
            >
              <Send className="w-4 h-4 mr-2" />
              제휴문의 보내기
            </Button>
            <p className="text-center text-xs text-gray-500 mt-4">
              영업일 기준 2-3일 내에 검토 후 회신드립니다.
            </p>
          </div>
        </form>

        {/* 연락처 정보 */}
        <div className="mt-16 pt-8 border-t border-gray-200 text-center">
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong className="text-gray-900">(주)스테이원데이</strong></p>
            <p>제휴문의: info@nuklabs.com</p>
            <p>대표전화: 1588-1234</p>
          </div>
        </div>
      </div>
    </div>
  )
}