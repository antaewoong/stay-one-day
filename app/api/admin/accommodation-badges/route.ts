import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAdminAuth } from '@/lib/auth/admin-middleware'

// 숙소별 뱃지 조회
export async function GET(request: NextRequest) {
  return withAdminAuth(async () => {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const accommodationId = searchParams.get('accommodation_id')
    
    if (!accommodationId) {
      return NextResponse.json(
        { error: '숙소 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const { data: badges, error } = await supabase
      .from('accommodation_badges_with_types')
      .select('*')
      .eq('accommodation_id', accommodationId)
      .order('priority', { ascending: false })

    if (error) {
      console.error('숙소 뱃지 조회 실패:', error)
      return NextResponse.json(
        { error: '숙소 뱃지 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: badges || []
    })
  })
}

// 숙소에 뱃지 할당
export async function POST(request: NextRequest) {
  return withAdminAuth(async () => {
    try {
      const supabase = createClient()
      const body = await request.json()
      
      const {
        accommodation_id,
        badge_type_id,
        expires_at
      } = body

      // 필수 필드 검증
      if (!accommodation_id || !badge_type_id) {
        return NextResponse.json(
          { error: '숙소 ID와 뱃지 타입 ID가 필요합니다.' },
          { status: 400 }
        )
      }

      // 이미 할당된 뱃지인지 확인
      const { data: existingBadge } = await supabase
        .from('accommodation_badges')
        .select('id')
        .eq('accommodation_id', accommodation_id)
        .eq('badge_type_id', badge_type_id)
        .single()

      if (existingBadge) {
        return NextResponse.json(
          { error: '이미 할당된 뱃지입니다.' },
          { status: 409 }
        )
      }

      const { data: newBadge, error } = await supabase
        .from('accommodation_badges')
        .insert({
          accommodation_id,
          badge_type_id,
          expires_at: expires_at || null
        })
        .select(`
          *,
          badge_types (
            name,
            label,
            color_scheme,
            background_color,
            text_color,
            priority
          )
        `)
        .single()

      if (error) {
        console.error('뱃지 할당 실패:', error)
        return NextResponse.json(
          { error: '뱃지 할당 중 오류가 발생했습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: newBadge,
        message: '뱃지가 성공적으로 할당되었습니다.'
      })
      
    } catch (error) {
      console.error('뱃지 할당 에러:', error)
      return NextResponse.json(
        { error: '뱃지 할당 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }
  })
}

// 숙소 뱃지 삭제
export async function DELETE(request: NextRequest) {
  return withAdminAuth(async () => {
    try {
      const supabase = createClient()
      const { searchParams } = new URL(request.url)
      const badgeId = searchParams.get('badge_id')
      const accommodationId = searchParams.get('accommodation_id')
      const badgeTypeId = searchParams.get('badge_type_id')

      // badge_id 또는 (accommodation_id + badge_type_id) 조합으로 삭제 가능
      if (!badgeId && (!accommodationId || !badgeTypeId)) {
        return NextResponse.json(
          { error: '삭제할 뱃지를 식별할 수 없습니다.' },
          { status: 400 }
        )
      }

      let query = supabase.from('accommodation_badges').delete()
      
      if (badgeId) {
        query = query.eq('id', badgeId)
      } else {
        query = query
          .eq('accommodation_id', accommodationId)
          .eq('badge_type_id', badgeTypeId)
      }

      const { error } = await query

      if (error) {
        console.error('뱃지 삭제 실패:', error)
        return NextResponse.json(
          { error: '뱃지 삭제 중 오류가 발생했습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: '뱃지가 성공적으로 삭제되었습니다.'
      })
      
    } catch (error) {
      console.error('뱃지 삭제 에러:', error)
      return NextResponse.json(
        { error: '뱃지 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }
  })
}

// 숙소 뱃지 활성화/비활성화
export async function PATCH(request: NextRequest) {
  return withAdminAuth(async () => {
    try {
      const supabase = createClient()
      const body = await request.json()
      
      const { badge_id, active } = body

      if (!badge_id || typeof active !== 'boolean') {
        return NextResponse.json(
          { error: '뱃지 ID와 활성화 상태가 필요합니다.' },
          { status: 400 }
        )
      }

      const { data: updatedBadge, error } = await supabase
        .from('accommodation_badges')
        .update({
          active,
          updated_at: new Date().toISOString()
        })
        .eq('id', badge_id)
        .select(`
          *,
          badge_types (
            name,
            label,
            color_scheme,
            background_color,
            text_color,
            priority
          )
        `)
        .single()

      if (error) {
        console.error('뱃지 상태 변경 실패:', error)
        return NextResponse.json(
          { error: '뱃지 상태 변경 중 오류가 발생했습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: updatedBadge,
        message: `뱃지가 성공적으로 ${active ? '활성화' : '비활성화'}되었습니다.`
      })
      
    } catch (error) {
      console.error('뱃지 상태 변경 에러:', error)
      return NextResponse.json(
        { error: '뱃지 상태 변경 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }
  })
}