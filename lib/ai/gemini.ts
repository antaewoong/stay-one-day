import { GoogleGenerativeAI } from '@google/generative-ai'

// Google Gemini AI 클라이언트 설정
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

// Gemini 모델 인스턴스
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

export interface AccommodationData {
  id: string
  name: string
  type: string
  location: string
  price: number
  capacity: number
  amenities: string[]
  description: string
  images: string[]
  rating?: number
  reviewCount?: number
  keywords?: string[]
}

export interface MarketingAnalysis {
  targetAudience: {
    primary: string
    secondary: string[]
    demographics: string
  }
  pricingStrategy: {
    currentPosition: string
    recommendations: string[]
    seasonalPricing: string
  }
  promotionChannels: {
    recommended: string[]
    contentStrategy: string[]
  }
  uniqueSellingPoints: string[]
  improvementSuggestions: string[]
}

/**
 * 숙소 데이터를 기반으로 AI 마케팅 분석을 생성합니다
 */
export async function generateMarketingAnalysis(
  accommodationData: AccommodationData,
  competitorData?: AccommodationData[]
): Promise<MarketingAnalysis> {
  try {
    const prompt = createMarketingPrompt(accommodationData, competitorData)
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // AI 응답을 구조화된 데이터로 파싱
    return parseMarketingAnalysis(text)
  } catch (error) {
    console.error('마케팅 분석 생성 실패:', error)
    throw new Error('마케팅 분석을 생성할 수 없습니다')
  }
}

/**
 * AI를 위한 마케팅 분석 프롬프트 생성
 */
function createMarketingPrompt(
  accommodation: AccommodationData,
  competitors?: AccommodationData[]
): string {
  const competitorInfo = competitors 
    ? `\n\n경쟁 숙소 정보:\n${competitors.map(comp => 
        `- ${comp.name}: ${comp.type}, ${comp.price.toLocaleString()}원, ${comp.location}`
      ).join('\n')}`
    : ''

  return `
당신은 숙박업계 마케팅 전문가입니다. 다음 숙소에 대한 종합적인 마케팅 분석과 홍보 전략을 제안해주세요.

숙소 정보:
- 이름: ${accommodation.name}
- 타입: ${accommodation.type}
- 위치: ${accommodation.location}
- 가격: ${accommodation.price.toLocaleString()}원
- 수용인원: ${accommodation.capacity}명
- 편의시설: ${accommodation.amenities.join(', ')}
- 설명: ${accommodation.description}
- 평점: ${accommodation.rating || 'N/A'}
- 리뷰수: ${accommodation.reviewCount || 'N/A'}개
- 키워드: ${accommodation.keywords?.join(', ') || 'N/A'}
${competitorInfo}

다음 항목에 대해 구체적이고 실용적인 분석을 제공해주세요:

1. 타겟 고객층 분석
   - 주요 고객층
   - 부차적 고객층
   - 고객 특성 및 니즈

2. 가격 전략
   - 현재 가격 포지셔닝 평가
   - 가격 개선 제안
   - 시즌별 가격 전략

3. 홍보 채널 및 전략
   - 추천 마케팅 채널
   - 콘텐츠 마케팅 전략
   - SNS 활용 방안

4. 차별화 포인트
   - 고유한 장점
   - 강조할 특징

5. 개선 제안사항
   - 마케팅 개선점
   - 서비스 개선점

응답은 JSON 형식으로 구조화하여 제공해주세요:
{
  "targetAudience": {
    "primary": "주요 타겟 고객층",
    "secondary": ["부차적 고객층1", "부차적 고객층2"],
    "demographics": "고객 특성 분석"
  },
  "pricingStrategy": {
    "currentPosition": "현재 가격 포지셔닝",
    "recommendations": ["가격 전략 제안1", "가격 전략 제안2"],
    "seasonalPricing": "시즌별 가격 전략"
  },
  "promotionChannels": {
    "recommended": ["추천 채널1", "추천 채널2"],
    "contentStrategy": ["콘텐츠 전략1", "콘텐츠 전략2"]
  },
  "uniqueSellingPoints": ["차별화 포인트1", "차별화 포인트2"],
  "improvementSuggestions": ["개선사항1", "개선사항2"]
}
`
}

/**
 * AI 응답을 구조화된 마케팅 분석 객체로 파싱
 */
function parseMarketingAnalysis(aiResponse: string): MarketingAnalysis {
  try {
    // JSON 부분 추출
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('JSON 형식을 찾을 수 없습니다')
    }
    
    const parsedData = JSON.parse(jsonMatch[0])
    
    return {
      targetAudience: {
        primary: parsedData.targetAudience?.primary || '분석 불가',
        secondary: parsedData.targetAudience?.secondary || [],
        demographics: parsedData.targetAudience?.demographics || '분석 불가'
      },
      pricingStrategy: {
        currentPosition: parsedData.pricingStrategy?.currentPosition || '분석 불가',
        recommendations: parsedData.pricingStrategy?.recommendations || [],
        seasonalPricing: parsedData.pricingStrategy?.seasonalPricing || '분석 불가'
      },
      promotionChannels: {
        recommended: parsedData.promotionChannels?.recommended || [],
        contentStrategy: parsedData.promotionChannels?.contentStrategy || []
      },
      uniqueSellingPoints: parsedData.uniqueSellingPoints || [],
      improvementSuggestions: parsedData.improvementSuggestions || []
    }
  } catch (error) {
    console.error('AI 응답 파싱 실패:', error)
    
    // 파싱 실패 시 기본 분석 반환
    return {
      targetAudience: {
        primary: '분석 처리 중 오류 발생',
        secondary: [],
        demographics: '다시 시도해주세요'
      },
      pricingStrategy: {
        currentPosition: '분석 처리 중 오류 발생',
        recommendations: [],
        seasonalPricing: '다시 시도해주세요'
      },
      promotionChannels: {
        recommended: [],
        contentStrategy: []
      },
      uniqueSellingPoints: [],
      improvementSuggestions: []
    }
  }
}

export default {
  generateMarketingAnalysis
}