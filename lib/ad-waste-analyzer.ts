// 광고비 낭비 방지 분석 시스템

interface AdPerformanceData {
  channel: 'google' | 'naver' | 'facebook' | 'instagram' | 'kakao'
  campaignName: string
  impressions: number
  clicks: number
  conversions: number
  cost: number
  ctr: number
  conversionRate: number
  cpc: number
  roas: number
}

interface WasteAnalysis {
  wasteType: 'low_ctr' | 'high_cpc' | 'low_conversion' | 'wrong_audience' | 'poor_timing' | 'duplicate_keywords'
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  wastedAmount: number
  potentialSavings: number
  recommendation: string
  implementationPriority: 'immediate' | 'this_week' | 'this_month'
}

interface OptimizationSuggestion {
  category: 'keyword' | 'audience' | 'creative' | 'bidding' | 'timing' | 'budget_allocation'
  title: string
  description: string
  expectedImprovement: string
  implementationTime: string
  difficulty: 'easy' | 'medium' | 'hard'
  costToImplement: string
  roi_expectation: string
}

interface CompetitorAdInsight {
  competitor: string
  estimatedBudget: string
  topKeywords: string[]
  adStrategies: string[]
  weaknesses: string[]
  opportunities: string[]
}

class AdWasteAnalyzer {
  // 메인 분석 함수
  async analyzeAdWaste(
    accommodationId: string,
    city: string,
    region: string,
    accommodationType: string
  ): Promise<{
    wasteAnalysis: WasteAnalysis[]
    optimizationSuggestions: OptimizationSuggestion[]
    competitorInsights: CompetitorAdInsight[]
    budgetReallocation: any
    performanceMetrics: any
  }> {
    try {
      // 실제로는 Google Ads API, 네이버 광고 API 등을 연동
      // 현재는 Mock 데이터로 구현
      const mockAdData = this.generateMockAdData(city, accommodationType)

      // 1. 낭비 요소 분석
      const wasteAnalysis = this.analyzeWasteFactors(mockAdData)

      // 2. 최적화 제안
      const optimizationSuggestions = this.generateOptimizationSuggestions(mockAdData, city, accommodationType)

      // 3. 경쟁사 분석
      const competitorInsights = this.analyzeCompetitorAds(city, region, accommodationType)

      // 4. 예산 재배분 제안
      const budgetReallocation = this.suggestBudgetReallocation(mockAdData, wasteAnalysis)

      // 5. 성과 지표 분석
      const performanceMetrics = this.calculatePerformanceMetrics(mockAdData, wasteAnalysis)

      return {
        wasteAnalysis,
        optimizationSuggestions,
        competitorInsights,
        budgetReallocation,
        performanceMetrics
      }

    } catch (error) {
      console.error('광고 분석 오류:', error)
      throw error
    }
  }

  // 낭비 요소 분석
  private analyzeWasteFactors(adData: AdPerformanceData[]): WasteAnalysis[] {
    const analyses: WasteAnalysis[] = []

    adData.forEach(ad => {
      // 1. 낮은 CTR 분석
      if (ad.ctr < 1.0) {
        analyses.push({
          wasteType: 'low_ctr',
          severity: ad.ctr < 0.5 ? 'critical' : 'high',
          description: `${ad.campaignName}: CTR ${ad.ctr.toFixed(2)}%로 업계 평균(2.0%) 미달`,
          wastedAmount: Math.round(ad.cost * 0.3),
          potentialSavings: Math.round(ad.cost * 0.4),
          recommendation: '광고 소재 개선 및 타겟팅 정교화 필요',
          implementationPriority: ad.ctr < 0.5 ? 'immediate' : 'this_week'
        })
      }

      // 2. 높은 CPC 분석
      if (ad.cpc > 3000) {
        analyses.push({
          wasteType: 'high_cpc',
          severity: ad.cpc > 5000 ? 'critical' : 'medium',
          description: `${ad.campaignName}: CPC ${ad.cpc.toLocaleString()}원, 업계 평균 대비 과다`,
          wastedAmount: Math.round((ad.cpc - 2000) * ad.clicks),
          potentialSavings: Math.round(ad.cost * 0.25),
          recommendation: '키워드 경쟁도 분석 및 롱테일 키워드 활용',
          implementationPriority: 'this_week'
        })
      }

      // 3. 낮은 전환율 분석
      if (ad.conversionRate < 2.0) {
        analyses.push({
          wasteType: 'low_conversion',
          severity: ad.conversionRate < 1.0 ? 'critical' : 'high',
          description: `${ad.campaignName}: 전환율 ${ad.conversionRate.toFixed(1)}%로 낮음`,
          wastedAmount: Math.round(ad.cost * (1 - ad.conversionRate / 5.0)),
          potentialSavings: Math.round(ad.cost * 0.35),
          recommendation: '랜딩페이지 최적화 및 예약 프로세스 개선',
          implementationPriority: 'immediate'
        })
      }

      // 4. 낮은 ROAS 분석
      if (ad.roas < 300) {
        analyses.push({
          wasteType: 'wrong_audience',
          severity: ad.roas < 200 ? 'critical' : 'high',
          description: `${ad.campaignName}: ROAS ${ad.roas}%로 목표(400%) 미달`,
          wastedAmount: Math.round(ad.cost * 0.4),
          potentialSavings: Math.round(ad.cost * 0.5),
          recommendation: '타겟 오디언스 세분화 및 재타겟팅 강화',
          implementationPriority: 'immediate'
        })
      }
    })

    // 심각도 및 잠재적 절약액 기준 정렬
    return analyses.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity] || b.potentialSavings - a.potentialSavings
    })
  }

  // 최적화 제안 생성
  private generateOptimizationSuggestions(
    adData: AdPerformanceData[],
    city: string,
    accommodationType: string
  ): OptimizationSuggestion[] {
    return [
      {
        category: 'keyword',
        title: '키워드 포트폴리오 재구성',
        description: `"${city} ${accommodationType}" 중심의 롱테일 키워드 확대`,
        expectedImprovement: 'CPC 30% 절감, 전환율 25% 향상',
        implementationTime: '1주일',
        difficulty: 'medium',
        costToImplement: '추가 비용 없음',
        roi_expectation: '첫 달 200% ROI 개선'
      },
      {
        category: 'audience',
        title: '고전환 오디언스 집중 타겟팅',
        description: '기존 고객 데이터 기반 유사 오디언스 확대',
        expectedImprovement: '전환율 40% 향상',
        implementationTime: '3일',
        difficulty: 'easy',
        costToImplement: '월 50,000원 추가',
        roi_expectation: '300% ROI 개선'
      },
      {
        category: 'creative',
        title: '시즌별 광고 소재 자동화',
        description: '날씨/이벤트 연동 동적 소재 시스템',
        expectedImprovement: 'CTR 50% 향상',
        implementationTime: '2주일',
        difficulty: 'hard',
        costToImplement: '월 200,000원',
        roi_expectation: '400% ROI 개선'
      },
      {
        category: 'timing',
        title: '최적 노출 시간대 집중',
        description: '예약 전환이 높은 시간대(오후 7-10시) 집중 입찰',
        expectedImprovement: '광고비 20% 절감, 전환율 15% 향상',
        implementationTime: '1일',
        difficulty: 'easy',
        costToImplement: '없음',
        roi_expectation: '즉시 150% 개선'
      },
      {
        category: 'budget_allocation',
        title: '채널별 예산 재배분',
        description: '고성과 채널(네이버, 구글) 비중 확대',
        expectedImprovement: '전체 ROAS 35% 향상',
        implementationTime: '즉시',
        difficulty: 'easy',
        costToImplement: '없음',
        roi_expectation: '250% ROI 개선'
      },
      {
        category: 'bidding',
        title: 'AI 기반 스마트 입찰 전략',
        description: '전환 가치 기반 자동 입찰 최적화',
        expectedImprovement: 'CPA 25% 감소',
        implementationTime: '1주일',
        difficulty: 'medium',
        costToImplement: '월 100,000원',
        roi_expectation: '180% ROI 개선'
      }
    ]
  }

  // 경쟁사 광고 분석
  private analyzeCompetitorAds(city: string, region: string, type: string): CompetitorAdInsight[] {
    // 실제로는 SEMrush, SimilarWeb 등의 API 활용
    return [
      {
        competitor: `${city} A펜션`,
        estimatedBudget: '월 2-3백만원',
        topKeywords: [`${city} 펜션`, `${region} 숙박`, `${city} 여행`],
        adStrategies: [
          '브랜드 키워드 집중',
          '이미지 위주 소재',
          'SNS 광고 중심'
        ],
        weaknesses: [
          '모바일 최적화 부족',
          '예약 프로세스 복잡',
          '후기 관리 미흡'
        ],
        opportunities: [
          '롱테일 키워드 공백',
          '비수기 마케팅 부재',
          '개인화 부족'
        ]
      },
      {
        competitor: `${region} B리조트`,
        estimatedBudget: '월 5-7백만원',
        topKeywords: [`${region} 리조트`, `${city} 호텔`, '가족여행'],
        adStrategies: [
          '프리미엄 포지셔닝',
          '패키지 상품 위주',
          '구글 광고 중심'
        ],
        weaknesses: [
          '고가 정책의 접근성',
          '젊은층 어필 부족',
          '개별 여행객 소외'
        ],
        opportunities: [
          '커플/소규모 시장',
          'MZ세대 타겟팅',
          '가성비 어필'
        ]
      }
    ]
  }

  // 예산 재배분 제안
  private suggestBudgetReallocation(adData: AdPerformanceData[], wasteAnalysis: WasteAnalysis[]): any {
    const totalBudget = adData.reduce((sum, ad) => sum + ad.cost, 0)
    const totalWaste = wasteAnalysis.reduce((sum, waste) => sum + waste.wastedAmount, 0)

    return {
      currentAllocation: adData.map(ad => ({
        channel: ad.channel,
        currentBudget: ad.cost,
        currentShare: `${((ad.cost / totalBudget) * 100).toFixed(1)}%`,
        performance: ad.roas
      })),
      recommendedAllocation: [
        {
          channel: 'naver',
          currentBudget: adData.find(ad => ad.channel === 'naver')?.cost || 0,
          recommendedBudget: Math.round(totalBudget * 0.4),
          reason: '높은 전환율과 지역 특화 강점',
          expectedImprovement: '+35% ROAS'
        },
        {
          channel: 'google',
          currentBudget: adData.find(ad => ad.channel === 'google')?.cost || 0,
          recommendedBudget: Math.round(totalBudget * 0.3),
          reason: '브랜드 인지도와 검색 의도 정확성',
          expectedImprovement: '+25% 전환율'
        },
        {
          channel: 'instagram',
          currentBudget: adData.find(ad => ad.channel === 'instagram')?.cost || 0,
          recommendedBudget: Math.round(totalBudget * 0.2),
          reason: 'MZ세대 타겟팅과 시각적 어필',
          expectedImprovement: '+20% 참여율'
        },
        {
          channel: 'facebook',
          currentBudget: adData.find(ad => ad.channel === 'facebook')?.cost || 0,
          recommendedBudget: Math.round(totalBudget * 0.1),
          reason: '가족 여행객 타겟팅',
          expectedImprovement: '+15% 리치'
        }
      ],
      potentialSavings: totalWaste,
      reinvestmentPlan: {
        amount: Math.round(totalWaste * 0.7),
        allocation: '70%는 고성과 채널 확대, 30%는 새로운 기회 탐색'
      }
    }
  }

  // 성과 지표 계산
  private calculatePerformanceMetrics(adData: AdPerformanceData[], wasteAnalysis: WasteAnalysis[]): any {
    const totalCost = adData.reduce((sum, ad) => sum + ad.cost, 0)
    const totalConversions = adData.reduce((sum, ad) => sum + ad.conversions, 0)
    const totalWaste = wasteAnalysis.reduce((sum, waste) => sum + waste.wastedAmount, 0)

    return {
      currentPerformance: {
        totalSpent: totalCost,
        totalConversions,
        averageCPA: Math.round(totalCost / totalConversions),
        totalWasteAmount: totalWaste,
        wastePercentage: `${((totalWaste / totalCost) * 100).toFixed(1)}%`
      },
      afterOptimization: {
        projectedSavings: Math.round(wasteAnalysis.reduce((sum, w) => sum + w.potentialSavings, 0)),
        projectedCPA: Math.round((totalCost * 0.7) / (totalConversions * 1.3)),
        projectedROAS: '350-450%',
        efficiencyImprovement: '+40-60%'
      },
      benchmarks: {
        industryCPA: '150,000-250,000원',
        industryROAS: '300-400%',
        industryWasteRate: '25-35%',
        yourPosition: '개선 여지 많음'
      }
    }
  }

  // Mock 데이터 생성
  private generateMockAdData(city: string, type: string): AdPerformanceData[] {
    return [
      {
        channel: 'google',
        campaignName: `${city} ${type} 검색광고`,
        impressions: 50000,
        clicks: 350,
        conversions: 8,
        cost: 2100000,
        ctr: 0.7,
        conversionRate: 2.3,
        cpc: 6000,
        roas: 180
      },
      {
        channel: 'naver',
        campaignName: `${city} 지역 맞춤 광고`,
        impressions: 35000,
        clicks: 580,
        conversions: 15,
        cost: 1400000,
        ctr: 1.66,
        conversionRate: 2.6,
        cpc: 2414,
        roas: 380
      },
      {
        channel: 'facebook',
        campaignName: '가족여행 타겟 광고',
        impressions: 80000,
        clicks: 240,
        conversions: 3,
        cost: 800000,
        ctr: 0.3,
        conversionRate: 1.25,
        cpc: 3333,
        roas: 150
      },
      {
        channel: 'instagram',
        campaignName: '감성숙박 비주얼 광고',
        impressions: 120000,
        clicks: 960,
        conversions: 12,
        cost: 1200000,
        ctr: 0.8,
        conversionRate: 1.25,
        cpc: 1250,
        roas: 280
      }
    ]
  }
}

// 싱글톤 인스턴스
let adWasteAnalyzer: AdWasteAnalyzer | null = null

export function getAdWasteAnalyzer(): AdWasteAnalyzer {
  if (!adWasteAnalyzer) {
    adWasteAnalyzer = new AdWasteAnalyzer()
  }
  return adWasteAnalyzer
}

export type { WasteAnalysis, OptimizationSuggestion, CompetitorAdInsight, AdPerformanceData }