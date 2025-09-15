-- 주간 프롬프트 팩에 슬롯 스펙 필드 추가
-- 매주 달라지는 샷 레시피 정의

-- 1. weekly_prompt_packs 테이블에 slot_spec 컬럼 추가
ALTER TABLE weekly_prompt_packs
ADD COLUMN IF NOT EXISTS slot_spec JSONB;

-- 2. 기본 슬롯 스펙 업데이트 함수
CREATE OR REPLACE FUNCTION generate_default_slot_spec()
RETURNS JSONB AS $$
BEGIN
  RETURN '{
    "archetypes": {
      "energy_montage": {
        "min_total": 10,
        "max_total": 20,
        "max_generate": 8,
        "slots": [
          {
            "key": "hero",
            "label": "히어로 샷",
            "count": 1,
            "required": true,
            "hint": "대표 외관/뷰",
            "constraints": {
              "orientation": "portrait",
              "min_px": 1080
            }
          },
          {
            "key": "exterior_wide",
            "label": "야외 전경",
            "count": 2,
            "required": true,
            "hint": "건물 전체 외관"
          },
          {
            "key": "interior_main",
            "label": "실내 메인",
            "count": 2,
            "required": true,
            "hint": "대표 실내 공간"
          },
          {
            "key": "amenity",
            "label": "편의시설",
            "count": 2,
            "required": true,
            "hint": "수영장/스파/키즈시설 등",
            "alternatives": ["amenity_pool", "amenity_spa", "amenity_kids"]
          },
          {
            "key": "usage_people",
            "label": "이용 컷(사람)",
            "count": 1,
            "required": false,
            "hint": "실제 이용 모습",
            "policy": "consent_required"
          },
          {
            "key": "sign_brand",
            "label": "브랜딩/간판",
            "count": 1,
            "required": false,
            "hint": "로고/간판/브랜딩 요소"
          },
          {
            "key": "detail",
            "label": "디테일 샷",
            "count": 2,
            "required": false,
            "hint": "인테리어 소품/디테일"
          }
        ]
      },
      "story_tour": {
        "min_total": 8,
        "max_total": 16,
        "max_generate": 6,
        "slots": [
          {
            "key": "hero",
            "label": "히어로 샷",
            "count": 1,
            "required": true,
            "hint": "대표 외관/뷰"
          },
          {
            "key": "entrance",
            "label": "입구/현관",
            "count": 1,
            "required": true,
            "hint": "첫인상 공간"
          },
          {
            "key": "living_main",
            "label": "거실/메인홀",
            "count": 1,
            "required": true,
            "hint": "중심 공간"
          },
          {
            "key": "bedroom",
            "label": "침실",
            "count": 1,
            "required": true,
            "hint": "숙박 공간"
          },
          {
            "key": "view_scenic",
            "label": "전망/뷰",
            "count": 2,
            "required": false,
            "hint": "창밖 전망/경치"
          },
          {
            "key": "amenity_special",
            "label": "특별 시설",
            "count": 1,
            "required": false,
            "hint": "차별화 포인트"
          }
        ]
      },
      "lifestyle_showcase": {
        "min_total": 12,
        "max_total": 18,
        "max_generate": 8,
        "slots": [
          {
            "key": "hero",
            "label": "히어로 샷",
            "count": 1,
            "required": true,
            "hint": "대표 이미지"
          },
          {
            "key": "lifestyle_relax",
            "label": "휴식 라이프스타일",
            "count": 2,
            "required": true,
            "hint": "편안한 분위기"
          },
          {
            "key": "lifestyle_activity",
            "label": "활동 라이프스타일",
            "count": 2,
            "required": true,
            "hint": "액티비티/체험"
          },
          {
            "key": "space_social",
            "label": "소셜 공간",
            "count": 2,
            "required": false,
            "hint": "모임/파티 공간"
          },
          {
            "key": "detail_mood",
            "label": "무드 디테일",
            "count": 3,
            "required": false,
            "hint": "분위기 연출 요소"
          }
        ]
      },
      "seasonal_special": {
        "min_total": 8,
        "max_total": 15,
        "max_generate": 6,
        "slots": [
          {
            "key": "hero_seasonal",
            "label": "시즌 히어로",
            "count": 1,
            "required": true,
            "hint": "계절 특성을 보여주는 대표 샷"
          },
          {
            "key": "exterior_seasonal",
            "label": "시즌 외관",
            "count": 2,
            "required": true,
            "hint": "계절감 있는 외부 전경"
          },
          {
            "key": "activity_seasonal",
            "label": "시즌 액티비티",
            "count": 2,
            "required": false,
            "hint": "계절별 특별 활동"
          },
          {
            "key": "decoration_seasonal",
            "label": "시즌 데코",
            "count": 1,
            "required": false,
            "hint": "계절 장식/테마 요소"
          }
        ]
      }
    }
  }'::jsonb;
END;
$$ LANGUAGE plpgsql;

-- 3. 기존 프롬프트 팩들에 기본 slot_spec 추가
UPDATE weekly_prompt_packs
SET slot_spec = generate_default_slot_spec()
WHERE slot_spec IS NULL;

-- 4. 슬롯 검증 함수
CREATE OR REPLACE FUNCTION validate_slot_manifest(
  archetype_name TEXT,
  slot_spec_json JSONB,
  manifest JSONB
) RETURNS TABLE(
  is_valid BOOLEAN,
  missing_required TEXT[],
  total_count INTEGER,
  required_count INTEGER,
  warnings TEXT[]
) AS $$
DECLARE
  archetype_spec JSONB;
  slot_item JSONB;
  manifest_slots TEXT[];
  required_slots TEXT[];
  slot_counts JSONB;
  missing TEXT[];
  warning_list TEXT[];
  total_uploaded INTEGER := 0;
  required_fulfilled INTEGER := 0;
BEGIN
  -- 아키타입 스펙 추출
  archetype_spec := slot_spec_json->'archetypes'->archetype_name;

  IF archetype_spec IS NULL THEN
    RETURN QUERY SELECT false, ARRAY['Invalid archetype'], 0, 0, ARRAY['Unknown archetype: ' || archetype_name];
    RETURN;
  END IF;

  -- manifest에서 슬롯 목록 추출
  SELECT array_agg(DISTINCT value->>'slot')
  INTO manifest_slots
  FROM jsonb_array_elements(manifest);

  -- 슬롯별 개수 계산
  SELECT jsonb_object_agg(
    value->>'slot',
    (SELECT count(*) FROM jsonb_array_elements(manifest) AS m WHERE m->>'slot' = value->>'slot')
  )
  INTO slot_counts
  FROM (SELECT DISTINCT value->>'slot' FROM jsonb_array_elements(manifest)) AS slots(value);

  total_uploaded := (SELECT count(*) FROM jsonb_array_elements(manifest));

  -- 각 슬롯 요구사항 검증
  FOR slot_item IN SELECT value FROM jsonb_array_elements(archetype_spec->'slots')
  LOOP
    DECLARE
      slot_key TEXT := slot_item->>'key';
      slot_count INTEGER := (slot_item->>'count')::INTEGER;
      is_required BOOLEAN := (slot_item->>'required')::BOOLEAN;
      uploaded_count INTEGER := COALESCE((slot_counts->>slot_key)::INTEGER, 0);
    BEGIN
      IF is_required THEN
        IF uploaded_count = 0 THEN
          missing := array_append(missing, slot_key);
        ELSE
          required_fulfilled := required_fulfilled + 1;
        END IF;

        required_slots := array_append(required_slots, slot_key);
      END IF;

      -- 개수 경고
      IF uploaded_count > slot_count THEN
        warning_list := array_append(warning_list,
          format('슬롯 "%s": %s개 업로드됨 (권장: %s개)',
            slot_item->>'label', uploaded_count, slot_count));
      END IF;
    END;
  END LOOP;

  -- 범위 검증
  DECLARE
    min_total INTEGER := (archetype_spec->>'min_total')::INTEGER;
    max_total INTEGER := (archetype_spec->>'max_total')::INTEGER;
  BEGIN
    IF total_uploaded < min_total THEN
      warning_list := array_append(warning_list,
        format('총 업로드 수 부족: %s개 (최소 %s개 필요)', total_uploaded, min_total));
    END IF;

    IF total_uploaded > max_total THEN
      warning_list := array_append(warning_list,
        format('총 업로드 수 초과: %s개 (최대 %s개 허용)', total_uploaded, max_total));
    END IF;
  END;

  RETURN QUERY SELECT
    array_length(missing, 1) IS NULL, -- 필수 슬롯이 모두 채워졌는지
    COALESCE(missing, ARRAY[]::TEXT[]),
    total_uploaded,
    required_fulfilled,
    COALESCE(warning_list, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql;

-- 5. 시즌별 슬롯 스펙 업데이트 함수
CREATE OR REPLACE FUNCTION update_seasonal_slot_spec(
  pack_id UUID,
  season_type TEXT, -- 'spring', 'summer', 'autumn', 'winter'
  trend_modifiers TEXT[] -- 트렌드에서 추출된 모디파이어
) RETURNS JSONB AS $$
DECLARE
  base_spec JSONB;
  updated_spec JSONB;
BEGIN
  -- 기본 스펙 로드
  base_spec := generate_default_slot_spec();

  -- 시즌별 조정
  CASE season_type
    WHEN 'summer' THEN
      -- 여름: 수영장/워터파크 강조, 실내 비중 줄임
      updated_spec := base_spec;
      updated_spec := jsonb_set(updated_spec,
        '{archetypes,energy_montage,slots}',
        (SELECT jsonb_agg(
          CASE
            WHEN value->>'key' = 'amenity' THEN
              jsonb_set(value, '{count}', '3'::jsonb) ||
              jsonb_set(value, '{hint}', '"수영장/워터파크 필수"'::jsonb)
            WHEN value->>'key' = 'interior_main' THEN
              jsonb_set(value, '{count}', '1'::jsonb)
            ELSE value
          END
        ) FROM jsonb_array_elements(base_spec->'archetypes'->'energy_montage'->'slots'))
      );

    WHEN 'autumn' THEN
      -- 가을: 전망/뷰 강조, 단풍/자연
      updated_spec := jsonb_set(base_spec,
        '{archetypes,story_tour,slots}',
        base_spec->'archetypes'->'story_tour'->'slots' ||
        '[{"key":"view_autumn","label":"가을 전망","count":2,"required":true,"hint":"단풍/가을 풍경"}]'::jsonb
      );

    WHEN 'winter' THEN
      -- 겨울: 실내 온천/스파, 따뜻한 분위기
      updated_spec := base_spec;
      -- 온천/스파 슬롯 추가 로직

    ELSE
      -- 기본값
      updated_spec := base_spec;
  END CASE;

  -- 트렌드 모디파이어 반영
  IF array_length(trend_modifiers, 1) > 0 THEN
    -- 인기 모디파이어에 따른 슬롯 조정 로직
    -- 예: '브라이덜파티'가 트렌드면 usage_people을 required로 변경
    IF 'usage_people' = ANY(trend_modifiers) OR 'bridal' = ANY(trend_modifiers) THEN
      updated_spec := jsonb_set(updated_spec,
        '{archetypes,lifestyle_showcase,slots}',
        (SELECT jsonb_agg(
          CASE WHEN value->>'key' = 'usage_people'
               THEN jsonb_set(value, '{required}', 'true'::jsonb)
               ELSE value END
        ) FROM jsonb_array_elements(updated_spec->'archetypes'->'lifestyle_showcase'->'slots'))
      );
    END IF;
  END IF;

  RETURN updated_spec;
END;
$$ LANGUAGE plpgsql;

-- 6. 인덱스 및 제약 추가
CREATE INDEX IF NOT EXISTS idx_prompt_packs_slot_spec ON weekly_prompt_packs USING GIN (slot_spec);

-- 7. 뷰: 현재 활성 슬롯 스펙
CREATE OR REPLACE VIEW current_active_slot_specs AS
SELECT
  id,
  week_start,
  version,
  slot_spec,
  slot_spec->'archetypes' as archetypes,
  applied_at
FROM weekly_prompt_packs
WHERE is_active = true
ORDER BY week_start DESC, version DESC
LIMIT 1;

-- 8. 샘플 데이터: 이번 주용 동적 슬롯 스펙
INSERT INTO weekly_prompt_packs (
  week_start,
  version,
  prompts,
  trend_analysis,
  slot_spec,
  is_active,
  generated_at
) VALUES (
  DATE_TRUNC('week', CURRENT_DATE)::date,
  1,
  '{
    "energy_montage": "Dynamic accommodation showcase with trending summer vibes, pool-focused content",
    "story_tour": "Narrative walkthrough emphasizing seasonal outdoor experiences",
    "lifestyle_showcase": "Family-friendly summer lifestyle content with water activities",
    "seasonal_special": "Summer 2024 special featuring pool parties and outdoor dining"
  }'::jsonb,
  '{
    "dominant_features": ["키즈풀", "가족여행", "여름휴가"],
    "color_preferences": "warm",
    "tempo_trend": "upbeat",
    "cut_rate_avg": 0.3,
    "popular_modifiers": ["키즈풀", "바베큐", "수영장", "가족", "여름휴가"]
  }'::jsonb,
  update_seasonal_slot_spec(
    gen_random_uuid(),
    'summer',
    ARRAY['키즈풀', '바베큐', '수영장']
  ),
  true,
  NOW()
) ON CONFLICT (week_start, version) DO NOTHING;

COMMENT ON COLUMN weekly_prompt_packs.slot_spec IS '주간별 동적 샷 레시피 - 아키타입별 필요 슬롯 정의';
COMMENT ON FUNCTION validate_slot_manifest IS '업로드된 이미지 매니페스트의 슬롯 요구사항 검증';
COMMENT ON FUNCTION update_seasonal_slot_spec IS '시즌과 트렌드에 따른 슬롯 스펙 동적 생성';
COMMENT ON VIEW current_active_slot_specs IS '현재 활성화된 주간 슬롯 스펙';