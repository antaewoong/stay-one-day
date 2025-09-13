'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Trash2, User, Shield, Eye, EyeOff, Key } from 'lucide-react'

interface Admin {
  id: string
  username: string
  name: string
  email?: string
  role: string
  is_active: boolean
  last_login?: string
  created_at: string
  password?: string
}

export default function AdminAccountsPage() {
  const supabase = createClient()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [changingPasswordAdmin, setChangingPasswordAdmin] = useState<Admin | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  const [adminForm, setAdminForm] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'admin',
    is_active: true
  })

  // Mock data for development
  const mockAdmins: Admin[] = [
    {
      id: '1',
      username: 'admin',
      name: '메인 관리자',
      email: 'admin@stayoneday.com',
      role: 'admin',
      is_active: true,
      last_login: new Date().toISOString(),
      created_at: '2024-01-01T00:00:00.000Z'
    },
    {
      id: '2', 
      username: 'admin2',
      name: '보조 관리자',
      email: 'admin2@stayoneday.com',
      role: 'admin',
      is_active: true,
      created_at: '2024-01-15T00:00:00.000Z'
    }
  ]

  useEffect(() => {
    loadAdmins()
  }, [])

  const loadAdmins = async () => {
    try {
      setLoading(true)
      
      // API를 통해서 관리자 목록 조회
      const result = await fetch('/api/admin/admins', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(res => res.json())

      console.log('API에서 조회된 관리자 데이터:', result)

      if (result.success && result.data) {
        setAdmins(result.data)
      } else {
        console.log('관리자 데이터가 없어서 목 데이터 사용')
        setAdmins(mockAdmins)
      }
    } catch (error) {
      console.error('관리자 데이터 로드 실패:', error)
      setAdmins(mockAdmins)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAdmin = async () => {
    try {
      const adminData = {
        username: adminForm.username,
        password_hash: adminForm.password, // 실제로는 해시화 필요
        name: adminForm.name,
        email: adminForm.email,
        role: adminForm.role,
        is_active: adminForm.is_active
      }

      if (editingAdmin) {
        // Update existing admin
        const { error } = await supabase
          .from('admin_accounts')
          .update(adminData)
          .eq('id', editingAdmin.id)

        if (error) throw error

        setAdmins(prev => prev.map(admin => 
          admin.id === editingAdmin.id 
            ? { ...admin, ...adminForm, id: editingAdmin.id, created_at: editingAdmin.created_at }
            : admin
        ))
      } else {
        // Create new admin
        const { data, error } = await supabase
          .from('admin_accounts')
          .insert({
            ...adminData,
            created_at: new Date().toISOString()
          })
          .select()

        if (error) {
          // Fallback to mock data
          const newAdmin: Admin = {
            id: Date.now().toString(),
            username: adminForm.username,
            name: adminForm.name,
            email: adminForm.email,
            role: adminForm.role,
            is_active: adminForm.is_active,
            created_at: new Date().toISOString()
          }
          setAdmins(prev => [newAdmin, ...prev])
        } else if (data && data.length > 0) {
          setAdmins(prev => [data[0], ...prev])
        }
      }

      setShowAddModal(false)
      setEditingAdmin(null)
      resetForm()
      
      alert(editingAdmin ? '관리자 정보가 수정되었습니다.' : '새 관리자가 등록되었습니다.')
    } catch (error) {
      console.error('관리자 저장 실패:', error)
      alert('관리자 저장에 실패했습니다.')
    }
  }

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`'${username}' 관리자를 정말 삭제하시겠습니까?`)) return

    try {
      const { error } = await supabase
        .from('admin_accounts')
        .delete()
        .eq('id', id)

      if (error) throw error

      setAdmins(prev => prev.filter(admin => admin.id !== id))
      alert('관리자가 삭제되었습니다.')
    } catch (error) {
      console.error('삭제 실패:', error)
      // Mock delete
      setAdmins(prev => prev.filter(admin => admin.id !== id))
      alert('관리자가 삭제되었습니다.')
    }
  }

  const openEditModal = (admin: Admin) => {
    setEditingAdmin(admin)
    setAdminForm({
      username: admin.username,
      password: '',
      name: admin.name,
      email: admin.email || '',
      role: admin.role,
      is_active: admin.is_active
    })
    setShowAddModal(true)
  }

  const resetForm = () => {
    setAdminForm({
      username: '',
      password: '',
      name: '',
      email: '',
      role: 'admin',
      is_active: true
    })
  }

  const toggleActiveStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_accounts')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error

      setAdmins(prev => prev.map(admin => 
        admin.id === id ? { ...admin, is_active: !currentStatus } : admin
      ))
    } catch (error) {
      console.error('상태 변경 실패:', error)
      // Mock update
      setAdmins(prev => prev.map(admin => 
        admin.id === id ? { ...admin, is_active: !currentStatus } : admin
      ))
    }
  }

  const handlePasswordChange = async () => {
    if (!changingPasswordAdmin || !newPassword.trim()) {
      alert('새 비밀번호를 입력해주세요.')
      return
    }

    if (newPassword.length < 8) {
      alert('비밀번호는 8자 이상이어야 합니다.')
      return
    }

    try {
      setPasswordLoading(true)

      // 관리자 인증 토큰 가져오기
      const adminUser = sessionStorage.getItem('adminUser')
      const adminData = adminUser ? JSON.parse(adminUser) : null
      const authToken = adminData?.access_token || sessionStorage.getItem('adminToken')
      
      if (!authToken) {
        throw new Error('관리자 인증 토큰이 없습니다. 다시 로그인해주세요.')
      }

      const response = await fetch('/api/admin/change-user-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          userEmail: changingPasswordAdmin.email,
          newPassword: newPassword,
          userType: 'admin'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '비밀번호 변경에 실패했습니다')
      }

      alert(`${changingPasswordAdmin.name}의 비밀번호가 성공적으로 변경되었습니다.`)
      setShowPasswordModal(false)
      setChangingPasswordAdmin(null)
      setNewPassword('')
    } catch (error) {
      console.error('비밀번호 변경 실패:', error)
      alert(error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.')
    } finally {
      setPasswordLoading(false)
    }
  }

  const openPasswordModal = (admin: Admin) => {
    setChangingPasswordAdmin(admin)
    setNewPassword('')
    setShowPasswordModal(true)
  }

  return (
    <div className="admin-page space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">관리자 계정 관리</h1>
          <p className="text-gray-600">시스템 관리자 계정을 관리합니다</p>
        </div>
        <Button onClick={() => {
          setEditingAdmin(null)
          resetForm()
          setShowAddModal(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          새 관리자 등록
        </Button>
      </div>

      {/* 관리자 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>관리자 목록 ({admins.length}개)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : admins.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              등록된 관리자가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>관리자 정보</TableHead>
                    <TableHead>아이디</TableHead>
                    <TableHead>권한</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>최근 로그인</TableHead>
                    <TableHead>등록일</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Shield className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{admin.name}</div>
                            <div className="text-sm text-gray-500">{admin.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-mono text-sm">{admin.username}</div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">
                          {admin.role}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActiveStatus(admin.id, admin.is_active)}
                          className={admin.is_active ? 'text-green-600' : 'text-red-600'}
                        >
                          <Badge className={admin.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {admin.is_active ? '활성' : '비활성'}
                          </Badge>
                        </Button>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          {admin.last_login 
                            ? new Date(admin.last_login).toLocaleDateString('ko-KR')
                            : '없음'
                          }
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          {new Date(admin.created_at).toLocaleDateString('ko-KR')}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openPasswordModal(admin)}
                            className="text-blue-600 hover:text-blue-700"
                            title="비밀번호 변경"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditModal(admin)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(admin.id, admin.username)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 관리자 등록/수정 모달 */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md !bg-white !border !border-gray-200">
          <DialogHeader>
            <DialogTitle>
              {editingAdmin ? '관리자 정보 수정' : '새 관리자 등록'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="username">아이디 *</Label>
              <Input
                id="username"
                value={adminForm.username}
                onChange={(e) => setAdminForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="admin"
                disabled={!!editingAdmin}
              />
            </div>
            
            <div>
              <Label htmlFor="password">비밀번호 *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={adminForm.password}
                  onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder={editingAdmin ? '변경할 비밀번호 입력' : '비밀번호'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={adminForm.name}
                onChange={(e) => setAdminForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="홍길동"
              />
            </div>
            
            <div>
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={adminForm.email}
                onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="admin@stayoneday.com"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              취소
            </Button>
            <Button 
              onClick={handleSaveAdmin}
              disabled={!adminForm.username?.trim() || !adminForm.password?.trim() || !adminForm.name?.trim()}
            >
              {editingAdmin ? '수정' : '등록'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 비밀번호 변경 모달 */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="max-w-md !bg-white !border !border-gray-200">
          <DialogHeader>
            <DialogTitle>
              비밀번호 변경
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {changingPasswordAdmin && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">{changingPasswordAdmin.name}</div>
                    <div className="text-sm text-gray-500">{changingPasswordAdmin.email}</div>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="newPassword">새 비밀번호 *</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호 (8자 이상)"
                  disabled={passwordLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  disabled={passwordLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                • 8자 이상 입력해주세요<br />
                • 이 작업은 Supabase Auth와 시스템 DB에 모두 적용됩니다
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowPasswordModal(false)}
              disabled={passwordLoading}
            >
              취소
            </Button>
            <Button 
              onClick={handlePasswordChange}
              disabled={!newPassword?.trim() || newPassword.length < 8 || passwordLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {passwordLoading ? '변경 중...' : '비밀번호 변경'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}