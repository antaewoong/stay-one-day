-- hosts 테이블 스키마 확인용 SQL
-- Supabase SQL Editor에서 실행하세요

-- 1. hosts 테이블이 존재하는지 확인
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'hosts'
) AS hosts_table_exists;

-- 2. hosts 테이블 컬럼 구조 상세 정보
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'hosts' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. hosts 테이블의 제약조건 확인
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'hosts' AND tc.table_schema = 'public';

-- 4. hosts 테이블의 인덱스 확인
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'hosts' AND schemaname = 'public';

-- 5. hosts 테이블의 현재 데이터 샘플 (있다면)
SELECT COUNT(*) as total_hosts FROM hosts;

-- 6. hosts 테이블 RLS 정책 확인
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'hosts';