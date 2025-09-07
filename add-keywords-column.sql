-- accommodations 테이블에 keywords 컬럼 추가
ALTER TABLE public.accommodations 
ADD COLUMN IF NOT EXISTS keywords jsonb DEFAULT '[]'::jsonb;

-- 컬럼 추가 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'accommodations' AND table_schema = 'public'
ORDER BY ordinal_position;