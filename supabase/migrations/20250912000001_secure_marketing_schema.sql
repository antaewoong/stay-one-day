-- 🚀 Stay OneDay 마케팅 인텔리전스 스키마 (RLS 보안 준수)
-- 기존 RLS 패턴을 완전히 준수하는 안전한 마이그레이션

-- 1. alerts_outbox 테이블 (알림 큐 시스템)
CREATE TABLE IF NOT EXISTS alerts_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL,
  alert_rule_id BIGINT REFERENCES alert_rules(id),
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

-- 2. UTM 정규화 매핑 테이블 (관리자 전용)
CREATE TABLE IF NOT EXISTS utm_source_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_utm_source TEXT NOT NULL,
  raw_utm_medium TEXT NOT NULL,
  raw_utm_campaign TEXT DEFAULT '',
  canonical_source TEXT NOT NULL,
  canonical_medium TEXT NOT NULL,
  canonical_campaign TEXT DEFAULT '',
  confidence_score DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 3. 지출 추적 테이블 (호스트별 마케팅 비용)
CREATE TABLE IF NOT EXISTS spend_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES hosts(id),
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 4. GSC 데이터 테이블 (구글 서치 콘솔 - 호스트별)
CREATE TABLE IF NOT EXISTS gsc_daily_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES hosts(id),
  date DATE NOT NULL,
  query TEXT NOT NULL,
  page TEXT NOT NULL,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  ctr DECIMAL(5,4) DEFAULT 0,
  position DECIMAL(4,1) DEFAULT 0,
  country TEXT DEFAULT 'KOR',
  device TEXT DEFAULT 'DESKTOP',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 5. Same-Day Fit 메트릭 테이블 (숙소별)
CREATE TABLE IF NOT EXISTS same_day_fit_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_id UUID NOT NULL REFERENCES accommodations(id),
  date DATE NOT NULL,
  weekday_visit_ratio DECIMAL(5,4) DEFAULT 0,
  daytime_traffic_ratio DECIMAL(5,4) DEFAULT 0,
  poi_heat_1km DECIMAL(8,3) DEFAULT 0,
  family_segment_ratio DECIMAL(5,4) DEFAULT 0,
  female_segment_ratio DECIMAL(5,4) DEFAULT 0,
  sf_score DECIMAL(6,3) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 6. 사용자 세그먼트 분석 테이블 (숙소별)
CREATE TABLE IF NOT EXISTS user_segments_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_id UUID NOT NULL REFERENCES accommodations(id),
  date DATE NOT NULL,
  segment_type TEXT NOT NULL,
  segment_value TEXT NOT NULL,
  visitors_count INTEGER DEFAULT 0,
  bookings_count INTEGER DEFAULT 0,
  revenue_krw DECIMAL(12,2) DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 기본 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_alerts_outbox_host_id ON alerts_outbox(host_id);
CREATE INDEX IF NOT EXISTS idx_alerts_outbox_status ON alerts_outbox(status);
CREATE INDEX IF NOT EXISTS idx_alerts_outbox_priority ON alerts_outbox(priority);

CREATE INDEX IF NOT EXISTS idx_spend_tracking_host_date ON spend_tracking(host_id, date);
CREATE INDEX IF NOT EXISTS idx_gsc_daily_host_date ON gsc_daily_data(host_id, date);
CREATE INDEX IF NOT EXISTS idx_sf_metrics_accommodation_date ON same_day_fit_metrics(accommodation_id, date);
CREATE INDEX IF NOT EXISTS idx_user_segments_accommodation_date ON user_segments_daily(accommodation_id, date);

-- RLS 활성화 (Stay OneDay 보안 대원칙 준수)
ALTER TABLE alerts_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE utm_source_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE spend_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_daily_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE same_day_fit_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_segments_daily ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 (기존 패턴 100% 준수)

-- alerts_outbox: 호스트는 자기 알림만, 관리자는 전체 접근
DROP POLICY IF EXISTS "alerts_outbox_host_access" ON alerts_outbox;
CREATE POLICY "alerts_outbox_host_access" ON alerts_outbox
  FOR ALL USING (
    (host_id = auth.uid()) OR 
    (get_user_role() = ANY (ARRAY['super_admin'::text, 'admin'::text]))
  );

-- utm_source_mapping: 전체 읽기, 관리자만 수정
DROP POLICY IF EXISTS "utm_source_mapping_read_all" ON utm_source_mapping;
CREATE POLICY "utm_source_mapping_read_all" ON utm_source_mapping
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "utm_source_mapping_admin_only" ON utm_source_mapping;
CREATE POLICY "utm_source_mapping_admin_only" ON utm_source_mapping
  FOR INSERT WITH CHECK (
    get_user_role() = ANY (ARRAY['super_admin'::text, 'admin'::text])
  );

-- spend_tracking: 호스트는 자기 데이터만, 관리자는 전체
DROP POLICY IF EXISTS "spend_tracking_owner_access" ON spend_tracking;
CREATE POLICY "spend_tracking_owner_access" ON spend_tracking
  FOR ALL USING (
    (host_id = auth.uid()) OR 
    (get_user_role() = ANY (ARRAY['super_admin'::text, 'admin'::text]))
  );

-- gsc_daily_data: 호스트는 자기 데이터만, 관리자는 전체
DROP POLICY IF EXISTS "gsc_daily_owner_access" ON gsc_daily_data;
CREATE POLICY "gsc_daily_owner_access" ON gsc_daily_data
  FOR ALL USING (
    (host_id = auth.uid()) OR 
    (get_user_role() = ANY (ARRAY['super_admin'::text, 'admin'::text]))
  );

-- same_day_fit_metrics: 숙소 소유자만 접근 (기존 패턴 준수)
DROP POLICY IF EXISTS "sf_metrics_accommodation_owner" ON same_day_fit_metrics;
CREATE POLICY "sf_metrics_accommodation_owner" ON same_day_fit_metrics
  FOR ALL USING (
    (accommodation_id IN (
      SELECT id FROM accommodations 
      WHERE host_id IN (
        SELECT id FROM hosts WHERE user_id = auth.uid()
      )
    )) OR 
    (get_user_role() = ANY (ARRAY['super_admin'::text, 'admin'::text]))
  );

-- user_segments_daily: 숙소 소유자만 접근 (기존 패턴 준수)
DROP POLICY IF EXISTS "user_segments_accommodation_owner" ON user_segments_daily;
CREATE POLICY "user_segments_accommodation_owner" ON user_segments_daily
  FOR ALL USING (
    (accommodation_id IN (
      SELECT id FROM accommodations 
      WHERE host_id IN (
        SELECT id FROM hosts WHERE user_id = auth.uid()
      )
    )) OR 
    (get_user_role() = ANY (ARRAY['super_admin'::text, 'admin'::text]))
  );

-- 트리거 함수 (updated_at 자동 갱신)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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