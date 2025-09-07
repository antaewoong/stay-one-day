-- 먼저 기본 스키마 생성 (database-schema.sql)
-- 그 다음 호스트 관리 스키마 추가 (host-schema.sql)
-- 마지막으로 샘플 데이터 삽입

-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- =============================================
-- 1. 기본 테이블 생성 (database-schema.sql 내용)
-- =============================================

-- 1. 숙소 정보 테이블
CREATE TABLE IF NOT EXISTS accommodations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  base_price INTEGER NOT NULL,
  base_guests INTEGER NOT NULL DEFAULT 2,
  additional_guest_fee INTEGER NOT NULL DEFAULT 0,
  max_guests INTEGER NOT NULL DEFAULT 10,
  check_in_time TIME DEFAULT '15:00',
  check_out_time TIME DEFAULT '23:00',
  amenities JSONB,
  options JSONB,
  images JSONB,
  rating DECIMAL(2,1) DEFAULT 0.0,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  host_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 예약 테이블
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

-- 3. 위시리스트 테이블
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  accommodation_id UUID NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, accommodation_id)
);

-- 4. 리뷰 테이블
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
-- 2. 샘플 데이터 삽입
-- =============================================

-- 샘플 숙소 데이터 삽입
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
),
(
  '힐링 포레스트 하우스',
  '숲속에 자리한 아늑한 통나무집. 자연의 소리와 함께 진정한 힐링을 경험하세요.',
  '전남 순천시',
  '숲속 독채',
  120000,
  2,
  22000,
  8,
  '15:00',
  '23:00',
  '["숲뷰", "온수 욕조", "주방", "반려견 동반", "WiFi", "난방", "취사가능"]'::jsonb,
  '[
    {"name": "펫 케어 세트", "price": 20000, "description": "반려견 전용 침구와 용품"},
    {"name": "족욕 서비스", "price": 30000, "description": "편백나무 족욕기 이용"},
    {"name": "숲속 산책 가이드", "price": 25000, "description": "전문 가이드와 함께하는 숲속 산책"}
  ]'::jsonb,
  '[
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1520637836862-4d197d17c93a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ]'::jsonb,
  4.6,
  78,
  true
),
(
  '어반 시티 로프트',
  '모던한 디자인의 도심 로프트. 비즈니스와 레저를 모두 만족시키는 프리미엄 공간입니다.',
  '서울시 강남구',
  '도심 로프트',
  190000,
  2,
  35000,
  4,
  '15:00',
  '23:00',
  '["지하철 5분", "24시간 체크인", "WiFi", "업무공간", "고급 침구", "커피머신"]'::jsonb,
  '[
    {"name": "비즈니스 패키지", "price": 40000, "description": "미팅룸 2시간 이용권"},
    {"name": "프리미엄 조식", "price": 35000, "description": "호텔급 룸서비스 조식"},
    {"name": "셔틀 서비스", "price": 25000, "description": "강남역 픽업/드롭 서비스"}
  ]'::jsonb,
  '[
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ]'::jsonb,
  4.9,
  167,
  true
)
ON CONFLICT DO NOTHING;

-- =============================================
-- 3. 인덱스 생성
-- =============================================

CREATE INDEX IF NOT EXISTS idx_accommodations_location ON accommodations(location);
CREATE INDEX IF NOT EXISTS idx_accommodations_type ON accommodations(type);
CREATE INDEX IF NOT EXISTS idx_accommodations_active ON accommodations(is_active);
CREATE INDEX IF NOT EXISTS idx_reservations_accommodation_id ON reservations(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);

-- =============================================
-- 4. Row Level Security 설정
-- =============================================

-- 숙소는 모든 사용자가 조회 가능
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Public read access for accommodations" ON accommodations
  FOR SELECT USING (is_active = true);

-- 예약은 본인 것만 조회 가능  
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can view their own reservations" ON reservations
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY IF NOT EXISTS "Users can create their own reservations" ON reservations
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own reservations" ON reservations
  FOR UPDATE USING (auth.uid()::text = user_id);

-- 위시리스트는 본인 것만
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can manage their own wishlists" ON wishlists
  FOR ALL USING (auth.uid()::text = user_id);

-- 리뷰는 모든 사용자가 조회 가능하지만 본인 것만 생성/수정
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can create their own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid()::text = user_id);