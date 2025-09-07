-- hosts 테이블에 로그인 인증 필드 추가
ALTER TABLE hosts 
ADD COLUMN IF NOT EXISTS host_id VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- 기존 호스트들에 대한 기본 host_id 생성 (관리자가 나중에 수정 가능)
UPDATE hosts 
SET host_id = 'host-' || substr(id::text, 1, 8)
WHERE host_id IS NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_hosts_host_id ON hosts(host_id);

-- 관리자가 호스트 로그인 정보를 관리할 수 있도록 정책 추가 (이미 있으면 무시)
-- 기존 정책들은 그대로 두고 새로운 정책만 추가