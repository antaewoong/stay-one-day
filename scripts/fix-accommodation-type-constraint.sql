-- accommodation_type 체크 제약조건 확인 및 수정

-- 1. 기존 제약조건 확인
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'accommodations'::regclass 
AND conname LIKE '%accommodation_type%';

-- 2. 기존 제약조건 삭제 (있다면)
ALTER TABLE accommodations DROP CONSTRAINT IF EXISTS accommodations_accommodation_type_check;

-- 3. 새로운 제약조건 추가 (더 많은 타입 허용)
ALTER TABLE accommodations 
ADD CONSTRAINT accommodations_accommodation_type_check 
CHECK (accommodation_type IN ('풀빌라', '독채', '펜션', '루프탑', '글램핑', '캠핑', '게스트하우스', '모텔', '호텔', '키즈', '기타'));

-- 4. 확인
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'accommodations'::regclass 
AND conname LIKE '%accommodation_type%';