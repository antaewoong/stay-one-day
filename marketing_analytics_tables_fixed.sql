-- 마케팅 분석을 위한 테이블 생성 SQL (수정된 버전)
-- 기존 테이블이 있어도 오류 없이 실행되도록 수정

-- 1. 웹 세션 추적 테이블 (존재하지 않을 경우에만 생성)
CREATE TABLE IF NOT EXISTS public.web_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    
    -- 위치 정보
    country TEXT,
    region TEXT,
    city TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- UTM 파라미터 (트래픽 소스)
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    
    -- 기기 정보
    device_type TEXT, -- mobile, desktop, tablet
    browser TEXT,
    os TEXT,
    
    -- 세션 데이터
    entry_page TEXT,
    referrer TEXT,
    page_views INTEGER DEFAULT 1,
    session_duration INTEGER DEFAULT 0, -- seconds
    bounce BOOLEAN DEFAULT false,
    converted BOOLEAN DEFAULT false,
    conversion_value DECIMAL(10, 2) DEFAULT 0,
    
    -- 시간 정보
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 사용자 여정 이벤트 추적 테이블 (존재하지 않을 경우에만 생성)
CREATE TABLE IF NOT EXISTS public.user_journey_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- 이벤트 정보
    event_type TEXT NOT NULL, -- page_view, click, form_submit, conversion
    page_path TEXT NOT NULL,
    page_title TEXT,
    
    -- 이벤트 세부사항
    element_id TEXT, -- 클릭한 요소 ID
    element_class TEXT, -- 클릭한 요소 클래스
    element_text TEXT, -- 클릭한 요소 텍스트
    
    -- 폼 데이터 (form_submit 이벤트용)
    form_id TEXT,
    form_data JSONB,
    
    -- 전환 데이터 (conversion 이벤트용)
    conversion_type TEXT, -- reservation, inquiry, signup
    conversion_value DECIMAL(10, 2),
    
    -- 타이밍 정보
    time_on_page INTEGER, -- seconds
    scroll_depth INTEGER, -- percentage
    
    -- 컨텍스트 정보
    referrer TEXT,
    search_query TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 캠페인 성과 추적 테이블 (존재하지 않을 경우에만 생성)
CREATE TABLE IF NOT EXISTS public.campaign_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 캠페인 정보
    campaign_name TEXT NOT NULL,
    utm_source TEXT NOT NULL,
    utm_medium TEXT NOT NULL,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    
    -- 성과 데이터
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    sessions INTEGER DEFAULT 0,
    users INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(12, 2) DEFAULT 0,
    cost DECIMAL(12, 2) DEFAULT 0,
    
    -- 계산된 지표
    ctr DECIMAL(5, 2) DEFAULT 0, -- click-through rate
    conversion_rate DECIMAL(5, 2) DEFAULT 0,
    cpc DECIMAL(8, 2) DEFAULT 0, -- cost per click
    cpa DECIMAL(8, 2) DEFAULT 0, -- cost per acquisition
    roas DECIMAL(8, 2) DEFAULT 0, -- return on ad spend
    
    -- 날짜
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 추가 (존재하지 않을 경우에만 생성)

-- web_sessions 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_web_sessions_session_id ON public.web_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_web_sessions_user_id ON public.web_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_web_sessions_created_at ON public.web_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_web_sessions_region_city ON public.web_sessions(region, city);
CREATE INDEX IF NOT EXISTS idx_web_sessions_utm_source ON public.web_sessions(utm_source);
CREATE INDEX IF NOT EXISTS idx_web_sessions_device_type ON public.web_sessions(device_type);
CREATE INDEX IF NOT EXISTS idx_web_sessions_converted ON public.web_sessions(converted) WHERE converted = true;

-- user_journey_events 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_user_journey_events_session_id ON public.user_journey_events(session_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_events_user_id ON public.user_journey_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_events_event_type ON public.user_journey_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_journey_events_page_path ON public.user_journey_events(page_path);
CREATE INDEX IF NOT EXISTS idx_user_journey_events_created_at ON public.user_journey_events(created_at);
CREATE INDEX IF NOT EXISTS idx_user_journey_events_conversion_type ON public.user_journey_events(conversion_type) WHERE conversion_type IS NOT NULL;

-- campaign_performance 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_campaign_performance_utm_source ON public.campaign_performance(utm_source);
CREATE INDEX IF NOT EXISTS idx_campaign_performance_date ON public.campaign_performance(date);
CREATE INDEX IF NOT EXISTS idx_campaign_performance_campaign_name ON public.campaign_performance(campaign_name);

-- Row Level Security 활성화 (이미 활성화되어 있어도 오류 없음)
ALTER TABLE public.web_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_journey_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_performance ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 중복 생성 방지를 위한 안전한 정책 생성

-- web_sessions 정책들
DO $$ 
BEGIN
    -- 관리자 조회 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'web_sessions' 
        AND policyname = 'Admins can view all web sessions'
    ) THEN
        CREATE POLICY "Admins can view all web sessions" ON public.web_sessions
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.admins
                    WHERE user_id = auth.uid()
                )
            );
    END IF;
    
    -- 세션 삽입 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'web_sessions' 
        AND policyname = 'Anyone can insert web sessions'
    ) THEN
        CREATE POLICY "Anyone can insert web sessions" ON public.web_sessions
            FOR INSERT WITH CHECK (true);
    END IF;
    
    -- 세션 업데이트 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'web_sessions' 
        AND policyname = 'Anyone can update web sessions'
    ) THEN
        CREATE POLICY "Anyone can update web sessions" ON public.web_sessions
            FOR UPDATE USING (true);
    END IF;
    
END $$;

-- user_journey_events 정책들
DO $$ 
BEGIN
    -- 관리자 조회 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_journey_events' 
        AND policyname = 'Admins can view all journey events'
    ) THEN
        CREATE POLICY "Admins can view all journey events" ON public.user_journey_events
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.admins
                    WHERE user_id = auth.uid()
                )
            );
    END IF;
    
    -- 이벤트 삽입 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_journey_events' 
        AND policyname = 'Anyone can insert journey events'
    ) THEN
        CREATE POLICY "Anyone can insert journey events" ON public.user_journey_events
            FOR INSERT WITH CHECK (true);
    END IF;
    
END $$;

-- campaign_performance 정책들
DO $$ 
BEGIN
    -- 관리자 전체 액세스 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'campaign_performance' 
        AND policyname = 'Admins can manage campaign performance'
    ) THEN
        CREATE POLICY "Admins can manage campaign performance" ON public.campaign_performance
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.admins
                    WHERE user_id = auth.uid()
                )
            );
    END IF;
    
END $$;

-- 트리거 함수: updated_at 자동 업데이트 (이미 존재해도 덮어쓰기)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성 (존재하지 않을 경우에만)
DO $$ 
BEGIN
    -- web_sessions 트리거
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_web_sessions_updated_at'
    ) THEN
        CREATE TRIGGER update_web_sessions_updated_at 
            BEFORE UPDATE ON public.web_sessions
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- campaign_performance 트리거
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_campaign_performance_updated_at'
    ) THEN
        CREATE TRIGGER update_campaign_performance_updated_at 
            BEFORE UPDATE ON public.campaign_performance
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
END $$;

-- 뷰 생성: 마케팅 대시보드용 요약 데이터 (존재할 경우 교체)
CREATE OR REPLACE VIEW public.marketing_summary AS
SELECT 
    DATE(ws.created_at) as date,
    COUNT(*) as total_sessions,
    COUNT(DISTINCT ws.user_id) as unique_users,
    SUM(ws.page_views) as total_page_views,
    AVG(ws.session_duration) as avg_session_duration,
    COUNT(CASE WHEN ws.converted = true THEN 1 END) as conversions,
    (COUNT(CASE WHEN ws.converted = true THEN 1 END)::FLOAT / COUNT(*)::FLOAT * 100) as conversion_rate,
    SUM(ws.conversion_value) as total_revenue,
    COUNT(CASE WHEN ws.bounce = true THEN 1 END) as bounces,
    (COUNT(CASE WHEN ws.bounce = true THEN 1 END)::FLOAT / COUNT(*)::FLOAT * 100) as bounce_rate
FROM public.web_sessions ws
GROUP BY DATE(ws.created_at)
ORDER BY date DESC;

-- 뷰 생성: 지역별 성과 요약 (존재할 경우 교체)
CREATE OR REPLACE VIEW public.location_performance AS
SELECT 
    ws.region,
    ws.city,
    COUNT(*) as sessions,
    COUNT(DISTINCT ws.user_id) as users,
    COUNT(CASE WHEN ws.converted = true THEN 1 END) as conversions,
    (COUNT(CASE WHEN ws.converted = true THEN 1 END)::FLOAT / COUNT(*)::FLOAT * 100) as conversion_rate,
    SUM(ws.conversion_value) as revenue,
    AVG(ws.conversion_value) FILTER (WHERE ws.converted = true) as avg_booking_value,
    MODE() WITHIN GROUP (ORDER BY ws.device_type) as top_device_type
FROM public.web_sessions ws
WHERE ws.region IS NOT NULL AND ws.city IS NOT NULL
GROUP BY ws.region, ws.city
HAVING COUNT(*) >= 5  -- 최소 5세션 이상인 지역만
ORDER BY sessions DESC;

-- 샘플 데이터 삽입 (중복 방지)
INSERT INTO public.web_sessions (
    session_id, country, region, city, utm_source, utm_medium, 
    device_type, browser, entry_page, page_views, session_duration, 
    converted, conversion_value
) 
SELECT * FROM (VALUES
    ('sess_001', '대한민국', '서울특별시', '강남구', 'google', 'organic', 'desktop', 'Chrome', '/', 5, 320, true, 185000),
    ('sess_002', '대한민국', '경기도', '수원시', 'naver', 'cpc', 'mobile', 'Safari', '/search', 3, 180, false, 0),
    ('sess_003', '대한민국', '부산광역시', '해운대구', 'instagram', 'social', 'mobile', 'Chrome', '/accommodation', 7, 450, true, 220000),
    ('sess_004', '대한민국', '제주특별자치도', '제주시', 'google', 'cpc', 'desktop', 'Chrome', '/jeju', 4, 280, true, 280000),
    ('sess_005', '대한민국', '대구광역시', '중구', 'direct', 'none', 'desktop', 'Firefox', '/', 2, 120, false, 0)
) AS t(session_id, country, region, city, utm_source, utm_medium, device_type, browser, entry_page, page_views, session_duration, converted, conversion_value)
WHERE NOT EXISTS (
    SELECT 1 FROM public.web_sessions WHERE session_id = t.session_id
);

INSERT INTO public.user_journey_events (
    session_id, event_type, page_path, page_title, time_on_page, scroll_depth
)
SELECT * FROM (VALUES
    ('sess_001', 'page_view', '/', '메인 페이지', 60, 80),
    ('sess_001', 'page_view', '/search', '숙소 검색', 120, 100),
    ('sess_001', 'page_view', '/accommodation/123', '숙소 상세', 180, 90),
    ('sess_001', 'page_view', '/booking', '예약 페이지', 90, 70),
    ('sess_001', 'conversion', '/booking/complete', '예약 완료', 30, 100),
    ('sess_002', 'page_view', '/search', '숙소 검색', 80, 60),
    ('sess_002', 'page_view', '/accommodation/456', '숙소 상세', 100, 40),
    ('sess_003', 'page_view', '/accommodation', '숙소 목록', 150, 85),
    ('sess_003', 'page_view', '/accommodation/789', '숙소 상세', 200, 95),
    ('sess_003', 'conversion', '/booking/complete', '예약 완료', 45, 100)
) AS t(session_id, event_type, page_path, page_title, time_on_page, scroll_depth)
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_journey_events 
    WHERE session_id = t.session_id AND event_type = t.event_type AND page_path = t.page_path
);

INSERT INTO public.campaign_performance (
    campaign_name, utm_source, utm_medium, impressions, clicks, sessions, 
    users, conversions, revenue, cost, date
)
SELECT * FROM (VALUES
    ('여름휴가_제주도', 'google', 'cpc', 15420, 892, 720, 650, 48, 9600000, 2500000, '2025-09-08'),
    ('부산여행_해운대', 'naver', 'cpc', 12350, 654, 520, 480, 32, 7040000, 1800000, '2025-09-08'),
    ('인스타_숙박할인', 'instagram', 'social', 8920, 423, 380, 350, 28, 6160000, 1200000, '2025-09-08'),
    ('구글_브랜드검색', 'google', 'organic', 25680, 1205, 980, 850, 72, 14400000, 0, '2025-09-08'),
    ('직접방문', 'direct', 'none', 0, 0, 450, 400, 35, 7000000, 0, '2025-09-08')
) AS t(campaign_name, utm_source, utm_medium, impressions, clicks, sessions, users, conversions, revenue, cost, date)
WHERE NOT EXISTS (
    SELECT 1 FROM public.campaign_performance 
    WHERE campaign_name = t.campaign_name AND date = t.date
);

-- 테이블에 코멘트 추가
COMMENT ON TABLE public.web_sessions IS '웹사이트 세션 추적 - IP 기반 위치 정보와 UTM 파라미터 포함';
COMMENT ON TABLE public.user_journey_events IS '사용자 여정 이벤트 추적 - 페이지뷰, 클릭, 폼 제출, 전환 등';
COMMENT ON TABLE public.campaign_performance IS '마케팅 캠페인 성과 데이터 - 일별 집계';
COMMENT ON VIEW public.marketing_summary IS '일별 마케팅 성과 요약 뷰';
COMMENT ON VIEW public.location_performance IS '지역별 마케팅 성과 요약 뷰';