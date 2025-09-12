-- 🎯 Stay OneDay 캐치프레이즈 A/B 테스트 시스템
-- 그룹 예약 유도를 위한 감성적 캐치프레이즈 최적화

-- 1. 캐치프레이즈 변형 테이블
CREATE TABLE IF NOT EXISTS catchphrase_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_group TEXT NOT NULL CHECK (test_group IN ('A', 'B', 'C')),
  persona TEXT NOT NULL CHECK (persona IN ('moms', 'bridal', 'friends', 'couples', 'all')),
  primary_text TEXT NOT NULL,
  secondary_text TEXT DEFAULT '',
  cta_text TEXT NOT NULL,
  emotion_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  active BOOLEAN DEFAULT true,
  weight INTEGER DEFAULT 100, -- 트래픽 분배 가중치 (100 = 100%)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. A/B 테스트 노출 추적 테이블
CREATE TABLE IF NOT EXISTS ab_test_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  variant_id UUID NOT NULL REFERENCES catchphrase_variants(id),
  accommodation_id UUID REFERENCES accommodations(id),
  persona TEXT NOT NULL,
  impression_timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. A/B 테스트 전환 추적 테이블
CREATE TABLE IF NOT EXISTS ab_test_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  impression_id UUID NOT NULL REFERENCES ab_test_impressions(id),
  session_id TEXT NOT NULL,
  conversion_type TEXT NOT NULL CHECK (conversion_type IN ('inquiry', 'booking', 'share', 'favorite')),
  conversion_timestamp TIMESTAMPTZ DEFAULT NOW(),
  booking_amount DECIMAL(12,2) DEFAULT 0,
  lead_time_hours INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 4. 기본 캐치프레이즈 변형 데이터 삽입
INSERT INTO catchphrase_variants (test_group, persona, primary_text, secondary_text, cta_text, emotion_keywords, weight) VALUES
-- A그룹: 감성적 접근
('A', 'moms', '아이들과 함께 만드는 특별한 하루', '엄마도 쉴 수 있는 프라이빗 공간에서', '우리만의 시간 예약하기', ARRAY['특별한', '프라이빗', '가족시간', '힐링'], 100),
('A', 'bridal', '인생샷이 보장되는 완벽한 공간', '신부와 친구들만의 로맨틱 브라이덜 샤워', '드림웨딩 공간 예약', ARRAY['인생샷', '로맨틱', '브라이덜', '완벽한'], 100),
('A', 'friends', '일상 탈출, 진짜 친구들과의 시간', '카페에서는 할 수 없는 진짜 수다와 추억', '우정 리차지 예약하기', ARRAY['일상탈출', '진짜', '추억', '우정'], 100),
('A', 'couples', '둘만의 비밀스러운 로맨틱 공간', '호텔보다 편안하고 집보다 특별한', '로맨틱 데이트 예약', ARRAY['비밀스러운', '로맨틱', '특별한', '둘만의'], 100),

-- B그룹: 실용적 접근  
('B', 'moms', '키즈 안전 시설 완비된 프리미엄 공간', '주차/편의시설까지 완벽하게 준비된', '안심 가족 공간 예약', ARRAY['안전시설', '프리미엄', '주차', '완벽'], 100),
('B', 'bridal', '전문 포토존과 파티 시설이 준비된 공간', '브라이덜 샤워 전용 케이터링까지 가능', '프리미엄 파티 예약', ARRAY['전문', '포토존', '케이터링', '프리미엄'], 100),
('B', 'friends', '최대 8명까지 편안한 단체 이용 공간', '바베큐/노래방 시설로 완벽한 모임', '완벽한 모임 예약하기', ARRAY['8명까지', '단체', '바베큐', '완벽'], 100),
('B', 'couples', '프라이빗 스파와 로맨틱 디너 가능 공간', '24시간 자유이용 + 컨시어지 서비스', '럭셔리 데이트 예약', ARRAY['프라이빗스파', '24시간', '컨시어지', '럭셔리'], 100),

-- C그룹: 가성비 접근
('C', 'moms', '호텔 절반 가격으로 즐기는 프리미엄 공간', '아이들 놀이시설까지 무료로 이용', '가성비 가족여행 예약', ARRAY['절반가격', '프리미엄', '무료', '가성비'], 100),
('C', 'bridal', '웨딩홀 대여비의 1/10로 완벽한 브라이덜', '전문 데코레이션 서비스 무료 제공', '합리적 파티 예약하기', ARRAY['1/10', '완벽한', '무료제공', '합리적'], 100),
('C', 'friends', '1인당 2만원대로 즐기는 프라이빗 모임', '술/음식 반입 자유 + 설거지 서비스', '가성비 모임 예약하기', ARRAY['2만원대', '반입자유', '설거지서비스', '가성비'], 100),
('C', 'couples', '호텔 스위트룸 가격에 풀빌라 하루 이용', '개인 수영장과 바베큐까지 무료', '가성비 로맨스 예약', ARRAY['스위트룸가격', '풀빌라', '개인수영장', '가성비'], 100)

ON CONFLICT DO NOTHING;

-- 5. A/B 테스트 성과 분석 뷰
CREATE OR REPLACE VIEW v_ab_test_performance AS
WITH impression_stats AS (
  SELECT 
    cv.id as variant_id,
    cv.test_group,
    cv.persona,
    cv.primary_text,
    cv.weight,
    COUNT(abi.id) as total_impressions,
    COUNT(DISTINCT abi.session_id) as unique_sessions,
    COUNT(DISTINCT abi.accommodation_id) as accommodations_shown
  FROM catchphrase_variants cv
  LEFT JOIN ab_test_impressions abi ON cv.id = abi.variant_id
  WHERE abi.impression_timestamp >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY cv.id, cv.test_group, cv.persona, cv.primary_text, cv.weight
),
conversion_stats AS (
  SELECT 
    abi.variant_id,
    COUNT(abc.id) as total_conversions,
    COUNT(abc.id) FILTER (WHERE abc.conversion_type = 'inquiry') as inquiries,
    COUNT(abc.id) FILTER (WHERE abc.conversion_type = 'booking') as bookings,
    SUM(abc.booking_amount) as total_booking_value,
    AVG(abc.lead_time_hours) as avg_lead_time_hours
  FROM ab_test_impressions abi
  LEFT JOIN ab_test_conversions abc ON abi.id = abc.impression_id
  WHERE abi.impression_timestamp >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY abi.variant_id
)
SELECT 
  is_stats.*,
  COALESCE(cs.total_conversions, 0) as total_conversions,
  COALESCE(cs.inquiries, 0) as inquiries,
  COALESCE(cs.bookings, 0) as bookings,
  COALESCE(cs.total_booking_value, 0) as total_booking_value,
  COALESCE(cs.avg_lead_time_hours, 0) as avg_lead_time_hours,
  
  -- 전환율 계산
  CASE WHEN is_stats.total_impressions > 0 THEN 
    COALESCE(cs.total_conversions, 0) * 100.0 / is_stats.total_impressions 
  ELSE 0 END as conversion_rate_pct,
  
  CASE WHEN is_stats.total_impressions > 0 THEN 
    COALESCE(cs.bookings, 0) * 100.0 / is_stats.total_impressions 
  ELSE 0 END as booking_rate_pct,
  
  -- 세션당 전환율
  CASE WHEN is_stats.unique_sessions > 0 THEN 
    COALESCE(cs.total_conversions, 0) * 100.0 / is_stats.unique_sessions 
  ELSE 0 END as session_conversion_rate_pct,
  
  -- 평균 예약 가치
  CASE WHEN cs.bookings > 0 THEN 
    cs.total_booking_value / cs.bookings 
  ELSE 0 END as avg_booking_value
FROM impression_stats is_stats
LEFT JOIN conversion_stats cs ON is_stats.variant_id = cs.variant_id;

-- 6. A/B 테스트 통계적 유의성 검증 함수
CREATE OR REPLACE FUNCTION ab_test_significance(
  group_a_conversions INTEGER,
  group_a_impressions INTEGER,
  group_b_conversions INTEGER,
  group_b_impressions INTEGER
)
RETURNS JSONB AS $$
DECLARE
  p1 DECIMAL;
  p2 DECIMAL;
  p_pooled DECIMAL;
  z_score DECIMAL;
  result JSONB;
BEGIN
  -- 전환율 계산
  p1 := CASE WHEN group_a_impressions > 0 THEN group_a_conversions::DECIMAL / group_a_impressions ELSE 0 END;
  p2 := CASE WHEN group_b_impressions > 0 THEN group_b_conversions::DECIMAL / group_b_impressions ELSE 0 END;
  
  -- 통합 전환율
  p_pooled := (group_a_conversions + group_b_conversions)::DECIMAL / (group_a_impressions + group_b_impressions);
  
  -- Z-score 계산 (간소화)
  z_score := CASE 
    WHEN group_a_impressions > 30 AND group_b_impressions > 30 THEN
      ABS(p1 - p2) / SQRT(p_pooled * (1 - p_pooled) * (1.0/group_a_impressions + 1.0/group_b_impressions))
    ELSE 0
  END;
  
  result := jsonb_build_object(
    'conversion_rate_a', ROUND(p1 * 100, 2),
    'conversion_rate_b', ROUND(p2 * 100, 2),
    'improvement_pct', ROUND((p2 - p1) * 100, 2),
    'z_score', ROUND(z_score, 3),
    'is_significant', z_score > 1.96, -- 95% 신뢰도
    'sample_size_adequate', (group_a_impressions > 30 AND group_b_impressions > 30),
    'recommendation', 
      CASE 
        WHEN z_score > 1.96 AND p2 > p1 THEN 'B그룹 채택 권장'
        WHEN z_score > 1.96 AND p1 > p2 THEN 'A그룹 채택 권장'
        WHEN group_a_impressions < 100 OR group_b_impressions < 100 THEN '더 많은 데이터 필요'
        ELSE '통계적 유의성 없음, 계속 테스트'
      END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 7. 캐치프레이즈 자동 할당 함수 (가중치 기반)
CREATE OR REPLACE FUNCTION get_catchphrase_variant(
  p_persona TEXT DEFAULT 'all',
  p_session_id TEXT DEFAULT gen_random_uuid()::TEXT
)
RETURNS JSONB AS $$
DECLARE
  selected_variant catchphrase_variants%ROWTYPE;
  total_weight INTEGER;
  random_value INTEGER;
  cumulative_weight INTEGER := 0;
  variant_cursor CURSOR FOR 
    SELECT * FROM catchphrase_variants 
    WHERE (persona = p_persona OR persona = 'all') 
    AND active = true
    ORDER BY test_group, weight;
BEGIN
  -- 총 가중치 계산
  SELECT SUM(weight) INTO total_weight
  FROM catchphrase_variants 
  WHERE (persona = p_persona OR persona = 'all') AND active = true;
  
  -- 가중치 없으면 기본값 반환
  IF total_weight IS NULL OR total_weight = 0 THEN
    RETURN jsonb_build_object(
      'variant_id', NULL,
      'test_group', 'A',
      'primary_text', '특별한 공간에서 만드는 소중한 시간',
      'secondary_text', '가족, 친구들과 함께하는 완벽한 하루',
      'cta_text', '지금 예약하기',
      'persona', p_persona
    );
  END IF;
  
  -- 랜덤 값 생성 (세션 ID 기반으로 일관성 보장)
  random_value := ABS(HASHTEXT(p_session_id)) % total_weight;
  
  -- 가중치 기반 선택
  FOR variant_record IN variant_cursor LOOP
    cumulative_weight := cumulative_weight + variant_record.weight;
    IF random_value < cumulative_weight THEN
      selected_variant := variant_record;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'variant_id', selected_variant.id,
    'test_group', selected_variant.test_group,
    'primary_text', selected_variant.primary_text,
    'secondary_text', selected_variant.secondary_text,
    'cta_text', selected_variant.cta_text,
    'persona', selected_variant.persona,
    'emotion_keywords', selected_variant.emotion_keywords
  );
END;
$$ LANGUAGE plpgsql;

-- 8. 인덱스 및 성능 최적화
CREATE INDEX IF NOT EXISTS idx_catchphrase_variants_persona_active 
  ON catchphrase_variants(persona, active) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_ab_impressions_variant_timestamp 
  ON ab_test_impressions(variant_id, impression_timestamp);

CREATE INDEX IF NOT EXISTS idx_ab_impressions_session_timestamp 
  ON ab_test_impressions(session_id, impression_timestamp);

CREATE INDEX IF NOT EXISTS idx_ab_conversions_impression_type 
  ON ab_test_conversions(impression_id, conversion_type);

-- 9. RLS 정책 (Stay OneDay 보안 대원칙 준수)
ALTER TABLE catchphrase_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_conversions ENABLE ROW LEVEL SECURITY;

-- catchphrase_variants: 전체 읽기, 관리자만 수정
DROP POLICY IF EXISTS "catchphrase_variants_read_all" ON catchphrase_variants;
CREATE POLICY "catchphrase_variants_read_all" ON catchphrase_variants
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "catchphrase_variants_admin_modify" ON catchphrase_variants;
CREATE POLICY "catchphrase_variants_admin_modify" ON catchphrase_variants
  FOR ALL USING (
    get_user_role() = ANY (ARRAY['super_admin'::text, 'admin'::text])
  );

-- ab_test_impressions: 관리자만 접근 (개인정보 포함)
DROP POLICY IF EXISTS "ab_test_impressions_admin_only" ON ab_test_impressions;
CREATE POLICY "ab_test_impressions_admin_only" ON ab_test_impressions
  FOR ALL USING (
    get_user_role() = ANY (ARRAY['super_admin'::text, 'admin'::text])
  );

-- ab_test_conversions: 관리자만 접근
DROP POLICY IF EXISTS "ab_test_conversions_admin_only" ON ab_test_conversions;
CREATE POLICY "ab_test_conversions_admin_only" ON ab_test_conversions
  FOR ALL USING (
    get_user_role() = ANY (ARRAY['super_admin'::text, 'admin'::text])
  );

-- 10. 트리거 적용 (updated_at 자동 갱신)
DROP TRIGGER IF EXISTS update_catchphrase_variants_updated_at ON catchphrase_variants;
CREATE TRIGGER update_catchphrase_variants_updated_at 
  BEFORE UPDATE ON catchphrase_variants 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();