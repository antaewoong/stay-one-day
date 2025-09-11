-- ========================================
-- Stay One Day RLS 보안 강화 마이그레이션 (안전 실행용)
-- 기존 정책 덮어쓰기 방식
-- ========================================

-- 🔧 1. 필수 테이블 생성 (user_roles)
-- ========================================

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 🔧 2. Helper Functions 생성 (기존 덮어쓰기)
-- ========================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
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

-- 🚨 3. RLS 활성화 (존재하는 테이블만)
-- ========================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodation_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_collaboration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_notice_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_texts ENABLE ROW LEVEL SECURITY;

-- 🔐 4. 기존 정책 삭제 후 재생성
-- ========================================

-- 사용자 역할 정책
DROP POLICY IF EXISTS "user_roles_own_access" ON user_roles;
CREATE POLICY "user_roles_own_access" ON user_roles
FOR ALL USING (
  user_id = auth.uid() OR 
  public.get_user_role() IN ('super_admin', 'admin')
);

-- 호스트 정보 정책
DROP POLICY IF EXISTS "hosts_own_access" ON hosts;
CREATE POLICY "hosts_own_access" ON hosts
FOR ALL USING (
  user_id = auth.uid() OR
  public.get_user_role() IN ('super_admin', 'admin')
);

-- 사용자 프로필 정책
DROP POLICY IF EXISTS "profiles_own_access" ON profiles;
CREATE POLICY "profiles_own_access" ON profiles
FOR ALL USING (
  id = auth.uid() OR
  public.get_user_role() IN ('super_admin', 'admin')
);

-- 비즈니스 계정 정책
DROP POLICY IF EXISTS "business_accounts_owner_access" ON business_accounts;
CREATE POLICY "business_accounts_owner_access" ON business_accounts
FOR ALL USING (
  user_id = auth.uid() OR
  public.get_user_role() IN ('super_admin', 'admin')
);

-- 위시리스트 정책
DROP POLICY IF EXISTS "wishlists_own_access" ON wishlists;
CREATE POLICY "wishlists_own_access" ON wishlists
FOR ALL USING (
  user_id = auth.uid() OR
  public.get_user_role() IN ('super_admin', 'admin')
);

-- 알림 정책
DROP POLICY IF EXISTS "notifications_own_access" ON notifications;
CREATE POLICY "notifications_own_access" ON notifications
FOR ALL USING (
  user_id = auth.uid() OR
  public.get_user_role() IN ('super_admin', 'admin')
);

-- 공지사항 정책
DROP POLICY IF EXISTS "notices_admin_write" ON notices;
DROP POLICY IF EXISTS "notices_public_read" ON notices;

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

-- ✅ 5. 완료 메시지
-- ========================================
SELECT 'RLS 보안 강화 마이그레이션 완료!' as message;