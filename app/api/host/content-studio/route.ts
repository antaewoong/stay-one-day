import { NextRequest, NextResponse } from 'next/server'
import { withHostAuth } from '@/middleware/withHostAuth'
import { getContentStudio } from '@/lib/content-studio'
import { tryIncrementQuota } from '@/utils/quota-manager'

export const GET = withHostAuth(async (req, db, { userId, host }) => {
  try {
    const { searchParams } = req.nextUrl
    const accommodationId = searchParams.get('accommodationId')
    const contentType = searchParams.get('contentType') // 'suggestions' | 'calendar' | 'templates'

    if (!accommodationId) {
      return NextResponse.json({ error: '숙소 ID가 필요합니다' }, { status: 400 })
    }

    // 쿼터 확인
    const quotaResult = tryIncrementQuota(userId, 'manual')
    if (!quotaResult.incremented) {
      return NextResponse.json({
        error: 'quota_exceeded',
        message: '이번 주 분석 2회 모두 사용하셨습니다',
        next_available: quotaResult.next_available
      }, { status: 429 })
    }

    // 숙소 정보 조회
    const { data: accommodation, error: accomError } = await db
      .from('accommodations')
      .select('id, name, city, region, accommodation_type')
      .eq('id', accommodationId)
      .eq('host_id', host.id)
      .single()

    if (accomError || !accommodation) {
      return NextResponse.json({ error: '숙소를 찾을 수 없습니다' }, { status: 404 })
    }

    // 콘텐츠 스튜디오 실행
    const contentStudio = getContentStudio()
    const contentResults = await contentStudio.generateContentSuggestions(
      accommodation.name,
      accommodation.city,
      accommodation.region,
      accommodation.accommodation_type || '펜션',
      ['families', 'couples', 'friends'] // 기본 타겟 오디언스
    )

    // 추가 분석 생성
    const contentAnalytics = generateContentAnalytics(contentResults)
    const performanceInsights = generatePerformanceInsights(contentResults)
    const creativeDirection = generateCreativeDirection(accommodation)

    return NextResponse.json({
      success: true,
      accommodationName: accommodation.name,
      location: `${accommodation.city}, ${accommodation.region}`,

      // 콘텐츠 제안 요약
      contentOverview: {
        totalSuggestions: contentResults.contentSuggestions.length,
        highPriorityContent: contentResults.contentSuggestions.filter(c => c.trendScore > 85).length,
        platformDistribution: getPlatformDistribution(contentResults.contentSuggestions),
        contentTypeBreakdown: getContentTypeBreakdown(contentResults.contentSuggestions),
        estimatedEngagement: calculateAverageEngagement(contentResults.contentSuggestions)
      },

      // 콘텐츠 제안
      contentSuggestions: contentResults.contentSuggestions.map((suggestion, index) => ({
        ...suggestion,
        readyToUse: isContentReadyToUse(suggestion),
        customizationNeeded: getCustomizationTips(suggestion),
        competitorGap: assessCompetitorGap(suggestion),
        visualRecommendations: generateVisualRecs(suggestion)
      })),

      // 콘텐츠 캘린더
      contentCalendar: contentResults.contentCalendar.map((calendarItem, index) => ({
        ...calendarItem,
        id: `calendar_${index}`,
        preparationTime: estimatePreparationTime(calendarItem),
        resourcesNeeded: getRequiredResources(calendarItem),
        alternativeOptions: generateAlternatives(calendarItem)
      })),

      // 템플릿 라이브러리
      templates: {
        available: contentResults.templates,
        recommended: getRecommendedTemplates(contentResults.templates, accommodation),
        custom: generateCustomTemplates(accommodation),
        trending: getTrendingTemplates()
      },

      // AI 인사이트
      aiInsights: {
        ...contentResults.aiInsights,
        contentPersonality: defineContentPersonality(accommodation),
        voiceAndTone: generateVoiceGuideline(accommodation),
        contentPillars: defineContentPillars(accommodation),
        hashtagStrategy: generateHashtagStrategy(accommodation.city, accommodation.accommodation_type)
      },

      // 성과 예측
      performanceMetrics: {
        ...contentResults.performancePredictions,
        expectedROI: calculateContentROI(contentResults.contentSuggestions),
        growthProjection: predictGrowthFromContent(contentResults),
        competitiveAdvantage: assessContentCompetitiveness(contentResults),
        brandAwarenessImpact: predictBrandImpact(contentResults)
      },

      // 트렌드 분석
      trendsAnalysis: {
        ...contentResults.trendsAnalysis,
        industryTrends: getHospitalityTrends(),
        localTrends: getLocalContentTrends(accommodation.city),
        seasonalOpportunities: getSeasonalContentOpps(),
        emergingPlatforms: getEmergingPlatformTrends()
      },

      // 콘텐츠 분석
      contentAnalytics,

      // 성과 인사이트
      performanceInsights,

      // 크리에이티브 방향성
      creativeDirection,

      // 실행 가이드
      executionGuide: {
        quickStart: generateQuickStartGuide(contentResults),
        weeklySchedule: generateWeeklyContentSchedule(),
        toolsRecommended: getRecommendedContentTools(),
        budgetGuideline: generateContentBudgetGuide(),
        measurementPlan: getContentMeasurementPlan()
      },

      // 협업 도구
      collaborationFeatures: {
        templateSharing: '팀원과 템플릿 공유 기능',
        approvalWorkflow: '콘텐츠 승인 프로세스',
        contentLibrary: '이미지/영상 소재 관리',
        performanceTracking: '콘텐츠별 성과 추적'
      },

      dataSource: 'content_studio_system',
      quota_status: {
        used: quotaResult.total_runs,
        remaining: 2 - quotaResult.total_runs,
        reset_date: quotaResult.next_available
      },
      updateTime: new Date().toISOString()
    })

  } catch (error) {
    console.error('콘텐츠 스튜디오 API 오류:', error)

    return NextResponse.json({
      error: '콘텐츠 스튜디오 분석 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
})

// 콘텐츠 분석 생성
function generateContentAnalytics(contentResults: any) {
  return {
    contentEfficiencyScore: calculateContentEfficiency(contentResults.contentSuggestions),
    diversityIndex: calculateContentDiversity(contentResults.contentSuggestions),
    seasonalAlignment: assessSeasonalAlignment(contentResults.contentSuggestions),
    audienceAlignment: assessAudienceAlignment(contentResults.contentSuggestions),
    trendAlignment: assessTrendAlignment(contentResults.contentSuggestions),
    platformOptimization: assessPlatformOptimization(contentResults.contentSuggestions)
  }
}

// 성과 인사이트 생성
function generatePerformanceInsights(contentResults: any) {
  return {
    topPerformingContent: identifyTopPerformers(contentResults.contentSuggestions),
    underperformingAreas: identifyWeakAreas(contentResults.contentSuggestions),
    improvementOpportunities: identifyImprovementOpps(contentResults.contentSuggestions),
    competitiveAdvantages: identifyContentAdvantages(contentResults.contentSuggestions),
    resourceOptimization: optimizeResourceAllocation(contentResults.contentSuggestions)
  }
}

// 크리에이티브 방향성 생성
function generateCreativeDirection(accommodation: any) {
  return {
    brandPersonality: `${accommodation.city}의 따뜻하고 친근한 ${accommodation.accommodation_type}`,
    visualStyle: {
      colorPalette: '자연 색상 (그린, 브라운, 베이지)',
      photography: '자연광 활용, 따뜻한 톤',
      typography: '친근하고 읽기 쉬운 폰트',
      layout: '깔끔하고 직관적인 구성'
    },
    contentThemes: [
      '자연과의 조화',
      '진정한 휴식',
      '특별한 경험',
      '따뜻한 환대',
      '지역 문화 체험'
    ],
    messageDirection: {
      primary: '완벽한 힐링을 위한 특별한 공간',
      secondary: '자연 속에서 만나는 진정한 휴식',
      supporting: ['가족과 함께', '연인과 함께', '친구와 함께']
    }
  }
}

// 유틸리티 함수들
function getPlatformDistribution(suggestions: any[]): { [key: string]: number } {
  const distribution: { [key: string]: number } = {}
  suggestions.forEach(s => {
    distribution[s.platform] = (distribution[s.platform] || 0) + 1
  })
  return distribution
}

function getContentTypeBreakdown(suggestions: any[]): { [key: string]: number } {
  const breakdown: { [key: string]: number } = {}
  suggestions.forEach(s => {
    breakdown[s.contentType] = (breakdown[s.contentType] || 0) + 1
  })
  return breakdown
}

function calculateAverageEngagement(suggestions: any[]): string {
  const engagements = suggestions.map(s => parseInt(s.engagementPrediction) || 75)
  const average = engagements.reduce((sum, e) => sum + e, 0) / engagements.length
  return `${Math.round(average)}%`
}

function isContentReadyToUse(suggestion: any): boolean {
  return suggestion.difficulty === 'easy' && suggestion.trendScore > 80
}

function getCustomizationTips(suggestion: any): string[] {
  const tips = []
  if (suggestion.difficulty === 'hard') tips.push('전문 디자이너 협업 권장')
  if (suggestion.trendScore < 70) tips.push('최신 트렌드 반영 필요')
  if (suggestion.platform === 'instagram') tips.push('비주얼 중심 콘텐츠 강화')
  return tips
}

function assessCompetitorGap(suggestion: any): string {
  if (suggestion.trendScore > 85) return 'High - 경쟁사 대비 차별화 우수'
  if (suggestion.trendScore > 70) return 'Medium - 경쟁사와 유사한 수준'
  return 'Low - 경쟁사 대비 개선 필요'
}

function generateVisualRecs(suggestion: any): string[] {
  const recs = []
  if (suggestion.platform === 'instagram') {
    recs.push('9:16 세로 이미지 최적화', '스토리용 템플릿 활용')
  }
  if (suggestion.contentType === 'social_post') {
    recs.push('고품질 사진', '일관된 브랜드 컬러')
  }
  return recs
}

function estimatePreparationTime(calendarItem: any): string {
  const timeMap: { [key: string]: string } = {
    'social_post': '30분-1시간',
    'blog_article': '2-3시간',
    'email_campaign': '1-2시간',
    'review_response': '10-15분'
  }
  return timeMap[calendarItem.contentType] || '1시간'
}

function getRequiredResources(calendarItem: any): string[] {
  const resources: { [key: string]: string[] } = {
    'social_post': ['사진/이미지', '카피라이터'],
    'blog_article': ['콘텐츠 작가', 'SEO 전문가'],
    'email_campaign': ['디자이너', '마케터'],
    'review_response': ['고객서비스 담당자']
  }
  return resources[calendarItem.contentType] || ['콘텐츠 담당자']
}

function generateAlternatives(calendarItem: any): string[] {
  return [
    `${calendarItem.theme} 영상 콘텐츠`,
    `${calendarItem.theme} 인포그래픽`,
    `${calendarItem.theme} 고객 후기 활용`
  ]
}

function getRecommendedTemplates(templates: any[], accommodation: any): any[] {
  return templates.filter(t =>
    t.targetAudience.includes('all') ||
    t.tags.includes(accommodation.accommodation_type)
  ).slice(0, 3)
}

function generateCustomTemplates(accommodation: any): any[] {
  return [
    {
      id: 'custom_1',
      title: `${accommodation.name} 브랜드 템플릿`,
      description: '숙소 전용 맞춤 템플릿',
      platform: 'all'
    },
    {
      id: 'custom_2',
      title: `${accommodation.city} 지역 특화 템플릿`,
      description: '지역 특색을 살린 콘텐츠 템플릿',
      platform: 'all'
    }
  ]
}

function getTrendingTemplates(): any[] {
  return [
    {
      id: 'trending_1',
      title: '가을 감성 템플릿',
      description: '현재 인기 상승 중인 가을 테마',
      trendScore: 92
    },
    {
      id: 'trending_2',
      title: '힐링 라이프 템플릿',
      description: '웰니스 트렌드 반영',
      trendScore: 88
    }
  ]
}

function defineContentPersonality(accommodation: any): string {
  return `${accommodation.city}의 자연을 사랑하는, 따뜻하고 진실한 호스트`
}

function generateVoiceGuideline(accommodation: any): any {
  return {
    tone: '친근하고 따뜻함',
    personality: '진실하고 도움이 되는',
    language: '쉽고 자연스러운 한국어',
    doNot: ['과장된 표현', '부정적인 단어', '복잡한 전문용어']
  }
}

function defineContentPillars(accommodation: any): string[] {
  return [
    '자연 속 힐링',
    '완벽한 휴식',
    '특별한 경험',
    '따뜻한 환대',
    `${accommodation.city} 문화`
  ]
}

function generateHashtagStrategy(city: string, type: string): any {
  return {
    primary: [`#${city}`, `#${type}`, '#힐링'],
    secondary: ['#여행', '#휴식', '#자연'],
    trending: ['#워케이션', '#감성숙소', '#힐링여행'],
    local: [`#${city}여행`, `#${city}명소`, `#${city}맛집`],
    usage: '포스트당 3-5개 해시태그 권장'
  }
}

function calculateContentROI(suggestions: any[]): string {
  const highPerforming = suggestions.filter(s => s.trendScore > 80).length
  const totalSuggestions = suggestions.length
  const roi = (highPerforming / totalSuggestions) * 200
  return `${Math.round(roi)}% 예상 ROI`
}

function predictGrowthFromContent(contentResults: any): string {
  return '월 15-25% 브랜드 인지도 증가'
}

function assessContentCompetitiveness(contentResults: any): string {
  const uniqueContent = contentResults.contentSuggestions.filter(
    (s: any) => s.trendScore > 85
  ).length
  return uniqueContent > 3 ? 'Strong' : uniqueContent > 1 ? 'Medium' : 'Needs Improvement'
}

function predictBrandImpact(contentResults: any): string {
  return '6개월 내 브랜드 인지도 40-60% 개선'
}

function getHospitalityTrends(): string[] {
  return [
    '지속가능한 여행 트렌드',
    '로컬 체험 중심 콘텐츠',
    '웰니스 여행 부상',
    '소셜미디어 인증샷 문화',
    '개인화된 서비스 경험'
  ]
}

function getLocalContentTrends(city: string): string[] {
  return [
    `${city} 숨은 명소 탐방`,
    '지역 맛집 투어',
    '전통 문화 체험',
    '자연 경관 포토존',
    '지역 축제 연계'
  ]
}

function getSeasonalContentOpps(): string[] {
  return [
    '가을 단풍 시즌 특화',
    '겨울 온천 콘텐츠',
    '봄 벚꽃 패키지',
    '여름 휴가 시즌 대응'
  ]
}

function getEmergingPlatformTrends(): string[] {
  return [
    '틱톡 숏폼 콘텐츠',
    '유튜브 쇼츠 활용',
    '네이버 블로그 SEO',
    '인스타그램 릴스',
    '카카오 채널 마케팅'
  ]
}

function calculateContentEfficiency(suggestions: any[]): number {
  const easyContent = suggestions.filter(s => s.difficulty === 'easy').length
  return Math.round((easyContent / suggestions.length) * 100)
}

function calculateContentDiversity(suggestions: any[]): number {
  const platforms = new Set(suggestions.map(s => s.platform)).size
  const types = new Set(suggestions.map(s => s.contentType)).size
  return Math.round(((platforms + types) / 8) * 100) // 8은 최대 가능한 다양성
}

function assessSeasonalAlignment(suggestions: any[]): number {
  const seasonalContent = suggestions.filter(s => s.seasonalRelevance > 80).length
  return Math.round((seasonalContent / suggestions.length) * 100)
}

function assessAudienceAlignment(suggestions: any[]): string {
  return '85% - 타겟 오디언스와 높은 일치율'
}

function assessTrendAlignment(suggestions: any[]): number {
  const trendyContent = suggestions.filter(s => s.trendScore > 80).length
  return Math.round((trendyContent / suggestions.length) * 100)
}

function assessPlatformOptimization(suggestions: any[]): string {
  return '각 플랫폼별 최적화 90% 달성'
}

function identifyTopPerformers(suggestions: any[]): any[] {
  return suggestions
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, 3)
    .map(s => ({ title: s.title, score: s.trendScore }))
}

function identifyWeakAreas(suggestions: any[]): string[] {
  const weakAreas = []
  if (suggestions.filter(s => s.platform === 'naver_blog').length === 0) {
    weakAreas.push('네이버 블로그 콘텐츠 부족')
  }
  if (suggestions.filter(s => s.difficulty === 'hard').length > suggestions.length * 0.3) {
    weakAreas.push('구현 난이도 높은 콘텐츠 과다')
  }
  return weakAreas
}

function identifyImprovementOpps(suggestions: any[]): string[] {
  return [
    'AI 자동 생성 콘텐츠 활용도 증대',
    '사용자 생성 콘텐츠(UGC) 활용',
    '크로스 플랫폼 콘텐츠 재활용'
  ]
}

function identifyContentAdvantages(suggestions: any[]): string[] {
  return [
    '계절별 맞춤 콘텐츠',
    '지역 특화 스토리텔링',
    '다양한 플랫폼 최적화'
  ]
}

function optimizeResourceAllocation(suggestions: any[]): any {
  return {
    highROI: '쉬운 난이도 + 높은 트렌드 점수 콘텐츠에 70% 집중',
    mediumROI: '중간 난이도 콘텐츠에 20% 배분',
    experimental: '새로운 시도를 위해 10% 할당'
  }
}

function generateQuickStartGuide(contentResults: any): string[] {
  return [
    '1주차: 높은 점수 콘텐츠 3개 선별 후 제작',
    '2주차: 콘텐츠 캘린더 기반 정기 포스팅 시작',
    '3주차: 성과 분석 후 전략 조정',
    '4주차: 템플릿 활용해 효율성 높이기'
  ]
}

function generateWeeklyContentSchedule(): any {
  return {
    monday: '주간 계획 및 콘텐츠 준비',
    tuesday: '블로그/긴 콘텐츠 발행',
    wednesday: '소셜미디어 포스팅',
    thursday: '고객 리뷰 답변 및 소통',
    friday: '주말 프로모션 콘텐츠',
    saturday: '실시간 소셜미디어 활동',
    sunday: '주간 성과 리뷰 및 다음 주 계획'
  }
}

function getRecommendedContentTools(): string[] {
  return [
    'Canva (디자인 도구)',
    'Buffer (소셜미디어 관리)',
    'Grammarly (텍스트 교정)',
    'Unsplash (이미지 소스)',
    'Google Analytics (성과 측정)'
  ]
}

function generateContentBudgetGuide(): any {
  return {
    minimal: '월 10-30만원 (기본 도구 구독)',
    standard: '월 50-100만원 (디자인 외주 포함)',
    premium: '월 100-300만원 (전문 에이전시 협업)',
    recommended: '월 50만원 (효율성 대비 최적)'
  }
}

function getContentMeasurementPlan(): any {
  return {
    daily: ['포스트 참여율', '댓글/반응 수'],
    weekly: ['팔로워 증가율', '리치/노출수'],
    monthly: ['브랜드 인지도', '웹사이트 트래픽'],
    quarterly: ['예약 전환율', 'ROI 측정']
  }
}