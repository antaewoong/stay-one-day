'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Link, Copy, Send, Users, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Influencer {
  id: string
  name: string
  email: string
  phone: string
  instagram_handle: string
  follower_count: number
  status: string
}

interface GeneratedToken {
  influencer: {
    id: string
    name: string
    email: string
  }
  token: string
  collaboration_link: string
  expires_at: string
  expires_in_days: number
}

export default function InfluencerTokensPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)
  const [generatedTokens, setGeneratedTokens] = useState<GeneratedToken[]>([])
  const [expiryDays, setExpiryDays] = useState(30)

  useEffect(() => {
    loadInfluencers()
  }, [])

  const loadInfluencers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/influencer-tokens')
      const result = await response.json()
      
      if (result.success) {
        setInfluencers(result.data)
      } else {
        toast.error('인플루언서 목록을 불러올 수 없습니다')
      }
    } catch (error) {
      console.error('인플루언서 목록 로드 실패:', error)
      toast.error('서버 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const generateToken = async (influencerId: string) => {
    try {
      setGenerating(influencerId)
      
      const response = await fetch('/api/admin/influencer-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          influencer_id: influencerId,
          expires_in_days: expiryDays
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setGeneratedTokens(prev => [result.data, ...prev])
        toast.success('협업신청 링크가 생성되었습니다')
      } else {
        toast.error(result.error || '토큰 생성에 실패했습니다')
      }
    } catch (error) {
      console.error('토큰 생성 실패:', error)
      toast.error('서버 오류가 발생했습니다')
    } finally {
      setGenerating(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('클립보드에 복사되었습니다')
    }).catch(() => {
      toast.error('복사에 실패했습니다')
    })
  }

  const sendEmail = (influencer: any, link: string) => {
    const subject = encodeURIComponent('스테이 원데이 협업 신청 링크')
    const body = encodeURIComponent(`안녕하세요 ${influencer.name}님,

스테이 원데이 협업 신청 링크를 보내드립니다.

협업신청 링크: ${link}

위 링크를 클릭하여 원하시는 숙소와 날짜를 선택하여 협업을 신청해주세요.
링크는 ${new Date().toLocaleDateString('ko-KR')}부터 30일간 유효합니다.

감사합니다.
스테이 원데이 팀`)

    window.open(`mailto:${influencer.email}?subject=${subject}&body=${body}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>로딩 중...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            인플루언서 협업신청 링크 관리
          </CardTitle>
          <p className="text-sm text-gray-600">
            인플루언서들에게 전달할 협업신청 링크를 생성하고 관리합니다.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Label htmlFor="expiry">링크 유효기간:</Label>
              <Input
                id="expiry"
                type="number"
                value={expiryDays}
                onChange={(e) => setExpiryDays(parseInt(e.target.value) || 30)}
                className="w-20"
                min="1"
                max="365"
              />
              <span className="text-sm text-gray-600">일</span>
            </div>
            <Badge variant="outline">
              총 {influencers.length}명의 인플루언서
            </Badge>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>인플루언서</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>SNS</TableHead>
                  <TableHead className="w-20">팔로워</TableHead>
                  <TableHead className="w-32">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {influencers.map((influencer) => (
                  <TableRow key={influencer.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <div className="font-medium">{influencer.name}</div>
                        <div className="text-sm text-gray-600">{influencer.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {influencer.phone}
                    </TableCell>
                    <TableCell>
                      {influencer.instagram_handle && (
                        <div className="text-sm">{influencer.instagram_handle}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {influencer.follower_count?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => generateToken(influencer.id)}
                        disabled={generating === influencer.id}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {generating === influencer.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Link className="mr-1 h-3 w-3" />
                            링크 생성
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 생성된 토큰 목록 */}
      {generatedTokens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>생성된 협업신청 링크</CardTitle>
            <p className="text-sm text-gray-600">
              최근 생성된 링크들입니다. 인플루언서에게 전달해주세요.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generatedTokens.map((tokenData, index) => (
                <div key={index} className="border rounded-lg p-4 bg-green-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{tokenData.influencer.name}</h4>
                        <Badge variant="secondary">
                          {tokenData.expires_in_days}일 유효
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{tokenData.influencer.email}</p>
                      <div className="bg-white p-2 rounded border text-sm font-mono break-all">
                        {tokenData.collaboration_link}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        만료일: {new Date(tokenData.expires_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(tokenData.collaboration_link)}
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        복사
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendEmail(tokenData.influencer, tokenData.collaboration_link)}
                      >
                        <Send className="mr-1 h-3 w-3" />
                        이메일
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}