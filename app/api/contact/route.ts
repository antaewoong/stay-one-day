import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { name, contact, message } = await request.json()

    if (!name || !contact || !message) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('contact_inquiries')
      .insert({
        name,
        contact,
        message,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Contact inquiry error:', error)
      return NextResponse.json(
        { error: '문의 저장에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Contact inquiry API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}