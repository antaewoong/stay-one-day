-- Stay One Day 데이터베이스 스키마
-- 생성일: 2025-09-02
-- 설명: 하루살이 숙박 예약 플랫폼을 위한 데이터베이스 스키마

-- 1. 사용자 관련 테이블
CREATE TABLE profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    full_name text,
    phone_number text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 2. 사업자 테이블
CREATE TABLE business_accounts (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade,
    business_name text not null,
    business_number text unique not null,
    representative_name text not null,
    contact_email text not null,
    contact_phone text not null,
    business_address text not null,
    is_verified boolean default false,
    status text default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 3. 관리자 계정 테이블
CREATE TABLE admin_accounts (
    id uuid default gen_random_uuid() primary key,
    email text unique not null,
    password_hash text not null,
    full_name text not null,
    role text default 'admin' check (role in ('master', 'admin', 'moderator')),
    permissions jsonb default '[]',
    is_active boolean default true,
    created_by uuid references admin_accounts(id),
    created_at timestamp with time zone default now(),
    last_login timestamp with time zone
);

-- 4. 숙소 테이블
CREATE TABLE accommodations (
    id uuid default gen_random_uuid() primary key,
    business_id uuid references business_accounts(id) on delete cascade,
    name text not null,
    description text,
    accommodation_type text not null check (accommodation_type in ('펜션', '풀빌라', '독채', '글램핑', '캠핑', '기타')),
    
    -- 위치 정보
    address text not null,
    detailed_address text,
    latitude decimal(10,8),
    longitude decimal(11,8),
    region text not null,
    
    -- 기본 정보
    max_capacity integer not null,
    bedrooms integer default 1,
    bathrooms integer default 1,
    base_price integer not null, -- 기본 가격 (원)
    weekend_price integer, -- 주말 가격 (원)
    
    -- 체크인/아웃 정보
    checkin_time time default '15:00',
    checkout_time time default '11:00',
    
    -- 상태
    status text default 'draft' check (status in ('draft', 'pending', 'active', 'inactive', 'suspended')),
    is_featured boolean default false,
    
    -- 메타데이터
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 5. 숙소 이미지 테이블
CREATE TABLE accommodation_images (
    id uuid default gen_random_uuid() primary key,
    accommodation_id uuid references accommodations(id) on delete cascade,
    image_url text not null,
    image_type text default 'general' check (image_type in ('main', 'general', 'room', 'bathroom', 'kitchen', 'outdoor', 'amenity')),
    display_order integer default 0,
    alt_text text,
    created_at timestamp with time zone default now()
);

-- 6. 숙소 편의시설 테이블
CREATE TABLE accommodation_amenities (
    id uuid default gen_random_uuid() primary key,
    accommodation_id uuid references accommodations(id) on delete cascade,
    amenity_type text not null,
    amenity_name text not null,
    is_available boolean default true,
    additional_info text
);

-- 7. 숙소 카테고리 테이블
CREATE TABLE accommodation_categories (
    id uuid default gen_random_uuid() primary key,
    accommodation_id uuid references accommodations(id) on delete cascade,
    category text not null check (category in (
        '배달음식 이용 편리',
        '물놀이 가능 풀빌라', 
        '프라이빗 독채형',
        '반려견 동반 가능',
        '키즈 전용',
        '자연 속 완벽한 휴식',
        'BBQ 가능',
        '온수풀',
        '스파/사우나',
        '캠프파이어'
    ))
);

-- 8. 예약 테이블
CREATE TABLE reservations (
    id uuid default gen_random_uuid() primary key,
    accommodation_id uuid references accommodations(id) on delete cascade,
    user_id uuid references auth.users on delete cascade,
    
    -- 예약 정보
    reservation_number text unique not null,
    checkin_date date not null,
    checkout_date date not null,
    guest_count integer not null,
    
    -- 고객 정보
    guest_name text not null,
    guest_phone text not null,
    guest_email text not null,
    
    -- 가격 정보
    base_amount integer not null,
    additional_amount integer default 0,
    discount_amount integer default 0,
    total_amount integer not null,
    
    -- 결제 정보
    payment_method text check (payment_method in ('card', 'bank_transfer', 'kakao_pay', 'toss_pay')),
    payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'cancelled', 'refunded', 'partial_refund')),
    paid_amount integer default 0,
    
    -- 예약 상태
    status text default 'confirmed' check (status in ('confirmed', 'cancelled', 'completed', 'no_show')),
    
    -- 특별 요청사항
    special_requests text,
    
    -- 메타데이터
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 9. 결제 테이블
CREATE TABLE payments (
    id uuid default gen_random_uuid() primary key,
    reservation_id uuid references reservations(id) on delete cascade,
    
    -- 결제 정보
    payment_key text unique not null, -- 토스페이먼츠 결제 키
    order_id text not null,
    amount integer not null,
    payment_method text not null,
    
    -- 상태
    status text not null check (status in ('ready', 'in_progress', 'waiting_for_deposit', 'done', 'cancelled', 'partial_cancelled', 'aborted', 'expired')),
    
    -- 결제 상세
    approved_at timestamp with time zone,
    receipt_url text,
    checkout_url text,
    
    -- 취소/환불 정보
    cancels jsonb,
    
    -- 메타데이터
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 10. 리뷰 테이블
CREATE TABLE reviews (
    id uuid default gen_random_uuid() primary key,
    reservation_id uuid references reservations(id) on delete cascade,
    accommodation_id uuid references accommodations(id) on delete cascade,
    user_id uuid references auth.users on delete cascade,
    
    -- 리뷰 내용
    rating integer not null check (rating between 1 and 5),
    title text,
    content text not null,
    
    -- 세부 평점
    cleanliness_rating integer check (cleanliness_rating between 1 and 5),
    location_rating integer check (location_rating between 1 and 5),
    value_rating integer check (value_rating between 1 and 5),
    service_rating integer check (service_rating between 1 and 5),
    
    -- 상태
    status text default 'active' check (status in ('active', 'hidden', 'reported')),
    
    -- 메타데이터
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 11. 리뷰 이미지 테이블
CREATE TABLE review_images (
    id uuid default gen_random_uuid() primary key,
    review_id uuid references reviews(id) on delete cascade,
    image_url text not null,
    display_order integer default 0,
    created_at timestamp with time zone default now()
);

-- 12. 위시리스트 테이블
CREATE TABLE wishlists (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade,
    accommodation_id uuid references accommodations(id) on delete cascade,
    created_at timestamp with time zone default now(),
    unique(user_id, accommodation_id)
);

-- 13. 알림 테이블
CREATE TABLE notifications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade,
    type text not null check (type in ('reservation_confirmed', 'payment_completed', 'review_request', 'promotion', 'system')),
    title text not null,
    content text not null,
    is_read boolean default false,
    related_id uuid, -- 관련 예약, 숙소 등의 ID
    created_at timestamp with time zone default now()
);

-- 14. SMS 메시지 템플릿 테이블
CREATE TABLE sms_templates (
    id uuid default gen_random_uuid() primary key,
    business_id uuid references business_accounts(id) on delete cascade,
    template_name text not null,
    template_type text not null check (template_type in ('checkin', 'checkout', 'confirmation', 'reminder', 'custom')),
    message_content text not null,
    variables jsonb default '[]', -- 사용 가능한 변수 목록
    send_timing text check (send_timing in ('immediate', '1_hour_before', '2_hours_before', '1_day_before')),
    is_active boolean default true,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 15. SMS 발송 로그 테이블
CREATE TABLE sms_logs (
    id uuid default gen_random_uuid() primary key,
    reservation_id uuid references reservations(id) on delete cascade,
    template_id uuid references sms_templates(id),
    recipient_phone text not null,
    message_content text not null,
    send_status text default 'pending' check (send_status in ('pending', 'sent', 'failed', 'delivered')),
    sent_at timestamp with time zone,
    error_message text,
    created_at timestamp with time zone default now()
);

-- 16. 프로모션 테이블
CREATE TABLE promotions (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text,
    promotion_type text not null check (promotion_type in ('discount_rate', 'discount_amount', 'free_night', 'upgrade')),
    discount_value integer not null, -- 할인율(%) 또는 할인금액(원)
    
    -- 적용 조건
    min_amount integer default 0,
    max_discount_amount integer,
    applicable_regions text[], -- 적용 가능한 지역
    applicable_categories text[], -- 적용 가능한 카테고리
    
    -- 기간 및 수량
    start_date timestamp with time zone not null,
    end_date timestamp with time zone not null,
    usage_limit integer, -- 전체 사용 가능 횟수
    usage_count integer default 0, -- 현재 사용 횟수
    user_usage_limit integer default 1, -- 사용자당 사용 가능 횟수
    
    -- 상태
    status text default 'active' check (status in ('active', 'inactive', 'expired')),
    
    -- 메타데이터
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 17. 프로모션 사용 로그 테이블
CREATE TABLE promotion_usages (
    id uuid default gen_random_uuid() primary key,
    promotion_id uuid references promotions(id) on delete cascade,
    reservation_id uuid references reservations(id) on delete cascade,
    user_id uuid references auth.users on delete cascade,
    discount_amount integer not null,
    used_at timestamp with time zone default now()
);

-- 18. 정산 테이블
CREATE TABLE settlements (
    id uuid default gen_random_uuid() primary key,
    business_id uuid references business_accounts(id) on delete cascade,
    
    -- 정산 기간
    settlement_period text not null, -- 'YYYY-MM' 형식
    start_date date not null,
    end_date date not null,
    
    -- 정산 금액
    total_revenue integer not null, -- 총 매출
    platform_fee integer not null, -- 플랫폼 수수료
    settlement_amount integer not null, -- 정산 금액
    
    -- 상태
    status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
    
    -- 정산 상세
    reservation_count integer default 0,
    details jsonb, -- 상세 정산 내역
    
    -- 메타데이터
    processed_at timestamp with time zone,
    created_at timestamp with time zone default now()
);

-- 19. 공지사항 테이블
CREATE TABLE notices (
    id uuid default gen_random_uuid() primary key,
    admin_id uuid references admin_accounts(id),
    
    -- 공지사항 내용
    title text not null,
    content text not null,
    notice_type text default 'general' check (notice_type in ('general', 'maintenance', 'update', 'promotion', 'urgent')),
    
    -- 대상
    target_audience text default 'all' check (target_audience in ('all', 'users', 'business', 'admin')),
    
    -- 표시 설정
    is_pinned boolean default false,
    is_popup boolean default false,
    
    -- 기간
    start_date timestamp with time zone default now(),
    end_date timestamp with time zone,
    
    -- 상태
    status text default 'draft' check (status in ('draft', 'published', 'archived')),
    
    -- 메타데이터
    view_count integer default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 20. 시스템 설정 테이블
CREATE TABLE system_settings (
    id uuid default gen_random_uuid() primary key,
    setting_key text unique not null,
    setting_value jsonb not null,
    description text,
    category text default 'general',
    is_public boolean default false, -- 프론트엔드에서 접근 가능한지
    updated_by uuid references admin_accounts(id),
    updated_at timestamp with time zone default now()
);

-- 인덱스 생성
CREATE INDEX idx_accommodations_region ON accommodations(region);
CREATE INDEX idx_accommodations_status ON accommodations(status);
CREATE INDEX idx_accommodations_business_id ON accommodations(business_id);
CREATE INDEX idx_reservations_dates ON reservations(checkin_date, checkout_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_reviews_accommodation_id ON reviews(accommodation_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_notifications_user_id_read ON notifications(user_id, is_read);
CREATE INDEX idx_sms_logs_reservation_id ON sms_logs(reservation_id);
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX idx_settlements_business_period ON settlements(business_id, settlement_period);

-- RLS (Row Level Security) 정책
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 기본 프로필 정책
CREATE POLICY "사용자는 자신의 프로필만 조회 가능" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "사용자는 자신의 프로필만 업데이트 가능" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 숙소 정책
CREATE POLICY "누구나 활성화된 숙소 조회 가능" ON accommodations FOR SELECT USING (status = 'active');
CREATE POLICY "사업자는 자신의 숙소만 관리 가능" ON accommodations FOR ALL USING (
    EXISTS (
        SELECT 1 FROM business_accounts 
        WHERE business_accounts.id = accommodations.business_id 
        AND business_accounts.user_id = auth.uid()
    )
);

-- 예약 정책  
CREATE POLICY "사용자는 자신의 예약만 조회 가능" ON reservations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "사용자는 예약 생성 가능" ON reservations FOR INSERT WITH CHECK (user_id = auth.uid());

-- 리뷰 정책
CREATE POLICY "누구나 활성화된 리뷰 조회 가능" ON reviews FOR SELECT USING (status = 'active');
CREATE POLICY "사용자는 자신의 리뷰만 작성/수정 가능" ON reviews FOR ALL USING (user_id = auth.uid());

-- 위시리스트 정책
CREATE POLICY "사용자는 자신의 위시리스트만 관리 가능" ON wishlists FOR ALL USING (user_id = auth.uid());

-- 알림 정책
CREATE POLICY "사용자는 자신의 알림만 조회 가능" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "사용자는 자신의 알림만 업데이트 가능" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- 기본 데이터 삽입
INSERT INTO system_settings (setting_key, setting_value, description, category) VALUES
('platform_commission_rate', '10', '플랫폼 수수료율 (%)', 'payment'),
('default_checkin_time', '"15:00"', '기본 체크인 시간', 'accommodation'),
('default_checkout_time', '"11:00"', '기본 체크아웃 시간', 'accommodation'),
('sms_enabled', 'true', 'SMS 발송 활성화 여부', 'notification'),
('review_required_days', '7', '리뷰 작성 가능 기간 (일)', 'review'),
('cancellation_hours', '24', '무료 취소 가능 시간 (시간)', 'reservation');

-- 함수: 예약 번호 자동 생성
CREATE OR REPLACE FUNCTION generate_reservation_number()
RETURNS text AS $$
DECLARE
    new_number text;
    counter integer;
BEGIN
    -- YYMMDD 형식의 날짜 + 일련번호
    new_number := 'R' || to_char(now(), 'YYMMDD');
    
    -- 오늘 날짜로 시작하는 예약 중 가장 높은 번호 찾기
    SELECT COALESCE(MAX(CAST(RIGHT(reservation_number, 3) AS integer)), 0) + 1
    INTO counter
    FROM reservations
    WHERE reservation_number LIKE new_number || '%';
    
    -- 3자리 숫자로 패딩
    new_number := new_number || LPAD(counter::text, 3, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- 함수: 프로필 자동 생성 트리거
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS trigger AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data ->> 'full_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거: 사용자 가입시 프로필 자동 생성
CREATE OR REPLACE TRIGGER create_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- 함수: 리뷰 평점 업데이트
CREATE OR REPLACE FUNCTION update_accommodation_rating()
RETURNS trigger AS $$
BEGIN
    -- 숙소의 평균 평점과 리뷰 수 업데이트는 별도 컬럼이 필요하면 추가
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON SCHEMA public IS 'Stay One Day - 하루살이 숙박 예약 플랫폼';