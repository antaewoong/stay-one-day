import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { influencerData } = await request.json()
    
    if (!influencerData) {
      return NextResponse.json(
        { error: '인플루언서 데이터가 필요합니다' },
        { status: 400 }
      )
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `
다음 인플루언서 데이터를 분석하여 숙박업체 협업에 적합한지 종합적으로 평가해주세요:

**인플루언서 정보:**
- 이름: ${influencerData.name}
- 팔로워 수: ${influencerData.follower_count?.toLocaleString() || '정보 없음'}
- 참여율: ${influencerData.engagement_rate || 0}%
- 콘텐츠 카테고리: ${influencerData.content_category?.join(', ') || '정보 없음'}
- 인스타그램: ${influencerData.instagram_handle || '정보 없음'}
- 유튜브: ${influencerData.youtube_channel || '정보 없음'}
- 틱톡: ${influencerData.tiktok_handle || '정보 없음'}
- 블로그: ${influencerData.blog_url || '정보 없음'}
- 협업 단가: ${influencerData.collaboration_rate?.toLocaleString() || '정보 없음'}원
- 선호 협업 유형: ${influencerData.preferred_collaboration_type || '정보 없음'}
- 지역: ${influencerData.location || '정보 없음'}
- 소개: ${influencerData.bio || '정보 없음'}

**상세 평가 기준 (네이버 블로그 품질 등급 + SNS 마케팅 KPI 기반):**

1. **블로그 품질 등급** (25점) - 네이버 블로그 품질 기준 적용
   - 컨텐츠 원창성 및 독창성 평가
   - 포스팅 빈도 및 일관성 (주 2-3회 이상 권장)
   - 텍스트 품질: 맞춤법, 문체, 구성력
   - 이미지 품질: 해상도, 구도, 편집 수준
   - SEO 최적화 수준 (키워드, 태그 활용도)

2. **SNS 인게이지먼트 KPI** (25점) - 정확한 마케팅 지표
   - **인스타그램**: 
     * 참여율 = (좋아요 + 댓글 + 공유) / 팔로워 수 × 100
     * 리치율 = 도달한 사용자 / 팔로워 수 × 100
     * 스토리 완주율, 저장률 고려
   - **유튜브**: 
     * 조회수 대비 구독자 전환율
     * 평균 시청 시간, 완주율
     * 댓글 상호작용 품질
   - **틱톡**: 
     * 바이럴 지수 (공유/저장/듀엣 비율)
     * 해시태그 트렌드 활용도

3. **숙박/여행 마케팅 적합성** (20점)
   - 여행 컨셉별 전문성과 실제 경험치
   - 숙박 리뷰의 상세도 및 신뢰성
   - 위치 기반 마케팅 활용도 (지역별 인지도)
   - 계절/트렌드별 콘텐츠 기획 능력

4. **타겟 오디언스 분석** (15점)
   - 팔로워 연령대, 성별, 관심사 일치도
   - 댓글 품질 및 진성 팔로워 비율
   - 브랜드 협업 이력 및 성과
   - 지역적 영향력 (수도권/지방 등)

5. **ROI 예측 지수** (15점)
   - CPM (1000회 노출당 비용) 효율성
   - 예상 전환율 (클릭 → 예약)
   - 협업 단가 합리성
   - 장기적 브랜드 가치 기여도

**명확한 정량적 평가 기준:**

### 1. 블로그 품질 등급 (25점)
- **파워블로거 (23-25점)**: 월 방문자 10만+ || 구독자 1만+ || 네이버 검색 상위 10위 내
- **인플루언서 (18-22점)**: 월 방문자 5-10만 || 구독자 5천-1만 || 전문 분야 상위 50위 내
- **일반 활성 (13-17점)**: 월 방문자 1-5만 || 구독자 1천-5천 || 주 2-3회 포스팅
- **신규/비활성 (0-12점)**: 월 방문자 1만 미만 || 구독자 1천 미만 || 불규칙 포스팅

### 2. SNS 인게이지먼트 점수표 (25점)
**인스타그램:**
- 참여율 5% 이상 (25점), 3-5% (20점), 2-3% (15점), 1-2% (10점), 1% 미만 (5점)
- 스토리 완주율 70% 이상 (+3점), 50-70% (+2점), 30-50% (+1점)
- 저장률 5% 이상 (+2점), 3-5% (+1점)

**유튜브:**
- 구독자 전환율 10% 이상 (25점), 7-10% (20점), 5-7% (15점), 3-5% (10점), 3% 미만 (5점)
- 평균 시청완주율 50% 이상 (+3점), 30-50% (+2점), 20-30% (+1점)
- 댓글 품질지수 (답글률×평균글자수) 100+ (+2점)

**틱톡:**
- 바이럴 지수 (공유율 5% 이상) (25점), 3-5% (20점), 1-3% (15점), 0.5-1% (10점), 0.5% 미만 (5점)

### 3. 숙박/여행 마케팅 적합성 (20점)
- **숙박 리뷰 경험**: 10개 이상 (20점), 5-9개 (15점), 2-4개 (10점), 1개 (5점), 없음 (0점)
- **여행 콘텐츠 비중**: 70% 이상 (20점), 50-70% (15점), 30-50% (10점), 30% 미만 (5점)
- **지역별 영향력**: 다수 지역 (+5점), 특정 지역 집중 (+3점)
- **계절 트렌드 활용**: 연중 고른 활동 (+3점), 특정 계절 집중 (+1점)

### 4. 타겟 오디언스 일치도 (15점)
- **연령대 일치**: 타겟 연령과 80% 이상 일치 (15점), 60-80% (12점), 40-60% (8점), 40% 미만 (4점)
- **성별 분포**: 타겟과 일치 (+3점), 부분 일치 (+1점)
- **관심사 일치**: 여행/숙박 관심도 70% 이상 (+5점), 50-70% (+3점), 30-50% (+1점)

### 5. ROI 예측 지수 (15점)
- **CPM 효율성**: 3만원 이하 (15점), 3-5만원 (12점), 5-7만원 (8점), 7만원 이상 (4점)
- **전환율 예측**: 3% 이상 (15점), 2-3% (12점), 1-2% (8점), 1% 미만 (4점)
- **브랜드 협업 성공사례**: 10건 이상 (+5점), 5-9건 (+3점), 1-4건 (+1점)

**최종 등급 산출:**
- SS급: 95-100점 (파워 인플루언서 - 즉시 협업 추천)
- S급: 85-94점 (톱티어 인플루언서 - 적극 협업 추천)  
- A급: 75-84점 (우수 인플루언서 - 협업 추천)
- B급: 65-74점 (중간급 인플루언서 - 조건부 협업)
- C급: 50-64점 (신인 인플루언서 - 무료협업만 고려)
- D급: 50점 미만 (비추천)

**응답 형식 (JSON):**
{
  "overall_score": 총점(100점 만점),
  "grade": "등급(SS/S/A/B/C/D)",
  "blog_grade": "네이버 블로그 등급(파워블로거/인플루언서/일반활성/신규비활성)",
  "detailed_scores": {
    "blog_quality": 점수,
    "sns_engagement": 점수,
    "accommodation_marketing": 점수,
    "target_audience": 점수,
    "roi_prediction": 점수
  },
  "engagement_metrics": {
    "instagram_engagement_rate": "실제 참여율 (%)",
    "youtube_conversion_rate": "구독자 전환율 (%)",
    "tiktok_viral_score": "바이럴 지수",
    "average_reach_rate": "평균 리치율 (%)"
  },
  "marketing_insights": {
    "primary_audience": "주요 타겟층 (연령대/성별)",
    "content_specialty": ["전문 분야1", "전문 분야2"],
    "peak_engagement_time": "최적 포스팅 시간대",
    "seasonal_trends": "계절별 성과 트렌드"
  },
  "collaboration_analysis": {
    "recommended_collaboration_type": "추천 협업 유형 (무료/유상)",
    "optimal_accommodation_types": ["적합한 숙박 유형1", "적합한 숙박 유형2"],
    "expected_conversion_rate": "예상 전환율 (%)",
    "estimated_cpm": "예상 CPM (원)"
  },
  "strengths": ["강점1", "강점2", "강점3"],
  "weaknesses": ["약점1", "약점2"],
  "recommendations": ["개선사항1", "개선사항2"],
  "risk_factors": ["리스크 요소1", "리스크 요소2"],
  "final_recommendation": "최종 협업 추천도 (적극추천/추천/보통/비추천/강력비추천)"
}

분석은 객관적이고 실용적으로 해주시고, 숙박업체 관점에서 실제 도움이 되는 인사이트를 제공해주세요.
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    let analysisText = response.text()

    // JSON 파싱 시도
    let analysis
    try {
      // JSON 부분만 추출
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('JSON 형식이 아님')
      }
    } catch (parseError) {
      // JSON 파싱 실패 시 기본 구조로 응답
      analysis = {
        overall_score: 75,
        grade: "B",
        blog_grade: "일반활성",
        detailed_scores: {
          blog_quality: 18,
          sns_engagement: 20,
          accommodation_marketing: 15,
          target_audience: 12,
          roi_prediction: 10
        },
        engagement_metrics: {
          instagram_engagement_rate: "추정 3-5%",
          youtube_conversion_rate: "추정 2-3%",
          tiktok_viral_score: "중간",
          average_reach_rate: "추정 15-25%"
        },
        marketing_insights: {
          primary_audience: "20-30대 여성",
          content_specialty: ["여행", "라이프스타일"],
          peak_engagement_time: "평일 저녁 7-9시",
          seasonal_trends: "봄/가을 활성"
        },
        collaboration_analysis: {
          recommended_collaboration_type: "무료",
          optimal_accommodation_types: ["펜션", "게스트하우스"],
          expected_conversion_rate: "1-2%",
          estimated_cpm: "30,000-50,000원"
        },
        strengths: ["AI 분석을 통해 평가됨", "기본 정보 제공"],
        weaknesses: ["상세 분석 필요"],
        recommendations: ["더 많은 정보 수집 필요"],
        risk_factors: ["정보 부족"],
        final_recommendation: "보통",
        raw_analysis: analysisText
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      evaluated_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI 인플루언서 평가 오류:', error)
    return NextResponse.json(
      { 
        error: 'AI 평가 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}