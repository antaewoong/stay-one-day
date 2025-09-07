-- accommodation_types 테이블의 RLS 정책을 간단하게 설정
-- Supabase SQL Editor에서 실행하세요

-- 기존 정책들 삭제
DROP POLICY IF EXISTS "accommodation_types_select_policy" ON accommodation_types;
DROP POLICY IF EXISTS "accommodation_types_insert_policy" ON accommodation_types;
DROP POLICY IF EXISTS "accommodation_types_update_policy" ON accommodation_types;
DROP POLICY IF EXISTS "accommodation_types_delete_policy" ON accommodation_types;

-- RLS 활성화
ALTER TABLE accommodation_types ENABLE ROW LEVEL SECURITY;

-- 모든 작업을 허용하는 임시 정책 (개발용)
CREATE POLICY "accommodation_types_all_policy" ON accommodation_types
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 확인
SELECT * FROM pg_policies WHERE tablename = 'accommodation_types';