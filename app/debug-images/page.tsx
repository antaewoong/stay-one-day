'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugImagesPage() {
  const [accommodations, setAccommodations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAccommodations()
  }, [])

  const loadAccommodations = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('accommodations')
        .select('id, name, images')
        .or('name.ilike.%청주%,name.ilike.%cheongju%')
        .limit(10)

      if (error) {
        setError(JSON.stringify(error, null, 2))
        return
      }

      setAccommodations(data || [])
    } catch (err) {
      setError(`Exception: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8">로딩 중...</div>
  if (error) return <div className="p-8 text-red-500"><pre>{error}</pre></div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">청주 숙소 이미지 디버깅</h1>
      <p className="mb-4">찾은 숙소 수: {accommodations.length}</p>
      
      {accommodations.map((acc, index) => (
        <div key={acc.id} className="mb-8 p-4 border rounded">
          <h2 className="text-xl font-semibold">{index + 1}. {acc.name}</h2>
          <p className="text-gray-600 mb-2">ID: {acc.id}</p>
          
          <div className="mb-4">
            <h3 className="font-medium">이미지 데이터:</h3>
            <pre className="bg-gray-100 p-2 text-sm overflow-x-auto">
              {JSON.stringify(acc.images, null, 2)}
            </pre>
          </div>
          
          <div className="mb-4">
            <h3 className="font-medium">이미지 타입 정보:</h3>
            <p>Type: {typeof acc.images}</p>
            <p>Is Array: {Array.isArray(acc.images) ? 'Yes' : 'No'}</p>
            {Array.isArray(acc.images) && (
              <div>
                <p>Length: {acc.images.length}</p>
                <div className="ml-4">
                  {acc.images.map((img, imgIndex) => (
                    <div key={imgIndex}>
                      <strong>[{imgIndex}]:</strong> {typeof img === 'string' ? img : JSON.stringify(img)} 
                      <span className="text-gray-500"> (type: {typeof img})</span>
                      {typeof img === 'string' && (img.startsWith('http') || img.startsWith('/')) && (
                        <span className="text-green-600 ml-2">✓ Valid URL</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 실제 이미지 렌더링 시도 */}
          <div>
            <h3 className="font-medium mb-2">이미지 렌더링 테스트:</h3>
            <div className="grid grid-cols-3 gap-2">
              {Array.isArray(acc.images) && acc.images
                .filter(img => img && typeof img === 'string' && (img.startsWith('http') || img.startsWith('/')))
                .slice(0, 3)
                .map((img, imgIndex) => (
                  <div key={imgIndex} className="border">
                    <img 
                      src={img} 
                      alt={`${acc.name} - ${imgIndex + 1}`}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        console.log(`Image load error for ${img}:`, e)
                        ;(e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiAxNkM4LjY4NjI5IDE2IDYgMTMuMzEzNyA2IDEwQzYgNi42ODYyOSA4LjY4NjI5IDQgMTIgNEMxNS4zMTM3IDQgMTggNi42ODYyOSAxOCAxMEMxOCAxMy4zMTM3IDE1LjMxMzcgMTYgMTIgMTYiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+'
                      }}
                      onLoad={() => console.log(`Image loaded successfully: ${img}`)}
                    />
                    <p className="text-xs p-1 bg-gray-100 truncate">{img}</p>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}