-- 호스트 소유권 매핑 및 RLS 정책 수정
-- 이슈 해결: H1, H2 (호스트 본인 소유 숙소 미노출)

-- 1. hosts 테이블 user_id 매핑 수정 (이메일 기준으로)
UPDATE hosts h
SET user_id = au.id
FROM auth.users au
WHERE h.email = au.email
AND h.user_id IS NULL
AND au.raw_user_meta_data->>'role' = 'host';

-- 2. 기존 복잡한 RLS 정책들 정리
DROP POLICY IF EXISTS "accommodations_host_access" ON accommodations;
DROP POLICY IF EXISTS "accommodations_admin_access" ON accommodations;

-- 3. 명확한 소유권 기반 정책 생성
-- 호스트 조회 정책 (SELECT)
CREATE POLICY "hosts_select_own_accommodations"
ON accommodations FOR SELECT
TO public
USING (
  host_id IN (
    SELECT h.id
    FROM hosts h
    WHERE h.user_id = auth.uid()
  )
  OR is_admin()
  OR status = 'active' -- 일반 사용자는 active만 조회
);

-- 호스트 수정 정책 (UPDATE)
CREATE POLICY "hosts_update_own_accommodations"
ON accommodations FOR UPDATE
TO public
USING (
  host_id IN (
    SELECT h.id
    FROM hosts h
    WHERE h.user_id = auth.uid()
  )
  OR is_admin()
);

-- 호스트 삭제 정책 (DELETE)
CREATE POLICY "hosts_delete_own_accommodations"
ON accommodations FOR DELETE
TO public
USING (
  host_id IN (
    SELECT h.id
    FROM hosts h
    WHERE h.user_id = auth.uid()
  )
  OR is_admin()
);

-- 호스트 생성 정책 (INSERT)
CREATE POLICY "hosts_insert_accommodations"
ON accommodations FOR INSERT
TO public
WITH CHECK (
  host_id IN (
    SELECT h.id
    FROM hosts h
    WHERE h.user_id = auth.uid()
  )
  OR is_admin()
);

-- 4. 성능 최적화를 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_hosts_user_id ON hosts(user_id);
CREATE INDEX IF NOT EXISTS idx_accommodations_host_id ON accommodations(host_id);

-- 5. 검증 쿼리 (주석)
-- SELECT h.email, h.user_id, COUNT(a.id) as accommodation_count
-- FROM hosts h
-- LEFT JOIN accommodations a ON h.id = a.host_id
-- WHERE h.user_id IS NOT NULL
-- GROUP BY h.id, h.email, h.user_id
-- ORDER BY accommodation_count DESC;