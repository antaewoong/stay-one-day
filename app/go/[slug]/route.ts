import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 허용된 리디렉션 도메인 (보안)
const ALLOWED_REDIRECT_HOSTS = [
  'stayoneday.co.kr',
  'booking.stayoneday.co.kr',
  'airbnb.com',
  'booking.com',
  'agoda.com'
]

/**
 * 스마트 링크 리디렉션 + 클릭 추적
 * /go/[slug] → destination_url로 리디렉션하면서 ROI 추적
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const startTime = Date.now()
  const { slug } = params

  try {
    const { searchParams } = request.nextUrl
    const supabase = createClient()

    // 1. 스마트 링크 정보 조회 (표준화된 컬럼명)
    const { data: smartLink, error: linkError } = await supabase
      .from('smart_links')
      .select(`
        id,
        host_id,
        accommodation_id,
        slug,
        title,
        description,
        destination_url,
        utm_source,
        utm_medium,
        utm_campaign,
        is_active,
        expires_at,
        click_count,
        accommodations (id, name)
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (linkError || !smartLink) {
      console.log(`[SMART_LINK_404] slug=${slug}`)
      return NextResponse.redirect(new URL('/?error=link_not_found', request.url))
    }

    // 2. 만료 확인
    if (smartLink.expires_at && new Date() > new Date(smartLink.expires_at)) {
      console.log(`[SMART_LINK_EXPIRED] slug=${slug} expired_at=${smartLink.expires_at}`)
      return NextResponse.redirect(new URL('/?error=link_expired', request.url), 410)
    }

    // 3. 클릭 정보 수집
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() :
               request.headers.get('x-real-ip') ||
               '127.0.0.1'

    const userAgent = request.headers.get('user-agent') || ''
    const referrer = request.headers.get('referer') || ''

    // UTM 파라미터 (URL > 링크 설정 순서)
    const utmSource = searchParams.get('utm_source') || smartLink.utm_source || 'stayoneday'
    const utmMedium = searchParams.get('utm_medium') || smartLink.utm_medium || 'smart-link'
    const utmCampaign = searchParams.get('utm_campaign') || smartLink.utm_campaign || 'default'

    // 4. 클릭 로그 저장 (비동기로 처리)
    const clickId = `click_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    supabase
      .from('smart_link_clicks')
      .insert({
        smart_link_id: smartLink.id,
        accommodation_id: smartLink.accommodation_id,
        host_id: smartLink.host_id,
        ip_address: ip,
        user_agent: userAgent,
        referrer,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        session_id: request.cookies.get('session_id')?.value,
        clicked_at: new Date().toISOString()
      })
      .then(({ error }) => {
        if (error) console.error('클릭 추적 실패:', error)
      })

    // 5. 클릭 수 증가 (비동기)
    supabase
      .from('smart_links')
      .update({
        click_count: (smartLink.click_count || 0) + 1,
        last_clicked_at: new Date().toISOString()
      })
      .eq('id', smartLink.id)
      .then(({ error }) => {
        if (error) console.error('클릭 수 업데이트 실패:', error)
      })

    // 6. 목적지 URL 구성 및 검증
    let destinationURL: URL

    try {
      // 상대 경로인 경우 절대 경로로 변환
      if (smartLink.destination_url.startsWith('/')) {
        destinationURL = new URL(smartLink.destination_url, request.url)
      } else {
        destinationURL = new URL(smartLink.destination_url)
      }

      // 도메인 보안 검증
      const isAllowed = ALLOWED_REDIRECT_HOSTS.some(allowedHost =>
        destinationURL.hostname === allowedHost ||
        destinationURL.hostname.endsWith('.' + allowedHost)
      )

      if (!isAllowed) {
        console.error(`[SMART_LINK_BLOCKED] slug=${slug} domain=${destinationURL.hostname}`)
        return NextResponse.redirect(new URL('/?error=invalid_destination', request.url))
      }

    } catch (e) {
      console.error(`[SMART_LINK_URL_ERROR] slug=${slug} url=${smartLink.destination_url}`)
      return NextResponse.redirect(new URL('/?error=invalid_url', request.url))
    }

    // 7. UTM 및 추적 파라미터 추가
    destinationURL.searchParams.set('utm_source', utmSource)
    destinationURL.searchParams.set('utm_medium', utmMedium)
    destinationURL.searchParams.set('utm_campaign', utmCampaign)
    destinationURL.searchParams.set('ref', 'stayoneday')
    destinationURL.searchParams.set('click_id', clickId)

    // 8. 성능 로그
    const duration = Date.now() - startTime
    console.log(`[SMART_LINK_REDIRECT] slug=${slug} destination=${destinationURL.hostname} duration=${duration}ms ip=${ip}`)

    // 9. 리디렉션 실행
    return NextResponse.redirect(destinationURL.toString(), 302)

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[SMART_LINK_ERROR] slug=${slug} duration=${duration}ms error:`, error)

    // 에러 발생시 메인 페이지로 안전하게 리디렉션
    return NextResponse.redirect(
      new URL('/?error=redirect_failed', request.url),
      302
    )
  }
}

/**
 * HEAD 요청 지원 (링크 미리보기, 크롤러 대응)
 * 클릭 로그는 남기지 않음
 */
export async function HEAD(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    const supabase = createClient()

    const { data: smartLink, error } = await supabase
      .from('smart_links')
      .select('id, title, description, is_active, expires_at')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error || !smartLink) {
      return new Response(null, { status: 404 })
    }

    if (smartLink.expires_at && new Date() > new Date(smartLink.expires_at)) {
      return new Response(null, { status: 410 })
    }

    return new Response(null, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300', // 5분 캐시
        'X-Smart-Link-Title': smartLink.title || '',
        'X-Smart-Link-Description': smartLink.description || ''
      }
    })

  } catch (error) {
    console.error('스마트 링크 HEAD 요청 오류:', error)
    return new Response(null, { status: 500 })
  }
}