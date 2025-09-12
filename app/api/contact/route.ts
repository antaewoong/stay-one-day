import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NotificationHelpers } from '@/lib/telegram/notification-helpers'

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

    // 텔레그램 알림 전송 (비동기 처리)
    NotificationHelpers.notifyNewMessage({
      sender_name: name,
      name: name,
      phone: contact.includes('@') ? undefined : contact,
      email: contact.includes('@') ? contact : undefined,
      message: message,
      source: 'contact_form'
    }).catch(error => {
      console.error('연락처 문의 알림 전송 실패:', error)
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Contact inquiry API error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}