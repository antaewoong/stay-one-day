-- 스테이폴리오 스타일 다양한 뱃지 시스템
-- 뱃지 타입 테이블
CREATE TABLE IF NOT EXISTS badge_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- 뱃지 이름 (PICK, NEW, HOT, LIMITED, SALE 등)
  label TEXT NOT NULL, -- 표시될 텍스트 
  color_scheme TEXT NOT NULL DEFAULT 'red', -- red, blue, green, orange, purple, pink, gray
  background_color TEXT NOT NULL DEFAULT 'bg-red-500', -- Tailwind 클래스
  text_color TEXT NOT NULL DEFAULT 'text-white', -- Tailwind 클래스
  border_color TEXT, -- 선택적 테두리 색상
  icon TEXT, -- 선택적 아이콘 이름
  priority INTEGER DEFAULT 0, -- 우선순위 (높을수록 먼저 표시)
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 숙소-뱃지 연결 테이블
CREATE TABLE IF NOT EXISTS accommodation_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  accommodation_id UUID NOT NULL,
  badge_type_id UUID NOT NULL REFERENCES badge_types(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE, -- 선택적 만료일 (예: 세일 뱃지)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 하나의 숙소는 동일한 뱃지 타입을 중복해서 가질 수 없음
  UNIQUE(accommodation_id, badge_type_id)
);

-- 기본 뱃지 타입들 삽입 (스테이폴리오 스타일)
INSERT INTO badge_types (name, label, color_scheme, background_color, text_color, priority) VALUES
-- 추천 계열
('PICK', 'PICK', 'red', 'bg-red-500/90', 'text-white', 10),
('RECOMMENDED', '추천', 'red', 'bg-red-600/90', 'text-white', 9),
('EDITOR_PICK', '에디터 추천', 'red', 'bg-red-700/90', 'text-white', 8),

-- 인기/핫 계열  
('HOT', 'HOT', 'orange', 'bg-gradient-to-r from-orange-500 to-red-500', 'text-white', 7),
('POPULAR', '인기', 'orange', 'bg-orange-500/90', 'text-white', 6),
('TRENDING', '실시간 인기', 'orange', 'bg-orange-600/90', 'text-white', 5),

-- 신규 계열
('NEW', 'NEW', 'blue', 'bg-blue-500/90', 'text-white', 4),
('OPENING', '오픈 기념', 'blue', 'bg-blue-600/90', 'text-white', 3),

-- 할인/세일 계열
('SALE', 'SALE', 'green', 'bg-green-500/90', 'text-white', 15),
('DISCOUNT', '할인', 'green', 'bg-green-600/90', 'text-white', 14),
('LIMITED', '한정특가', 'purple', 'bg-purple-600/90', 'text-white', 13),
('WEEKEND_DEAL', '주말특가', 'purple', 'bg-purple-500/90', 'text-white', 12),

-- 프리미엄 계열
('PREMIUM', '프리미엄', 'gray', 'bg-gray-800/90', 'text-white', 11),
('LUXURY', '럭셔리', 'gray', 'bg-gray-900/90', 'text-white', 10),

-- 특수 계열
('PET_FRIENDLY', '반려견 동반', 'pink', 'bg-pink-500/90', 'text-white', 2),
('KIDS_FRIENDLY', '아이와 함께', 'emerald', 'bg-emerald-500/90', 'text-white', 1),
('PARTY_OK', '파티 가능', 'violet', 'bg-violet-500/90', 'text-white', 1),

-- 화이트 계열 (할인율 등)
('DISCOUNT_PERCENT', '', 'white', 'bg-white/95', 'text-gray-900', 16) -- 동적 텍스트용 (-20% 등)

ON CONFLICT (name) DO NOTHING;

-- RLS 정책 설정
ALTER TABLE badge_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodation_badges ENABLE ROW LEVEL SECURITY;

-- 뱃지 타입은 모든 사용자가 읽을 수 있음
CREATE POLICY "badge_types_public_read" ON badge_types FOR SELECT USING (true);

-- 뱃지 타입 수정은 관리자만 가능
CREATE POLICY "badge_types_admin_write" ON badge_types 
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin')
) WITH CHECK (
  public.get_user_role() IN ('super_admin', 'admin')
);

-- 숙소 뱃지는 공개 읽기 (활성화된 것만)
CREATE POLICY "accommodation_badges_public_read" ON accommodation_badges 
FOR SELECT USING (
  active = true AND 
  (expires_at IS NULL OR expires_at > NOW())
);

-- 숙소 뱃지 관리는 관리자와 해당 숙소 호스트만 가능
CREATE POLICY "accommodation_badges_owner_write" ON accommodation_badges 
FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin') OR
  EXISTS (
    SELECT 1 FROM accommodations a 
    WHERE a.id = accommodation_id 
    AND a.host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
  )
) WITH CHECK (
  public.get_user_role() IN ('super_admin', 'admin') OR
  EXISTS (
    SELECT 1 FROM accommodations a 
    WHERE a.id = accommodation_id 
    AND a.host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid())
  )
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_badge_types_priority ON badge_types(priority DESC, active);
CREATE INDEX IF NOT EXISTS idx_accommodation_badges_accommodation ON accommodation_badges(accommodation_id, active);
CREATE INDEX IF NOT EXISTS idx_accommodation_badges_expires ON accommodation_badges(expires_at) WHERE expires_at IS NOT NULL;

-- 뱃지 조회용 뷰 (편의성)
CREATE OR REPLACE VIEW accommodation_badges_with_types AS
SELECT 
  ab.accommodation_id,
  ab.id as badge_id,
  bt.name as badge_name,
  bt.label as badge_label,
  bt.color_scheme,
  bt.background_color,
  bt.text_color,
  bt.border_color,
  bt.icon,
  bt.priority,
  ab.expires_at,
  ab.active as badge_active
FROM accommodation_badges ab
JOIN badge_types bt ON ab.badge_type_id = bt.id
WHERE ab.active = true 
  AND bt.active = true
  AND (ab.expires_at IS NULL OR ab.expires_at > NOW())
ORDER BY bt.priority DESC, ab.created_at DESC;

-- 뷰에 대한 RLS 정책
ALTER VIEW accommodation_badges_with_types OWNER TO postgres;

COMMENT ON TABLE badge_types IS '뱃지 타입 정의 - 스테이폴리오 스타일';
COMMENT ON TABLE accommodation_badges IS '숙소별 뱃지 할당';
COMMENT ON VIEW accommodation_badges_with_types IS '숙소 뱃지 조회용 뷰 - 우선순위 정렬';