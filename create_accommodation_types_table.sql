-- 숙소 유형 다대다 관계를 위한 테이블 생성

-- 1. accommodation_types 테이블 생성
CREATE TABLE IF NOT EXISTS accommodation_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  accommodation_id UUID NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
  type_name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 중복 방지를 위한 유니크 제약
  UNIQUE(accommodation_id, type_name)
);

-- 2. 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_accommodation_types_accommodation_id ON accommodation_types(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_accommodation_types_type_name ON accommodation_types(type_name);

-- 3. RLS (Row Level Security) 정책 활성화
ALTER TABLE accommodation_types ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성 (모든 사용자가 읽을 수 있도록)
CREATE POLICY "Anyone can view accommodation types" ON accommodation_types
  FOR SELECT USING (true);

-- 5. 관리자 및 호스트가 삽입/업데이트/삭제 가능하도록 정책 생성
CREATE POLICY "Authenticated users can manage accommodation types" ON accommodation_types
  FOR ALL USING (auth.role() = 'authenticated');

-- 6. 기존 데이터 마이그레이션 (accommodation_type 필드에서 데이터 복사)
INSERT INTO accommodation_types (accommodation_id, type_name)
SELECT id, accommodation_type 
FROM accommodations 
WHERE accommodation_type IS NOT NULL
ON CONFLICT (accommodation_id, type_name) DO NOTHING;

-- 7. 결과 확인
SELECT 
  a.name,
  a.accommodation_type,
  array_agg(at.type_name) as types
FROM accommodations a
LEFT JOIN accommodation_types at ON a.id = at.accommodation_id
GROUP BY a.id, a.name, a.accommodation_type
ORDER BY a.name;