-- ================================================================
-- Stay One Day - Video Studio Database Schema
-- AI 영상 생성 및 관리 시스템 (Phase 1: 느린 모드 + 큐 시스템)
-- ================================================================

-- 비디오 템플릿 마스터 (프롬프트 & 설정 관리)
CREATE TABLE IF NOT EXISTS video_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'energy-montage', 'story-tour' 등
  version TEXT NOT NULL DEFAULT '1.0.0', -- semver (회귀 방지)
  ratio TEXT NOT NULL DEFAULT '9:16', -- '9:16', '16:9', '1:1'
  duration_sec INT DEFAULT 30, -- 목표 영상 길이 (초)

  -- 프롬프트 시스템
  prompt_base TEXT NOT NULL, -- 기본 프롬프트 템플릿
  prompt_vars JSONB DEFAULT '{}', -- 변수 스키마 정의
  negative_prompt TEXT DEFAULT 'low-res, blurry, text artifacts, distorted faces, watermark',

  -- 브랜딩 & 스타일
  brand_style JSONB DEFAULT '{}', -- 폰트, 컬러, 로고 설정

  -- 슬롯 정의 (6샷 구조)
  slots JSONB NOT NULL DEFAULT '[
    {"key": "outdoor_1", "description": "외관 메인샷", "duration": 5},
    {"key": "outdoor_2", "description": "외관 서브샷", "duration": 4},
    {"key": "indoor_1", "description": "내부 메인", "duration": 5},
    {"key": "indoor_2", "description": "내부 서브", "duration": 4},
    {"key": "facility_1", "description": "편의시설", "duration": 6},
    {"key": "usage_1", "description": "이용 장면", "duration": 6}
  ]'::jsonb,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 비디오 작업 큐 (상태 추적)
CREATE TABLE IF NOT EXISTS video_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL,
  accommodation_id UUID NOT NULL REFERENCES accommodations(id),
  template_id UUID NOT NULL REFERENCES video_templates(id),

  -- 상태 관리
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued',           -- 큐 대기
    'validating',       -- 입력 검증 중
    'generating_clips', -- 런웨이에서 클립 생성 중
    'stitching',        -- FFmpeg 스티칭 중
    'uploading',        -- 스토리지 업로드 중
    'delivered',        -- 완성/배달됨
    'failed'           -- 실패 (재시도 가능/불가능)
  )),

  step TEXT, -- 현재 진행 단계 상세
  error_code TEXT, -- 실패 시 표준 에러코드
  error_message TEXT, -- 실패 상세 메시지

  -- 비용 추적
  cost_credits INT DEFAULT 0, -- 소모된 런웨이 크레딧
  processing_mode TEXT DEFAULT 'relaxed', -- 'turbo' | 'relaxed'

  -- 중복 방지
  dedup_key TEXT UNIQUE, -- hash(templateId + images + vars)

  -- 메타데이터
  runway_task_id TEXT, -- 런웨이 작업 ID
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 비디오 작업 에셋 (업로드된 이미지들)
CREATE TABLE IF NOT EXISTS video_job_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES video_jobs(id) ON DELETE CASCADE,
  slot_key TEXT NOT NULL, -- 'outdoor_1', 'indoor_1' 등

  -- 파일 정보
  file_url TEXT NOT NULL, -- Supabase Storage URL
  filename TEXT,
  width INT,
  height INT,
  file_size_bytes INT,
  file_hash TEXT, -- 중복 검증용

  -- 안전성 검증
  is_safe BOOLEAN DEFAULT NULL, -- 모더레이션 결과
  safety_score DECIMAL(3,2), -- 0.00-1.00
  moderation_details JSONB, -- 상세 검증 결과

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, slot_key)
);

-- 비디오 렌더링 결과
CREATE TABLE IF NOT EXISTS video_renders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES video_jobs(id) ON DELETE CASCADE,

  -- 최종 결과물
  final_path TEXT, -- Supabase Storage 내부 경로
  final_url TEXT, -- 공개 다운로드 URL (서명됨)

  -- 파일 정보
  duration_sec DECIMAL(5,2), -- 실제 영상 길이
  size_mb DECIMAL(8,2), -- 파일 크기 (MB)
  resolution TEXT, -- '1080x1920' 등
  codec_info JSONB, -- 인코딩 상세 정보

  -- 배달 정보
  delivered_at TIMESTAMPTZ,
  email_sent_at TIMESTAMPTZ,
  email_message_id TEXT, -- Resend 메시지 ID

  -- 만료 관리
  signed_url_expires_at TIMESTAMPTZ,
  auto_delete_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'), -- 90일 후 자동 삭제

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 호스트별 월간 영상 쿼터
CREATE TABLE IF NOT EXISTS video_monthly_quota (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL,
  month DATE NOT NULL, -- YYYY-MM-01 형태

  -- 쿼터 관리
  used_count INT DEFAULT 0, -- 이번 달 사용량
  limit_count INT DEFAULT 1, -- 월 한도 (무료: 1편)

  -- 크레딧 추적
  credits_used INT DEFAULT 0, -- 소모된 런웨이 크레딧
  credits_limit INT DEFAULT 150, -- 월 크레딧 한도

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(host_id, month)
);

-- ================================================================
-- 제약조건 및 트리거
-- ================================================================

-- 업데이트 시간 자동 갱신 (재사용)
DROP TRIGGER IF EXISTS video_templates_updated_at ON video_templates;
CREATE TRIGGER video_templates_updated_at
  BEFORE UPDATE ON video_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS video_monthly_quota_updated_at ON video_monthly_quota;
CREATE TRIGGER video_monthly_quota_updated_at
  BEFORE UPDATE ON video_monthly_quota
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 쿼터 증가 트리거
CREATE OR REPLACE FUNCTION increment_video_quota()
RETURNS TRIGGER AS $$
BEGIN
  -- 작업이 완료되면 쿼터 증가
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    INSERT INTO video_monthly_quota (host_id, month, used_count)
    VALUES (NEW.host_id, DATE_TRUNC('month', NOW())::DATE, 1)
    ON CONFLICT (host_id, month)
    DO UPDATE SET
      used_count = video_monthly_quota.used_count + 1,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS video_quota_trigger ON video_jobs;
CREATE TRIGGER video_quota_trigger
  AFTER UPDATE ON video_jobs
  FOR EACH ROW
  EXECUTE FUNCTION increment_video_quota();

-- ================================================================
-- 인덱스 최적화
-- ================================================================

-- 작업 상태 조회 최적화
CREATE INDEX IF NOT EXISTS idx_video_jobs_status_created ON video_jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_jobs_host_status ON video_jobs(host_id, status);
CREATE INDEX IF NOT EXISTS idx_video_jobs_dedup ON video_jobs(dedup_key) WHERE dedup_key IS NOT NULL;

-- 에셋 조회 최적화
CREATE INDEX IF NOT EXISTS idx_video_job_assets_job_slot ON video_job_assets(job_id, slot_key);
CREATE INDEX IF NOT EXISTS idx_video_job_assets_hash ON video_job_assets(file_hash);

-- 렌더링 결과 조회
CREATE INDEX IF NOT EXISTS idx_video_renders_job ON video_renders(job_id);
CREATE INDEX IF NOT EXISTS idx_video_renders_delivered ON video_renders(delivered_at DESC) WHERE delivered_at IS NOT NULL;

-- 쿼터 관리 인덱스
CREATE INDEX IF NOT EXISTS idx_video_monthly_quota_host_month ON video_monthly_quota(host_id, month);

-- 자동 삭제용 인덱스
CREATE INDEX IF NOT EXISTS idx_video_renders_auto_delete ON video_renders(auto_delete_at) WHERE auto_delete_at IS NOT NULL;

-- ================================================================
-- 초기 템플릿 데이터 (2종)
-- ================================================================

INSERT INTO video_templates (name, version, prompt_base, prompt_vars, brand_style, slots) VALUES
-- 1. Energy Montage (가족/키즈풀 최적화)
('energy-montage', '1.0.0',
 'A high-energy vertical reel showcasing a {region} {accommodation_type}. Dynamic camera movements with quick cuts highlighting {kw1} and {kw2}. Warm cinematic color grading with vibrant highlights. Family-friendly atmosphere with joyful moments.',
 '{
   "region": "가평",
   "accommodation_type": "펜션",
   "kw1": "키즈풀",
   "kw2": "가족여행",
   "season": "spring"
 }'::jsonb,
 '{
   "font_family": "Pretendard",
   "primary_color": "#FF6B35",
   "secondary_color": "#F7931E",
   "logo_position": "bottom-right",
   "logo_margin": "40px"
 }'::jsonb,
 '[
   {"key": "outdoor_1", "description": "외관 전체샷 (메인 빌딩)", "duration": 5},
   {"key": "facility_1", "description": "키즈풀/놀이시설", "duration": 6},
   {"key": "indoor_1", "description": "거실/주방 메인", "duration": 4},
   {"key": "indoor_2", "description": "침실/화장실", "duration": 4},
   {"key": "outdoor_2", "description": "정원/바베큐존", "duration": 5},
   {"key": "usage_1", "description": "가족 이용 장면", "duration": 6}
 ]'::jsonb),

-- 2. Story Tour (럭셔리/감성 최적화)
('story-tour', '1.0.0',
 'An elegant vertical cinematic tour of a luxury {region} {accommodation_type}. Smooth camera movements with gentle transitions showcasing {kw1} and {kw2}. Moody lighting with sophisticated color grading. Premium hospitality atmosphere.',
 '{
   "region": "제주",
   "accommodation_type": "풀빌라",
   "kw1": "오션뷰",
   "kw2": "로맨틱",
   "season": "autumn"
 }'::jsonb,
 '{
   "font_family": "Pretendard",
   "primary_color": "#2C3E50",
   "secondary_color": "#34495E",
   "logo_position": "bottom-right",
   "logo_margin": "40px"
 }'::jsonb,
 '[
   {"key": "outdoor_1", "description": "외관 전체샷 (골든아워)", "duration": 6},
   {"key": "indoor_1", "description": "거실 메인샷 (조명 포인트)", "duration": 5},
   {"key": "facility_1", "description": "수영장/스파 시설", "duration": 6},
   {"key": "indoor_2", "description": "침실/욕실 (럭셔리)", "duration": 4},
   {"key": "outdoor_2", "description": "전망/테라스", "duration": 5},
   {"key": "usage_1", "description": "커플 휴식 장면", "duration": 4}
 ]'::jsonb)

ON CONFLICT (name) DO NOTHING;

-- ================================================================
-- 테이블 코멘트
-- ================================================================

COMMENT ON TABLE video_templates IS 'AI 영상 생성 템플릿 마스터';
COMMENT ON TABLE video_jobs IS '영상 생성 작업 큐 및 상태 추적';
COMMENT ON TABLE video_job_assets IS '작업별 업로드 이미지 에셋';
COMMENT ON TABLE video_renders IS '완성된 영상 파일 정보';
COMMENT ON TABLE video_monthly_quota IS '호스트별 월간 영상 생성 쿼터';