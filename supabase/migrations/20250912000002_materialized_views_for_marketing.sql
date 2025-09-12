-- 🎯 Stay OneDay 마케팅 인텔리전스 Materialized Views
-- 사용자 요구사항: MV 3종 생성 (KPI 대시보드용)

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
    COUNT(*) FILTER (WHERE DATE(r.check_in) = DATE(r.created_at)) as same_day_bookings,
    AVG(EXTRACT(HOUR FROM (r.check_in - r.created_at))) as avg_booking_lead_hours
  FROM hosts h
  LEFT JOIN accommodations a ON a.host_id = h.id
  LEFT JOIN reservations r ON r.accommodation_id = a.id
  WHERE r.created_at >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY h.id, DATE_TRUNC('month', r.created_at)
),
host_sf_scores AS (
  SELECT 
    h.id as host_id,
    DATE_TRUNC('month', sf.date) as month,
    AVG(sf.sf_score) as avg_sf_score,
    MAX(sf.sf_score) as max_sf_score,
    COUNT(DISTINCT sf.accommodation_id) as tracked_properties
  FROM hosts h
  LEFT JOIN accommodations a ON a.host_id = h.id
  LEFT JOIN same_day_fit_metrics sf ON sf.accommodation_id = a.id
  WHERE sf.date >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY h.id, DATE_TRUNC('month', sf.date)
)
SELECT 
  COALESCE(hs.host_id, hb.host_id, hsf.host_id) as host_id,
  COALESCE(hs.month, hb.month, hsf.month) as month,
  
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
  
  -- SF 점수
  COALESCE(hsf.avg_sf_score, 0) as avg_sf_score,
  COALESCE(hsf.max_sf_score, 0) as max_sf_score,
  COALESCE(hsf.tracked_properties, 0) as tracked_properties,
  
  -- 계산 지표
  CASE WHEN hs.total_spend > 0 THEN hb.revenue_krw / hs.total_spend ELSE 0 END as roas,
  CASE WHEN hs.total_clicks > 0 THEN hs.total_spend / hs.total_clicks ELSE 0 END as cpc_krw,
  
  NOW() as refreshed_at
FROM host_spend hs
FULL OUTER JOIN host_bookings hb ON hs.host_id = hb.host_id AND hs.month = hb.month
FULL OUTER JOIN host_sf_scores hsf ON COALESCE(hs.host_id, hb.host_id) = hsf.host_id 
  AND COALESCE(hs.month, hb.month) = hsf.month
WHERE COALESCE(hs.host_id, hb.host_id, hsf.host_id) IS NOT NULL;

-- 2. 숙소별 Same-Day Fit 트렌드 MV
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_accommodation_sf_trends AS
WITH daily_sf AS (
  SELECT 
    accommodation_id,
    date,
    sf_score,
    weekday_visit_ratio,
    daytime_traffic_ratio,
    poi_heat_1km,
    family_segment_ratio,
    LAG(sf_score, 7) OVER (PARTITION BY accommodation_id ORDER BY date) as sf_score_7d_ago,
    LAG(sf_score, 30) OVER (PARTITION BY accommodation_id ORDER BY date) as sf_score_30d_ago,
    AVG(sf_score) OVER (
      PARTITION BY accommodation_id 
      ORDER BY date 
      ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) as sf_score_7d_avg,
    AVG(sf_score) OVER (
      PARTITION BY accommodation_id 
      ORDER BY date 
      ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
    ) as sf_score_30d_avg
  FROM same_day_fit_metrics
  WHERE date >= CURRENT_DATE - INTERVAL '90 days'
),
booking_correlation AS (
  SELECT 
    a.id as accommodation_id,
    DATE(r.created_at) as booking_date,
    COUNT(*) as daily_bookings,
    COUNT(*) FILTER (WHERE DATE(r.check_in) = DATE(r.created_at)) as same_day_bookings_count,
    AVG(r.total_amount) as avg_booking_value
  FROM accommodations a
  LEFT JOIN reservations r ON r.accommodation_id = a.id
  WHERE r.created_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY a.id, DATE(r.created_at)
)
SELECT 
  sf.accommodation_id,
  sf.date,
  sf.sf_score,
  sf.sf_score_7d_avg,
  sf.sf_score_30d_avg,
  
  -- 트렌드 계산
  CASE 
    WHEN sf.sf_score_7d_ago IS NOT NULL THEN 
      (sf.sf_score - sf.sf_score_7d_ago) / sf.sf_score_7d_ago * 100
    ELSE 0 
  END as sf_trend_7d_pct,
  
  CASE 
    WHEN sf.sf_score_30d_ago IS NOT NULL THEN 
      (sf.sf_score - sf.sf_score_30d_ago) / sf.sf_score_30d_ago * 100
    ELSE 0 
  END as sf_trend_30d_pct,
  
  -- 구성 요소
  sf.weekday_visit_ratio,
  sf.daytime_traffic_ratio,
  sf.poi_heat_1km,
  sf.family_segment_ratio,
  
  -- 예약 데이터 연결
  COALESCE(bc.daily_bookings, 0) as daily_bookings,
  COALESCE(bc.same_day_bookings_count, 0) as same_day_bookings_count,
  COALESCE(bc.avg_booking_value, 0) as avg_booking_value,
  
  -- SF와 예약 상관관계
  CASE 
    WHEN bc.daily_bookings > 0 THEN bc.same_day_bookings_count * 100.0 / bc.daily_bookings 
    ELSE 0 
  END as same_day_booking_rate_pct,
  
  NOW() as refreshed_at
FROM daily_sf sf
LEFT JOIN booking_correlation bc ON sf.accommodation_id = bc.accommodation_id 
  AND sf.date = bc.booking_date;

-- 3. 지역별 POI 히트맵 & 경쟁 분석 MV  
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_regional_competitive_intelligence AS
WITH regional_poi AS (
  SELECT 
    -- 지역을 1km 그리드로 분할 (대략적인 위도/경도 기준)
    ROUND(latitude * 100) / 100 as lat_grid,
    ROUND(longitude * 100) / 100 as lng_grid,
    COUNT(*) as poi_count,
    AVG(daily_heat_score) as avg_poi_heat,
    MAX(daily_heat_score) as max_poi_heat,
    COUNT(*) FILTER (WHERE category = 'restaurant') as restaurant_count,
    COUNT(*) FILTER (WHERE category = 'cafe') as cafe_count,
    COUNT(*) FILTER (WHERE category = 'kids') as kids_poi_count,
    COUNT(*) FILTER (WHERE category = 'academy') as academy_count
  FROM poi_heat_daily phd
  JOIN local_poi lp ON phd.poi_id = lp.id
  WHERE phd.date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY ROUND(latitude * 100) / 100, ROUND(longitude * 100) / 100
),
accommodation_density AS (
  SELECT 
    ROUND(latitude * 100) / 100 as lat_grid,
    ROUND(longitude * 100) / 100 as lng_grid,
    COUNT(*) as accommodation_count,
    AVG(
      CASE WHEN is_active THEN 1 ELSE 0 END
    ) as active_ratio,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '90 days') as new_accommodations_90d
  FROM accommodations
  GROUP BY ROUND(latitude * 100) / 100, ROUND(longitude * 100) / 100
),
regional_performance AS (
  SELECT 
    ROUND(a.latitude * 100) / 100 as lat_grid,
    ROUND(a.longitude * 100) / 100 as lng_grid,
    COUNT(r.id) as total_bookings_30d,
    AVG(r.total_amount) as avg_booking_value,
    COUNT(r.id) FILTER (WHERE DATE(r.check_in) = DATE(r.created_at)) as same_day_bookings_30d,
    AVG(sf.sf_score) as avg_regional_sf_score
  FROM accommodations a
  LEFT JOIN reservations r ON r.accommodation_id = a.id 
    AND r.created_at >= CURRENT_DATE - INTERVAL '30 days'
  LEFT JOIN same_day_fit_metrics sf ON sf.accommodation_id = a.id 
    AND sf.date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY ROUND(a.latitude * 100) / 100, ROUND(a.longitude * 100) / 100
)
SELECT 
  COALESCE(rp.lat_grid, ad.lat_grid, rperf.lat_grid) as lat_grid,
  COALESCE(rp.lng_grid, ad.lng_grid, rperf.lng_grid) as lng_grid,
  
  -- POI 인텔리전스
  COALESCE(rp.poi_count, 0) as poi_count,
  COALESCE(rp.avg_poi_heat, 0) as avg_poi_heat,
  COALESCE(rp.max_poi_heat, 0) as max_poi_heat,
  COALESCE(rp.restaurant_count, 0) as restaurant_count,
  COALESCE(rp.cafe_count, 0) as cafe_count,
  COALESCE(rp.kids_poi_count, 0) as kids_poi_count,
  COALESCE(rp.academy_count, 0) as academy_count,
  
  -- 경쟁 밀도
  COALESCE(ad.accommodation_count, 0) as accommodation_count,
  COALESCE(ad.active_ratio, 0) as active_accommodation_ratio,
  COALESCE(ad.new_accommodations_90d, 0) as new_accommodations_90d,
  
  -- 지역 성과
  COALESCE(rperf.total_bookings_30d, 0) as total_bookings_30d,
  COALESCE(rperf.avg_booking_value, 0) as avg_booking_value,
  COALESCE(rperf.same_day_bookings_30d, 0) as same_day_bookings_30d,
  COALESCE(rperf.avg_regional_sf_score, 0) as avg_regional_sf_score,
  
  -- 종합 점수 계산
  (
    COALESCE(rp.avg_poi_heat, 0) * 0.3 +
    COALESCE(rperf.avg_regional_sf_score, 0) * 0.4 +
    LEAST(COALESCE(ad.accommodation_count, 0), 10) * 2 * 0.3  -- 경쟁 포화 페널티
  ) as regional_opportunity_score,
  
  CASE 
    WHEN COALESCE(rperf.total_bookings_30d, 0) > 0 THEN 
      rperf.same_day_bookings_30d * 100.0 / rperf.total_bookings_30d
    ELSE 0 
  END as regional_same_day_rate_pct,
  
  NOW() as refreshed_at
FROM regional_poi rp
FULL OUTER JOIN accommodation_density ad ON rp.lat_grid = ad.lat_grid AND rp.lng_grid = ad.lng_grid
FULL OUTER JOIN regional_performance rperf ON COALESCE(rp.lat_grid, ad.lat_grid) = rperf.lat_grid 
  AND COALESCE(rp.lng_grid, ad.lng_grid) = rperf.lng_grid
WHERE COALESCE(rp.lat_grid, ad.lat_grid, rperf.lat_grid) IS NOT NULL;

-- 인덱스 생성 (MV 성능 최적화)
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_host_performance_pk 
  ON mv_host_marketing_performance(host_id, month);

CREATE INDEX IF NOT EXISTS idx_mv_host_performance_month 
  ON mv_host_marketing_performance(month);

CREATE INDEX IF NOT EXISTS idx_mv_host_performance_roas 
  ON mv_host_marketing_performance(roas DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_accommodation_sf_pk 
  ON mv_accommodation_sf_trends(accommodation_id, date);

CREATE INDEX IF NOT EXISTS idx_mv_accommodation_sf_score 
  ON mv_accommodation_sf_trends(sf_score DESC);

CREATE INDEX IF NOT EXISTS idx_mv_accommodation_sf_trend 
  ON mv_accommodation_sf_trends(sf_trend_7d_pct DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_regional_intelligence_pk 
  ON mv_regional_competitive_intelligence(lat_grid, lng_grid);

CREATE INDEX IF NOT EXISTS idx_mv_regional_opportunity 
  ON mv_regional_competitive_intelligence(regional_opportunity_score DESC);

CREATE INDEX IF NOT EXISTS idx_mv_regional_poi_heat 
  ON mv_regional_competitive_intelligence(avg_poi_heat DESC);

-- MV 자동 갱신을 위한 함수
CREATE OR REPLACE FUNCTION refresh_marketing_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_host_marketing_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_accommodation_sf_trends;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_regional_competitive_intelligence;
  
  -- 갱신 로그
  INSERT INTO system_settings (key, value, updated_at) 
  VALUES ('mv_last_refresh', NOW()::text, NOW())
  ON CONFLICT (key) 
  DO UPDATE SET value = NOW()::text, updated_at = NOW();
END;
$$ LANGUAGE plpgsql;