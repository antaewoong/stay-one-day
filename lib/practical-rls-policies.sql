-- Stay-OneDay 실용적인 RLS 정책
-- 고객/호스트/관리자 역할 기반 접근 제어

-- 기존 정책 모두 삭제
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Stays are publicly readable" ON stays;
DROP POLICY IF EXISTS "Hosts can manage their stays" ON stays;

-- 모든 테이블의 기존 정책 삭제
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can read ' || r.tablename || '" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Allow ' || r.tablename || ' creation" ON ' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Allow ' || r.tablename || ' operations" ON ' || r.tablename;
    END LOOP;
END$$;

-- 1. Users 테이블: 본인 정보만 접근 가능
CREATE POLICY "Users can view own data" ON users 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users 
    FOR UPDATE USING (auth.uid() = id);

-- 사용자 생성은 Service Key로만 (회원가입/관리자 등록)
CREATE POLICY "Deny user creation via RLS" ON users 
    FOR INSERT WITH CHECK (false);

-- 2. Hosts 테이블: 호스트 본인 정보만 접근
CREATE POLICY "Hosts can view own data" ON hosts 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Hosts can update own data" ON hosts 
    FOR UPDATE USING (auth.uid() = user_id);

-- 호스트 생성은 Service Key로만 (관리자만)
CREATE POLICY "Deny host creation via RLS" ON hosts 
    FOR INSERT WITH CHECK (false);

-- 3. Stays 테이블: 공개 조회 + 호스트만 수정
-- 공개 스테이는 누구나 조회 가능
CREATE POLICY "Public can view active stays" ON stays 
    FOR SELECT USING (status = 'active');

-- 호스트는 자신의 모든 스테이 조회 가능
CREATE POLICY "Hosts can view own stays" ON stays 
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM hosts WHERE id = host_id)
    );

-- 호스트는 자신의 스테이만 수정 가능
CREATE POLICY "Hosts can update own stays" ON stays 
    FOR UPDATE USING (
        auth.uid() IN (SELECT user_id FROM hosts WHERE id = host_id)
    );

-- 스테이 생성/삭제는 Service Key로만
CREATE POLICY "Deny stay creation via RLS" ON stays 
    FOR INSERT WITH CHECK (false);

CREATE POLICY "Deny stay deletion via RLS" ON stays 
    FOR DELETE USING (false);

-- 4. Reservations 테이블: 핵심 정책!
-- 고객: 자기 예약만 접근
CREATE POLICY "Customers can view own reservations" ON reservations 
    FOR SELECT USING (auth.uid() = user_id);

-- 호스트: 자기 스테이의 예약만 접근
CREATE POLICY "Hosts can view their stay reservations" ON reservations 
    FOR SELECT USING (
        auth.uid() IN (
            SELECT h.user_id 
            FROM hosts h 
            JOIN stays s ON h.id = s.host_id 
            WHERE s.id = stay_id
        )
    );

-- 고객: 자기 예약만 수정 (취소 등)
CREATE POLICY "Customers can update own reservations" ON reservations 
    FOR UPDATE USING (auth.uid() = user_id);

-- 호스트: 자기 스테이의 예약 상태 변경 가능
CREATE POLICY "Hosts can update their stay reservations" ON reservations 
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT h.user_id 
            FROM hosts h 
            JOIN stays s ON h.id = s.host_id 
            WHERE s.id = stay_id
        )
    );

-- 예약 생성/삭제는 Service Key로만
CREATE POLICY "Deny reservation creation via RLS" ON reservations 
    FOR INSERT WITH CHECK (false);

CREATE POLICY "Deny reservation deletion via RLS" ON reservations 
    FOR DELETE USING (false);

-- 5. Payments 테이블: 예약과 동일한 접근 권한
-- 고객: 자기 예약의 결제 정보만
CREATE POLICY "Customers can view own payments" ON payments 
    FOR SELECT USING (
        auth.uid() IN (
            SELECT r.user_id 
            FROM reservations r 
            WHERE r.id = reservation_id
        )
    );

-- 호스트: 자기 스테이 예약의 결제 정보
CREATE POLICY "Hosts can view their stay payments" ON payments 
    FOR SELECT USING (
        auth.uid() IN (
            SELECT h.user_id 
            FROM hosts h 
            JOIN stays s ON h.id = s.host_id 
            JOIN reservations r ON s.id = r.stay_id 
            WHERE r.id = reservation_id
        )
    );

-- 결제 생성/수정/삭제는 Service Key로만
CREATE POLICY "Deny payment operations via RLS" ON payments 
    FOR ALL USING (false);

-- 6. Reviews 테이블: 공개 조회 + 작성자만 수정
-- 발행된 리뷰는 공개
CREATE POLICY "Public can view published reviews" ON reviews 
    FOR SELECT USING (status = 'published');

-- 리뷰 작성자는 자기 리뷰 조회/수정 가능
CREATE POLICY "Users can manage own reviews" ON reviews 
    FOR ALL USING (auth.uid() = user_id);

-- 호스트는 자기 스테이의 리뷰에 답글 가능 (UPDATE만)
CREATE POLICY "Hosts can reply to reviews" ON reviews 
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT h.user_id 
            FROM hosts h 
            JOIN stays s ON h.id = s.host_id 
            WHERE s.id = stay_id
        )
    );

-- 리뷰 생성/삭제는 Service Key로 제어
CREATE POLICY "Allow review creation for reservation owners" ON reviews 
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND auth.uid() IN (
            SELECT user_id FROM reservations WHERE id = reservation_id
        )
    );

-- 7. 기타 테이블들 (categories, stay_images, etc.)
-- 공개 조회, 수정은 Service Key로만
CREATE POLICY "Public can view categories" ON categories 
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view stay images" ON stay_images 
    FOR SELECT USING (true);

-- SMS, 공지사항 등은 호스트만 접근
CREATE POLICY "Hosts can manage sms templates" ON sms_templates 
    FOR ALL USING (
        auth.uid() IN (
            SELECT h.user_id 
            FROM hosts h 
            JOIN stays s ON h.id = s.host_id 
            WHERE s.id = stay_id
        )
    );

CREATE POLICY "Hosts can manage notices" ON notices 
    FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM hosts WHERE id = host_id)
    );

-- 정산 리포트는 해당 호스트만
CREATE POLICY "Hosts can view own settlement reports" ON settlement_reports 
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM hosts WHERE id = host_id)
    );

COMMIT;

-- 참고: 관리자/호스트 권한이 필요한 작업은 다음과 같이 Service Key 사용
-- 예시: /api/admin/*, /api/host/* 엔드포인트에서 createClient(url, serviceKey) 사용