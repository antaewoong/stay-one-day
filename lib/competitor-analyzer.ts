// 경쟁사 분석 시스템

interface CompetitorData {
  id: string
  name: string
  type: 'direct' | 'indirect' // 직접/간접 경쟁자
  distance: number // km
  averagePrice: number
  rating: number
  reviewCount: number
  occupancyRate: number
  amenities: string[]
  marketShare: number
  strengths: string[]
  weaknesses: string[]
}

interface PriceAnalysis {
  competitor: string
  weekdayPrice: number
  weekendPrice: number
  peakSeasonMultiplier: number
  discountStrategy: string[]
  pricePosition: 'premium' | 'mid-range' | 'budget'
}

interface MarketAnalysis {
  marketSize: string
  growth: string
  seasonality: string
  customerSegments: Array<{
    segment: string
    size: string
    preferences: string[]
  }>
  trends: string[]
}

interface CompetitiveAdvantage {
  category: 'price' | 'location' | 'amenities' | 'service' | 'marketing'
  title: string
  description: string
  competitorComparison: string
  actionableInsight: string
  implementationDifficulty: 'easy' | 'medium' | 'hard'
  potentialImpact: 'low' | 'medium' | 'high'
}

class CompetitorAnalyzer {
  // 메인 경쟁사 분석 함수
  async analyzeCompetitors(
    accommodationId: string,
    city: string,
    region: string,
    accommodationType: string,
    latitude?: number,
    longitude?: number
  ): Promise<{
    competitors: CompetitorData[]
    priceAnalysis: PriceAnalysis[]
    marketAnalysis: MarketAnalysis
    competitiveAdvantages: CompetitiveAdvantage[]
    recommendations: any
    positioningMap: any
  }> {
    try {
      // 1. 경쟁사 식별 및 데이터 수집
      const competitors = await this.identifyCompetitors(city, region, accommodationType, latitude, longitude)

      // 2. 가격 분석
      const priceAnalysis = this.analyzePricing(competitors)

      // 3. 시장 분석
      const marketAnalysis = this.analyzeMarket(city, region, competitors)

      // 4. 경쟁 우위 분석
      const competitiveAdvantages = this.identifyCompetitiveAdvantages(competitors, city, accommodationType)

      // 5. 추천 사항 생성
      const recommendations = this.generateRecommendations(competitors, priceAnalysis, marketAnalysis)

      // 6. 포지셔닝 맵 생성
      const positioningMap = this.createPositioningMap(competitors)

      return {
        competitors,
        priceAnalysis,
        marketAnalysis,
        competitiveAdvantages,
        recommendations,
        positioningMap
      }

    } catch (error) {
      console.error('경쟁사 분석 오류:', error)
      throw error
    }
  }

  // 경쟁사 식별
  private async identifyCompetitors(
    city: string,
    region: string,
    type: string,
    lat?: number,
    lon?: number
  ): Promise<CompetitorData[]> {
    // 실제로는 네이버 지도 API, 구글 플레이스 API 등을 활용
    return [
      {
        id: 'comp_1',
        name: `${city} 힐링펜션`,
        type: 'direct',
        distance: 2.5,
        averagePrice: 150000,
        rating: 4.3,
        reviewCount: 189,
        occupancyRate: 75,
        amenities: ['바베큐', '온천', '애완동물', '와이파이'],
        marketShare: 18,
        strengths: ['위치 접근성', '애완동물 친화적', '바베큐 시설'],
        weaknesses: ['시설 노후화', '마케팅 부족', '예약 시스템 불편']
      },
      {
        id: 'comp_2',
        name: `${region} 프리미엄 리조트`,
        type: 'indirect',
        distance: 8.2,
        averagePrice: 280000,
        rating: 4.7,
        reviewCount: 324,
        occupancyRate: 85,
        amenities: ['수영장', '스파', '레스토랑', '골프', '컨퍼런스'],
        marketShare: 25,
        strengths: ['브랜드 인지도', '고급 시설', '종합 서비스'],
        weaknesses: ['높은 가격', '가족 단위 접근성', '개인화 부족']
      },
      {
        id: 'comp_3',
        name: `${city} 감성숙박`,
        type: 'direct',
        distance: 1.8,
        averagePrice: 120000,
        rating: 4.1,
        reviewCount: 97,
        occupancyRate: 68,
        amenities: ['인스타존', '캠프파이어', '개별바베큐'],
        marketShare: 12,
        strengths: ['SNS 마케팅', 'MZ세대 타겟팅', '감성적 인테리어'],
        weaknesses: ['서비스 일관성', '성수기 대응', '시설 규모']
      },
      {
        id: 'comp_4',
        name: `${region} 가족펜션`,
        type: 'direct',
        distance: 5.1,
        averagePrice: 180000,
        rating: 4.5,
        reviewCount: 267,
        occupancyRate: 82,
        amenities: ['키즈존', '대형수영장', '족구장', '바베큐'],
        marketShare: 22,
        strengths: ['가족 특화', '체험 프로그램', '넓은 공간'],
        weaknesses: ['커플 고객 소외', '성인 전용 공간 부족', '소음 관리']
      },
      {
        id: 'comp_5',
        name: `${city} 부티크호텔`,
        type: 'indirect',
        distance: 12.0,
        averagePrice: 320000,
        rating: 4.6,
        reviewCount: 156,
        occupancyRate: 78,
        amenities: ['루프탑바', '피트니스', '비즈니스센터', '발렛파킹'],
        marketShare: 15,
        strengths: ['도심 접근성', '비즈니스 시설', '세련된 디자인'],
        weaknesses: ['자연 경관 부족', '높은 가격', '가족 친화적 아님']
      }
    ]
  }

  // 가격 분석
  private analyzePricing(competitors: CompetitorData[]): PriceAnalysis[] {
    return competitors.map(comp => ({
      competitor: comp.name,
      weekdayPrice: comp.averagePrice,
      weekendPrice: Math.round(comp.averagePrice * 1.3),
      peakSeasonMultiplier: comp.type === 'indirect' ? 1.8 : 1.5,
      discountStrategy: this.inferDiscountStrategy(comp),
      pricePosition: this.determinePricePosition(comp.averagePrice)
    }))
  }

  // 시장 분석
  private analyzeMarket(city: string, region: string, competitors: CompetitorData[]): MarketAnalysis {
    return {
      marketSize: `${city} 지역 연 4-6만명 방문객`,
      growth: '전년 대비 15% 증가',
      seasonality: '여름(40%), 가을(35%), 봄(20%), 겨울(5%)',
      customerSegments: [
        {
          segment: '가족 여행객 (35%)',
          size: '가장 큰 세그먼트',
          preferences: ['안전', '키즈존', '넓은 공간', '체험활동']
        },
        {
          segment: '커플 고객 (30%)',
          size: '안정적 수요',
          preferences: ['프라이버시', '로맨틱 분위기', '인스타존', '힐링']
        },
        {
          segment: '친구 모임 (20%)',
          size: '젊은층 중심',
          preferences: ['파티 공간', '바베큐', '게임시설', '액티비티']
        },
        {
          segment: '비즈니스 고객 (10%)',
          size: '성장 잠재력',
          preferences: ['와이파이', '회의실', '조용한 환경', '접근성']
        },
        {
          segment: '혼행족 (5%)',
          size: '신성장 동력',
          preferences: ['개인 공간', '힐링', '독서 공간', '감성적 분위기']
        }
      ],
      trends: [
        '개인화된 경험 선호',
        'SNS 인증샷 중요도 증가',
        '펫 프렌들리 수요 확대',
        '지속가능한 여행 관심 증가'
      ]
    }
  }

  // 경쟁 우위 식별
  private identifyCompetitiveAdvantages(
    competitors: CompetitorData[],
    city: string,
    type: string
  ): CompetitiveAdvantage[] {
    return [
      {
        category: 'price',
        title: '가성비 우위 확보 가능',
        description: '중간 가격대에서 높은 가치 제공',
        competitorComparison: '프리미엄 경쟁사 대비 40% 저렴하면서 유사한 품질',
        actionableInsight: '가격 경쟁력을 활용한 패키지 상품 개발',
        implementationDifficulty: 'easy',
        potentialImpact: 'high'
      },
      {
        category: 'location',
        title: '접근성 최적화',
        description: `${city} 중심가 접근성과 자연 경관의 완벽한 조합`,
        competitorComparison: '도심형은 자연 경관 부족, 외곽형은 접근성 불편',
        actionableInsight: '위치적 장점을 활용한 당일치기+숙박 패키지',
        implementationDifficulty: 'medium',
        potentialImpact: 'high'
      },
      {
        category: 'amenities',
        title: '차별화된 편의시설',
        description: '개인 바베큐 + 온천 + 펜션의 복합 경험',
        competitorComparison: '단일 컨셉 집중 vs 복합 경험 제공',
        actionableInsight: '원스톱 휴양 경험으로 포지셔닝',
        implementationDifficulty: 'medium',
        potentialImpact: 'medium'
      },
      {
        category: 'service',
        title: '맞춤형 서비스 경쟁력',
        description: '고객 맞춤형 체크인/아웃, 개인화된 추천',
        competitorComparison: '대형 숙박시설은 획일적, 소형은 서비스 부족',
        actionableInsight: 'AI 기반 개인화 서비스 도입',
        implementationDifficulty: 'hard',
        potentialImpact: 'high'
      },
      {
        category: 'marketing',
        title: '디지털 마케팅 격차 활용',
        description: '데이터 기반 타겟팅 vs 전통적 마케팅',
        competitorComparison: '경쟁사들의 디지털 마케팅 미흡',
        actionableInsight: 'SNS, 검색 광고 집중 투자로 선점 효과',
        implementationDifficulty: 'medium',
        potentialImpact: 'high'
      }
    ]
  }

  // 추천사항 생성
  private generateRecommendations(
    competitors: CompetitorData[],
    priceAnalysis: PriceAnalysis[],
    marketAnalysis: MarketAnalysis
  ): any {
    const avgPrice = priceAnalysis.reduce((sum, p) => sum + p.weekdayPrice, 0) / priceAnalysis.length
    const topCompetitor = competitors.sort((a, b) => b.occupancyRate - a.occupancyRate)[0]

    return {
      pricing: {
        recommendedWeekdayPrice: Math.round(avgPrice * 0.9),
        recommendedWeekendPrice: Math.round(avgPrice * 1.2),
        strategy: '가성비 우위를 활용한 공격적 가격 정책'
      },
      positioning: {
        target: '가족 여행객 + 커플 고객 dual 타겟팅',
        differentiator: '접근성 + 자연 + 종합 편의시설',
        messaging: '가까운 곳에서 완벽한 휴식'
      },
      immediate_actions: [
        {
          action: topCompetitor.name + ' 벤치마킹',
          priority: 'High',
          timeline: '1주일',
          expectedImpact: '점유율 +5%'
        },
        {
          action: '가성비 패키지 상품 3종 출시',
          priority: 'High',
          timeline: '2주일',
          expectedImpact: '예약률 +25%'
        },
        {
          action: 'SNS 컨텐츠 마케팅 강화',
          priority: 'Medium',
          timeline: '1개월',
          expectedImpact: '브랜드 인지도 +30%'
        }
      ],
      market_opportunities: [
        '혼행족 타겟팅 (신시장)',
        '펫 프렌들리 서비스 확대',
        '기업 워크샵 시장 진입',
        '외국인 관광객 유치'
      ]
    }
  }

  // 포지셔닝 맵 생성
  private createPositioningMap(competitors: CompetitorData[]): any {
    return {
      axes: {
        x: '가격 (낮음 ← → 높음)',
        y: '서비스 수준 (기본 ← → 프리미엄)'
      },
      positions: competitors.map(comp => ({
        name: comp.name,
        x: this.normalizePrice(comp.averagePrice),
        y: this.normalizeService(comp.rating, comp.amenities.length),
        size: comp.marketShare,
        type: comp.type
      })),
      recommendations: {
        idealPosition: { x: 30, y: 70 }, // 합리적 가격, 높은 서비스
        currentGaps: ['중가격 고서비스', '저가격 중서비스'],
        moveDirection: '우상단 (가치 제공형)'
      }
    }
  }

  // 유틸리티 함수들
  private inferDiscountStrategy(comp: CompetitorData): string[] {
    const strategies = []
    if (comp.occupancyRate < 70) strategies.push('조기예약 할인')
    if (comp.type === 'direct') strategies.push('장기숙박 할인')
    if (comp.marketShare < 15) strategies.push('신규고객 할인')
    return strategies
  }

  private determinePricePosition(price: number): 'premium' | 'mid-range' | 'budget' {
    return price > 250000 ? 'premium' : price > 150000 ? 'mid-range' : 'budget'
  }

  private normalizePrice(price: number): number {
    // 50,000원 ~ 400,000원을 0~100으로 정규화
    return Math.min(100, Math.max(0, ((price - 50000) / 350000) * 100))
  }

  private normalizeService(rating: number, amenityCount: number): number {
    // 평점(0~5) + 편의시설 개수를 0~100으로 정규화
    const ratingScore = (rating / 5) * 60
    const amenityScore = Math.min(40, amenityCount * 5)
    return ratingScore + amenityScore
  }
}

// 싱글톤 인스턴스
let competitorAnalyzer: CompetitorAnalyzer | null = null

export function getCompetitorAnalyzer(): CompetitorAnalyzer {
  if (!competitorAnalyzer) {
    competitorAnalyzer = new CompetitorAnalyzer()
  }
  return competitorAnalyzer
}

export type { CompetitorData, PriceAnalysis, MarketAnalysis, CompetitiveAdvantage }