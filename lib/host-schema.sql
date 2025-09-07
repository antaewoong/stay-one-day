-- =============================================
-- 호스트 관리 시스템 추가 스키마
-- =============================================

-- 1. 호스트 정보 테이블
CREATE TABLE IF NOT EXISTS hosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL, -- 사업체명
  host_name VARCHAR(100) NOT NULL, -- 호스트 이름
  business_number VARCHAR(20), -- 사업자 등록번호
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  address TEXT NOT NULL, -- 사업장 주소
  bank_account JSONB, -- 정산 계좌 정보 {"bank": "신한", "account": "123-456-789", "holder": "홍길동"}
  commission_rate DECIMAL(3,2) DEFAULT 0.05, -- 수수료율 (기본 5%)
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'suspended'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. 호스트-숙소 연결 테이블 (accommodations 테이블에 host_id 추가)
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES hosts(id) ON DELETE SET NULL;

-- 3. 정산 내역 테이블
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
  settlement_period_start DATE NOT NULL, -- 정산 기간 시작
  settlement_period_end DATE NOT NULL, -- 정산 기간 종료
  total_reservations INTEGER NOT NULL DEFAULT 0, -- 총 예약 건수
  gross_revenue INTEGER NOT NULL DEFAULT 0, -- 총 매출
  commission_amount INTEGER NOT NULL DEFAULT 0, -- 수수료
  net_amount INTEGER NOT NULL DEFAULT 0, -- 실 정산액
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 정산 상세 내역 테이블 (예약별 정산 내역)
CREATE TABLE IF NOT EXISTS settlement_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  accommodation_id UUID NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
  reservation_amount INTEGER NOT NULL, -- 예약 금액
  commission_rate DECIMAL(3,2) NOT NULL, -- 적용된 수수료율
  commission_amount INTEGER NOT NULL, -- 수수료 금액
  net_amount INTEGER NOT NULL, -- 실 정산액
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 호스트 알림 테이블
CREATE TABLE IF NOT EXISTS host_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'new_reservation', 'cancellation', 'payment', 'review'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- 관련 데이터 (예약 ID, 금액 등)
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 인덱스 생성
-- =============================================

-- 호스트 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_hosts_user_id ON hosts(user_id);
CREATE INDEX IF NOT EXISTS idx_hosts_status ON hosts(status);

-- 숙소 테이블 호스트 인덱스
CREATE INDEX IF NOT EXISTS idx_accommodations_host_id ON accommodations(host_id);

-- 정산 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_settlements_host_id ON settlements(host_id);
CREATE INDEX IF NOT EXISTS idx_settlements_period ON settlements(settlement_period_start, settlement_period_end);
CREATE INDEX IF NOT EXISTS idx_settlement_details_settlement_id ON settlement_details(settlement_id);

-- 알림 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_host_notifications_host_id ON host_notifications(host_id);
CREATE INDEX IF NOT EXISTS idx_host_notifications_read ON host_notifications(is_read);

-- =============================================
-- RLS (Row Level Security) 정책
-- =============================================

-- 호스트 테이블 RLS
ALTER TABLE hosts ENABLE ROW LEVEL SECURITY;

-- 호스트는 자신의 정보만 볼 수 있음
CREATE POLICY "Hosts can view their own data" ON hosts
  FOR SELECT USING (auth.uid() = user_id);

-- 호스트는 자신의 정보만 수정할 수 있음
CREATE POLICY "Hosts can update their own data" ON hosts
  FOR UPDATE USING (auth.uid() = user_id);

-- 새 호스트 등록 허용
CREATE POLICY "Users can register as hosts" ON hosts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 숙소 테이블 RLS 업데이트 (호스트 관련)
DROP POLICY IF EXISTS "Public read access for accommodations" ON accommodations;
CREATE POLICY "Public read access for accommodations" ON accommodations
  FOR SELECT USING (is_active = true);

CREATE POLICY "Hosts can manage their accommodations" ON accommodations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM hosts 
      WHERE hosts.id = accommodations.host_id 
      AND hosts.user_id = auth.uid()
    )
  );

-- 정산 테이블 RLS
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can view their settlements" ON settlements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM hosts 
      WHERE hosts.id = settlements.host_id 
      AND hosts.user_id = auth.uid()
    )
  );

-- 정산 상세 테이블 RLS
ALTER TABLE settlement_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can view their settlement details" ON settlement_details
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM settlements s
      JOIN hosts h ON h.id = s.host_id
      WHERE s.id = settlement_details.settlement_id 
      AND h.user_id = auth.uid()
    )
  );

-- 호스트 알림 테이블 RLS
ALTER TABLE host_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can manage their notifications" ON host_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM hosts 
      WHERE hosts.id = host_notifications.host_id 
      AND hosts.user_id = auth.uid()
    )
  );

-- =============================================
-- 트리거 함수들
-- =============================================

-- 호스트 관련 updated_at 트리거
CREATE TRIGGER update_hosts_updated_at BEFORE UPDATE ON hosts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settlements_updated_at BEFORE UPDATE ON settlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 새 예약 시 호스트 알림 생성 함수
CREATE OR REPLACE FUNCTION notify_host_new_reservation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO host_notifications (host_id, type, title, message, data)
  SELECT 
    a.host_id,
    'new_reservation',
    '새로운 예약이 들어왔습니다',
    a.name || '에 ' || NEW.guest_name || '님의 예약이 접수되었습니다.',
    jsonb_build_object(
      'reservation_id', NEW.id,
      'accommodation_name', a.name,
      'guest_name', NEW.guest_name,
      'total_price', NEW.total_price,
      'reservation_date', NEW.reservation_date
    )
  FROM accommodations a
  WHERE a.id = NEW.accommodation_id AND a.host_id IS NOT NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 예약 생성 시 호스트 알림 트리거
CREATE TRIGGER trigger_notify_host_new_reservation
  AFTER INSERT ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION notify_host_new_reservation();

-- =============================================
-- 샘플 호스트 데이터
-- =============================================

-- 구공스테이 호스트 등록 (관리자 계정으로)
INSERT INTO hosts (
  user_id, 
  business_name, 
  host_name, 
  business_number, 
  phone, 
  email, 
  address, 
  bank_account,
  commission_rate,
  status
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@stayoneday.com' LIMIT 1),
  '구공스테이',
  '구공스테이 관리자',
  '123-45-67890',
  '010-1234-5678',
  'host@googstay.com',
  '충북 청주시 청원구 구공로 123',
  '{"bank": "신한은행", "account": "110-123-456789", "holder": "구공스테이"}'::jsonb,
  0.05,
  'approved'
) ON CONFLICT DO NOTHING;

-- 샘플 숙소들을 구공스테이 호스트에 연결
UPDATE accommodations 
SET host_id = (SELECT id FROM hosts WHERE business_name = '구공스테이' LIMIT 1)
WHERE name IN ('구공스테이 청주 메인홀');

-- 다른 샘플 호스트들 (가상 호스트)
INSERT INTO hosts (
  user_id, 
  business_name, 
  host_name, 
  phone, 
  email, 
  address, 
  bank_account,
  status
) VALUES 
-- 스카이뷰 호스트 (가상 사용자 ID로 임시)
(
  gen_random_uuid(),
  '스카이뷰 펜션',
  '김호스트',
  '010-2345-6789',
  'skyview@example.com',
  '경기도 가평군 설악면 스카이로 456',
  '{"bank": "국민은행", "account": "123-456-789012", "holder": "김호스트"}'::jsonb,
  'approved'
),
-- 오션뷰 호스트
(
  gen_random_uuid(),
  '오션뷰 글램핑',
  '이호스트',
  '010-3456-7890',
  'ocean@example.com',
  '강원도 양양군 현북면 바다로 789',
  '{"bank": "우리은행", "account": "987-654-321098", "holder": "이호스트"}'::jsonb,
  'approved'
) ON CONFLICT DO NOTHING;