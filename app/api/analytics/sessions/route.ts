import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// 위치 정보를 가져오는 함수 (IP 기반)
async function getLocationFromIP(ip: string) {
  try {
    // 실제 환경에서는 MaxMind GeoIP2, ipapi.co, 또는 ipinfo.io 등 사용
    const response = await fetch(`http://ip-api.com/json/${ip}`)
    const data = await response.json()
    
    if (data.status === 'success') {
      return {
        country: data.country || null,
        region: data.regionName || null,
        city: data.city || null,
        latitude: data.lat || null,
        longitude: data.lon || null
      }
    }
  } catch (error) {
    console.error('위치 정보 조회 실패:', error)
  }
  
  return {
    country: null,
    region: null,
    city: null,
    latitude: null,
    longitude: null
  }
}

// User Agent 파싱 함수
function parseUserAgent(userAgent: string) {
  const deviceType = /Mobile|Android|iPhone|iPad/.test(userAgent) 
    ? (/iPad/.test(userAgent) ? 'tablet' : 'mobile')
    : 'desktop'
    
  let browser = 'Unknown'
  if (userAgent.includes('Chrome')) browser = 'Chrome'
  else if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Safari')) browser = 'Safari'
  else if (userAgent.includes('Edge')) browser = 'Edge'
  
  let os = 'Unknown'
  if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Mac')) os = 'macOS'
  else if (userAgent.includes('Linux')) os = 'Linux'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('iOS')) os = 'iOS'
  
  return { deviceType, browser, os }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    const {
      sessionId,
      userId,
      entryPage,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      pageViews,
      sessionDuration,
      bounce,
      converted,
      conversionValue
    } = body

    // IP 주소 가져오기
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || '127.0.0.1'
    
    // User Agent 정보
    const userAgent = request.headers.get('user-agent') || ''
    const { deviceType, browser, os } = parseUserAgent(userAgent)
    
    // IP 기반 위치 정보 조회
    const locationData = await getLocationFromIP(ip)
    
    // 세션 데이터 저장 또는 업데이트
    const { data: existingSession } = await supabase
      .from('web_sessions')
      .select('id')
      .eq('session_id', sessionId)
      .single()

    if (existingSession) {
      // 기존 세션 업데이트
      const { error } = await supabase
        .from('web_sessions')
        .update({
          page_views: pageViews,
          session_duration: sessionDuration,
          bounce: bounce,
          converted: converted,
          conversion_value: conversionValue,
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)

      if (error) {
        console.error('세션 업데이트 실패:', error)
        return NextResponse.json({ error: '세션 업데이트 실패' }, { status: 500 })
      }
    } else {
      // 새 세션 생성
      const { error } = await supabase
        .from('web_sessions')
        .insert({
          session_id: sessionId,
          user_id: userId,
          ip_address: ip,
          user_agent: userAgent,
          country: locationData.country,
          region: locationData.region,
          city: locationData.city,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          utm_content: utmContent,
          utm_term: utmTerm,
          device_type: deviceType,
          browser: browser,
          os: os,
          entry_page: entryPage,
          referrer: referrer,
          page_views: pageViews,
          session_duration: sessionDuration,
          bounce: bounce,
          converted: converted,
          conversion_value: conversionValue
        })

      if (error) {
        console.error('세션 생성 실패:', error)
        return NextResponse.json({ error: '세션 생성 실패' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('세션 추적 오류:', error)
    return NextResponse.json({ error: '세션 추적 오류' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('range') || '7d'
    
    // 관리자 권한 확인 (임시로 주석 처리하고 빈 데이터 반환)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('User not authenticated, returning empty data')
        return NextResponse.json({
          locationData: [],
          summary: { totalSessions: 0, totalConversions: 0, totalRevenue: 0 }
        })
      }

      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (!userRole || userRole.role !== 'admin') {
        console.log('User not admin, returning empty data')
        return NextResponse.json({
          locationData: [],
          summary: { totalSessions: 0, totalConversions: 0, totalRevenue: 0 }
        })
      }
    } catch (authError) {
      console.log('Auth error, returning empty data:', authError)
      return NextResponse.json({
        locationData: [],
        summary: { totalSessions: 0, totalConversions: 0, totalRevenue: 0 }
      })
    }

    // 날짜 범위 계산
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // 위치별 데이터 조회
    const { data: locationData } = await supabase
      .from('web_sessions')
      .select('region, city, country, converted, conversion_value, device_type')
      .gte('created_at', startDate.toISOString())

    if (!locationData) {
      return NextResponse.json({ locationData: [], journeyData: [] })
    }

    // 지역별 통계 계산
    const locationStats = locationData.reduce((acc: any, session: any) => {
      const key = `${session.region}-${session.city}`
      if (!acc[key]) {
        acc[key] = {
          region: session.region || '알 수 없음',
          city: session.city || '알 수 없음',
          sessions: 0,
          users: new Set(),
          conversions: 0,
          revenue: 0,
          deviceTypes: {}
        }
      }
      
      acc[key].sessions++
      acc[key].users.add(session.session_id)
      
      if (session.converted) {
        acc[key].conversions++
        acc[key].revenue += parseFloat(session.conversion_value || 0)
      }
      
      const deviceType = session.device_type || 'desktop'
      acc[key].deviceTypes[deviceType] = (acc[key].deviceTypes[deviceType] || 0) + 1
      
      return acc
    }, {})

    // 결과 포맷팅
    const formattedLocationData = Object.values(locationStats).map((stat: any) => ({
      region: stat.region,
      city: stat.city,
      sessions: stat.sessions,
      users: stat.users.size,
      conversion_rate: stat.sessions > 0 ? (stat.conversions / stat.sessions * 100).toFixed(1) : '0.0',
      revenue: stat.revenue,
      top_device: Object.keys(stat.deviceTypes).reduce((a, b) => 
        stat.deviceTypes[a] > stat.deviceTypes[b] ? a : b, 'desktop'
      )
    })).sort((a, b) => b.sessions - a.sessions)

    return NextResponse.json({ 
      locationData: formattedLocationData.slice(0, 10),
      summary: {
        totalSessions: locationData.length,
        totalConversions: locationData.filter(s => s.converted).length,
        totalRevenue: locationData.reduce((sum, s) => sum + parseFloat(s.conversion_value || 0), 0)
      }
    })
  } catch (error) {
    console.error('세션 데이터 조회 오류:', error)
    return NextResponse.json({ error: '데이터 조회 실패' }, { status: 500 })
  }
}