-- 🚀 Stay OneDay 기본 마케팅 스키마 (간소화 버전)
-- 핵심 테이블들만 먼저 생성

-- 1. alerts_outbox 테이블 (알림 큐 시스템)
CREATE TABLE IF NOT EXISTS alerts_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL,
  alert_rule_id UUID,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. UTM 정규화 매핑 테이블
CREATE TABLE IF NOT EXISTS utm_source_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_utm_source TEXT NOT NULL,
  raw_utm_medium TEXT NOT NULL,
  raw_utm_campaign TEXT DEFAULT '',
  canonical_source TEXT NOT NULL,
  canonical_medium TEXT NOT NULL,
  canonical_campaign TEXT DEFAULT '',
  confidence_score DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 지출 추적 테이블
CREATE TABLE IF NOT EXISTS spend_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL,
  date DATE NOT NULL,
  source TEXT NOT NULL,
  medium TEXT NOT NULL,
  campaign TEXT DEFAULT '',
  spend_krw DECIMAL(12,2) NOT NULL DEFAULT 0,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue_krw DECIMAL(12,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. GSC 데이터 테이블
CREATE TABLE IF NOT EXISTS gsc_daily_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL,
  date DATE NOT NULL,
  query TEXT NOT NULL,
  page TEXT NOT NULL,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  ctr DECIMAL(5,4) DEFAULT 0,
  position DECIMAL(4,1) DEFAULT 0,
  country TEXT DEFAULT 'KOR',
  device TEXT DEFAULT 'DESKTOP',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Same-Day Fit 메트릭 테이블
CREATE TABLE IF NOT EXISTS same_day_fit_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_id UUID NOT NULL,
  date DATE NOT NULL,
  weekday_visit_ratio DECIMAL(5,4) DEFAULT 0,
  daytime_traffic_ratio DECIMAL(5,4) DEFAULT 0,
  poi_heat_1km DECIMAL(8,3) DEFAULT 0,
  family_segment_ratio DECIMAL(5,4) DEFAULT 0,
  female_segment_ratio DECIMAL(5,4) DEFAULT 0,
  sf_score DECIMAL(6,3) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 사용자 세그먼트 분석 테이블
CREATE TABLE IF NOT EXISTS user_segments_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_id UUID NOT NULL,
  date DATE NOT NULL,
  segment_type TEXT NOT NULL,
  segment_value TEXT NOT NULL,
  visitors_count INTEGER DEFAULT 0,
  bookings_count INTEGER DEFAULT 0,
  revenue_krw DECIMAL(12,2) DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_alerts_outbox_host_id ON alerts_outbox(host_id);
CREATE INDEX IF NOT EXISTS idx_alerts_outbox_status ON alerts_outbox(status);
CREATE INDEX IF NOT EXISTS idx_alerts_outbox_priority ON alerts_outbox(priority);

CREATE INDEX IF NOT EXISTS idx_spend_tracking_host_date ON spend_tracking(host_id, date);
CREATE INDEX IF NOT EXISTS idx_gsc_daily_host_date ON gsc_daily_data(host_id, date);
CREATE INDEX IF NOT EXISTS idx_sf_metrics_accommodation_date ON same_day_fit_metrics(accommodation_id, date);
CREATE INDEX IF NOT EXISTS idx_user_segments_accommodation_date ON user_segments_daily(accommodation_id, date);

-- 기본 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
DROP TRIGGER IF EXISTS update_spend_tracking_updated_at ON spend_tracking;
CREATE TRIGGER update_spend_tracking_updated_at 
  BEFORE UPDATE ON spend_tracking 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sf_metrics_updated_at ON same_day_fit_metrics;
CREATE TRIGGER update_sf_metrics_updated_at 
  BEFORE UPDATE ON same_day_fit_metrics 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();