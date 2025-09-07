-- accommodations 테이블에 필요한 컬럼들 추가
ALTER TABLE public.accommodations 
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS base_capacity integer DEFAULT 2,
ADD COLUMN IF NOT EXISTS extra_person_fee integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_new_open boolean DEFAULT false;

-- 기본값 설정 (기존 데이터가 있는 경우)
UPDATE public.accommodations 
SET 
  city = COALESCE(city, ''),
  base_capacity = COALESCE(base_capacity, 2),
  extra_person_fee = COALESCE(extra_person_fee, 0),
  is_new_open = COALESCE(is_new_open, false)
WHERE city IS NULL OR base_capacity IS NULL OR extra_person_fee IS NULL OR is_new_open IS NULL;

-- 컬럼 추가 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'accommodations' AND table_schema = 'public'
ORDER BY ordinal_position;