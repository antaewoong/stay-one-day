import { NextRequest, NextResponse } from 'next/server'
import { getKeywordTargetingSystem } from '@/lib/keyword-targeting'

// GET /api/keywords?query=키즈 - 키워드 검색/자동완성
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const query = searchParams.get('query')
    const limit = parseInt(searchParams.get('limit') || '20')

    const keywordSystem = getKeywordTargetingSystem()

    if (query) {
      // 검색 쿼리가 있는 경우 - 자동완성
      const searchResults = await keywordSystem.searchKeywords(query, limit)

      return NextResponse.json({
        success: true,
        query,
        results: searchResults,
        count: searchResults.length
      })
    } else {
      // 쿼리가 없는 경우 - 인기 키워드 반환
      const popularKeywords = await keywordSystem.getPopularKeywords(limit)

      return NextResponse.json({
        success: true,
        type: 'popular',
        results: popularKeywords,
        count: popularKeywords.length
      })
    }

  } catch (error) {
    console.error('키워드 검색 API 오류:', error)

    return NextResponse.json({
      success: false,
      error: '키워드 검색 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
}