-- 문의사항 관련 테이블들 생성 SQL
-- Supabase 대시보드에서 SQL 편집기에서 실행

-- 1. 일반 문의사항 테이블 (고객 문의)
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_phone TEXT,
  inquiry_type TEXT NOT NULL CHECK (inquiry_type IN ('booking', 'service', 'complaint', 'general')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  accommodation_id UUID REFERENCES accommodations(id),
  admin_response TEXT,
  admin_id UUID,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 제휴 문의 테이블 (기업 제휴 문의)
CREATE TABLE IF NOT EXISTS partnership_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  business_type TEXT NOT NULL,
  inquiry TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  notes TEXT,
  admin_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 입점 문의 테이블 (호스트 입점 문의)
CREATE TABLE IF NOT EXISTS partner_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  website_url TEXT,
  location TEXT NOT NULL,
  space_type TEXT NOT NULL,
  daily_rate TEXT,
  average_idle_days TEXT,
  parking_spaces TEXT,
  amenities TEXT,
  notes TEXT,
  privacy_consent BOOLEAN NOT NULL DEFAULT false,
  marketing_consent BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  admin_notes TEXT,
  admin_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE partnership_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_inquiries ENABLE ROW LEVEL SECURITY;

-- 관리자만 접근 가능한 정책
CREATE POLICY "Admin access to inquiries" ON inquiries
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin access to partnership_inquiries" ON partnership_inquiries
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin access to partner_inquiries" ON partner_inquiries
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 또는 서비스 역할 키로 모든 접근 허용 (개발 단계)
CREATE POLICY "Service role access to inquiries" ON inquiries
  FOR ALL USING (true);

CREATE POLICY "Service role access to partnership_inquiries" ON partnership_inquiries
  FOR ALL USING (true);

CREATE POLICY "Service role access to partner_inquiries" ON partner_inquiries
  FOR ALL USING (true);