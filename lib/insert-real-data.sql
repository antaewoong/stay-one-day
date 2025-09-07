-- Stay One Day 실제 숙소 데이터 입력
-- 기존 데이터 정리 후 실제 운영 데이터 삽입

-- 1. 기존 더미 데이터 삭제
DELETE FROM accommodation_images;
DELETE FROM accommodation_amenities;
DELETE FROM accommodation_categories;
DELETE FROM accommodations;

-- 2. 호스트 데이터 생성 (필요 시)
INSERT INTO hosts (
  id, business_name, host_name, phone, email
) VALUES 
(
  '11111111-1111-1111-1111-111111111111',
  'Stay One Day 청주점',
  '김호스트',
  '010-1234-5678', 
  'host.cheongju@stay-oneday.com'
) ON CONFLICT (id) DO NOTHING;

-- 3. 실제 숙소 데이터 삽입
INSERT INTO accommodations (
  id, business_id, name, description, accommodation_type, address, detailed_address, 
  latitude, longitude, region, max_capacity, bedrooms, bathrooms, 
  base_price, weekend_price, checkin_time, checkout_time, 
  status, is_featured, host_id
) VALUES 
-- 구공스테이 청주 메인홀
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  '구공스테이 청주 메인홀',
  '충북 청주시에 위치한 프리미엄 풀빌라입니다. 넓은 실내와 프라이빗 풀장, 바베큐 시설을 갖추어 가족 및 단체 모임에 최적화된 공간입니다. 최대 20명까지 이용 가능하며, 깨끗하고 모던한 인테리어로 편안한 휴식을 제공합니다.',
  '풀빌라',
  '충청북도 청주시 청원구 오창읍 각리2길 123',
  '메인홀 전체',
  36.6424341,
  127.4890319,
  '청주',
  20,
  4,
  3,
  180000,
  220000,
  '15:00:00',
  '11:00:00',
  'active',
  true,
  '11111111-1111-1111-1111-111111111111'
),
-- 구공스테이 광덕
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '11111111-1111-1111-1111-111111111111',
  '구공스테이 광덕',
  '광덕산 근처에 위치한 조용한 자연 속 독채형 펜션입니다. 도시의 소음에서 벗어나 진정한 자연을 만끽할 수 있으며, 가족 단위 여행객들에게 완벽한 힐링 공간을 제공합니다.',
  '독채',
  '충청북도 청주시 상당구 미원면 광덕리 456',
  '광덕동 독채',
  36.5234567,
  127.3456789,
  '청주',
  8,
  3,
  2,
  150000,
  190000,
  '15:00:00',
  '11:00:00',
  'active',
  true,
  '11111111-1111-1111-1111-111111111111'
),
-- 구공스테이 본디
(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-1111-1111-111111111111',
  '구공스테이 본디',
  '본디의 세련된 인테리어와 완벽한 프라이버시를 제공하는 독채 공간입니다. 모던한 디자인과 최신 시설을 갖추어 편안하고 스타일리시한 숙박 경험을 제공합니다.',
  '독채',
  '충청북도 청주시 서원구 본디로 789',
  '본디동 독채 전체',
  36.6123456,
  127.4567890,
  '청주',
  8,
  3,
  2,
  160000,
  200000,
  '15:00:00',
  '11:00:00',
  'active',
  true,
  '11111111-1111-1111-1111-111111111111'
),
-- 구공스테이 사사담 사이
(
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '11111111-1111-1111-1111-111111111111',
  '구공스테이 사사담 사이',
  '사사담 사이에서 도시의 소음을 벗어나 진정한 휴식을 취할 수 있는 한적한 전원 속 펜션입니다. 자연과 조화를 이룬 공간에서 특별한 힐링 경험을 선사합니다.',
  '펜션',
  '충청북도 청주시 청원구 사천면 사사담길 321',
  '사사담 사이동',
  36.7890123,
  127.5678901,
  '청주',
  6,
  2,
  1,
  140000,
  180000,
  '15:00:00',
  '11:00:00',
  'active',
  false,
  '11111111-1111-1111-1111-111111111111'
),
-- 구공스테이 소소한옥
(
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '11111111-1111-1111-1111-111111111111',
  '구공스테이 소소한옥',
  '전통 한옥의 정취와 현대적 편의시설이 조화된 특별한 스테이입니다. 한국의 전통 문화를 체험할 수 있으며, 따뜻한 온돌과 아름다운 한옥 구조를 만끽할 수 있습니다.',
  '한옥',
  '충청북도 청주시 상당구 한옥마을길 654',
  '소소한옥 전체',
  36.6345678,
  127.4789012,
  '청주',
  10,
  4,
  2,
  170000,
  210000,
  '15:00:00',
  '11:00:00',
  'active',
  true,
  '11111111-1111-1111-1111-111111111111'
),
-- 구공스테이 하루여백
(
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  '11111111-1111-1111-1111-111111111111',
  '구공스테이 하루여백',
  '하루여백에서 바쁜 일상의 여백을 만들어보세요. 여유로운 공간 구성과 편안한 분위기로 진정한 휴식을 제공하며, 개인적인 시간과 공간을 중시하는 분들에게 완벽합니다.',
  '독채',
  '충청북도 청주시 흥덕구 여백로 987',
  '하루여백 독채',
  36.6567890,
  127.5012345,
  '청주',
  6,
  2,
  2,
  130000,
  170000,
  '15:00:00',
  '11:00:00',
  'active',
  false,
  '11111111-1111-1111-1111-111111111111'
);

-- 4. 숙소 이미지 데이터 삽입
INSERT INTO accommodation_images (
  accommodation_id, image_url, image_type, display_order, alt_text
) VALUES 
-- 구공스테이 청주 메인홀 이미지
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '/images/90staycj/1.jpg', 'main', 1, '구공스테이 청주 메인홀 메인 사진'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '/images/90staycj/2.jpg', 'general', 2, '구공스테이 청주 메인홀 실내'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '/images/90staycj/3.jpg', 'general', 3, '구공스테이 청주 메인홀 풀'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '/images/90staycj/4.jpg', 'general', 4, '구공스테이 청주 메인홀 바베큐'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '/images/90staycj/5.jpg', 'room', 5, '구공스테이 청주 메인홀 침실'),

-- 구공스테이 광덕 이미지
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '/images/stays/구공스테이 광덕.jpeg', 'main', 1, '구공스테이 광덕 메인 사진'),

-- 구공스테이 본디 이미지
('cccccccc-cccc-cccc-cccc-cccccccccccc', '/images/stays/구공스테이 본디.jpeg', 'main', 1, '구공스테이 본디 메인 사진'),

-- 구공스테이 사사담 사이 이미지
('dddddddd-dddd-dddd-dddd-dddddddddddd', '/images/stays/구공스테이 사사담 사이.jpeg', 'main', 1, '구공스테이 사사담 사이 메인 사진'),

-- 구공스테이 소소한옥 이미지
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '/images/stays/구공스테이 소소한옥.jpeg', 'main', 1, '구공스테이 소소한옥 메인 사진'),

-- 구공스테이 하루여백 이미지
('ffffffff-ffff-ffff-ffff-ffffffffffff', '/images/stays/구공스테이 하루여백.jpeg', 'main', 1, '구공스테이 하루여백 메인 사진');

-- 5. 편의시설 데이터 삽입
INSERT INTO accommodation_amenities (
  accommodation_id, amenity_type, amenity_name, is_available, additional_info
) VALUES 
-- 구공스테이 청주 메인홀 편의시설
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '수영장', '프라이빗 풀', true, '온수 기능 포함'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '바베큐', '바베큐 시설', true, '숯과 그릴 제공'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '주차', '주차장', true, '최대 5대'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '네트워크', 'WiFi', true, '무료 와이파이'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '냉난방', '에어컨', true, '전 구역 냉난방'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '주방', '취사 가능', true, '완전한 주방 시설'),

-- 구공스테이 광덕 편의시설
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '자연', '숲뷰', true, '광덕산 전망'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '바베큐', '바베큐 시설', true, '야외 바베큐'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '주차', '주차장', true, '3대 가능'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '네트워크', 'WiFi', true, '무료 와이파이'),

-- 구공스테이 본디 편의시설
('cccccccc-cccc-cccc-cccc-cccccccccccc', '디자인', '모던 인테리어', true, '세련된 디자인'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '주방', '주방 시설', true, '완비된 주방'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '네트워크', 'WiFi', true, '고속 인터넷'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '주차', '주차장', true, '2대 가능'),

-- 구공스테이 사사담 사이 편의시설
('dddddddd-dddd-dddd-dddd-dddddddddddd', '자연', '전원뷰', true, '한적한 전원 풍경'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '힐링', '조용한 환경', true, '도시 소음 차단'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '네트워크', 'WiFi', true, '무료 와이파이'),

-- 구공스테이 소소한옥 편의시설
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '전통', '한옥 체험', true, '전통 온돌 난방'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '문화', '전통 문화', true, '한옥 건축 체험'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '마당', '전통 마당', true, '아름다운 한옥 마당'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '네트워크', 'WiFi', true, '무료 와이파이'),

-- 구공스테이 하루여백 편의시설
('ffffffff-ffff-ffff-ffff-ffffffffffff', '힐링', '여유로운 공간', true, '개인적인 시간 보장'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', '프라이빗', '프라이버시', true, '완전 독립 공간'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', '네트워크', 'WiFi', true, '무료 와이파이');

-- 6. 카테고리 데이터 삽입
INSERT INTO accommodation_categories (
  accommodation_id, category
) VALUES 
-- 구공스테이 청주 메인홀 카테고리
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '풀빌라'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '인기 1위'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '대형'),

-- 구공스테이 광덕 카테고리
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '독채'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '자연 친화'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '힐링'),

-- 구공스테이 본디 카테고리  
('cccccccc-cccc-cccc-cccc-cccccccccccc', '독채'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '모던'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '스타일리시'),

-- 구공스테이 사사담 사이 카테고리
('dddddddd-dddd-dddd-dddd-dddddddddddd', '펜션'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '힐링'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '조용함'),

-- 구공스테이 소소한옥 카테고리
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '한옥'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '전통 문화'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '체험'),

-- 구공스테이 하루여백 카테고리
('ffffffff-ffff-ffff-ffff-ffffffffffff', '독채'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', '여유'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', '프라이빗');

-- 7. 데이터 삽입 완료 확인
SELECT COUNT(*) as total_accommodations FROM accommodations;
SELECT COUNT(*) as total_images FROM accommodation_images;  
SELECT COUNT(*) as total_amenities FROM accommodation_amenities;
SELECT COUNT(*) as total_categories FROM accommodation_categories;