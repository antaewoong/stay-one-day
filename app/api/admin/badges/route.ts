import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAdminAuth } from '@/lib/auth/admin-middleware'

// 뱃지 타입 목록 조회
export async function GET(request: NextRequest) {
  return withAdminAuth(async () => {
    const supabase = createClient()
    
    const { data: badgeTypes, error } = await supabase
      .from('badge_types')
      .select('*')
      .order('priority', { ascending: false })

    if (error) {
      console.error('뱃지 타입 조회 실패:', error)
      return NextResponse.json(
        { error: '뱃지 타입 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: badgeTypes || []
    })
  })
}

// 새 뱃지 타입 생성
export async function POST(request: NextRequest) {
  return withAdminAuth(async () => {
    try {
      const supabase = createClient()
      const body = await request.json()
      
      const {
        name,
        label,
        color_scheme,
        background_color,
        text_color,
        border_color,
        icon,
        priority
      } = body

      // 필수 필드 검증
      if (!name || !label || !color_scheme || !background_color || !text_color) {
        return NextResponse.json(
          { error: '필수 필드가 누락되었습니다.' },
          { status: 400 }
        )
      }

      const { data: newBadgeType, error } = await supabase
        .from('badge_types')
        .insert({
          name,
          label,
          color_scheme,
          background_color,
          text_color,
          border_color,
          icon,
          priority: priority || 0
        })
        .select()
        .single()

      if (error) {
        console.error('뱃지 타입 생성 실패:', error)
        
        if (error.code === '23505') { // 중복 키 에러
          return NextResponse.json(
            { error: '이미 존재하는 뱃지 이름입니다.' },
            { status: 409 }
          )
        }
        
        return NextResponse.json(
          { error: '뱃지 타입 생성 중 오류가 발생했습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: newBadgeType,
        message: '뱃지 타입이 성공적으로 생성되었습니다.'
      })
      
    } catch (error) {
      console.error('뱃지 타입 생성 에러:', error)
      return NextResponse.json(
        { error: '뱃지 타입 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }
  })
}

// 뱃지 타입 수정
export async function PUT(request: NextRequest) {
  return withAdminAuth(async () => {
    try {
      const supabase = createClient()
      const body = await request.json()
      
      const {
        id,
        name,
        label,
        color_scheme,
        background_color,
        text_color,
        border_color,
        icon,
        priority,
        active
      } = body

      if (!id) {
        return NextResponse.json(
          { error: '뱃지 ID가 필요합니다.' },
          { status: 400 }
        )
      }

      const { data: updatedBadgeType, error } = await supabase
        .from('badge_types')
        .update({
          name,
          label,
          color_scheme,
          background_color,
          text_color,
          border_color,
          icon,
          priority,
          active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('뱃지 타입 수정 실패:', error)
        return NextResponse.json(
          { error: '뱃지 타입 수정 중 오류가 발생했습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: updatedBadgeType,
        message: '뱃지 타입이 성공적으로 수정되었습니다.'
      })
      
    } catch (error) {
      console.error('뱃지 타입 수정 에러:', error)
      return NextResponse.json(
        { error: '뱃지 타입 수정 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }
  })
}

// 뱃지 타입 삭제
export async function DELETE(request: NextRequest) {
  return withAdminAuth(async () => {
    try {
      const supabase = createClient()
      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')

      if (!id) {
        return NextResponse.json(
          { error: '뱃지 ID가 필요합니다.' },
          { status: 400 }
        )
      }

      const { error } = await supabase
        .from('badge_types')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('뱃지 타입 삭제 실패:', error)
        return NextResponse.json(
          { error: '뱃지 타입 삭제 중 오류가 발생했습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: '뱃지 타입이 성공적으로 삭제되었습니다.'
      })
      
    } catch (error) {
      console.error('뱃지 타입 삭제 에러:', error)
      return NextResponse.json(
        { error: '뱃지 타입 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }
  })
}