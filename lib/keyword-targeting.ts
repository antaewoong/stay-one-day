// 키워드 타겟팅 시스템

interface KeywordMaster {
  id: string
  slug: string
  display_name: string
  category: 'family' | 'party' | 'business' | 'travel'
  priority: number
  is_active: boolean
}

interface KeywordSynonym {
  id: string
  master_slug: string
  variant: string
}

interface AccommodationKeyword {
  id: string
  accommodation_id: string
  kw_slug: string
  created_at: string
}

interface KeywordSearchResult {
  slug: string
  display_name: string
  category: string
  priority: number
}

interface KeywordAnalysisContext {
  keywords: string[]
  originalInput?: string[]
  accommodationName: string
  city: string
  region: string
  accommodationType: string
}

class KeywordTargetingSystem {
  // 키워드 정규화 (한글 띄어쓰기, 하이픈, 영문 혼용 정리)
  normalizeKeyword(input: string): string {
    // 1. 양끝 공백 제거, 내부 다중 공백 → 단일 공백
    let normalized = input.trim().replace(/\s+/g, ' ')

    // 2. 하이픈/언더스코어 → 공백
    normalized = normalized.replace(/[-_]+/g, ' ')

    // 3. 영문/숫자만 있는 경우 소문자화, 한글 포함시 원형 유지
    const lowerCase = normalized.toLowerCase()
    const isEnglishOnly = /^[a-z0-9\s]+$/.test(lowerCase)

    return isEnglishOnly ? lowerCase : normalized
  }

  // Mock 키워드 마스터 데이터 (실제로는 DB에서 조회)
  private getMockKeywordMaster(): KeywordMaster[] {
    return [
      // Family 카테고리
      { id: '1', slug: 'kids-cafe', display_name: '키즈카페', category: 'family', priority: 10, is_active: true },
      { id: '2', slug: 'kids-pool', display_name: '키즈풀', category: 'family', priority: 15, is_active: true },
      { id: '3', slug: 'family-dining', display_name: '가족 식사', category: 'family', priority: 20, is_active: true },
      { id: '4', slug: 'kids-birthday', display_name: '초등 생일파티', category: 'family', priority: 25, is_active: true },
      { id: '5', slug: 'kindergarten-party', display_name: '유치원 생일파티', category: 'family', priority: 30, is_active: true },
      { id: '6', slug: 'mom-kids-travel', display_name: '모자여행', category: 'family', priority: 35, is_active: true },

      // Party 카테고리
      { id: '7', slug: 'bridal-party', display_name: '브라이덜 파티', category: 'party', priority: 10, is_active: true },
      { id: '8', slug: 'birthday-party', display_name: '생일파티', category: 'party', priority: 15, is_active: true },
      { id: '9', slug: 'space-rental', display_name: '공간대여', category: 'party', priority: 20, is_active: true },
      { id: '10', slug: 'party-room', display_name: '파티룸', category: 'party', priority: 25, is_active: true },
      { id: '11', slug: 'class-reunion', display_name: '반모임', category: 'party', priority: 30, is_active: true },
      { id: '12', slug: 'group-meeting', display_name: '계모임', category: 'party', priority: 35, is_active: true },
      { id: '13', slug: 'mom-meeting', display_name: '자모모임', category: 'party', priority: 40, is_active: true },
      { id: '14', slug: 'school-reunion', display_name: '동기모임', category: 'party', priority: 45, is_active: true },
      { id: '15', slug: 'couple-meeting', display_name: '커플 모임', category: 'party', priority: 50, is_active: true },
      { id: '16', slug: 'couple-gathering', display_name: '부부모임', category: 'party', priority: 55, is_active: true },

      // Business 카테고리
      { id: '17', slug: 'workshop-venue', display_name: '워크샵 장소', category: 'business', priority: 10, is_active: true },
      { id: '18', slug: 'team-meeting', display_name: '팀미팅', category: 'business', priority: 15, is_active: true },
      { id: '19', slug: 'company-meeting', display_name: '캔미팅 장소', category: 'business', priority: 20, is_active: true },
      { id: '20', slug: 'seminar-room', display_name: '세미나실', category: 'business', priority: 25, is_active: true },
      { id: '21', slug: 'conference-room', display_name: '회의실 대여', category: 'business', priority: 30, is_active: true },

      // Travel 카테고리
      { id: '22', slug: 'pool-villa', display_name: '풀빌라', category: 'travel', priority: 10, is_active: true },
      { id: '23', slug: 'emotional-stay', display_name: '감성스테이', category: 'travel', priority: 15, is_active: true },
      { id: '24', slug: 'day-trip', display_name: '당일여행', category: 'travel', priority: 20, is_active: true },
      { id: '25', slug: 'swimming-pool', display_name: '수영장', category: 'travel', priority: 25, is_active: true },
      { id: '26', slug: 'spa', display_name: '스파', category: 'travel', priority: 30, is_active: true },
      { id: '27', slug: 'hot-spring', display_name: '노천탕', category: 'travel', priority: 35, is_active: true }
    ]
  }

  // Mock 시노님 데이터 (실제로는 DB에서 조회)
  private getMockSynonyms(): KeywordSynonym[] {
    return [
      // kids-cafe 변형
      { id: '1', master_slug: 'kids-cafe', variant: '키즈 카페' },
      { id: '2', master_slug: 'kids-cafe', variant: '키즈-카페' },
      { id: '3', master_slug: 'kids-cafe', variant: 'kids cafe' },
      { id: '4', master_slug: 'kids-cafe', variant: '어린이카페' },

      // kids-pool 변형
      { id: '5', master_slug: 'kids-pool', variant: '키즈 풀' },
      { id: '6', master_slug: 'kids-pool', variant: '아이 수영장' },
      { id: '7', master_slug: 'kids-pool', variant: 'kids pool' },
      { id: '8', master_slug: 'kids-pool', variant: '어린이 풀' },

      // pool-villa 변형
      { id: '9', master_slug: 'pool-villa', variant: '풀 빌라' },
      { id: '10', master_slug: 'pool-villa', variant: 'pool villa' },
      { id: '11', master_slug: 'pool-villa', variant: '수영장 빌라' },

      // bridal-party 변형
      { id: '12', master_slug: 'bridal-party', variant: '브라이달 파티' },
      { id: '13', master_slug: 'bridal-party', variant: 'bridal party' },
      { id: '14', master_slug: 'bridal-party', variant: '신부파티' },

      // workshop-venue 변형
      { id: '15', master_slug: 'workshop-venue', variant: '워크샵 장소' },
      { id: '16', master_slug: 'workshop-venue', variant: 'workshop venue' },
      { id: '17', master_slug: 'workshop-venue', variant: '워크숍 공간' },

      // emotional-stay 변형
      { id: '18', master_slug: 'emotional-stay', variant: '감성 스테이' },
      { id: '19', master_slug: 'emotional-stay', variant: 'emotional stay' },
      { id: '20', master_slug: 'emotional-stay', variant: '감성숙소' }
    ]
  }

  // 키워드 검색 (자동완성)
  async searchKeywords(query: string, limit: number = 20): Promise<KeywordSearchResult[]> {
    const normalized = this.normalizeKeyword(query)
    const keywords = this.getMockKeywordMaster()
    const synonyms = this.getMockSynonyms()

    // 1. display_name으로 직접 매칭
    const directMatches = keywords.filter(kw =>
      kw.is_active &&
      kw.display_name.toLowerCase().includes(normalized.toLowerCase())
    )

    // 2. 시노님으로 매칭
    const synonymMatches = synonyms
      .filter(syn => syn.variant.toLowerCase().includes(normalized.toLowerCase()))
      .map(syn => keywords.find(kw => kw.slug === syn.master_slug))
      .filter((kw): kw is KeywordMaster => kw !== undefined && kw.is_active)

    // 중복 제거 및 우선순위 정렬
    const allMatches = [...directMatches, ...synonymMatches]
    const uniqueMatches = Array.from(
      new Map(allMatches.map(kw => [kw.slug, kw])).values()
    )

    return uniqueMatches
      .sort((a, b) => a.priority - b.priority)
      .slice(0, limit)
      .map(kw => ({
        slug: kw.slug,
        display_name: kw.display_name,
        category: kw.category,
        priority: kw.priority
      }))
  }

  // 인기 키워드 조회 (초기 추천용)
  async getPopularKeywords(limit: number = 50): Promise<KeywordSearchResult[]> {
    const keywords = this.getMockKeywordMaster()

    return keywords
      .filter(kw => kw.is_active)
      .sort((a, b) => a.priority - b.priority)
      .slice(0, limit)
      .map(kw => ({
        slug: kw.slug,
        display_name: kw.display_name,
        category: kw.category,
        priority: kw.priority
      }))
  }

  // 시노님을 통한 슬러그 매핑
  async findMasterSlugBySynonym(variant: string): Promise<string | null> {
    const normalized = this.normalizeKeyword(variant)
    const synonyms = this.getMockSynonyms()

    const synonym = synonyms.find(syn =>
      this.normalizeKeyword(syn.variant) === normalized
    )

    return synonym?.master_slug || null
  }

  // 키워드 입력을 정규화하고 슬러그로 변환
  async normalizeAndMapKeywords(inputs: string[]): Promise<string[]> {
    const results: string[] = []

    for (const input of inputs) {
      const normalized = this.normalizeKeyword(input)

      // 1. 시노님 매핑 시도
      const masterSlug = await this.findMasterSlugBySynonym(normalized)
      if (masterSlug) {
        results.push(masterSlug)
        continue
      }

      // 2. 직접 매칭 시도
      const keywords = this.getMockKeywordMaster()
      const directMatch = keywords.find(kw =>
        this.normalizeKeyword(kw.display_name) === normalized
      )

      if (directMatch) {
        results.push(directMatch.slug)
      } else {
        // 매칭되지 않는 경우 정규화된 형태로 저장 (커스텀 키워드)
        results.push(normalized)
      }
    }

    return results
  }

  // 분석을 위한 키워드 조합 생성
  generateAnalysisQueries(context: KeywordAnalysisContext): string[] {
    const { keywords, city, region, accommodationType } = context
    const queries: string[] = []

    if (keywords.length === 0) {
      // 기본 템플릿 (키워드가 없는 경우)
      queries.push(
        `${region} 여행`,
        `${city} 여행`,
        `${region} ${accommodationType}`,
        `${city} ${accommodationType}`
      )
      return queries
    }

    // 키워드 기반 조합 생성
    const keywordNames = this.getKeywordDisplayNames(keywords)

    // Top 3 키워드만 지역과 조합 (API 호출 제한)
    const topKeywords = keywordNames.slice(0, 3)

    for (const keyword of topKeywords) {
      queries.push(
        `${region} ${keyword}`,
        `${city} ${keyword}`,
        `${keyword} ${accommodationType}`,
        `${keyword} 숙소`
      )
    }

    // 나머지 키워드는 단독 검색
    for (const keyword of keywordNames.slice(3)) {
      queries.push(`${keyword} ${region}`)
    }

    return queries
  }

  // 키워드 슬러그를 표시명으로 변환
  private getKeywordDisplayNames(slugs: string[]): string[] {
    const keywords = this.getMockKeywordMaster()

    return slugs.map(slug => {
      const keyword = keywords.find(kw => kw.slug === slug)
      return keyword ? keyword.display_name : slug
    })
  }

  // UTM 캠페인명 생성 (스마트링크 연동)
  generateUTMCampaign(keywordSlug: string): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    return `kw/${keywordSlug}-${date}`
  }

  // 키워드 기반 콘텐츠 제안 향상
  enhanceContentWithKeywords(baseContent: any, keywords: string[]): any {
    if (keywords.length === 0) return baseContent

    const keywordNames = this.getKeywordDisplayNames(keywords)
    const primaryKeyword = keywordNames[0]

    return {
      ...baseContent,
      title: `🔥 '${primaryKeyword}' 트렌드 반영 - ${baseContent.title}`,
      description: `${primaryKeyword} 고객을 타겟으로 한 ${baseContent.description}`,
      marketingAngle: [
        `${primaryKeyword} 특화 서비스`,
        ...baseContent.marketingAngle
      ],
      priority: 'high', // 키워드 기반 콘텐츠는 우선순위 상승
      keywordContext: {
        targetKeywords: keywordNames,
        primaryKeyword,
        utm_campaign: this.generateUTMCampaign(keywords[0])
      }
    }
  }

  // 캐시 키 생성 (키워드 포함)
  generateCacheKey(city: string, region: string, keywords: string[]): string {
    const keywordHash = keywords.sort().join(',')
    const date = new Date().toISOString().slice(0, 10)
    return `trend:${city}:${region}:${keywordHash}:${date}`
  }
}

// 싱글톤 인스턴스
let keywordTargetingSystem: KeywordTargetingSystem | null = null

export function getKeywordTargetingSystem(): KeywordTargetingSystem {
  if (!keywordTargetingSystem) {
    keywordTargetingSystem = new KeywordTargetingSystem()
  }
  return keywordTargetingSystem
}

export type {
  KeywordMaster,
  KeywordSynonym,
  AccommodationKeyword,
  KeywordSearchResult,
  KeywordAnalysisContext
}