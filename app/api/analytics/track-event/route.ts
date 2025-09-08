import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(req: NextRequest) {
  try {
    const eventData = await req.json()

    const { error } = await supabaseAdmin
      .from('marketing_events')
      .insert({
        session_id: eventData.sessionId,
        user_id: eventData.userId,
        event_name: eventData.event,
        event_category: eventData.category,
        event_action: eventData.action,
        event_label: eventData.label,
        event_value: eventData.value,
        page_url: eventData.customParameters?.url,
        page_title: eventData.customParameters?.title,
        custom_parameters: eventData.customParameters
      })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('이벤트 추적 실패:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}