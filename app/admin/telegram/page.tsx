'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MessageSquare,
  Users,
  Shield,
  Clock,
  Copy,
  AlertTriangle,
  CheckCircle,
  Trash2,
  RefreshCw,
  Bot
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { apiFetch } from '@/lib/auth-helpers'

interface TelegramSession {
  chatId: number
  email: string
  permissions: string[]
  createdAt: string
  lastActivity: string
}

export default function TelegramBotManagePage() {
  const [loading, setLoading] = useState(false)
  const [sessions, setSessions] = useState<TelegramSession[]>([])
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [generatedToken, setGeneratedToken] = useState<{token: string, email: string} | null>(null)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      setLoading(true)
      
      const result = await apiFetch('/api/admin/telegram/register')

      if (result.success) {
        setSessions(result.data.sessions || [])
      } else {
        toast.error(result.error || '세션 목록 로드 실패')
      }
    } catch (error) {
      console.error('세션 로드 실패:', error)
      toast.error('세션 로드 중 오류 발생')
      setSessions([]) // 에러 시 빈 배열로 안전 처리
    } finally {
      setLoading(false)
    }
  }

  const generateToken = async () => {
    if (!newAdminEmail.trim()) {
      toast.error('관리자 이메일을 입력해주세요')
      return
    }

    try {
      setLoading(true)
      
      const result = await apiFetch('/api/admin/telegram/register', {
        method: 'POST',
        body: JSON.stringify({
          targetAdminEmail: newAdminEmail.trim()
        })
      })

      if (result.success) {
        setGeneratedToken({
          token: result.data.token,
          email: newAdminEmail.trim()
        })
        setNewAdminEmail('')
        toast.success('등록 토큰이 생성되었습니다')
      } else {
        toast.error(result.error || '토큰 생성 실패')
      }
    } catch (error) {
      console.error('토큰 생성 실패:', error)
      toast.error('토큰 생성 중 오류 발생')
    } finally {
      setLoading(false)
    }
  }

  const terminateSession = async (chatId: number) => {
    if (!confirm(`세션 ${chatId}를 정말 종료하시겠습니까?`)) return

    try {
      setLoading(true)
      const result = await apiFetch(`/api/admin/telegram/register?chatId=${chatId}`, {
        method: 'DELETE'
      })

      if (result.success) {
        toast.success('세션이 종료되었습니다')
        loadSessions()
      } else {
        toast.error(result.error || '세션 종료 실패')
      }
    } catch (error) {
      console.error('세션 종료 실패:', error)
      toast.error('세션 종료 중 오류 발생')
    } finally {
      setLoading(false)
    }
  }

  const emergencyTerminate = async () => {
    if (!confirm('⚠️ 모든 텔레그램 세션을 강제로 종료하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) return

    try {
      setLoading(true)
      const result = await apiFetch('/api/admin/telegram/register?emergency=true', {
        method: 'DELETE'
      })

      if (result.success) {
        toast.success('모든 세션이 종료되었습니다')
        loadSessions()
      } else {
        toast.error(result.error || '비상 종료 실패')
      }
    } catch (error) {
      console.error('비상 종료 실패:', error)
      toast.error('비상 종료 중 오류 발생')
    } finally {
      setLoading(false)
    }
  }

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token)
    toast.success('토큰이 클립보드에 복사되었습니다')
  }

  const copyInstructions = () => {
    const instructions = `텔레그램 봇 등록 방법:
1. 텔레그램에서 Stay OneDay Bot 검색
2. /start 명령어로 봇 시작
3. /register_token ${generatedToken?.token} 명령어 입력
4. 등록 완료 (토큰은 30일 후 만료)`

    navigator.clipboard.writeText(instructions)
    toast.success('등록 방법이 클립보드에 복사되었습니다')
  }

  return (
    <div className="admin-page space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Bot className="w-8 h-8 text-blue-600" />
            텔레그램 봇 관리
          </h1>
          <p className="text-gray-600 mt-1">관리자용 텔레그램 봇을 관리하고 모니터링합니다</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadSessions} variant="outline" disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
          <Button onClick={emergencyTerminate} variant="destructive" disabled={loading}>
            <AlertTriangle className="w-4 h-4 mr-2" />
            비상 종료
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">활성 세션</p>
                <p className="text-2xl font-bold text-green-600">{sessions.length}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">봇 상태</p>
                <p className="text-lg font-bold text-blue-600">활성</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">보안 수준</p>
                <p className="text-lg font-bold text-amber-600">RLS 준수</p>
              </div>
              <Shield className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 관리자 등록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            새 관리자 등록
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="adminEmail">관리자 이메일</Label>
              <Input
                id="adminEmail"
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="admin@example.com"
                disabled={loading}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={generateToken} disabled={loading || !newAdminEmail.trim()}>
                등록 토큰 생성
              </Button>
            </div>
          </div>

          {generatedToken && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold text-green-800">
                    {generatedToken.email} 관리자용 등록 토큰이 생성되었습니다
                  </p>
                  
                  <div className="bg-white rounded p-2 border">
                    <code className="text-sm font-mono break-all">{generatedToken.token}</code>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => copyToken(generatedToken.token)}>
                      <Copy className="w-3 h-3 mr-1" />
                      토큰 복사
                    </Button>
                    <Button size="sm" variant="outline" onClick={copyInstructions}>
                      <Copy className="w-3 h-3 mr-1" />
                      등록 방법 복사
                    </Button>
                  </div>

                  <p className="text-xs text-green-700">
                    ⏰ 토큰은 30일 후 자동 만료됩니다. 충분한 시간이 있으니 안전하게 등록하세요.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 활성 세션 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            활성 텔레그램 세션 ({sessions.length}개)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              활성 세션이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session, index) => (
                <div key={session.chatId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{session.email}</h4>
                        <Badge className="text-xs">
                          Chat ID: {session.chatId}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          생성: {new Date(session.createdAt).toLocaleString('ko-KR')}
                        </p>
                        <p className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          마지막 활동: {new Date(session.lastActivity).toLocaleString('ko-KR')}
                        </p>
                        
                        {(session.permissions || []).length > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            <Shield className="w-3 h-3" />
                            <span className="text-xs">권한:</span>
                            {(session.permissions || []).map((perm, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {perm}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => terminateSession(session.chatId)}
                      disabled={loading}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      세션 종료
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 사용법 안내 */}
      <Card>
        <CardHeader>
          <CardTitle>텔레그램 봇 사용법</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📱 관리자 등록 과정</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>위에서 관리자 이메일로 등록 토큰 생성</li>
              <li>텔레그램에서 Stay OneDay Bot 검색 후 시작</li>
              <li><code>/start</code> 명령어로 봇 시작</li>
              <li><code>/register_token [토큰]</code> 명령어로 등록</li>
              <li>등록 완료! 이제 봇 사용 가능</li>
            </ol>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🤖 주요 명령어</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><code>/stats</code> - 시스템 통계</div>
              <div><code>/bookings</code> - 최근 예약</div>
              <div><code>/hosts</code> - 호스트 현황</div>
              <div><code>/help</code> - 도움말</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}