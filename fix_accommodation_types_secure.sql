-- 더 안전한 accommodation_types RLS 정책
-- 필요시 이것으로 교체하세요

-- 기존 정책 삭제
DROP POLICY IF EXISTS "accommodation_types_all_policy" ON accommodation_types;

-- SELECT: 모든 사용자가 조회 가능
CREATE POLICY "accommodation_types_select_policy" ON accommodation_types
    FOR SELECT
    USING (true);

-- INSERT/UPDATE/DELETE: Service role만 허용 (API를 통해서만 수정)
CREATE POLICY "accommodation_types_modify_policy" ON accommodation_types
    FOR ALL
    USING (
        -- Service role만 허용
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    )
    WITH CHECK (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );