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
import { createClient } from '@/lib/supabase/client'

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
      loadPhotos()
    }
  }, [accommodationFilter, searchQuery, hostData])

  const loadHostData = async () => {
    try {
      if (!hostData?.host_id) {
        console.error('호스트 정보가 없습니다')
        return
      }

      // 호스트 UUID 가져오기
      const { data: hostIdData, error: hostError } = await createClient()
        .from('hosts')
        .select('id')
        .eq('host_id', hostData.host_id)
        .single()

      if (hostError || !hostIdData) {
        console.error('호스트 정보를 찾을 수 없습니다:', hostError)
        setAccommodations([])
        return
      }

      // 호스트의 숙소들 가져오기
      const { data: accData, error: accError } = await createClient()
        .from('accommodations')
        .select('id, name, accommodation_type')
        .eq('host_id', hostIdData.id)
        .eq('status', 'active')

      if (accError) {
        console.error('숙소 데이터 로드 실패:', accError)
        setAccommodations([])
      } else {
        setAccommodations(accData || [])
      }

    } catch (error) {
      console.error('호스트 데이터 로드 실패:', error)
      setAccommodations([])
    }
  }

  const loadPhotos = async () => {
    try {
      setLoading(true)
      
      if (!hostData?.host_id) {
        console.error('호스트 정보가 없습니다')
        return
      }

      // 호스트 UUID 가져오기
      const { data: hostIdData, error: hostError } = await createClient()
        .from('hosts')
        .select('id')
        .eq('host_id', hostData.host_id)
        .single()

      if (hostError || !hostIdData) {
        console.error('호스트 정보를 찾을 수 없습니다:', hostError)
        setPhotos([])
        return
      }

      // 호스트의 숙소 ID들 가져오기
      const { data: accData } = await createClient()
        .from('accommodations')
        .select('id')
        .eq('host_id', hostIdData.id)
        .eq('status', 'active')

      if (!accData || accData.length === 0) {
        setPhotos([])
        return
      }

      const accommodationIds = accData.map(acc => acc.id)

      // 숙소 이미지들 가져오기
      let query = createClient()
        .from('accommodation_images')
        .select(`
          *,
          accommodations(name)
        `)
        .in('accommodation_id', accommodationIds)
        .order('image_order')

      // 숙소별 필터 적용
      if (accommodationFilter !== 'all') {
        query = query.eq('accommodation_id', accommodationFilter)
      }

      const { data: photosData, error: photosError } = await query

      if (photosError) {
        console.error('사진 데이터 로드 실패:', photosError)
        setPhotos([])
        return
      }

      // 데이터 변환
      let transformedPhotos: AccommodationPhoto[] = (photosData || []).map(photo => ({
        id: photo.id,
        accommodation_id: photo.accommodation_id,
        accommodation_name: photo.accommodations?.name || 'Unknown',
        image_url: photo.image_url,
        image_order: photo.image_order || 1,
        file_name: photo.image_url?.split('/').pop() || 'unknown.jpg',
        file_size: 0, // 실제로는 파일 크기 정보가 필요
        uploaded_at: photo.created_at || new Date().toISOString(),
        is_main: photo.image_order === 1
      }))

      // 검색 필터 적용
      if (searchQuery) {
        transformedPhotos = transformedPhotos.filter(p => 
          p.accommodation_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.file_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }

      setPhotos(transformedPhotos)
    } catch (error) {
      console.error('사진 목록 로드 실패:', error)
      setPhotos([])
    } finally {
      setLoading(false)
    }
  }

  const getHostPhotos = (hostId: string): AccommodationPhoto[] => {
    const photoDataMap: Record<string, AccommodationPhoto[]> = {
      'host-1': [
        {
          id: '1',
          accommodation_id: '1',
          accommodation_name: '구공스테이 풀빌라',
          image_url: '/images/90staycj/1.jpg',
          image_order: 1,
          file_name: 'poolvilla_main.jpg',
          file_size: 2.5 * 1024 * 1024,
          uploaded_at: '2024-01-15T10:30:00Z',
          is_main: true
        },
        {
          id: '2',
          accommodation_id: '1',
          accommodation_name: '구공스테이 풀빌라',
          image_url: '/images/90staycj/2.jpg',
          image_order: 2,
          file_name: 'poolvilla_pool.jpg',
          file_size: 3.2 * 1024 * 1024,
          uploaded_at: '2024-01-15T10:35:00Z',
          is_main: false
        },
        {
          id: '3',
          accommodation_id: '1',
          accommodation_name: '구공스테이 풀빌라',
          image_url: '/images/90staycj/3.jpg',
          image_order: 3,
          file_name: 'poolvilla_interior.jpg',
          file_size: 2.8 * 1024 * 1024,
          uploaded_at: '2024-01-15T10:40:00Z',
          is_main: false
        },
        {
          id: '4',
          accommodation_id: '2',
          accommodation_name: '구공스테이 독채',
          image_url: '/images/90staycj/4.jpg',
          image_order: 1,
          file_name: 'private_house_main.jpg',
          file_size: 2.1 * 1024 * 1024,
          uploaded_at: '2024-01-16T14:20:00Z',
          is_main: true
        },
        {
          id: '5',
          accommodation_id: '2',
          accommodation_name: '구공스테이 독채',
          image_url: '/images/90staycj/5.jpg',
          image_order: 2,
          file_name: 'private_house_living.jpg',
          file_size: 2.9 * 1024 * 1024,
          uploaded_at: '2024-01-16T14:25:00Z',
          is_main: false
        }
      ],
      'host-2': [
        {
          id: '6',
          accommodation_id: '3',
          accommodation_name: '스테이도고 펜션',
          image_url: '/images/sample/pension1.jpg',
          image_order: 1,
          file_name: 'pension_exterior.jpg',
          file_size: 1.8 * 1024 * 1024,
          uploaded_at: '2024-01-20T09:15:00Z',
          is_main: true
        }
      ]
    }

    return photoDataMap[hostId] || []
  }

  useEffect(() => {
    if (hostData) {
      const timeoutId = setTimeout(() => {
        loadPhotos(hostData.host_id)
      }, 300)

      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery, accommodationFilter, hostData])

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
        loadPhotos(hostData.host_id)
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