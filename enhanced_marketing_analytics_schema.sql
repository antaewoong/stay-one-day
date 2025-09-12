-- Stay OneDay 향상된 마케팅 분석 스키마
-- 지역 상권 기반 실행 가능한 인사이트 시스템

-- 1) UTM 정규화 - 스펠링 제각각 문제 해결
CREATE TABLE utm_canonical (
  id BIGSERIAL PRIMARY KEY,
  raw_source TEXT, 
  raw_medium TEXT, 
  raw_campaign TEXT,
  source TEXT,     -- 정규화된 소스 (ig, insta → instagram)
  medium TEXT,     -- 정규화된 미디엄
  campaign TEXT,   -- 정규화된 캠페인
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- UTM 정규화 데이터 삽입
INSERT INTO utm_canonical (raw_source, source, raw_medium, medium) VALUES
('ig', 'instagram', 'social', 'social'),
('insta', 'instagram', 'social', 'social'),
('instagram', 'instagram', 'social', 'social'),
('fb', 'facebook', 'social', 'social'),
('facebook', 'facebook', 'social', 'social'),
('naver', 'naver', 'cpc', 'cpc'),
('google', 'google', 'cpc', 'cpc'),
('youtube', 'youtube', 'video', 'video'),
('yt', 'youtube', 'video', 'video'),
('kakao', 'kakao', 'social', 'social'),
('blog', 'blog', 'referral', 'referral');

-- 2) 경쟁/플레이스 스냅샷 - 네이버 플레이스 신호 수집
CREATE TABLE competitor_snapshot (
  id BIGSERIAL PRIMARY KEY,
  accommodation_id UUID REFERENCES accommodations(id),
  competitor_name TEXT,
  competitor_address TEXT,
  channel TEXT,                    -- 'naver_place', 'google_place'
  review_count INT DEFAULT 0,
  photo_count INT DEFAULT 0,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  keyword_rank INT,                -- 지명+키워드 노출 순위
  response_time_hours INT,         -- 사장님 댓글 응답시간
  recent_reviews_7d INT DEFAULT 0, -- 최근 7일 리뷰 증가
  signals JSONB DEFAULT '{}',      -- 추가 신호 데이터
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) POI & 지역 히트 인덱스
CREATE TABLE local_poi (
  id BIGSERIAL PRIMARY KEY,
  place_name TEXT NOT NULL,
  category TEXT NOT NULL,          -- 'restaurant','academy','attraction','cafe','kids'
  address TEXT,
  lat NUMERIC(10,8) NOT NULL,
  lon NUMERIC(11,8) NOT NULL,
  signals JSONB DEFAULT '{}',      -- {reviews:123, insta_tags:45, naver_visits:67}
  quality_score NUMERIC(5,2) DEFAULT 0,  -- 종합 품질 점수
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 지리적 인덱스 추가
CREATE INDEX idx_local_poi_location ON local_poi USING GIST (ll_to_earth(lat, lon));

CREATE TABLE poi_heat_daily (
  id BIGSERIAL PRIMARY KEY,
  accommodation_id UUID REFERENCES accommodations(id),
  buffer_m INTEGER NOT NULL,       -- 500, 1000 (반경 미터)
  heat_score NUMERIC(10,2) NOT NULL, -- LHI (Local Heat Index)
  details JSONB DEFAULT '{}',      -- 상위 기여 POI 리스트와 점수
  trend_7d NUMERIC(5,2) DEFAULT 0, -- 7일 트렌드 변화율
  top_contributors JSONB DEFAULT '[]', -- 상위 기여 POI 3개
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_poi_heat_daily_unique ON poi_heat_daily(accommodation_id, buffer_m, date);

-- 4) 광고 스펜드 & 어트리뷰션
CREATE TABLE spend_daily (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  channel TEXT NOT NULL,           -- 'naver','google','instagram','youtube','facebook'
  campaign_name TEXT,
  cost NUMERIC(12,2) DEFAULT 0,
  clicks INT DEFAULT 0,
  impressions INT DEFAULT 0,
  conversions INT DEFAULT 0,       -- 전환수
  account_id TEXT,                 -- 광고 계정 ID
  host_id UUID REFERENCES hosts(id), -- 호스트별 스펜드
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_spend_daily_date_channel ON spend_daily(date, channel);
CREATE INDEX idx_spend_daily_host ON spend_daily(host_id, date);

-- 5) A/B 테스트 하네스
CREATE TABLE ab_test_variants (
  id BIGSERIAL PRIMARY KEY,
  test_name TEXT NOT NULL,
  variant_name TEXT NOT NULL,      -- 'control', 'variant_a', 'variant_b'
  segment TEXT NOT NULL,           -- 'family', 'couple', 'kids'
  timing TEXT NOT NULL,            -- 'weekday', 'weekend'
  creative_type TEXT,              -- 'image', 'video', 'carousel'
  copy_text TEXT,
  offer_details JSONB DEFAULT '{}', -- 할인율, 조건 등
  target_params JSONB DEFAULT '{}', -- 타겟팅 파라미터
  status TEXT DEFAULT 'draft',     -- 'draft', 'running', 'paused', 'completed'
  traffic_allocation NUMERIC(3,2) DEFAULT 50.0, -- 트래픽 할당 비율
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

CREATE TABLE ab_test_results (
  id BIGSERIAL PRIMARY KEY,
  variant_id BIGINT REFERENCES ab_test_variants(id),
  date DATE NOT NULL,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  conversions INT DEFAULT 0,
  cost NUMERIC(10,2) DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6) 텔레그램 알림 룰 엔진
CREATE TABLE alert_rules (
  id BIGSERIAL PRIMARY KEY,
  host_id UUID REFERENCES hosts(id),
  rule_type TEXT NOT NULL,         -- 'LHI_SPIKE','CPA_SPIKE','REVIEW_VELOCITY_DROP'
  rule_name TEXT NOT NULL,         -- 사용자 친화적 이름
  threshold JSONB NOT NULL,        -- {delta:0.3, window_days:7, min_threshold:50}
  channel TEXT DEFAULT 'telegram', -- 알림 채널
  cooldown_hours INT DEFAULT 24,   -- 같은 알림 재발송 방지 시간
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alerts_outbox (
  id BIGSERIAL PRIMARY KEY,
  host_id UUID REFERENCES hosts(id),
  rule_id BIGINT REFERENCES alert_rules(id),
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',         -- 알림과 관련된 상세 데이터
  status TEXT DEFAULT 'pending',   -- 'pending'|'sent'|'failed'|'cancelled'
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  priority INT DEFAULT 1,          -- 1(높음) ~ 3(낮음)
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX idx_alerts_outbox_status ON alerts_outbox(status, scheduled_at);
CREATE INDEX idx_alerts_outbox_host ON alerts_outbox(host_id, created_at);

-- 7) 검색어 성과 추적 (Google Search Console 연동)
CREATE TABLE gsc_queries (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  query TEXT NOT NULL,
  country TEXT DEFAULT 'KR',
  device TEXT DEFAULT 'ALL',       -- 'DESKTOP', 'MOBILE', 'TABLET', 'ALL'
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  ctr NUMERIC(5,4) DEFAULT 0,      -- 클릭률 (0.1234 = 12.34%)
  position NUMERIC(5,2) DEFAULT 0, -- 평균 검색 순위
  accommodation_id UUID,           -- 특정 숙소와 연관된 쿼리
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gsc_queries_date ON gsc_queries(date);
CREATE INDEX idx_gsc_queries_accommodation ON gsc_queries(accommodation_id, date);

-- 8) 예약 어트리뷰션 (마케팅 터치포인트 추적)
CREATE TABLE reservation_attribution (
  id BIGSERIAL PRIMARY KEY,
  reservation_id UUID REFERENCES reservations(id),
  session_id TEXT,                 -- 웹 세션 ID
  touchpoint_sequence JSONB DEFAULT '[]', -- 터치포인트 순서
  first_touch JSONB DEFAULT '{}',  -- 최초 접촉 채널
  last_touch JSONB DEFAULT '{}',   -- 마지막 접촉 채널
  attribution_model TEXT DEFAULT 'last_touch', -- 'first_touch', 'last_touch', 'linear', 'position_based'
  attributed_revenue NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9) 지역 상권 트렌드 스냅샷
CREATE TABLE local_trends (
  id BIGSERIAL PRIMARY KEY,
  region_name TEXT NOT NULL,       -- '제주시 노형동', '부산 해운대구' 등
  trend_type TEXT NOT NULL,        -- 'restaurant_boom', 'event', 'seasonal_trend'
  title TEXT NOT NULL,
  description TEXT,
  trend_score NUMERIC(5,2) DEFAULT 0, -- 트렌드 강도 점수
  urgency TEXT DEFAULT 'medium',   -- 'high', 'medium', 'low'
  opportunity_text TEXT,           -- 기회 설명
  action_deadline DATE,            -- 액션 데드라인
  data_sources JSONB DEFAULT '[]', -- 데이터 소스 목록
  coordinates JSONB DEFAULT '{}',  -- {lat: 33.123, lng: 126.456}
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ           -- 트렌드 만료 시점
);

CREATE INDEX idx_local_trends_region ON local_trends(region_name, detected_at);

-- 유용한 뷰와 함수들

-- 1) 정규화된 UTM 소스 뷰
CREATE VIEW v_normalized_utm AS
SELECT 
  r.id,
  r.utm_source as raw_source,
  r.utm_medium as raw_medium,  
  r.utm_campaign as raw_campaign,
  COALESCE(uc_source.source, r.utm_source) as normalized_source,
  COALESCE(uc_medium.medium, r.utm_medium) as normalized_medium,
  COALESCE(r.utm_campaign, 'direct') as normalized_campaign,
  r.total_amount,
  r.created_at
FROM reservations r
LEFT JOIN utm_canonical uc_source ON LOWER(r.utm_source) = LOWER(uc_source.raw_source)
LEFT JOIN utm_canonical uc_medium ON LOWER(r.utm_medium) = LOWER(uc_medium.raw_medium);

-- 2) LHI 계산 함수
CREATE OR REPLACE FUNCTION calculate_lhi(
  target_lat NUMERIC,
  target_lon NUMERIC,
  buffer_meters INTEGER DEFAULT 1000
) RETURNS NUMERIC AS $$
DECLARE
  lhi_score NUMERIC := 0;
BEGIN
  SELECT 
    SUM(
      (COALESCE((signals->>'reviews')::INT, 0) * 0.3 +
       COALESCE((signals->>'insta_tags')::INT, 0) * 0.2 +
       COALESCE((signals->>'naver_visits')::INT, 0) * 0.1 +
       quality_score * 0.4) *
      CASE 
        WHEN earth_distance(ll_to_earth(target_lat, target_lon), ll_to_earth(lat, lon)) <= buffer_meters/2 
        THEN 1.0
        ELSE 0.6 
      END
    ) INTO lhi_score
  FROM local_poi
  WHERE earth_distance(ll_to_earth(target_lat, target_lon), ll_to_earth(lat, lon)) <= buffer_meters;
  
  RETURN COALESCE(lhi_score, 0);
END;
$$ LANGUAGE plpgsql;

-- 3) 채널별 ROAS 계산 뷰
CREATE VIEW v_channel_performance AS
WITH revenue_by_channel AS (
  SELECT 
    normalized_source as channel,
    DATE_TRUNC('day', created_at)::DATE as date,
    SUM(total_amount) as revenue,
    COUNT(*) as conversions
  FROM v_normalized_utm
  WHERE status = 'confirmed'
  GROUP BY 1, 2
),
spend_by_channel AS (
  SELECT 
    channel,
    date,
    SUM(cost) as cost,
    SUM(clicks) as clicks,
    SUM(impressions) as impressions
  FROM spend_daily
  GROUP BY 1, 2
)
SELECT 
  s.date,
  s.channel,
  s.cost,
  s.clicks,
  s.impressions,
  COALESCE(r.revenue, 0) as revenue,
  COALESCE(r.conversions, 0) as conversions,
  CASE 
    WHEN s.cost > 0 THEN ROUND(r.revenue / s.cost, 2)
    ELSE NULL 
  END as roas,
  CASE 
    WHEN r.conversions > 0 THEN ROUND(s.cost / r.conversions, 0)
    ELSE NULL 
  END as cpa,
  CASE 
    WHEN s.clicks > 0 THEN ROUND((r.conversions::NUMERIC / s.clicks) * 100, 2)
    ELSE 0 
  END as conversion_rate
FROM spend_by_channel s
LEFT JOIN revenue_by_channel r ON r.channel = s.channel AND r.date = s.date
ORDER BY s.date DESC, s.channel;

-- 샘플 데이터 삽입 (테스트용)
INSERT INTO local_poi (place_name, category, lat, lon, signals, quality_score) VALUES
('제주 흑돼지 맛집', 'restaurant', 33.4996, 126.5312, '{"reviews":450,"insta_tags":89,"naver_visits":1200}', 8.5),
('키즈카페 놀이터', 'kids', 33.5010, 126.5298, '{"reviews":234,"insta_tags":156,"naver_visits":890}', 7.8),
('제주 카페 바다뷰', 'cafe', 33.4985, 126.5325, '{"reviews":678,"insta_tags":234,"naver_visits":1500}', 9.2),
('영어학원 ABC', 'academy', 33.5005, 126.5315, '{"reviews":89,"insta_tags":12,"parent_visits":450}', 6.5);

-- 샘플 알림 룰
INSERT INTO alert_rules (host_id, rule_type, rule_name, threshold) VALUES
((SELECT id FROM hosts LIMIT 1), 'LHI_SPIKE', '지역 히트 급등 알림', '{"delta":0.25,"window_days":7,"min_threshold":50}'),
((SELECT id FROM hosts LIMIT 1), 'CPA_SPIKE', 'CPA 급증 알림', '{"delta":0.3,"min_cost":100000}'),
((SELECT id FROM hosts LIMIT 1), 'REVIEW_VELOCITY_DROP', '리뷰 속도 하락 알림', '{"delta":-0.15,"window_days":7}');

-- 인덱스 최적화
CREATE INDEX idx_reservations_utm_created ON reservations(utm_source, utm_medium, created_at);
CREATE INDEX idx_reservations_status_amount ON reservations(status, total_amount, created_at);