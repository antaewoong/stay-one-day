-- 공지사항 테이블 생성
CREATE TABLE IF NOT EXISTS notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT,
  author VARCHAR(100) NOT NULL DEFAULT 'Stay One Day 관리자',
  views INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  is_important BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- 정책 생성 (모든 사용자가 읽기 가능, 관리자만 쓰기 가능)
CREATE POLICY "Anyone can view published notices" ON notices
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage notices" ON notices
  FOR ALL USING (auth.role() = 'service_role');

-- 초기 데이터 삽입
INSERT INTO notices (title, content, author, views, is_important, created_at, updated_at) VALUES 
  ('Stay One Day 플랫폼 오픈 안내', 'Stay One Day 서비스가 정식으로 오픈되었습니다. 많은 이용 부탁드립니다.', 'Stay One Day 관리자', 45, true, '2025-01-15 09:00:00+09', '2025-01-15 09:00:00+09'),
  ('신규 숙소 등록 프로세스 변경 안내', '호스트 숙소 등록 절차가 간소화되었습니다.', 'Stay One Day 관리자', 28, false, '2025-02-01 10:00:00+09', '2025-02-01 10:00:00+09'),
  ('[공지] 2월 프로모션 이벤트', '2월 한 달간 모든 숙소 10% 할인 이벤트를 진행합니다.', 'Stay One Day 관리자', 67, true, '2025-02-01 14:00:00+09', '2025-02-01 14:00:00+09'),
  ('정산 주기 변경 안내', '호스트 정산 주기가 월 1회에서 주 1회로 변경됩니다.', 'Stay One Day 관리자', 34, false, '2025-02-15 11:00:00+09', '2025-02-15 11:00:00+09'),
  ('[공지] 서비스 점검 안내', '2월 28일 02:00~06:00 서비스 점검이 진행됩니다.', 'Stay One Day 관리자', 89, true, '2025-02-25 16:00:00+09', '2025-02-25 16:00:00+09');

-- 뷰 업데이트 함수
CREATE OR REPLACE FUNCTION increment_notice_views(notice_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE notices
  SET views = views + 1,
      updated_at = NOW()
  WHERE id = notice_id;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 시 updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notices_updated_at
  BEFORE UPDATE ON notices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();