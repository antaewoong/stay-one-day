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
    const sessionData = await req.json()

    // IP 주소 가져오기
    const ip = req.ip || req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    
    // 지리적 정보 추가
    let locationData = {}
    if (ip !== 'unknown') {
      try {
        const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`)
        const geoData = await geoResponse.json()
        locationData = {
          country: geoData.country_name,
          city: geoData.city
        }
      } catch (error) {
        console.error('위치 정보 수집 실패:', error)
      }
    }

    const { error } = await supabaseAdmin
      .from('web_sessions')
      .upsert({
        session_id: sessionData.sessionId,
        user_id: sessionData.userId,
        utm_source: sessionData.utmSource,
        utm_medium: sessionData.utmMedium,
        utm_campaign: sessionData.utmCampaign,
        utm_term: sessionData.utmTerm,
        utm_content: sessionData.utmContent,
        referrer: sessionData.referrer,
        landing_page: sessionData.landingPage,
        ip_address: ip,
        user_agent: sessionData.userAgent,
        device_type: sessionData.deviceType,
        browser: sessionData.browser,
        os: sessionData.os,
        ...locationData
      }, {
        onConflict: 'session_id'
      })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('세션 추적 실패:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}