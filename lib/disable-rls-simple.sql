-- 개발 중 RLS 완전 비활성화 (간단한 해결책)
-- 나중에 프로덕션에서는 proper RLS 정책 적용

-- 모든 테이블의 RLS 비활성화
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hosts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stays DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stay_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stay_options DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sms_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notices DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.settlement_reports DISABLE ROW LEVEL SECURITY;

-- 기존 정책들 삭제
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename FROM pg_tables 
        WHERE schemaname = 'public'
    ) LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS "users_select_self_or_admin" ON public.%I', r.tablename);
            EXECUTE format('DROP POLICY IF EXISTS "hosts_select_self_or_admin" ON public.%I', r.tablename);
            EXECUTE format('DROP POLICY IF EXISTS "stays_select_public_or_host_or_admin" ON public.%I', r.tablename);
            EXECUTE format('DROP POLICY IF EXISTS "reservations_select_customer_or_host_or_admin" ON public.%I', r.tablename);
        EXCEPTION WHEN OTHERS THEN
            -- 정책이 없으면 무시
            NULL;
        END;
    END LOOP;
END$$;

COMMIT;