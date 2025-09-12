-- 🔒 Stay OneDay 마케팅 테이블 RLS 정책
-- 보안을 위한 Row Level Security 설정

-- RLS 활성화
ALTER TABLE alerts_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE utm_source_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE spend_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_daily_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE same_day_fit_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_segments_daily ENABLE ROW LEVEL SECURITY;

-- 1. alerts_outbox 정책
DROP POLICY IF EXISTS "alerts_outbox_host_access" ON alerts_outbox;
CREATE POLICY "alerts_outbox_host_access" ON alerts_outbox
  FOR ALL USING (host_id = auth.uid());

DROP POLICY IF EXISTS "alerts_outbox_admin_access" ON alerts_outbox;
CREATE POLICY "alerts_outbox_admin_access" ON alerts_outbox
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_accounts 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- 2. utm_source_mapping 정책 (전체 읽기 허용, 관리자만 수정)
DROP POLICY IF EXISTS "utm_source_mapping_read_all" ON utm_source_mapping;
CREATE POLICY "utm_source_mapping_read_all" ON utm_source_mapping
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "utm_source_mapping_admin_modify" ON utm_source_mapping;
CREATE POLICY "utm_source_mapping_admin_modify" ON utm_source_mapping
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_accounts 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- 3. spend_tracking 정책
DROP POLICY IF EXISTS "spend_tracking_host_access" ON spend_tracking;
CREATE POLICY "spend_tracking_host_access" ON spend_tracking
  FOR ALL USING (host_id = auth.uid());

DROP POLICY IF EXISTS "spend_tracking_admin_access" ON spend_tracking;
CREATE POLICY "spend_tracking_admin_access" ON spend_tracking
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_accounts 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- 4. gsc_daily_data 정책
DROP POLICY IF EXISTS "gsc_daily_host_access" ON gsc_daily_data;
CREATE POLICY "gsc_daily_host_access" ON gsc_daily_data
  FOR ALL USING (host_id = auth.uid());

DROP POLICY IF EXISTS "gsc_daily_admin_access" ON gsc_daily_data;
CREATE POLICY "gsc_daily_admin_access" ON gsc_daily_data
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_accounts 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- 5. same_day_fit_metrics 정책
DROP POLICY IF EXISTS "sf_metrics_host_access" ON same_day_fit_metrics;
CREATE POLICY "sf_metrics_host_access" ON same_day_fit_metrics
  FOR ALL USING (
    accommodation_id IN (
      SELECT id FROM accommodations WHERE host_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "sf_metrics_admin_access" ON same_day_fit_metrics;
CREATE POLICY "sf_metrics_admin_access" ON same_day_fit_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_accounts 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- 6. user_segments_daily 정책
DROP POLICY IF EXISTS "user_segments_host_access" ON user_segments_daily;
CREATE POLICY "user_segments_host_access" ON user_segments_daily
  FOR ALL USING (
    accommodation_id IN (
      SELECT id FROM accommodations WHERE host_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "user_segments_admin_access" ON user_segments_daily;
CREATE POLICY "user_segments_admin_access" ON user_segments_daily
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_accounts 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );