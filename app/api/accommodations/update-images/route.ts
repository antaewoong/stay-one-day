import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 구공스테이 청주점 이미지 업데이트 (25개 이미지 모두 사용)
    const imageUrls = [
      '/images/90staycj/1.jpg',
      '/images/90staycj/2.jpg',
      '/images/90staycj/3.jpg',
      '/images/90staycj/4.jpg',
      '/images/90staycj/5.jpg',
      '/images/90staycj/6.jpg',
      '/images/90staycj/7.jpg',
      '/images/90staycj/8.jpg',
      '/images/90staycj/9.jpg',
      '/images/90staycj/10.jpg',
      '/images/90staycj/11.jpg',
      '/images/90staycj/12.jpg',
      '/images/90staycj/13.jpg',
      '/images/90staycj/14.jpg',
      '/images/90staycj/15.jpg',
      '/images/90staycj/16.jpg',
      '/images/90staycj/17.jpg',
      '/images/90staycj/18.jpg',
      '/images/90staycj/19.jpg',
      '/images/90staycj/20.jpg',
      '/images/90staycj/21.jpg',
      '/images/90staycj/22.jpg',
      '/images/90staycj/23.jpg',
      '/images/90staycj/24.jpg',
      '/images/90staycj/25.jpg'
    ]
    
    const { data, error } = await supabase
      .from('accommodations')
      .update({ images: imageUrls })
      .eq('name', '구공스테이 청주점')
      .select()
    
    if (error) {
      console.error('이미지 업데이트 실패:', error)
      return NextResponse.json({ error: '이미지 업데이트에 실패했습니다.' }, { status: 500 })
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json({ error: '해당 숙소를 찾을 수 없습니다.' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: '구공스테이 청주점 이미지가 성공적으로 업데이트되었습니다.',
      data: data[0]
    })
    
  } catch (error) {
    console.error('이미지 업데이트 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}