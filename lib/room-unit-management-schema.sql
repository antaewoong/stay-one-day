-- =============================================
-- 룸/유닛 관리 시스템 스키마 확장
-- =============================================

-- 1. 기존 accommodations 테이블을 상위 개념으로 사용 (건물/숙소 단위)
-- 2. 새로운 accommodation_units 테이블 추가 (개별 호실/독채 단위)

-- 숙소 유닛/룸 테이블 (개별 호실/독채 관리)
CREATE TABLE IF NOT EXISTS accommodation_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_id UUID NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
  unit_name VARCHAR(255) NOT NULL, -- '101호', '201호', '독채A', '풀빌라1' 등
  unit_type VARCHAR(100) NOT NULL, -- 'room', 'private_house', 'villa', 'studio' 등
  unit_number VARCHAR(50), -- 호수 또는 동/호 번호
  floor_number INTEGER, -- 층수 (해당되는 경우)
  
  -- 유닛별 상세 정보
  description TEXT,
  base_price INTEGER NOT NULL, -- 유닛별 기본 가격
  weekend_price INTEGER, -- 유닛별 주말 가격
  peak_season_price INTEGER, -- 유닛별 성수기 가격
  base_capacity INTEGER NOT NULL DEFAULT 2, -- 기준 인원
  max_capacity INTEGER NOT NULL DEFAULT 4, -- 최대 인원
  additional_guest_fee INTEGER DEFAULT 0, -- 추가 인원 요금
  
  -- 유닛별 시설 정보
  bedrooms INTEGER DEFAULT 1, -- 침실 수
  bathrooms INTEGER DEFAULT 1, -- 욕실 수
  area_sqm DECIMAL(8,2), -- 면적(평방미터)
  
  -- 유닛별 옵션
  amenities JSONB, -- 유닛별 편의시설
  features JSONB, -- 특별한 특징들 (발코니, 오션뷰 등)
  
  -- 관리 정보
  is_active BOOLEAN DEFAULT true,
  maintenance_notes TEXT, -- 정비/관리 메모
  last_cleaned_at TIMESTAMP WITH TIME ZONE,
  
  -- 메타 정보
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(accommodation_id, unit_number)
);

-- 유닛별 이미지 테이블
CREATE TABLE IF NOT EXISTS accommodation_unit_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES accommodation_units(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_order INTEGER DEFAULT 1,
  image_type VARCHAR(50) DEFAULT 'general', -- 'main', 'bedroom', 'bathroom', 'kitchen', 'exterior', 'general'
  caption TEXT,
  file_name VARCHAR(255),
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(unit_id, image_order)
);

-- 유닛별 가격 설정 테이블 (날짜별 개별 가격 관리)
CREATE TABLE IF NOT EXISTS accommodation_unit_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES accommodation_units(id) ON DELETE CASCADE,
  price_date DATE NOT NULL,
  price INTEGER NOT NULL,
  price_type VARCHAR(20) DEFAULT 'custom', -- 'base', 'weekend', 'peak', 'custom', 'discount'
  is_available BOOLEAN DEFAULT true,
  min_stay INTEGER DEFAULT 1, -- 최소 숙박일
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(unit_id, price_date)
);

-- 기존 reservations 테이블에 unit_id 컬럼 추가
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES accommodation_units(id) ON DELETE SET NULL;

-- 기존 reviews 테이블에 unit_id 컬럼 추가 (특정 유닛에 대한 리뷰)
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES accommodation_units(id) ON DELETE SET NULL;

-- =============================================
-- 인덱스 생성
-- =============================================

-- 유닛 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_accommodation_units_accommodation_id ON accommodation_units(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_accommodation_units_active ON accommodation_units(is_active);
CREATE INDEX IF NOT EXISTS idx_accommodation_units_type ON accommodation_units(unit_type);

-- 유닛 이미지 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_accommodation_unit_images_unit_id ON accommodation_unit_images(unit_id);
CREATE INDEX IF NOT EXISTS idx_accommodation_unit_images_type ON accommodation_unit_images(image_type);

-- 유닛 가격 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_accommodation_unit_pricing_unit_id ON accommodation_unit_pricing(unit_id);
CREATE INDEX IF NOT EXISTS idx_accommodation_unit_pricing_date ON accommodation_unit_pricing(price_date);
CREATE INDEX IF NOT EXISTS idx_accommodation_unit_pricing_available ON accommodation_unit_pricing(is_available);

-- 예약 테이블 unit_id 인덱스
CREATE INDEX IF NOT EXISTS idx_reservations_unit_id ON reservations(unit_id);

-- 리뷰 테이블 unit_id 인덱스
CREATE INDEX IF NOT EXISTS idx_reviews_unit_id ON reviews(unit_id);

-- =============================================
-- RLS (Row Level Security) 정책
-- =============================================

-- 유닛 테이블 RLS (호스트는 자신의 숙소 유닛만 접근)
ALTER TABLE accommodation_units ENABLE ROW LEVEL SECURITY;

-- 호스트는 자신의 숙소에 속한 유닛만 볼 수 있음 (accommodations 테이블의 host_id와 연결)
CREATE POLICY "Hosts can view their own accommodation units" ON accommodation_units
  FOR SELECT USING (
    accommodation_id IN (
      SELECT id FROM accommodations WHERE host_id = auth.uid()
    )
  );

-- 호스트는 자신의 숙소에 유닛을 추가할 수 있음
CREATE POLICY "Hosts can create units for their accommodations" ON accommodation_units
  FOR INSERT WITH CHECK (
    accommodation_id IN (
      SELECT id FROM accommodations WHERE host_id = auth.uid()
    )
  );

-- 호스트는 자신의 숙소 유닛을 수정할 수 있음
CREATE POLICY "Hosts can update their own accommodation units" ON accommodation_units
  FOR UPDATE USING (
    accommodation_id IN (
      SELECT id FROM accommodations WHERE host_id = auth.uid()
    )
  );

-- 유닛 이미지 테이블 RLS
ALTER TABLE accommodation_unit_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can manage their unit images" ON accommodation_unit_images
  FOR ALL USING (
    unit_id IN (
      SELECT au.id FROM accommodation_units au
      JOIN accommodations a ON au.accommodation_id = a.id
      WHERE a.host_id = auth.uid()
    )
  );

-- 유닛 가격 테이블 RLS
ALTER TABLE accommodation_unit_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can manage their unit pricing" ON accommodation_unit_pricing
  FOR ALL USING (
    unit_id IN (
      SELECT au.id FROM accommodation_units au
      JOIN accommodations a ON au.accommodation_id = a.id
      WHERE a.host_id = auth.uid()
    )
  );

-- =============================================
-- 트리거 설정
-- =============================================

-- updated_at 트리거들
CREATE TRIGGER update_accommodation_units_updated_at BEFORE UPDATE ON accommodation_units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 뷰 생성 (편의를 위한)
-- =============================================

-- 숙소별 유닛 현황 뷰
CREATE OR REPLACE VIEW accommodation_units_summary AS
SELECT 
  a.id as accommodation_id,
  a.name as accommodation_name,
  a.host_id,
  COUNT(au.id) as total_units,
  COUNT(CASE WHEN au.is_active = true THEN 1 END) as active_units,
  MIN(au.base_price) as min_price,
  MAX(au.base_price) as max_price,
  SUM(au.max_capacity) as total_capacity
FROM accommodations a
LEFT JOIN accommodation_units au ON a.id = au.accommodation_id
GROUP BY a.id, a.name, a.host_id;

-- 날짜별 유닛 예약 현황 뷰
CREATE OR REPLACE VIEW unit_availability_calendar AS
SELECT 
  au.id as unit_id,
  au.unit_name,
  au.accommodation_id,
  d.date,
  CASE 
    WHEN r.id IS NOT NULL THEN false 
    WHEN aup.is_available = false THEN false
    ELSE true 
  END as is_available,
  COALESCE(aup.price, au.base_price) as price
FROM accommodation_units au
CROSS JOIN generate_series(
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '365 days',
  INTERVAL '1 day'
) as d(date)
LEFT JOIN reservations r ON au.id = r.unit_id AND d.date = r.reservation_date
LEFT JOIN accommodation_unit_pricing aup ON au.id = aup.unit_id AND d.date = aup.price_date
WHERE au.is_active = true;

-- =============================================
-- 샘플 데이터 (테스트용)
-- =============================================

-- 기존 accommodations에 host_id 컬럼이 있다고 가정하고 샘플 유닛 데이터
-- 실제 운영시에는 이 부분 제거
/*
INSERT INTO accommodation_units (accommodation_id, unit_name, unit_type, unit_number, base_price, weekend_price, peak_season_price, base_capacity, max_capacity, bedrooms, bathrooms, area_sqm, amenities, features) VALUES
-- 풀빌라의 경우 (독립된 빌라들)
('accommodation-uuid-1', '풀빌라 A동', 'villa', 'A', 500000, 600000, 700000, 4, 8, 2, 2, 85.5, '["전용 수영장", "바베큐 시설", "주차장", "와이파이"]', '["프라이빗 풀", "정원", "바베큐 데크"]'),
('accommodation-uuid-1', '풀빌라 B동', 'villa', 'B', 500000, 600000, 700000, 4, 8, 2, 2, 85.5, '["전용 수영장", "바베큐 시설", "주차장", "와이파이"]', '["프라이빗 풀", "정원", "바베큐 데크"]'),

-- 펜션의 경우 (개별 객실들)
('accommodation-uuid-2', '101호 (오션뷰)', 'room', '101', 150000, 180000, 220000, 2, 4, 1, 1, 45.0, '["에어컨", "TV", "냉장고", "와이파이"]', '["바다전망", "발코니"]'),
('accommodation-uuid-2', '102호 (마운틴뷰)', 'room', '102', 130000, 160000, 200000, 2, 4, 1, 1, 42.0, '["에어컨", "TV", "냉장고", "와이파이"]', '["산전망", "발코니"]'),
('accommodation-uuid-2', '201호 (프리미엄)', 'room', '201', 200000, 240000, 280000, 2, 6, 2, 1, 60.0, '["에어컨", "TV", "냉장고", "와이파이", "커피머신"]', '["넓은 거실", "킹사이즈 침대"]');
*/