-- 실제 데이터베이스 스키마 확인용 SQL
-- Supabase SQL Editor에서 실행하세요

-- 1. 현재 존재하는 모든 테이블 목록
SELECT table_name, table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. users 테이블 컬럼 구조
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. hosts 테이블 컬럼 구조  
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'hosts' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. stays 테이블 컬럼 구조
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'stays' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. reservations 테이블 컬럼 구조 (가장 중요!)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'reservations' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. 현재 RLS 상태 확인
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 7. 현재 RLS 정책 목록
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;