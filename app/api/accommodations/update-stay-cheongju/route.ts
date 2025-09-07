import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    // 기본 이미지 (업데이트할 이미지가 없으면 기본값 사용)
    const imageUrls = [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop&crop=center'
    ]
    
    // 업데이트할 필드들
    const updateData: any = {}
    
    if (body.images) {
      updateData.images = body.images
    } else {
      updateData.images = imageUrls
    }
    
    if (body.usage_guide) {
      updateData.usage_guide = body.usage_guide
    }
    
    updateData.updated_at = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('accommodations')
      .update(updateData)
      .eq('id', '257e29d3-7429-4148-8dd9-7d7c83fd58ff')
      .select()
    
    if (error) {
      console.error('스테이청주 이미지 업데이트 실패:', error)
      return NextResponse.json({ error: '이미지 업데이트에 실패했습니다.' }, { status: 500 })
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json({ error: '해당 숙소를 찾을 수 없습니다.' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: '스테이청주 이미지가 성공적으로 업데이트되었습니다.',
      data: data[0]
    })
    
  } catch (error) {
    console.error('스테이청주 이미지 업데이트 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}