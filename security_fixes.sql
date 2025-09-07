-- 🔐 CRITICAL SECURITY FIXES

-- 1. RLS 정책 활성화 및 수정
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE main_page_sections ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Everyone can view hero slides" ON hero_slides;
DROP POLICY IF EXISTS "Authenticated users can manage hero slides" ON hero_slides;
DROP POLICY IF EXISTS "Everyone can view sections" ON main_page_sections;
DROP POLICY IF EXISTS "Authenticated users can manage sections" ON main_page_sections;

-- 2. 올바른 RLS 정책 설정
-- 히어로 슬라이드: 모든 사용자 읽기, 관리자만 수정
CREATE POLICY "Public can view active hero slides" ON hero_slides
  FOR SELECT USING (active = true);

CREATE POLICY "Admin can manage hero slides" ON hero_slides
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%admin%'
    )
  );

-- 메인페이지 섹션: 모든 사용자 읽기, 관리자만 수정  
CREATE POLICY "Public can view active sections" ON main_page_sections
  FOR SELECT USING (active = true);

CREATE POLICY "Admin can manage sections" ON main_page_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%admin%'
    )
  );

-- 숙소: 모든 사용자 읽기, 소유자/관리자만 수정
CREATE POLICY "Public can view accommodations" ON accommodations
  FOR SELECT USING (true);

CREATE POLICY "Owner can manage own accommodations" ON accommodations
  FOR ALL USING (
    auth.uid() = host_id OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%admin%'
    )
  );

-- 3. 관리자 역할 테이블 생성
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 4. 더 엄격한 관리자 정책으로 업데이트
DROP POLICY IF EXISTS "Admin can manage hero slides" ON hero_slides;
DROP POLICY IF EXISTS "Admin can manage sections" ON main_page_sections;

CREATE POLICY "Admin can manage hero slides" ON hero_slides
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage sections" ON main_page_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- 5. 함수 기반 보안 검사
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;