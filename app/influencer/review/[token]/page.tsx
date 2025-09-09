'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Send, Instagram, Youtube, Globe, Plus, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface CollaborationInfo {
  id: string
  accommodation: {
    name: string
    location: string
  }
  influencer: {
    name: string
    email: string
  }
  check_in_date: string
  check_out_date: string
  status: string
}

interface ReviewLink {
  platform: string
  url: string
  description: string
}

export default function InfluencerReviewPage() {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [collaborationInfo, setCollaborationInfo] = useState<CollaborationInfo | null>(null)
  const [reviewContent, setReviewContent] = useState('')
  const [reviewLinks, setReviewLinks] = useState<ReviewLink[]>([
    { platform: 'instagram', url: '', description: '' }
  ])

  useEffect(() => {
    loadCollaborationInfo()
  }, [token])

  const loadCollaborationInfo = async () => {
    try {
      const response = await fetch(`/api/influencer/review-info/${token}`)
      const result = await response.json()
      
      if (result.success) {
        setCollaborationInfo(result.collaboration)
      } else {
        alert('유효하지 않은 링크입니다.')
      }
    } catch (error) {
      console.error('협업 정보 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const addReviewLink = () => {
    setReviewLinks([...reviewLinks, { platform: 'other', url: '', description: '' }])
  }

  const removeReviewLink = (index: number) => {
    if (reviewLinks.length > 1) {
      setReviewLinks(reviewLinks.filter((_, i) => i !== index))
    }
  }

  const updateReviewLink = (index: number, field: string, value: string) => {
    const updated = [...reviewLinks]
    updated[index] = { ...updated[index], [field]: value }
    setReviewLinks(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reviewContent.trim()) {
      toast.error('리뷰 내용을 입력해주세요.')
      return
    }

    const validLinks = reviewLinks.filter(link => link.url.trim() !== '')
    if (validLinks.length === 0) {
      toast.error('최소 하나의 리뷰 링크를 입력해주세요.')
      return
    }

    setSubmitting(true)
    
    try {
      const response = await fetch('/api/influencer/submit-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          review_content: reviewContent,
          review_links: validLinks
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success('리뷰가 성공적으로 제출되었습니다!')
        // 폼 초기화
        setReviewContent('')
        setReviewLinks([{ platform: 'instagram', url: '', description: '' }])
      } else {
        toast.error(result.message || '리뷰 제출에 실패했습니다.')
      }
    } catch (error) {
      console.error('리뷰 제출 실패:', error)
      toast.error('서버 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="w-4 h-4" />
      case 'youtube':
        return <Youtube className="w-4 h-4" />
      default:
        return <Globe className="w-4 h-4" />
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

  if (!collaborationInfo) {
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
            <CardTitle className="text-2xl text-center">협업 리뷰 제출</CardTitle>
            <div className="text-center text-gray-600">
              <p>안녕하세요, <span className="font-semibold text-blue-600">{collaborationInfo.influencer.name}</span>님!</p>
              <p className="text-sm mt-1">숙박 경험에 대한 리뷰와 SNS 링크를 제출해주세요.</p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* 협업 정보 표시 */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">협업 정보</h3>
              <div className="text-sm space-y-1">
                <div><span className="font-medium">숙소:</span> {collaborationInfo.accommodation.name}</div>
                <div><span className="font-medium">위치:</span> {collaborationInfo.accommodation.location}</div>
                <div><span className="font-medium">이용 기간:</span> {collaborationInfo.check_in_date} ~ {collaborationInfo.check_out_date}</div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 리뷰 내용 */}
              <div>
                <Label htmlFor="review_content">리뷰 내용 *</Label>
                <Textarea
                  id="review_content"
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  placeholder="숙박 경험, 시설, 서비스 등에 대한 상세한 리뷰를 작성해주세요. 호스트에게 전달됩니다."
                  rows={8}
                  required
                />
              </div>

              {/* 리뷰 링크들 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>SNS 리뷰 링크 *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addReviewLink}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    링크 추가
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {reviewLinks.map((link, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(link.platform)}
                          <span className="font-medium">
                            {link.platform === 'instagram' ? '인스타그램' :
                             link.platform === 'youtube' ? '유튜브' :
                             link.platform === 'blog' ? '블로그' : '기타'}
                          </span>
                        </div>
                        {reviewLinks.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeReviewLink(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <Label htmlFor={`platform-${index}`}>플랫폼</Label>
                          <select
                            id={`platform-${index}`}
                            value={link.platform}
                            onChange={(e) => updateReviewLink(index, 'platform', e.target.value)}
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="instagram">인스타그램</option>
                            <option value="youtube">유튜브</option>
                            <option value="blog">블로그</option>
                            <option value="tiktok">틱톡</option>
                            <option value="other">기타</option>
                          </select>
                        </div>
                        
                        <div>
                          <Label htmlFor={`url-${index}`}>링크 URL *</Label>
                          <Input
                            id={`url-${index}`}
                            type="url"
                            value={link.url}
                            onChange={(e) => updateReviewLink(index, 'url', e.target.value)}
                            placeholder="https://..."
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`description-${index}`}>설명 (선택)</Label>
                          <Input
                            id={`description-${index}`}
                            value={link.description}
                            onChange={(e) => updateReviewLink(index, 'description', e.target.value)}
                            placeholder="게시물에 대한 간단한 설명"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg text-sm">
                <h4 className="font-medium mb-2">📝 리뷰 제출 안내</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• 실제 방문 경험을 바탕으로 정직하고 상세한 리뷰를 작성해주세요</li>
                  <li>• SNS 게시물은 협업 완료 후 24시간 이내에 업로드해주세요</li>
                  <li>• 제출된 링크는 호스트가 확인한 후 협업이 완료됩니다</li>
                  <li>• 문제가 있는 경우 호스트가 직접 연락드릴 예정입니다</li>
                </ul>
              </div>

              <Button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    제출 중...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    리뷰 제출하기
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