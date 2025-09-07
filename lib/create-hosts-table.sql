-- hosts 테이블 생성
CREATE TABLE IF NOT EXISTS hosts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    host_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    business_address TEXT,
    business_registration_number TEXT,
    description TEXT,
    commission_rate DECIMAL(3,1) DEFAULT 5.0,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE hosts ENABLE ROW LEVEL SECURITY;

-- 호스트는 자신의 정보만 볼 수 있음
CREATE POLICY "Users can view own host data" ON hosts
    FOR SELECT USING (auth.uid() = user_id);

-- 호스트는 자신의 정보를 수정할 수 있음
CREATE POLICY "Users can update own host data" ON hosts
    FOR UPDATE USING (auth.uid() = user_id);

-- 누구나 호스트로 등록할 수 있음
CREATE POLICY "Anyone can insert host data" ON hosts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_hosts_user_id ON hosts(user_id);
CREATE INDEX IF NOT EXISTS idx_hosts_is_approved ON hosts(is_approved);

-- 테스트 데이터 삽입 (필요시)
-- 기존 accommodations 데이터가 있다면 그에 맞는 호스트 데이터도 필요합니다
-- 먼저 더미 user_id를 사용해서 테스트 데이터 삽입
DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- auth.users 테이블에 테스트 사용자가 없으면 생성하지 않음
    -- 실제 사용자가 등록할 때만 데이터 생성
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = test_user_id) THEN
        INSERT INTO hosts (user_id, business_name, host_name, phone, email, is_approved) 
        VALUES (test_user_id, '구공스테이 청주점', '김호스트', '010-1234-5678', 'host@example.com', true)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- accommodations 테이블에 host_id 컬럼 추가 (없는 경우)
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES hosts(id);

-- 기존 숙소에 호스트 연결 (테스트용)
UPDATE accommodations 
SET host_id = (SELECT id FROM hosts WHERE business_name = '구공스테이 청주점' LIMIT 1)
WHERE name = '구공스테이 청주점' AND host_id IS NULL;