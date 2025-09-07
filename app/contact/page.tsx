'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import Header from '@/components/header'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.contact || !formData.message) {
      alert('모든 필드를 입력해주세요.')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsSubmitted(true)
        setFormData({ name: '', contact: '', message: '' })
      } else {
        alert('문의 전송에 실패했습니다.')
      }
    } catch (error) {
      alert('문의 전송 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
          <div className="text-center max-w-md">
            <div className="mb-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-light text-gray-900 mb-4">
                문의가 전송되었습니다
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8">
                소중한 문의를 보내주셔서 감사합니다.<br />
                빠른 시일 내에 답변드리겠습니다.
              </p>
              <Button
                onClick={() => setIsSubmitted(false)}
                variant="outline"
                className="min-w-[120px]"
              >
                새 문의 작성
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-light text-gray-900 mb-4">
            1:1 문의
          </h1>
          <p className="text-gray-600 text-lg">
            궁금한 점이 있으시면 언제든지 문의해주세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">
              이름 *
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="이름을 입력해주세요"
              className="w-full h-12"
              required
            />
          </div>

          <div>
            <Label htmlFor="contact" className="text-sm font-medium text-gray-700 mb-2 block">
              연락처 *
            </Label>
            <Input
              id="contact"
              name="contact"
              type="text"
              value={formData.contact}
              onChange={handleInputChange}
              placeholder="전화번호 또는 이메일을 입력해주세요"
              className="w-full h-12"
              required
            />
          </div>

          <div>
            <Label htmlFor="message" className="text-sm font-medium text-gray-700 mb-2 block">
              문의 내용 *
            </Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="문의하실 내용을 자세히 적어주세요"
              className="w-full min-h-[120px] resize-none"
              required
            />
          </div>

          <div className="pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  전송 중...
                </>
              ) : (
                '문의 전송'
              )}
            </Button>
          </div>
        </form>

        <div className="mt-12 pt-8 border-t border-gray-100">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              긴급한 문의사항이 있으시면 고객센터로 연락해주세요
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}