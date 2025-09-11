-- ========================================
-- Stay One Day 안전한 RLS 확장
-- 기존 시스템 보존하며 user_roles만 추가
-- ========================================

-- 🔧 1. user_roles 테이블만 추가 (기존 시스템과 독립적)
-- ========================================

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS 활성화 (새 테이블이므로 안전)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 기본 정책 (기존과 충돌하지 않음)
CREATE POLICY "user_roles_safe_access" ON user_roles
FOR ALL USING (
  user_id = auth.uid() OR 
  is_admin() -- 기존 is_admin() 함수 사용
);

-- 🔧 2. 새로운 Helper Function (기존과 분리)
-- ========================================

CREATE OR REPLACE FUNCTION public.get_user_role_new()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role FROM user_roles WHERE user_id = auth.uid()),
    'customer'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ 3. 완료 메시지
-- ========================================
SELECT 'user_roles 테이블 안전하게 추가 완료!' as message;