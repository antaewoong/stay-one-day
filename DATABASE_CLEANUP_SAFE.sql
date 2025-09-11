-- ========================================
-- Stay One Day 안전한 데이터베이스 정리
-- 오류 없이 중복 테이블 제거 및 최적화
-- ========================================

-- 실행 방법:
-- 1. Supabase Dashboard → SQL Editor 접속  
-- 2. 아래 SQL을 복사하여 단계별 실행
-- 3. 각 단계 후 결과 확인

-- 🔍 1단계: 현재 상태 확인
-- ========================================
SELECT 'DATABASE CLEANUP - 현재 상태 확인' as step;

SELECT 
  'hosts' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT user_id) as unique_users
FROM hosts
UNION ALL
SELECT 
  'accommodations' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT host_id) as unique_hosts
FROM accommodations
UNION ALL
SELECT 
  'stays' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT host_id) as unique_hosts
FROM stays;

-- 🧹 2단계: 비어있는 stays 테이블 안전 제거
-- ========================================
SELECT 'DATABASE CLEANUP - stays 테이블 제거 중...' as step;

-- stays 테이블 RLS 정책 제거
DROP POLICY IF EXISTS "stays_public_read" ON stays;
DROP POLICY IF EXISTS "stays_host_write" ON stays;
DROP POLICY IF EXISTS "stay_images_public_read" ON stay_images;
DROP POLICY IF EXISTS "stay_images_host_write" ON stay_images;
DROP POLICY IF EXISTS "stay_options_public_read" ON stay_options;
DROP POLICY IF EXISTS "stay_options_admin_write" ON stay_options;

-- 관련 테이블들 확인 후 정리
DROP TABLE IF EXISTS stay_images CASCADE;
DROP TABLE IF EXISTS stay_options CASCADE;
DROP TABLE IF EXISTS stays CASCADE;

-- 🔧 3단계: business_accounts 테이블 확인 및 정리
-- ========================================
SELECT 'DATABASE CLEANUP - business_accounts 확인 중...' as step;

-- business_accounts 사용 여부 확인
SELECT 
  'business_accounts' as table_name,
  COUNT(*) as row_count
FROM business_accounts;

-- business_accounts와 hosts 중복성 해결
-- (코드에서 사용되지 않으므로 제거 고려)
SELECT 'business_accounts 테이블은 코드에서 사용되지 않음 - 제거 권장' as recommendation;

-- 4단계: 정리 완료 확인
-- ========================================
SELECT 'DATABASE CLEANUP - 정리 완료 확인' as step;

-- 최종 테이블 상태
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('hosts', 'accommodations', 'stays', 'business_accounts')
ORDER BY tablename;

-- ✅ 완료 메시지
SELECT '데이터베이스 정리 완료! 이제 accommodations 테이블을 메인으로 사용합니다.' as final_message;