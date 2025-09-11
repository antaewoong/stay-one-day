-- 통합 문의 테이블 생성 (고객 + 호스트)
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('host', 'customer')),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('accommodation', 'reservation', 'payment', 'technical', 'other')),
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed')),
  admin_reply TEXT,
  admin_reply_date TIMESTAMP,
  admin_id UUID, -- 답변한 관리자 ID
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_inquiries_user_type ON inquiries(user_type);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 호스트는 자신의 문의만 볼 수 있음
CREATE POLICY "hosts_own_inquiries" ON inquiries
  FOR ALL USING (
    user_type = 'host' AND 
    user_id IN (
      SELECT id FROM hosts 
      WHERE auth_user_id = auth.uid()
    )
  );

-- 관리자는 모든 문의를 볼 수 있음
CREATE POLICY "admins_all_inquiries" ON inquiries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE auth_user_id = auth.uid()
    )
  );

-- 고객은 자신의 문의만 볼 수 있음 (향후 확장용)
CREATE POLICY "customers_own_inquiries" ON inquiries
  FOR ALL USING (
    user_type = 'customer' AND 
    user_id = auth.uid()
  );

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_inquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_inquiries_updated_at ON inquiries;
CREATE TRIGGER trigger_update_inquiries_updated_at
  BEFORE UPDATE ON inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_inquiries_updated_at();