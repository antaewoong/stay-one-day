-- =============================================
-- Stay One Day 예약 시스템 데이터베이스 스키마
-- =============================================

-- 1. 숙소 정보 테이블
CREATE TABLE IF NOT EXISTS accommodations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- '풀빌라', '독채형', '펜션' 등
  base_price INTEGER NOT NULL, -- 기본 가격 (당일 기준)
  base_guests INTEGER NOT NULL DEFAULT 2, -- 기본 인원수
  additional_guest_fee INTEGER NOT NULL DEFAULT 0, -- 추가 인원 요금
  max_guests INTEGER NOT NULL DEFAULT 10, -- 최대 인원수
  check_in_time TIME DEFAULT '15:00', -- 입장 시간
  check_out_time TIME DEFAULT '23:00', -- 퇴장 시간
  amenities JSONB, -- 편의시설 리스트
  options JSONB, -- 추가 옵션들 [{"name": "바베큐", "price": 20000}, ...]
  images JSONB, -- 이미지 URL 리스트
  rating DECIMAL(2,1) DEFAULT 0.0,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 예약 테이블
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accommodation_id UUID NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
  reservation_date DATE NOT NULL, -- 당일 이용 날짜
  guest_count INTEGER NOT NULL,
  selected_options JSONB, -- 선택된 옵션들
  base_price INTEGER NOT NULL, -- 기본 가격
  additional_guest_cost INTEGER NOT NULL DEFAULT 0, -- 추가 인원 비용
  options_cost INTEGER NOT NULL DEFAULT 0, -- 옵션 비용
  total_price INTEGER NOT NULL, -- 총 가격
  guest_name VARCHAR(100) NOT NULL, -- 예약자 이름
  guest_phone VARCHAR(20) NOT NULL, -- 예약자 전화번호
  guest_email VARCHAR(255), -- 예약자 이메일
  special_requests TEXT, -- 특별 요청사항
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
  payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'refunded'
  payment_method VARCHAR(50), -- 결제 수단
  payment_id VARCHAR(255), -- 토스페이먼트 결제 ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 위시리스트 테이블
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accommodation_id UUID NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, accommodation_id)
);

-- 4. 리뷰 테이블
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accommodation_id UUID NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  images JSONB, -- 리뷰 이미지들
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, reservation_id)
);

-- 5. 관리자 설정 테이블
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 인덱스 생성
-- =============================================

-- 예약 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_accommodation_id ON reservations(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- 숙소 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_accommodations_location ON accommodations(location);
CREATE INDEX IF NOT EXISTS idx_accommodations_type ON accommodations(type);
CREATE INDEX IF NOT EXISTS idx_accommodations_active ON accommodations(is_active);

-- 위시리스트 인덱스
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);

-- 리뷰 인덱스
CREATE INDEX IF NOT EXISTS idx_reviews_accommodation_id ON reviews(accommodation_id);

-- =============================================
-- RLS (Row Level Security) 정책
-- =============================================

-- 예약 테이블 RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 예약만 볼 수 있음
CREATE POLICY "Users can view their own reservations" ON reservations
  FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 예약만 생성할 수 있음
CREATE POLICY "Users can create their own reservations" ON reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 예약만 수정할 수 있음 (취소 등)
CREATE POLICY "Users can update their own reservations" ON reservations
  FOR UPDATE USING (auth.uid() = user_id);

-- 위시리스트 테이블 RLS
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own wishlists" ON wishlists
  FOR ALL USING (auth.uid() = user_id);

-- 리뷰 테이블 RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all reviews" ON reviews
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create their own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 트리거 함수들
-- =============================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거들
CREATE TRIGGER update_accommodations_updated_at BEFORE UPDATE ON accommodations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON admin_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 기본 데이터 삽입
-- =============================================

-- 관리자 설정 기본값들
INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
('search_suggestions', '["풀빌라", "청주", "세종", "대전", "천안", "애견풀빌라"]', '검색 추천어 목록'),
('hero_slides', '[]', '메인 페이지 히어로 슬라이드 설정'),
('site_config', '{"commission_rate": 0.05, "service_name": "Stay One Day"}', '사이트 기본 설정')
ON CONFLICT (setting_key) DO NOTHING;