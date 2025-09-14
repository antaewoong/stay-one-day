-- 인플루언서 첫 로그인 관리를 위한 스키마 업데이트
-- 사용자가 Supabase 대시보드에서 직접 실행해야 합니다.

-- 1. first_login 컬럼 추가
ALTER TABLE influencers
ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true;

-- 2. 컬럼 설명 추가
COMMENT ON COLUMN influencers.first_login IS '첫 로그인 여부 (true: 비밀번호 변경 필요, false: 변경 완료)';

-- 3. 기존 인플루언서들은 첫 로그인으로 설정 (필요시)
UPDATE influencers
SET first_login = true
WHERE first_login IS NULL;

-- 4. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_influencers_first_login ON influencers(first_login);
CREATE INDEX IF NOT EXISTS idx_influencers_email_first_login ON influencers(email, first_login);

-- 5. Row Level Security (RLS) 정책 확인
-- 인플루언서가 자신의 first_login 상태를 업데이트할 수 있도록 정책이 있는지 확인
-- (기존 정책이 충분하다면 추가 정책 불필요)