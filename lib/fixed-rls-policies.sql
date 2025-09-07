-- Stay-OneDay 실제 스키마에 맞는 RLS 정책
-- 기존 테이블 구조를 그대로 사용

-- 1. 사용자 역할 테이블 추가 (복수 역할 지원)
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role    TEXT NOT NULL CHECK (role IN ('admin','host','customer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, role)
);

-- 2. 헬퍼 함수 생성 (보안 definer)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
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
  );
$$;

-- 기존 모든 RLS 정책 삭제
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('users', 'hosts', 'stays', 'reservations', 'payments', 'reviews', 'categories', 'stay_images', 'stay_options', 'sms_templates', 'notices', 'settlement_reports')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.%I', 'Users can view own data', r.tablename);
        EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.%I', 'Users can update own data', r.tablename);  
        EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.%I', 'Stays are publicly readable', r.tablename);
        EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.%I', 'Hosts can manage their stays', r.tablename);
    END LOOP;
END$$;

-- RLS 활성화 (이미 활성화된 경우 무시)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 3. Users 테이블 정책
CREATE POLICY "users_select_self_or_admin"
ON public.users
FOR SELECT
USING (
  public.is_admin() OR auth.uid() = id
);

CREATE POLICY "users_update_self_or_admin"
ON public.users  
FOR UPDATE
USING (
  public.is_admin() OR auth.uid() = id
)
WITH CHECK (
  public.is_admin() OR auth.uid() = id
);

-- 사용자 생성은 누구나 가능 (회원가입)
CREATE POLICY "users_insert_anyone"
ON public.users
FOR INSERT
WITH CHECK (true);

-- 4. Hosts 테이블 정책
CREATE POLICY "hosts_select_self_or_admin"
ON public.hosts
FOR SELECT
USING (
  public.is_admin() 
  OR auth.uid() = user_id
);

CREATE POLICY "hosts_update_self_or_admin"
ON public.hosts
FOR UPDATE
USING (
  public.is_admin() 
  OR auth.uid() = user_id
)
WITH CHECK (
  public.is_admin() 
  OR auth.uid() = user_id
);

-- 호스트 생성은 관리자만
CREATE POLICY "hosts_insert_admin_only"
ON public.hosts
FOR INSERT
WITH CHECK (public.is_admin());

-- 5. Stays 테이블 정책
CREATE POLICY "stays_select_public_or_host_or_admin"
ON public.stays
FOR SELECT
USING (
  status = 'active'  -- 활성 스테이는 공개
  OR public.is_admin()
  OR auth.uid() IN (SELECT user_id FROM hosts WHERE id = host_id)
);

CREATE POLICY "stays_insert_host_or_admin"
ON public.stays
FOR INSERT
WITH CHECK (
  public.is_admin()
  OR auth.uid() IN (SELECT user_id FROM hosts WHERE id = host_id)
);

CREATE POLICY "stays_update_host_or_admin"
ON public.stays
FOR UPDATE
USING (
  public.is_admin()
  OR auth.uid() IN (SELECT user_id FROM hosts WHERE id = host_id)
)
WITH CHECK (
  public.is_admin()
  OR auth.uid() IN (SELECT user_id FROM hosts WHERE id = host_id)
);

-- 6. Reservations 테이블 정책 (실제 컬럼명 사용)
CREATE POLICY "reservations_select_customer_or_host_or_admin"
ON public.reservations
FOR SELECT
USING (
  public.is_admin()
  OR auth.uid() = user_id  -- 고객: 자기 예약
  OR auth.uid() IN (       -- 호스트: 자기 스테이의 예약  
    SELECT h.user_id 
    FROM hosts h 
    JOIN stays s ON h.id = s.host_id 
    WHERE s.id = reservations.stay_id
  )
);

CREATE POLICY "reservations_insert_customer_or_host_or_admin"
ON public.reservations
FOR INSERT
WITH CHECK (
  public.is_admin()
  OR auth.uid() = user_id  
  OR auth.uid() IN (       
    SELECT h.user_id 
    FROM hosts h 
    JOIN stays s ON h.id = s.host_id 
    WHERE s.id = stay_id
  )
);

CREATE POLICY "reservations_update_customer_or_host_or_admin"
ON public.reservations
FOR UPDATE
USING (
  public.is_admin()
  OR auth.uid() = user_id
  OR auth.uid() IN (
    SELECT h.user_id 
    FROM hosts h 
    JOIN stays s ON h.id = s.host_id 
    WHERE s.id = reservations.stay_id
  )
);

-- 7. Payments 테이블 정책
CREATE POLICY "payments_select_customer_or_host_or_admin"
ON public.payments
FOR SELECT
USING (
  public.is_admin()
  OR auth.uid() IN (
    SELECT r.user_id 
    FROM reservations r 
    WHERE r.id = reservation_id
  )
  OR auth.uid() IN (
    SELECT h.user_id 
    FROM hosts h 
    JOIN stays s ON h.id = s.host_id 
    JOIN reservations r ON s.id = r.stay_id 
    WHERE r.id = reservation_id
  )
);

-- 결제는 시스템에서만 생성/수정
CREATE POLICY "payments_insert_admin_only"
ON public.payments
FOR INSERT
WITH CHECK (public.is_admin());

-- 8. Reviews 테이블 정책
CREATE POLICY "reviews_select_public_or_admin"
ON public.reviews
FOR SELECT
USING (
  status = 'published' 
  OR public.is_admin()
  OR auth.uid() = user_id
);

CREATE POLICY "reviews_insert_customer_only"
ON public.reviews
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND auth.uid() IN (
    SELECT user_id FROM reservations WHERE id = reservation_id
  )
);

CREATE POLICY "reviews_update_author_or_host_or_admin"
ON public.reviews
FOR UPDATE
USING (
  public.is_admin()
  OR auth.uid() = user_id  
  OR auth.uid() IN (       
    SELECT h.user_id 
    FROM hosts h 
    JOIN stays s ON h.id = s.host_id 
    WHERE s.id = reviews.stay_id
  )
);

-- 9. 기타 테이블들 - 기본 허용 (RLS 비활성화)
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stay_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stay_options DISABLE ROW LEVEL SECURITY;

-- 10. 관리자 계정이 있다면 역할 부여
-- 실제 관리자 계정의 UUID를 확인 후 실행
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('실제-관리자-UUID', 'admin');

COMMIT;