-- hosts 테이블의 status 제약조건 확인 및 수정

-- 기존 status 제약조건 삭제 (있다면)
ALTER TABLE hosts DROP CONSTRAINT IF EXISTS hosts_status_check;

-- 새로운 status 제약조건 추가 (올바른 값들 허용)
ALTER TABLE hosts ADD CONSTRAINT hosts_status_check 
CHECK (status IN ('pending', 'active', 'suspended', 'inactive'));

-- 기존 잘못된 status 값들을 올바른 값으로 변경
UPDATE hosts SET status = 'pending' WHERE status NOT IN ('pending', 'active', 'suspended', 'inactive');