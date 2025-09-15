import { NextRequest, NextResponse } from 'next/server'
import { withHostAuth } from '@/middleware/withHostAuth'
import {
  getCache,
  setCache,
  CACHE_TTL
} from '@/utils/cache-manager'

/**
 * 네이버 플레이스 건강도 체크 (수동 체크리스트 방식)
 * 공식 API 제한으로 인해 호스트가 직접 입력하는 방식으로 구현
 */
export const GET = withHostAuth(async (req, db, { userId, host }) => {
  const startTime = Date.now()

  try {
    const { searchParams } = req.nextUrl
    const accommodationId = searchParams.get('accommodationId')

    if (!accommodationId) {
      return NextResponse.json({ error: '숙소 ID가 필요합니다' }, { status: 400 })
    }

    // 숙소 정보 조회
    const { data: accommodation, error: accomError } = await db
      .from('accommodations')
      .select('id, name, city, region, phone, address')
      .eq('id', accommodationId)
      .eq('host_id', userId)
      .single()

    if (accomError || !accommodation) {
      return NextResponse.json({ error: '숙소를 찾을 수 없습니다' }, { status: 404 })
    }

    // 저장된 플레이스 정보 조회 (Mock - 실제로는 accommodation_naver_place 테이블)
    const cacheKey = `naver_place_health:${accommodationId}`
    let placeHealthData = getCache(cacheKey)

    if (!placeHealthData) {
      // 초기 체크리스트 데이터 생성
      placeHealthData = generateInitialHealthCheck(accommodation)
      setCache(cacheKey, placeHealthData, CACHE_TTL.NAVER_PLACE)
    }

    // 체크리스트 기반 건강도 점수 계산
    const healthScore = calculateHealthScore(placeHealthData)
    const recommendations = generateRecommendations(placeHealthData, healthScore)
    const actionItems = generateActionItems(placeHealthData)

    const duration = Date.now() - startTime
    console.log(`[NAVER_PLACE_HEALTH] accommodation_id=${accommodationId} score=${healthScore.totalScore} duration=${duration}ms`)

    return NextResponse.json({
      success: true,
      accommodationName: accommodation.name,
      location: `${accommodation.city}, ${accommodation.region}`,

      // 건강도 점수
      healthScore: {
        totalScore: healthScore.totalScore,
        grade: getHealthGrade(healthScore.totalScore),
        categoryScores: healthScore.categoryScores,
        maxPossibleScore: 100
      },

      // 체크리스트 현황
      checklist: placeHealthData.checklist,

      // 플레이스 정보
      placeInfo: {
        businessName: placeHealthData.businessName || accommodation.name,
        businessHours: placeHealthData.businessHours || '입력 필요',
        phoneNumber: placeHealthData.phoneNumber || accommodation.phone || '입력 필요',
        address: placeHealthData.address || accommodation.address || '입력 필요',
        categories: placeHealthData.categories || [],
        lastUpdated: placeHealthData.lastUpdated
      },

      // 개선 추천 사항
      recommendations: {
        critical: recommendations.filter(r => r.priority === 'critical'),
        high: recommendations.filter(r => r.priority === 'high'),
        medium: recommendations.filter(r => r.priority === 'medium')
      },

      // 액션 아이템
      actionItems,

      // 경쟁사 비교 (Mock 데이터)
      competitorComparison: {
        averageScore: 75,
        yourRank: calculateRank(healthScore.totalScore),
        improvementPotential: Math.max(0, 85 - healthScore.totalScore)
      },

      // 메타데이터
      isManualChecklist: true,
      dataSource: 'manual_checklist',
      lastCheckDate: placeHealthData.lastUpdated,
      nextRecommendedCheck: getNextCheckDate(),
      updateTime: new Date().toISOString()
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[NAVER_PLACE_HEALTH_ERROR] user_id=${userId} duration=${duration}ms error:`, error)

    return NextResponse.json({
      error: '네이버 플레이스 건강도 분석 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
})

/**
 * POST: 체크리스트 업데이트
 */
export const POST = withHostAuth(async (req, db, { userId, host }) => {
  try {
    const body = await req.json()
    const { accommodationId, checklist, placeInfo } = body

    if (!accommodationId || !checklist) {
      return NextResponse.json({
        error: '필수 필드가 누락되었습니다'
      }, { status: 400 })
    }

    // 숙소 소유권 확인
    const { data: accommodation, error: accomError } = await db
      .from('accommodations')
      .select('id, name')
      .eq('id', accommodationId)
      .eq('host_id', userId)
      .single()

    if (accomError || !accommodation) {
      return NextResponse.json({ error: '숙소를 찾을 수 없습니다' }, { status: 404 })
    }

    // 체크리스트 데이터 저장
    const healthData = {
      accommodationId,
      checklist,
      businessName: placeInfo?.businessName,
      businessHours: placeInfo?.businessHours,
      phoneNumber: placeInfo?.phoneNumber,
      address: placeInfo?.address,
      categories: placeInfo?.categories || [],
      lastUpdated: new Date().toISOString()
    }

    const cacheKey = `naver_place_health:${accommodationId}`
    setCache(cacheKey, healthData, CACHE_TTL.NAVER_PLACE)

    // 건강도 재계산
    const healthScore = calculateHealthScore(healthData)

    return NextResponse.json({
      success: true,
      message: '체크리스트가 업데이트되었습니다',
      newScore: healthScore.totalScore,
      grade: getHealthGrade(healthScore.totalScore),
      updatedAt: healthData.lastUpdated
    })

  } catch (error) {
    console.error('네이버 플레이스 체크리스트 업데이트 오류:', error)
    return NextResponse.json({
      error: '체크리스트 업데이트 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
})

// 초기 체크리스트 데이터 생성
function generateInitialHealthCheck(accommodation: any) {
  return {
    accommodationId: accommodation.id,
    businessName: accommodation.name,
    businessHours: null,
    phoneNumber: accommodation.phone || null,
    address: accommodation.address || null,
    categories: [],
    checklist: {
      basicInfo: {
        businessNameRegistered: false,
        correctAddress: false,
        phoneNumberValid: false,
        businessHoursUpdated: false,
        categorySelected: false
      },
      photos: {
        exteriorPhotos: false,
        interiorPhotos: false,
        facilityPhotos: false,
        photoCountSufficient: false,
        photoQualityGood: false
      },
      content: {
        businessDescription: false,
        facilitiesListed: false,
        servicesDescribed: false,
        uniqueFeatures: false,
        priceInformation: false
      },
      customerService: {
        reviewsResponded: false,
        inquiriesAnswered: false,
        responseTime: false,
        customerSatisfaction: false
      },
      marketing: {
        keywordOptimized: false,
        localSearchVisible: false,
        competitorAnalysis: false,
        promotionsActive: false,
        socialMediaLinked: false
      }
    },
    lastUpdated: new Date().toISOString()
  }
}

// 건강도 점수 계산
function calculateHealthScore(healthData: any) {
  const weights = {
    basicInfo: 25,
    photos: 20,
    content: 20,
    customerService: 20,
    marketing: 15
  }

  const categoryScores: Record<string, number> = {}
  let totalScore = 0

  Object.entries(healthData.checklist).forEach(([category, items]: [string, any]) => {
    const trueCount = Object.values(items).filter(Boolean).length
    const totalCount = Object.keys(items).length
    const categoryScore = (trueCount / totalCount) * 100

    categoryScores[category] = Math.round(categoryScore)
    totalScore += (categoryScore * weights[category as keyof typeof weights]) / 100
  })

  return {
    totalScore: Math.round(totalScore),
    categoryScores
  }
}

// 건강도 등급 계산
function getHealthGrade(score: number): string {
  if (score >= 90) return 'A+'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B+'
  if (score >= 60) return 'B'
  if (score >= 50) return 'C+'
  if (score >= 40) return 'C'
  return 'D'
}

// 개선 추천 사항 생성
function generateRecommendations(healthData: any, healthScore: any) {
  const recommendations = []

  // 기본 정보 체크
  if (!healthData.checklist.basicInfo.businessNameRegistered) {
    recommendations.push({
      category: 'basicInfo',
      title: '사업자 정보 등록',
      description: '네이버 플레이스에 정확한 사업자 정보를 등록하세요',
      priority: 'critical',
      impact: '검색 노출 증가',
      effort: '낮음'
    })
  }

  // 사진 관련
  if (healthScore.categoryScores.photos < 60) {
    recommendations.push({
      category: 'photos',
      title: '사진 품질 및 수량 개선',
      description: '고품질 사진을 10장 이상 업로드하고 다양한 각도로 촬영하세요',
      priority: 'high',
      impact: '클릭율 증가',
      effort: '중간'
    })
  }

  // 고객 서비스
  if (healthScore.categoryScores.customerService < 70) {
    recommendations.push({
      category: 'customerService',
      title: '고객 응답률 개선',
      description: '리뷰와 문의에 빠르게 응답하여 고객 만족도를 높이세요',
      priority: 'high',
      impact: '신뢰도 향상',
      effort: '낮음'
    })
  }

  // 마케팅 최적화
  if (healthScore.categoryScores.marketing < 50) {
    recommendations.push({
      category: 'marketing',
      title: '검색 키워드 최적화',
      description: '지역명과 숙박 관련 키워드를 포함하여 설명을 작성하세요',
      priority: 'medium',
      impact: '검색 랭킹 향상',
      effort: '중간'
    })
  }

  return recommendations
}

// 액션 아이템 생성
function generateActionItems(healthData: any) {
  const actionItems = []

  // 미완료 항목에 대한 구체적인 액션
  Object.entries(healthData.checklist).forEach(([category, items]: [string, any]) => {
    Object.entries(items).forEach(([item, completed]: [string, boolean]) => {
      if (!completed) {
        actionItems.push({
          category,
          item,
          title: getActionTitle(category, item),
          description: getActionDescription(category, item),
          estimatedTime: getEstimatedTime(category, item),
          priority: getActionPriority(category, item)
        })
      }
    })
  })

  return actionItems.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return priorityOrder[a.priority as keyof typeof priorityOrder] -
           priorityOrder[b.priority as keyof typeof priorityOrder]
  })
}

// 액션 제목 생성
function getActionTitle(category: string, item: string): string {
  const titles: Record<string, Record<string, string>> = {
    basicInfo: {
      businessNameRegistered: '사업자명 등록',
      correctAddress: '주소 정보 확인',
      phoneNumberValid: '전화번호 인증',
      businessHoursUpdated: '운영시간 업데이트',
      categorySelected: '업종 카테고리 선택'
    },
    photos: {
      exteriorPhotos: '외관 사진 업로드',
      interiorPhotos: '내부 시설 사진 업로드',
      facilityPhotos: '편의시설 사진 업로드',
      photoCountSufficient: '사진 수량 확보',
      photoQualityGood: '사진 품질 개선'
    }
  }

  return titles[category]?.[item] || `${item} 완료`
}

// 액션 설명 생성
function getActionDescription(category: string, item: string): string {
  return `${category} 카테고리의 ${item} 항목을 완료하세요`
}

// 예상 소요 시간
function getEstimatedTime(category: string, item: string): string {
  if (category === 'photos') return '30-60분'
  if (category === 'basicInfo') return '10-20분'
  if (category === 'content') return '20-40분'
  return '15-30분'
}

// 액션 우선순위
function getActionPriority(category: string, item: string): string {
  if (category === 'basicInfo') return 'critical'
  if (category === 'photos' && item.includes('exterior')) return 'high'
  if (category === 'customerService') return 'high'
  return 'medium'
}

// 순위 계산
function calculateRank(score: number): string {
  if (score >= 85) return 'Top 10%'
  if (score >= 70) return 'Top 30%'
  if (score >= 50) return 'Top 60%'
  return '하위 40%'
}

// 다음 체크 날짜
function getNextCheckDate(): string {
  const nextCheck = new Date()
  nextCheck.setDate(nextCheck.getDate() + 30) // 30일 후
  return nextCheck.toISOString()
}