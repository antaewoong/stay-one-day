-- 기존 호스트들에게 host_id와 password_hash 설정

-- 구공 계정
UPDATE hosts 
SET host_id = 'gugong90stay', password_hash = '90stay2024!!' 
WHERE email = 'test@90stay.com' AND host_id IS NULL;

-- 스테이폴리오 계정
UPDATE hosts 
SET host_id = 'stayfolio', password_hash = 'stayfolio123!' 
WHERE email = 'test@stay.com' AND host_id IS NULL;

-- 스토리나인 계정
UPDATE hosts 
SET host_id = 'storynine', password_hash = 'story9pass!' 
WHERE email = 'storynine@stayonday.com' AND host_id IS NULL;

-- 박경순 계정 (스테이청주)
UPDATE hosts 
SET password_hash = 'cheongju123!' 
WHERE host_id = 'host-c41c15d1' AND password_hash IS NULL;

-- 끄레아풀빌라 계정을 활성화
UPDATE hosts 
SET status = 'active'
WHERE host_id = 'crear' AND status = 'pending';