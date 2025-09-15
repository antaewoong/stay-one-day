-- 주간 프롬프트 팩 테이블
CREATE TABLE IF NOT EXISTS weekly_prompt_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL, -- 해당 주의 월요일 (YYYY-MM-DD)
  version INT NOT NULL DEFAULT 1,
  prompts JSONB NOT NULL, -- 4가지 템플릿별 프롬프트
  trend_analysis JSONB NOT NULL, -- 트렌드 분석 결과
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied_at TIMESTAMP WITH TIME ZONE, -- 실제 적용 시점
  is_active BOOLEAN DEFAULT false, -- 현재 활성화된 팩 여부
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 주차별 유니크 버전
  UNIQUE(week_start, version)
);

-- 트렌드 시그널 저장 테이블
CREATE TABLE IF NOT EXISTS trend_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'instagram', 'naver')),
  category TEXT NOT NULL, -- seed + region 조합
  url TEXT NOT NULL,
  title TEXT,
  caption TEXT,
  hashtags TEXT[] DEFAULT '{}', -- 해시태그 배열
  duration_sec INT, -- 영상 길이 (초)
  views INT DEFAULT 0,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE,
  features JSONB, -- 비태그 신호들 (cuts, color_tone, bgm_tempo 등)
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  week_start DATE NOT NULL, -- 수집 주차
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 중복 방지 인덱스
  UNIQUE(platform, url, week_start)
);

-- 프롬프트 팩 변경 히스토리
CREATE TABLE IF NOT EXISTS prompt_pack_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID REFERENCES weekly_prompt_packs(id),
  action TEXT NOT NULL CHECK (action IN ('created', 'applied', 'reverted')),
  old_prompts JSONB,
  new_prompts JSONB,
  reason TEXT,
  performed_by UUID, -- 수행자 (시스템 또는 사용자)
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 씨앗 태그와 모디파이어 조합 마스터
CREATE TABLE IF NOT EXISTS prompt_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('seed', 'modifier', 'region')),
  keyword TEXT NOT NULL,
  category TEXT, -- 카테고리별 그룹핑
  popularity_score FLOAT DEFAULT 0, -- 인기도 점수 (트렌드 분석 기반)
  last_used_week DATE, -- 마지막 사용 주차
  performance_avg FLOAT DEFAULT 0, -- 평균 성과
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(type, keyword)
);

-- 기본 씨앗 태그 데이터 삽입
INSERT INTO prompt_keywords (type, keyword, category, is_active) VALUES
('seed', '풀빌라', 'accommodation', true),
('seed', '펜션', 'accommodation', true),
('seed', '스테이', 'accommodation', true),
('seed', '감성스테이', 'accommodation', true);

-- 지역 태그 데이터 삽입
INSERT INTO prompt_keywords (type, keyword, category, is_active) VALUES
('region', '가평', 'location', true),
('region', '제주', 'location', true),
('region', '양양', 'location', true),
('region', '강릉', 'location', true),
('region', '포천', 'location', true),
('region', '춘천', 'location', true),
('region', '경주', 'location', true),
('region', '통영', 'location', true);

-- 모디파이어 태그 데이터 삽입
INSERT INTO prompt_keywords (type, keyword, category, is_active) VALUES
('modifier', '키즈풀', 'facility', true),
('modifier', '가족', 'target', true),
('modifier', '브라이덜파티', 'event', true),
('modifier', '워크샵', 'business', true),
('modifier', '스파', 'facility', true),
('modifier', '바베큐', 'activity', true),
('modifier', '힐링', 'mood', true),
('modifier', '감성', 'mood', true),
('modifier', '럭셔리', 'grade', true),
('modifier', '프리미엄', 'grade', true);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_weekly_prompt_packs_week ON weekly_prompt_packs(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_prompt_packs_active ON weekly_prompt_packs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_trend_signals_platform ON trend_signals(platform);
CREATE INDEX IF NOT EXISTS idx_trend_signals_week ON trend_signals(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_trend_signals_collected ON trend_signals(collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_keywords_type ON prompt_keywords(type, is_active) WHERE is_active = true;

-- RLS 정책 (Row Level Security)
ALTER TABLE weekly_prompt_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_pack_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_keywords ENABLE ROW LEVEL SECURITY;

-- 관리자만 읽기/쓰기 가능
CREATE POLICY "Admin only access for prompt packs" ON weekly_prompt_packs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = users.id
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin only access for trend signals" ON trend_signals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = users.id
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin only access for prompt history" ON prompt_pack_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = users.id
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin only access for keywords" ON prompt_keywords
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = users.id
      AND users.role = 'admin'
    )
  );

-- 트리거: 프롬프트 팩 활성화 시 다른 팩 비활성화
CREATE OR REPLACE FUNCTION activate_single_prompt_pack()
RETURNS TRIGGER AS $$
BEGIN
  -- 새로 활성화되는 팩이 있으면 같은 주차의 다른 팩들 비활성화
  IF NEW.is_active = true AND OLD.is_active = false THEN
    UPDATE weekly_prompt_packs
    SET is_active = false, updated_at = NOW()
    WHERE week_start = NEW.week_start
    AND id != NEW.id
    AND is_active = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_activate_single_prompt_pack
  BEFORE UPDATE ON weekly_prompt_packs
  FOR EACH ROW
  EXECUTE FUNCTION activate_single_prompt_pack();

-- 트리거: updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_weekly_prompt_packs_updated_at
  BEFORE UPDATE ON weekly_prompt_packs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_prompt_keywords_updated_at
  BEFORE UPDATE ON prompt_keywords
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 뷰: 현재 활성 프롬프트 팩
CREATE OR REPLACE VIEW current_active_prompt_pack AS
SELECT *
FROM weekly_prompt_packs
WHERE is_active = true
ORDER BY week_start DESC, version DESC
LIMIT 1;

-- 뷰: 이번 주 트렌드 시그널 통계
CREATE OR REPLACE VIEW current_week_trend_stats AS
SELECT
  platform,
  COUNT(*) as signal_count,
  AVG(views) as avg_views,
  AVG(likes) as avg_likes,
  AVG(duration_sec) as avg_duration,
  AVG((features->>'estimated_cuts')::float) as avg_cuts,
  MODE() WITHIN GROUP (ORDER BY features->>'color_tone') as popular_color_tone,
  MODE() WITHIN GROUP (ORDER BY features->>'bgm_tempo') as popular_bgm_tempo
FROM trend_signals
WHERE week_start = (
  SELECT DATE_TRUNC('week', CURRENT_DATE)::date + INTERVAL '0 days'
)
GROUP BY platform;

COMMENT ON TABLE weekly_prompt_packs IS '주간별 AI 비디오 생성 프롬프트 팩';
COMMENT ON TABLE trend_signals IS '소셜미디어 트렌드 시그널 수집 데이터';
COMMENT ON TABLE prompt_pack_history IS '프롬프트 팩 변경 히스토리';
COMMENT ON TABLE prompt_keywords IS '씨앗 태그, 모디파이어, 지역 키워드 마스터';
COMMENT ON VIEW current_active_prompt_pack IS '현재 활성화된 프롬프트 팩';
COMMENT ON VIEW current_week_trend_stats IS '이번 주 트렌드 시그널 통계';