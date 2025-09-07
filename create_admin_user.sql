-- 1. 기존 관리자 계정 삭제 (있으면)
DELETE FROM public.user_roles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@stay-oneday.com'
);
DELETE FROM auth.users WHERE email = 'admin@stay-oneday.com';

-- 2. 새 관리자 계정 생성
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'admin@stay-oneday.com',
  crypt('nuklabsstay90!!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  'authenticated'
);

-- 3. user_roles 테이블에 admin 역할 추가
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'admin' 
FROM auth.users 
WHERE email = 'admin@stay-oneday.com';

-- 4. 확인
SELECT u.id, u.email, ur.role 
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'admin@stay-oneday.com';