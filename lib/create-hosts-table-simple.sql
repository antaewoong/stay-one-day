-- hosts 테이블 생성 (단순 버전)
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
    status TEXT DEFAULT 'active',
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
CREATE INDEX IF NOT EXISTS idx_hosts_status ON hosts(status);

-- accommodations 테이블에 host_id 컬럼 추가 (없는 경우)
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES hosts(id);

-- 확인용 쿼리
SELECT 'hosts 테이블이 성공적으로 생성되었습니다.' as message;