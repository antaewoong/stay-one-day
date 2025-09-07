-- accommodations 테이블에 accommodation_types 배열 컬럼 추가
ALTER TABLE accommodations ADD COLUMN accommodation_types TEXT[] DEFAULT '{}';

-- 기존 accommodation_type 값을 accommodation_types 배열로 마이그레이션
UPDATE accommodations 
SET accommodation_types = ARRAY[accommodation_type]
WHERE accommodation_type IS NOT NULL;

-- 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_accommodations_types ON accommodations USING gin(accommodation_types);

-- 확인 쿼리
SELECT id, name, accommodation_type, accommodation_types FROM accommodations LIMIT 5;