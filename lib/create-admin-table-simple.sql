-- 관리자 계정 테이블 삭제 후 재생성 (Supabase SQL Editor에서 실행)
DROP TABLE IF EXISTS admin_accounts CASCADE;

-- 관리자 계정 테이블 생성
CREATE TABLE admin_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(20) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 관리자 계정 추가
INSERT INTO admin_accounts (username, password_hash, name, email, role) 
VALUES 
  ('admin', 'nuklabsstay90!!', '메인 관리자', 'admin@stayoneday.com', 'super_admin'),
  ('admin2', 'admin123!@#', '보조 관리자', 'admin2@stayoneday.com', 'admin');

-- 인덱스 추가
CREATE INDEX idx_admin_accounts_username ON admin_accounts(username);
CREATE INDEX idx_admin_accounts_is_active ON admin_accounts(is_active);

-- RLS 정책
ALTER TABLE admin_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin accounts management" ON admin_accounts FOR ALL USING (true);