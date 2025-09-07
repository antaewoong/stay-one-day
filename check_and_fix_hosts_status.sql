-- 1단계: 현재 hosts 테이블의 모든 status 값 확인
SELECT status, COUNT(*) as count 
FROM hosts 
GROUP BY status
ORDER BY status;

-- 2단계: 기존 제약조건 삭제 (있다면)
ALTER TABLE hosts DROP CONSTRAINT IF EXISTS hosts_status_check;

-- 3단계: 잘못된 status 값들을 올바른 값으로 변경
-- 일반적인 변경 규칙:
-- 'approved' -> 'active'
-- 'waiting' -> 'pending' 
-- 'rejected' -> 'suspended'
-- 'disabled' -> 'inactive'
-- 빈 값이나 null -> 'pending'

UPDATE hosts SET status = 'active' WHERE status = 'approved';
UPDATE hosts SET status = 'pending' WHERE status = 'waiting';
UPDATE hosts SET status = 'suspended' WHERE status = 'rejected';
UPDATE hosts SET status = 'inactive' WHERE status = 'disabled';
UPDATE hosts SET status = 'pending' WHERE status IS NULL OR status = '';

-- 다른 예상 가능한 값들도 변경
UPDATE hosts SET status = 'active' WHERE status IN ('enabled', 'confirmed');
UPDATE hosts SET status = 'pending' WHERE status IN ('review', 'reviewing', 'awaiting');
UPDATE hosts SET status = 'suspended' WHERE status IN ('banned', 'blocked');

-- 4단계: 변경 후 다시 확인
SELECT status, COUNT(*) as count 
FROM hosts 
GROUP BY status
ORDER BY status;

-- 5단계: 새로운 제약조건 추가
ALTER TABLE hosts ADD CONSTRAINT hosts_status_check 
CHECK (status IN ('pending', 'active', 'suspended', 'inactive'));