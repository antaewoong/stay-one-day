-- ========================================
-- Stay One Day RLS 보안 강화 마이그레이션 (수동 실행용)
-- 기능과 디자인 유지하며 RLS 정책 적용
-- ========================================

-- 실행 방법:
-- 1. Supabase Dashboard → SQL Editor 접속
-- 2. 아래 SQL을 복사하여 붙여넣기
-- 3. Run 실행

-- 🔧 1. Helper Functions 생성 (역할 관리)
-- ========================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  -- Supabase Auth 사용자의 metadata에서 role 가져오기
  RETURN COALESCE(
    (SELECT role FROM user_roles WHERE user_id = auth.uid()),
    'customer'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.user_owns_accommodation(accommodation_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM accommodations 
    WHERE id = accommodation_id 
    AND host_id IN (
      SELECT id FROM hosts WHERE user_id = auth.uid()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🚨 2. 심각한 보안 위험 테이블들 RLS 활성화
-- ========================================

-- 사용자 역할 (가장 중요)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 재정 관련 테이블
ALTER TABLE settlement_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodation_discounts ENABLE ROW LEVEL SECURITY;

-- 마케팅/개인정보 테이블
ALTER TABLE marketing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_performance ENABLE ROW LEVEL SECURITY;

-- 인플루언서 관련
ALTER TABLE influencer_collaboration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_notice_views ENABLE ROW LEVEL SECURITY;

-- 숙소 관련
ALTER TABLE stay_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodation_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_texts ENABLE ROW LEVEL SECURITY;

-- 🔐 3. 서브 에이전트 패턴 RLS 정책들
-- ========================================

-- A. 공개 데이터 - 읽기 모든 사용자, 쓰기 관리자만
-- ========================================

-- 카테고리
CREATE POLICY "categories_public_read" ON categories
FOR SELECT USING (true);

CREATE POLICY "categories_admin_write" ON categories  
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin')
) WITH CHECK (
  public.get_user_role() IN ('super_admin', 'admin')
);

-- 히어로 텍스트  
CREATE POLICY "hero_texts_public_read" ON hero_texts
FOR SELECT USING (true);

CREATE POLICY "hero_texts_admin_write" ON hero_texts
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin')
) WITH CHECK (
  public.get_user_role() IN ('super_admin', 'admin')
);

-- B. 개인정보/민감정보 - 본인 + 관리자만
-- ========================================

-- 사용자 역할 (핵심 보안)
CREATE POLICY "user_roles_own_access" ON user_roles
FOR ALL USING (
  user_id = auth.uid() OR 
  public.get_user_role() IN ('super_admin', 'admin')
);

-- 결제 정보
CREATE POLICY "payments_owner_access" ON payments
FOR ALL USING (
  reservation_id IN (
    SELECT id FROM reservations WHERE user_id = auth.uid()
  ) OR
  public.get_user_role() IN ('super_admin', 'admin')
);

-- C. 비즈니스 데이터 - 역할별 차등 접근
-- ========================================

-- 숙소 - 호스트별 접근
CREATE POLICY "accommodations_host_access" ON accommodations
FOR ALL USING (
  public.get_user_role() = 'host' AND
  host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
);

CREATE POLICY "accommodations_admin_access" ON accommodations
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin')
);

CREATE POLICY "accommodations_public_read" ON accommodations
FOR SELECT USING (
  status = 'active' AND 
  public.get_user_role() IN ('customer', 'influencer')
);

-- 예약 - 다중 역할 접근
CREATE POLICY "reservations_customer_access" ON reservations
FOR ALL USING (
  public.get_user_role() = 'customer' AND user_id = auth.uid()
);

CREATE POLICY "reservations_host_access" ON reservations  
FOR SELECT USING (
  public.get_user_role() = 'host' AND
  accommodation_id IN (
    SELECT id FROM accommodations 
    WHERE host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
  )
);

CREATE POLICY "reservations_admin_access" ON reservations
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin')
);

-- 리뷰 시스템
CREATE POLICY "reviews_customer_access" ON reviews
FOR ALL USING (
  public.get_user_role() = 'customer' AND user_id = auth.uid()
);

CREATE POLICY "reviews_host_read" ON reviews
FOR SELECT USING (
  public.get_user_role() = 'host' AND
  public.user_owns_accommodation(accommodation_id)
);

CREATE POLICY "reviews_admin_access" ON reviews
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin')
);

CREATE POLICY "reviews_public_read" ON reviews
FOR SELECT USING (
  status = 'active'
);

-- D. 인플루언서 시스템
-- ========================================

-- 인플루언서 프로필
CREATE POLICY "influencers_own_access" ON influencers
FOR ALL USING (
  id = (SELECT id FROM influencers WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())) OR
  public.get_user_role() IN ('super_admin', 'admin')
);

-- 협업 요청
CREATE POLICY "collaboration_requests_influencer_access" ON influencer_collaboration_requests
FOR ALL USING (
  public.get_user_role() = 'influencer' AND
  influencer_id = (SELECT id FROM influencers WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

CREATE POLICY "collaboration_requests_host_access" ON influencer_collaboration_requests
FOR ALL USING (
  public.get_user_role() = 'host' AND
  host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
);

CREATE POLICY "collaboration_requests_admin_access" ON influencer_collaboration_requests  
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin')
);

-- E. 정산/마케팅 데이터 - 관리자 전용
-- ========================================

CREATE POLICY "settlement_reports_admin_only" ON settlement_reports
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin')
);

CREATE POLICY "marketing_events_admin_only" ON marketing_events
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin')
);

CREATE POLICY "booking_conversions_admin_only" ON booking_conversions
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin')
);

CREATE POLICY "campaign_performance_admin_only" ON campaign_performance
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin')
);

-- F. 할인/프로모션 시스템
-- ========================================

CREATE POLICY "discount_codes_admin_access" ON discount_codes
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin')
);

CREATE POLICY "discount_codes_customer_read" ON discount_codes
FOR SELECT USING (
  is_active = true AND
  public.get_user_role() = 'customer'
);

-- 🔍 4. 기존 정책 없는 테이블들 정책 추가
-- ========================================

-- 호스트 정보
CREATE POLICY "hosts_own_access" ON hosts
FOR ALL USING (
  user_id = auth.uid() OR
  public.get_user_role() IN ('super_admin', 'admin')
);

-- 사용자 프로필
CREATE POLICY "profiles_own_access" ON profiles
FOR ALL USING (
  id = auth.uid() OR
  public.get_user_role() IN ('super_admin', 'admin')
);

-- 비즈니스 계정
CREATE POLICY "business_accounts_owner_access" ON business_accounts
FOR ALL USING (
  user_id = auth.uid() OR
  public.get_user_role() IN ('super_admin', 'admin')
);

-- 위시리스트
CREATE POLICY "wishlists_own_access" ON wishlists
FOR ALL USING (
  user_id = auth.uid() OR
  public.get_user_role() IN ('super_admin', 'admin')
);

-- 알림
CREATE POLICY "notifications_own_access" ON notifications
FOR ALL USING (
  user_id = auth.uid() OR
  public.get_user_role() IN ('super_admin', 'admin')
);

-- 공지사항
CREATE POLICY "notices_admin_write" ON notices
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin')
) WITH CHECK (
  public.get_user_role() IN ('super_admin', 'admin')
);

CREATE POLICY "notices_public_read" ON notices
FOR SELECT USING (
  status = 'published' OR
  public.get_user_role() IN ('super_admin', 'admin')
);

-- 🎯 5. 보안 취약점 해결
-- ========================================

-- Function search path 보안 강화
-- (일부 함수가 존재하지 않을 수 있으므로 오류 무시하고 진행)
ALTER FUNCTION update_notice_view_count SET search_path = '';
ALTER FUNCTION update_updated_at_column SET search_path = '';
ALTER FUNCTION generate_reservation_number SET search_path = '';
ALTER FUNCTION create_user_profile SET search_path = '';
ALTER FUNCTION update_accommodation_rating SET search_path = '';

-- ✅ 6. 완료 확인
-- ========================================
SELECT 'RLS 보안 강화 마이그레이션 완료!' as message;