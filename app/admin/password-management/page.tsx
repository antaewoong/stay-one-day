'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  Key, 
  User, 
  Eye, 
  EyeOff,
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { adminGet, adminPost } from '@/lib/admin-api'

interface AdminAccount {
  id: string
  email: string
  name: string
  role: string
  is_active: boolean
  created_at: string
  last_login?: string
}

export default function PasswordManagementPage() {
  const [loading, setLoading] = useState(false)
  const [admins, setAdmins] = useState<AdminAccount[]>([])
  const [selectedAdmin, setSelectedAdmin] = useState<string>('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    loadAdmins()
  }, [])

  const loadAdmins = async () => {
    try {
      setLoading(true)
      
      const response = await adminGet('/api/admin/password-management')
      
      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.error || '관리자 목록 로드 실패')
        return
      }
      
      const result = await response.json()

      if (result.success) {
        setAdmins(result.data.admins || [])
      } else {
        toast.error(result.error || '관리자 목록 로드 실패')
      }
    } catch (error) {
      console.error('관리자 목록 로드 실패:', error)
      toast.error('관리자 목록 로드 중 오류 발생')
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async () => {
    if (!selectedAdmin || !newPassword) {
      toast.error('관리자를 선택하고 새 비밀번호를 입력해주세요')
      return
    }

    if (newPassword.length < 8) {
      toast.error('비밀번호는 최소 8자 이상이어야 합니다')
      return
    }

    try {
      setIsChangingPassword(true)
      
      const response = await adminPost('/api/admin/password-management', {
        adminId: selectedAdmin,
        newPassword: newPassword
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.error || '비밀번호 변경 실패')
        return
      }

      const result = await response.json()

      if (result.success) {
        toast.success('비밀번호가 성공적으로 변경되었습니다')
        setSelectedAdmin('')
        setNewPassword('')
        loadAdmins() // 관리자 목록 새로고침
      } else {
        toast.error(result.error || '비밀번호 변경 실패')
      }
    } catch (error) {
      console.error('비밀번호 변경 실패:', error)
      toast.error('비밀번호 변경 중 오류 발생')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewPassword(password)
  }

  const selectedAdminData = admins.find(admin => admin.id === selectedAdmin)

  return (
    <div className="admin-page space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Key className="w-8 h-8 text-amber-600" />
            관리자 비밀번호 관리
          </h1>
          <p className="text-gray-600 mt-1">슈퍼어드민 전용: 다른 관리자들의 Supabase Auth 비밀번호를 관리합니다</p>
        </div>
        <Button onClick={loadAdmins} variant="outline" disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          새로고침
        </Button>
      </div>

      {/* 경고 메시지 */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>중요:</strong> 이 기능은 슈퍼어드민만 사용할 수 있습니다. 
          변경된 비밀번호는 해당 관리자에게 안전하게 전달해주세요.
        </AlertDescription>
      </Alert>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 관리자</p>
                <p className="text-2xl font-bold text-blue-600">{admins.length}</p>
              </div>
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">활성 관리자</p>
                <p className="text-2xl font-bold text-green-600">
                  {admins.filter(admin => admin.is_active).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">보안 수준</p>
                <p className="text-lg font-bold text-amber-600">높음</p>
              </div>
              <Shield className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 비밀번호 변경 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            비밀번호 변경
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="adminSelect">관리자 선택</Label>
            <select
              id="adminSelect"
              value={selectedAdmin}
              onChange={(e) => setSelectedAdmin(e.target.value)}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              disabled={loading || isChangingPassword}
            >
              <option value="">관리자를 선택해주세요</option>
              {admins.filter(admin => admin.is_active).map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name} ({admin.email}) - {admin.role}
                </option>
              ))}
            </select>
          </div>

          {selectedAdminData && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">선택된 관리자 정보</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>이름:</strong> {selectedAdminData.name}</div>
                <div><strong>이메일:</strong> {selectedAdminData.email}</div>
                <div><strong>역할:</strong> <Badge>{selectedAdminData.role}</Badge></div>
                <div><strong>최근 로그인:</strong> {
                  selectedAdminData.last_login 
                    ? new Date(selectedAdminData.last_login).toLocaleString('ko-KR')
                    : '없음'
                }</div>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="newPassword">새 비밀번호</Label>
            <div className="flex gap-2 mt-1">
              <div className="flex-1 relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호 입력 (최소 8자)"
                  disabled={loading || isChangingPassword}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={generateRandomPassword}
                disabled={loading || isChangingPassword}
              >
                자동생성
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              비밀번호는 최소 8자 이상이어야 하며, 영문, 숫자, 특수문자를 포함하는 것을 권장합니다.
            </p>
          </div>

          <Button
            onClick={changePassword}
            disabled={loading || isChangingPassword || !selectedAdmin || !newPassword}
            className="w-full"
          >
            {isChangingPassword ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                비밀번호 변경 중...
              </>
            ) : (
              <>
                <Key className="w-4 h-4 mr-2" />
                비밀번호 변경
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 관리자 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            관리자 목록 ({admins.length}명)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              관리자가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {admins.map((admin) => (
                <div key={admin.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{admin.name}</h4>
                        <Badge variant={admin.is_active ? "default" : "secondary"}>
                          {admin.role}
                        </Badge>
                        {!admin.is_active && (
                          <Badge variant="outline" className="text-red-600 border-red-300">
                            비활성
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>이메일:</strong> {admin.email}</p>
                        <p><strong>생성일:</strong> {new Date(admin.created_at).toLocaleString('ko-KR')}</p>
                        {admin.last_login && (
                          <p><strong>최근 로그인:</strong> {new Date(admin.last_login).toLocaleString('ko-KR')}</p>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedAdmin(admin.id)}
                      disabled={!admin.is_active || loading || isChangingPassword}
                    >
                      <Key className="w-3 h-3 mr-1" />
                      비밀번호 변경
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
          <CardTitle>사용법 안내</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🔐 비밀번호 변경 과정</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>변경할 관리자를 선택합니다</li>
              <li>새 비밀번호를 입력하거나 자동생성합니다</li>
              <li>"비밀번호 변경" 버튼을 클릭합니다</li>
              <li>변경된 비밀번호를 해당 관리자에게 안전하게 전달합니다</li>
            </ol>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">⚠️ 보안 주의사항</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-amber-800">
              <li>비밀번호는 최소 8자 이상 사용해주세요</li>
              <li>변경된 비밀번호는 안전한 채널로만 전달하세요</li>
              <li>정기적인 비밀번호 변경을 권장합니다</li>
              <li>이 페이지는 슈퍼어드민만 접근 가능합니다</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}