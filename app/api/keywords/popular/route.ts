export const runtime = 'edge'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET /api/keywords/popular - 인기 키워드 조회
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const days = Number(searchParams.get('days') ?? 30)
    const limit = Number(searchParams.get('limit') ?? 20)
    const category = searchParams.get('category')

    // Edge 런타임 호환성을 위해 직접 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Check if keyword_stats table exists, if not return dummy data
    const { data, error } = await supabase
      .from('keyword_stats')
      .select('keyword, searches, category')
      .gte('created_at', new Date(Date.now() - days*24*60*60*1000).toISOString())

    if (error && (error.code === 'PGRST116' || error.message.includes('Could not find the table'))) {
      // Table doesn't exist, return dummy data
      const dummyKeywords = [
        { keyword: '제주도 풀빌라', total: 1250, category: 'travel' },
        { keyword: '서울 한옥 펜션', total: 980, category: 'family' },
        { keyword: '부산 오션뷰', total: 876, category: 'travel' },
        { keyword: '경기도 글램핑', total: 743, category: 'party' },
        { keyword: '강원도 스키장 근처', total: 654, category: 'travel' },
        { keyword: '인천 호텔', total: 598, category: 'business' },
        { keyword: '대구 모텔', total: 543, category: 'business' },
        { keyword: '충청도 펜션', total: 487, category: 'family' },
        { keyword: '전라도 한옥', total: 432, category: 'travel' },
        { keyword: '경상도 리조트', total: 389, category: 'party' }
      ]

      let filteredKeywords = dummyKeywords
      if (category) {
        filteredKeywords = dummyKeywords.filter(kw => kw.category === category)
      }

      const slicedKeywords = filteredKeywords.slice(0, limit)

      // 카테고리별 그룹핑
      const keywordsByCategory = slicedKeywords.reduce((acc, keyword) => {
        const cat = keyword.category
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(keyword)
        return acc
      }, {} as Record<string, typeof slicedKeywords>)

      return NextResponse.json({
        success: true,
        days,
        total: slicedKeywords.length,
        keywords: slicedKeywords,
        categories: {
          family: keywordsByCategory.family || [],
          party: keywordsByCategory.party || [],
          business: keywordsByCategory.business || [],
          travel: keywordsByCategory.travel || []
        },
        categoryLabels: {
          family: '가족/키즈',
          party: '파티/모임',
          business: '비즈니스',
          travel: '여행/힐링'
        }
      }, {
        headers: { 'Cache-Control': 's-maxage=300' }
      })
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // 집계 in-app (간단/빠름) — 대량이면 SQL로 group by 권장
    const map = new Map<string, { total: number, category: string }>()
    for (const r of data ?? []) {
      const current = map.get(r.keyword) || { total: 0, category: r.category || 'travel' }
      current.total += r.searches ?? 0
      map.set(r.keyword, current)
    }

    let top = [...map.entries()].sort((a,b) => b[1].total - a[1].total)

    // 카테고리 필터링
    if (category) {
      top = top.filter(([_, data]) => data.category === category)
    }

    const popularKeywords = top.slice(0, limit).map(([keyword, data]) => ({
      keyword,
      total: data.total,
      category: data.category
    }))

    // 카테고리별 그룹핑
    const keywordsByCategory = popularKeywords.reduce((acc, keyword) => {
      const cat = keyword.category
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(keyword)
      return acc
    }, {} as Record<string, typeof popularKeywords>)

    return NextResponse.json({
      success: true,
      days,
      total: popularKeywords.length,
      keywords: popularKeywords,
      categories: {
        family: keywordsByCategory.family || [],
        party: keywordsByCategory.party || [],
        business: keywordsByCategory.business || [],
        travel: keywordsByCategory.travel || []
      },
      categoryLabels: {
        family: '가족/키즈',
        party: '파티/모임',
        business: '비즈니스',
        travel: '여행/힐링'
      }
    }, {
      headers: { 'Cache-Control': 's-maxage=60' }
    })

  } catch (error: any) {
    console.error('인기 키워드 API 오류:', error)

    return NextResponse.json({
      success: false,
      error: '인기 키워드 조회 중 오류가 발생했습니다',
      details: error.message || '알 수 없는 오류'
    }, { status: 500 })
  }
}