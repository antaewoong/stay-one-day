-- 히어로 슬라이드 테이블
CREATE TABLE IF NOT EXISTS hero_slides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  cta_text TEXT DEFAULT '지금 예약하기',
  badge TEXT DEFAULT '추천',
  stats JSONB DEFAULT '{}',
  slide_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 메인페이지 섹션 테이블
CREATE TABLE IF NOT EXISTS main_page_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  accommodation_ids TEXT[] DEFAULT '{}',
  max_items INTEGER DEFAULT 6,
  active BOOLEAN DEFAULT true,
  auto_fill_by_category BOOLEAN DEFAULT false,
  category_filter TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 섹션들 삽입
INSERT INTO main_page_sections (section_id, name, title, subtitle) 
VALUES 
  ('recommended', 'recommended', '✨ 이번 주 추천 스테이', '특별한 휴식을 원한다면, 지금 바로 예약하세요'),
  ('poolvilla', 'poolvilla', '🏊‍♀️ 프리미엄 풀빌라', '프라이빗 수영장과 함께하는 럭셔리 스테이'),
  ('private', 'private', '🏡 독채형 펜션', '온전히 나만의 공간에서 누리는 특별한 시간')
ON CONFLICT (section_id) DO NOTHING;

-- RLS 정책 활성화
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE main_page_sections ENABLE ROW LEVEL SECURITY;

-- 관리자만 수정 가능, 모든 사용자가 읽기 가능
CREATE POLICY "Everyone can view hero slides" ON hero_slides FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage hero slides" ON hero_slides FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Everyone can view sections" ON main_page_sections FOR SELECT USING (true);  
CREATE POLICY "Authenticated users can manage sections" ON main_page_sections FOR ALL USING (auth.role() = 'authenticated');