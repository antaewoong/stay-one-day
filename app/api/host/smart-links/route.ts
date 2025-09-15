import { NextRequest, NextResponse } from 'next/server'
import { withHostAuth } from '@/middleware/withHostAuth'
import { nanoid } from 'nanoid'

// 허용된 리디렉션 도메인 (보안)
const ALLOWED_REDIRECT_HOSTS = [
  'stayoneday.co.kr',
  'booking.stayoneday.co.kr',
  'airbnb.com',
  'booking.com',
  'agoda.com'
]

// 메모리 스토리지 (임시 - 실제로는 smart_links 테이블 사용)
interface SmartLink {
  id: string
  host_id: string
  accommodation_id: string
  slug: string
  title: string
  description?: string
  destination_url: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  is_active: boolean
  expires_at?: string
  created_at: string
  click_count?: number
}

const smartLinksStore = new Map<string, SmartLink>()

// GET: 호스트의 스마트 링크 목록 조회
export const GET = withHostAuth(async (req, db, { userId, host }) => {
  try {
    const { searchParams } = req.nextUrl
    const accommodationId = searchParams.get('accommodationId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 숙소 필터링
    let links = Array.from(smartLinksStore.values()).filter(link =>
      link.host_id === userId
    )

    if (accommodationId) {
      links = links.filter(link => link.accommodation_id === accommodationId)
    }

    // 페이지네이션
    const total = links.length
    const paginatedLinks = links
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      links: paginatedLinks.map(link => ({
        ...link,
        short_url: `${req.nextUrl.origin}/go/${link.slug}`,
        click_count: link.click_count || 0
      })),
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total
      }
    })

  } catch (error) {
    console.error('스마트 링크 조회 API 오류:', error)
    return NextResponse.json({
      error: '스마트 링크 조회 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
})

// POST: 새로운 스마트 링크 생성
export const POST = withHostAuth(async (req, db, { userId, host }) => {
  try {
    const body = await req.json()
    const {
      accommodation_id,
      title,
      description,
      destination_url,
      utm_source,
      utm_medium,
      utm_campaign,
      custom_slug,
      expires_at
    } = body

    // 필수 필드 검증
    if (!accommodation_id || !title || !destination_url) {
      return NextResponse.json({
        error: '필수 필드가 누락되었습니다',
        required: ['accommodation_id', 'title', 'destination_url']
      }, { status: 400 })
    }

    // 숙소 소유권 확인
    const { data: accommodation, error: accomError } = await db
      .from('accommodations')
      .select('id, name')
      .eq('id', accommodation_id)
      .eq('host_id', userId)
      .single()

    if (accomError || !accommodation) {
      return NextResponse.json({
        error: '숙소를 찾을 수 없습니다'
      }, { status: 404 })
    }

    // URL 도메인 검증 (보안)
    try {
      const url = new URL(destination_url)
      const isAllowed = ALLOWED_REDIRECT_HOSTS.some(allowedHost =>
        url.hostname === allowedHost || url.hostname.endsWith('.' + allowedHost)
      )

      if (!isAllowed) {
        return NextResponse.json({
          error: '허용되지 않은 리디렉션 도메인입니다',
          allowed_domains: ALLOWED_REDIRECT_HOSTS
        }, { status: 400 })
      }
    } catch (e) {
      return NextResponse.json({
        error: '올바르지 않은 URL 형식입니다'
      }, { status: 400 })
    }

    // 슬러그 생성 또는 검증
    const slug = custom_slug || `${accommodation.name.replace(/[^가-힣a-zA-Z0-9]/g, '')}-${nanoid(6)}`

    // 슬러그 중복 확인
    const existingSlug = Array.from(smartLinksStore.values()).find(link =>
      link.slug === slug && link.is_active
    )

    if (existingSlug) {
      return NextResponse.json({
        error: '이미 사용 중인 슬러그입니다',
        suggested: `${slug}-${nanoid(4)}`
      }, { status: 409 })
    }

    // 스마트 링크 생성
    const smartLink: SmartLink = {
      id: nanoid(),
      host_id: userId,
      accommodation_id,
      slug,
      title,
      description,
      destination_url,
      utm_source,
      utm_medium,
      utm_campaign,
      is_active: true,
      expires_at: expires_at ? new Date(expires_at).toISOString() : undefined,
      created_at: new Date().toISOString(),
      click_count: 0
    }

    smartLinksStore.set(smartLink.id, smartLink)

    return NextResponse.json({
      success: true,
      link: {
        ...smartLink,
        short_url: `${req.nextUrl.origin}/go/${slug}`
      }
    }, { status: 201 })

  } catch (error) {
    console.error('스마트 링크 생성 API 오류:', error)
    return NextResponse.json({
      error: '스마트 링크 생성 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
})

// PUT: 스마트 링크 수정
export const PUT = withHostAuth(async (req, db, { userId, host }) => {
  try {
    const body = await req.json()
    const { id, title, description, destination_url, is_active, expires_at } = body

    if (!id) {
      return NextResponse.json({
        error: '링크 ID가 필요합니다'
      }, { status: 400 })
    }

    const existingLink = smartLinksStore.get(id)

    if (!existingLink || existingLink.host_id !== userId) {
      return NextResponse.json({
        error: '링크를 찾을 수 없습니다'
      }, { status: 404 })
    }

    // URL 검증 (수정시에도)
    if (destination_url) {
      try {
        const url = new URL(destination_url)
        const isAllowed = ALLOWED_REDIRECT_HOSTS.some(allowedHost =>
          url.hostname === allowedHost || url.hostname.endsWith('.' + allowedHost)
        )

        if (!isAllowed) {
          return NextResponse.json({
            error: '허용되지 않은 리디렉션 도메인입니다'
          }, { status: 400 })
        }
      } catch (e) {
        return NextResponse.json({
          error: '올바르지 않은 URL 형식입니다'
        }, { status: 400 })
      }
    }

    // 링크 업데이트
    const updatedLink = {
      ...existingLink,
      title: title || existingLink.title,
      description: description !== undefined ? description : existingLink.description,
      destination_url: destination_url || existingLink.destination_url,
      is_active: is_active !== undefined ? is_active : existingLink.is_active,
      expires_at: expires_at !== undefined
        ? (expires_at ? new Date(expires_at).toISOString() : undefined)
        : existingLink.expires_at
    }

    smartLinksStore.set(id, updatedLink)

    return NextResponse.json({
      success: true,
      link: {
        ...updatedLink,
        short_url: `${req.nextUrl.origin}/go/${updatedLink.slug}`
      }
    })

  } catch (error) {
    console.error('스마트 링크 수정 API 오류:', error)
    return NextResponse.json({
      error: '스마트 링크 수정 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
})