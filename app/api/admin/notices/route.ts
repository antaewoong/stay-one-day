import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/middleware/withAdminAuth'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// GET: 공지사항 목록 조회 - 임시로 빈 데이터 반환
export async function GET(request: NextRequest) {
  try {
    console.log('Notices API called, returning empty data for now')

    return NextResponse.json({
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      }
    })
  } catch (error) {
    console.error('공지사항 API 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', details: error },
      { status: 500 }
    )
  }
}

// POST: 새 공지사항 생성 - 임시로 비활성화
export async function POST(request: NextRequest) {
  try {
    console.log('POST notices API called, not implemented yet')
    return NextResponse.json({
      success: false,
      error: '공지사항 생성 기능은 준비 중입니다'
    }, { status: 501 })
  } catch (error) {
    console.error('공지사항 생성 API 에러:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}