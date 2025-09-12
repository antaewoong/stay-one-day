-- admin@stayoneday.com을 user_roles 테이블에 super_admin으로 추가
-- RLS 정책 문제 해결용

-- 1. 먼저 해당 사용자가 auth.users에 있는지 확인하고 user_roles에 추가
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'admin' 
FROM auth.users 
WHERE email = 'admin@stayoneday.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. 확인: 제대로 추가되었는지 체크
SELECT 
    u.id as user_id,
    u.email,
    ur.role as user_roles_role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'admin@stayoneday.com';

-- 3. admin_accounts 테이블도 별도로 확인 (user_id 컬럼명이 다를 수 있음)
SELECT * FROM public.admin_accounts WHERE email = 'admin@stayoneday.com';