-- 하드코딩된 히어로 텍스트들을 데이터베이스에 추가
-- 기존 기본 데이터 삭제 후 새로운 데이터 추가

DELETE FROM hero_texts;

INSERT INTO hero_texts (english_phrase, main_text, sub_text, display_order, is_active) VALUES
('Perfect Moments', '시간이 멈춰진 듯한', '특별한 순간, 첫 예약 시 15% 할인', 1, true),
('Nature''s Gift', '자연이 선사하는', '힐링 스테이 · 연박 시 추가 20% 할인', 2, true),
('Precious Time', '소중한 사람들과', '커플 패키지 · 프라이빗 브런치 포함', 3, true),
('Beyond Ordinary', '일상의 경계를 넘어', '주말 특가 · 조식 서비스 무료', 4, true),
('Your Own World', '감성이 흘러넘치는', '프라이빗 빌라 · 레이트 체크아웃 무료', 5, true),
('True Rest', '여행의 끝에서 만나는', '월간 멤버십 · 매월 특별가 제공', 6, true),
('Unforgettable', '마음속 깊이 새겨질', '기념일 패키지 · 케이크&샴페인 증정', 7, true),
('Urban Paradise', '도심 속에서 찾은', '시티 뷰 스테이 · 파킹 서비스 무료', 8, true),
('Starlit Dreams', '별빛이 내리는 밤', '루프탑 스테이 · 바베큐 세트 포함', 9, true),
('Freedom Breeze', '바람에 실려오는', '오션 뷰 · 선셋 디너 패키지', 10, true),
('Sunshine Stay', '햇살이 머무는', '모닝 스페셜 · 웰컴 드링크 서비스', 11, true),
('Memory Weaver', '추억을 수놓는', '포토 스테이 · 전문 촬영 서비스 포함', 12, true),
('Silent Sanctuary', '고요함 속에서 찾는', '디지털 디톡스 · 스파 트리트먼트 무료', 13, true),
('Heartfelt Haven', '감동이 머무는', '감성 스테이 · 핸드메이드 웰컴 키트', 14, true),
('New Chapter', '설렘이 시작되는', '신규 오픈 기념 · 30일간 특별가', 15, true),
('Creative Refuge', '영감이 피어나는', '크리에이터 패키지 · 작업 공간 제공', 16, true),
('Warm Embrace', '온기가 전해지는', '윈터 스페셜 · 온수풀 & 사우나', 17, true),
('Dreams Come True', '꿈이 현실이 되는', '드림 스테이 · 개인 컨시어지 서비스', 18, true);

-- 처음 5개만 활성화하고 나머지는 비활성화
UPDATE hero_texts SET is_active = false WHERE display_order > 5;