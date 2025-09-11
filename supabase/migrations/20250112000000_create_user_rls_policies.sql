-- 사용자 관련 테이블 RLS 정책
-- 생성일: 2025-01-12
-- 설명: 카카오 로그인 사용자의 개인 데이터 보호를 위한 RLS 정책

-- profiles 테이블 RLS 활성화 및 정책
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 사용자는 본인의 프로필만 조회 가능
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- 사용자는 본인의 프로필만 수정 가능
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- 사용자는 본인의 프로필을 생성 가능 (카카오 로그인 시 자동 생성)
CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- reservations 테이블 RLS 활성화 및 정책
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 사용자는 본인의 예약만 조회 가능
CREATE POLICY "Users can view own reservations" ON reservations
FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 본인의 예약만 생성 가능
CREATE POLICY "Users can create own reservations" ON reservations
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 본인의 예약만 수정 가능 (예약 취소 등)
CREATE POLICY "Users can update own reservations" ON reservations
FOR UPDATE USING (auth.uid() = user_id);

-- payments 테이블 RLS 활성화 및 정책
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 사용자는 본인의 결제 정보만 조회 가능 (reservations와 조인)
CREATE POLICY "Users can view own payments" ON payments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM reservations 
    WHERE reservations.id = payments.reservation_id 
    AND reservations.user_id = auth.uid()
  )
);

-- 사용자는 본인의 결제 정보만 생성 가능
CREATE POLICY "Users can create own payments" ON payments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM reservations 
    WHERE reservations.id = reservation_id 
    AND reservations.user_id = auth.uid()
  )
);

-- 사용자는 본인의 결제 정보만 수정 가능 (환불 등)
CREATE POLICY "Users can update own payments" ON payments
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM reservations 
    WHERE reservations.id = payments.reservation_id 
    AND reservations.user_id = auth.uid()
  )
);

-- reviews 테이블 RLS 활성화 및 정책
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 모든 사용자는 리뷰를 조회 가능 (공개 정보)
CREATE POLICY "Anyone can view reviews" ON reviews
FOR SELECT USING (true);

-- 사용자는 본인의 리뷰만 생성 가능
CREATE POLICY "Users can create own reviews" ON reviews
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 본인의 리뷰만 수정 가능
CREATE POLICY "Users can update own reviews" ON reviews
FOR UPDATE USING (auth.uid() = user_id);

-- 사용자는 본인의 리뷰만 삭제 가능
CREATE POLICY "Users can delete own reviews" ON reviews
FOR DELETE USING (auth.uid() = user_id);

-- 관리자 및 호스트 권한 정책 (Service Role 사용)
-- Service Role은 모든 테이블에 대한 전체 액세스 권한 유지

-- 트리거 함수 생성: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- profiles 테이블 updated_at 트리거
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- reservations 테이블 updated_at 트리거
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
CREATE TRIGGER update_reservations_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- payments 테이블 updated_at 트리거
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- reviews 테이블 updated_at 트리거
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();