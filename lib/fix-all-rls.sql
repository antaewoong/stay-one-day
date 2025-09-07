-- 모든 테이블의 RLS를 일괄 비활성화
-- admin 시스템이 Supabase Auth를 사용하지 않아 auth.uid()가 null이므로
-- 임시로 모든 RLS를 비활성화

-- 기본 테이블들
ALTER TABLE public.hosts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.accommodations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_inquiries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnership_inquiries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_inquiries DISABLE ROW LEVEL SECURITY;

-- 이미지 관련 테이블들 (있을 경우)
ALTER TABLE IF EXISTS public.accommodation_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.accommodation_amenities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.accommodation_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.accommodation_options DISABLE ROW LEVEL SECURITY;

-- 기타 관련 테이블들
ALTER TABLE IF EXISTS public.discount_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.host_verifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wishlists DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bookings DISABLE ROW LEVEL SECURITY;

-- 확인용 쿼리 (모든 테이블의 RLS 상태 확인)
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;