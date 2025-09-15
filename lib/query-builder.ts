/**
 * 씨앗 태그 + 모디파이어 + 지역 조합 쿼리 생성 시스템
 * 트렌드 수집을 위한 최적 검색 쿼리 생성
 */

import { createClient } from '@/lib/supabase/server'

interface QueryKeyword {
  id: string
  type: 'seed' | 'modifier' | 'region'
  keyword: string
  category: string
  popularityScore: number
  performanceAvg: number
  lastUsedWeek?: string
}

interface SearchQuery {
  query: string
  platform: 'youtube' | 'instagram' | 'naver'
  components: {
    seed: string
    region?: string
    modifier?: string
  }
  expectedRelevance: number // 0-1 점수
  priority: 'high' | 'medium' | 'low'
}

interface QueryGenerationRequest {
  platform: 'youtube' | 'instagram' | 'naver'
  maxQueries?: number
  includeRegions?: string[]
  excludeModifiers?: string[]
  prioritizeRecent?: boolean
}

interface QueryGenerationResult {
  queries: SearchQuery[]
  totalGenerated: number
  strategy: {
    seedWeight: number
    regionWeight: number
    modifierWeight: number
  }
}

/**
 * 플랫폼별 최적화된 검색 쿼리 생성
 */
export async function generateSearchQueries(request: QueryGenerationRequest): Promise<QueryGenerationResult> {
  const {
    platform,
    maxQueries = 50,
    includeRegions,
    excludeModifiers,
    prioritizeRecent = true
  } = request

  try {
    console.log(`[QUERY_BUILDER] ${platform} 쿼리 생성 시작 (최대 ${maxQueries}개)`)

    // 1. 활성 키워드 조회
    const keywords = await getActiveKeywords({
      includeRegions,
      excludeModifiers,
      prioritizeRecent
    })

    // 2. 플랫폼별 전략 적용
    const strategy = getPlatformStrategy(platform)

    // 3. 조합 생성
    const queries = await buildQueryCombinations(keywords, strategy, maxQueries, platform)

    // 4. 관련도 점수 계산 및 정렬
    const scoredQueries = queries
      .map(query => ({
        ...query,
        expectedRelevance: calculateRelevanceScore(query, keywords),
        priority: getPriorityLevel(query, keywords)
      }))
      .sort((a, b) => b.expectedRelevance - a.expectedRelevance)
      .slice(0, maxQueries)

    console.log(`[QUERY_BUILDER] 쿼리 생성 완료: ${scoredQueries.length}개`)

    return {
      queries: scoredQueries,
      totalGenerated: scoredQueries.length,
      strategy
    }

  } catch (error) {
    console.error('[QUERY_BUILDER] 쿼리 생성 실패:', error)
    return {
      queries: [],
      totalGenerated: 0,
      strategy: getPlatformStrategy(platform)
    }
  }
}

/**
 * 활성 키워드 조회 (인기도 및 성과 기준)
 */
async function getActiveKeywords(options: {
  includeRegions?: string[]
  excludeModifiers?: string[]
  prioritizeRecent?: boolean
}): Promise<QueryKeyword[]> {
  const supabase = createClient()

  let query = supabase
    .from('prompt_keywords')
    .select('*')
    .eq('is_active', true)
    .order('popularity_score', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('[QUERY_BUILDER] 키워드 조회 실패:', error)
    return []
  }

  let keywords = data.map(item => ({
    id: item.id,
    type: item.type as 'seed' | 'modifier' | 'region',
    keyword: item.keyword,
    category: item.category,
    popularityScore: item.popularity_score,
    performanceAvg: item.performance_avg,
    lastUsedWeek: item.last_used_week
  }))

  // 지역 필터링
  if (options.includeRegions) {
    keywords = keywords.filter(kw =>
      kw.type !== 'region' || options.includeRegions!.includes(kw.keyword)
    )
  }

  // 모디파이어 제외
  if (options.excludeModifiers) {
    keywords = keywords.filter(kw =>
      kw.type !== 'modifier' || !options.excludeModifiers!.includes(kw.keyword)
    )
  }

  // 최근 사용 우선순위
  if (options.prioritizeRecent) {
    keywords = keywords.sort((a, b) => {
      const aRecent = a.lastUsedWeek ? new Date(a.lastUsedWeek).getTime() : 0
      const bRecent = b.lastUsedWeek ? new Date(b.lastUsedWeek).getTime() : 0
      return bRecent - aRecent
    })
  }

  return keywords
}

/**
 * 플랫폼별 검색 전략
 */
function getPlatformStrategy(platform: 'youtube' | 'instagram' | 'naver'): {
  seedWeight: number
  regionWeight: number
  modifierWeight: number
} {
  switch (platform) {
    case 'youtube':
      return {
        seedWeight: 0.4,  // 숙박 타입 중요
        regionWeight: 0.35, // 지역 매우 중요
        modifierWeight: 0.25 // 부가 서비스
      }

    case 'instagram':
      return {
        seedWeight: 0.3,  // 해시태그 특성상 균등
        regionWeight: 0.3,
        modifierWeight: 0.4 // 감성, 스타일 중요
      }

    case 'naver':
      return {
        seedWeight: 0.5,  // 검색 의도 명확
        regionWeight: 0.4, // 지역 검색 중요
        modifierWeight: 0.1 // 부가 정보
      }

    default:
      return { seedWeight: 0.33, regionWeight: 0.33, modifierWeight: 0.34 }
  }
}

/**
 * 쿼리 조합 생성
 */
async function buildQueryCombinations(
  keywords: QueryKeyword[],
  strategy: { seedWeight: number; regionWeight: number; modifierWeight: number },
  maxQueries: number,
  platform: 'youtube' | 'instagram' | 'naver'
): Promise<Omit<SearchQuery, 'expectedRelevance' | 'priority'>[]> {
  const seeds = keywords.filter(kw => kw.type === 'seed')
  const regions = keywords.filter(kw => kw.type === 'region')
  const modifiers = keywords.filter(kw => kw.type === 'modifier')

  const queries: Omit<SearchQuery, 'expectedRelevance' | 'priority'>[] = []

  // 1단계: 기본 조합 (씨앗 + 지역)
  for (const seed of seeds.slice(0, 4)) { // 상위 4개 씨앗
    for (const region of regions.slice(0, 8)) { // 상위 8개 지역
      queries.push({
        query: `${region.keyword} ${seed.keyword}`,
        platform,
        components: {
          seed: seed.keyword,
          region: region.keyword
        }
      })
    }
  }

  // 2단계: 3요소 조합 (씨앗 + 지역 + 모디파이어)
  for (const seed of seeds.slice(0, 4)) {
    for (const region of regions.slice(0, 6)) { // 상위 6개 지역
      for (const modifier of modifiers.slice(0, 10)) { // 상위 10개 모디파이어
        // 플랫폼별 쿼리 형태 최적화
        const query = formatPlatformQuery(platform, {
          seed: seed.keyword,
          region: region.keyword,
          modifier: modifier.keyword
        })

        queries.push({
          query,
          platform,
          components: {
            seed: seed.keyword,
            region: region.keyword,
            modifier: modifier.keyword
          }
        })

        if (queries.length >= maxQueries * 2) break // 여유분 확보
      }
      if (queries.length >= maxQueries * 2) break
    }
    if (queries.length >= maxQueries * 2) break
  }

  // 3단계: 특수 조합 (시즌별, 트렌드별)
  const specialQueries = generateSpecialQueries(seeds, regions, modifiers, platform)
  queries.push(...specialQueries)

  return queries.slice(0, maxQueries * 1.5) // 필터링 전 여유분
}

/**
 * 플랫폼별 쿼리 포맷팅
 */
function formatPlatformQuery(
  platform: 'youtube' | 'instagram' | 'naver',
  components: { seed: string; region: string; modifier: string }
): string {
  const { seed, region, modifier } = components

  switch (platform) {
    case 'youtube':
      // YouTube: 자연스러운 문장형
      return `${region} ${seed} ${modifier} 추천`

    case 'instagram':
      // Instagram: 해시태그 스타일
      return `${region}${seed} ${modifier}스타그램`

    case 'naver':
      // NAVER: 검색 의도 명확
      return `${region} ${modifier} ${seed} 예약`

    default:
      return `${region} ${seed} ${modifier}`
  }
}

/**
 * 특수 조합 생성 (시즌, 트렌드 기반)
 */
function generateSpecialQueries(
  seeds: QueryKeyword[],
  regions: QueryKeyword[],
  modifiers: QueryKeyword[],
  platform: 'youtube' | 'instagram' | 'naver'
): Omit<SearchQuery, 'expectedRelevance' | 'priority'>[] {
  const specialQueries: Omit<SearchQuery, 'expectedRelevance' | 'priority'>[] = []
  const currentMonth = new Date().getMonth() + 1

  // 시즌별 특수 조합
  const seasonalModifiers = getSeasonalModifiers(currentMonth)

  for (const seed of seeds.slice(0, 2)) {
    for (const region of regions.slice(0, 3)) {
      for (const seasonal of seasonalModifiers) {
        specialQueries.push({
          query: formatPlatformQuery(platform, {
            seed: seed.keyword,
            region: region.keyword,
            modifier: seasonal
          }),
          platform,
          components: {
            seed: seed.keyword,
            region: region.keyword,
            modifier: seasonal
          }
        })
      }
    }
  }

  return specialQueries
}

/**
 * 시즌별 모디파이어 반환
 */
function getSeasonalModifiers(month: number): string[] {
  if (month >= 6 && month <= 8) {
    return ['수영장', '워터파크', '계곡', '여름휴가']
  } else if (month >= 9 && month <= 11) {
    return ['단풍', '가을여행', '힐링', '온천']
  } else if (month === 12 || month <= 2) {
    return ['송년회', '신년', '스키', '온천']
  } else {
    return ['봄여행', '벚꽃', '피크닉', '캠핑']
  }
}

/**
 * 관련도 점수 계산
 */
function calculateRelevanceScore(
  query: Omit<SearchQuery, 'expectedRelevance' | 'priority'>,
  keywords: QueryKeyword[]
): number {
  let score = 0

  // 씨앗 키워드 점수
  const seedKeyword = keywords.find(kw => kw.keyword === query.components.seed)
  if (seedKeyword) {
    score += seedKeyword.popularityScore * 0.4 + seedKeyword.performanceAvg * 0.1
  }

  // 지역 키워드 점수
  if (query.components.region) {
    const regionKeyword = keywords.find(kw => kw.keyword === query.components.region)
    if (regionKeyword) {
      score += regionKeyword.popularityScore * 0.3 + regionKeyword.performanceAvg * 0.1
    }
  }

  // 모디파이어 키워드 점수
  if (query.components.modifier) {
    const modifierKeyword = keywords.find(kw => kw.keyword === query.components.modifier)
    if (modifierKeyword) {
      score += modifierKeyword.popularityScore * 0.2 + modifierKeyword.performanceAvg * 0.1
    }
  }

  return Math.min(score, 1.0) // 최대 1.0으로 정규화
}

/**
 * 우선순위 레벨 결정
 */
function getPriorityLevel(
  query: Omit<SearchQuery, 'expectedRelevance' | 'priority'>,
  keywords: QueryKeyword[]
): 'high' | 'medium' | 'low' {
  const seedKeyword = keywords.find(kw => kw.keyword === query.components.seed)
  const avgPopularity = seedKeyword ? seedKeyword.popularityScore : 0

  if (avgPopularity > 0.7) return 'high'
  if (avgPopularity > 0.4) return 'medium'
  return 'low'
}

/**
 * 키워드 성과 업데이트 (트렌드 수집 결과 반영)
 */
export async function updateKeywordPerformance(
  keyword: string,
  type: 'seed' | 'modifier' | 'region',
  performance: {
    totalViews: number
    totalLikes: number
    totalComments: number
    signalCount: number
  }
): Promise<void> {
  try {
    const supabase = createClient()

    // 성과 점수 계산 (정규화)
    const performanceScore = Math.min(
      (performance.totalViews / Math.max(performance.signalCount, 1)) / 10000 +
      (performance.totalLikes / Math.max(performance.signalCount, 1)) / 1000 +
      (performance.totalComments / Math.max(performance.signalCount, 1)) / 100,
      1.0
    )

    const { error } = await supabase
      .from('prompt_keywords')
      .update({
        performance_avg: performanceScore,
        last_used_week: new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString()
      })
      .eq('keyword', keyword)
      .eq('type', type)

    if (error) {
      console.error(`[QUERY_BUILDER] 키워드 성과 업데이트 실패: ${keyword}`, error)
    } else {
      console.log(`[QUERY_BUILDER] 키워드 성과 업데이트: ${keyword} = ${performanceScore.toFixed(3)}`)
    }

  } catch (error) {
    console.error('[QUERY_BUILDER] 성과 업데이트 오류:', error)
  }
}

/**
 * 주간 키워드 인기도 재계산
 */
export async function recalculateKeywordPopularity(): Promise<void> {
  try {
    console.log('[QUERY_BUILDER] 키워드 인기도 재계산 시작')

    const supabase = createClient()

    // 이번 주 트렌드 시그널에서 키워드 빈도 계산
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)

    const { data: signals } = await supabase
      .from('trend_signals')
      .select('category, hashtags, title, views, likes')
      .gte('collected_at', weekStart.toISOString())

    if (!signals) return

    // 키워드별 인기도 집계
    const keywordStats: Record<string, { frequency: number; totalEngagement: number }> = {}

    signals.forEach(signal => {
      const text = `${signal.title || ''} ${signal.category || ''}`
      const hashtags = signal.hashtags || []
      const engagement = (signal.views || 0) + (signal.likes || 0) * 10

      // 텍스트에서 키워드 추출
      const keywords = text.match(/[가-힣]{2,}/g) || []

      [...keywords, ...hashtags].forEach(keyword => {
        if (!keywordStats[keyword]) {
          keywordStats[keyword] = { frequency: 0, totalEngagement: 0 }
        }
        keywordStats[keyword].frequency += 1
        keywordStats[keyword].totalEngagement += engagement
      })
    })

    // 키워드 인기도 점수 업데이트
    const { data: allKeywords } = await supabase
      .from('prompt_keywords')
      .select('keyword, type')

    if (!allKeywords) return

    for (const kw of allKeywords) {
      const stats = keywordStats[kw.keyword]
      const popularityScore = stats
        ? Math.min((stats.frequency * 0.3 + stats.totalEngagement / 10000 * 0.7) / 100, 1.0)
        : 0

      await supabase
        .from('prompt_keywords')
        .update({
          popularity_score: popularityScore,
          updated_at: new Date().toISOString()
        })
        .eq('keyword', kw.keyword)
        .eq('type', kw.type)
    }

    console.log('[QUERY_BUILDER] 키워드 인기도 재계산 완료')

  } catch (error) {
    console.error('[QUERY_BUILDER] 인기도 재계산 실패:', error)
  }
}