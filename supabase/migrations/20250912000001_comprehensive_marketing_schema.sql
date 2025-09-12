-- 🚀 Stay OneDay 포괄적 마케팅 인텔리전스 스키마
-- 사용자 제공 스키마를 기반으로 한 완전한 마케팅 분석 시스템

-- 1. alerts_outbox 테이블 (알림 큐 시스템)
CREATE TABLE IF NOT EXISTS alerts_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES hosts(id),
  alert_rule_id UUID REFERENCES alert_rules(id),
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

-- 2. UTM 정규화 매핑 테이블 (기존 utm_canonical 보완)
-- 기존 utm_canonical 테이블이 있으므로 매핑 테이블만 추가
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

-- UNIQUE 인덱스를 별도로 생성 (NULL 값 처리)
CREATE UNIQUE INDEX IF NOT EXISTS idx_utm_source_mapping_unique 
ON utm_source_mapping(raw_utm_source, raw_utm_medium, COALESCE(raw_utm_campaign, ''));

-- 3. 지출 추적 테이블 (일별 마케팅 비용)
CREATE TABLE IF NOT EXISTS spend_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES hosts(id),
  date DATE NOT NULL,
  source TEXT NOT NULL,
  medium TEXT NOT NULL,
  campaign TEXT,
  spend_krw DECIMAL(12,2) NOT NULL DEFAULT 0,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue_krw DECIMAL(12,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. GSC 데이터 테이블 (구글 서치 콘솔 통합)
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Same-Day Fit 메트릭 테이블
CREATE TABLE IF NOT EXISTS same_day_fit_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_id UUID NOT NULL REFERENCES accommodations(id),
  date DATE NOT NULL,
  weekday_visit_ratio DECIMAL(5,4) DEFAULT 0, -- 주중 방문 비율
  daytime_traffic_ratio DECIMAL(5,4) DEFAULT 0, -- 10-18시 트래픽 비율
  poi_heat_1km DECIMAL(8,3) DEFAULT 0, -- 1km 반경 POI 히트
  family_segment_ratio DECIMAL(5,4) DEFAULT 0, -- 가족 세그먼트 비율
  female_segment_ratio DECIMAL(5,4) DEFAULT 0, -- 여성 세그먼트 비율
  sf_score DECIMAL(6,3) DEFAULT 0, -- 최종 SF 점수
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 세그먼트 분석 테이블
CREATE TABLE IF NOT EXISTS user_segments_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_id UUID NOT NULL REFERENCES accommodations(id),
  date DATE NOT NULL,
  segment_type TEXT NOT NULL, -- 'age_group', 'gender', 'purpose', 'group_size'
  segment_value TEXT NOT NULL,
  visitors_count INTEGER DEFAULT 0,
  bookings_count INTEGER DEFAULT 0,
  revenue_krw DECIMAL(12,2) DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0, -- 초 단위
  bounce_rate DECIMAL(5,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_alerts_outbox_host_id ON alerts_outbox(host_id);
CREATE INDEX IF NOT EXISTS idx_alerts_outbox_status ON alerts_outbox(status);
CREATE INDEX IF NOT EXISTS idx_alerts_outbox_scheduled_at ON alerts_outbox(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_alerts_outbox_priority ON alerts_outbox(priority);

-- UTM 매핑 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_utm_source_mapping_raw ON utm_source_mapping(raw_utm_source, raw_utm_medium);
CREATE INDEX IF NOT EXISTS idx_utm_source_mapping_canonical ON utm_source_mapping(canonical_source, canonical_medium);

-- 지출 추적 인덱스 및 UNIQUE 제약조건
CREATE INDEX IF NOT EXISTS idx_spend_tracking_host_date ON spend_tracking(host_id, date);
CREATE INDEX IF NOT EXISTS idx_spend_tracking_source_medium ON spend_tracking(source, medium);
CREATE UNIQUE INDEX IF NOT EXISTS idx_spend_tracking_unique 
ON spend_tracking(host_id, date, source, medium, COALESCE(campaign, ''));

-- GSC 데이터 인덱스 및 UNIQUE 제약조건
CREATE INDEX IF NOT EXISTS idx_gsc_daily_host_date ON gsc_daily_data(host_id, date);
CREATE INDEX IF NOT EXISTS idx_gsc_daily_query ON gsc_daily_data(query);
CREATE INDEX IF NOT EXISTS idx_gsc_daily_page ON gsc_daily_data(page);
CREATE UNIQUE INDEX IF NOT EXISTS idx_gsc_daily_unique 
ON gsc_daily_data(host_id, date, query, page, country, device);

-- Same-Day Fit 인덱스 및 UNIQUE 제약조건
CREATE INDEX IF NOT EXISTS idx_sf_metrics_accommodation_date ON same_day_fit_metrics(accommodation_id, date);
CREATE INDEX IF NOT EXISTS idx_sf_metrics_score ON same_day_fit_metrics(sf_score DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sf_metrics_unique 
ON same_day_fit_metrics(accommodation_id, date);

-- 사용자 세그먼트 인덱스 및 UNIQUE 제약조건
CREATE INDEX IF NOT EXISTS idx_user_segments_accommodation_date ON user_segments_daily(accommodation_id, date);
CREATE INDEX IF NOT EXISTS idx_user_segments_type_value ON user_segments_daily(segment_type, segment_value);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_segments_unique 
ON user_segments_daily(accommodation_id, date, segment_type, segment_value);

-- RLS 정책 설정
ALTER TABLE alerts_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE utm_source_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE spend_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_daily_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE same_day_fit_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_segments_daily ENABLE ROW LEVEL SECURITY;

-- alerts_outbox RLS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'alerts_outbox' AND policyname = 'alerts_outbox_host_access') THEN
    CREATE POLICY "alerts_outbox_host_access" ON alerts_outbox
      FOR ALL USING (host_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'alerts_outbox' AND policyname = 'alerts_outbox_admin_access') THEN
    CREATE POLICY "alerts_outbox_admin_access" ON alerts_outbox
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM admin_accounts 
          WHERE user_id = auth.uid() 
          AND is_active = true
        )
      );
  END IF;
END $$;

-- utm_source_mapping RLS (전체 읽기, 관리자만 수정)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'utm_source_mapping' AND policyname = 'utm_source_mapping_read_all') THEN
    CREATE POLICY "utm_source_mapping_read_all" ON utm_source_mapping
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'utm_source_mapping' AND policyname = 'utm_source_mapping_admin_modify') THEN
    CREATE POLICY "utm_source_mapping_admin_modify" ON utm_source_mapping
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM admin_accounts 
          WHERE user_id = auth.uid() 
          AND is_active = true
        )
      );
  END IF;
END $$;

-- spend_tracking RLS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'spend_tracking' AND policyname = 'spend_tracking_host_access') THEN
    CREATE POLICY "spend_tracking_host_access" ON spend_tracking
      FOR ALL USING (host_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'spend_tracking' AND policyname = 'spend_tracking_admin_access') THEN
    CREATE POLICY "spend_tracking_admin_access" ON spend_tracking
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM admin_accounts 
          WHERE user_id = auth.uid() 
          AND is_active = true
        )
      );
  END IF;
END $$;

-- gsc_daily_data RLS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gsc_daily_data' AND policyname = 'gsc_daily_host_access') THEN
    CREATE POLICY "gsc_daily_host_access" ON gsc_daily_data
      FOR ALL USING (host_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gsc_daily_data' AND policyname = 'gsc_daily_admin_access') THEN
    CREATE POLICY "gsc_daily_admin_access" ON gsc_daily_data
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM admin_accounts 
          WHERE user_id = auth.uid() 
          AND is_active = true
        )
      );
  END IF;
END $$;

-- same_day_fit_metrics RLS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'same_day_fit_metrics' AND policyname = 'sf_metrics_host_access') THEN
    CREATE POLICY "sf_metrics_host_access" ON same_day_fit_metrics
      FOR ALL USING (
        accommodation_id IN (
          SELECT id FROM accommodations WHERE host_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'same_day_fit_metrics' AND policyname = 'sf_metrics_admin_access') THEN
    CREATE POLICY "sf_metrics_admin_access" ON same_day_fit_metrics
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM admin_accounts 
          WHERE user_id = auth.uid() 
          AND is_active = true
        )
      );
  END IF;
END $$;

-- user_segments_daily RLS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_segments_daily' AND policyname = 'user_segments_host_access') THEN
    CREATE POLICY "user_segments_host_access" ON user_segments_daily
      FOR ALL USING (
        accommodation_id IN (
          SELECT id FROM accommodations WHERE host_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_segments_daily' AND policyname = 'user_segments_admin_access') THEN
    CREATE POLICY "user_segments_admin_access" ON user_segments_daily
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM admin_accounts 
          WHERE user_id = auth.uid() 
          AND is_active = true
        )
      );
  END IF;
END $$;

-- 트리거 함수 (updated_at 자동 갱신)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
CREATE TRIGGER update_spend_tracking_updated_at 
  BEFORE UPDATE ON spend_tracking 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sf_metrics_updated_at 
  BEFORE UPDATE ON same_day_fit_metrics 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();