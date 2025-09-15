// 네이버 플레이스 건강도 체크 시스템

interface NaverPlaceData {
  placeId: string
  name: string
  category: string
  rating: number
  reviewCount: number
  photos: number
  businessHours: string
  phoneNumber: string
  address: string
  amenities: string[]
  lastUpdated: string
}

interface HealthCheckResult {
  category: 'critical' | 'warning' | 'good'
  title: string
  description: string
  currentValue: string | number
  recommendedValue: string | number
  impact: 'high' | 'medium' | 'low'
  actionRequired: string
  timeToFix: string
  difficulty: 'easy' | 'medium' | 'hard'
}

interface CompetitorComparison {
  metric: string
  myValue: number | string
  competitorAverage: number | string
  percentile: number
  status: 'above' | 'below' | 'average'
}

interface OptimizationSuggestion {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  expectedImprovement: string
  implementationSteps: string[]
  estimatedTimeframe: string
  costEstimate: string
}

class NaverPlaceHealthChecker {
  // 메인 건강도 체크 함수
  async checkPlaceHealth(
    placeName: string,
    city: string,
    region: string,
    accommodationType: string
  ): Promise<{
    overallHealth: {
      score: number
      grade: 'A' | 'B' | 'C' | 'D' | 'F'
      status: string
    }
    healthChecks: HealthCheckResult[]
    competitorComparison: CompetitorComparison[]
    optimizationSuggestions: OptimizationSuggestion[]
    keyMetrics: any
    actionPlan: any
  }> {
    try {
      // 1. 네이버 플레이스 정보 조회 (Mock 구현)
      const placeData = await this.getNaverPlaceData(placeName, city, region)

      // 2. 경쟁사 데이터 수집
      const competitorData = await this.getCompetitorPlaceData(city, region, accommodationType)

      // 3. 건강도 체크 실행
      const healthChecks = this.performHealthChecks(placeData)

      // 4. 경쟁사 비교
      const competitorComparison = this.compareWithCompetitors(placeData, competitorData)

      // 5. 최적화 제안 생성
      const optimizationSuggestions = this.generateOptimizationSuggestions(healthChecks, competitorComparison)

      // 6. 전체 건강도 점수 계산
      const overallHealth = this.calculateOverallHealth(healthChecks, competitorComparison)

      // 7. 핵심 지표 요약
      const keyMetrics = this.extractKeyMetrics(placeData, competitorData)

      // 8. 실행 계획 수립
      const actionPlan = this.createActionPlan(healthChecks, optimizationSuggestions)

      return {
        overallHealth,
        healthChecks,
        competitorComparison,
        optimizationSuggestions,
        keyMetrics,
        actionPlan
      }

    } catch (error) {
      console.warn('네이버 플레이스 API 오류, Mock 데이터 사용:', error)
      return this.getMockHealthCheckResult(placeName, city, region, accommodationType)
    }
  }

  // 네이버 플레이스 데이터 조회 (Mock 구현)
  private async getNaverPlaceData(placeName: string, city: string, region: string): Promise<NaverPlaceData> {
    // 실제로는 네이버 플레이스 API 또는 크롤링 사용
    return {
      placeId: 'place_' + Math.random().toString(36).substr(2, 9),
      name: placeName,
      category: '숙박업소',
      rating: 3.8 + Math.random() * 1.2, // 3.8~5.0
      reviewCount: Math.floor(Math.random() * 200) + 50, // 50~250
      photos: Math.floor(Math.random() * 30) + 10, // 10~40
      businessHours: '24시간 운영',
      phoneNumber: '010-1234-5678',
      address: `${region} ${city}`,
      amenities: ['주차장', '와이파이', '바베큐', '온천'].slice(0, Math.floor(Math.random() * 4) + 1),
      lastUpdated: '2024-08-15'
    }
  }

  // 경쟁사 플레이스 데이터 수집
  private async getCompetitorPlaceData(city: string, region: string, type: string): Promise<NaverPlaceData[]> {
    return Array.from({ length: 5 }, (_, i) => ({
      placeId: `comp_place_${i}`,
      name: `${city} 경쟁숙소${i + 1}`,
      category: '숙박업소',
      rating: 3.9 + Math.random() * 1.1,
      reviewCount: Math.floor(Math.random() * 300) + 80,
      photos: Math.floor(Math.random() * 50) + 15,
      businessHours: '24시간 운영',
      phoneNumber: `010-${1000 + i}-5678`,
      address: `${region} ${city}`,
      amenities: ['주차장', '와이파이', '바베큐', '온천', '수영장', '카페'].slice(0, Math.floor(Math.random() * 6) + 2),
      lastUpdated: '2024-09-01'
    }))
  }

  // 건강도 체크 수행
  private performHealthChecks(placeData: NaverPlaceData): HealthCheckResult[] {
    const checks: HealthCheckResult[] = []

    // 1. 평점 체크
    if (placeData.rating < 4.0) {
      checks.push({
        category: 'critical',
        title: '낮은 평점',
        description: '네이버 플레이스 평점이 4.0 미만입니다',
        currentValue: placeData.rating.toFixed(1),
        recommendedValue: '4.0 이상',
        impact: 'high',
        actionRequired: '고객 만족도 개선 및 서비스 품질 향상',
        timeToFix: '2-3개월',
        difficulty: 'hard'
      })
    } else if (placeData.rating < 4.3) {
      checks.push({
        category: 'warning',
        title: '개선 가능한 평점',
        description: '평점이 양호하지만 더 높일 여지가 있습니다',
        currentValue: placeData.rating.toFixed(1),
        recommendedValue: '4.5 이상',
        impact: 'medium',
        actionRequired: '세부 서비스 개선',
        timeToFix: '1-2개월',
        difficulty: 'medium'
      })
    }

    // 2. 리뷰 수 체크
    if (placeData.reviewCount < 100) {
      checks.push({
        category: 'warning',
        title: '부족한 리뷰 수',
        description: '리뷰 수가 100개 미만으로 신뢰성이 부족할 수 있습니다',
        currentValue: placeData.reviewCount,
        recommendedValue: '100개 이상',
        impact: 'medium',
        actionRequired: '적극적인 리뷰 요청 및 고객 관리',
        timeToFix: '2-4개월',
        difficulty: 'medium'
      })
    }

    // 3. 사진 수 체크
    if (placeData.photos < 20) {
      checks.push({
        category: 'warning',
        title: '부족한 사진 수',
        description: '사진이 20장 미만으로 시각적 어필이 부족합니다',
        currentValue: placeData.photos,
        recommendedValue: '30장 이상',
        impact: 'medium',
        actionRequired: '고품질 사진 촬영 및 업로드',
        timeToFix: '1-2주',
        difficulty: 'easy'
      })
    }

    // 4. 정보 완성도 체크
    const missingInfo = []
    if (!placeData.phoneNumber || placeData.phoneNumber === '정보 없음') missingInfo.push('전화번호')
    if (!placeData.businessHours) missingInfo.push('영업시간')
    if (placeData.amenities.length < 3) missingInfo.push('편의시설')

    if (missingInfo.length > 0) {
      checks.push({
        category: 'critical',
        title: '불완전한 비즈니스 정보',
        description: `${missingInfo.join(', ')} 정보가 누락되었습니다`,
        currentValue: `${missingInfo.length}개 항목 누락`,
        recommendedValue: '모든 정보 완성',
        impact: 'high',
        actionRequired: '네이버 플레이스 정보 완성',
        timeToFix: '1주일',
        difficulty: 'easy'
      })
    }

    // 5. 업데이트 주기 체크
    const lastUpdate = new Date(placeData.lastUpdated)
    const daysSinceUpdate = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceUpdate > 90) {
      checks.push({
        category: 'warning',
        title: '오래된 정보',
        description: '3개월 이상 정보가 업데이트되지 않았습니다',
        currentValue: `${daysSinceUpdate}일 전`,
        recommendedValue: '월 1회 이상',
        impact: 'medium',
        actionRequired: '정기적인 정보 업데이트',
        timeToFix: '즉시',
        difficulty: 'easy'
      })
    }

    // 긍정적인 체크도 추가
    if (checks.length === 0 || checks.every(c => c.category !== 'critical')) {
      checks.push({
        category: 'good',
        title: '우수한 플레이스 관리',
        description: '네이버 플레이스가 잘 관리되고 있습니다',
        currentValue: '양호',
        recommendedValue: '현재 수준 유지',
        impact: 'low',
        actionRequired: '현재 관리 수준 유지',
        timeToFix: '지속적',
        difficulty: 'easy'
      })
    }

    return checks
  }

  // 경쟁사 비교
  private compareWithCompetitors(placeData: NaverPlaceData, competitors: NaverPlaceData[]): CompetitorComparison[] {
    const avgRating = competitors.reduce((sum, c) => sum + c.rating, 0) / competitors.length
    const avgReviews = competitors.reduce((sum, c) => sum + c.reviewCount, 0) / competitors.length
    const avgPhotos = competitors.reduce((sum, c) => sum + c.photos, 0) / competitors.length

    return [
      {
        metric: '평점',
        myValue: placeData.rating.toFixed(1),
        competitorAverage: avgRating.toFixed(1),
        percentile: this.calculatePercentile(placeData.rating, competitors.map(c => c.rating)),
        status: placeData.rating >= avgRating ? 'above' : 'below'
      },
      {
        metric: '리뷰 수',
        myValue: placeData.reviewCount,
        competitorAverage: Math.round(avgReviews),
        percentile: this.calculatePercentile(placeData.reviewCount, competitors.map(c => c.reviewCount)),
        status: placeData.reviewCount >= avgReviews ? 'above' : 'below'
      },
      {
        metric: '사진 수',
        myValue: placeData.photos,
        competitorAverage: Math.round(avgPhotos),
        percentile: this.calculatePercentile(placeData.photos, competitors.map(c => c.photos)),
        status: placeData.photos >= avgPhotos ? 'above' : 'below'
      },
      {
        metric: '편의시설 수',
        myValue: placeData.amenities.length,
        competitorAverage: Math.round(competitors.reduce((sum, c) => sum + c.amenities.length, 0) / competitors.length),
        percentile: this.calculatePercentile(placeData.amenities.length, competitors.map(c => c.amenities.length)),
        status: placeData.amenities.length >= (competitors.reduce((sum, c) => sum + c.amenities.length, 0) / competitors.length) ? 'above' : 'below'
      }
    ]
  }

  // 최적화 제안 생성
  private generateOptimizationSuggestions(
    healthChecks: HealthCheckResult[],
    comparison: CompetitorComparison[]
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []

    // 건강도 체크 기반 제안
    const criticalIssues = healthChecks.filter(check => check.category === 'critical')
    const warningIssues = healthChecks.filter(check => check.category === 'warning')

    criticalIssues.forEach(issue => {
      suggestions.push({
        title: `긴급 개선: ${issue.title}`,
        description: issue.description,
        priority: 'high',
        expectedImprovement: this.getExpectedImprovement(issue),
        implementationSteps: this.getImplementationSteps(issue),
        estimatedTimeframe: issue.timeToFix,
        costEstimate: this.getCostEstimate(issue)
      })
    })

    // 경쟁사 비교 기반 제안
    const belowAverage = comparison.filter(comp => comp.status === 'below')
    belowAverage.forEach(metric => {
      suggestions.push({
        title: `${metric.metric} 경쟁력 강화`,
        description: `현재 경쟁사 평균 대비 ${metric.percentile}%ile로 개선이 필요합니다`,
        priority: metric.percentile < 25 ? 'high' : 'medium',
        expectedImprovement: `${metric.metric} ${this.getMetricImprovement(metric.metric)} 개선`,
        implementationSteps: this.getMetricImprovementSteps(metric.metric),
        estimatedTimeframe: this.getMetricTimeframe(metric.metric),
        costEstimate: this.getMetricCost(metric.metric)
      })
    })

    // 추가 성장 기회 제안
    suggestions.push({
      title: '고객 리뷰 관리 시스템 구축',
      description: '체계적인 리뷰 관리로 평점과 리뷰 수 동시 개선',
      priority: 'medium',
      expectedImprovement: '평점 +0.3, 리뷰 수 +50%',
      implementationSteps: [
        '자동 리뷰 요청 시스템 구축',
        '부정 리뷰 사전 대응 프로세스',
        '리뷰 답글 템플릿 작성',
        '정기적 리뷰 모니터링'
      ],
      estimatedTimeframe: '1-2개월',
      costEstimate: '50-100만원'
    })

    return suggestions.slice(0, 6) // 상위 6개만 반환
  }

  // 전체 건강도 점수 계산
  private calculateOverallHealth(
    healthChecks: HealthCheckResult[],
    comparison: CompetitorComparison[]
  ): { score: number; grade: 'A' | 'B' | 'C' | 'D' | 'F'; status: string } {
    let score = 100

    // 건강도 체크 점수 차감
    const criticalCount = healthChecks.filter(c => c.category === 'critical').length
    const warningCount = healthChecks.filter(c => c.category === 'warning').length

    score -= criticalCount * 25
    score -= warningCount * 15

    // 경쟁사 비교 점수 조정
    const aboveAverage = comparison.filter(c => c.status === 'above').length
    const belowAverage = comparison.filter(c => c.status === 'below').length

    score += aboveAverage * 5
    score -= belowAverage * 10

    score = Math.max(0, Math.min(100, score))

    const grade: 'A' | 'B' | 'C' | 'D' | 'F' =
      score >= 90 ? 'A' :
      score >= 80 ? 'B' :
      score >= 70 ? 'C' :
      score >= 60 ? 'D' : 'F'

    const status =
      score >= 85 ? '매우 우수' :
      score >= 70 ? '양호' :
      score >= 55 ? '개선 필요' : '긴급 개선 필요'

    return { score, grade, status }
  }

  // 핵심 지표 추출
  private extractKeyMetrics(placeData: NaverPlaceData, competitors: NaverPlaceData[]): any {
    const avgRating = competitors.reduce((sum, c) => sum + c.rating, 0) / competitors.length
    const avgReviews = competitors.reduce((sum, c) => sum + c.reviewCount, 0) / competitors.length

    return {
      currentRating: placeData.rating.toFixed(1),
      ratingVsCompetitor: placeData.rating >= avgRating ? 'Above' : 'Below',
      totalReviews: placeData.reviewCount,
      reviewGrowthNeeded: Math.max(0, Math.ceil(avgReviews * 1.2) - placeData.reviewCount),
      photosCount: placeData.photos,
      missingAmenities: Math.max(0, 5 - placeData.amenities.length),
      lastUpdate: placeData.lastUpdated,
      urgentActions: this.countUrgentActions(placeData)
    }
  }

  // 실행 계획 수립
  private createActionPlan(
    healthChecks: HealthCheckResult[],
    suggestions: OptimizationSuggestion[]
  ): any {
    const criticalActions = healthChecks.filter(c => c.category === 'critical')
    const quickWins = suggestions.filter(s => s.priority === 'high' && s.estimatedTimeframe.includes('주'))

    return {
      immediate: criticalActions.slice(0, 3).map(action => ({
        task: action.actionRequired,
        deadline: '1주일 내',
        priority: 'Critical',
        expectedResult: `${action.title} 해결`
      })),

      thisMonth: quickWins.slice(0, 2).map(suggestion => ({
        task: suggestion.title,
        deadline: suggestion.estimatedTimeframe,
        priority: 'High',
        expectedResult: suggestion.expectedImprovement
      })),

      ongoing: [
        {
          task: '정기적 네이버 플레이스 정보 업데이트',
          deadline: '월 1회',
          priority: 'Medium',
          expectedResult: '정보 신선도 유지'
        },
        {
          task: '고객 리뷰 모니터링 및 답변',
          deadline: '주 2회',
          priority: 'Medium',
          expectedResult: '고객 만족도 개선'
        }
      ]
    }
  }

  // 유틸리티 함수들
  private calculatePercentile(value: number, array: number[]): number {
    const sorted = [...array].sort((a, b) => a - b)
    const index = sorted.findIndex(v => v >= value)
    return Math.round((index / sorted.length) * 100)
  }

  private getExpectedImprovement(issue: HealthCheckResult): string {
    switch (issue.title) {
      case '낮은 평점': return '평점 0.5 이상 상승'
      case '부족한 리뷰 수': return '월간 리뷰 증가율 +30%'
      case '부족한 사진 수': return '시각적 어필 +40%'
      case '불완전한 비즈니스 정보': return '검색 노출 +25%'
      default: return '전반적 개선'
    }
  }

  private getImplementationSteps(issue: HealthCheckResult): string[] {
    const steps: { [key: string]: string[] } = {
      '낮은 평점': [
        '현재 서비스 문제점 분석',
        '고객 피드백 수집',
        '서비스 품질 개선',
        '만족한 고객의 리뷰 요청'
      ],
      '부족한 리뷰 수': [
        '체크아웃 시 리뷰 요청',
        '리뷰 작성 인센티브 제공',
        '만족도 높은 고객 타겟팅',
        '정기적 리뷰 관리'
      ],
      '부족한 사진 수': [
        '전문 사진 촬영',
        '계절별 사진 업데이트',
        '고객 촬영 사진 활용',
        '정기적 사진 업로드'
      ]
    }

    return steps[issue.title] || ['문제 분석', '해결책 수립', '실행', '모니터링']
  }

  private getCostEstimate(issue: HealthCheckResult): string {
    switch (issue.difficulty) {
      case 'easy': return '10-50만원'
      case 'medium': return '50-200만원'
      case 'hard': return '200-500만원'
      default: return '100만원'
    }
  }

  private getMetricImprovement(metric: string): string {
    switch (metric) {
      case '평점': return '+0.3-0.5'
      case '리뷰 수': return '+30-50%'
      case '사진 수': return '+20-30장'
      case '편의시설 수': return '+2-3개'
      default: return '개선'
    }
  }

  private getMetricImprovementSteps(metric: string): string[] {
    const steps: { [key: string]: string[] } = {
      '평점': ['서비스 품질 개선', '고객 불만 사전 해결', '만족 고객 리뷰 유도'],
      '리뷰 수': ['리뷰 요청 시스템', '인센티브 프로그램', '고객 관리 강화'],
      '사진 수': ['전문 촬영', '다양한 각도 사진', '정기 업데이트'],
      '편의시설 수': ['고객 니즈 분석', '추가 편의시설 도입', '정보 업데이트']
    }

    return steps[metric] || ['분석', '계획', '실행']
  }

  private getMetricTimeframe(metric: string): string {
    switch (metric) {
      case '평점': return '2-4개월'
      case '리뷰 수': return '3-6개월'
      case '사진 수': return '1-2주'
      case '편의시설 수': return '1-3개월'
      default: return '1개월'
    }
  }

  private getMetricCost(metric: string): string {
    switch (metric) {
      case '평점': return '50-200만원'
      case '리뷰 수': return '30-100만원'
      case '사진 수': return '20-80만원'
      case '편의시설 수': return '100-500만원'
      default: return '50만원'
    }
  }

  private countUrgentActions(placeData: NaverPlaceData): number {
    let count = 0
    if (placeData.rating < 4.0) count++
    if (placeData.reviewCount < 50) count++
    if (placeData.photos < 15) count++
    if (placeData.amenities.length < 3) count++
    return count
  }

  // Mock 데이터
  private getMockHealthCheckResult(
    placeName: string,
    city: string,
    region: string,
    type: string
  ): any {
    return {
      overallHealth: {
        score: 75,
        grade: 'B' as const,
        status: '양호'
      },
      healthChecks: [
        {
          category: 'warning' as const,
          title: '개선 가능한 평점',
          description: '평점이 양호하지만 더 높일 여지가 있습니다',
          currentValue: '4.1',
          recommendedValue: '4.5 이상',
          impact: 'medium' as const,
          actionRequired: '세부 서비스 개선',
          timeToFix: '1-2개월',
          difficulty: 'medium' as const
        }
      ],
      competitorComparison: [
        {
          metric: '평점',
          myValue: '4.1',
          competitorAverage: '4.3',
          percentile: 40,
          status: 'below' as const
        }
      ],
      optimizationSuggestions: [
        {
          title: '고객 리뷰 관리 시스템 구축',
          description: '체계적인 리뷰 관리로 평점과 리뷰 수 동시 개선',
          priority: 'high' as const,
          expectedImprovement: '평점 +0.3, 리뷰 수 +50%',
          implementationSteps: ['자동 리뷰 요청', '답글 관리', '품질 개선'],
          estimatedTimeframe: '1-2개월',
          costEstimate: '50-100만원'
        }
      ],
      keyMetrics: {
        currentRating: '4.1',
        totalReviews: 89,
        photosCount: 18,
        urgentActions: 1
      },
      actionPlan: {
        immediate: [
          { task: '리뷰 관리 시스템 구축', priority: 'High' }
        ],
        ongoing: [
          { task: '정기적 정보 업데이트', priority: 'Medium' }
        ]
      }
    }
  }
}

// 싱글톤 인스턴스
let naverPlaceHealthChecker: NaverPlaceHealthChecker | null = null

export function getNaverPlaceHealthChecker(): NaverPlaceHealthChecker {
  if (!naverPlaceHealthChecker) {
    naverPlaceHealthChecker = new NaverPlaceHealthChecker()
  }
  return naverPlaceHealthChecker
}

export type {
  HealthCheckResult,
  CompetitorComparison,
  OptimizationSuggestion,
  NaverPlaceData
}