// AI 기반 콘텐츠 스튜디오 시스템

interface ContentTemplate {
  id: string
  type: 'social_post' | 'blog_article' | 'email_campaign' | 'ad_copy' | 'review_response'
  platform: 'instagram' | 'facebook' | 'naver_blog' | 'kakao' | 'email' | 'sms' | 'general'
  title: string
  description: string
  targetAudience: string[]
  tone: 'friendly' | 'professional' | 'trendy' | 'luxurious' | 'family_oriented'
  template: string
  variables: string[]
  tags: string[]
}

interface ContentSuggestion {
  id: string
  title: string
  content: string
  platform: string
  contentType: string
  targetAudience: string
  tone: string
  hashtags: string[]
  callToAction: string
  bestPostingTime: string
  engagementPrediction: string
  topics: string[]
  seasonalRelevance: number
  trendScore: number
  difficulty: 'easy' | 'medium' | 'hard'
}

interface ContentCalendar {
  date: string
  contentType: string
  platform: string
  theme: string
  suggestedContent: string
  priority: 'high' | 'medium' | 'low'
  seasonalEvent?: string
  weatherContext?: string
}

interface AIContentGenerator {
  generateSocialPost(theme: string, platform: string, audience: string): Promise<string>
  generateBlogArticle(topic: string, keywords: string[]): Promise<string>
  generateEmailCampaign(purpose: string, audience: string): Promise<string>
  generateReviewResponse(reviewContent: string, sentiment: 'positive' | 'negative' | 'neutral'): Promise<string>
}

class ContentStudio implements AIContentGenerator {
  private templates: ContentTemplate[] = []

  constructor() {
    this.initializeTemplates()
  }

  // 메인 콘텐츠 제안 함수
  async generateContentSuggestions(
    accommodationName: string,
    city: string,
    region: string,
    accommodationType: string,
    targetAudiences: string[] = ['families', 'couples', 'friends']
  ): Promise<{
    contentSuggestions: ContentSuggestion[]
    contentCalendar: ContentCalendar[]
    templates: ContentTemplate[]
    aiInsights: any
    performancePredictions: any
    trendsAnalysis: any
  }> {
    try {
      // 1. 현재 트렌드 분석
      const trendsData = await this.analyzeTrends(city, accommodationType)

      // 2. 계절/날씨 기반 콘텐츠 제안
      const seasonalSuggestions = this.generateSeasonalContent(accommodationName, city, region)

      // 3. 플랫폼별 콘텐츠 제안
      const platformSuggestions = await this.generatePlatformContent(
        accommodationName, city, accommodationType, targetAudiences
      )

      // 4. AI 기반 콘텐츠 생성
      const aiGeneratedContent = await this.generateAIContent(
        accommodationName, city, region, accommodationType
      )

      // 5. 콘텐츠 캘린더 생성
      const contentCalendar = this.generateContentCalendar(accommodationName, city)

      // 6. 성과 예측 분석
      const performancePredictions = this.predictContentPerformance(
        [...seasonalSuggestions, ...platformSuggestions, ...aiGeneratedContent]
      )

      const allSuggestions = [
        ...seasonalSuggestions,
        ...platformSuggestions,
        ...aiGeneratedContent
      ].slice(0, 12) // 상위 12개

      return {
        contentSuggestions: allSuggestions,
        contentCalendar,
        templates: this.templates,
        aiInsights: {
          trendingTopics: trendsData.trendingTopics,
          bestPostingTimes: this.getOptimalPostingTimes(),
          contentGaps: this.identifyContentGaps(allSuggestions),
          audienceInsights: this.analyzeAudiencePreferences(targetAudiences)
        },
        performancePredictions,
        trendsAnalysis: trendsData
      }

    } catch (error) {
      console.warn('콘텐츠 생성 오류, Mock 데이터 사용:', error)
      return this.getMockContentSuggestions(accommodationName, city, region, accommodationType)
    }
  }

  // 트렌드 분석
  private async analyzeTrends(city: string, type: string): Promise<any> {
    // 실제로는 네이버 트렌드, 구글 트렌드 API 활용
    const currentSeason = this.getCurrentSeason()

    return {
      trendingTopics: [
        `${city}여행`,
        `${currentSeason}휴가`,
        '워케이션',
        '힐링여행',
        `${type}추천`
      ],
      popularHashtags: [
        `#${city}`,
        `#${city}여행`,
        '#힐링',
        '#휴식',
        '#자연',
        '#펜션',
        '#여행스타그램'
      ],
      competitorContent: this.getCompetitorContentTrends(),
      seasonalKeywords: this.getSeasonalKeywords(currentSeason),
      trendScore: Math.floor(Math.random() * 30) + 70 // 70-100
    }
  }

  // 계절별 콘텐츠 생성
  private generateSeasonalContent(name: string, city: string, region: string): ContentSuggestion[] {
    const season = this.getCurrentSeason()
    const seasonalTemplates = this.getSeasonalTemplates(season)

    return seasonalTemplates.map((template, index) => ({
      id: `seasonal_${index}`,
      title: template.title.replace('{name}', name).replace('{city}', city),
      content: this.generateContentFromTemplate(template, { name, city, region }),
      platform: 'instagram',
      contentType: 'social_post',
      targetAudience: '가족, 커플',
      tone: 'friendly',
      hashtags: [`#${city}여행`, `#${season}`, '#힐링', '#휴식'],
      callToAction: '지금 예약하고 특별한 추억을 만드세요!',
      bestPostingTime: '오후 7-9시',
      engagementPrediction: `${Math.floor(Math.random() * 20) + 80}% 참여율`,
      topics: [season, '자연', '휴식'],
      seasonalRelevance: 95,
      trendScore: Math.floor(Math.random() * 20) + 75,
      difficulty: 'easy'
    }))
  }

  // 플랫폼별 콘텐츠 생성
  private async generatePlatformContent(
    name: string,
    city: string,
    type: string,
    audiences: string[]
  ): Promise<ContentSuggestion[]> {
    const platforms = ['instagram', 'facebook', 'naver_blog', 'kakao']
    const suggestions: ContentSuggestion[] = []

    for (const platform of platforms) {
      const platformTemplate = this.getPlatformTemplate(platform, type)

      suggestions.push({
        id: `platform_${platform}_${Math.random().toString(36).substr(2, 5)}`,
        title: `${platform} 전용 ${name} 홍보 콘텐츠`,
        content: await this.generateContentForPlatform(platform, name, city, type),
        platform,
        contentType: 'social_post',
        targetAudience: audiences.join(', '),
        tone: this.getPlatformTone(platform),
        hashtags: this.getPlatformHashtags(platform, city),
        callToAction: this.getPlatformCTA(platform),
        bestPostingTime: this.getOptimalTime(platform),
        engagementPrediction: `${Math.floor(Math.random() * 25) + 75}% 참여율`,
        topics: [city, type, '휴식'],
        seasonalRelevance: 80,
        trendScore: Math.floor(Math.random() * 15) + 75,
        difficulty: 'medium'
      })
    }

    return suggestions
  }

  // AI 기반 콘텐츠 생성
  private async generateAIContent(
    name: string,
    city: string,
    region: string,
    type: string
  ): Promise<ContentSuggestion[]> {
    const aiPrompts = [
      `${city} ${name}의 매력적인 인스타그램 포스트`,
      `${region} 지역 특색을 살린 블로그 글`,
      `${type} 예약을 유도하는 이메일 캠페인`,
      '고객 후기에 대한 따뜻한 답글',
      '가을 단풍시즌 특별 프로모션'
    ]

    const aiContent = await Promise.all(
      aiPrompts.map(async (prompt, index) => {
        const content = await this.generateAIContentFromPrompt(prompt, { name, city, region, type })

        return {
          id: `ai_${index}`,
          title: prompt,
          content,
          platform: 'general',
          contentType: this.getContentTypeFromPrompt(prompt),
          targetAudience: '전체',
          tone: 'friendly',
          hashtags: this.generateRelevantHashtags(city, type),
          callToAction: this.generateSmartCTA(prompt),
          bestPostingTime: '오후 6-8시',
          engagementPrediction: `${Math.floor(Math.random() * 30) + 85}% 참여율`,
          topics: [city, type, '여행'],
          seasonalRelevance: 85,
          trendScore: Math.floor(Math.random() * 20) + 80,
          difficulty: 'easy'
        }
      })
    )

    return aiContent
  }

  // 콘텐츠 캘린더 생성
  private generateContentCalendar(name: string, city: string): ContentCalendar[] {
    const calendar: ContentCalendar[] = []
    const today = new Date()

    for (let i = 0; i < 14; i++) { // 2주간
      const date = new Date(today)
      date.setDate(today.getDate() + i)

      calendar.push({
        date: date.toISOString().split('T')[0],
        contentType: this.getContentTypeForDay(i),
        platform: this.getPlatformForDay(i),
        theme: this.getThemeForDay(i, city),
        suggestedContent: this.getSuggestedContentForDay(i, name, city),
        priority: this.getPriorityForDay(i),
        seasonalEvent: this.getSeasonalEventForDate(date),
        weatherContext: this.getWeatherContextForDate(date)
      })
    }

    return calendar
  }

  // 성과 예측
  private predictContentPerformance(suggestions: ContentSuggestion[]): any {
    return {
      topPerformers: suggestions
        .sort((a, b) => b.trendScore - a.trendScore)
        .slice(0, 3)
        .map(s => ({
          title: s.title,
          predictedEngagement: s.engagementPrediction,
          platform: s.platform
        })),

      platformAnalysis: {
        instagram: { expectedReach: '500-1200명', engagement: '8-12%' },
        facebook: { expectedReach: '300-800명', engagement: '5-8%' },
        naver_blog: { expectedReach: '200-600명', engagement: '15-25%' },
        kakao: { expectedReach: '400-1000명', engagement: '6-10%' }
      },

      contentTypePerformance: {
        social_post: 'High engagement, Quick impact',
        blog_article: 'SEO benefit, Long-term traffic',
        email_campaign: 'Direct conversion, High ROI',
        review_response: 'Reputation building, Trust increase'
      },

      timeBasedPredictions: {
        bestDays: ['금요일', '토요일', '일요일'],
        bestTimes: ['오후 6-8시', '오후 9-10시'],
        seasonalPeaks: '10월 중순 (단풍시즌), 12월 말 (연말휴가)'
      }
    }
  }

  // AI 콘텐츠 생성 인터페이스 구현
  async generateSocialPost(theme: string, platform: string, audience: string): Promise<string> {
    // 실제로는 OpenAI, Claude API 등 사용
    const templates = {
      instagram: `🌟 ${theme}을 만끽할 수 있는 특별한 공간 ✨

📍 완벽한 힐링을 위한 모든 것이 준비되어 있어요!
${audience === 'families' ? '👨‍👩‍👧‍👦 가족과 함께하는 소중한 시간' : '💕 연인과 함께하는 로맨틱한 순간'}

#힐링 #휴식 #여행스타그램 #감성숙소`,

      facebook: `${theme} 테마로 준비된 특별한 공간을 소개합니다.

${audience}을 위한 완벽한 시설과 서비스가 기다리고 있어요.
지금 예약하고 잊지 못할 추억을 만들어보세요!`,

      naver_blog: `${theme} | 완벽한 힐링을 위한 숙소 추천

안녕하세요! 오늘은 ${theme}을 주제로 한 특별한 숙소를 소개해드리려고 해요.
${audience}분들께 특히 추천드리고 싶은 이유가 있답니다...`,

      kakao: `✨ ${theme} 특별 기획 ✨
${audience} 맞춤 서비스 준비완료!
지금 예약시 특가 혜택까지 🎁`
    }

    return templates[platform as keyof typeof templates] || templates.instagram
  }

  async generateBlogArticle(topic: string, keywords: string[]): Promise<string> {
    return `${topic} | 완벽 가이드

${keywords.join(', ')}에 대해 자세히 알아보겠습니다.

1. ${topic}의 매력
2. 추천 이유
3. 특별한 경험
4. 예약 안내

자세한 내용은 계속해서 읽어보세요...`
  }

  async generateEmailCampaign(purpose: string, audience: string): Promise<string> {
    return `제목: ${purpose} - ${audience}을 위한 특별 혜택

안녕하세요!

${audience}분들을 위해 특별히 준비한 ${purpose} 이벤트를 소개합니다.

✅ 특별 할인가
✅ 무료 부대시설 이용
✅ 체크아웃 연장 서비스

지금 예약하고 특별한 혜택을 받아보세요!`
  }

  async generateReviewResponse(reviewContent: string, sentiment: 'positive' | 'negative' | 'neutral'): Promise<string> {
    const responses = {
      positive: `소중한 후기 감사합니다! 😊

저희 숙소에서 즐거운 시간 보내셨다니 정말 기쁩니다. 앞으로도 더욱 좋은 서비스로 보답하겠습니다. 다음에도 꼭 방문해주세요!`,

      negative: `귀중한 의견 감사드립니다.

불편을 끼쳐드려 진심으로 죄송합니다. 말씀해주신 부분은 즉시 개선하여 다시는 이런 일이 없도록 하겠습니다. 기회가 되신다면 다음에 더 나은 모습으로 뵙고 싶습니다.`,

      neutral: `후기 남겨주셔서 감사합니다.

저희 숙소를 이용해주셔서 감사합니다. 더 나은 서비스 제공을 위해 지속적으로 노력하겠습니다. 다음 방문 시에는 더욱 만족스러운 경험을 선사해드릴게요!`
    }

    return responses[sentiment]
  }

  // 템플릿 초기화
  private initializeTemplates(): void {
    this.templates = [
      {
        id: 'social_basic',
        type: 'social_post',
        platform: 'instagram',
        title: '기본 소셜 포스트',
        description: '일반적인 숙소 홍보 포스트',
        targetAudience: ['all'],
        tone: 'friendly',
        template: '🌟 {name}에서 특별한 시간을 보내세요! ✨\n\n📍 {city}의 완벽한 힐링 공간\n{content}\n\n#힐링 #휴식 #{city}',
        variables: ['name', 'city', 'content'],
        tags: ['홍보', '기본']
      },
      {
        id: 'season_autumn',
        type: 'social_post',
        platform: 'instagram',
        title: '가을 시즌 포스트',
        description: '가을 분위기 특화 포스트',
        targetAudience: ['couples', 'friends'],
        tone: 'friendly',
        template: '🍂 가을 정취 가득한 {name} 🍁\n\n단풍이 물든 {city}에서\n따뜻한 차 한 잔과 함께하는 힐링타임 ☕\n\n#가을여행 #단풍 #{city}',
        variables: ['name', 'city'],
        tags: ['계절', '가을']
      }
    ]
  }

  // 유틸리티 함수들
  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1
    if (month >= 3 && month <= 5) return '봄'
    if (month >= 6 && month <= 8) return '여름'
    if (month >= 9 && month <= 11) return '가을'
    return '겨울'
  }

  private getSeasonalTemplates(season: string): any[] {
    const templates: { [key: string]: any[] } = {
      '봄': [
        { title: '봄맞이 {name} 특별 이벤트', content: '벚꽃과 함께하는 힐링' },
        { title: '{city} 봄나들이의 완벽한 마무리', content: '봄 향기 가득한 공간' }
      ],
      '여름': [
        { title: '시원한 여름휴가는 {name}에서', content: '무더위를 식혀주는 특별한 공간' },
        { title: '{city} 여름밤의 추억', content: '별빛 아래서 즐기는 여름밤' }
      ],
      '가을': [
        { title: '가을 단풍과 함께하는 {name}', content: '단풍이 물든 자연 속에서' },
        { title: '{city} 가을 정취 만끽하기', content: '가을 감성 가득한 특별한 시간' }
      ],
      '겨울': [
        { title: '따뜻한 겨울휴가 {name}', content: '추위를 잊게 하는 따뜻한 공간' },
        { title: '{city} 겨울 풍경 속에서', content: '눈꽃과 함께하는 로맨틱한 시간' }
      ]
    }

    return templates[season] || templates['가을']
  }

  private generateContentFromTemplate(template: any, variables: { [key: string]: string }): string {
    let content = template.template
    template.variables.forEach((variable: string) => {
      const value = variables[variable] || `{${variable}}`
      content = content.replace(new RegExp(`{${variable}}`, 'g'), value)
    })
    return content
  }

  private getPlatformTemplate(platform: string, type: string): any {
    // 플랫폼별 템플릿 반환 로직
    return { content: `${platform} 전용 ${type} 콘텐츠 템플릿` }
  }

  private async generateContentForPlatform(platform: string, name: string, city: string, type: string): Promise<string> {
    return this.generateSocialPost(`${name} ${type}`, platform, 'all')
  }

  private getPlatformTone(platform: string): string {
    const tones: { [key: string]: string } = {
      instagram: 'trendy',
      facebook: 'friendly',
      naver_blog: 'professional',
      kakao: 'friendly'
    }
    return tones[platform] || 'friendly'
  }

  private getPlatformHashtags(platform: string, city: string): string[] {
    const hashtags: { [key: string]: string[] } = {
      instagram: [`#${city}`, '#여행스타그램', '#힐링', '#휴식'],
      facebook: [`#${city}여행`, '#펜션', '#힐링'],
      naver_blog: [`#${city}`, '#여행', '#펜션추천'],
      kakao: [`#${city}`, '#힐링', '#특가']
    }
    return hashtags[platform] || hashtags.instagram
  }

  private getPlatformCTA(platform: string): string {
    const ctas: { [key: string]: string } = {
      instagram: '스토리로 더 많은 사진 보기! 👆',
      facebook: '지금 예약하고 특별 혜택 받으세요!',
      naver_blog: '자세한 정보는 블로그에서 확인하세요',
      kakao: '채팅으로 실시간 예약 상담 받기'
    }
    return ctas[platform] || '지금 예약하기!'
  }

  private getOptimalTime(platform: string): string {
    const times: { [key: string]: string } = {
      instagram: '오후 6-8시',
      facebook: '오후 7-9시',
      naver_blog: '오후 2-4시',
      kakao: '오후 8-10시'
    }
    return times[platform] || '오후 7-9시'
  }

  private getOptimalPostingTimes(): { [key: string]: string } {
    return {
      평일: '오후 6-8시',
      주말: '오후 2-4시, 저녁 7-9시',
      최고성과: '금요일 오후 7시, 일요일 오후 3시'
    }
  }

  private identifyContentGaps(suggestions: ContentSuggestion[]): string[] {
    const gaps = []
    const platforms = suggestions.map(s => s.platform)
    const contentTypes = suggestions.map(s => s.contentType)

    if (!platforms.includes('naver_blog')) gaps.push('네이버 블로그 콘텐츠 부족')
    if (!contentTypes.includes('email_campaign')) gaps.push('이메일 마케팅 콘텐츠 필요')
    if (suggestions.filter(s => s.tone === 'luxurious').length === 0) gaps.push('프리미엄 톤앤매너 콘텐츠')

    return gaps
  }

  private analyzeAudiencePreferences(audiences: string[]): any {
    return {
      families: {
        preferredContent: '안전성, 편의시설, 체험활동',
        bestPlatforms: ['facebook', 'naver_blog'],
        engagementTips: '가족사진, 키즈존, 안전시설 강조'
      },
      couples: {
        preferredContent: '로맨틱, 프라이버시, 감성',
        bestPlatforms: ['instagram', 'kakao'],
        engagementTips: '감성사진, 커플패키지, 특별한 순간'
      },
      friends: {
        preferredContent: '즐거움, 액티비티, 추억',
        bestPlatforms: ['instagram', 'facebook'],
        engagementTips: '그룹활동, 파티공간, 재미있는 경험'
      }
    }
  }

  private async generateAIContentFromPrompt(prompt: string, context: any): Promise<string> {
    // 실제로는 AI API 호출
    return `AI 생성: ${prompt}

${context.name}은 ${context.city}에 위치한 특별한 ${context.type}입니다.
자연과 함께하는 힐링의 시간을 만들어보세요.

#${context.city} #힐링 #휴식`
  }

  private getContentTypeFromPrompt(prompt: string): string {
    if (prompt.includes('인스타그램') || prompt.includes('포스트')) return 'social_post'
    if (prompt.includes('블로그')) return 'blog_article'
    if (prompt.includes('이메일')) return 'email_campaign'
    if (prompt.includes('답글')) return 'review_response'
    return 'social_post'
  }

  private generateRelevantHashtags(city: string, type: string): string[] {
    return [`#${city}`, `#${type}`, '#힐링', '#여행', '#휴식', '#자연']
  }

  private generateSmartCTA(prompt: string): string {
    if (prompt.includes('인스타그램')) return '스토리 확인하고 더 많은 정보 받기!'
    if (prompt.includes('이메일')) return '지금 예약하고 특별 혜택 받으세요!'
    if (prompt.includes('답글')) return '다음에도 방문해주세요!'
    return '지금 예약하기!'
  }

  // 콘텐츠 캘린더 관련 함수들
  private getContentTypeForDay(dayIndex: number): string {
    const types = ['social_post', 'blog_article', 'email_campaign', 'review_response']
    return types[dayIndex % types.length]
  }

  private getPlatformForDay(dayIndex: number): string {
    const platforms = ['instagram', 'facebook', 'naver_blog', 'kakao']
    return platforms[dayIndex % platforms.length]
  }

  private getThemeForDay(dayIndex: number, city: string): string {
    const themes = [
      `${city} 힐링`,
      '자연 속 휴식',
      '특별한 경험',
      '가족 시간',
      '커플 여행',
      '친구들과의 추억',
      '계절 특화'
    ]
    return themes[dayIndex % themes.length]
  }

  private getSuggestedContentForDay(dayIndex: number, name: string, city: string): string {
    return `${name}의 매력을 담은 ${this.getThemeForDay(dayIndex, city)} 콘텐츠`
  }

  private getPriorityForDay(dayIndex: number): 'high' | 'medium' | 'low' {
    if (dayIndex % 7 === 4 || dayIndex % 7 === 5) return 'high' // 금, 토
    if (dayIndex % 7 === 6) return 'medium' // 일
    return 'low'
  }

  private getSeasonalEventForDate(date: Date): string | undefined {
    const month = date.getMonth() + 1
    const day = date.getDate()

    if (month === 10 && day >= 10 && day <= 25) return '단풍시즌'
    if (month === 12 && day >= 20) return '연말시즌'
    if (month === 1 && day <= 10) return '신정연휴'

    return undefined
  }

  private getWeatherContextForDate(date: Date): string | undefined {
    // 실제로는 날씨 API 연동
    const contexts = ['맑음', '구름많음', '비', '눈']
    return contexts[Math.floor(Math.random() * contexts.length)]
  }

  private getCompetitorContentTrends(): string[] {
    return [
      '감성적인 사진과 스토리텔링',
      '고객 후기 활용 콘텐츠',
      '계절별 특화 이벤트',
      '인플루언서 협업',
      '실시간 날씨 연계 프로모션'
    ]
  }

  private getSeasonalKeywords(season: string): string[] {
    const keywords: { [key: string]: string[] } = {
      '봄': ['벚꽃', '나들이', '피크닉', '따뜻한'],
      '여름': ['시원한', '수영', '바베큐', '휴가'],
      '가을': ['단풍', '선선한', '감성', '힐링'],
      '겨울': ['따뜻한', '온천', '눈', '포근한']
    }
    return keywords[season] || keywords['가을']
  }

  // Mock 데이터
  private getMockContentSuggestions(name: string, city: string, region: string, type: string): any {
    return {
      contentSuggestions: [
        {
          id: 'mock_1',
          title: `${city} 가을 감성 인스타그램 포스트`,
          content: `🍂 ${name}에서 만나는 가을의 정취 🍁\n\n단풍이 물든 ${city}에서 특별한 시간을 보내세요`,
          platform: 'instagram',
          contentType: 'social_post',
          targetAudience: '커플, 친구',
          tone: 'friendly',
          hashtags: [`#${city}`, '#가을여행', '#힐링'],
          callToAction: '지금 예약하기!',
          bestPostingTime: '오후 7-9시',
          engagementPrediction: '85% 참여율',
          topics: ['가을', '감성', '힐링'],
          seasonalRelevance: 95,
          trendScore: 88,
          difficulty: 'easy'
        }
      ],
      contentCalendar: [
        {
          date: new Date().toISOString().split('T')[0],
          contentType: 'social_post',
          platform: 'instagram',
          theme: `${city} 힐링`,
          suggestedContent: `${name}의 매력을 담은 콘텐츠`,
          priority: 'high',
          seasonalEvent: '가을시즌'
        }
      ],
      templates: this.templates,
      aiInsights: {
        trendingTopics: [`${city}여행`, '가을휴가', '힐링'],
        bestPostingTimes: { 평일: '오후 6-8시', 주말: '오후 2-4시' },
        contentGaps: ['네이버 블로그 콘텐츠 부족'],
        audienceInsights: {}
      },
      performancePredictions: {},
      trendsAnalysis: {}
    }
  }
}

// 싱글톤 인스턴스
let contentStudio: ContentStudio | null = null

export function getContentStudio(): ContentStudio {
  if (!contentStudio) {
    contentStudio = new ContentStudio()
  }
  return contentStudio
}

export type {
  ContentSuggestion,
  ContentTemplate,
  ContentCalendar,
  AIContentGenerator
}