-- Stay-OneDay 실제 데이터베이스 구조에 맞춘 체계적인 RLS 정책
-- GPT 방식을 현재 스키마에 적용

-- 1. 사용자 역할 테이블 추가 (GPT 방식)
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role    TEXT NOT NULL CHECK (role IN ('admin','host','customer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, role)
);

-- 2. 헬퍼 함수 생성 (GPT 방식)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND email = 'admin@stay-oneday.com'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_host()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'host'
  ) OR EXISTS (
    SELECT 1 FROM public.hosts
    WHERE user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_customer()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'customer'
  );
$$;

-- 기존 모든 정책 삭제 (안전하게)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- 기존 정책들 삭제
    DROP POLICY IF EXISTS "누구나 활성화된 숙소 조회 가능" ON public.accommodations;
    DROP POLICY IF EXISTS "사업자는 자신의 숙소만 관리 가능" ON public.accommodations;
    DROP POLICY IF EXISTS "Anyone can insert host data" ON public.hosts;
    DROP POLICY IF EXISTS "Users can update own host data" ON public.hosts;
    DROP POLICY IF EXISTS "Users can view own host data" ON public.hosts;
    DROP POLICY IF EXISTS "사용자는 자신의 알림만 업데이트 가능" ON public.notifications;
    DROP POLICY IF EXISTS "사용자는 자신의 알림만 조회 가능" ON public.notifications;
    DROP POLICY IF EXISTS "Admin can update partner inquiries" ON public.partner_inquiries;
    DROP POLICY IF EXISTS "Admin can view all partner inquiries" ON public.partner_inquiries;
    DROP POLICY IF EXISTS "Anyone can submit partner inquiries" ON public.partner_inquiries;
    DROP POLICY IF EXISTS "Admin can update partnership inquiries" ON public.partnership_inquiries;
    DROP POLICY IF EXISTS "Admin can view all partnership inquiries" ON public.partnership_inquiries;
    DROP POLICY IF EXISTS "Anyone can submit partnership inquiries" ON public.partnership_inquiries;
    DROP POLICY IF EXISTS "사용자는 자신의 프로필만 업데이트 가능" ON public.profiles;
    DROP POLICY IF EXISTS "사용자는 자신의 프로필만 조회 가능" ON public.profiles;
    DROP POLICY IF EXISTS "사용자는 예약 생성 가능" ON public.reservations;
    DROP POLICY IF EXISTS "사용자는 자신의 예약만 조회 가능" ON public.reservations;
    DROP POLICY IF EXISTS "누구나 활성화된 리뷰 조회 가능" ON public.reviews;
    DROP POLICY IF EXISTS "사용자는 자신의 리뷰만 작성/수정 가능" ON public.reviews;
    DROP POLICY IF EXISTS "Hosts can manage their stays" ON public.stays;
    DROP POLICY IF EXISTS "Stays are publicly readable" ON public.stays;
    DROP POLICY IF EXISTS "Users can update own data" ON public.users;
    DROP POLICY IF EXISTS "Users can view own data" ON public.users;
    DROP POLICY IF EXISTS "사용자는 자신의 위시리스트만 관리 가능" ON public.wishlists;
EXCEPTION WHEN OTHERS THEN
    -- 정책이 없으면 무시
    NULL;
END$$;

-- 3. 새로운 체계적인 RLS 정책 생성

-- 3.1 Users 테이블 (기본 사용자 정보)
CREATE POLICY "users_admin_full_access"
ON public.users
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "users_self_access"
ON public.users
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3.2 Hosts 테이블 (호스트 정보)
CREATE POLICY "hosts_admin_full_access"
ON public.hosts
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "hosts_self_access"
ON public.hosts
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 호스트 등록은 누구나 가능 (관리자 승인 방식)
CREATE POLICY "hosts_anyone_can_register"
ON public.hosts
FOR INSERT
WITH CHECK (true);

-- 3.3 Accommodations 테이블 (숙소 정보)
-- 활성 숙소는 공개 조회
CREATE POLICY "accommodations_public_read_active"
ON public.accommodations
FOR SELECT
USING (status = 'active');

-- 관리자와 소유 호스트만 전체 관리
CREATE POLICY "accommodations_admin_full_access"
ON public.accommodations
FOR ALL
USING (
  public.is_admin()
  OR auth.uid() IN (
    SELECT ba.user_id 
    FROM business_accounts ba 
    WHERE ba.id = business_id
  )
)
WITH CHECK (
  public.is_admin()
  OR auth.uid() IN (
    SELECT ba.user_id 
    FROM business_accounts ba 
    WHERE ba.id = business_id
  )
);

-- 3.4 Reservations 테이블 (예약 정보)
-- 고객: 자기 예약만, 호스트: 자기 숙소 예약만, 관리자: 전체
CREATE POLICY "reservations_customer_own"
ON public.reservations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "reservations_host_own_accommodations"
ON public.reservations
FOR SELECT
USING (
  auth.uid() IN (
    SELECT ba.user_id
    FROM business_accounts ba
    JOIN accommodations a ON ba.id = a.business_id
    WHERE a.id = accommodation_id
  )
);

CREATE POLICY "reservations_admin_full_access"
ON public.reservations
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 예약 생성은 누구나 가능
CREATE POLICY "reservations_anyone_can_book"
ON public.reservations
FOR INSERT
WITH CHECK (true);

-- 예약 수정: 본인, 해당 호스트, 관리자만
CREATE POLICY "reservations_update_allowed"
ON public.reservations
FOR UPDATE
USING (
  public.is_admin()
  OR auth.uid() = user_id
  OR auth.uid() IN (
    SELECT ba.user_id
    FROM business_accounts ba
    JOIN accommodations a ON ba.id = a.business_id
    WHERE a.id = accommodation_id
  )
);

-- 3.5 Reviews 테이블 (리뷰)
-- 활성 리뷰는 공개 조회
CREATE POLICY "reviews_public_read_active"
ON public.reviews
FOR SELECT
USING (status = 'active');

-- 관리자 전체 접근
CREATE POLICY "reviews_admin_full_access"
ON public.reviews
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 사용자는 본인 리뷰만 작성/수정
CREATE POLICY "reviews_user_own"
ON public.reviews
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3.6 Business Accounts 테이블 (사업자 계정)
CREATE POLICY "business_accounts_admin_full_access"
ON public.business_accounts
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "business_accounts_owner_access"
ON public.business_accounts
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3.7 기타 테이블들

-- Profiles (사용자 프로필)
CREATE POLICY "profiles_admin_full_access"
ON public.profiles
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "profiles_self_access"
ON public.profiles
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Wishlists (위시리스트)
CREATE POLICY "wishlists_admin_full_access"
ON public.wishlists
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "wishlists_user_own"
ON public.wishlists
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Notifications (알림)
CREATE POLICY "notifications_admin_full_access"
ON public.notifications
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "notifications_user_own"
ON public.notifications
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Partner/Partnership Inquiries (파트너 문의)
CREATE POLICY "partner_inquiries_admin_access"
ON public.partner_inquiries
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "partner_inquiries_public_submit"
ON public.partner_inquiries
FOR INSERT
WITH CHECK (true);

CREATE POLICY "partnership_inquiries_admin_access"
ON public.partnership_inquiries
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "partnership_inquiries_public_submit"
ON public.partnership_inquiries
FOR INSERT
WITH CHECK (true);

-- 4. 관리자 계정 역할 부여 (이미 있는 계정에)
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'admin' 
FROM auth.users 
WHERE email = 'admin@stay-oneday.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 5. 기존 호스트들에게 host 역할 부여
INSERT INTO public.user_roles (user_id, role) 
SELECT user_id, 'host' 
FROM hosts 
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

COMMIT;