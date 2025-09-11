-- 기존 admin@stayoneday.com 계정을 슈퍼 관리자로 승급
UPDATE admin_accounts 
SET role = 'super_admin',
    name = '슈퍼 관리자',
    updated_at = NOW()
WHERE email = 'admin@stayoneday.com';

-- 다른 관리자들의 auth_user_id도 이메일로 업데이트 (누락된 것들)
UPDATE admin_accounts 
SET auth_user_id = auth_users.id
FROM auth.users AS auth_users
WHERE admin_accounts.email = auth_users.email 
AND admin_accounts.auth_user_id IS NULL;