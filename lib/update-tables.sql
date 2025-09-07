-- 기존 테이블에 부족한 컬럼들 추가 및 데이터 삽입

-- =============================================
-- 1. accommodations 테이블 컬럼 추가 (없는 것만)
-- =============================================

-- 기본 컬럼들이 없다면 추가
ALTER TABLE accommodations 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS type VARCHAR(100),
ADD COLUMN IF NOT EXISTS base_price INTEGER,
ADD COLUMN IF NOT EXISTS base_guests INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS additional_guest_fee INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_guests INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS check_in_time TIME DEFAULT '15:00',
ADD COLUMN IF NOT EXISTS check_out_time TIME DEFAULT '23:00',
ADD COLUMN IF NOT EXISTS amenities JSONB,
ADD COLUMN IF NOT EXISTS options JSONB,
ADD COLUMN IF NOT EXISTS images JSONB,
ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS host_id UUID,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =============================================
-- 2. reservations 테이블 생성 (없다면)
-- =============================================

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  accommodation_id UUID NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
  reservation_date DATE NOT NULL,
  guest_count INTEGER NOT NULL,
  selected_options JSONB,
  base_price INTEGER NOT NULL,
  additional_guest_cost INTEGER NOT NULL DEFAULT 0,
  options_cost INTEGER NOT NULL DEFAULT 0,
  total_price INTEGER NOT NULL,
  guest_name VARCHAR(100) NOT NULL,
  guest_phone VARCHAR(20) NOT NULL,
  guest_email VARCHAR(255),
  special_requests TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  payment_status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(50),
  payment_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. wishlists 테이블 생성 (없다면)
-- =============================================

CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  accommodation_id UUID NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, accommodation_id)
);

-- =============================================
-- 4. reviews 테이블 생성 (없다면)
-- =============================================

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  accommodation_id UUID NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  images JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, reservation_id)
);

-- =============================================
-- 5. 인덱스 추가
-- =============================================

CREATE INDEX IF NOT EXISTS idx_accommodations_location ON accommodations(location);
CREATE INDEX IF NOT EXISTS idx_accommodations_type ON accommodations(type);
CREATE INDEX IF NOT EXISTS idx_accommodations_active ON accommodations(is_active);
CREATE INDEX IF NOT EXISTS idx_reservations_accommodation_id ON reservations(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);

-- =============================================
-- 6. RLS 정책 설정
-- =============================================

-- accommodations 테이블 RLS
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "accommodations_select_policy" ON accommodations;
CREATE POLICY "accommodations_select_policy" ON accommodations
  FOR SELECT USING (is_active = true);

-- reservations 테이블 RLS  
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reservations_policy" ON reservations;
CREATE POLICY "reservations_policy" ON reservations
  FOR ALL USING (auth.uid()::text = user_id);

-- wishlists 테이블 RLS
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wishlists_policy" ON wishlists;
CREATE POLICY "wishlists_policy" ON wishlists
  FOR ALL USING (auth.uid()::text = user_id);

-- reviews 테이블 RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews_select_policy" ON reviews;
DROP POLICY IF EXISTS "reviews_insert_policy" ON reviews;
DROP POLICY IF EXISTS "reviews_update_policy" ON reviews;

CREATE POLICY "reviews_select_policy" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_policy" ON reviews FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "reviews_update_policy" ON reviews FOR UPDATE USING (auth.uid()::text = user_id);

-- =============================================
-- 7. 기존 데이터 정리 후 샘플 데이터 삽입
-- =============================================

-- 기존 샘플 데이터 삭제
DELETE FROM reviews WHERE accommodation_id IN (SELECT id FROM accommodations WHERE name LIKE '%구공스테이%' OR name LIKE '%스카이뷰%');
DELETE FROM reservations WHERE accommodation_id IN (SELECT id FROM accommodations WHERE name LIKE '%구공스테이%' OR name LIKE '%스카이뷰%');
DELETE FROM accommodations WHERE name LIKE '%구공스테이%' OR name LIKE '%스카이뷰%' OR name LIKE '%오션뷰%';

-- 새 샘플 데이터 삽입
INSERT INTO accommodations (
  name, description, location, type, base_price, base_guests, additional_guest_fee, max_guests,
  check_in_time, check_out_time, amenities, options, images, rating, review_count, is_active
) VALUES 
(
  '구공스테이 청주 메인홀',
  '프라이빗한 풀빌라에서 특별한 하루를 만끽하세요. 독립된 수영장과 바베큐 시설을 갖춘 럭셔리 공간입니다.',
  '충북 청주시 청원구',
  '프라이빗 풀빌라',
  180000,
  4,
  25000,
  20,
  '15:00',
  '23:00',
  '["프라이빗 풀", "바베큐 시설", "주차 5대", "WiFi", "냉난방", "취사가능", "세탁기", "건조기"]'::jsonb,
  '[
    {"name": "바베큐 세트", "price": 30000, "description": "고기와 채소, 숯 포함"},
    {"name": "수영장 히터", "price": 50000, "description": "겨울철 온수 풀 이용"},
    {"name": "추가 침구", "price": 15000, "description": "이불과 베개 세트"},
    {"name": "파티 장식", "price": 25000, "description": "생일파티, 기념일 장식"}
  ]'::jsonb,
  '[
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ]'::jsonb,
  4.9,
  147,
  true
),
(
  '스카이뷰 루프탑 펜션',
  '도심 속에서 만나는 특별한 루프탑 공간. 탁 트인 도시 전망과 함께 프라이빗한 시간을 보내세요.',
  '경기도 가평군',
  '루프탑 독채',
  160000,
  3,
  20000,
  12,
  '15:00',
  '23:00',
  '["루프탑 테라스", "도시뷰", "주방시설", "주차장", "WiFi", "에어컨", "취사가능"]'::jsonb,
  '[
    {"name": "루프탑 BBQ", "price": 35000, "description": "루프탑에서 즐기는 바베큐"},
    {"name": "선베드 이용", "price": 20000, "description": "루프탑 선베드 추가"},
    {"name": "조식 서비스", "price": 40000, "description": "한식 조식 배달"}
  ]'::jsonb,
  '[
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ]'::jsonb,
  4.8,
  89,
  true
),
(
  '오션뷰 글램핑',
  '바다가 보이는 특별한 글램핑장. 자연과 함께하는 힐링 타임을 만나보세요.',
  '강원도 양양군',
  '해변 글램핑',
  140000,
  2,
  30000,
  6,
  '15:00',
  '23:00',
  '["오션뷰", "캠프파이어", "바베큐", "샤워시설", "WiFi", "냉난방"]'::jsonb,
  '[
    {"name": "캠프파이어", "price": 25000, "description": "장작과 마시멜로 포함"},
    {"name": "조개구이 세트", "price": 45000, "description": "신선한 해산물 세트"},
    {"name": "서핑보드 대여", "price": 30000, "description": "1일 서핑보드 대여"}
  ]'::jsonb,
  '[
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ]'::jsonb,
  4.7,
  234,
  true
);

-- =============================================
-- 8. 결과 확인
-- =============================================

SELECT 
  id, 
  name, 
  location, 
  type,
  base_price,
  rating
FROM accommodations 
ORDER BY name;