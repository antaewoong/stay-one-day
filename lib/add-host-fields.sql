-- 호스트 관련 필드 추가
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS host_id VARCHAR(100);
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS host_name VARCHAR(100);
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS host_business_name VARCHAR(255);
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending'; -- 'pending', 'approved', 'rejected'

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_accommodations_host_id ON accommodations(host_id);
CREATE INDEX IF NOT EXISTS idx_accommodations_approval_status ON accommodations(approval_status);

-- 샘플 숙소 데이터 삽입 (실제 운영용)
INSERT INTO accommodations (
  name, 
  description, 
  location, 
  type, 
  base_price, 
  base_guests, 
  additional_guest_fee, 
  max_guests,
  check_in_time,
  check_out_time,
  amenities,
  options,
  images,
  rating,
  review_count,
  is_active,
  host_id,
  host_name,
  host_business_name,
  approval_status
) VALUES 
-- 구공스테이 숙소들
(
  '구공스테이 청주 프라이빗 풀빌라',
  '청주에서 가장 인기 있는 프라이빗 풀빌라입니다. 독립적인 수영장과 바베큐 시설, 그리고 넓은 거실에서 편안한 시간을 보내실 수 있습니다. 애견 동반도 가능합니다.',
  '충북 청주시 청원구',
  '풀빌라',
  180000,
  4,
  20000,
  10,
  '15:00',
  '11:00',
  '["수영장", "바베큐시설", "주차장", "에어컨", "와이파이", "애견동반가능", "세탁기", "건조기", "냉장고", "전자레인지"]'::jsonb,
  '[{"name": "숯불 바베큐 세트", "price": 30000}, {"name": "튜브 대여", "price": 10000}, {"name": "애견용품 세트", "price": 15000}]'::jsonb,
  '["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800", "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800", "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800"]'::jsonb,
  4.9,
  147,
  true,
  'host-1',
  '김호스트',
  '구공스테이',
  'approved'
),
(
  '구공스테이 세종 힐링 독채 펜션',
  '자연 속에서 힐링할 수 있는 독채형 펜션입니다. 조용한 환경과 깨끗한 시설로 가족단위나 커플들에게 인기가 높습니다.',
  '세종특별자치시 연기면',
  '독채',
  120000,
  2,
  15000,
  8,
  '15:00',
  '11:00',
  '["주차장", "에어컨", "와이파이", "취사시설", "냉장고", "전자레인지", "세탁기", "바베큐시설"]'::jsonb,
  '[{"name": "바베큐 세트", "price": 25000}, {"name": "캠프파이어", "price": 20000}]'::jsonb,
  '["https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800", "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800", "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800"]'::jsonb,
  4.7,
  89,
  true,
  'host-1',
  '김호스트',
  '구공스테이',
  'approved'
),

-- 스테이도고 숙소들
(
  '스테이도고 대전 스카이뷰 루프탑',
  '대전 시내가 한눈에 내려다보이는 루프탑 펜션입니다. 로맨틱한 분위기와 도시적 감각이 조화된 공간입니다.',
  '대전광역시 유성구',
  '루프탑',
  160000,
  2,
  18000,
  6,
  '15:00',
  '11:00',
  '["루프탑", "시티뷰", "주차장", "에어컨", "와이파이", "취사시설", "냉장고", "음향시설"]'::jsonb,
  '[{"name": "샴페인 세트", "price": 50000}, {"name": "케이크 주문", "price": 35000}, {"name": "플라워 데코", "price": 40000}]'::jsonb,
  '["https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800", "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800", "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800"]'::jsonb,
  4.8,
  67,
  true,
  'host-2',
  '박호스트',
  '스테이도고',
  'approved'
),

-- 마담아네뜨 숙소들
(
  '마담아네뜨 천안 프렌치 풀빌라',
  '프렌치 감성이 물씬 느껴지는 풀빌라입니다. 인스타그래머들이 선택하는 감성적인 공간으로 유명합니다.',
  '충남 천안시 동남구',
  '풀빌라',
  200000,
  4,
  25000,
  8,
  '15:00',
  '11:00',
  '["수영장", "감성 인테리어", "주차장", "에어컨", "와이파이", "바베큐시설", "취사시설", "세탁기", "건조기"]'::jsonb,
  '[{"name": "프렌치 브런치", "price": 45000}, {"name": "와인 세트", "price": 80000}, {"name": "사진 촬영 소품", "price": 20000}]'::jsonb,
  '["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800", "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", "https://images.unsplash.com/photo-1520637836862-4d197d17c36a?w=800"]'::jsonb,
  4.9,
  112,
  true,
  'host-3',
  '이호스트',
  '마담아네뜨',
  'approved'
),

-- 추가 숙소들
(
  '청주 애견동반 풀빌라',
  '반려동물과 함께 즐길 수 있는 풀빌라입니다. 애견 전용 시설과 놀이터가 마련되어 있습니다.',
  '충북 청주시 서원구',
  '풀빌라',
  150000,
  4,
  20000,
  8,
  '15:00',
  '11:00',
  '["수영장", "애견동반가능", "애견놀이터", "애견샤워장", "주차장", "에어컨", "와이파이", "바베큐시설"]'::jsonb,
  '[{"name": "애견용품 대여", "price": 25000}, {"name": "애견 간식 세트", "price": 15000}]'::jsonb,
  '["https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800", "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800"]'::jsonb,
  4.6,
  45,
  true,
  'host-1',
  '김호스트',
  '구공스테이',
  'approved'
),

(
  '세종 가족형 독채 펜션',
  '넓은 거실과 여러 개의 침실로 구성된 가족 단위 이용에 최적화된 독채입니다. 아이들이 뛰어놀 수 있는 마당도 있습니다.',
  '세종특별자치시 부강면',
  '독채',
  100000,
  6,
  10000,
  12,
  '15:00',
  '11:00',
  '["넓은 거실", "3개 침실", "아이놀이방", "마당", "주차장", "에어컨", "와이파이", "취사시설", "바베큐시설"]'::jsonb,
  '[{"name": "아이 용품 세트", "price": 20000}, {"name": "보드게임", "price": 10000}]'::jsonb,
  '["https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800", "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800"]'::jsonb,
  4.5,
  23,
  true,
  'host-2',
  '박호스트',
  '스테이도고',
  'approved'
)

ON CONFLICT DO NOTHING;