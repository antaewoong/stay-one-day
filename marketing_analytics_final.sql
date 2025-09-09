-- 마케팅 분석 테이블 최종 업데이트
-- 기존 테이블 구조에 맞춘 안전한 버전

-- 1. web_sessions 테이블에 필요한 컬럼 추가
DO $$ 
BEGIN
    -- 위치 정보 컬럼들
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_sessions' AND column_name = 'country') THEN
        ALTER TABLE public.web_sessions ADD COLUMN country TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_sessions' AND column_name = 'region') THEN
        ALTER TABLE public.web_sessions ADD COLUMN region TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_sessions' AND column_name = 'city') THEN
        ALTER TABLE public.web_sessions ADD COLUMN city TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_sessions' AND column_name = 'latitude') THEN
        ALTER TABLE public.web_sessions ADD COLUMN latitude DECIMAL(10, 8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_sessions' AND column_name = 'longitude') THEN
        ALTER TABLE public.web_sessions ADD COLUMN longitude DECIMAL(11, 8);
    END IF;
    
    -- IP 주소 컬럼 (이미 user_ip가 있으면 별칭 추가)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_sessions' AND column_name = 'ip_address') THEN
        ALTER TABLE public.web_sessions ADD COLUMN ip_address INET;
    END IF;
    
    -- 세션 지속시간과 전환 정보
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_sessions' AND column_name = 'bounce') THEN
        ALTER TABLE public.web_sessions ADD COLUMN bounce BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_sessions' AND column_name = 'converted') THEN
        ALTER TABLE public.web_sessions ADD COLUMN converted BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_sessions' AND column_name = 'conversion_value') THEN
        ALTER TABLE public.web_sessions ADD COLUMN conversion_value DECIMAL(10, 2) DEFAULT 0;
    END IF;
    
    -- 시간 정보
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_sessions' AND column_name = 'started_at') THEN
        ALTER TABLE public.web_sessions ADD COLUMN started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_sessions' AND column_name = 'ended_at') THEN
        ALTER TABLE public.web_sessions ADD COLUMN ended_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- 랜딩 페이지 정보 (이미 landing_page가 있으면 별칭)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_sessions' AND column_name = 'entry_page') THEN
        ALTER TABLE public.web_sessions ADD COLUMN entry_page TEXT;
    END IF;

    RAISE NOTICE 'web_sessions 테이블 컬럼 추가 완료';
END $$;

-- 2. user_journey_events 테이블 생성 (존재하지 않을 경우에만)
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

-- 3. 인덱스 생성 (존재하지 않을 경우에만)
CREATE INDEX IF NOT EXISTS idx_web_sessions_region_city ON public.web_sessions(region, city);
CREATE INDEX IF NOT EXISTS idx_web_sessions_converted ON public.web_sessions(converted) WHERE converted = true;
CREATE INDEX IF NOT EXISTS idx_web_sessions_utm_source ON public.web_sessions(utm_source);

CREATE INDEX IF NOT EXISTS idx_user_journey_events_session_id ON public.user_journey_events(session_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_events_event_type ON public.user_journey_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_journey_events_created_at ON public.user_journey_events(created_at);
CREATE INDEX IF NOT EXISTS idx_user_journey_events_conversion_type ON public.user_journey_events(conversion_type) WHERE conversion_type IS NOT NULL;

-- 4. RLS 설정 (기본적으로 활성화만, 정책은 나중에)
ALTER TABLE public.user_journey_events ENABLE ROW LEVEL SECURITY;

-- 5. 기본 RLS 정책 생성 (관리자 체크 없이 일단 기능 동작하도록)
DO $$ 
BEGIN
    -- user_journey_events 기본 정책들 (관리자 테이블 확인 후 나중에 수정 예정)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_journey_events' AND policyname = 'journey_events_public_select') THEN
        CREATE POLICY "journey_events_public_select" ON public.user_journey_events
            FOR SELECT USING (true); -- 일단 모든 사용자가 조회 가능
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_journey_events' AND policyname = 'journey_events_public_insert') THEN
        CREATE POLICY "journey_events_public_insert" ON public.user_journey_events
            FOR INSERT WITH CHECK (true);
    END IF;

    -- web_sessions도 기본 정책 추가
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'web_sessions' AND policyname = 'web_sessions_public_select') THEN
        CREATE POLICY "web_sessions_public_select" ON public.web_sessions
            FOR SELECT USING (true); -- 일단 모든 사용자가 조회 가능
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'web_sessions' AND policyname = 'web_sessions_public_insert') THEN
        CREATE POLICY "web_sessions_public_insert" ON public.web_sessions
            FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'web_sessions' AND policyname = 'web_sessions_public_update') THEN
        CREATE POLICY "web_sessions_public_update" ON public.web_sessions
            FOR UPDATE USING (true);
    END IF;

    RAISE NOTICE 'RLS 정책 생성 완료 (기본 허용 모드)';
END $$;

-- 6. 뷰 생성 (기존 테이블 구조에 맞춤)
CREATE OR REPLACE VIEW public.marketing_summary AS
SELECT 
    DATE(ws.created_at) as date,
    COUNT(*) as total_sessions,
    COUNT(DISTINCT COALESCE(ws.user_id::text, ws.session_id)) as unique_users,
    SUM(COALESCE(ws.page_views, 1)) as total_page_views,
    AVG(COALESCE(ws.session_duration, 0)) as avg_session_duration,
    COUNT(CASE WHEN COALESCE(ws.converted, false) = true THEN 1 END) as conversions,
    CASE 
        WHEN COUNT(*) > 0 THEN (COUNT(CASE WHEN COALESCE(ws.converted, false) = true THEN 1 END)::FLOAT / COUNT(*)::FLOAT * 100)
        ELSE 0 
    END as conversion_rate,
    SUM(COALESCE(ws.conversion_value, 0)) as total_revenue,
    COUNT(CASE WHEN COALESCE(ws.bounce, false) = true THEN 1 END) as bounces,
    CASE 
        WHEN COUNT(*) > 0 THEN (COUNT(CASE WHEN COALESCE(ws.bounce, false) = true THEN 1 END)::FLOAT / COUNT(*)::FLOAT * 100)
        ELSE 0 
    END as bounce_rate
FROM public.web_sessions ws
GROUP BY DATE(ws.created_at)
ORDER BY date DESC;

CREATE OR REPLACE VIEW public.location_performance AS
SELECT 
    COALESCE(ws.region, ws.location_city, '알 수 없음') as region,
    COALESCE(ws.city, '알 수 없음') as city,
    COUNT(*) as sessions,
    COUNT(DISTINCT COALESCE(ws.user_id::text, ws.session_id)) as users,
    COUNT(CASE WHEN COALESCE(ws.converted, false) = true THEN 1 END) as conversions,
    CASE 
        WHEN COUNT(*) > 0 THEN (COUNT(CASE WHEN COALESCE(ws.converted, false) = true THEN 1 END)::FLOAT / COUNT(*)::FLOAT * 100)
        ELSE 0 
    END as conversion_rate,
    SUM(COALESCE(ws.conversion_value, 0)) as revenue,
    AVG(ws.conversion_value) FILTER (WHERE COALESCE(ws.converted, false) = true) as avg_booking_value,
    MODE() WITHIN GROUP (ORDER BY COALESCE(ws.device_type, 'desktop')) as top_device_type
FROM public.web_sessions ws
WHERE COALESCE(ws.region, ws.location_city) IS NOT NULL
GROUP BY ws.region, ws.city, ws.location_city
HAVING COUNT(*) >= 1  -- 최소 1세션 이상
ORDER BY sessions DESC;

-- 7. 샘플 데이터 삽입 (기존 데이터와 충돌하지 않도록)
DO $$
BEGIN
    -- web_sessions에 샘플 데이터 추가 (session_id가 없을 경우에만)
    IF NOT EXISTS (SELECT 1 FROM public.web_sessions WHERE session_id = 'analytics_sample_001') THEN
        INSERT INTO public.web_sessions (
            session_id, country, region, city, utm_source, utm_medium, 
            device_type, browser, entry_page, page_views, session_duration, 
            converted, conversion_value, user_agent, referrer
        ) VALUES (
            'analytics_sample_001', '대한민국', '서울특별시', '강남구', 'google', 'organic', 
            'desktop', 'Chrome', '/', 5, 320, true, 185000,
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'https://www.google.com'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.web_sessions WHERE session_id = 'analytics_sample_002') THEN
        INSERT INTO public.web_sessions (
            session_id, country, region, city, utm_source, utm_medium, 
            device_type, browser, entry_page, page_views, session_duration, 
            converted, conversion_value, user_agent
        ) VALUES (
            'analytics_sample_002', '대한민국', '부산광역시', '해운대구', 'instagram', 'social', 
            'mobile', 'Chrome', '/accommodations', 7, 450, true, 220000,
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.web_sessions WHERE session_id = 'analytics_sample_003') THEN
        INSERT INTO public.web_sessions (
            session_id, country, region, city, utm_source, utm_medium, 
            device_type, browser, entry_page, page_views, session_duration, 
            converted, conversion_value
        ) VALUES (
            'analytics_sample_003', '대한민국', '제주특별자치도', '제주시', 'google', 'cpc', 
            'desktop', 'Chrome', '/jeju', 4, 280, true, 280000
        );
    END IF;

    -- user_journey_events 샘플 데이터
    IF NOT EXISTS (SELECT 1 FROM public.user_journey_events WHERE session_id = 'analytics_sample_001') THEN
        INSERT INTO public.user_journey_events (
            session_id, event_type, page_path, page_title, time_on_page, scroll_depth
        ) VALUES 
            ('analytics_sample_001', 'page_view', '/', '메인 페이지', 60, 80),
            ('analytics_sample_001', 'page_view', '/search', '숙소 검색', 120, 100),
            ('analytics_sample_001', 'page_view', '/accommodation/123', '숙소 상세', 180, 90),
            ('analytics_sample_001', 'conversion', '/booking/complete', '예약 완료', 30, 100),
            ('analytics_sample_002', 'page_view', '/accommodations', '숙소 목록', 150, 85),
            ('analytics_sample_002', 'page_view', '/accommodation/456', '숙소 상세', 200, 95),
            ('analytics_sample_002', 'conversion', '/booking/complete', '예약 완료', 45, 100);
    END IF;

    RAISE NOTICE '샘플 데이터 추가 완료';
    RAISE NOTICE '마케팅 분석 테이블 업데이트가 완료되었습니다!';
    RAISE NOTICE '관리자 권한 체크는 admin_accounts 테이블 확인 후 별도로 설정해주세요.';
END $$;

-- 테이블 코멘트
COMMENT ON TABLE public.user_journey_events IS '사용자 여정 이벤트 추적 - 페이지뷰, 클릭, 폼 제출, 전환 등';
COMMENT ON VIEW public.marketing_summary IS '일별 마케팅 성과 요약 뷰 (기존 테이블 호환)';
COMMENT ON VIEW public.location_performance IS '지역별 마케팅 성과 요약 뷰 (기존 테이블 호환)';