-- 별점/리뷰 시스템 테이블 생성 SQL
-- Supabase 대시보드 SQL 편집기에서 실행

-- 1. 리뷰 테이블
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- 실제 사용자 시스템이 있다면 users 테이블과 연결
  user_name TEXT NOT NULL, -- 임시로 사용자명 저장
  user_email TEXT, -- 임시로 이메일 저장
  accommodation_id UUID REFERENCES accommodations(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id), -- 예약과 연결
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL,
  images TEXT[], -- 리뷰 이미지 URLs
  helpful_count INTEGER DEFAULT 0, -- 도움이 됨 수
  response TEXT, -- 호스트 답변
  response_date TIMESTAMPTZ, -- 호스트 답변 날짜
  is_verified BOOLEAN DEFAULT false, -- 실제 예약 후 작성 여부
  is_visible BOOLEAN DEFAULT true, -- 노출 여부
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 리뷰 카테고리별 평점 테이블
CREATE TABLE IF NOT EXISTS review_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'cleanliness', 'location', 'value', 'amenities', 'communication', 'checkin'
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 숙소별 평점 통계 테이블 (성능 최적화용)
CREATE TABLE IF NOT EXISTS accommodation_ratings (
  accommodation_id UUID PRIMARY KEY REFERENCES accommodations(id) ON DELETE CASCADE,
  total_reviews INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00, -- 전체 평균 별점
  cleanliness_avg DECIMAL(3,2) DEFAULT 0.00,
  location_avg DECIMAL(3,2) DEFAULT 0.00,
  value_avg DECIMAL(3,2) DEFAULT 0.00,
  amenities_avg DECIMAL(3,2) DEFAULT 0.00,
  communication_avg DECIMAL(3,2) DEFAULT 0.00,
  checkin_avg DECIMAL(3,2) DEFAULT 0.00,
  rating_5_count INTEGER DEFAULT 0,
  rating_4_count INTEGER DEFAULT 0,
  rating_3_count INTEGER DEFAULT 0,
  rating_2_count INTEGER DEFAULT 0,
  rating_1_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 리뷰 도움이 됨 테이블
CREATE TABLE IF NOT EXISTS review_helpful (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID, -- 도움이 됨을 클릭한 사용자
  user_ip TEXT, -- 임시로 IP로 중복 방지
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_ip) -- IP당 한 번만 도움이 됨 클릭 가능
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_reviews_accommodation_id ON reviews(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_is_visible ON reviews(is_visible);
CREATE INDEX IF NOT EXISTS idx_review_ratings_review_id ON review_ratings(review_id);
CREATE INDEX IF NOT EXISTS idx_review_ratings_category ON review_ratings(category);

-- RLS 정책 설정
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodation_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 리뷰를 볼 수 있도록 (읽기 전용)
CREATE POLICY "Anyone can read reviews" ON reviews FOR SELECT USING (is_visible = true);
CREATE POLICY "Anyone can read review_ratings" ON review_ratings FOR SELECT USING (true);
CREATE POLICY "Anyone can read accommodation_ratings" ON accommodation_ratings FOR SELECT USING (true);

-- 서비스 역할은 모든 작업 가능
CREATE POLICY "Service role full access to reviews" ON reviews FOR ALL USING (true);
CREATE POLICY "Service role full access to review_ratings" ON review_ratings FOR ALL USING (true);
CREATE POLICY "Service role full access to accommodation_ratings" ON accommodation_ratings FOR ALL USING (true);
CREATE POLICY "Service role full access to review_helpful" ON review_helpful FOR ALL USING (true);

-- 평점 통계 업데이트 함수
CREATE OR REPLACE FUNCTION update_accommodation_ratings(acc_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO accommodation_ratings (accommodation_id)
  VALUES (acc_id)
  ON CONFLICT (accommodation_id) DO NOTHING;
  
  UPDATE accommodation_ratings 
  SET 
    total_reviews = (
      SELECT COUNT(*) FROM reviews 
      WHERE accommodation_id = acc_id AND is_visible = true
    ),
    average_rating = (
      SELECT ROUND(AVG(rating::numeric), 2) FROM reviews 
      WHERE accommodation_id = acc_id AND is_visible = true
    ),
    cleanliness_avg = (
      SELECT ROUND(AVG(rr.rating::numeric), 2) FROM review_ratings rr 
      JOIN reviews r ON r.id = rr.review_id 
      WHERE r.accommodation_id = acc_id AND r.is_visible = true AND rr.category = 'cleanliness'
    ),
    location_avg = (
      SELECT ROUND(AVG(rr.rating::numeric), 2) FROM review_ratings rr 
      JOIN reviews r ON r.id = rr.review_id 
      WHERE r.accommodation_id = acc_id AND r.is_visible = true AND rr.category = 'location'
    ),
    value_avg = (
      SELECT ROUND(AVG(rr.rating::numeric), 2) FROM review_ratings rr 
      JOIN reviews r ON r.id = rr.review_id 
      WHERE r.accommodation_id = acc_id AND r.is_visible = true AND rr.category = 'value'
    ),
    amenities_avg = (
      SELECT ROUND(AVG(rr.rating::numeric), 2) FROM review_ratings rr 
      JOIN reviews r ON r.id = rr.review_id 
      WHERE r.accommodation_id = acc_id AND r.is_visible = true AND rr.category = 'amenities'
    ),
    communication_avg = (
      SELECT ROUND(AVG(rr.rating::numeric), 2) FROM review_ratings rr 
      JOIN reviews r ON r.id = rr.review_id 
      WHERE r.accommodation_id = acc_id AND r.is_visible = true AND rr.category = 'communication'
    ),
    checkin_avg = (
      SELECT ROUND(AVG(rr.rating::numeric), 2) FROM review_ratings rr 
      JOIN reviews r ON r.id = rr.review_id 
      WHERE r.accommodation_id = acc_id AND r.is_visible = true AND rr.category = 'checkin'
    ),
    rating_5_count = (
      SELECT COUNT(*) FROM reviews 
      WHERE accommodation_id = acc_id AND is_visible = true AND rating = 5
    ),
    rating_4_count = (
      SELECT COUNT(*) FROM reviews 
      WHERE accommodation_id = acc_id AND is_visible = true AND rating = 4
    ),
    rating_3_count = (
      SELECT COUNT(*) FROM reviews 
      WHERE accommodation_id = acc_id AND is_visible = true AND rating = 3
    ),
    rating_2_count = (
      SELECT COUNT(*) FROM reviews 
      WHERE accommodation_id = acc_id AND is_visible = true AND rating = 2
    ),
    rating_1_count = (
      SELECT COUNT(*) FROM reviews 
      WHERE accommodation_id = acc_id AND is_visible = true AND rating = 1
    ),
    updated_at = NOW()
  WHERE accommodation_id = acc_id;
END;
$$ LANGUAGE plpgsql;

-- 트리거: 리뷰 추가/수정/삭제시 통계 자동 업데이트
CREATE OR REPLACE FUNCTION trigger_update_accommodation_ratings()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM update_accommodation_ratings(NEW.accommodation_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_accommodation_ratings(OLD.accommodation_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_accommodation_ratings();