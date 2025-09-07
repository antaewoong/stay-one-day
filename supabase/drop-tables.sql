-- 기존 테이블 삭제 (외래키 순서 고려)
-- Stay One Day 데이터베이스 초기화

-- 1. 종속성이 있는 테이블들부터 삭제
DROP TABLE IF EXISTS promotion_usages CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS sms_logs CASCADE;
DROP TABLE IF EXISTS sms_templates CASCADE;
DROP TABLE IF EXISTS settlements CASCADE;
DROP TABLE IF EXISTS notices CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS review_images CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS wishlists CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS accommodation_categories CASCADE;
DROP TABLE IF EXISTS accommodation_amenities CASCADE;
DROP TABLE IF EXISTS accommodation_images CASCADE;
DROP TABLE IF EXISTS accommodations CASCADE;
DROP TABLE IF EXISTS business_accounts CASCADE;
DROP TABLE IF EXISTS admin_accounts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. 트리거 및 함수 삭제
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
DROP FUNCTION IF EXISTS create_user_profile();
DROP FUNCTION IF EXISTS generate_reservation_number();
DROP FUNCTION IF EXISTS update_accommodation_rating();

-- 완료 메시지
SELECT 'Stay One Day 테이블 삭제가 완료되었습니다!' as message;