-- 기존 숙소들에 좌표 정보 추가

-- 구공스테이 청주점 (청주시 상당구)
UPDATE accommodations 
SET latitude = '36.6424', longitude = '127.4890'
WHERE name LIKE '%청주%' OR name LIKE '%구공%';

-- 세종빌라리조트 (세종시)
UPDATE accommodations 
SET latitude = '36.4801', longitude = '127.2890'
WHERE name LIKE '%세종%';

-- 대전 힐링풀빌라 (대전 유성구)
UPDATE accommodations 
SET latitude = '36.3505', longitude = '127.3845'
WHERE name LIKE '%대전%';

-- 기타 숙소들에도 임시 좌표값 설정 (청주 지역 중심)
UPDATE accommodations 
SET latitude = '36.6424', longitude = '127.4890'
WHERE latitude IS NULL OR latitude = '' OR longitude IS NULL OR longitude = '';