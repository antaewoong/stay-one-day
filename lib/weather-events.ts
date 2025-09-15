// 날씨 및 이벤트 기반 마케팅 제안 시스템

interface WeatherData {
  current: {
    temp: number
    condition: string
    humidity: number
    windSpeed: number
  }
  forecast: Array<{
    date: string
    temp_max: number
    temp_min: number
    condition: string
    precipitation: number
  }>
}

interface HolidayEvent {
  name: string
  date: string
  type: 'national' | 'seasonal' | 'custom'
  description: string
}

interface EventSuggestion {
  title: string
  description: string
  targetDate: string
  weatherCondition: string
  packageIdeas: string[]
  pricingStrategy: {
    baseMultiplier: number
    description: string
  }
  marketingAngle: string[]
  urgencyLevel: 'high' | 'medium' | 'low'
  estimatedDemandIncrease: string
}

class WeatherEventsClient {
  private weatherApiKey: string
  private holidayApiKey: string

  constructor() {
    // 이미 .env에 있는 공휴일 API 키 사용
    this.holidayApiKey = process.env.HOLIDAY_API_KEY!
    // 날씨 API는 OpenWeatherMap 또는 기상청 API 사용 (무료)
    this.weatherApiKey = process.env.OPENWEATHER_API_KEY || 'demo_key'
  }

  // 메인 함수: 숙소 기반 이벤트 제안
  async getEventSuggestions(
    city: string,
    region: string,
    accommodationType: string,
    latitude?: number,
    longitude?: number
  ): Promise<EventSuggestion[]> {
    const suggestions: EventSuggestion[] = []

    try {
      // 1. 날씨 데이터 조회 (7일 예보)
      const weatherData = await this.getWeatherForecast(city, latitude, longitude)

      // 2. 공휴일/이벤트 데이터 조회 (다음 2개월)
      const holidays = await this.getUpcomingHolidays()

      // 3. 계절별 이벤트 생성
      const seasonalEvents = this.getSeasonalEvents()

      // 4. 날씨 기반 제안 생성
      const weatherSuggestions = this.generateWeatherBasedSuggestions(
        weatherData, city, region, accommodationType
      )

      // 5. 공휴일 기반 제안 생성
      const holidaySuggestions = this.generateHolidayBasedSuggestions(
        holidays, weatherData, city, accommodationType
      )

      // 6. 계절 이벤트 기반 제안
      const seasonalSuggestions = this.generateSeasonalSuggestions(
        seasonalEvents, weatherData, city, accommodationType
      )

      suggestions.push(...weatherSuggestions, ...holidaySuggestions, ...seasonalSuggestions)

    } catch (error) {
      console.warn('날씨/이벤트 API 오류, Mock 데이터 사용:', error)
      return this.getMockEventSuggestions(city, region, accommodationType)
    }

    // 우선순위 및 시급성 기준 정렬
    return suggestions
      .sort((a, b) => {
        const urgencyScore = { high: 3, medium: 2, low: 1 }
        return urgencyScore[b.urgencyLevel] - urgencyScore[a.urgencyLevel]
      })
      .slice(0, 6) // 상위 6개만 반환
  }

  // 날씨 예보 조회 (Mock 구현)
  private async getWeatherForecast(city: string, lat?: number, lon?: number): Promise<WeatherData> {
    // 실제로는 기상청 API 또는 OpenWeatherMap API 사용
    return {
      current: {
        temp: Math.floor(Math.random() * 15) + 10, // 10-25도
        condition: ['sunny', 'cloudy', 'rainy', 'snowy'][Math.floor(Math.random() * 4)],
        humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
        windSpeed: Math.floor(Math.random() * 10) + 5 // 5-15m/s
      },
      forecast: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        temp_max: Math.floor(Math.random() * 15) + 15,
        temp_min: Math.floor(Math.random() * 10) + 5,
        condition: ['sunny', 'cloudy', 'rainy', 'snowy'][Math.floor(Math.random() * 4)],
        precipitation: Math.floor(Math.random() * 30)
      }))
    }
  }

  // 공휴일 조회 (실제 API 활용)
  private async getUpcomingHolidays(): Promise<HolidayEvent[]> {
    if (!this.holidayApiKey) {
      return this.getMockHolidays()
    }

    try {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1

      const url = `http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?serviceKey=${this.holidayApiKey}&solYear=${year}&solMonth=${month.toString().padStart(2, '0')}&_type=json`

      const response = await fetch(url)
      const data = await response.json()

      if (data.response?.body?.items?.item) {
        const items = Array.isArray(data.response.body.items.item)
          ? data.response.body.items.item
          : [data.response.body.items.item]

        return items.map((item: any) => ({
          name: item.dateName,
          date: `${item.locdate}`.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
          type: 'national' as const,
          description: `${item.dateName} 공휴일`
        }))
      }

    } catch (error) {
      console.warn('공휴일 API 오류:', error)
    }

    return this.getMockHolidays()
  }

  // 계절별 이벤트 생성
  private getSeasonalEvents(): HolidayEvent[] {
    const now = new Date()
    const month = now.getMonth() + 1

    const seasonalEvents = [
      // 봄 (3-5월)
      { name: '벚꽃축제', date: '2024-04-15', type: 'seasonal' as const, description: '벚꽃 만개 시기' },
      { name: '봄나들이시즌', date: '2024-05-01', type: 'seasonal' as const, description: '가족 나들이 성수기' },

      // 여름 (6-8월)
      { name: '여름휴가시즌', date: '2024-07-15', type: 'seasonal' as const, description: '본격 여름휴가철' },
      { name: '피서철시작', date: '2024-06-20', type: 'seasonal' as const, description: '무더위 시작, 피서 수요 증가' },

      // 가을 (9-11월)
      { name: '단풍시즌', date: '2024-10-15', type: 'seasonal' as const, description: '단풍 절정기' },
      { name: '가을축제철', date: '2024-09-20', type: 'seasonal' as const, description: '각종 지역축제 시기' },

      // 겨울 (12-2월)
      { name: '겨울축제시즌', date: '2024-12-20', type: 'seasonal' as const, description: '눈축제, 겨울축제' },
      { name: '스키시즌', date: '2024-01-15', type: 'seasonal' as const, description: '스키리조트 성수기' }
    ]

    return seasonalEvents.filter(event => {
      const eventMonth = new Date(event.date).getMonth() + 1
      return Math.abs(eventMonth - month) <= 2
    })
  }

  // 날씨 기반 제안 생성
  private generateWeatherBasedSuggestions(
    weather: WeatherData,
    city: string,
    region: string,
    accommodationType: string
  ): EventSuggestion[] {
    const suggestions: EventSuggestion[] = []

    weather.forecast.forEach((day, index) => {
      if (index > 3) return // 4일치만 확인

      // 맑은 날씨 - 야외활동 추천
      if (day.condition === 'sunny' && day.temp_max > 20) {
        suggestions.push({
          title: `맑은 날씨 활용 패키지 (${day.date})`,
          description: `최고 ${day.temp_max}°C의 완벽한 날씨를 활용한 야외활동`,
          targetDate: day.date,
          weatherCondition: '맑음',
          packageIdeas: [
            `${region} 트레킹 + ${accommodationType} 휴식`,
            '야외 바베큐 패키지',
            '일출/일몰 포토투어',
            '지역 명소 투어'
          ],
          pricingStrategy: {
            baseMultiplier: 1.2,
            description: '날씨 프리미엄 20% 적용'
          },
          marketingAngle: [
            '완벽한 날씨 보장',
            '야외활동 최적화',
            '인생샷 보장'
          ],
          urgencyLevel: index <= 1 ? 'high' : 'medium',
          estimatedDemandIncrease: '+35%'
        })
      }

      // 비 예보 - 실내활동 추천
      if (day.condition === 'rainy' && day.precipitation > 10) {
        suggestions.push({
          title: `우천 대비 힐링 패키지 (${day.date})`,
          description: `비오는 날 특별한 실내 힐링 프로그램`,
          targetDate: day.date,
          weatherCondition: '비',
          packageIdeas: [
            '스파/찜질 패키지',
            '실내 액티비티 + 온천',
            '독서/명상 힐링',
            '지역 박물관/미술관 투어'
          ],
          pricingStrategy: {
            baseMultiplier: 0.9,
            description: '우천 할인 10% 적용으로 매력도 증대'
          },
          marketingAngle: [
            '비 오는 날만의 특별함',
            '힐링 전문 프로그램',
            '완전한 휴식'
          ],
          urgencyLevel: 'medium',
          estimatedDemandIncrease: '+20%'
        })
      }
    })

    return suggestions
  }

  // 공휴일 기반 제안 생성
  private generateHolidayBasedSuggestions(
    holidays: HolidayEvent[],
    weather: WeatherData,
    city: string,
    accommodationType: string
  ): EventSuggestion[] {
    return holidays.map(holiday => {
      const daysDiff = Math.floor((new Date(holiday.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      const urgencyLevel: 'high' | 'medium' | 'low' =
        daysDiff <= 7 ? 'high' :
        daysDiff <= 21 ? 'medium' : 'low'

      return {
        title: `${holiday.name} 특별 패키지`,
        description: `${holiday.name}을 맞아 준비한 특별 휴가 프로그램`,
        targetDate: holiday.date,
        weatherCondition: '예상 날씨 반영',
        packageIdeas: [
          `${holiday.name} 기념 ${accommodationType} 패키지`,
          '가족 단위 장기 할인',
          '연휴 특별 액티비티',
          '지역 축제 연계 프로그램'
        ],
        pricingStrategy: {
          baseMultiplier: daysDiff <= 14 ? 1.5 : 1.3,
          description: `연휴 프리미엄 ${daysDiff <= 14 ? '50%' : '30%'} 적용`
        },
        marketingAngle: [
          '연휴 완벽 활용',
          '가족 화합 시간',
          '특별한 추억 만들기'
        ],
        urgencyLevel,
        estimatedDemandIncrease: '+60%'
      }
    })
  }

  // 계절 이벤트 기반 제안
  private generateSeasonalSuggestions(
    events: HolidayEvent[],
    weather: WeatherData,
    city: string,
    accommodationType: string
  ): EventSuggestion[] {
    return events.map(event => ({
      title: `${event.name} 시즌 패키지`,
      description: `${event.description} 시기에 맞춘 특별 프로그램`,
      targetDate: event.date,
      weatherCondition: '시즌 특성 반영',
      packageIdeas: [
        `${city} ${event.name.replace('시즌', '')} 투어`,
        '시즌 특별 체험 프로그램',
        '지역 특산물 패키지',
        '포토존 특별 세팅'
      ],
      pricingStrategy: {
        baseMultiplier: 1.25,
        description: '시즌 특별가 25% 프리미엄'
      },
      marketingAngle: [
        '시즌 한정 특별함',
        '지역 특색 만끽',
        '인스타그램 핫플레이스'
      ],
      urgencyLevel: 'medium',
      estimatedDemandIncrease: '+40%'
    }))
  }

  // Mock 데이터들
  private getMockHolidays(): HolidayEvent[] {
    return [
      { name: '추석연휴', date: '2024-09-16', type: 'national', description: '추석 연휴 시작' },
      { name: '개천절', date: '2024-10-03', type: 'national', description: '개천절 공휴일' },
      { name: '한글날', date: '2024-10-09', type: 'national', description: '한글날 공휴일' }
    ]
  }

  private getMockEventSuggestions(city: string, region: string, type: string): EventSuggestion[] {
    return [
      {
        title: '가을 단풍 특별 패키지',
        description: `${region} 지역 단풍 명소와 함께하는 힐링 패키지`,
        targetDate: '2024-10-15',
        weatherCondition: '맑음',
        packageIdeas: ['단풍 트레킹', '온천 힐링', '지역 특산물 시식'],
        pricingStrategy: { baseMultiplier: 1.3, description: '단풍시즌 프리미엄 30%' },
        marketingAngle: ['가을 정취 만끽', '단풍 명소 독점', '힐링 완성'],
        urgencyLevel: 'high',
        estimatedDemandIncrease: '+45%'
      }
    ]
  }
}

// 싱글톤 인스턴스
let weatherEventsClient: WeatherEventsClient | null = null

export function getWeatherEventsClient(): WeatherEventsClient {
  if (!weatherEventsClient) {
    weatherEventsClient = new WeatherEventsClient()
  }
  return weatherEventsClient
}

export type { EventSuggestion, WeatherData, HolidayEvent }