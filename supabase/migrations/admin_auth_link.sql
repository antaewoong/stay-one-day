-- admin_accounts 테이블에 auth_user_id 컬럼 추가
ALTER TABLE admin_accounts 
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);

-- 기존 관리자들을 이메일로 매칭해서 auth_user_id 업데이트
UPDATE admin_accounts 
SET auth_user_id = auth_users.id
FROM auth.users AS auth_users
WHERE admin_accounts.email = auth_users.email;

-- get_user_role 함수 업데이트 (admin_accounts 테이블 연동)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    -- 현재 인증된 사용자가 없으면 customer 반환
    IF auth.uid() IS NULL THEN
        RETURN 'customer';
    END IF;
    
    -- admin_accounts 테이블에서 관리자 확인
    IF EXISTS (
        SELECT 1 FROM admin_accounts 
        WHERE auth_user_id = auth.uid() 
        AND is_active = true
        AND role IN ('admin', 'super_admin')
    ) THEN
        RETURN 'admin';
    END IF;
    
    -- user_roles 테이블에서 역할 확인
    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
        RETURN 'admin';
    END IF;
    
    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'host') THEN
        RETURN 'host';
    END IF;
    
    -- hosts 테이블에서 호스트 확인
    IF EXISTS (SELECT 1 FROM hosts WHERE auth_user_id = auth.uid() AND status = 'active') THEN
        RETURN 'host';
    END IF;
    
    -- influencers 테이블에서 인플루언서 확인
    IF EXISTS (SELECT 1 FROM influencers WHERE auth_user_id = auth.uid() AND status = 'active') THEN
        RETURN 'influencer';
    END IF;
    
    -- 기본값은 customer
    RETURN 'customer';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;