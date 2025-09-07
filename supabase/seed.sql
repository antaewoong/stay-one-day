-- Stay One Day 샘플 데이터 삽입
-- 실행 전 schema.sql을 먼저 실행해주세요

-- 1. 마스터 관리자 계정 생성 (비밀번호: admin123!)
INSERT INTO admin_accounts (email, password_hash, full_name, role, permissions, created_by)
VALUES (
  'admin@stayoneday.co.kr',
  '$2b$10$rQhZKmQFMxYwc7RrLKO6ZOHjZHjKvJjKvJjKvJjKvJjKvJjKvJjK',  -- admin123! (실제로는 해싱된 값)
  '시스템 관리자',
  'master',
  '["all"]',
  NULL
);

-- 2. 샘플 사업자 계정
INSERT INTO business_accounts (id, business_name, business_number, representative_name, contact_email, contact_phone, business_address, is_verified, status)
VALUES 
(
  '11111111-1111-1111-1111-111111111111',
  '구공스테이',
  '123-45-67890',
  '김구공',
  'gukong@stayoneday.co.kr',
  '010-1234-5678',
  '충청북도 청주시 상당구 용암북로 123',
  true,
  'approved'
),
(
  '22222222-2222-2222-2222-222222222222',
  '세종빌라리조트',
  '098-76-54321',
  '이세종',
  'sejong@stayoneday.co.kr',
  '010-2345-6789',
  '세종특별자치시 조치원읍 세종대로 456',
  true,
  'approved'
),
(
  '33333333-3333-3333-3333-333333333333',
  '대전풀빌라',
  '567-89-01234',
  '박대전',
  'daejeon@stayoneday.co.kr',
  '010-3456-7890',
  '대전광역시 유성구 대덕대로 789',
  true,
  'approved'
);

-- 3. 샘플 숙소 데이터
INSERT INTO accommodations (id, business_id, name, description, accommodation_type, address, detailed_address, latitude, longitude, region, max_capacity, bedrooms, bathrooms, base_price, weekend_price, status, is_featured)
VALUES 
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  '구공스테이 청주점',
  '청주 시내 중심가에 위치한 프리미엄 독채 풀빌라입니다. 넓은 수영장과 바베큐 시설을 완비하여 가족 및 단체 모임에 최적화되어 있습니다. 최대 12명까지 이용 가능하며, 깨끗하고 모던한 인테리어로 편안한 휴식을 제공합니다.',
  '풀빌라',
  '충청북도 청주시 상당구 용암북로 123',
  '101동 201호',
  36.6424341,
  127.4890319,
  '청주',
  12,
  4,
  3,
  180000,
  220000,
  'active',
  true
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '22222222-2222-2222-2222-222222222222',
  '세종빌라리조트',
  '자연 속 힐링 공간으로 완벽한 프라이빗한 휴식을 제공합니다. 넓은 정원과 개별 바베큐존, 그리고 아이들을 위한 놀이 시설까지 완비되어 있어 가족 여행에 최적입니다.',
  '독채',
  '세종특별자치시 조치원읍 세종대로 456',
  '가동 1층',
  36.4800984,
  127.2889851,
  '세종',
  8,
  3,
  2,
  150000,
  190000,
  'active',
  true
),
(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '33333333-3333-3333-3333-333333333333',
  '대전 힐링풀빌라',
  '유성온천 근처에 위치한 럭셔리 풀빌라로, 온수풀과 사우나 시설을 갖추고 있습니다. 대전 시내 접근성도 좋으며, 주변 맛집과 관광지가 풍부합니다.',
  '풀빌라',
  '대전광역시 유성구 대덕대로 789',
  'A동 전체',
  36.3504567,
  127.3845475,
  '대전',
  10,
  3,
  2,
  200000,
  250000,
  'active',
  true
),
(
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '11111111-1111-1111-1111-111111111111',
  '청주 키즈 전용 펜션',
  '아이들을 위한 완벽한 공간! 실내외 놀이시설, 키즈풀, 안전한 울타리까지 모든 것이 준비되어 있습니다. 부모님들도 편안하게 휴식할 수 있는 별도 공간이 마련되어 있습니다.',
  '펜션',
  '충청북도 청주시 청원구 오창읍 각리길 45',
  '전체동',
  36.7156894,
  127.4304123,
  '청주',
  8,
  2,
  2,
  120000,
  160000,
  'active',
  false
),
(
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '22222222-2222-2222-2222-222222222222',
  '세종 반려견 동반 펜션',
  '반려견과 함께하는 특별한 휴식! 넓은 운동장과 반려견 전용 시설이 완비되어 있습니다. 반려견 놀이기구, 전용 샤워장, 울타리 안전시설까지 모든 것이 준비되어 있어요.',
  '펜션',
  '세종특별자치시 금남면 용포리 123-4',
  '독채전체',
  36.4651234,
  127.2123456,
  '세종',
  6,
  2,
  2,
  100000,
  140000,
  'active',
  false
),
(
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  '33333333-3333-3333-3333-333333333333',
  '충남 자연속 글램핑',
  '산 중턱에 위치한 럭셔리 글램핑으로 탁 트인 자연 경관을 자랑합니다. 별이 쏟아지는 밤하늘 아래에서 특별한 추억을 만들어보세요. 캠프파이어와 바베큐 시설도 완비되어 있습니다.',
  '글램핑',
  '충청남도 공주시 계룡면 중장리 산85-1',
  'A-5호 텐트',
  36.4567890,
  127.1234567,
  '충남',
  4,
  1,
  1,
  80000,
  120000,
  'active',
  false
);

-- 4. 숙소 이미지 삽입
INSERT INTO accommodation_images (accommodation_id, image_url, image_type, display_order, alt_text)
VALUES 
-- 구공스테이 청주점 이미지
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', 'main', 1, '구공스테이 청주점 메인'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 'outdoor', 2, '야외 수영장'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', 'room', 3, '침실'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', 'kitchen', 4, '주방'),

-- 세종빌라리조트 이미지  
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800', 'main', 1, '세종빌라리조트 메인'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800', 'outdoor', 2, '정원'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', 'room', 3, '거실'),

-- 대전 힐링풀빌라 이미지
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800', 'main', 1, '대전 힐링풀빌라 메인'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', 'outdoor', 2, '풀빌라 수영장'),

-- 청주 키즈 전용 펜션 이미지
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800', 'main', 1, '키즈펜션 메인'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800', 'amenity', 2, '키즈 놀이시설'),

-- 세종 반려견 동반 펜션 이미지
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', 'main', 1, '반려견 펜션 메인'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800', 'outdoor', 2, '반려견 운동장'),

-- 충남 자연속 글램핑 이미지
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800', 'main', 1, '글램핑 메인'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800', 'outdoor', 2, '자연경관');

-- 5. 숙소 편의시설
INSERT INTO accommodation_amenities (accommodation_id, amenity_type, amenity_name, is_available)
VALUES 
-- 구공스테이 청주점 편의시설
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pool', '야외 수영장', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbq', '바베큐 시설', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'wifi', '무료 Wi-Fi', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'parking', '무료 주차', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'kitchen', '주방 시설', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'tv', 'Smart TV', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aircon', '에어컨', true),

-- 세종빌라리조트 편의시설
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbq', '개별 바베큐존', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'wifi', '무료 Wi-Fi', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'parking', '무료 주차', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'kitchen', '주방 시설', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'playground', '아이 놀이시설', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'garden', '정원', true),

-- 대전 힐링풀빌라 편의시설
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'pool', '온수 수영장', true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'sauna', '사우나', true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'wifi', '무료 Wi-Fi', true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'parking', '무료 주차', true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'kitchen', '주방 시설', true),

-- 청주 키즈 전용 펜션 편의시설
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'playground', '키즈 놀이시설', true),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'kids_pool', '키즈풀', true),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'safety', '안전 울타리', true),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'wifi', '무료 Wi-Fi', true),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'parking', '무료 주차', true),

-- 세종 반려견 동반 펜션 편의시설
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'pet_area', '반려견 운동장', true),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'pet_shower', '반려견 샤워장', true),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'pet_fence', '반려견 안전울타리', true),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'wifi', '무료 Wi-Fi', true),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'parking', '무료 주차', true),

-- 충남 자연속 글램핑 편의시설
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'campfire', '캠프파이어', true),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'bbq', '바베큐 시설', true),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'wifi', '무료 Wi-Fi', true),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'parking', '무료 주차', true),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'nature', '자연경관', true);

-- 6. 숙소 카테고리
INSERT INTO accommodation_categories (accommodation_id, category)
VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '물놀이 가능 풀빌라'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '프라이빗 독채형'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'BBQ 가능'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '배달음식 이용 편리'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '프라이빗 독채형'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '자연 속 완벽한 휴식'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'BBQ 가능'),

('cccccccc-cccc-cccc-cccc-cccccccccccc', '물놀이 가능 풀빌라'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '스파/사우나'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '온수풀'),

('dddddddd-dddd-dddd-dddd-dddddddddddd', '키즈 전용'),

('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '반려견 동반 가능'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '자연 속 완벽한 휴식'),

('ffffffff-ffff-ffff-ffff-ffffffffffff', '자연 속 완벽한 휴식'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', '캠프파이어');

-- 7. 샘플 예약 데이터 (지난 달 데이터)
INSERT INTO reservations (id, accommodation_id, user_id, reservation_number, checkin_date, checkout_date, guest_count, guest_name, guest_phone, guest_email, base_amount, total_amount, payment_status, status)
VALUES 
('12345678-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, 'R2408001', '2024-08-15', '2024-08-16', 8, '김철수', '010-1111-2222', 'kim@email.com', 220000, 220000, 'paid', 'completed'),
('12345678-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NULL, 'R2408002', '2024-08-20', '2024-08-21', 6, '이영희', '010-2222-3333', 'lee@email.com', 190000, 190000, 'paid', 'completed'),
('12345678-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NULL, 'R2408003', '2024-08-25', '2024-08-26', 10, '박민수', '010-3333-4444', 'park@email.com', 250000, 250000, 'paid', 'completed');

-- 8. 샘플 리뷰 데이터
INSERT INTO reviews (id, reservation_id, accommodation_id, user_id, rating, title, content, cleanliness_rating, location_rating, value_rating, service_rating)
VALUES 
('87654321-1111-1111-1111-111111111111', '12345678-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, 5, '완벽한 휴가였습니다!', '가족과 함께 정말 좋은 시간을 보냈어요. 수영장도 깨끗하고 바베큐 시설도 완벽했습니다. 다음에 또 이용하고 싶어요!', 5, 4, 4, 5),
('87654321-2222-2222-2222-222222222222', '12345678-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NULL, 4, '자연 속에서 힐링', '조용하고 평화로운 곳이에요. 아이들이 정원에서 뛰어놀기 좋았습니다. 다만 시내에서 조금 멀어요.', 4, 3, 4, 4),
('87654321-3333-3333-3333-333333333333', '12345678-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NULL, 5, '럭셔리한 풀빌라', '온수풀과 사우나가 정말 좋았어요. 시설이 최고급이고 서비스도 완벽했습니다!', 5, 5, 4, 5);

-- 9. 시스템 설정 기본값 업데이트
INSERT INTO system_settings (setting_key, setting_value, description, category, is_public)
VALUES 
('site_title', '"Stay One Day"', '사이트 제목', 'general', true),
('site_description', '"하루살이 숙박 예약 플랫폼"', '사이트 설명', 'general', true),
('contact_email', '"support@stayoneday.co.kr"', '고객센터 이메일', 'contact', true),
('contact_phone', '"1588-1234"', '고객센터 전화', 'contact', true),
('available_regions', '["청주", "세종", "대전", "충남", "충북"]', '서비스 지역', 'service', true),
('featured_categories', '["물놀이 가능 풀빌라", "프라이빗 독채형", "키즈 전용", "반려견 동반 가능", "자연 속 완벽한 휴식"]', '주요 카테고리', 'service', true);

-- 10. 프로모션 샘플 데이터
INSERT INTO promotions (title, description, promotion_type, discount_value, min_amount, start_date, end_date, usage_limit, applicable_regions, applicable_categories)
VALUES 
('신규 오픈 기념 할인', '새로 오픈한 숙소들을 20% 할인된 가격에 만나보세요!', 'discount_rate', 20, 100000, '2025-09-01', '2025-12-31', 100, '{"청주", "세종", "대전"}', '{}'),
('주말 특가 이벤트', '주말 숙박시 15% 할인 혜택을 드립니다.', 'discount_rate', 15, 150000, '2025-09-01', '2025-10-31', 200, '{}', '{}'),
('가족 여행 응원 할인', '4인 이상 예약시 특별 할인을 제공합니다.', 'discount_amount', 30000, 200000, '2025-09-01', '2025-11-30', 150, '{}', '{"키즈 전용"}');

-- 11. SMS 템플릿 샘플
INSERT INTO sms_templates (business_id, template_name, template_type, message_content, variables, send_timing)
VALUES 
('11111111-1111-1111-1111-111111111111', '체크인 안내', 'checkin', '안녕하세요 {고객명}님! 구공스테이 체크인 안내드립니다. 주소: {숙소주소}, 입실번호: {출입번호}, 연락처: {연락처}', '["고객명", "숙소주소", "출입번호", "연락처"]', '2_hours_before'),
('11111111-1111-1111-1111-111111111111', '체크아웃 안내', 'checkout', '{고객명}님 즐거우셨나요? 체크아웃 시간은 11시까지입니다. 예약번호: {예약번호}, 문의: {연락처}', '["고객명", "예약번호", "연락처"]', '1_hour_before');

COMMENT ON TABLE accommodations IS '샘플 데이터가 포함된 숙소 테이블';
COMMENT ON TABLE reviews IS '실제 고객 리뷰를 반영한 샘플 데이터';

-- 샘플 데이터 삽입 완료 메시지
SELECT 'Stay One Day 샘플 데이터 삽입이 완료되었습니다!' as message;