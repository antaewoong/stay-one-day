-- 최소한의 테스트 데이터만 삽입 (에러 방지용)

-- 1. 사업자 계정 (간단한 버전)
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
);

-- 2. 숙소 2개 (테스트용)
INSERT INTO accommodations (id, business_id, name, description, accommodation_type, address, detailed_address, latitude, longitude, region, max_capacity, bedrooms, bathrooms, base_price, weekend_price, status, is_featured)
VALUES 
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  '구공스테이 청주점',
  '청주 시내 중심가에 위치한 프리미엄 독채 풀빌라입니다.',
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
  '자연 속 힐링 공간으로 완벽한 프라이빗한 휴식을 제공합니다.',
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
);

-- 3. 이미지 (각 숙소마다 1개씩만)
INSERT INTO accommodation_images (accommodation_id, image_url, image_type, display_order, alt_text)
VALUES 
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
  'main',
  1,
  '구공스테이 청주점 메인'
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800',
  'main',
  1,
  '세종빌라리조트 메인'
);

-- 4. 카테고리 (간단하게)
INSERT INTO accommodation_categories (accommodation_id, category)
VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '물놀이 가능 풀빌라'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '프라이빗 독채형'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '자연 속 완벽한 휴식');

-- 5. 편의시설 (간단하게)
INSERT INTO accommodation_amenities (accommodation_id, amenity_type, amenity_name, is_available)
VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pool', '야외 수영장', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'wifi', '무료 Wi-Fi', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'wifi', '무료 Wi-Fi', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'garden', '정원', true);

SELECT '최소 테스트 데이터 삽입 완료!' as message;