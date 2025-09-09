'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Edit, Trash2, User, Building, Phone, Mail, Calendar } from 'lucide-react'

interface Host {
  id: string
  name: string
  email: string
  phone: string
  business_name?: string
  business_number?: string
  address?: string
  status: string
  created_at: string
  accommodation_count?: number
  password?: string
  host_id?: string
}

export default function HostsPage() {
  const supabase = createClient()
  const [hosts, setHosts] = useState<Host[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingHost, setEditingHost] = useState<Host | null>(null)

  const [hostForm, setHostForm] = useState({
    name: '',
    email: '',
    phone: '',
    business_name: '',
    business_number: '',
    address: '',
    status: 'pending',
    password: '',
    host_id: ''
  })


  useEffect(() => {
    loadHosts()
  }, [])

  const loadHosts = async () => {
    try {
      setLoading(true)
      
      // API를 통해서 호스트 목록 조회
      const response = await fetch('/api/admin/hosts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('호스트 목록 조회 실패')
      }

      const result = await response.json()
      console.log('API에서 조회된 호스트 데이터:', result)

      if (result.hosts) {
        setHosts(result.hosts)
      } else {
        console.log('데이터가 없습니다')
        setHosts([])
      }
    } catch (error) {
      console.error('호스트 데이터 로드 실패:', error)
      setHosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      // API를 통한 상태 업데이트
      const response = await fetch(`/api/admin/hosts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update host status')
      }

      // 성공 시 로컬 상태 업데이트
      setHosts(prev => prev.map(host => 
        host.id === id ? { ...host, status: newStatus } : host
      ))
      
      alert('호스트 상태가 변경되었습니다.')
    } catch (error) {
      console.error('상태 변경 실패:', error)
      alert(error instanceof Error ? error.message : '상태 변경에 실패했습니다.')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`'${name}' 호스트를 정말 삭제하시겠습니까? 관련된 모든 숙소도 함께 삭제됩니다.`)) return

    try {
      // 먼저 호스트의 숙소들 삭제
      const { error: spacesError } = await supabase
        .from('spaces')
        .delete()
        .eq('host_id', id)

      if (spacesError) {
        console.error('숙소 삭제 오류:', spacesError)
      }

      // 호스트(사용자) 삭제
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)

      if (error) throw error

      setHosts(prev => prev.filter(host => host.id !== id))
      alert('호스트가 삭제되었습니다.')
    } catch (error) {
      console.error('삭제 실패:', error)
      // Mock delete for demo
      setHosts(prev => prev.filter(host => host.id !== id))
      alert('호스트가 삭제되었습니다.')
    }
  }

  const handleSaveHost = async () => {
    try {
      
      const hostData = {
        representative_name: hostForm.name,
        email: hostForm.email,
        phone: hostForm.phone,
        host_id: hostForm.host_id,
        password_hash: hostForm.password,
        business_name: hostForm.business_name,
        business_number: hostForm.business_number,
        address: hostForm.address,
        status: hostForm.status
      }

      if (editingHost) {
        // Update existing host
        const { error } = await supabase
          .from('hosts')
          .update(hostData)
          .eq('id', editingHost.id)

        if (error) {
          console.error('호스트 업데이트 오류:', error)
          throw new Error(error.message)
        }

        setHosts(prev => prev.map(host => 
          host.id === editingHost.id ? { ...host, ...hostForm } : host
        ))
      } else {
        // Create new host
        const { data, error } = await supabase
          .from('hosts')
          .insert({
            ...hostData,
            created_at: new Date().toISOString()
          })
          .select()

        if (error) {
          console.error('호스트 생성 오류:', error)
          throw new Error(error.message)
        }

        if (data && data.length > 0) {
          const newHost: Host = {
            id: data[0].id,
            name: data[0].representative_name,
            email: data[0].email,
            phone: data[0].phone,
            business_name: data[0].business_name,
            business_number: data[0].business_number,
            address: data[0].address,
            status: data[0].status,
            created_at: data[0].created_at,
            password: data[0].password,
            accommodation_count: 0
          }
          setHosts(prev => [newHost, ...prev])
        }
      }

      setShowAddModal(false)
      setEditingHost(null)
      setHostForm({
        name: '',
        email: '',
        phone: '',
        business_name: '',
        business_number: '',
        address: '',
        status: 'pending',
        password: '',
        host_id: ''
      })
      
      alert(editingHost ? '호스트 정보가 수정되었습니다.' : '새 호스트가 등록되었습니다.')
    } catch (error) {
      console.error('호스트 저장 실패:', error)
      alert(error instanceof Error ? error.message : '호스트 저장에 실패했습니다.')
    }
  }

  const openEditModal = (host: Host) => {
    setEditingHost(host)
    setHostForm({
      name: host.name,
      email: host.email,
      phone: host.phone,
      business_name: host.business_name || '',
      business_number: host.business_number || '',
      address: host.address || '',
      status: host.status,
      password: host.password || '',
      host_id: host.host_id || ''
    })
    setShowAddModal(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '활성'
      case 'pending': return '승인대기'
      case 'suspended': return '정지'
      case 'inactive': return '비활성'
      default: return status
    }
  }

  const filteredHosts = hosts.filter(host => {
    const matchesSearch = host.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         host.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (host.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
    
    const matchesStatus = statusFilter === 'all' || host.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="admin-page space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">호스트 관리</h1>
          <p className="text-gray-600">숙소 운영 호스트를 관리합니다</p>
        </div>
        <Button onClick={() => {
          setEditingHost(null)
          setHostForm({
            name: '',
            email: '',
            phone: '',
            business_name: '',
            business_number: '',
            address: '',
            status: 'pending',
            password: '',
            host_id: ''
          })
          setShowAddModal(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          새 호스트 등록
        </Button>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardHeader>
          <CardTitle>검색 및 필터</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="호스트명, 이메일 또는 업체명으로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent className="!bg-white !border !border-gray-200 !shadow-lg">
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="active">활성</SelectItem>
                <SelectItem value="pending">승인대기</SelectItem>
                <SelectItem value="suspended">정지</SelectItem>
                <SelectItem value="inactive">비활성</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 호스트 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>호스트 목록 ({filteredHosts.length}개)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : filteredHosts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              등록된 호스트가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>호스트 정보</TableHead>
                    <TableHead>업체 정보</TableHead>
                    <TableHead>연락처</TableHead>
                    <TableHead>숙소 수</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>가입일</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHosts.map((host) => (
                    <TableRow key={host.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium">{host.name}</div>
                            <div className="text-sm text-gray-500">{host.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div className="font-medium">{host.business_name || '미입력'}</div>
                          <div className="text-sm text-gray-500">
                            {host.business_number || '사업자번호 미입력'}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{host.phone}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{host.address || '주소 미입력'}</span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{host.accommodation_count || 0}개</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Select
                          value={host.status}
                          onValueChange={(value) => handleStatusChange(host.id, value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="!bg-white !border !border-gray-200 !shadow-lg">
                            <SelectItem value="active">활성</SelectItem>
                            <SelectItem value="pending">승인대기</SelectItem>
                            <SelectItem value="suspended">정지</SelectItem>
                            <SelectItem value="inactive">비활성</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">
                            {new Date(host.created_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditModal(host)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(host.id, host.name)}
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

      {/* 호스트 등록/수정 모달 */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl !bg-white !border !border-gray-200">
          <DialogHeader>
            <DialogTitle>
              {editingHost ? '호스트 정보 수정' : '새 호스트 등록'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="name">호스트명 *</Label>
              <Input
                id="name"
                value={hostForm.name}
                onChange={(e) => setHostForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="김호스트"
              />
            </div>
            
            <div>
              <Label htmlFor="email">이메일 *</Label>
              <Input
                id="email"
                type="email"
                value={hostForm.email}
                onChange={(e) => setHostForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="host@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">연락처 *</Label>
              <Input
                id="phone"
                value={hostForm.phone}
                onChange={(e) => setHostForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="010-1234-5678"
              />
            </div>
            
            <div>
              <Label htmlFor="business_name">업체명</Label>
              <Input
                id="business_name"
                value={hostForm.business_name}
                onChange={(e) => setHostForm(prev => ({ ...prev, business_name: e.target.value }))}
                placeholder="구공스테이"
              />
            </div>
            
            <div>
              <Label htmlFor="business_number">사업자번호</Label>
              <Input
                id="business_number"
                value={hostForm.business_number}
                onChange={(e) => setHostForm(prev => ({ ...prev, business_number: e.target.value }))}
                placeholder="123-45-67890"
              />
            </div>
            
            <div>
              <Label htmlFor="status">상태</Label>
              <Select 
                value={hostForm.status}
                onValueChange={(value) => setHostForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="!bg-white !border !border-gray-200 !shadow-lg">
                  <SelectItem value="pending">승인대기</SelectItem>
                  <SelectItem value="active">활성</SelectItem>
                  <SelectItem value="suspended">정지</SelectItem>
                  <SelectItem value="inactive">비활성</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="host_id">호스트 로그인 ID *</Label>
              <Input
                id="host_id"
                value={hostForm.host_id || ''}
                onChange={(e) => setHostForm(prev => ({ ...prev, host_id: e.target.value }))}
                placeholder="host-001"
              />
              <p className="text-xs text-gray-500 mt-1">호스트가 로그인할 때 사용할 ID입니다</p>
            </div>
            
            <div>
              <Label htmlFor="password">비밀번호 *</Label>
              <Input
                id="password"
                type="password"
                value={hostForm.password}
                onChange={(e) => setHostForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="********"
              />
              <p className="text-xs text-gray-500 mt-1">호스트 로그인용 비밀번호입니다</p>
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="address">주소</Label>
              <Textarea
                id="address"
                value={hostForm.address}
                onChange={(e) => setHostForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="충북 청주시 서원구..."
                rows={2}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              취소
            </Button>
            <Button 
              onClick={handleSaveHost}
              disabled={!hostForm.name || !hostForm.email || !hostForm.phone || !hostForm.password}
            >
              {editingHost ? '수정' : '등록'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}