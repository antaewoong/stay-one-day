-- 🎯 Stay OneDay POI 감정 중심 알고리즘
-- "포토존, 아이동반, 감성공간" 중심의 모임 특화 분석

-- 1. POI 카테고리 매핑 테이블
CREATE TABLE IF NOT EXISTS poi_category_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_category TEXT NOT NULL,
  group_category TEXT NOT NULL CHECK (group_category IN (
    'photo_spot',      -- 포토존
    'kids_friendly',   -- 아이동반 
    'emotional_space', -- 감성공간
    'convenience',     -- 편의시설
    'group_activity'   -- 그룹활동
  )),
  weight DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. local_poi 테이블에 감정 기반 컬럼 추가
ALTER TABLE local_poi 
ADD COLUMN IF NOT EXISTS category_group TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS group_suitability_score DECIMAL(4,2) DEFAULT 0;

-- 3. 감정 기반 POI Heat 계산을 위한 MV
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_poi_heat_group AS
WITH poi_with_distance AS (
  SELECT 
    a.id as accommodation_id,
    p.id as poi_id,
    p.place_name as poi_name,
    p.category,
    p.signals,
    p.category_group,
    p.group_suitability_score,
    earth_distance(
      ll_to_earth(a.latitude, a.longitude), 
      ll_to_earth(p.lat, p.lon)
    ) as distance_m
  FROM accommodations a
  CROSS JOIN local_poi p
  WHERE earth_distance(
    ll_to_earth(a.latitude, a.longitude), 
    ll_to_earth(p.lat, p.lon)
  ) <= 2000 -- 2km 반경
),
poi_emotion_scores AS (
  SELECT 
    *,
    -- 포토존 점수 (인스타 해시태그 기반)
    CASE 
      WHEN (signals->>'ig_hashtags')::int > 0 
      THEN LN(1 + (signals->>'ig_hashtags')::int) * 0.25
      ELSE 0 
    END as photo_spot_score,
    
    -- 아이 친화 점수 (키즈 리뷰 기반)
    CASE 
      WHEN (signals->>'kids_reviews')::int > 0 
      THEN LEAST((signals->>'kids_reviews')::int / 100.0, 1.0) * 0.20
      ELSE 0 
    END as kids_friendly_score,
    
    -- 그룹 편의 점수 (편의시설 + 야간영업 + 주차)
    (
      COALESCE((signals->>'convenience')::int, 0) +
      COALESCE((signals->>'late_open')::int, 0) * 2 + -- 야간영업 가중치
      COALESCE((signals->>'parking')::int, 0)
    ) / 10.0 * 0.20 as group_convenience_score,
    
    -- 감정 점수 (-1 ~ +1 범위)
    COALESCE((signals->>'sentiment_score')::numeric, 0) * 0.35 as sentiment_score,
    
    -- 거리 가중치
    CASE 
      WHEN distance_m <= 500 THEN 1.0
      WHEN distance_m <= 1000 THEN 0.7
      WHEN distance_m <= 2000 THEN 0.4
      ELSE 0.1
    END as distance_weight
  FROM poi_with_distance
),
poi_scores_ranked AS (
  SELECT 
    *,
    (photo_spot_score + kids_friendly_score + group_convenience_score + sentiment_score) * distance_weight as total_score,
    ROW_NUMBER() OVER (
      PARTITION BY accommodation_id 
      ORDER BY (photo_spot_score + kids_friendly_score + group_convenience_score + sentiment_score) * distance_weight DESC
    ) as rank
  FROM poi_emotion_scores
  WHERE distance_m <= 2000
),
top_contributors_per_accommodation AS (
  SELECT 
    accommodation_id,
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'poi_id', poi_id,
        'name', poi_name,
        'category', category,
        'distance_m', ROUND(distance_m::numeric),
        'total_score', ROUND(total_score::numeric, 2)
      )
    ) as top_contributors
  FROM poi_scores_ranked
  WHERE rank <= 5
  GROUP BY accommodation_id
),
accommodation_scores AS (
  SELECT 
    accommodation_id,
    
    -- 개별 점수들
    SUM(photo_spot_score * distance_weight) as total_photo_spot_score,
    SUM(kids_friendly_score * distance_weight) as total_kids_friendly_score,
    SUM(group_convenience_score * distance_weight) as total_convenience_score,
    SUM(sentiment_score * distance_weight) as total_sentiment_score,
    
    -- 종합 LHI Group 점수
    SUM(
      (photo_spot_score + kids_friendly_score + group_convenience_score + sentiment_score) 
      * distance_weight
    ) as lhi_group,
    
    -- 메타데이터
    COUNT(DISTINCT poi_id) as poi_count,
    AVG(distance_m) as avg_distance_m
    
  FROM poi_emotion_scores
  WHERE distance_m <= 2000
  GROUP BY accommodation_id
)
SELECT 
  ac.accommodation_id,
  CURRENT_DATE as date,
  ac.total_photo_spot_score,
  ac.total_kids_friendly_score,
  ac.total_convenience_score,
  ac.total_sentiment_score,
  ac.lhi_group,
  
  -- 상위 기여 POI 
  COALESCE(tc.top_contributors, '[]'::json) as top_contributors,
  
  -- 메타데이터
  ac.poi_count,
  ac.avg_distance_m,
  NOW() as refreshed_at
  
FROM accommodation_scores ac
LEFT JOIN top_contributors_per_accommodation tc ON ac.accommodation_id = tc.accommodation_id;

-- 4. Group-optimized Same-Day Fit 확장 뷰
CREATE OR REPLACE VIEW v_same_day_fit_group AS
WITH base_sf AS (
  SELECT 
    sf.id,
    sf.accommodation_id,
    sf.date,
    sf.weekday_visit_ratio,
    sf.daytime_traffic_ratio,
    sf.poi_heat_1km,
    sf.family_segment_ratio,
    sf.female_segment_ratio,
    sf.sf_score,
    sf.created_at,
    sf.updated_at,
    sf.created_by,
    pg.lhi_group,
    pg.total_photo_spot_score,
    pg.total_kids_friendly_score,
    pg.total_convenience_score,
    pg.total_sentiment_score,
    pg.top_contributors
  FROM same_day_fit_metrics sf
  LEFT JOIN mv_poi_heat_group pg ON sf.accommodation_id = pg.accommodation_id
)
SELECT 
  sf.id,
  sf.accommodation_id,
  sf.date,
  sf.weekday_visit_ratio,
  sf.daytime_traffic_ratio,
  sf.poi_heat_1km,
  sf.family_segment_ratio,
  sf.female_segment_ratio,
  sf.sf_score,
  sf.created_at,
  sf.updated_at,
  sf.created_by,
  sf.lhi_group,
  sf.total_photo_spot_score,
  sf.total_kids_friendly_score,
  sf.total_convenience_score,
  sf.total_sentiment_score,
  
  -- 페르소나별 특화 점수 (사용자 요구사항 반영)
  (COALESCE(sf.total_kids_friendly_score, 0) * 0.4 + COALESCE(sf.total_convenience_score, 0) * 0.3 + 
   COALESCE(sf.total_photo_spot_score, 0) * 0.2 + COALESCE(sf.total_sentiment_score, 0) * 0.1) as sf_score_moms,
   
  (COALESCE(sf.total_kids_friendly_score, 0) * 0.1 + COALESCE(sf.total_convenience_score, 0) * 0.2 + 
   COALESCE(sf.total_photo_spot_score, 0) * 0.5 + COALESCE(sf.total_sentiment_score, 0) * 0.2) as sf_score_bridal,
   
  (COALESCE(sf.total_kids_friendly_score, 0) * 0.2 + COALESCE(sf.total_convenience_score, 0) * 0.3 + 
   COALESCE(sf.total_photo_spot_score, 0) * 0.3 + COALESCE(sf.total_sentiment_score, 0) * 0.2) as sf_score_friends,
   
  (COALESCE(sf.total_kids_friendly_score, 0) * 0.1 + COALESCE(sf.total_convenience_score, 0) * 0.2 + 
   COALESCE(sf.total_photo_spot_score, 0) * 0.3 + COALESCE(sf.total_sentiment_score, 0) * 0.4) as sf_score_couples,
   
  -- 최적 페르소나 추천
  CASE 
    WHEN COALESCE(sf.total_kids_friendly_score, 0) >= COALESCE(sf.total_photo_spot_score, 0) 
         AND COALESCE(sf.total_kids_friendly_score, 0) >= COALESCE(sf.total_sentiment_score, 0) THEN 'moms'
    WHEN COALESCE(sf.total_photo_spot_score, 0) >= COALESCE(sf.total_sentiment_score, 0) THEN 'bridal'
    WHEN COALESCE(sf.total_sentiment_score, 0) >= COALESCE(sf.total_convenience_score, 0) THEN 'couples'
    ELSE 'friends'
  END as recommended_persona,
  
  sf.top_contributors
FROM base_sf sf;

-- 5. alert_rules 테이블에 페르소나 관련 컬럼 추가
ALTER TABLE alert_rules 
ADD COLUMN IF NOT EXISTS persona_target TEXT DEFAULT 'all',
ADD COLUMN IF NOT EXISTS emotion_threshold DECIMAL(4,2) DEFAULT 0;

-- 6. 모임 특화 알림 룰 3종 추가 (기존에 없을 때만)
DO $$
BEGIN
  -- LHI_GROUP_SPIKE 룰 추가
  IF NOT EXISTS (
    SELECT 1 FROM alert_rules 
    WHERE rule_name = 'LHI_GROUP_SPIKE' 
    LIMIT 1
  ) THEN
    INSERT INTO alert_rules (
      host_id, rule_name, rule_type, threshold, 
      persona_target, emotion_threshold, enabled
    ) 
    SELECT 
      h.id as host_id,
      'LHI_GROUP_SPIKE' as rule_name,
      'LHI_SPIKE' as rule_type,
      '{"delta": 20, "windowDays": 7}'::jsonb as threshold,
      'all' as persona_target,
      0.0 as emotion_threshold,
      true as enabled
    FROM hosts h;
  END IF;
  
  -- KIDS_MOMENTUM 룰 추가
  IF NOT EXISTS (
    SELECT 1 FROM alert_rules 
    WHERE rule_name = 'KIDS_MOMENTUM' 
    LIMIT 1
  ) THEN
    INSERT INTO alert_rules (
      host_id, rule_name, rule_type, threshold, 
      persona_target, emotion_threshold, enabled
    ) 
    SELECT 
      h.id as host_id,
      'KIDS_MOMENTUM' as rule_name,
      'CUSTOM' as rule_type,
      '{"delta": 30, "windowDays": 14}'::jsonb as threshold,
      'moms' as persona_target,
      0.5 as emotion_threshold,
      true as enabled
    FROM hosts h;
  END IF;
  
  -- BRIDAL_OPPORTUNITY 룰 추가
  IF NOT EXISTS (
    SELECT 1 FROM alert_rules 
    WHERE rule_name = 'BRIDAL_OPPORTUNITY' 
    LIMIT 1
  ) THEN
    INSERT INTO alert_rules (
      host_id, rule_name, rule_type, threshold, 
      persona_target, emotion_threshold, enabled
    ) 
    SELECT 
      h.id as host_id,
      'BRIDAL_OPPORTUNITY' as rule_name,
      'CUSTOM' as rule_type,
      '{"delta": 25}'::jsonb as threshold,
      'bridal' as persona_target,
      0.6 as emotion_threshold,
      true as enabled
    FROM hosts h;
  END IF;
END $$;

-- 7. 기본 카테고리 매핑 데이터 삽입
INSERT INTO poi_category_mapping (original_category, group_category, weight) VALUES
-- 포토존 카테고리
('cafe', 'photo_spot', 0.8),
('restaurant', 'photo_spot', 0.6),
('attraction', 'photo_spot', 1.0),
('park', 'photo_spot', 0.9),

-- 키즈 친화 카테고리  
('kids', 'kids_friendly', 1.0),
('playground', 'kids_friendly', 1.0),
('academy', 'kids_friendly', 0.7),
('family_restaurant', 'kids_friendly', 0.8),

-- 감성공간 카테고리
('cafe', 'emotional_space', 0.9),
('gallery', 'emotional_space', 1.0),
('bookstore', 'emotional_space', 0.8),
('flower_shop', 'emotional_space', 0.7),

-- 편의시설 카테고리
('parking', 'convenience', 1.0),
('convenience_store', 'convenience', 0.9),
('pharmacy', 'convenience', 0.6),
('bank', 'convenience', 0.5),

-- 그룹활동 카테고리
('karaoke', 'group_activity', 1.0),
('bowling', 'group_activity', 0.9),
('escape_room', 'group_activity', 0.8),
('board_game_cafe', 'group_activity', 0.9)

ON CONFLICT DO NOTHING;

-- 8. 인덱스 및 성능 최적화
CREATE INDEX IF NOT EXISTS idx_poi_category_mapping_original 
  ON poi_category_mapping(original_category);

CREATE INDEX IF NOT EXISTS idx_poi_category_mapping_group 
  ON poi_category_mapping(group_category);

CREATE INDEX IF NOT EXISTS idx_local_poi_category_group 
  ON local_poi(category_group);

CREATE INDEX IF NOT EXISTS idx_local_poi_group_suitability 
  ON local_poi(group_suitability_score DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_poi_heat_group_accommodation_date 
  ON mv_poi_heat_group(accommodation_id, date);

CREATE INDEX IF NOT EXISTS idx_mv_poi_heat_group_lhi_score 
  ON mv_poi_heat_group(lhi_group DESC);

-- 9. RLS 정책 (Stay OneDay 보안 대원칙 준수)
ALTER TABLE poi_category_mapping ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "poi_category_mapping_read_all" ON poi_category_mapping;
CREATE POLICY "poi_category_mapping_read_all" ON poi_category_mapping
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "poi_category_mapping_admin_modify" ON poi_category_mapping;
CREATE POLICY "poi_category_mapping_admin_modify" ON poi_category_mapping
  FOR ALL USING (
    get_user_role() = ANY (ARRAY['super_admin'::text, 'admin'::text])
  );

-- 10. POI 감정 뷰 갱신 함수
CREATE OR REPLACE FUNCTION refresh_poi_emotion_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_poi_heat_group;
  
  -- 갱신 로그
  INSERT INTO system_settings (key, value, updated_at) 
  VALUES ('poi_emotion_mv_last_refresh', NOW()::text, NOW())
  ON CONFLICT (key) 
  DO UPDATE SET value = NOW()::text, updated_at = NOW();
END;
$$ LANGUAGE plpgsql;