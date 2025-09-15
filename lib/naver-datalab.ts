import { getKeywordTargetingSystem, type KeywordAnalysisContext } from '@/lib/keyword-targeting'

interface NaverDataLabRequest {
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  timeUnit: 'date' | 'week' | 'month'
  keywordGroups: Array<{
    groupName: string
    keywords: string[]
  }>
  device?: 'pc' | 'mo' | '' // 빈 문자열은 전체
  ages?: string[] // ['1', '2'] 등 (1: 0~12세, 2: 13~18세, ...)
  gender?: 'm' | 'f' | '' // 빈 문자열은 전체
}

interface NaverDataLabResponse {
  startDate: string
  endDate: string
  timeUnit: string
  results: Array<{
    title: string
    keywords: string[]
    data: Array<{
      period: string
      ratio: number
    }>
  }>
}

interface ProcessedTrendData {
  keyword: string
  searchVolume: number
  trend: 'up' | 'down' | 'stable'
  growthRate: number
  competitionLevel: 'low' | 'medium' | 'high'
  relatedTerms: string[]
  data: Array<{
    period: string
    ratio: number
  }>
}

class NaverDataLabClient {
  private clientId: string
  private clientSecret: string
  private baseUrl = 'https://openapi.naver.com/v1/datalab/search'

  constructor() {
    this.clientId = process.env.NAVER_DATALAB_CLIENT_ID!
    this.clientSecret = process.env.NAVER_DATALAB_CLIENT_SECRET!

    if (!this.clientId || !this.clientSecret) {
      throw new Error('네이버 데이터랩 API 키가 설정되지 않았습니다')
    }
  }

  // 기본 API 호출
  async searchTrends(request: NaverDataLabRequest): Promise<NaverDataLabResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Naver-Client-Id': this.clientId,
        'X-Naver-Client-Secret': this.clientSecret
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`네이버 데이터랩 API 오류: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  // 지역 기반 키워드 트렌드 분석
  async getLocationTrends(
    city: string,
    region: string,
    accommodationType: string = '펜션',
    selectedKeywords: string[] = []
  ): Promise<ProcessedTrendData[]> {
    // 최근 3개월 데이터 조회
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(endDate.getMonth() - 3)

    // 키워드 타겟팅 시스템을 통한 키워드 생성
    const keywordSystem = getKeywordTargetingSystem()
    const keywordContext: KeywordAnalysisContext = {
      keywords: selectedKeywords,
      accommodationName: '', // API에서 전달받지 않으므로 빈값
      city,
      region,
      accommodationType
    }

    let allKeywords: string[]
    if (selectedKeywords.length > 0) {
      // 선택된 키워드가 있는 경우: 키워드 중심의 조합 생성
      allKeywords = keywordSystem.generateAnalysisQueries(keywordContext)
    } else {
      // 기본 키워드 생성 (기존 로직 유지)
      const baseKeywords = [
        `${city} 여행`,
        `${city} 숙소`,
        `${region} ${accommodationType}`,
        `${region} 체험`,
        `${city} 맛집`,
        `${city} 카페`,
        `${region} 액티비티`,
        `${city} 포토스팟`
      ]

      // 계절별 키워드 추가
      const seasonalKeywords = this.getSeasonalKeywords(city, region)
      allKeywords = [...baseKeywords, ...seasonalKeywords]
    }

    // 네이버 데이터랩은 최대 5개 그룹만 지원하므로 분할 처리
    const keywordGroups = this.chunkKeywords(allKeywords, 5)
    const results: ProcessedTrendData[] = []

    for (const group of keywordGroups) {
      try {
        const request: NaverDataLabRequest = {
          startDate: this.formatDate(startDate),
          endDate: this.formatDate(endDate),
          timeUnit: 'week',
          keywordGroups: group.map(keyword => ({
            groupName: keyword,
            keywords: [keyword]
          })),
          device: '', // 전체 디바이스
          gender: '', // 전체 성별
          ages: [] // 전체 연령대
        }

        const response = await this.searchTrends(request)
        const processed = this.processResponse(response)
        results.push(...processed)

        // API 호출 간격 (rate limiting 방지)
        await this.sleep(100)

      } catch (error) {
        console.error(`키워드 그룹 처리 실패:`, group, error)
      }
    }

    // 검색량 기준 정렬
    return results.sort((a, b) => b.searchVolume - a.searchVolume)
  }

  // 응답 데이터 처리
  private processResponse(response: NaverDataLabResponse): ProcessedTrendData[] {
    return response.results.map(result => {
      const data = result.data
      const latestRatio = data[data.length - 1]?.ratio || 0
      const previousRatio = data[data.length - 2]?.ratio || 0
      const avgRatio = data.reduce((sum, item) => sum + item.ratio, 0) / data.length

      // 성장률 계산
      const growthRate = previousRatio > 0
        ? ((latestRatio - previousRatio) / previousRatio) * 100
        : 0

      // 트렌드 방향 결정
      const trend: 'up' | 'down' | 'stable' =
        growthRate > 10 ? 'up' :
        growthRate < -10 ? 'down' : 'stable'

      // 경쟁도 추정 (평균 검색량 기준)
      const competitionLevel: 'low' | 'medium' | 'high' =
        avgRatio > 70 ? 'high' :
        avgRatio > 30 ? 'medium' : 'low'

      return {
        keyword: result.title,
        searchVolume: Math.round(avgRatio * 100), // 임의의 스케일링
        trend,
        growthRate: Math.round(growthRate * 100) / 100,
        competitionLevel,
        relatedTerms: this.generateRelatedTerms(result.title),
        data
      }
    })
  }

  // 계절별 키워드 생성
  private getSeasonalKeywords(city: string, region: string): string[] {
    const now = new Date()
    const month = now.getMonth() + 1

    const seasonal: Record<string, string[]> = {
      spring: ['벚꽃', '피크닉', '캠핑', '산책', '봄나들이'],
      summer: ['계곡', '수영', '바베큐', '시원한 곳', '여름휴가'],
      autumn: ['단풍', '등산', '힐링', '온천', '가을여행'],
      winter: ['스키', '눈', '온천', '겨울축제', '따뜻한 곳']
    }

    let season = 'spring'
    if (month >= 6 && month <= 8) season = 'summer'
    else if (month >= 9 && month <= 11) season = 'autumn'
    else if (month >= 12 || month <= 2) season = 'winter'

    return seasonal[season].map(keyword => `${city} ${keyword}`)
  }

  // 관련 키워드 생성
  private generateRelatedTerms(keyword: string): string[] {
    const suffixes = ['추천', '맛집', '체험', '코스', '예약', '가격', '리뷰']
    return suffixes.slice(0, 3).map(suffix => `${keyword} ${suffix}`)
  }

  // 키워드를 그룹으로 분할
  private chunkKeywords(keywords: string[], groupSize: number): string[][] {
    const chunks: string[][] = []
    for (let i = 0; i < keywords.length; i += groupSize) {
      chunks.push(keywords.slice(i, i + groupSize))
    }
    return chunks
  }

  // 날짜 포맷팅
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  // 지연 함수
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 싱글톤 인스턴스
let naverDataLabClient: NaverDataLabClient | null = null

export function getNaverDataLabClient(): NaverDataLabClient {
  if (!naverDataLabClient) {
    naverDataLabClient = new NaverDataLabClient()
  }
  return naverDataLabClient
}

export type { ProcessedTrendData, NaverDataLabResponse }