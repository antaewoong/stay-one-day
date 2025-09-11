import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const dynamic = 'force-dynamic'

interface CompetitiveAnalysis {
  myAccommodation: {
    name: string
    address: string
    price: number
    rating: number
    amenities: string[]
  }
  nearbyCompetitors: {
    name: string
    distance: number
    price: number
    rating: number
    bookingRate: number
    strengths: string[]
    weaknesses: string[]
  }[]
  competitiveAdvantages: {
    category: string
    advantage: string
    impact: 'HIGH' | 'MEDIUM' | 'LOW'
    actionItems: string[]
  }[]
  pricingStrategy: {
    currentPosition: string
    recommendations: {
      strategy: string
      priceRange: { min: number; max: number }
      reasoning: string
      expectedResult: string
    }[]
  }
  marketingFocus: {
    uniqueSellingPoints: string[]
    targetAudience: string[]
    contentStrategy: string[]
    promotionTactics: string[]
  }
  threatAnalysis: {
    immediateThreats: string[]
    opportunityGaps: string[]
    defensiveActions: string[]
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 🔐 RLS 정책 준수: 인증 + 권한 확인
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // RLS: 사용자 역할 확인
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (!userRole || !['host', 'admin', 'super_admin'].includes(userRole.role)) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    const { accommodationId, radius = 50 } = await request.json()  // 기본 50km 반경
    
    if (!accommodationId) {
      return NextResponse.json(
        { error: '숙소 ID가 필요합니다' },
        { status: 400 }
      )
    }

    // 🔐 RLS: 호스트는 본인 숙소만 분석 가능
    if (userRole.role === 'host') {
      const { data: hostData } = await supabase
        .from('hosts')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

      if (!hostData) {
        return NextResponse.json(
          { error: '호스트 정보를 찾을 수 없습니다' },
          { status: 404 }
        )
      }

      // 숙소 소유권 확인
      const { data: accommodation } = await supabase
        .from('accommodations')
        .select('host_id')
        .eq('id', accommodationId)
        .eq('host_id', hostData.id)
        .single()

      if (!accommodation) {
        return NextResponse.json(
          { error: '해당 숙소에 대한 경쟁 분석 권한이 없습니다' },
          { status: 403 }
        )
      }
    }

    // 1. 내 숙소 정보 조회
    const myAccommodation = await getMyAccommodationData(supabase, accommodationId)
    
    // 2. 주변 경쟁업체 데이터 수집
    const competitors = await getNearbyCompetitors(supabase, myAccommodation, radius)
    
    // 3. AI 기반 경쟁 분석
    const analysis = await generateCompetitiveAnalysis(myAccommodation, competitors)
    
    return NextResponse.json({
      success: true,
      data: {
        analysis,
        generatedAt: new Date().toISOString(),
        analysisRadius: radius
      }
    })
  } catch (error) {
    console.error('경쟁 분석 실패:', error)
    return NextResponse.json(
      { error: '경쟁 분석 생성에 실패했습니다' },
      { status: 500 }
    )
  }
}

async function getMyAccommodationData(supabase: any, accommodationId: string) {
  const { data: accommodation } = await supabase
    .from('accommodations')
    .select(`
      *,
      accommodation_amenities(
        amenities(name)
      ),
      reviews(rating)
    `)
    .eq('id', accommodationId)
    .single()

  if (!accommodation) {
    throw new Error('숙소 정보를 찾을 수 없습니다')
  }

  // 평균 평점 계산
  const avgRating = accommodation.reviews?.length 
    ? accommodation.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / accommodation.reviews.length
    : 0

  return {
    id: accommodation.id,
    name: accommodation.name,
    address: accommodation.address,
    region: accommodation.region,
    price: accommodation.base_price,
    rating: avgRating,
    amenities: accommodation.accommodation_amenities?.map((a: any) => a.amenities.name) || [],
    accommodationType: accommodation.accommodation_type,
    maxCapacity: accommodation.max_capacity
  }
}

async function getNearbyCompetitors(supabase: any, myAccommodation: any, radius: number) {
  // ⭐ 진짜 경쟁분석: 같은 상세 지역의 직접 경쟁업체만
  const { data: competitors } = await supabase
    .from('accommodations')
    .select(`
      *,
      accommodation_amenities(
        amenities(name)
      ),
      reviews(rating),
      reservations(created_at, status)
    `)
    .eq('region', myAccommodation.region)
    .eq('accommodation_type', myAccommodation.accommodationType)  // 같은 타입만
    .gte('max_capacity', myAccommodation.maxCapacity - 2)  // 비슷한 규모만
    .lte('max_capacity', myAccommodation.maxCapacity + 2)
    .eq('status', 'active')
    .neq('id', myAccommodation.id)
    .limit(5)  // 진짜 직접 경쟁업체 5개만

  return competitors?.map((comp: any) => {
    // 예약률 계산 (최근 30일)
    const recentReservations = comp.reservations?.filter((r: any) => {
      const createdDate = new Date(r.created_at)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return createdDate >= thirtyDaysAgo && r.status === 'confirmed'
    }) || []

    const avgRating = comp.reviews?.length 
      ? comp.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / comp.reviews.length
      : 0

    return {
      id: comp.id,
      name: comp.name,
      distance: calculateRegionDistance(myAccommodation.region, comp.region), // 지역 기반 거리 추정
      price: comp.base_price,
      rating: avgRating,
      bookingRate: recentReservations.length / 30 * 100, // 일일 평균 예약률
      amenities: comp.accommodation_amenities?.map((a: any) => a.amenities.name) || [],
      accommodationType: comp.accommodation_type,
      maxCapacity: comp.max_capacity
    }
  }) || []
}

async function generateCompetitiveAnalysis(
  myAccommodation: any, 
  competitors: any[]
): Promise<CompetitiveAnalysis> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `
    당신은 숙박업계 현장 전문가입니다. ${myAccommodation.region}에서 직접 경쟁하는 업체들과의 치열한 경쟁에서 이기는 전략을 제안해주세요.

    ## 🏠 우리 숙소:
    - ${myAccommodation.name} (${myAccommodation.region})
    - 가격: ${myAccommodation.price.toLocaleString()}원/박
    - 평점: ${myAccommodation.rating.toFixed(1)}/5.0점
    - 편의시설: ${myAccommodation.amenities.join(', ')}
    - 최대 ${myAccommodation.maxCapacity}명 수용

    ## ⚔️ 바로 옆 직접 경쟁업체들:
    ${competitors.map(comp => `
    • ${comp.name}: ${comp.price.toLocaleString()}원/박, ⭐${comp.rating.toFixed(1)}점, 📈예약률 ${comp.bookingRate.toFixed(1)}%
    `).join('')}

    ## 🎯 긴급 전략 수립:
    **상황**: ${myAccommodation.region} 지역에서 같은 고객을 두고 경쟁 중
    
    **분석 요청**:
    1. 🔥 각 경쟁업체별 "어떻게 이길지" 구체적 방법
    2. 💰 우리가 설정해야 할 최적 가격 (경쟁업체 대비)
    3. 📢 고객이 우리를 선택하게 만드는 차별화 포인트
    4. ⚡ 내일부터 당장 실행 가능한 액션 3가지
    5. 🛡️ 경쟁업체가 따라하기 어려운 우리만의 장점

    **목표**: 이 지역에서 예약 1등 달성하기

    반드시 JSON 형태로 실전 전략을 제공하세요.
  `

  try {
    const result = await model.generateContent(prompt)
    const analysisText = result.response.text()
    
    // JSON 파싱 시도
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    // JSON 파싱 실패 시 기본 분석 반환
    return generateDefaultCompetitiveAnalysis(myAccommodation, competitors)
  } catch (error) {
    console.error('AI 경쟁 분석 실패:', error)
    return generateDefaultCompetitiveAnalysis(myAccommodation, competitors)
  }
}

function generateDefaultCompetitiveAnalysis(
  myAccommodation: any, 
  competitors: any[]
): CompetitiveAnalysis {
  const avgCompetitorPrice = competitors.reduce((sum, c) => sum + c.price, 0) / competitors.length
  const avgCompetitorRating = competitors.reduce((sum, c) => sum + c.rating, 0) / competitors.length

  return {
    myAccommodation: {
      name: myAccommodation.name,
      address: myAccommodation.address,
      price: myAccommodation.price,
      rating: myAccommodation.rating,
      amenities: myAccommodation.amenities
    },
    nearbyCompetitors: competitors.map(comp => ({
      name: comp.name,
      distance: comp.distance,
      price: comp.price,
      rating: comp.rating,
      bookingRate: comp.bookingRate,
      strengths: generateStrengths(comp, myAccommodation),
      weaknesses: generateWeaknesses(comp, myAccommodation)
    })),
    competitiveAdvantages: [
      {
        category: '가격 경쟁력',
        advantage: myAccommodation.price < avgCompetitorPrice 
          ? '평균보다 저렴한 가격으로 가성비 우위'
          : '프리미엄 가격으로 고품질 이미지',
        impact: 'HIGH',
        actionItems: [
          '가격 대비 가치 강조 마케팅',
          '시즌별 동적 가격 전략 도입',
          '패키지 상품 개발'
        ]
      },
      {
        category: '서비스 차별화',
        advantage: '독특한 편의시설과 개인화된 서비스',
        impact: 'MEDIUM',
        actionItems: [
          '고유 편의시설 홍보 강화',
          '맞춤형 서비스 개발',
          '고객 리뷰 관리 시스템'
        ]
      }
    ],
    pricingStrategy: {
      currentPosition: myAccommodation.price < avgCompetitorPrice ? '가성비 포지션' : '프리미엄 포지션',
      recommendations: [
        {
          strategy: '동적 가격 전략',
          priceRange: {
            min: Math.floor(avgCompetitorPrice * 0.8),
            max: Math.ceil(avgCompetitorPrice * 1.2)
          },
          reasoning: '수요와 경쟁 상황에 따른 탄력적 가격 조정',
          expectedResult: '예약률 15-25% 향상 예상'
        }
      ]
    },
    marketingFocus: {
      uniqueSellingPoints: [
        '지역 최고의 편의시설',
        '개인화된 맞춤 서비스',
        '최적의 위치와 접근성'
      ],
      targetAudience: [
        '20-30대 커플',
        '가족 단위 여행객',
        '비즈니스 출장객'
      ],
      contentStrategy: [
        '실제 이용 후기 중심 콘텐츠',
        '지역 명소와 연계한 여행 가이드',
        'SNS 친화적 포토존 활용'
      ],
      promotionTactics: [
        '첫 방문 고객 할인',
        '장기 숙박 패키지',
        '지역 파트너십 혜택'
      ]
    },
    threatAnalysis: {
      immediateThreats: [
        '새로운 경쟁업체 진입',
        '기존 업체의 가격 인하',
        '계절적 수요 변동'
      ],
      opportunityGaps: [
        '차별화된 서비스 부족',
        '디지털 마케팅 미흡',
        '고객 데이터 활용 부족'
      ],
      defensiveActions: [
        '고객 충성도 프로그램 도입',
        '서비스 품질 지속적 개선',
        '마케팅 자동화 시스템 구축'
      ]
    }
  }
}

function generateStrengths(competitor: any, myAccommodation: any): string[] {
  const strengths = []
  
  if (competitor.price < myAccommodation.price) {
    strengths.push('더 저렴한 가격')
  }
  if (competitor.rating > myAccommodation.rating) {
    strengths.push('높은 고객 만족도')
  }
  if (competitor.bookingRate > 50) {
    strengths.push('높은 예약률')
  }
  
  return strengths.length ? strengths : ['기본적인 시설 제공']
}

function generateWeaknesses(competitor: any, myAccommodation: any): string[] {
  const weaknesses = []
  
  if (competitor.price > myAccommodation.price) {
    weaknesses.push('상대적으로 높은 가격')
  }
  if (competitor.rating < myAccommodation.rating) {
    weaknesses.push('낮은 고객 평점')
  }
  if (competitor.bookingRate < 30) {
    weaknesses.push('낮은 예약률')
  }
  
  return weaknesses.length ? weaknesses : ['일반적인 서비스']
}

// 🗺️ 지역 기반 거리 추정 함수
function calculateRegionDistance(region1: string, region2: string): number {
  // 같은 지역이면 매우 가까움
  if (region1 === region2) {
    return Math.random() * 10 + 1 // 1-10km 내
  }
  
  // 지역명 기반 대략적 거리 추정
  const regionDistanceMap: { [key: string]: { [key: string]: number } } = {
    '강남구': { '서초구': 8, '송파구': 12, '용산구': 15, '마포구': 20 },
    '제주시': { '서귀포시': 35, '강남구': 450 },
    '청주시': { '대전시': 45, '서울시': 120 },
    '경주시': { '부산시': 60, '대구시': 80 },
    '춘천시': { '서울시': 85, '인천시': 95 }
  }
  
  // 매핑된 거리가 있으면 사용
  if (regionDistanceMap[region1] && regionDistanceMap[region1][region2]) {
    return regionDistanceMap[region1][region2]
  }
  if (regionDistanceMap[region2] && regionDistanceMap[region2][region1]) {
    return regionDistanceMap[region2][region1]
  }
  
  // 기본값: 50km 이내로 가정
  return Math.random() * 45 + 5 // 5-50km
}