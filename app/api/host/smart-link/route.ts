import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 스마트 링크 생성 API - 호스트별 추적 링크
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '인증 필요' }, { status: 401 })
    }

    const { accommodationId, source, campaign, medium } = await request.json()

    // 호스트 권한 확인
    const { data: host } = await supabase
      .from('host_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!host) {
      return NextResponse.json({ error: '호스트 권한 필요' }, { status: 403 })
    }

    // 숙소 소유권 확인
    const { data: accommodation } = await supabase
      .from('accommodations')
      .select('id, name')
      .eq('id', accommodationId)
      .eq('host_id', host.id)
      .single()

    if (!accommodation) {
      return NextResponse.json({ error: '숙소를 찾을 수 없습니다' }, { status: 404 })
    }

    // 스마트 링크 생성 (slug 형태)
    const slug = `${accommodation.name.replace(/\s+/g, '-').toLowerCase()}-${accommodationId.slice(0, 8)}`

    // UTM 파라미터 포함한 추적 링크
    const trackingParams = new URLSearchParams({
      utm_source: source || 'host-direct',
      utm_medium: medium || 'smart-link',
      utm_campaign: campaign || 'weekly-promotion',
      utm_content: accommodationId
    })

    const smartLink = `${process.env.NEXT_PUBLIC_SITE_URL}/go/${slug}?${trackingParams}`

    // 스마트 링크 정보 저장
    const { error: insertError } = await supabase
      .from('smart_links')
      .insert({
        accommodation_id: accommodationId,
        host_id: host.id,
        slug,
        source,
        medium,
        campaign,
        full_url: smartLink,
        active: true
      })

    if (insertError) {
      console.error('스마트 링크 저장 실패:', insertError)
      return NextResponse.json({ error: '링크 생성 실패' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      smartLink,
      slug,
      accommodationName: accommodation.name,
      trackingInfo: {
        source,
        medium,
        campaign
      }
    })

  } catch (error) {
    console.error('스마트 링크 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}