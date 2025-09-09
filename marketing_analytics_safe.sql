-- 마케팅 분석 테이블 안전 생성 스크립트
-- 기존 테이블이 있으면 컬럼만 추가하고, 없으면 새로 생성

-- 1. web_sessions 테이블 처리
DO $$ 
BEGIN
    -- 테이블이 존재하는지 확인
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'web_sessions') THEN
        -- 테이블이 없으면 새로 생성
        CREATE TABLE public.web_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id TEXT NOT NULL,
            user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            ip_address INET,
            user_agent TEXT,
            country TEXT,
            region TEXT,
            city TEXT,
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            utm_source TEXT,
            utm_medium TEXT,
            utm_campaign TEXT,
            utm_content TEXT,
            utm_term TEXT,
            device_type TEXT,
            browser TEXT,
            os TEXT,
            entry_page TEXT,
            referrer TEXT,
            page_views INTEGER DEFAULT 1,
            session_duration INTEGER DEFAULT 0,
            bounce BOOLEAN DEFAULT false,
            converted BOOLEAN DEFAULT false,
            conversion_value DECIMAL(10, 2) DEFAULT 0,
            started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            ended_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'web_sessions 테이블이 생성되었습니다.';
    ELSE
        RAISE NOTICE 'web_sessions 테이블이 이미 존재합니다.';
        
        -- 필요한 컬럼들이 있는지 확인하고 없으면 추가
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_sessions' AND column_name = 'country') THEN
            ALTER TABLE public.web_sessions ADD COLUMN country TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_sessions' AND column_name = 'region') THEN
            ALTER TABLE public.web_sessions ADD COLUMN region TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_sessions' AND column_name = 'city') THEN
            ALTER TABLE public.web_sessions ADD COLUMN city TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_sessions' AND column_name = 'utm_source') THEN
            ALTER TABLE public.web_sessions ADD COLUMN utm_source TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_sessions' AND column_name = 'utm_medium') THEN
            ALTER TABLE public.web_sessions ADD COLUMN utm_medium TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_sessions' AND column_name = 'device_type') THEN
            ALTER TABLE public.web_sessions ADD COLUMN device_type TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_sessions' AND column_name = 'converted') THEN
            ALTER TABLE public.web_sessions ADD COLUMN converted BOOLEAN DEFAULT false;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'web_sessions' AND column_name = 'conversion_value') THEN
            ALTER TABLE public.web_sessions ADD COLUMN conversion_value DECIMAL(10, 2) DEFAULT 0;
        END IF;
    END IF;
END $$;

-- 2. user_journey_events 테이블 처리
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_journey_events') THEN
        CREATE TABLE public.user_journey_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id TEXT NOT NULL,
            user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            event_type TEXT NOT NULL,
            page_path TEXT NOT NULL,
            page_title TEXT,
            element_id TEXT,
            element_class TEXT,
            element_text TEXT,
            form_id TEXT,
            form_data JSONB,
            conversion_type TEXT,
            conversion_value DECIMAL(10, 2),
            time_on_page INTEGER,
            scroll_depth INTEGER,
            referrer TEXT,
            search_query TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'user_journey_events 테이블이 생성되었습니다.';
    ELSE
        RAISE NOTICE 'user_journey_events 테이블이 이미 존재합니다.';
    END IF;
END $$;

-- 3. campaign_performance 테이블 처리 
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_performance') THEN
        CREATE TABLE public.campaign_performance (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            campaign_name TEXT NOT NULL,
            utm_source TEXT NOT NULL,
            utm_medium TEXT NOT NULL,
            utm_campaign TEXT,
            utm_content TEXT,
            utm_term TEXT,
            impressions INTEGER DEFAULT 0,
            clicks INTEGER DEFAULT 0,
            sessions INTEGER DEFAULT 0,
            users INTEGER DEFAULT 0,
            conversions INTEGER DEFAULT 0,
            revenue DECIMAL(12, 2) DEFAULT 0,
            cost DECIMAL(12, 2) DEFAULT 0,
            ctr DECIMAL(5, 2) DEFAULT 0,
            conversion_rate DECIMAL(5, 2) DEFAULT 0,
            cpc DECIMAL(8, 2) DEFAULT 0,
            cpa DECIMAL(8, 2) DEFAULT 0,
            roas DECIMAL(8, 2) DEFAULT 0,
            date DATE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'campaign_performance 테이블이 생성되었습니다.';
    ELSE
        RAISE NOTICE 'campaign_performance 테이블이 이미 존재합니다.';
    END IF;
END $$;

-- 4. 인덱스 생성 (존재하지 않을 경우에만)
CREATE INDEX IF NOT EXISTS idx_web_sessions_session_id ON public.web_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_web_sessions_created_at ON public.web_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_web_sessions_region_city ON public.web_sessions(region, city);
CREATE INDEX IF NOT EXISTS idx_web_sessions_utm_source ON public.web_sessions(utm_source);

CREATE INDEX IF NOT EXISTS idx_user_journey_events_session_id ON public.user_journey_events(session_id);
CREATE INDEX IF NOT EXISTS idx_user_journey_events_event_type ON public.user_journey_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_journey_events_created_at ON public.user_journey_events(created_at);

CREATE INDEX IF NOT EXISTS idx_campaign_performance_date ON public.campaign_performance(date);
CREATE INDEX IF NOT EXISTS idx_campaign_performance_utm_source ON public.campaign_performance(utm_source);

-- 5. RLS 활성화
ALTER TABLE public.web_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_journey_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_performance ENABLE ROW LEVEL SECURITY;

-- 6. RLS 정책 생성 (안전하게)
DO $$ 
BEGIN
    -- web_sessions 정책들
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'web_sessions' AND policyname = 'web_sessions_admin_select') THEN
        CREATE POLICY "web_sessions_admin_select" ON public.web_sessions
            FOR SELECT USING (
                EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
            );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'web_sessions' AND policyname = 'web_sessions_public_insert') THEN
        CREATE POLICY "web_sessions_public_insert" ON public.web_sessions
            FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'web_sessions' AND policyname = 'web_sessions_public_update') THEN
        CREATE POLICY "web_sessions_public_update" ON public.web_sessions
            FOR UPDATE USING (true);
    END IF;
    
    -- user_journey_events 정책들
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_journey_events' AND policyname = 'journey_events_admin_select') THEN
        CREATE POLICY "journey_events_admin_select" ON public.user_journey_events
            FOR SELECT USING (
                EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
            );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_journey_events' AND policyname = 'journey_events_public_insert') THEN
        CREATE POLICY "journey_events_public_insert" ON public.user_journey_events
            FOR INSERT WITH CHECK (true);
    END IF;
    
    -- campaign_performance 정책들
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaign_performance' AND policyname = 'campaign_performance_admin_all') THEN
        CREATE POLICY "campaign_performance_admin_all" ON public.campaign_performance
            FOR ALL USING (
                EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
            );
    END IF;
    
END $$;

-- 7. 샘플 데이터 삽입 (중복 방지)
INSERT INTO public.web_sessions (
    session_id, country, region, city, utm_source, utm_medium, 
    device_type, browser, entry_page, page_views, session_duration, 
    converted, conversion_value
) 
SELECT 'sample_001', '대한민국', '서울특별시', '강남구', 'google', 'organic', 'desktop', 'Chrome', '/', 5, 320, true, 185000
WHERE NOT EXISTS (SELECT 1 FROM public.web_sessions WHERE session_id = 'sample_001');

INSERT INTO public.web_sessions (
    session_id, country, region, city, utm_source, utm_medium, 
    device_type, browser, entry_page, page_views, session_duration, 
    converted, conversion_value
) 
SELECT 'sample_002', '대한민국', '경기도', '수원시', 'naver', 'cpc', 'mobile', 'Safari', '/search', 3, 180, false, 0
WHERE NOT EXISTS (SELECT 1 FROM public.web_sessions WHERE session_id = 'sample_002');

INSERT INTO public.web_sessions (
    session_id, country, region, city, utm_source, utm_medium, 
    device_type, browser, entry_page, page_views, session_duration, 
    converted, conversion_value
) 
SELECT 'sample_003', '대한민국', '부산광역시', '해운대구', 'instagram', 'social', 'mobile', 'Chrome', '/accommodation', 7, 450, true, 220000
WHERE NOT EXISTS (SELECT 1 FROM public.web_sessions WHERE session_id = 'sample_003');

-- user_journey_events 샘플 데이터
INSERT INTO public.user_journey_events (
    session_id, event_type, page_path, page_title, time_on_page, scroll_depth
)
SELECT 'sample_001', 'page_view', '/', '메인 페이지', 60, 80
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_journey_events 
    WHERE session_id = 'sample_001' AND page_path = '/'
);

INSERT INTO public.user_journey_events (
    session_id, event_type, page_path, page_title, time_on_page, scroll_depth, conversion_type, conversion_value
)
SELECT 'sample_001', 'conversion', '/booking/complete', '예약 완료', 30, 100, 'reservation', 185000
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_journey_events 
    WHERE session_id = 'sample_001' AND event_type = 'conversion'
);

-- campaign_performance 샘플 데이터
INSERT INTO public.campaign_performance (
    campaign_name, utm_source, utm_medium, impressions, clicks, sessions, 
    users, conversions, revenue, cost, date
)
SELECT '여름휴가_제주도', 'google', 'cpc', 15420, 892, 720, 650, 48, 9600000, 2500000, CURRENT_DATE
WHERE NOT EXISTS (
    SELECT 1 FROM public.campaign_performance 
    WHERE campaign_name = '여름휴가_제주도' AND date = CURRENT_DATE
);

-- 8. 뷰 생성
CREATE OR REPLACE VIEW public.marketing_summary AS
SELECT 
    DATE(ws.created_at) as date,
    COUNT(*) as total_sessions,
    COUNT(DISTINCT COALESCE(ws.user_id::text, ws.session_id)) as unique_users,
    SUM(ws.page_views) as total_page_views,
    AVG(ws.session_duration) as avg_session_duration,
    COUNT(CASE WHEN ws.converted = true THEN 1 END) as conversions,
    CASE 
        WHEN COUNT(*) > 0 THEN (COUNT(CASE WHEN ws.converted = true THEN 1 END)::FLOAT / COUNT(*)::FLOAT * 100)
        ELSE 0 
    END as conversion_rate,
    SUM(COALESCE(ws.conversion_value, 0)) as total_revenue
FROM public.web_sessions ws
GROUP BY DATE(ws.created_at)
ORDER BY date DESC;

CREATE OR REPLACE VIEW public.location_performance AS
SELECT 
    ws.region,
    ws.city,
    COUNT(*) as sessions,
    COUNT(DISTINCT COALESCE(ws.user_id::text, ws.session_id)) as users,
    COUNT(CASE WHEN ws.converted = true THEN 1 END) as conversions,
    CASE 
        WHEN COUNT(*) > 0 THEN (COUNT(CASE WHEN ws.converted = true THEN 1 END)::FLOAT / COUNT(*)::FLOAT * 100)
        ELSE 0 
    END as conversion_rate,
    SUM(COALESCE(ws.conversion_value, 0)) as revenue,
    AVG(ws.conversion_value) FILTER (WHERE ws.converted = true) as avg_booking_value
FROM public.web_sessions ws
WHERE ws.region IS NOT NULL AND ws.city IS NOT NULL
GROUP BY ws.region, ws.city
HAVING COUNT(*) >= 1  -- 최소 1세션 이상
ORDER BY sessions DESC;

RAISE NOTICE '마케팅 분석 테이블 설정이 완료되었습니다!';