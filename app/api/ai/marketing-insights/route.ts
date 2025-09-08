import { NextRequest, NextResponse } from 'next/server'
import { generateRealAIInsights } from '@/lib/ai/marketing-analyzer'

export async function POST(req: NextRequest) {
  try {
    const { hostId, timeframe = '30d' } = await req.json()
    
    if (!hostId) {
      return NextResponse.json(
        { error: '호스트 ID가 필요합니다' },
        { status: 400 }
      )
    }

    console.log(`🤖 실제 AI 분석 시작: Host ${hostId}, 기간 ${timeframe}`)

    // 실제 OpenAI GPT로 마케팅 분석
    const aiInsights = await generateRealAIInsights(hostId, timeframe)

    return NextResponse.json({
      success: true,
      data: aiInsights,
      message: 'AI 분석이 완료되었습니다'
    })

  } catch (error: any) {
    console.error('AI 마케팅 분석 실패:', error)
    
    return NextResponse.json(
      { 
        error: error.message || 'AI 분석 중 오류가 발생했습니다',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const hostId = searchParams.get('hostId')
  const timeframe = searchParams.get('timeframe') || '30d'

  if (!hostId) {
    return NextResponse.json(
      { error: '호스트 ID가 필요합니다' },
      { status: 400 }
    )
  }

  try {
    const aiInsights = await generateRealAIInsights(hostId, timeframe)
    
    return NextResponse.json({
      success: true,
      data: aiInsights
    })

  } catch (error: any) {
    console.error('AI 분석 실패:', error)
    
    return NextResponse.json(
      { error: error.message || 'AI 분석 실패' },
      { status: 500 }
    )
  }
}