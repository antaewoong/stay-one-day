import { NextRequest, NextResponse } from 'next/server'
import { withHostAuth } from '@/middleware/withHostAuth'
import { getAdWasteAnalyzer } from '@/lib/ad-waste-analyzer'
import { tryIncrementQuota } from '@/utils/quota-manager'

export const GET = withHostAuth(async (req, db, { userId, host }) => {
  try {
    const { searchParams } = req.nextUrl
    const accommodationId = searchParams.get('accommodationId')

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

    // 광고 낭비 분석 실행
    const analyzer = getAdWasteAnalyzer()
    const analysisResult = await analyzer.analyzeAdWaste(
      accommodationId,
      accommodation.city,
      accommodation.region,
      accommodation.accommodation_type || '펜션'
    )

    // 실행 우선순위 매트릭스 생성
    const actionMatrix = generateActionMatrix(analysisResult.wasteAnalysis, analysisResult.optimizationSuggestions)

    // ROI 계산 및 예측
    const roiProjections = calculateROIProjections(analysisResult)

    // 종합 스코어 계산
    const healthScore = calculateAdHealthScore(analysisResult)

    return NextResponse.json({
      success: true,
      accommodationName: accommodation.name,
      location: `${accommodation.city}, ${accommodation.region}`,

      // 핵심 지표 요약
      summary: {
        totalWasteAmount: analysisResult.wasteAnalysis.reduce((sum, w) => sum + w.wastedAmount, 0),
        potentialSavings: analysisResult.wasteAnalysis.reduce((sum, w) => sum + w.potentialSavings, 0),
        criticalIssues: analysisResult.wasteAnalysis.filter(w => w.severity === 'critical').length,
        healthScore: healthScore,
        recommendedActions: analysisResult.wasteAnalysis.filter(w => w.implementationPriority === 'immediate').length
      },

      // 낭비 요소 분석
      wasteAnalysis: analysisResult.wasteAnalysis.map((waste, index) => ({
        ...waste,
        id: `waste_${index}`,
        impactLevel: calculateImpactLevel(waste),
        timeToFix: estimateTimeToFix(waste),
        resourcesNeeded: getResourcesNeeded(waste)
      })),

      // 최적화 제안
      optimizationSuggestions: analysisResult.optimizationSuggestions.map((suggestion, index) => ({
        ...suggestion,
        id: `optimization_${index}`,
        priorityScore: calculatePriorityScore(suggestion),
        quickWins: isQuickWin(suggestion),
        dependencies: getDependencies(suggestion)
      })),

      // 경쟁사 인사이트
      competitorInsights: analysisResult.competitorInsights,

      // 예산 재배분 계획
      budgetOptimization: {
        ...analysisResult.budgetReallocation,
        implementationSteps: generateImplementationSteps(analysisResult.budgetReallocation),
        riskAssessment: assessReallocationRisks(analysisResult.budgetReallocation)
      },

      // 실행 매트릭스
      actionMatrix,

      // ROI 예측
      roiProjections,

      // 성과 지표
      performanceMetrics: {
        ...analysisResult.performanceMetrics,
        monthlyProjections: generateMonthlyProjections(analysisResult.performanceMetrics),
        benchmarkComparison: generateBenchmarkComparison(analysisResult.performanceMetrics)
      },

      // 모니터링 대시보드 제안
      monitoringSetup: {
        keyMetrics: [
          'CPA (고객 획득 비용)',
          'ROAS (광고비 대비 매출)',
          'CTR (클릭률)',
          '전환율',
          '품질 점수'
        ],
        alertThresholds: {
          cpa_increase: '+20%',
          roas_decrease: '-15%',
          ctr_drop: '-25%',
          conversion_drop: '-30%'
        },
        reportingFrequency: '주간 리포트 권장'
      },

      // 다음 단계 액션
      nextSteps: generateNextSteps(analysisResult),

      dataSource: 'ad_performance_analysis',
      quota_status: {
        used: quotaResult.total_runs,
        remaining: 2 - quotaResult.total_runs,
        reset_date: quotaResult.next_available
      },
      updateTime: new Date().toISOString()
    })

  } catch (error) {
    console.error('광고 낭비 분석 API 오류:', error)

    return NextResponse.json({
      error: '광고 낭비 분석 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
})

// 실행 우선순위 매트릭스 생성
function generateActionMatrix(wasteAnalysis: any[], optimizations: any[]) {
  return {
    quickWins: {
      title: '즉시 실행 (높은 영향, 쉬운 구현)',
      items: optimizations
        .filter(opt => opt.difficulty === 'easy' && opt.roi_expectation.includes('200'))
        .map(opt => ({
          action: opt.title,
          effort: opt.implementationTime,
          impact: opt.expectedImprovement
        }))
    },
    majorProjects: {
      title: '주요 프로젝트 (높은 영향, 어려운 구현)',
      items: optimizations
        .filter(opt => opt.difficulty === 'hard' && opt.roi_expectation.includes('400'))
        .map(opt => ({
          action: opt.title,
          effort: opt.implementationTime,
          impact: opt.expectedImprovement
        }))
    },
    fillIns: {
      title: '틈새 개선 (낮은 영향, 쉬운 구현)',
      items: optimizations
        .filter(opt => opt.difficulty === 'easy' && !opt.roi_expectation.includes('300'))
        .map(opt => ({
          action: opt.title,
          effort: opt.implementationTime,
          impact: opt.expectedImprovement
        }))
    },
    questionable: {
      title: '검토 필요 (낮은 영향, 어려운 구현)',
      items: optimizations
        .filter(opt => opt.difficulty === 'hard' && !opt.roi_expectation.includes('300'))
        .map(opt => ({
          action: opt.title,
          effort: opt.implementationTime,
          impact: opt.expectedImprovement
        }))
    }
  }
}

// ROI 예측 계산
function calculateROIProjections(analysisResult: any) {
  const currentSpend = analysisResult.performanceMetrics.currentPerformance.totalSpent
  const projectedSavings = analysisResult.performanceMetrics.afterOptimization.projectedSavings

  return {
    month1: {
      investment: projectedSavings * 0.3,
      expectedReturn: projectedSavings * 0.8,
      netBenefit: projectedSavings * 0.5
    },
    month3: {
      investment: projectedSavings * 0.6,
      expectedReturn: projectedSavings * 2.0,
      netBenefit: projectedSavings * 1.4
    },
    month6: {
      investment: projectedSavings * 1.0,
      expectedReturn: projectedSavings * 3.5,
      netBenefit: projectedSavings * 2.5
    },
    breakEvenPoint: '1.5개월 예상',
    totalROI: '350% (6개월 기준)'
  }
}

// 광고 건강도 점수 계산
function calculateAdHealthScore(analysisResult: any): number {
  const criticalIssues = analysisResult.wasteAnalysis.filter((w: any) => w.severity === 'critical').length
  const highIssues = analysisResult.wasteAnalysis.filter((w: any) => w.severity === 'high').length

  let score = 100
  score -= criticalIssues * 25
  score -= highIssues * 15
  score -= analysisResult.wasteAnalysis.length * 5

  return Math.max(0, Math.min(100, score))
}

// 다음 단계 액션 생성
function generateNextSteps(analysisResult: any) {
  const immediateActions = analysisResult.wasteAnalysis
    .filter((w: any) => w.implementationPriority === 'immediate')
    .slice(0, 3)

  return {
    thisWeek: immediateActions.map((action: any) => ({
      task: action.recommendation,
      priority: 'Critical',
      expectedOutcome: `${action.potentialSavings.toLocaleString()}원 절약`
    })),
    thisMonth: [
      {
        task: '광고 소재 A/B 테스트 실시',
        priority: 'High',
        expectedOutcome: 'CTR 30% 개선'
      },
      {
        task: '랜딩페이지 전환율 최적화',
        priority: 'High',
        expectedOutcome: '전환율 25% 개선'
      }
    ],
    ongoing: [
      {
        task: '주간 성과 모니터링 및 조정',
        priority: 'Medium',
        expectedOutcome: '지속적인 효율 개선'
      },
      {
        task: '경쟁사 전략 분석 및 대응',
        priority: 'Medium',
        expectedOutcome: '시장 점유율 확대'
      }
    ]
  }
}

// 유틸리티 함수들
function calculateImpactLevel(waste: any): 'high' | 'medium' | 'low' {
  return waste.wastedAmount > 500000 ? 'high' :
         waste.wastedAmount > 200000 ? 'medium' : 'low'
}

function estimateTimeToFix(waste: any): string {
  switch (waste.wasteType) {
    case 'low_ctr': return '3-5일'
    case 'high_cpc': return '1-2주'
    case 'low_conversion': return '2-3주'
    case 'wrong_audience': return '1주'
    default: return '1-2주'
  }
}

function getResourcesNeeded(waste: any): string[] {
  switch (waste.wasteType) {
    case 'low_ctr': return ['디자이너', '카피라이터']
    case 'high_cpc': return ['마케터', '키워드 전문가']
    case 'low_conversion': return ['웹 개발자', 'UX 전문가']
    case 'wrong_audience': return ['데이터 분석가', '마케터']
    default: return ['마케터']
  }
}

function calculatePriorityScore(suggestion: any): number {
  const difficultyScore = { easy: 3, medium: 2, hard: 1 }[suggestion.difficulty]
  const roiScore = parseInt(suggestion.roi_expectation.match(/\d+/)?.[0] || '100') / 100

  return difficultyScore * roiScore
}

function isQuickWin(suggestion: any): boolean {
  return suggestion.difficulty === 'easy' &&
         suggestion.implementationTime.includes('일') &&
         parseInt(suggestion.roi_expectation.match(/\d+/)?.[0] || '0') > 200
}

function getDependencies(suggestion: any): string[] {
  switch (suggestion.category) {
    case 'creative': return ['브랜드 가이드라인', '이미지 소스']
    case 'audience': return ['고객 데이터', '분석 도구']
    case 'bidding': return ['성과 데이터', 'AI 도구 설정']
    default: return []
  }
}

function generateImplementationSteps(budgetPlan: any): string[] {
  return [
    '현재 캠페인 성과 백업 및 분석',
    '고성과 채널 예산 20% 우선 증액',
    '저성과 채널 예산 단계적 감액',
    '2주간 성과 모니터링',
    '결과 기반 최종 예산 재배분'
  ]
}

function assessReallocationRisks(budgetPlan: any): any {
  return {
    low: ['네이버 광고 확대'],
    medium: ['구글 광고 최적화'],
    high: ['페이스북 예산 대폭 감액']
  }
}

function generateMonthlyProjections(metrics: any): any {
  return {
    month1: { savings: '15-20%', efficiency: '+25%' },
    month2: { savings: '25-30%', efficiency: '+40%' },
    month3: { savings: '35-45%', efficiency: '+60%' }
  }
}

function generateBenchmarkComparison(metrics: any): any {
  return {
    current: '하위 30%',
    afterOptimization: '상위 20%',
    industryLeaders: '목표: 상위 10%'
  }
}