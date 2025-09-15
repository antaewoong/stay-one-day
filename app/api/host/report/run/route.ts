import { NextRequest, NextResponse } from 'next/server'
import { withHostAuth } from '@/middleware/withHostAuth'
import { tryIncrementQuota } from '@/utils/quota-manager'

export const POST = withHostAuth(async (req, db, { userId, host }) => {
  const startTime = Date.now()

  try {
    const { accommodationId } = await req.json()

    // 숙소 소유권 확인
    const { data: accommodation, error: accomError } = await db
      .from('accommodations')
      .select('id, name, city, region, accommodation_type, base_price')
      .eq('id', accommodationId)
      .eq('host_id', host.id)
      .single()

    if (accomError || !accommodation) {
      return NextResponse.json({ error: '숙소를 찾을 수 없습니다' }, { status: 404 })
    }

    // 쿼터 확인 및 증가 시도
    const quotaResult = tryIncrementQuota(userId, 'manual')

    if (!quotaResult.incremented) {
      const body = {
        error: 'quota_exceeded',
        message: '이번 주 리포트 2회 모두 사용하셨습니다',
        next_available: quotaResult.next_available,
        current_usage: {
          manual: quotaResult.manual_runs,
          admin_proxy: quotaResult.admin_proxy_runs,
          total: quotaResult.total_runs
        }
      }

      console.info(`[quota_exceeded] host=${userId} accom=${accommodation.id} usage=${quotaResult.total_runs}`)
      return NextResponse.json(body, { status: 429 })
    }

    // 리포트 생성 (Mock 데이터)
    const payload = {
      accommodation_id: accommodation.id,
      accommodation_name: accommodation.name,
      location: `${accommodation.city}, ${accommodation.region}`,
      summary: `${accommodation.region || accommodation.city} 지역 이번 주 인사이트`,

      actionable_insights: [
        {
          type: 'trending_keyword',
          title: '🔥 계곡 피크닉 검색 152% 증가',
          action: '계곡뷰 + 피크닉 세트 패키지 출시 권장',
          priority: 'high',
          effort: 'medium',
          estimated_impact: '예약률 25% 증가 예상'
        },
        {
          type: 'pricing_opportunity',
          title: '📈 주말 가격 최적화 기회',
          action: '금-토 요금을 15% 상향 조정 권장',
          priority: 'medium',
          effort: 'low',
          estimated_impact: '수익 18% 증가 예상'
        },
        {
          type: 'competition_alert',
          title: '⚠️ 인근 숙소 프로모션 진행 중',
          action: '차별화된 어메니티 강조 또는 맞대응 할인',
          priority: 'high',
          effort: 'high',
          estimated_impact: '점유율 유지 필수'
        }
      ],

      quick_stats: {
        price_rank: '상위 28%',
        competition_level: '보통',
        search_volume_trend: '+23%',
        optimal_price_range: `${Math.floor(accommodation.base_price * 0.9)}-${Math.floor(accommodation.base_price * 1.2)}원`
      },

      trending_keywords: [
        { keyword: `${accommodation.city} 계곡`, search_volume: 1240, trend: '+152%' },
        { keyword: `${accommodation.region} 피크닉`, search_volume: 890, trend: '+89%' },
        { keyword: `${accommodation.city} 글램핑`, search_volume: 650, trend: '+45%' },
        { keyword: `${accommodation.region} 바베큐`, search_volume: 420, trend: '+23%' },
        { keyword: `${accommodation.city} 힐링`, search_volume: 380, trend: '+15%' }
      ],

      next_actions: [
        '계곡뷰 사진을 메인 이미지로 교체',
        '피크닉 세트 패키지 상품 개발',
        '주말 요금 15% 상향 조정',
        '바베큐 시설 어필 문구 추가'
      ],

      generated_at: new Date().toISOString(),
      quota_status: {
        used: quotaResult.total_runs,
        remaining: 2 - quotaResult.total_runs,
        reset_date: quotaResult.next_available
      }
    }

    const duration = Date.now() - startTime
    console.info(`Report generated: userId=${userId}, accomId=${accommodation.id}, duration=${duration}ms`)

    return NextResponse.json(payload, { status: 201 })

  } catch (error) {
    console.error('호스트 리포트 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
})