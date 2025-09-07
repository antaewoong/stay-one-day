-- 히어로 텍스트 관리 테이블 생성
CREATE TABLE IF NOT EXISTS hero_texts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  english_phrase TEXT, -- 감성 영문 문구
  main_text TEXT NOT NULL, -- 메인 한글 문구  
  sub_text TEXT, -- 서브 텍스트 (할인/이벤트)
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hero_texts_updated_at
    BEFORE UPDATE ON hero_texts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 기본 데이터 삽입
INSERT INTO hero_texts (english_phrase, main_text, sub_text, display_order, is_active) VALUES
('Escape the Ordinary', '일상에서 벗어나, 특별한 공간에서', '첫 예약 시 10% 할인 혜택', 1, true),
('Healing with Nature', '자연과 함께하는 힐링 타임', '새로운 숙소 오픈 기념 이벤트', 2, true),
('Precious Moments Together', '소중한 사람과 만드는 추억', '커플 패키지 30% 할인', 3, true),
('Perfect Rest Awaits', '완벽한 휴식이 기다리는 곳', '주말 예약 시 조식 서비스 무료', 4, true),
('Your Private Moment', '당신만의 프라이빗한 순간', '장기 숙박 시 추가 할인 혜택', 5, true);

-- 인덱스 생성
CREATE INDEX idx_hero_texts_active_order ON hero_texts (is_active, display_order);

COMMENT ON TABLE hero_texts IS '메인 페이지 히어로 섹션의 텍스트 관리 테이블';
COMMENT ON COLUMN hero_texts.english_phrase IS '감성 영문 문구';
COMMENT ON COLUMN hero_texts.main_text IS '메인 한글 감성 문구';
COMMENT ON COLUMN hero_texts.sub_text IS '서브 텍스트 (할인, 이벤트 정보 등)';
COMMENT ON COLUMN hero_texts.display_order IS '표시 순서';
COMMENT ON COLUMN hero_texts.is_active IS '활성화 여부';