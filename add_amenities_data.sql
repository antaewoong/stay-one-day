-- 현재 테스트 중인 숙소(257e29d3-7429-4148-8dd9-7d7c83fd58ff)에 편의시설 데이터 추가

INSERT INTO accommodation_amenities (accommodation_id, amenity_type, amenity_name, is_available)
VALUES 
('257e29d3-7429-4148-8dd9-7d7c83fd58ff', 'wifi', '와이파이', true),
('257e29d3-7429-4148-8dd9-7d7c83fd58ff', 'water', '물받이', true),
('257e29d3-7429-4148-8dd9-7d7c83fd58ff', 'house', '독채', true),
('257e29d3-7429-4148-8dd9-7d7c83fd58ff', 'bbq', '개별바비큐', true),
('257e29d3-7429-4148-8dd9-7d7c83fd58ff', 'bedroom', '침대방', true),
('257e29d3-7429-4148-8dd9-7d7c83fd58ff', 'family', '가족실', true),
('257e29d3-7429-4148-8dd9-7d7c83fd58ff', 'group', '단체', true),
('257e29d3-7429-4148-8dd9-7d7c83fd58ff', 'pool', '수영장', true),
('257e29d3-7429-4148-8dd9-7d7c83fd58ff', 'parking', '주차장', true),
('257e29d3-7429-4148-8dd9-7d7c83fd58ff', 'aircon', '에어컨', true),
('257e29d3-7429-4148-8dd9-7d7c83fd58ff', 'tv', 'TV', true)
ON CONFLICT DO NOTHING;

-- 다른 숙소들에도 기본 편의시설 추가
INSERT INTO accommodation_amenities (accommodation_id, amenity_type, amenity_name, is_available)
SELECT 
    id,
    'wifi',
    '와이파이', 
    true
FROM accommodations 
WHERE id NOT IN (
    SELECT DISTINCT accommodation_id 
    FROM accommodation_amenities 
    WHERE amenity_type = 'wifi'
)
ON CONFLICT DO NOTHING;

INSERT INTO accommodation_amenities (accommodation_id, amenity_type, amenity_name, is_available)
SELECT 
    id,
    'parking',
    '주차장', 
    true
FROM accommodations 
WHERE id NOT IN (
    SELECT DISTINCT accommodation_id 
    FROM accommodation_amenities 
    WHERE amenity_type = 'parking'
)
ON CONFLICT DO NOTHING;

INSERT INTO accommodation_amenities (accommodation_id, amenity_type, amenity_name, is_available)
SELECT 
    id,
    'aircon',
    '에어컨', 
    true
FROM accommodations 
WHERE id NOT IN (
    SELECT DISTINCT accommodation_id 
    FROM accommodation_amenities 
    WHERE amenity_type = 'aircon'
)
ON CONFLICT DO NOTHING;