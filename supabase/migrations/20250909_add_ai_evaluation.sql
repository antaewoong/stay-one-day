-- AI 평가 관련 컬럼 추가
ALTER TABLE influencers 
ADD COLUMN ai_evaluation JSONB DEFAULT '{}',
ADD COLUMN ai_evaluation_date TIMESTAMP WITH TIME ZONE;

-- AI 평가 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_influencers_ai_evaluation ON influencers USING GIN (ai_evaluation);

-- 인플루언서 공지사항 테이블 생성 (관리자가 작성하는 협업 공지)
CREATE TABLE IF NOT EXISTS influencer_notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  notice_type VARCHAR(20) DEFAULT 'collaboration' CHECK (notice_type IN ('collaboration', 'announcement', 'urgent')),
  target_month INTEGER, -- 협업 대상 월 (1-12)
  target_year INTEGER, -- 협업 대상 년도
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID, -- 관리자 ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  view_count INTEGER DEFAULT 0
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_influencer_notices_active ON influencer_notices (is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_influencer_notices_date ON influencer_notices (target_year, target_month);

-- 인플루언서 공지 조회 로그 (누가 언제 봤는지 추적)
CREATE TABLE IF NOT EXISTS influencer_notice_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notice_id UUID REFERENCES influencer_notices(id) ON DELETE CASCADE,
  influencer_id UUID REFERENCES influencers(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(notice_id, influencer_id)
);

-- 트리거 함수: 조회수 업데이트
CREATE OR REPLACE FUNCTION update_notice_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE influencer_notices 
  SET view_count = (
    SELECT COUNT(*) 
    FROM influencer_notice_views 
    WHERE notice_id = NEW.notice_id
  )
  WHERE id = NEW.notice_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_notice_view_count ON influencer_notice_views;
CREATE TRIGGER trigger_update_notice_view_count
  AFTER INSERT ON influencer_notice_views
  FOR EACH ROW
  EXECUTE FUNCTION update_notice_view_count();

-- 샘플 공지사항 생성
INSERT INTO influencer_notices (title, content, notice_type, target_month, target_year, is_active) VALUES
('2025년 1월 숙박 협업 신청 안내', 
'안녕하세요, Stay One Day 인플루언서 여러분!

2025년 1월 숙박 협업을 다음과 같이 진행합니다:

🏨 **협업 대상 숙소**
- 구공스테이 청주 풀빌라
- 스카이뷰 루프탑 펜션  
- 힐링 포레스트 독채
- 마담아네뜨 양양점

📅 **신청 기간**: 2024년 12월 20일 ~ 12월 31일
🎯 **협업 일정**: 2025년 1월 중 (호스트와 협의)
💰 **협업 조건**: 1박 무료 숙박 + 리뷰 작성

**신청 방법**:
1. 대시보드에서 "협업 신청" 클릭
2. 원하는 숙소와 날짜 선택
3. 협업 제안서 작성 후 제출

많은 관심과 참여 부탁드립니다! 🙏', 
'collaboration', 1, 2025, true);

COMMENT ON TABLE influencer_notices IS '인플루언서 대상 공지사항 (협업 안내 등)';
COMMENT ON TABLE influencer_notice_views IS '인플루언서 공지사항 조회 로그';