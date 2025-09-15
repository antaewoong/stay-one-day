/**
 * 숏폼 트렌드 수집 시스템
 * YouTube Shorts + Instagram + NAVER DataLab → 주간 프롬프트 자동 튜닝
 */

import { createClient } from '@/lib/supabase/server'

// 씨앗 태그 (고정)
const SEED_TAGS = ['풀빌라', '펜션', '스테이', '감성스테이'] as const

// 지역 태그
const REGION_TAGS = ['가평', '제주', '양양', '강릉', '포천', '춘천', '경주', '통영'] as const

interface TrendSignal {
  platform: 'youtube' | 'instagram' | 'naver'
  category: string // seed + region 조합
  url: string
  title: string
  caption?: string
  hashtags: string[]
  duration_sec?: number
  views: number
  likes: number
  comments: number
  published_at: Date
  features: {
    // 비태그 신호들
    estimated_cuts?: number // 컷 레이트 추정
    has_overlay_text?: boolean // 오버레이 텍스트 유무
    color_tone?: 'warm' | 'cool' | 'neutral' // 색감 추정
    intro_length?: number // 인트로 길이 (초)
    has_people?: boolean // 사람 등장 여부
    bgm_tempo?: 'upbeat' | 'chill' | 'dramatic' // BGM 템포 추정
  }
}

interface TrendCollectionResult {
  success: boolean
  signals: TrendSignal[]
  totalCollected: number
  error?: string
}

/**
 * 주간 트렌드 수집 메인 함수
 */
export async function collectWeeklyTrends(): Promise<TrendCollectionResult> {
  console.log('[TREND_COLLECTOR] 주간 트렌드 수집 시작')

  try {
    const signals: TrendSignal[] = []

    // 1. YouTube Shorts 수집
    const youtubeSignals = await collectYouTubeShorts()
    signals.push(...youtubeSignals)
    console.log(`[TREND_COLLECTOR] YouTube 수집: ${youtubeSignals.length}개`)

    // 2. Instagram 해시태그 수집
    const instagramSignals = await collectInstagramHashtags()
    signals.push(...instagramSignals)
    console.log(`[TREND_COLLECTOR] Instagram 수집: ${instagramSignals.length}개`)

    // 3. NAVER DataLab 수집 (키워드 트렌드)
    const naverSignals = await collectNaverTrends()
    signals.push(...naverSignals)
    console.log(`[TREND_COLLECTOR] NAVER 수집: ${naverSignals.length}개`)

    // 4. DB 저장
    await saveTrendSignals(signals)

    return {
      success: true,
      signals,
      totalCollected: signals.length
    }

  } catch (error) {
    console.error('[TREND_COLLECTOR] 수집 실패:', error)
    return {
      success: false,
      signals: [],
      totalCollected: 0,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}

/**
 * YouTube Shorts 수집
 */
async function collectYouTubeShorts(): Promise<TrendSignal[]> {
  const signals: TrendSignal[] = []

  if (!process.env.YOUTUBE_API_KEY) {
    console.warn('[TREND_COLLECTOR] YouTube API 키가 없습니다')
    return []
  }

  try {
    // 씨앗 태그 + 지역 조합으로 검색 쿼리 생성
    const queries = generateSearchQueries()

    for (const query of queries.slice(0, 10)) { // API 쿼터 절약을 위해 10개만
      try {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?` +
          `part=snippet&type=video&videoDuration=short&order=viewCount&` +
          `publishedAfter=${getWeekAgoISO()}&relevanceLanguage=ko&regionCode=KR&` +
          `q=${encodeURIComponent(query)}&maxResults=10&key=${process.env.YOUTUBE_API_KEY}`

        const searchResponse = await fetch(searchUrl)
        const searchData = await searchResponse.json()

        if (searchData.error) {
          console.error('[TREND_COLLECTOR] YouTube 검색 오류:', searchData.error)
          continue
        }

        // 각 비디오의 상세 정보 조회
        const videoIds = searchData.items?.map((item: any) => item.id.videoId).join(',')
        if (!videoIds) continue

        const videosUrl = `https://www.googleapis.com/youtube/v3/videos?` +
          `part=statistics,contentDetails,snippet&id=${videoIds}&key=${process.env.YOUTUBE_API_KEY}`

        const videosResponse = await fetch(videosUrl)
        const videosData = await videosResponse.json()

        for (const video of videosData.items || []) {
          const duration = parseDuration(video.contentDetails.duration)
          if (duration > 60) continue // 60초 이하만

          const signal: TrendSignal = {
            platform: 'youtube',
            category: query,
            url: `https://youtube.com/watch?v=${video.id}`,
            title: video.snippet.title,
            caption: video.snippet.description?.substring(0, 500),
            hashtags: extractHashtags(video.snippet.description || ''),
            duration_sec: duration,
            views: parseInt(video.statistics.viewCount || '0'),
            likes: parseInt(video.statistics.likeCount || '0'),
            comments: parseInt(video.statistics.commentCount || '0'),
            published_at: new Date(video.snippet.publishedAt),
            features: {
              estimated_cuts: estimateCuts(duration),
              has_overlay_text: video.snippet.title.length > 10, // 간단 추정
              color_tone: inferColorTone(video.snippet.title),
              intro_length: Math.min(duration * 0.2, 3), // 20% 또는 최대 3초
              has_people: containsPeopleKeywords(video.snippet.title + video.snippet.description),
              bgm_tempo: inferBgmTempo(video.snippet.title)
            }
          }

          signals.push(signal)
        }

        // API 레이트 리밋 고려해서 딜레이
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`[TREND_COLLECTOR] YouTube 쿼리 실패: ${query}`, error)
        continue
      }
    }

  } catch (error) {
    console.error('[TREND_COLLECTOR] YouTube 수집 오류:', error)
  }

  return signals
}

/**
 * Instagram 해시태그 수집 (제한적 - API 권한 필요)
 */
async function collectInstagramHashtags(): Promise<TrendSignal[]> {
  const signals: TrendSignal[] = []

  // Instagram Graph API는 비즈니스 계정 + 권한이 필요하므로
  // 현재는 mock 데이터로 대체 (실제 구현 시 활성화)

  console.log('[TREND_COLLECTOR] Instagram 수집: Mock 데이터 사용')

  const mockHashtags = ['#풀빌라', '#키즈풀', '#가족여행', '#브라이덜파티']

  for (const hashtag of mockHashtags) {
    // Mock 데이터 생성
    for (let i = 0; i < 5; i++) {
      const signal: TrendSignal = {
        platform: 'instagram',
        category: hashtag,
        url: `https://instagram.com/p/mock_${Date.now()}_${i}`,
        title: `${hashtag} 관련 포스트 ${i + 1}`,
        caption: `${hashtag}에서 즐거운 시간을 보냈어요! #숙박 #여행`,
        hashtags: [hashtag, '#숙박', '#여행'],
        views: Math.floor(Math.random() * 10000),
        likes: Math.floor(Math.random() * 500),
        comments: Math.floor(Math.random() * 50),
        published_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        features: {
          has_overlay_text: Math.random() > 0.5,
          color_tone: ['warm', 'cool', 'neutral'][Math.floor(Math.random() * 3)] as any,
          has_people: Math.random() > 0.3,
          bgm_tempo: ['upbeat', 'chill', 'dramatic'][Math.floor(Math.random() * 3)] as any
        }
      }
      signals.push(signal)
    }
  }

  return signals
}

/**
 * NAVER DataLab 트렌드 수집
 */
async function collectNaverTrends(): Promise<TrendSignal[]> {
  const signals: TrendSignal[] = []

  if (!process.env.NAVER_DATALAB_CLIENT_ID) {
    console.warn('[TREND_COLLECTOR] NAVER DataLab API 키가 없습니다')
    return []
  }

  // NAVER DataLab은 검색 트렌드 데이터를 제공하므로
  // 실제 영상 데이터가 아닌 키워드 트렌드로 활용
  // 현재는 mock으로 대체

  const trendKeywords = ['계곡 피크닉', '키즈풀 체험', '브라이덜 스테이', '워크샵 장소']

  for (const keyword of trendKeywords) {
    const signal: TrendSignal = {
      platform: 'naver',
      category: `트렌드: ${keyword}`,
      url: `https://trends.naver.com/keyword/${encodeURIComponent(keyword)}`,
      title: `${keyword} 검색 트렌드 상승`,
      caption: `${keyword} 관련 검색량이 증가하고 있습니다`,
      hashtags: [keyword.replace(' ', ''), '트렌드'],
      views: Math.floor(Math.random() * 1000), // 검색량을 views로 대체
      likes: 0,
      comments: 0,
      published_at: new Date(),
      features: {
        // 트렌드 키워드는 프롬프트 변수로만 활용
      }
    }
    signals.push(signal)
  }

  return signals
}

/**
 * 검색 쿼리 생성 (씨앗 + 모디파이어 조합)
 */
function generateSearchQueries(): string[] {
  const queries: string[] = []

  // 우리 키워드 마스터에서 상위 모디파이어 가져오기 (Mock)
  const modifiers = ['키즈풀', '가족', '브라이덜파티', '워크샵', '스파', '바베큐']

  for (const seed of SEED_TAGS) {
    for (const region of REGION_TAGS.slice(0, 4)) { // 지역 4개만
      for (const modifier of modifiers.slice(0, 3)) { // 모디파이어 3개만
        queries.push(`${region} ${seed} ${modifier}`)
      }
    }
  }

  return queries.slice(0, 20) // 최대 20개 쿼리
}

/**
 * 유틸리티 함수들
 */
function getWeekAgoISO(): string {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return weekAgo.toISOString()
}

function parseDuration(duration: string): number {
  // PT30S → 30초, PT1M30S → 90초
  const match = duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const minutes = parseInt(match[1] || '0')
  const seconds = parseInt(match[2] || '0')
  return minutes * 60 + seconds
}

function extractHashtags(text: string): string[] {
  const hashtags = text.match(/#[\w가-힣]+/g) || []
  return hashtags.slice(0, 10) // 최대 10개
}

function estimateCuts(duration: number): number {
  // 평균 4초당 1컷으로 추정
  return Math.ceil(duration / 4)
}

function inferColorTone(text: string): 'warm' | 'cool' | 'neutral' {
  const warmKeywords = ['따뜻', '아늑', '감성', '일몰', '골든아워', '힐링']
  const coolKeywords = ['시원', '바다', '오션', '블루', '상쾌']

  const lowerText = text.toLowerCase()

  if (warmKeywords.some(kw => lowerText.includes(kw))) return 'warm'
  if (coolKeywords.some(kw => lowerText.includes(kw))) return 'cool'
  return 'neutral'
}

function containsPeopleKeywords(text: string): boolean {
  const peopleKeywords = ['가족', '아이', '커플', '친구', '모임', '파티', '사람']
  return peopleKeywords.some(kw => text.includes(kw))
}

function inferBgmTempo(text: string): 'upbeat' | 'chill' | 'dramatic' {
  const upbeatKeywords = ['신나는', '활기', '파티', '축제', '즐거운']
  const chillKeywords = ['힐링', '휴식', '편안', '여유', '조용한']
  const dramaticKeywords = ['감동', '특별한', '럭셔리', '프리미엄']

  if (upbeatKeywords.some(kw => text.includes(kw))) return 'upbeat'
  if (chillKeywords.some(kw => text.includes(kw))) return 'chill'
  if (dramaticKeywords.some(kw => text.includes(kw))) return 'dramatic'

  return 'chill' // 기본값
}

/**
 * 수집된 시그널을 DB에 저장
 */
async function saveTrendSignals(signals: TrendSignal[]): Promise<void> {
  try {
    const supabase = createClient()

    // 기존 이번 주 데이터 삭제
    const weekStart = getWeekStartDate()
    await supabase
      .from('trend_signals')
      .delete()
      .gte('collected_at', weekStart.toISOString())

    // 새 데이터 삽입
    const insertData = signals.map(signal => ({
      platform: signal.platform,
      category: signal.category,
      url: signal.url,
      title: signal.title,
      caption: signal.caption,
      hashtags: signal.hashtags,
      duration_sec: signal.duration_sec,
      views: signal.views,
      likes: signal.likes,
      comments: signal.comments,
      published_at: signal.published_at.toISOString(),
      features: signal.features,
      collected_at: new Date().toISOString()
    }))

    const { error } = await supabase
      .from('trend_signals')
      .insert(insertData)

    if (error) {
      console.error('[TREND_COLLECTOR] DB 저장 실패:', error)
    } else {
      console.log(`[TREND_COLLECTOR] DB 저장 완료: ${signals.length}개`)
    }

  } catch (error) {
    console.error('[TREND_COLLECTOR] DB 저장 오류:', error)
  }
}

/**
 * 이번 주 시작일 계산 (월요일)
 */
function getWeekStartDate(): Date {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0: 일요일, 1: 월요일
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // 월요일 기준

  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - daysToSubtract)
  weekStart.setHours(0, 0, 0, 0)

  return weekStart
}

// Export shim for build compatibility
export function collectTrendsFromPlatforms() {
  return null
}