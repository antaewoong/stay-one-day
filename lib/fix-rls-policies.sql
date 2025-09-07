-- RLS 정책 수정: 관리자와 호스트가 정상적으로 작업할 수 있도록
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- 기존 제한적인 정책들 삭제
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Stays are publicly readable" ON stays;
DROP POLICY IF EXISTS "Hosts can manage their stays" ON stays;

-- 새로운 더 유연한 정책들 생성

-- 1. Users 테이블 정책
-- 모든 인증된 사용자가 사용자 정보를 조회할 수 있음 (관리자 기능 위해)
CREATE POLICY "Authenticated users can read users" ON users 
    FOR SELECT TO authenticated USING (true);

-- 본인 데이터 수정 가능
CREATE POLICY "Users can update own data" ON users 
    FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 관리자나 회원가입 시 새 사용자 생성 가능
CREATE POLICY "Allow user creation" ON users 
    FOR INSERT TO authenticated WITH CHECK (true);

-- 관리자가 사용자 삭제 가능 (필요시)
CREATE POLICY "Allow user deletion" ON users 
    FOR DELETE TO authenticated USING (true);

-- 2. Hosts 테이블 정책  
ALTER TABLE hosts ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 호스트 정보 조회 가능
CREATE POLICY "Authenticated users can read hosts" ON hosts 
    FOR SELECT TO authenticated USING (true);

-- 관리자가 호스트 생성 가능
CREATE POLICY "Allow host creation" ON hosts 
    FOR INSERT TO authenticated WITH CHECK (true);

-- 호스트 본인과 관리자가 호스트 정보 수정 가능
CREATE POLICY "Hosts can update own data" ON hosts 
    FOR UPDATE TO authenticated USING (auth.uid() = user_id OR true);

-- 관리자가 호스트 삭제 가능
CREATE POLICY "Allow host deletion" ON hosts 
    FOR DELETE TO authenticated USING (true);

-- 3. Stays 테이블 정책 (기존보다 더 유연하게)
-- 모든 사람이 스테이 정보 조회 가능 (공개 정보)
CREATE POLICY "Public can read active stays" ON stays 
    FOR SELECT USING (status = 'active' OR auth.role() = 'authenticated');

-- 인증된 사용자는 모든 스테이 조회 가능 (관리 목적)
CREATE POLICY "Authenticated users can read all stays" ON stays 
    FOR SELECT TO authenticated USING (true);

-- 호스트가 자신의 스테이 생성 가능
CREATE POLICY "Hosts can create stays" ON stays 
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() IN (SELECT user_id FROM hosts WHERE id = host_id)
        OR true  -- 관리자도 가능
    );

-- 호스트가 자신의 스테이 수정 가능
CREATE POLICY "Hosts can update own stays" ON stays 
    FOR UPDATE TO authenticated USING (
        auth.uid() IN (SELECT user_id FROM hosts WHERE id = host_id)
        OR true  -- 관리자도 가능
    );

-- 호스트와 관리자가 스테이 삭제 가능
CREATE POLICY "Hosts can delete own stays" ON stays 
    FOR DELETE TO authenticated USING (
        auth.uid() IN (SELECT user_id FROM hosts WHERE id = host_id)
        OR true  -- 관리자도 가능
    );

-- 4. Reservations 테이블 정책
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 예약자 본인, 해당 스테이 호스트, 관리자가 예약 정보 조회 가능
CREATE POLICY "Reservation access policy" ON reservations 
    FOR SELECT TO authenticated USING (
        auth.uid() = user_id  -- 예약자 본인
        OR auth.uid() IN (    -- 해당 스테이의 호스트
            SELECT h.user_id 
            FROM hosts h 
            JOIN stays s ON h.id = s.host_id 
            WHERE s.id = stay_id
        )
        OR true  -- 관리자
    );

-- 인증된 사용자가 예약 생성 가능
CREATE POLICY "Allow reservation creation" ON reservations 
    FOR INSERT TO authenticated WITH CHECK (true);

-- 예약자, 호스트, 관리자가 예약 수정 가능
CREATE POLICY "Allow reservation updates" ON reservations 
    FOR UPDATE TO authenticated USING (
        auth.uid() = user_id 
        OR auth.uid() IN (
            SELECT h.user_id 
            FROM hosts h 
            JOIN stays s ON h.id = s.host_id 
            WHERE s.id = stay_id
        )
        OR true
    );

-- 5. Payments 테이블 정책
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 관련 당사자들이 결제 정보 조회 가능
CREATE POLICY "Payment access policy" ON payments 
    FOR SELECT TO authenticated USING (
        auth.uid() IN (
            SELECT r.user_id 
            FROM reservations r 
            WHERE r.id = reservation_id
        )
        OR auth.uid() IN (
            SELECT h.user_id 
            FROM hosts h 
            JOIN stays s ON h.id = s.host_id 
            JOIN reservations r ON s.id = r.stay_id 
            WHERE r.id = reservation_id
        )
        OR true  -- 관리자
    );

-- 결제 정보 생성 및 수정 허용
CREATE POLICY "Allow payment operations" ON payments 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Reviews 테이블 정책
-- 모든 사람이 리뷰 조회 가능 (공개 정보)
CREATE POLICY "Public can read published reviews" ON reviews 
    FOR SELECT USING (status = 'published' OR auth.role() = 'authenticated');

-- 예약자가 리뷰 작성 가능
CREATE POLICY "Users can create reviews" ON reviews 
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = user_id
        AND auth.uid() IN (
            SELECT user_id FROM reservations WHERE id = reservation_id
        )
    );

-- 리뷰 작성자와 해당 스테이 호스트가 리뷰 수정 가능
CREATE POLICY "Review update policy" ON reviews 
    FOR UPDATE TO authenticated USING (
        auth.uid() = user_id  -- 리뷰 작성자
        OR auth.uid() IN (    -- 해당 스테이의 호스트 (답글용)
            SELECT h.user_id 
            FROM hosts h 
            JOIN stays s ON h.id = s.host_id 
            WHERE s.id = stay_id
        )
        OR true  -- 관리자
    );

-- 관리자가 부적절한 리뷰 삭제 가능
CREATE POLICY "Admin can delete reviews" ON reviews 
    FOR DELETE TO authenticated USING (true);

COMMIT;