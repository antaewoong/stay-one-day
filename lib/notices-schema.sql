-- =============================================
-- 공지사항 테이블 스키마
-- =============================================

-- 공지사항 테이블 생성
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name VARCHAR(100) NOT NULL,
  author_role VARCHAR(50) DEFAULT 'admin', -- 'admin', 'manager', 'host'
  views INTEGER NOT NULL DEFAULT 0,
  is_important BOOLEAN DEFAULT false, -- 중요 공지사항 표시
  is_published BOOLEAN DEFAULT true,
  target_audience VARCHAR(20) DEFAULT 'all', -- 'all', 'hosts', 'admins'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notices_created_at ON notices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notices_published ON notices(is_published);
CREATE INDEX IF NOT EXISTS idx_notices_target ON notices(target_audience);
CREATE INDEX IF NOT EXISTS idx_notices_important ON notices(is_important);

-- RLS 설정
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 공지사항을 볼 수 있음
CREATE POLICY "Anyone can view published notices" ON notices
  FOR SELECT USING (is_published = true);

-- 관리자만 공지사항을 생성, 수정, 삭제할 수 있음 (나중에 역할 기반으로 수정)
CREATE POLICY "Admins can manage notices" ON notices
  FOR ALL USING (auth.uid() IS NOT NULL);

-- updated_at 트리거
CREATE TRIGGER update_notices_updated_at BEFORE UPDATE ON notices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 기본 공지사항 데이터 삽입
INSERT INTO notices (title, content, author_name, author_role, views, is_important, target_audience) VALUES
('시설가격 모니터링 팀장 요청', '시설 가격 모니터링 관련 업무 조율이 필요합니다. 각 숙소별 가격 변동 사항을 점검해 주시기 바랍니다.', '구공-박소정', 'manager', 10, false, 'hosts'),
('[공지] 대기업 대상 10% 할인율로 홍보준비', '대기업 고객 대상 특별 할인 프로모션을 준비 중입니다. 관련 숙소 등록 및 준비사항을 확인해 주세요.', '구공-관리자', 'admin', 17, true, 'all'),
('[공지] 월 정기 점검 안내', '매월 정기 시스템 점검이 예정되어 있습니다. 점검 시간 동안 서비스 이용에 제한이 있을 수 있습니다.', '구공-관리자', 'admin', 14, true, 'all'),
('[시스템] 새로운 예약 관리 기능 업데이트', '예약 관리 시스템에 새로운 기능이 추가되었습니다. 대시보드에서 확인해 보세요.', '구공-관리자', 'admin', 8, false, 'hosts'),
('고객 문의 응답 가이드라인 변경', '고객 문의 응답 시 새로운 가이드라인이 적용됩니다. 첨부된 매뉴얼을 참고해 주세요.', '구공-박소정', 'manager', 12, false, 'hosts')
ON CONFLICT DO NOTHING;