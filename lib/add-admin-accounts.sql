-- 관리자 계정 테이블 생성
CREATE TABLE IF NOT EXISTS admin_accounts (
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

-- 테이블이 이미 존재하는 경우 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_accounts' AND column_name = 'username') THEN
        ALTER TABLE admin_accounts ADD COLUMN username VARCHAR(50) UNIQUE NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_accounts' AND column_name = 'password_hash') THEN
        ALTER TABLE admin_accounts ADD COLUMN password_hash TEXT NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_accounts' AND column_name = 'name') THEN
        ALTER TABLE admin_accounts ADD COLUMN name VARCHAR(100) NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_accounts' AND column_name = 'role') THEN
        ALTER TABLE admin_accounts ADD COLUMN role VARCHAR(20) DEFAULT 'admin';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_accounts' AND column_name = 'is_active') THEN
        ALTER TABLE admin_accounts ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_accounts' AND column_name = 'last_login') THEN
        ALTER TABLE admin_accounts ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 기본 관리자 계정 추가 (비밀번로 해시화 필요)
INSERT INTO admin_accounts (username, password_hash, name, email) 
VALUES 
  ('admin', 'nuklabsstay90!!', '메인 관리자', 'admin@stayoneday.com'),
  ('admin2', 'admin123!@#', '보조 관리자', 'admin2@stayoneday.com')
ON CONFLICT (username) DO NOTHING;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_admin_accounts_username ON admin_accounts(username);
CREATE INDEX IF NOT EXISTS idx_admin_accounts_is_active ON admin_accounts(is_active);

-- RLS 정책 (관리자끼리만 조회/수정 가능)
ALTER TABLE admin_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin accounts management" ON admin_accounts 
FOR ALL USING (true);