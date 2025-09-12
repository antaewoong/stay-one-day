-- 🎯 Stay OneDay 기본 마케팅 Materialized Views
-- 1번 마이그레이션 기반으로 구축되는 기본 분석 뷰들

-- 1. 호스트별 마케팅 성과 종합 MV
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_host_marketing_performance AS
WITH host_spend AS (
  SELECT 
    host_id,
    DATE_TRUNC('month', date) as month,
    SUM(spend_krw) as total_spend,
    SUM(clicks) as total_clicks,
    SUM(conversions) as total_conversions,
    CASE WHEN SUM(spend_krw) > 0 THEN SUM(conversions) * 1.0 / SUM(spend_krw) * 1000 ELSE 0 END as cpa_krw,
    CASE WHEN SUM(clicks) > 0 THEN SUM(conversions) * 100.0 / SUM(clicks) ELSE 0 END as conversion_rate
  FROM spend_tracking 
  WHERE date >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY host_id, DATE_TRUNC('month', date)
),
host_bookings AS (
  SELECT 
    h.id as host_id,
    DATE_TRUNC('month', r.created_at) as month,
    COUNT(*) as bookings_count,
    SUM(r.total_amount) as revenue_krw,
    COUNT(*) FILTER (WHERE r.checkin_date = DATE(r.created_at)) as same_day_bookings,
    AVG(EXTRACT(EPOCH FROM (r.checkin_date::timestamp - r.created_at)) / 3600) as avg_booking_lead_hours
  FROM hosts h
  LEFT JOIN accommodations a ON a.host_id = h.id
  LEFT JOIN reservations r ON r.accommodation_id = a.id
  WHERE r.created_at >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY h.id, DATE_TRUNC('month', r.created_at)
)
SELECT 
  COALESCE(hs.host_id, hb.host_id) as host_id,
  COALESCE(hs.month, hb.month) as month,
  
  -- 지출 및 성과
  COALESCE(hs.total_spend, 0) as total_spend_krw,
  COALESCE(hs.total_clicks, 0) as total_clicks,
  COALESCE(hs.total_conversions, 0) as total_conversions,
  COALESCE(hs.cpa_krw, 0) as cpa_krw,
  COALESCE(hs.conversion_rate, 0) as conversion_rate_pct,
  
  -- 예약 성과
  COALESCE(hb.bookings_count, 0) as bookings_count,
  COALESCE(hb.revenue_krw, 0) as revenue_krw,
  COALESCE(hb.same_day_bookings, 0) as same_day_bookings,
  CASE WHEN hb.bookings_count > 0 THEN hb.same_day_bookings * 100.0 / hb.bookings_count ELSE 0 END as same_day_rate_pct,
  COALESCE(hb.avg_booking_lead_hours, 0) as avg_booking_lead_hours,
  
  -- 계산 지표
  CASE WHEN hs.total_spend > 0 THEN hb.revenue_krw / hs.total_spend ELSE 0 END as roas,
  CASE WHEN hs.total_clicks > 0 THEN hs.total_spend / hs.total_clicks ELSE 0 END as cpc_krw,
  
  NOW() as refreshed_at
FROM host_spend hs
FULL OUTER JOIN host_bookings hb ON hs.host_id = hb.host_id AND hs.month = hb.month
WHERE COALESCE(hs.host_id, hb.host_id) IS NOT NULL;

-- 2. 숙소별 Same-Day Fit 기본 트렌드 MV  
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_accommodation_basic_trends AS
WITH booking_trends AS (
  SELECT 
    a.id as accommodation_id,
    DATE(r.created_at) as booking_date,
    COUNT(*) as daily_bookings,
    COUNT(*) FILTER (WHERE r.checkin_date = DATE(r.created_at)) as same_day_bookings_count,
    AVG(r.total_amount) as avg_booking_value,
    AVG(EXTRACT(EPOCH FROM (r.checkin_date::timestamp - r.created_at)) / 3600) as avg_lead_hours
  FROM accommodations a
  LEFT JOIN reservations r ON r.accommodation_id = a.id
  WHERE r.created_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY a.id, DATE(r.created_at)
),
sf_base AS (
  SELECT 
    accommodation_id,
    date,
    sf_score,
    weekday_visit_ratio,
    daytime_traffic_ratio,
    poi_heat_1km,
    family_segment_ratio,
    LAG(sf_score, 7) OVER (PARTITION BY accommodation_id ORDER BY date) as sf_score_7d_ago,
    LAG(sf_score, 30) OVER (PARTITION BY accommodation_id ORDER BY date) as sf_score_30d_ago
  FROM same_day_fit_metrics
  WHERE date >= CURRENT_DATE - INTERVAL '90 days'
)
SELECT 
  COALESCE(bt.accommodation_id, sf.accommodation_id) as accommodation_id,
  COALESCE(bt.booking_date, sf.date) as date,
  
  -- 예약 데이터
  COALESCE(bt.daily_bookings, 0) as daily_bookings,
  COALESCE(bt.same_day_bookings_count, 0) as same_day_bookings_count,
  COALESCE(bt.avg_booking_value, 0) as avg_booking_value,
  COALESCE(bt.avg_lead_hours, 0) as avg_lead_hours,
  
  -- SF 메트릭
  COALESCE(sf.sf_score, 0) as sf_score,
  COALESCE(sf.weekday_visit_ratio, 0) as weekday_visit_ratio,
  COALESCE(sf.daytime_traffic_ratio, 0) as daytime_traffic_ratio,
  COALESCE(sf.poi_heat_1km, 0) as poi_heat_1km,
  COALESCE(sf.family_segment_ratio, 0) as family_segment_ratio,
  
  -- 트렌드 계산
  CASE 
    WHEN sf.sf_score_7d_ago IS NOT NULL AND sf.sf_score_7d_ago > 0 THEN 
      (sf.sf_score - sf.sf_score_7d_ago) / sf.sf_score_7d_ago * 100
    ELSE 0 
  END as sf_trend_7d_pct,
  
  CASE 
    WHEN sf.sf_score_30d_ago IS NOT NULL AND sf.sf_score_30d_ago > 0 THEN 
      (sf.sf_score - sf.sf_score_30d_ago) / sf.sf_score_30d_ago * 100
    ELSE 0 
  END as sf_trend_30d_pct,
  
  -- 예약률
  CASE 
    WHEN bt.daily_bookings > 0 THEN bt.same_day_bookings_count * 100.0 / bt.daily_bookings 
    ELSE 0 
  END as same_day_booking_rate_pct,
  
  NOW() as refreshed_at
FROM booking_trends bt
FULL OUTER JOIN sf_base sf ON bt.accommodation_id = sf.accommodation_id 
  AND bt.booking_date = sf.date
WHERE COALESCE(bt.accommodation_id, sf.accommodation_id) IS NOT NULL;

-- 3. GSC & UTM 통합 분석 MV
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_marketing_channel_performance AS
WITH gsc_performance AS (
  SELECT 
    host_id,
    DATE_TRUNC('week', date) as week,
    'organic' as channel,
    'search' as source,
    'google' as medium,
    SUM(impressions) as impressions,
    SUM(clicks) as clicks,
    AVG(ctr) as avg_ctr,
    AVG(position) as avg_position,
    COUNT(DISTINCT query) as unique_queries
  FROM gsc_daily_data
  WHERE date >= CURRENT_DATE - INTERVAL '12 weeks'
  GROUP BY host_id, DATE_TRUNC('week', date)
),
spend_performance AS (
  SELECT 
    host_id,
    DATE_TRUNC('week', date) as week,
    'paid' as channel,
    source,
    medium,
    SUM(impressions) as impressions,
    SUM(clicks) as clicks,
    SUM(spend_krw) as spend_krw,
    SUM(conversions) as conversions,
    AVG(CASE WHEN impressions > 0 THEN clicks * 100.0 / impressions ELSE 0 END) as avg_ctr
  FROM spend_tracking
  WHERE date >= CURRENT_DATE - INTERVAL '12 weeks'
  GROUP BY host_id, DATE_TRUNC('week', date), source, medium
)
SELECT 
  host_id,
  week,
  channel,
  source,
  medium,
  impressions,
  clicks,
  COALESCE(spend_krw, 0) as spend_krw,
  COALESCE(conversions, 0) as conversions,
  avg_ctr,
  COALESCE(avg_position, 0) as avg_position,
  COALESCE(unique_queries, 0) as unique_queries,
  
  -- 효율성 지표
  CASE WHEN spend_krw > 0 THEN clicks / spend_krw * 1000 ELSE 0 END as clicks_per_1k_krw,
  CASE WHEN spend_krw > 0 AND conversions > 0 THEN spend_krw / conversions ELSE 0 END as cpa_krw,
  CASE WHEN clicks > 0 THEN conversions * 100.0 / clicks ELSE 0 END as conversion_rate_pct,
  
  NOW() as refreshed_at
FROM (
  SELECT 
    host_id, week, channel, source, medium,
    impressions, clicks, avg_ctr, avg_position, unique_queries,
    0 as spend_krw, 0 as conversions
  FROM gsc_performance
  UNION ALL
  SELECT 
    host_id, week, channel, source, medium, 
    impressions, clicks, avg_ctr, 
    0 as avg_position, 0 as unique_queries,
    spend_krw, conversions
  FROM spend_performance
) combined;

-- 인덱스 생성 (성능 최적화)
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_host_performance_pk 
  ON mv_host_marketing_performance(host_id, month);

CREATE INDEX IF NOT EXISTS idx_mv_host_performance_roas 
  ON mv_host_marketing_performance(roas DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_accommodation_trends_pk 
  ON mv_accommodation_basic_trends(accommodation_id, date);

CREATE INDEX IF NOT EXISTS idx_mv_accommodation_trends_sf_score 
  ON mv_accommodation_basic_trends(sf_score DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_channel_performance_pk 
  ON mv_marketing_channel_performance(host_id, week, channel, source, medium);

CREATE INDEX IF NOT EXISTS idx_mv_channel_performance_cpa 
  ON mv_marketing_channel_performance(cpa_krw ASC);

-- MV 자동 갱신을 위한 함수
CREATE OR REPLACE FUNCTION refresh_basic_marketing_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_host_marketing_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_accommodation_basic_trends;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_marketing_channel_performance;
  
  -- 갱신 로그
  INSERT INTO system_settings (key, value, updated_at) 
  VALUES ('basic_mv_last_refresh', NOW()::text, NOW())
  ON CONFLICT (key) 
  DO UPDATE SET value = NOW()::text, updated_at = NOW();
END;
$$ LANGUAGE plpgsql;