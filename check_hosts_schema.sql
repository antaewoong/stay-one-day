-- hosts 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'hosts' AND table_schema = 'public'
ORDER BY ordinal_position;

-- hosts 테이블 데이터 확인
SELECT * FROM hosts LIMIT 5;