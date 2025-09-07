-- 임시로 admin 관련 테이블들의 RLS를 비활성화
-- 현재 admin 로그인이 Supabase Auth를 사용하지 않아서 auth.uid()가 null
-- 나중에 admin 인증 시스템을 Supabase Auth와 연동한 후 다시 활성화할 예정

-- 호스트 테이블 RLS 비활성화
ALTER TABLE public.hosts DISABLE ROW LEVEL SECURITY;

-- 숙소 테이블 RLS 비활성화 (admin이 숙소 등록할 수 있도록)
ALTER TABLE public.accommodations DISABLE ROW LEVEL SECURITY;

-- 공지사항, 문의사항 등 admin 관련 테이블들도 필요시 비활성화
-- ALTER TABLE public.notices DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.partner_inquiries DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.partnership_inquiries DISABLE ROW LEVEL SECURITY;