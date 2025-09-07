-- accommodation_types 테이블의 RLS 정책 설정

-- 기존 정책들 확인 및 삭제
DROP POLICY IF EXISTS "accommodation_types_select_policy" ON accommodation_types;
DROP POLICY IF EXISTS "accommodation_types_insert_policy" ON accommodation_types;
DROP POLICY IF EXISTS "accommodation_types_update_policy" ON accommodation_types;
DROP POLICY IF EXISTS "accommodation_types_delete_policy" ON accommodation_types;

-- RLS 활성화 확인
ALTER TABLE accommodation_types ENABLE ROW LEVEL SECURITY;

-- 1. SELECT 정책: 모든 사용자가 조회 가능
CREATE POLICY "accommodation_types_select_policy" ON accommodation_types
    FOR SELECT
    USING (true);

-- 2. INSERT 정책: 관리자와 숙소 소유자만 가능
CREATE POLICY "accommodation_types_insert_policy" ON accommodation_types
    FOR INSERT
    WITH CHECK (
        -- Service role 허용
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
        OR
        -- 관리자 허용
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
        OR
        -- 숙소 소유자 허용 (accommodation_id로 확인)
        EXISTS (
            SELECT 1 FROM accommodations a
            JOIN hosts h ON a.host_id = h.id
            WHERE a.id = accommodation_types.accommodation_id
            AND h.user_id = auth.uid()
        )
    );

-- 3. UPDATE 정책: 관리자와 숙소 소유자만 가능
CREATE POLICY "accommodation_types_update_policy" ON accommodation_types
    FOR UPDATE
    USING (
        -- Service role 허용
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
        OR
        -- 관리자 허용
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
        OR
        -- 숙소 소유자 허용
        EXISTS (
            SELECT 1 FROM accommodations a
            JOIN hosts h ON a.host_id = h.id
            WHERE a.id = accommodation_types.accommodation_id
            AND h.user_id = auth.uid()
        )
    );

-- 4. DELETE 정책: 관리자와 숙소 소유자만 가능
CREATE POLICY "accommodation_types_delete_policy" ON accommodation_types
    FOR DELETE
    USING (
        -- Service role 허용
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
        OR
        -- 관리자 허용
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
        OR
        -- 숙소 소유자 허용
        EXISTS (
            SELECT 1 FROM accommodations a
            JOIN hosts h ON a.host_id = h.id
            WHERE a.id = accommodation_types.accommodation_id
            AND h.user_id = auth.uid()
        )
    );

-- 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'accommodation_types';