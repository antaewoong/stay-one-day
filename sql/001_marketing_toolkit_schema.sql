-- ================================================================
-- Stay One Day - Marketing Toolkit Database Schema
-- 상용 운영을 위한 완전한 스키마 (RLS 포함)
-- ================================================================

-- 키워드 마스터 테이블 (정규화된 키워드 관리)
CREATE TABLE IF NOT EXISTS kw_master (
  slug TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('family', 'party', 'business', 'travel')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 키워드 동의어 테이블
CREATE TABLE IF NOT EXISTS kw_synonyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_slug TEXT NOT NULL REFERENCES kw_master(slug) ON DELETE CASCADE,
  synonym TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(master_slug, synonym)
);

-- 숙소별 선택된 키워드 (최대 5개 제한)
CREATE TABLE IF NOT EXISTS accommodation_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_id UUID NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
  kw_slug TEXT NOT NULL REFERENCES kw_master(slug),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(accommodation_id, kw_slug)
);

-- 호스트 주간 쿼터 관리 (KST 기준)
CREATE TABLE IF NOT EXISTS host_weekly_quota (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL,
  week_start DATE NOT NULL,
  manual_runs INT DEFAULT 0,
  admin_proxy_runs INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(host_id, week_start)
);

-- 리포트 저장 및 이력 관리
CREATE TABLE IF NOT EXISTS host_reports (
  id BIGSERIAL PRIMARY KEY,
  accommodation_id UUID NOT NULL REFERENCES accommodations(id),
  host_id UUID NOT NULL,
  run_by UUID NOT NULL,
  run_type TEXT NOT NULL CHECK (run_type IN ('host_manual','admin_proxy','admin_preview')),
  report_types TEXT[] NOT NULL, -- ['local-trends', 'shorts-trends', etc.]
  selected_keywords TEXT[] DEFAULT '{}',
  payload JSONB NOT NULL,
  duration_ms INT,
  is_stale BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 스마트 링크 관리
CREATE TABLE IF NOT EXISTS smart_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL,
  accommodation_id UUID NOT NULL REFERENCES accommodations(id),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  destination_url TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  click_count INT DEFAULT 0,
  conversion_count INT DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  last_clicked_at TIMESTAMPTZ,
  last_converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 스마트 링크 클릭 추적
CREATE TABLE IF NOT EXISTS smart_link_clicks (
  id BIGSERIAL PRIMARY KEY,
  smart_link_id UUID NOT NULL REFERENCES smart_links(id) ON DELETE CASCADE,
  accommodation_id UUID NOT NULL REFERENCES accommodations(id),
  host_id UUID NOT NULL,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  session_id TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- 예약 웹훅 및 ROI 추적
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  accommodation_id UUID NOT NULL REFERENCES accommodations(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'KRW',
  status TEXT NOT NULL CHECK (status IN ('confirmed', 'cancelled', 'pending')),
  occurred_at TIMESTAMPTZ NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  session_id TEXT,
  smart_link_id UUID REFERENCES smart_links(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 네이버 플레이스 체크리스트 (수동)
CREATE TABLE IF NOT EXISTS accommodation_naver_place (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_id UUID NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
  host_id UUID NOT NULL,
  business_name TEXT,
  business_hours TEXT,
  phone_number TEXT,
  address TEXT,
  categories TEXT[] DEFAULT '{}',
  checklist JSONB NOT NULL DEFAULT '{}',
  health_score INT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(accommodation_id)
);

-- ================================================================
-- 제약조건 및 트리거
-- ================================================================

-- 키워드 5개 제한 트리거 함수
CREATE OR REPLACE FUNCTION check_keyword_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM accommodation_keywords
      WHERE accommodation_id = NEW.accommodation_id) >= 5 THEN
    RAISE EXCEPTION 'Cannot add more than 5 keywords per accommodation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 키워드 5개 제한 트리거
DROP TRIGGER IF EXISTS accommodation_keywords_limit_trigger ON accommodation_keywords;
CREATE TRIGGER accommodation_keywords_limit_trigger
  BEFORE INSERT ON accommodation_keywords
  FOR EACH ROW
  EXECUTE FUNCTION check_keyword_limit();

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 시간 트리거들
DROP TRIGGER IF EXISTS host_weekly_quota_updated_at ON host_weekly_quota;
CREATE TRIGGER host_weekly_quota_updated_at
  BEFORE UPDATE ON host_weekly_quota
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS bookings_updated_at ON bookings;
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- 인덱스 최적화
-- ================================================================

-- 키워드 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_kw_master_category ON kw_master(category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_kw_synonyms_master_slug ON kw_synonyms(master_slug);
CREATE INDEX IF NOT EXISTS idx_accommodation_keywords_accommodation_id ON accommodation_keywords(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_accommodation_keywords_kw_slug ON accommodation_keywords(kw_slug);

-- 쿼터 관리 인덱스
CREATE INDEX IF NOT EXISTS idx_host_weekly_quota_host_week ON host_weekly_quota(host_id, week_start);

-- 리포트 인덱스
CREATE INDEX IF NOT EXISTS idx_host_reports_host_created ON host_reports(host_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_host_reports_accommodation ON host_reports(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_host_reports_run_type ON host_reports(run_type);

-- 스마트 링크 인덱스
CREATE INDEX IF NOT EXISTS idx_smart_links_slug ON smart_links(slug) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_smart_links_host ON smart_links(host_id);
CREATE INDEX IF NOT EXISTS idx_smart_links_accommodation ON smart_links(accommodation_id);

-- 클릭 추적 인덱스
CREATE INDEX IF NOT EXISTS idx_smart_link_clicks_link_time ON smart_link_clicks(smart_link_id, clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_smart_link_clicks_host_time ON smart_link_clicks(host_id, clicked_at DESC);

-- 예약 추적 인덱스
CREATE INDEX IF NOT EXISTS idx_bookings_accommodation_time ON bookings(accommodation_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_smart_link ON bookings(smart_link_id) WHERE smart_link_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- 네이버 플레이스 인덱스
CREATE INDEX IF NOT EXISTS idx_accommodation_naver_place_host ON accommodation_naver_place(host_id);
CREATE INDEX IF NOT EXISTS idx_accommodation_naver_place_score ON accommodation_naver_place(health_score DESC);

-- ================================================================
-- 초기 데이터 삽입 (키워드 마스터)
-- ================================================================

-- 기본 키워드 데이터
INSERT INTO kw_master (slug, display_name, category) VALUES
-- 가족 여행
('kids-pool', '키즈풀', 'family'),
('family-room', '패밀리룸', 'family'),
('baby-friendly', '유아동반', 'family'),
('playground', '놀이시설', 'family'),
('kid-safe', '아이안전', 'family'),

-- 파티/모임
('bridal-party', '브라이덜파티', 'party'),
('group-stay', '단체숙박', 'party'),
('birthday-party', '생일파티', 'party'),
('team-building', '팀빌딩', 'party'),
('celebration', '축하행사', 'party'),

-- 비즈니스
('business-trip', '출장', 'business'),
('conference-room', '회의실', 'business'),
('work-space', '워크스페이스', 'business'),
('long-stay', '장기숙박', 'business'),
('corporate-event', '기업행사', 'business'),

-- 여행 테마
('pool-villa', '풀빌라', 'travel'),
('ocean-view', '오션뷰', 'travel'),
('mountain-view', '마운틴뷰', 'travel'),
('hot-spring', '온천', 'travel'),
('glamping', '글램핑', 'travel'),
('pet-friendly', '반려동물', 'travel'),
('romantic', '로맨틱', 'travel'),
('healing', '힐링', 'travel'),
('spa', '스파', 'travel'),
('bbq', '바베큐', 'travel'),
('camping', '캠핑', 'travel'),
('fishing', '낚시', 'travel')
ON CONFLICT (slug) DO NOTHING;

-- 동의어 데이터 (예시)
INSERT INTO kw_synonyms (master_slug, synonym) VALUES
('kids-pool', '어린이수영장'),
('kids-pool', '유아풀'),
('pool-villa', '수영장빌라'),
('pool-villa', '풀장'),
('pet-friendly', '애완동물'),
('pet-friendly', '반려견'),
('bbq', '바비큐'),
('bbq', '고기굽기')
ON CONFLICT (master_slug, synonym) DO NOTHING;

COMMENT ON TABLE kw_master IS '마케팅 키워드 마스터 테이블';
COMMENT ON TABLE accommodation_keywords IS '숙소별 선택된 키워드 (최대 5개)';
COMMENT ON TABLE host_weekly_quota IS '호스트 주간 분석 쿼터 관리';
COMMENT ON TABLE host_reports IS '마케팅 분석 리포트 저장';
COMMENT ON TABLE smart_links IS '스마트 링크 및 UTM 추적';
COMMENT ON TABLE smart_link_clicks IS '스마트 링크 클릭 로그';
COMMENT ON TABLE bookings IS '예약 웹훅 및 ROI 추적';
COMMENT ON TABLE accommodation_naver_place IS '네이버 플레이스 수동 체크리스트';