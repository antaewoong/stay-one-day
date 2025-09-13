'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Upload, 
  Search, 
  ImageIcon, 
  Trash2, 
  Eye, 
  Edit3,
  Plus,
  Filter,
  Grid3X3,
  List,
  Download,
  Star
} from 'lucide-react'
import { hostGet } from '@/lib/host-api'

interface AccommodationPhoto {
  id: string
  accommodation_id: string
  accommodation_name: string
  image_url: string
  image_order: number
  file_name: string
  file_size: number
  uploaded_at: string
  is_main: boolean
}

export default function HostPhotosPage() {
  const [photos, setPhotos] = useState<AccommodationPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [accommodationFilter, setAccommodationFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [hostData, setHostData] = useState<any>(null)

  const [accommodations, setAccommodations] = useState<any[]>([])

  useEffect(() => {
    const userData = sessionStorage.getItem('hostUser')
    if (userData) {
      const parsedData = JSON.parse(userData)
      setHostData(parsedData)
    }
  }, [])

  useEffect(() => {
    if (hostData) {
      loadHostData()
    }
  }, [hostData])

  useEffect(() => {
    if (hostData) {
      loadPhotosWithFilters()
    }
  }, [accommodationFilter, searchQuery, hostData])

  const loadHostData = async () => {
    try {
      const response = await hostGet('/api/host/photos')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch host photos')
      }

      if (result.ok) {
        setAccommodations(result.data.accommodations || [])
        setPhotos(result.data.photos || [])
      } else {
        throw new Error(result.message || 'Unknown error')
      }

    } catch (error) {
      console.error('호스트 데이터 로드 실패:', error)
      setAccommodations([])
      setPhotos([])
    }
  }

  const loadPhotosWithFilters = async () => {
    try {
      setLoading(true)
      
      const response = await hostGet('/api/host/photos')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch host photos')
      }

      if (result.ok) {
        let filteredPhotos = result.data.photos || []

        // 숙소별 필터 적용
        if (accommodationFilter !== 'all') {
          filteredPhotos = filteredPhotos.filter(p => p.accommodation_id === accommodationFilter)
        }

        // 검색 필터 적용
        if (searchQuery) {
          filteredPhotos = filteredPhotos.filter(p => 
            p.accommodation_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.file_name.toLowerCase().includes(searchQuery.toLowerCase())
          )
        }

        setPhotos(filteredPhotos)
      } else {
        throw new Error(result.message || 'Unknown error')
      }

    } catch (error) {
      console.error('사진 목록 로드 실패:', error)
      setPhotos([])
    } finally {
      setLoading(false)
    }
  }


  const handleImageUpload = async (files: FileList, accommodationId: string) => {
    try {
      setUploadingImages(true)
      
      const fileArray = Array.from(files)
      const validFiles: File[] = []
      const invalidFiles: { name: string; reason: string }[] = []

      for (const file of fileArray) {
        // 파일 크기 검증 (10MB)
        if (file.size > 10 * 1024 * 1024) {
          invalidFiles.push({ name: file.name, reason: '파일 크기가 10MB를 초과합니다' })
          continue
        }

        // 파일 형식 검증
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!validTypes.includes(file.type)) {
          invalidFiles.push({ name: file.name, reason: '지원하지 않는 파일 형식입니다' })
          continue
        }

        validFiles.push(file)
      }

      if (invalidFiles.length > 0) {
        const errorMessage = invalidFiles.map(f => `${f.name}: ${f.reason}`).join('\\n')
        alert(`다음 파일들을 업로드할 수 없습니다:\\n${errorMessage}`)
      }

      if (validFiles.length > 0) {
        // 실제로는 Supabase Storage 업로드
        alert(`${validFiles.length}개의 이미지가 성공적으로 업로드되었습니다.`)
        loadPhotosWithFilters()
      }
      
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      alert('이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploadingImages(false)
    }
  }

  const handleDeletePhoto = async (photoId: string, fileName: string) => {
    if (!confirm(`'${fileName}' 이미지를 삭제하시겠습니까?`)) return

    try {
      // 실제로는 Supabase에서 삭제
      setPhotos(prev => prev.filter(p => p.id !== photoId))
      alert('이미지가 삭제되었습니다.')
    } catch (error) {
      console.error('이미지 삭제 실패:', error)
      alert('이미지 삭제에 실패했습니다.')
    }
  }

  const handleSetMainPhoto = async (photoId: string, accommodationId: string) => {
    try {
      // 실제로는 Supabase에서 업데이트
      // 1. 해당 숙소의 모든 사진을 is_main = false로 변경
      // 2. 선택된 사진만 is_main = true로 변경
      
      setPhotos(prev => prev.map(photo => ({
        ...photo,
        is_main: photo.accommodation_id === accommodationId 
          ? photo.id === photoId 
          : photo.is_main
      })))
      
      alert('대표 사진이 변경되었습니다.')
    } catch (error) {
      console.error('대표 사진 설정 실패:', error)
      alert('대표 사진 설정에 실패했습니다.')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const totalPhotos = photos.length
  const totalSize = photos.reduce((sum, photo) => sum + photo.file_size, 0)

  return (
    <div className="host-page space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">사진 관리</h1>
          <p className="text-sm text-gray-600 mt-1">
            총 {totalPhotos}개 이미지 • {formatFileSize(totalSize)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            이미지 업로드
          </Button>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-white">
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            검색 및 필터
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="숙소명 또는 파일명으로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-300 bg-white"
                />
              </div>
            </div>
            <Select value={accommodationFilter} onValueChange={setAccommodationFilter}>
              <SelectTrigger className="w-full md:w-[200px] border-gray-300 bg-white">
                <SelectValue placeholder="숙소 선택" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="all">전체 숙소</SelectItem>
                {accommodations.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 사진 목록 */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-white">
          <CardTitle className="text-gray-900">등록된 이미지</CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 이미지가 없습니다</h3>
              <p className="text-gray-500 mb-4">첫 번째 이미지를 업로드해보세요</p>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Upload className="w-4 h-4 mr-2" />
                이미지 업로드
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="group relative">
                  <div className="aspect-square overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-100">
                    <img
                      src={photo.image_url}
                      alt={photo.file_name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  
                  {/* 호버 오버레이 */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" asChild>
                        <a href={photo.image_url} target="_blank" rel="noopener noreferrer">
                          <Eye className="w-4 h-4" />
                        </a>
                      </Button>
                      {!photo.is_main && (
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleSetMainPhoto(photo.id, photo.accommodation_id)}
                          title="대표 사진으로 설정"
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="secondary" asChild>
                        <Link href={`/host/accommodations/${photo.accommodation_id}/edit`}>
                          <Edit3 className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeletePhoto(photo.id, photo.file_name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* 배지들 */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <Badge className="text-xs bg-blue-600 text-white">
                      #{photo.image_order}
                    </Badge>
                    {photo.is_main && (
                      <Badge className="text-xs bg-yellow-500 text-white flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        대표
                      </Badge>
                    )}
                  </div>

                  {/* 파일 정보 */}
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {photo.accommodation_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {photo.file_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatFileSize(photo.file_size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* 리스트 뷰 */
            <div className="divide-y divide-gray-200">
              {photos.map((photo) => (
                <div key={photo.id} className="flex items-center gap-4 py-4">
                  <div className="w-16 h-16 flex-shrink-0">
                    <img
                      src={photo.image_url}
                      alt={photo.file_name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900 truncate">
                        {photo.accommodation_name}
                      </p>
                      {photo.is_main && (
                        <Badge className="text-xs bg-yellow-500 text-white flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          대표
                        </Badge>
                      )}
                      <Badge className="text-xs bg-blue-600 text-white">
                        #{photo.image_order}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{photo.file_name}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-500">
                        {formatFileSize(photo.file_size)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(photo.uploaded_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" asChild>
                      <a href={photo.image_url} target="_blank" rel="noopener noreferrer">
                        <Eye className="w-4 h-4" />
                      </a>
                    </Button>
                    {!photo.is_main && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleSetMainPhoto(photo.id, photo.accommodation_id)}
                        title="대표 사진으로 설정"
                        className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/host/accommodations/${photo.accommodation_id}/edit`}>
                        <Edit3 className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <a href={photo.image_url} download={photo.file_name}>
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleDeletePhoto(photo.id, photo.file_name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 업로드 가이드 */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-white">
          <CardTitle className="text-gray-900">이미지 업로드 가이드</CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ImageIcon className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">지원 형식</h3>
              <p className="text-sm text-gray-600">JPG, PNG, WEBP</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">파일 크기</h3>
              <p className="text-sm text-gray-600">최대 10MB</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Grid3X3 className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">권장 비율</h3>
              <p className="text-sm text-gray-600">16:9 또는 4:3</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}