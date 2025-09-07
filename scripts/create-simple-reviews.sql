-- 기존 reviews 테이블과 호환되는 새로운 리뷰 시스템
-- Supabase 대시보드 SQL 편집기에서 실행

-- 기존 reviews 테이블에 필요한 컬럼들이 있는지 확인하고 없으면 추가
-- (기존 테이블 구조를 유지하면서 필요한 컬럼만 추가)

-- 1. reviews 테이블에 컬럼 추가 (존재하지 않는 경우에만)
DO $$
BEGIN
    -- user_name 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'user_name') THEN
        ALTER TABLE reviews ADD COLUMN user_name TEXT;
    END IF;
    
    -- accommodation_id 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'accommodation_id') THEN
        ALTER TABLE reviews ADD COLUMN accommodation_id UUID REFERENCES accommodations(id);
    END IF;
    
    -- rating 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'rating') THEN
        ALTER TABLE reviews ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);
    END IF;
    
    -- content 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'content') THEN
        ALTER TABLE reviews ADD COLUMN content TEXT;
    END IF;
    
    -- user_email 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'user_email') THEN
        ALTER TABLE reviews ADD COLUMN user_email TEXT;
    END IF;
    
    -- is_verified 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'is_verified') THEN
        ALTER TABLE reviews ADD COLUMN is_verified BOOLEAN DEFAULT false;
    END IF;
    
    -- host_response 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'host_response') THEN
        ALTER TABLE reviews ADD COLUMN host_response TEXT;
    END IF;
    
    -- host_response_date 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'host_response_date') THEN
        ALTER TABLE reviews ADD COLUMN host_response_date TIMESTAMPTZ;
    END IF;
    
    -- helpful_count 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'helpful_count') THEN
        ALTER TABLE reviews ADD COLUMN helpful_count INTEGER DEFAULT 0;
    END IF;
    
    -- is_visible 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'is_visible') THEN
        ALTER TABLE reviews ADD COLUMN is_visible BOOLEAN DEFAULT true;
    END IF;

    RAISE NOTICE 'Reviews table columns updated successfully';
END
$$;

-- 2. 숙소별 평점 통계 뷰 생성
CREATE OR REPLACE VIEW accommodation_stats AS
SELECT 
    a.id,
    a.name,
    COUNT(r.id) as review_count,
    COALESCE(ROUND(AVG(r.rating::numeric), 1), 0) as average_rating,
    COUNT(CASE WHEN r.rating = 5 THEN 1 END) as rating_5_count,
    COUNT(CASE WHEN r.rating = 4 THEN 1 END) as rating_4_count,
    COUNT(CASE WHEN r.rating = 3 THEN 1 END) as rating_3_count,
    COUNT(CASE WHEN r.rating = 2 THEN 1 END) as rating_2_count,
    COUNT(CASE WHEN r.rating = 1 THEN 1 END) as rating_1_count
FROM accommodations a
LEFT JOIN reviews r ON a.id = r.accommodation_id AND r.is_visible = true
GROUP BY a.id, a.name;

-- 3. RLS 정책 설정 (기존 정책이 없다면)
DO $$
BEGIN
    -- reviews 테이블 RLS 활성화
    ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
    
    -- 정책이 존재하지 않으면 생성
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reviews' AND policyname = 'Anyone can read visible reviews'
    ) THEN
        CREATE POLICY "Anyone can read visible reviews" ON reviews 
        FOR SELECT USING (is_visible = true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reviews' AND policyname = 'Service role full access'
    ) THEN
        CREATE POLICY "Service role full access" ON reviews 
        FOR ALL USING (true);
    END IF;
    
    RAISE NOTICE 'RLS policies updated successfully';
END
$$;

-- 4. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_reviews_accommodation_id ON reviews(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_is_visible ON reviews(is_visible);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

-- 5. 호스트 답글 업데이트 함수
CREATE OR REPLACE FUNCTION update_host_response(
    review_id UUID,
    response_text TEXT,
    host_id UUID DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
    UPDATE reviews 
    SET 
        host_response = response_text,
        host_response_date = NOW(),
        updated_at = NOW()
    WHERE id = review_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 6. 리뷰 가시성 토글 함수 (관리자/호스트용)
CREATE OR REPLACE FUNCTION toggle_review_visibility(
    review_id UUID,
    new_visibility BOOLEAN
)
RETURNS boolean AS $$
BEGIN
    UPDATE reviews 
    SET 
        is_visible = new_visibility,
        updated_at = NOW()
    WHERE id = review_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;