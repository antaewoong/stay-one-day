-- GPT 스타일 RLS 정책을 Stay-OneDay에 적용
-- 기존 스키마에 맞게 수정한 버전

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

-- 기존 RLS 정책 모두 삭제
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Stays are publicly readable" ON stays;
DROP POLICY IF EXISTS "Hosts can manage their stays" ON stays;

-- 3. Users 테이블 정책
-- 사용자는 본인 정보만, 관리자는 전체 접근
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

-- 사용자 생성은 관리자만 (회원가입은 Service Key)
CREATE POLICY "users_insert_admin_only"
ON public.users
FOR INSERT
WITH CHECK (public.is_admin());

-- 4. Hosts 테이블 정책
-- 호스트는 본인 정보, 관리자는 전체
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
-- 공개 조회 허용, 호스트는 본인 스테이만 수정
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

CREATE POLICY "stays_delete_host_or_admin"
ON public.stays
FOR DELETE
USING (
  public.is_admin()
  OR auth.uid() IN (SELECT user_id FROM hosts WHERE id = host_id)
);

-- 6. Reservations 테이블 정책 (핵심!)
-- 고객: 자기 예약만, 호스트: 자기 스테이의 예약만, 관리자: 전체
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
    WHERE s.id = stay_id
  )
);

CREATE POLICY "reservations_insert_customer_or_host_or_admin"
ON public.reservations
FOR INSERT
WITH CHECK (
  public.is_admin()
  OR auth.uid() = user_id  -- 고객이 본인 명의로 예약
  OR auth.uid() IN (       -- 호스트가 자기 스테이에 대행 예약
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
    WHERE s.id = stay_id
  )
)
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

-- 예약 삭제는 관리자만 (일반적으로 취소 상태로만 변경)
CREATE POLICY "reservations_delete_admin_only"
ON public.reservations
FOR DELETE
USING (public.is_admin());

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

-- 결제 생성/수정은 시스템에서만 (Service Key)
CREATE POLICY "payments_insert_admin_only"
ON public.payments
FOR INSERT
WITH CHECK (public.is_admin());

-- 8. Reviews 테이블 정책
-- 공개 조회, 예약한 고객만 리뷰 작성
CREATE POLICY "reviews_select_public"
ON public.reviews
FOR SELECT
USING (status = 'published' OR public.is_admin());

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
  OR auth.uid() = user_id  -- 리뷰 작성자
  OR auth.uid() IN (       -- 해당 스테이 호스트 (답글용)
    SELECT h.user_id 
    FROM hosts h 
    JOIN stays s ON h.id = s.host_id 
    WHERE s.id = stay_id
  )
);

-- 9. 기본 관리자 계정 생성 (선택사항)
-- INSERT INTO auth.users (email, encrypted_password, role) VALUES ('admin@stay-oneday.com', crypt('password123', gen_salt('bf')), 'authenticated');
-- INSERT INTO public.user_roles (user_id, role) VALUES ((SELECT id FROM auth.users WHERE email = 'admin@stay-oneday.com'), 'admin');

-- 완료!
-- 이제 클라이언트에서 일반 Supabase 호출이 정상 작동합니다.

COMMIT;