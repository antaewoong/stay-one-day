# Stay One Day RLS 정책 가이드라인

## 🎯 기본 원칙

### 1. 역할 기반 접근 제어 (RBAC)
```sql
-- 모든 정책은 사용자 역할을 기반으로 함
CASE auth.get_user_role()
  WHEN 'super_admin' THEN [super_admin_access]
  WHEN 'admin' THEN [admin_access] 
  WHEN 'host' THEN [host_access]
  WHEN 'customer' THEN [customer_access]
  WHEN 'influencer' THEN [influencer_access]
  ELSE false
END
```

### 2. 데이터 분류 및 접근 권한

#### 🔴 개인정보/민감정보
- `users.email`, `users.phone`
- `reservations.guest_phone`, `reservations.guest_email`  
- `payments` 전체
- **원칙**: 본인 데이터만 + 관리자

#### 🟡 비즈니스 데이터
- `accommodations`, `reviews`, `reservations`
- **원칙**: 역할별 차등 접근

#### 🟢 공개 데이터  
- `categories`, `notices`, `hero_slides`
- **원칙**: 인증된 사용자 누구나

## 📋 테이블별 RLS 정책 템플릿

### 개인정보 테이블 템플릿
```sql
CREATE POLICY "{table}_policy" ON {table}
FOR ALL USING (
  CASE auth.get_user_role()
    WHEN 'super_admin' THEN true
    WHEN 'admin' THEN true  
    WHEN '{owner_role}' THEN user_id = auth.uid()
    ELSE false
  END
);
```

### 비즈니스 관계 테이블 템플릿  
```sql
CREATE POLICY "{table}_policy" ON {table}
FOR ALL USING (
  CASE auth.get_user_role()
    WHEN 'super_admin' THEN true
    WHEN 'admin' THEN true
    WHEN 'host' THEN {host_ownership_check}
    WHEN 'customer' THEN {customer_access_check} 
    WHEN 'influencer' THEN {influencer_access_check}
    ELSE false
  END
);
```

### 공개 데이터 테이블 템플릿
```sql
CREATE POLICY "{table}_policy" ON {table}  
FOR SELECT USING (true);

CREATE POLICY "{table}_admin_write" ON {table}
FOR INSERT, UPDATE, DELETE USING (
  auth.get_user_role() IN ('super_admin', 'admin')
);
```

## 🚫 금지사항

### ❌ 절대 하지 말 것
```sql
-- 1. 전체 권한 열기
USING (true)

-- 2. Service Role Key 클라이언트 사용
const { data } = supabase.from().select() // service key로

-- 3. RLS 비활성화 
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- 4. 임시 우회 정책
CREATE POLICY "temp_fix" ON table USING (true); -- 절대 안됨
```

### ⚠️ 주의사항
```sql
-- 1. 단순 user_id 매칭만으로는 부족한 경우가 많음
USING (user_id = auth.uid()) -- 너무 단순할 수 있음

-- 2. 복잡한 JOIN은 성능 문제 야기
USING (id IN (SELECT ... FROM ... WHERE ...)) -- 성능 체크 필요
```

## 📝 새 테이블/쿼리 추가 시 체크리스트

### 1. 테이블 생성 시
- [ ] 이 테이블의 데이터 분류는? (🔴개인정보/🟡비즈니스/🟢공개)
- [ ] 각 역할별 접근 권한이 명확한가?
- [ ] 적절한 RLS 정책 템플릿 선택했는가?
- [ ] 정책 생성 후 각 역할로 테스트했는가?

### 2. API 생성 시  
- [ ] 어떤 역할이 이 API를 호출하는가?
- [ ] Client Key 사용하는가? (Service Key 금지)
- [ ] RLS 정책이 의도대로 작동하는가?
- [ ] 다른 역할로 접근 시 적절히 차단되는가?

### 3. 기능 추가 시
- [ ] 기존 RLS 정책으로 충분한가?  
- [ ] 새로운 비즈니스 규칙이 있는가?
- [ ] 정책 수정이 필요하다면 전체 영향도는?

## 🔍 테스트 방법

### 역할별 테스트 계정
```typescript
// 각 역할별로 실제 로그인해서 테스트
const testAccounts = {
  super_admin: 'superadmin@test.com',
  admin: 'admin@test.com', 
  host: 'host@test.com',
  customer: 'customer@test.com',
  influencer: 'influencer@test.com'
};
```

### API 테스트 스크립트
```bash
# 각 역할로 API 호출해서 응답 확인
curl -H "Authorization: Bearer {customer_token}" /api/accommodations
# → customer가 접근 가능한 데이터만 와야 함

curl -H "Authorization: Bearer {host_token}" /api/reservations  
# → 해당 host의 숙소 예약만 와야 함
```

## 🆘 문제 발생 시 대응

### 1. RLS로 막혔을 때
1. 어떤 역할로 접근하려는가?
2. 해당 역할이 이 데이터에 접근해야 하는가? (비즈니스 관점)
3. 정책이 잘못됐나? 역할이 잘못됐나?
4. **절대로 Service Key 우회하지 말 것**

### 2. 성능 문제 시
1. EXPLAIN ANALYZE로 쿼리 플랜 확인
2. 복잡한 JOIN이 있는가?
3. 인덱스 추가 필요한가?
4. 정책을 단순화할 수 있는가?

---

**⚡ 이 가이드라인을 따르면 더 이상 RLS 혼동이 없을 것입니다!**