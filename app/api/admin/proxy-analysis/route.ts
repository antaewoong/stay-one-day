import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// 관리자 대리 분석 실행
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 })
    }

    const body = await request.json()
    const { hostId, analysisType } = body

    if (!hostId || !analysisType) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다' }, { status: 400 })
    }

    // Mock 분석 결과 생성 (실제로는 각 분석 타입별 로직 구현)
    const analysisResults = generateMockAnalysisResult(analysisType, hostId)

    // 분석 실행 기록 저장 (optional)
    const { error: logError } = await supabase
      .from('marketing_analysis_logs')
      .insert({
        host_id: hostId,
        analysis_type: analysisType,
        executed_by: user.id,
        executed_at: new Date().toISOString(),
        result: analysisResults,
        is_proxy: true
      })

    if (logError) {
      console.error('분석 로그 저장 실패:', logError)
      // 로그 저장 실패해도 분석 결과는 반환
    }

    return NextResponse.json({
      success: true,
      data: analysisResults,
      message: `${getAnalysisDisplayName(analysisType)} 분석이 완료되었습니다.`
    })

  } catch (error) {
    console.error('대리 분석 실행 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

function generateMockAnalysisResult(analysisType: string, hostId: string) {
  const baseResult = {
    analysisType,
    hostId,
    executedAt: new Date().toISOString(),
    executedBy: 'admin'
  }

  switch (analysisType) {
    case 'local-demand':
      return {
        ...baseResult,
        title: '지역 수요 레이더 분석',
        summary: '가평 지역의 키즈풀빌라 수요가 급상승하고 있습니다.',
        insights: [
          '키즈풀 관련 검색이 전월 대비 45% 증가',
          '가평-포천 지역 패밀리 여행 수요 집중',
          '여름 성수기 대비 예약 문의 68% 증가'
        ],
        recommendations: [
          '키즈풀빌라 전용 패키지 출시',
          '패밀리 맞춤 서비스 강화',
          '가평 지역 SEO 키워드 최적화'
        ],
        demandScore: 87,
        trendDirection: 'up'
      }

    case 'content-studio':
      return {
        ...baseResult,
        title: '콘텐츠 스튜디오 제안',
        summary: '인스타그램 릴스용 콘텐츠 아이디어를 제안합니다.',
        contentIdeas: [
          {
            type: '릴스',
            title: '키즈풀빌라 하루 일상',
            description: '아이들의 물놀이부터 바베큐까지',
            hashtags: ['#가평펜션', '#키즈풀빌라', '#패밀리여행'],
            estimatedReach: 2500
          },
          {
            type: '스토리',
            title: '펜션 시설 투어',
            description: '깔끔한 인테리어와 편의시설 소개',
            hashtags: ['#펜션추천', '#가평여행', '#힐링'],
            estimatedReach: 1200
          }
        ],
        performancePrediction: {
          expectedLikes: 450,
          expectedComments: 23,
          expectedShares: 12
        }
      }

    case 'competitor-analysis':
      return {
        ...baseResult,
        title: '경쟁사 분석 결과',
        summary: '가평 지역 주요 경쟁업체 3곳 분석 완료',
        competitors: [
          {
            name: 'A펜션',
            strengths: ['넓은 수영장', '바베큐 시설'],
            weaknesses: ['오래된 인테리어', '서비스 부족'],
            pricing: '평일 18만원, 주말 25만원',
            occupancyRate: '73%'
          },
          {
            name: 'B빌라',
            strengths: ['신축 건물', '깨끗한 시설'],
            weaknesses: ['높은 가격', '접근성 부족'],
            pricing: '평일 22만원, 주말 32만원',
            occupancyRate: '61%'
          }
        ],
        opportunities: [
          '중간 가격대 포지셔닝으로 차별화',
          '서비스 품질 강화로 경쟁우위 확보',
          '온라인 마케팅 강화 필요'
        ]
      }

    case 'shorts-trends':
      return {
        ...baseResult,
        title: '쇼츠 트렌드 분석',
        summary: '현재 인기 있는 숙박 관련 쇼츠 트렌드를 분석했습니다.',
        trendingTopics: [
          {
            topic: '펜션 모닝루틴',
            growth: '+234%',
            avgViews: '85K',
            difficulty: '쉬움'
          },
          {
            topic: '키즈풀 놀이',
            growth: '+156%',
            avgViews: '120K',
            difficulty: '보통'
          },
          {
            topic: '힐링 브이로그',
            growth: '+89%',
            avgViews: '65K',
            difficulty: '쉬움'
          }
        ],
        recommendations: [
          '펜션에서의 하루 루틴 영상 제작',
          '아이들이 놀고 있는 모습 촬영',
          '자연 속 힐링 콘텐츠 강화'
        ]
      }

    case 'ad-waste-analysis':
      return {
        ...baseResult,
        title: '광고 낭비 방지 분석',
        summary: '현재 광고 캠페인의 효율성을 분석했습니다.',
        wasteAnalysis: [
          {
            campaign: '네이버 키워드 광고',
            wasteAmount: '월 23만원',
            reason: '전환율이 낮은 키워드에 과도한 집중',
            solution: '롱테일 키워드로 전환'
          },
          {
            campaign: '인스타그램 광고',
            wasteAmount: '월 15만원',
            reason: '타겟팅 범위가 너무 넓음',
            solution: '지역 및 연령대 세분화'
          }
        ],
        potentialSavings: '월 38만원',
        optimizationScore: 67
      }

    case 'naver-place-health':
      return {
        ...baseResult,
        title: '네이버 플레이스 건강도',
        summary: '네이버 플레이스 최적화 상태를 점검했습니다.',
        currentRating: 4.2,
        reviewCount: 127,
        healthScore: 78,
        issues: [
          '최근 리뷰 답변 누락 (5건)',
          '사진 업데이트 필요 (3개월 전)',
          '운영시간 정보 불완전'
        ],
        improvements: [
          '모든 리뷰에 성실한 답변 작성',
          '매월 새로운 시설 사진 업로드',
          '정확한 운영정보 업데이트'
        ],
        projectedImprovement: '+15% 노출 증가 예상'
      }

    case 'event-suggestions':
      return {
        ...baseResult,
        title: '이벤트/날씨 기반 제안',
        summary: '날씨와 이벤트를 고려한 마케팅 제안입니다.',
        weatherForecast: [
          { date: '2024-09-20', weather: '맑음', temp: '25°C', suggestion: '수영장 이용 강조 마케팅' },
          { date: '2024-09-21', weather: '흐림', temp: '20°C', suggestion: '실내 시설 및 온수풀 어필' },
          { date: '2024-09-22', weather: '비', temp: '18°C', suggestion: '빗소리 ASMR, 힐링 콘텐츠' }
        ],
        upcomingEvents: [
          {
            event: '추석 연휴',
            date: '2024-09-28~30',
            opportunity: '가족 모임 패키지',
            expectedDemand: '높음'
          },
          {
            event: '단풍 시즌',
            date: '2024-10-15~31',
            opportunity: '단풍 명소 투어 연계',
            expectedDemand: '매우 높음'
          }
        ]
      }

    default:
      return {
        ...baseResult,
        title: '분석 결과',
        summary: '분석이 완료되었습니다.',
        data: {}
      }
  }
}

function getAnalysisDisplayName(analysisType: string): string {
  const names: { [key: string]: string } = {
    'local-demand': '지역 수요 레이더',
    'content-studio': '콘텐츠 스튜디오',
    'competitor-analysis': '경쟁사 분석',
    'shorts-trends': '쇼츠 트렌드',
    'ad-waste-analysis': '광고 낭비 방지',
    'naver-place-health': '네이버 플레이스 건강도',
    'event-suggestions': '이벤트/날씨 제안'
  }
  return names[analysisType] || '마케팅 분석'
}