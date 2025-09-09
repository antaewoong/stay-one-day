// 마케팅 분석을 위한 사용자 행동 추적 유틸리티

interface SessionData {
  sessionId: string
  userId?: string
  startTime: number
  pageViews: number
  lastActivity: number
  entryPage: string
  referrer: string
  utmParams: {
    source?: string
    medium?: string
    campaign?: string
    content?: string
    term?: string
  }
}

interface JourneyEvent {
  sessionId: string
  userId?: string
  eventType: 'page_view' | 'click' | 'form_submit' | 'conversion'
  pagePath: string
  pageTitle: string
  elementId?: string
  elementClass?: string
  elementText?: string
  timeOnPage?: number
  scrollDepth?: number
  conversionType?: string
  conversionValue?: number
}

class AnalyticsTracker {
  private sessionData: SessionData | null = null
  private pageStartTime: number = 0
  private maxScrollDepth: number = 0
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeSession()
      this.setupEventListeners()
      this.startHeartbeat()
    }
  }

  // 세션 초기화
  private initializeSession() {
    const urlParams = new URLSearchParams(window.location.search)
    
    this.sessionData = {
      sessionId: this.generateSessionId(),
      userId: this.getCurrentUserId(),
      startTime: Date.now(),
      pageViews: 1,
      lastActivity: Date.now(),
      entryPage: window.location.pathname,
      referrer: document.referrer || 'direct',
      utmParams: {
        source: urlParams.get('utm_source') || undefined,
        medium: urlParams.get('utm_medium') || undefined,
        campaign: urlParams.get('utm_campaign') || undefined,
        content: urlParams.get('utm_content') || undefined,
        term: urlParams.get('utm_term') || undefined
      }
    }

    this.pageStartTime = Date.now()
    this.maxScrollDepth = 0

    // 첫 페이지 뷰 이벤트 추적
    this.trackPageView()
  }

  // 이벤트 리스너 설정
  private setupEventListeners() {
    // 스크롤 추적
    let ticking = false
    const updateScroll = () => {
      const scrollTop = window.pageYOffset
      const docHeight = document.body.scrollHeight - window.innerHeight
      const scrollPercent = Math.round((scrollTop / docHeight) * 100)
      
      if (scrollPercent > this.maxScrollDepth) {
        this.maxScrollDepth = Math.min(scrollPercent, 100)
      }
      ticking = false
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateScroll)
        ticking = true
      }
    })

    // 클릭 추적
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.onclick) {
        this.trackClick(target)
      }
    })

    // 폼 제출 추적
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement
      this.trackFormSubmit(form)
    })

    // 페이지 이탈 시 데이터 전송
    window.addEventListener('beforeunload', () => {
      this.sendPageData()
    })

    // Visibility API로 탭 전환 감지
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.sendPageData()
      } else {
        this.pageStartTime = Date.now()
        this.sessionData!.lastActivity = Date.now()
      }
    })
  }

  // 하트비트로 세션 유지
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.sessionData) {
        this.sessionData.lastActivity = Date.now()
        this.sendSessionData()
      }
    }, 30000) // 30초마다
  }

  // 페이지뷰 추적
  trackPageView() {
    if (!this.sessionData) return

    const event: JourneyEvent = {
      sessionId: this.sessionData.sessionId,
      userId: this.sessionData.userId,
      eventType: 'page_view',
      pagePath: window.location.pathname,
      pageTitle: document.title,
      timeOnPage: 0,
      scrollDepth: 0
    }

    this.sendJourneyEvent(event)
    
    // 페이지뷰 카운트 증가
    this.sessionData.pageViews += 1
  }

  // 클릭 이벤트 추적
  private trackClick(element: HTMLElement) {
    if (!this.sessionData) return

    const event: JourneyEvent = {
      sessionId: this.sessionData.sessionId,
      userId: this.sessionData.userId,
      eventType: 'click',
      pagePath: window.location.pathname,
      pageTitle: document.title,
      elementId: element.id || undefined,
      elementClass: element.className || undefined,
      elementText: element.textContent?.slice(0, 100) || undefined,
      timeOnPage: Math.floor((Date.now() - this.pageStartTime) / 1000),
      scrollDepth: this.maxScrollDepth
    }

    this.sendJourneyEvent(event)
  }

  // 폼 제출 추적
  private trackFormSubmit(form: HTMLFormElement) {
    if (!this.sessionData) return

    const formData: any = {}
    const formElements = form.elements
    
    for (let i = 0; i < formElements.length; i++) {
      const element = formElements[i] as HTMLInputElement
      if (element.name && element.type !== 'password') {
        formData[element.name] = element.value
      }
    }

    const event: JourneyEvent = {
      sessionId: this.sessionData.sessionId,
      userId: this.sessionData.userId,
      eventType: 'form_submit',
      pagePath: window.location.pathname,
      pageTitle: document.title,
      elementId: form.id || undefined,
      timeOnPage: Math.floor((Date.now() - this.pageStartTime) / 1000),
      scrollDepth: this.maxScrollDepth
    }

    this.sendJourneyEvent(event)
  }

  // 전환 이벤트 추적 (예약, 문의 등)
  trackConversion(type: string, value?: number) {
    if (!this.sessionData) return

    const event: JourneyEvent = {
      sessionId: this.sessionData.sessionId,
      userId: this.sessionData.userId,
      eventType: 'conversion',
      pagePath: window.location.pathname,
      pageTitle: document.title,
      conversionType: type,
      conversionValue: value,
      timeOnPage: Math.floor((Date.now() - this.pageStartTime) / 1000),
      scrollDepth: this.maxScrollDepth
    }

    this.sendJourneyEvent(event)

    // 세션에 전환 플래그 설정
    if (this.sessionData) {
      this.sendSessionData(true, value)
    }
  }

  // 현재 페이지 데이터 전송
  private sendPageData() {
    if (!this.sessionData) return

    const timeOnPage = Math.floor((Date.now() - this.pageStartTime) / 1000)
    
    const event: JourneyEvent = {
      sessionId: this.sessionData.sessionId,
      userId: this.sessionData.userId,
      eventType: 'page_view',
      pagePath: window.location.pathname,
      pageTitle: document.title,
      timeOnPage,
      scrollDepth: this.maxScrollDepth
    }

    this.sendJourneyEvent(event)
  }

  // 세션 데이터 전송
  private async sendSessionData(converted: boolean = false, conversionValue?: number) {
    if (!this.sessionData) return

    const sessionDuration = Math.floor((Date.now() - this.sessionData.startTime) / 1000)
    const bounce = this.sessionData.pageViews === 1 && sessionDuration < 30

    const payload = {
      sessionId: this.sessionData.sessionId,
      userId: this.sessionData.userId,
      entryPage: this.sessionData.entryPage,
      referrer: this.sessionData.referrer,
      utmSource: this.sessionData.utmParams.source,
      utmMedium: this.sessionData.utmParams.medium,
      utmCampaign: this.sessionData.utmParams.campaign,
      utmContent: this.sessionData.utmParams.content,
      utmTerm: this.sessionData.utmParams.term,
      pageViews: this.sessionData.pageViews,
      sessionDuration,
      bounce,
      converted,
      conversionValue: conversionValue || 0
    }

    try {\n      await fetch('/api/analytics/sessions', {\n        method: 'POST',\n        headers: {\n          'Content-Type': 'application/json'\n        },\n        body: JSON.stringify(payload)\n      })\n    } catch (error) {\n      console.error('세션 데이터 전송 실패:', error)\n    }\n  }\n\n  // 여정 이벤트 전송\n  private async sendJourneyEvent(event: JourneyEvent) {\n    try {\n      await fetch('/api/analytics/journey', {\n        method: 'POST',\n        headers: {\n          'Content-Type': 'application/json'\n        },\n        body: JSON.stringify(event)\n      })\n    } catch (error) {\n      console.error('여정 이벤트 전송 실패:', error)\n    }\n  }\n\n  // 유틸리티 함수들\n  private generateSessionId(): string {\n    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)\n  }\n\n  private getCurrentUserId(): string | undefined {\n    // 로그인한 사용자 ID 가져오기 (실제 구현에 따라 수정)\n    const userStr = sessionStorage.getItem('user') || localStorage.getItem('user')\n    if (userStr) {\n      try {\n        const user = JSON.parse(userStr)\n        return user.id\n      } catch {\n        return undefined\n      }\n    }\n    return undefined\n  }\n\n  // 정리\n  destroy() {\n    if (this.heartbeatInterval) {\n      clearInterval(this.heartbeatInterval)\n    }\n  }\n}\n\n// 전역 인스턴스\nlet analyticsTracker: AnalyticsTracker | null = null\n\n// 초기화 함수\nexport function initializeAnalytics() {\n  if (typeof window !== 'undefined' && !analyticsTracker) {\n    analyticsTracker = new AnalyticsTracker()\n  }\n  return analyticsTracker\n}\n\n// 전환 추적 함수 (외부에서 호출용)\nexport function trackConversion(type: string, value?: number) {\n  if (analyticsTracker) {\n    analyticsTracker.trackConversion(type, value)\n  }\n}\n\n// 페이지뷰 추적 함수 (라우터 변경 시 호출)\nexport function trackPageView() {\n  if (analyticsTracker) {\n    analyticsTracker.trackPageView()\n  }\n}\n\nexport default AnalyticsTracker"}, {"old_string": "      await fetch('/api/analytics/sessions', {\n        method: 'POST',\n        headers: {\n          'Content-Type': 'application/json'\n        },\n        body: JSON.stringify(payload)\n      })", "new_string": "      // Navigator.sendBeacon을 우선 사용 (페이지 이탈 시에도 안정적 전송)\n      if (navigator.sendBeacon) {\n        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })\n        navigator.sendBeacon('/api/analytics/sessions', blob)\n      } else {\n        await fetch('/api/analytics/sessions', {\n          method: 'POST',\n          headers: {\n            'Content-Type': 'application/json'\n          },\n          body: JSON.stringify(payload),\n          keepalive: true\n        })\n      }"}]