-- ========================================
-- Stay One Day 브랜치용 간단 RLS 마이그레이션
-- 실제 존재하는 테이블만 포함
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

-- 🔧 2. Helper Functions 생성 (역할 관리)
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

-- 🚨 3. RLS 활성화 (기본 테이블만)
-- ========================================

-- 사용자 역할 (가장 중요)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 🔐 4. 기본 RLS 정책들
-- ========================================

-- 사용자 역할 정책
CREATE POLICY "user_roles_own_access" ON user_roles
FOR ALL USING (
  user_id = auth.uid() OR 
  public.get_user_role() IN ('super_admin', 'admin')
);

-- ✅ 5. 완료 메시지
-- ========================================
SELECT 'RLS 기본 설정 완료!' as message;