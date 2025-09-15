interface YouTubeSearchResult {
  kind: string
  etag: string
  id: {
    kind: string
    videoId: string
  }
  snippet: {
    publishedAt: string
    channelId: string
    title: string
    description: string
    thumbnails: {
      default: { url: string; width: number; height: number }
      medium: { url: string; width: number; height: number }
      high: { url: string; width: number; height: number }
    }
    channelTitle: string
    tags?: string[]
  }
}

interface YouTubeVideo {
  id: string
  title: string
  description: string
  channelTitle: string
  publishedAt: string
  thumbnailUrl: string
  tags: string[]
  viewCount?: number
  likeCount?: number
  commentCount?: number
  duration?: string
}

interface YouTubeTrendData {
  keyword: string
  totalVideos: number
  totalViews: number
  avgViewsPerVideo: number
  trendingVideos: YouTubeVideo[]
  relatedKeywords: string[]
  contentTypes: {
    shorts: number
    regular: number
  }
  topChannels: Array<{
    name: string
    videoCount: number
  }>
}

class YouTubeApiClient {
  private apiKey: string
  private baseUrl = 'https://www.googleapis.com/youtube/v3'

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY!

    if (!this.apiKey || this.apiKey === 'your_youtube_api_key_here') {
      console.warn('YouTube API 키가 설정되지 않았습니다. Mock 데이터를 사용합니다.')
    }
  }

  // 키워드로 쇼츠 영상 검색
  async searchShorts(
    keyword: string,
    maxResults: number = 50
  ): Promise<YouTubeSearchResult[]> {
    if (!this.apiKey || this.apiKey === 'your_youtube_api_key_here') {
      return this.getMockSearchResults(keyword, maxResults)
    }

    const url = new URL(`${this.baseUrl}/search`)
    url.searchParams.set('key', this.apiKey)
    url.searchParams.set('q', `${keyword} #shorts`)
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('type', 'video')
    url.searchParams.set('videoDuration', 'short') // 4분 이하
    url.searchParams.set('order', 'viewCount')
    url.searchParams.set('publishedAfter', this.getDateDaysAgo(30)) // 최근 30일
    url.searchParams.set('maxResults', maxResults.toString())

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`YouTube API 오류: ${response.status} - ${await response.text()}`)
    }

    const data = await response.json()
    return data.items || []
  }

  // 영상 상세 정보 조회
  async getVideoDetails(videoIds: string[]): Promise<Record<string, any>> {
    if (!this.apiKey || this.apiKey === 'your_youtube_api_key_here') {
      return this.getMockVideoDetails(videoIds)
    }

    if (videoIds.length === 0) return {}

    const url = new URL(`${this.baseUrl}/videos`)
    url.searchParams.set('key', this.apiKey)
    url.searchParams.set('id', videoIds.join(','))
    url.searchParams.set('part', 'statistics,contentDetails')

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`YouTube API 오류: ${response.status} - ${await response.text()}`)
    }

    const data = await response.json()
    const details: Record<string, any> = {}

    data.items?.forEach((item: any) => {
      details[item.id] = {
        viewCount: parseInt(item.statistics?.viewCount || '0'),
        likeCount: parseInt(item.statistics?.likeCount || '0'),
        commentCount: parseInt(item.statistics?.commentCount || '0'),
        duration: item.contentDetails?.duration || 'PT0M0S'
      }
    })

    return details
  }

  // 지역별 쇼츠 트렌드 분석
  async getLocationShortsData(
    city: string,
    region: string,
    accommodationType: string = '펜션'
  ): Promise<YouTubeTrendData[]> {
    const keywords = [
      `${city} 여행`,
      `${city} 맛집`,
      `${region} ${accommodationType}`,
      `${city} 데이트`,
      `${region} 체험`,
      `${city} 카페`,
      `${region} 액티비티`,
      `${city} 힐링`
    ]

    const results: YouTubeTrendData[] = []

    for (const keyword of keywords) {
      try {
        const searchResults = await this.searchShorts(keyword, 20)
        const videoIds = searchResults.map(r => r.id.videoId)
        const videoDetails = await this.getVideoDetails(videoIds)

        const trendingVideos: YouTubeVideo[] = searchResults.map(result => ({
          id: result.id.videoId,
          title: result.snippet.title,
          description: result.snippet.description,
          channelTitle: result.snippet.channelTitle,
          publishedAt: result.snippet.publishedAt,
          thumbnailUrl: result.snippet.thumbnails.medium.url,
          tags: result.snippet.tags || [],
          ...videoDetails[result.id.videoId]
        }))

        // 통계 계산
        const totalViews = trendingVideos.reduce((sum, video) => sum + (video.viewCount || 0), 0)
        const avgViewsPerVideo = trendingVideos.length > 0 ? totalViews / trendingVideos.length : 0

        // 채널별 집계
        const channelCount: Record<string, number> = {}
        trendingVideos.forEach(video => {
          channelCount[video.channelTitle] = (channelCount[video.channelTitle] || 0) + 1
        })

        const topChannels = Object.entries(channelCount)
          .map(([name, count]) => ({ name, videoCount: count }))
          .sort((a, b) => b.videoCount - a.videoCount)
          .slice(0, 5)

        // 쇼츠 vs 일반 영상 구분 (duration 기준)
        const shorts = trendingVideos.filter(v => this.isShorts(v.duration)).length
        const regular = trendingVideos.length - shorts

        results.push({
          keyword,
          totalVideos: trendingVideos.length,
          totalViews,
          avgViewsPerVideo: Math.round(avgViewsPerVideo),
          trendingVideos: trendingVideos.slice(0, 10), // 상위 10개만
          relatedKeywords: this.extractRelatedKeywords(trendingVideos),
          contentTypes: { shorts, regular },
          topChannels
        })

        // API 호출 간격 (rate limiting 방지)
        await this.sleep(200)

      } catch (error) {
        console.error(`키워드 "${keyword}" 처리 실패:`, error)
      }
    }

    return results.sort((a, b) => b.totalViews - a.totalViews)
  }

  // 관련 키워드 추출
  private extractRelatedKeywords(videos: YouTubeVideo[]): string[] {
    const allTags = videos.flatMap(v => v.tags || [])
    const tagCount: Record<string, number> = {}

    allTags.forEach(tag => {
      const normalizedTag = tag.toLowerCase().trim()
      if (normalizedTag.length > 1) {
        tagCount[normalizedTag] = (tagCount[normalizedTag] || 0) + 1
      }
    })

    return Object.entries(tagCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag)
  }

  // 쇼츠 영상 판별 (duration 기준)
  private isShorts(duration?: string): boolean {
    if (!duration) return false

    // ISO 8601 duration format: PT1M30S
    const match = duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return false

    const minutes = parseInt(match[1] || '0')
    const seconds = parseInt(match[2] || '0')
    const totalSeconds = minutes * 60 + seconds

    return totalSeconds <= 60 // 1분 이하를 쇼츠로 간주
  }

  // N일 전 날짜 (RFC 3339 형식)
  private getDateDaysAgo(days: number): string {
    const date = new Date()
    date.setDate(date.getDate() - days)
    return date.toISOString()
  }

  // Mock 데이터 생성 (API 키 없을 때)
  private getMockSearchResults(keyword: string, maxResults: number): YouTubeSearchResult[] {
    const mockData: YouTubeSearchResult[] = []

    for (let i = 0; i < Math.min(maxResults, 10); i++) {
      mockData.push({
        kind: 'youtube#searchResult',
        etag: 'mock_etag',
        id: {
          kind: 'youtube#video',
          videoId: `mock_video_${i}_${keyword.replace(/\s+/g, '_')}`
        },
        snippet: {
          publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          channelId: `mock_channel_${i}`,
          title: `${keyword} 관련 쇼츠 영상 ${i + 1}`,
          description: `${keyword}에 대한 재미있는 쇼츠 영상입니다.`,
          thumbnails: {
            default: { url: 'https://via.placeholder.com/120x90', width: 120, height: 90 },
            medium: { url: 'https://via.placeholder.com/320x180', width: 320, height: 180 },
            high: { url: 'https://via.placeholder.com/480x360', width: 480, height: 360 }
          },
          channelTitle: `여행채널${i + 1}`,
          tags: [keyword, '여행', '맛집', 'shorts']
        }
      })
    }

    return mockData
  }

  private getMockVideoDetails(videoIds: string[]): Record<string, any> {
    const details: Record<string, any> = {}

    videoIds.forEach(videoId => {
      details[videoId] = {
        viewCount: Math.floor(Math.random() * 100000) + 1000,
        likeCount: Math.floor(Math.random() * 5000) + 100,
        commentCount: Math.floor(Math.random() * 500) + 10,
        duration: 'PT45S' // 45초 (쇼츠)
      }
    })

    return details
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 싱글톤 인스턴스
let youtubeClient: YouTubeApiClient | null = null

export function getYouTubeClient(): YouTubeApiClient {
  if (!youtubeClient) {
    youtubeClient = new YouTubeApiClient()
  }
  return youtubeClient
}

export type { YouTubeTrendData, YouTubeVideo }

// Export shim
export function getYouTubeApiClient() {
  return null
}
