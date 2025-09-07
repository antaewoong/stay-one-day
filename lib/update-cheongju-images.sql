-- 구공스테이 청주점 이미지 업데이트 (메인 이미지 포함 10장 선별)

-- 구공스테이 청주점 이미지를 실제 이미지들로 업데이트
UPDATE accommodations 
SET images = ARRAY[
  '/images/90staycj/1.jpg',
  '/images/90staycj/2.jpg', 
  '/images/90staycj/3.jpg',
  '/images/90staycj/4.jpg',
  '/images/90staycj/5.jpg',
  '/images/90staycj/6.jpg',
  '/images/90staycj/7.jpg',
  '/images/90staycj/8.jpg',
  '/images/90staycj/9.jpg',
  '/images/90staycj/10.jpg'
]
WHERE name = '구공스테이 청주점';

-- 결과 확인
SELECT id, name, images FROM accommodations WHERE name = '구공스테이 청주점';