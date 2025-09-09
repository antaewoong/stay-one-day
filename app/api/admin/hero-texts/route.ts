import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// 히어로 텍스트 목록 조회 (GET)
export async function GET() {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('hero_texts')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('히어로 텍스트 조회 실패:', error)
      return NextResponse.json({ error: '히어로 텍스트 조회에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('히어로 텍스트 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 히어로 텍스트 생성 (POST)
export async function POST(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const authHeader = request.headers.get('authorization')
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD
    
    if (!authHeader || !authHeader.replace('Bearer ', '').includes(adminPassword!)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const body = await request.json()
    
    const { id, english_phrase, main_text, sub_text, display_order, is_active } = body

    if (!main_text) {
      return NextResponse.json({ error: '메인 텍스트는 필수입니다.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('hero_texts')
      .insert({
        english_phrase: english_phrase || '',
        main_text,
        sub_text: sub_text || '',
        display_order: display_order || 0,
        is_active: is_active !== undefined ? is_active : true
      })
      .select()
      .single()

    if (error) {
      console.error('히어로 텍스트 생성 실패:', error)
      return NextResponse.json({ error: '히어로 텍스트 생성에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('히어로 텍스트 생성 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 히어로 텍스트 수정 (PUT)
export async function PUT(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const authHeader = request.headers.get('authorization')
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD
    
    if (!authHeader || !authHeader.replace('Bearer ', '').includes(adminPassword!)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const body = await request.json()
    
    const { id, main_text, sub_text, display_order, is_active } = body

    if (!id || !main_text) {
      return NextResponse.json({ error: 'ID와 메인 텍스트는 필수입니다.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('hero_texts')
      .update({
        english_phrase: english_phrase || '',
        main_text,
        sub_text: sub_text || '',
        display_order: display_order || 0,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('히어로 텍스트 수정 실패:', error)
      return NextResponse.json({ error: '히어로 텍스트 수정에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('히어로 텍스트 수정 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 히어로 텍스트 삭제 (DELETE)
export async function DELETE(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const authHeader = request.headers.get('authorization')
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD
    
    if (!authHeader || !authHeader.replace('Bearer ', '').includes(adminPassword!)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID는 필수입니다.' }, { status: 400 })
    }

    const { error } = await supabase
      .from('hero_texts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('히어로 텍스트 삭제 실패:', error)
      return NextResponse.json({ error: '히어로 텍스트 삭제에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ message: '히어로 텍스트가 삭제되었습니다.' })
  } catch (error) {
    console.error('히어로 텍스트 삭제 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}