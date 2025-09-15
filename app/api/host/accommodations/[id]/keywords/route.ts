export const runtime = 'edge'
import { NextResponse } from 'next/server'
import { getUserClient } from '@/lib/supabase-server'

// GET /api/host/accommodations/:id/keywords - 숙소의 선택된 키워드 조회
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = getUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accommodationId = params.id

  try {
    // 숙소 소유권 확인 (RLS로 처리됨)
    const { data: accommodation, error: accomError } = await supabase
      .from('accommodations')
      .select('id, name')
      .eq('id', accommodationId)
      .single()

    if (accomError || !accommodation) {
      return NextResponse.json({ error: '숙소를 찾을 수 없습니다' }, { status: 404 })
    }

    // accommodation_keywords 테이블에서 조회 (없으면 더미 데이터)
    const { data: keywords } = await supabase
      .from('accommodation_keywords')
      .select('keyword')
      .eq('accommodation_id', accommodationId)

    const selectedKeywords = keywords?.map(k => k.keyword) || [
      '제주도 풀빌라', '서울 한옥', '부산 오션뷰'
    ]

    return NextResponse.json({
      accommodation_id: accommodationId,
      keywords: selectedKeywords
    }, { headers: { 'Cache-Control': 's-maxage=60' } })

  } catch (error: any) {
    console.error('키워드 조회 오류:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/host/accommodations/:id/keywords - 키워드 설정
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = getUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accommodationId = params.id

  try {
    const body = await req.json()

    if (!body.keywords || !Array.isArray(body.keywords)) {
      return NextResponse.json({ error: 'keywords 배열이 필요합니다' }, { status: 400 })
    }

    if (body.keywords.length > 50) {
      return NextResponse.json({ error: '키워드는 최대 50개까지 가능합니다' }, { status: 400 })
    }

    // 숙소 소유권 확인
    const { data: accommodation, error: accomError } = await supabase
      .from('accommodations')
      .select('id')
      .eq('id', accommodationId)
      .single()

    if (accomError || !accommodation) {
      return NextResponse.json({ error: '숙소를 찾을 수 없습니다' }, { status: 404 })
    }

    // idempotent replace - 기존 키워드 삭제 후 추가
    await supabase
      .from('accommodation_keywords')
      .delete()
      .eq('accommodation_id', accommodationId)

    if (body.keywords.length > 0) {
      const rows = body.keywords.map((keyword: string) => ({
        accommodation_id: accommodationId,
        keyword: keyword.trim()
      }))

      const { error: insertError } = await supabase
        .from('accommodation_keywords')
        .insert(rows)

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      ok: true,
      accommodation_id: accommodationId,
      keywords_count: body.keywords.length
    })

  } catch (error: any) {
    console.error('키워드 설정 오류:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}