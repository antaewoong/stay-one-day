# Stay One Day RLS 정책 프레임워크

## 🎯 목적
- RLS 혼동 근본 원인 해결
- 5역할 시스템 체계적 관리
- 개발 워크플로우에 RLS 준수 강제

---

## 📊 현재 문제 분석

### 1. RLS 혼동이 반복되는 이유

#### 구조적 문제
- **테이블 생성 → 기능 구현 → RLS 추가** 순서
- Service Role Key로 개발 편의성 추구
- RLS를 "추가 보안" 으로 인식 (필수 설계가 아닌)

#### 역할 복잡성
```
데이터 교차점에서의 권한 애매함:
- host 숙소 → customer 예약 (양방향 접근)
- admin의 host 대행 관리 (권한 위임)
- influencer ↔ 숙소 연결 (cross-role)
```

#### Supabase RLS 한계
- 복잡한 비즈니스 로직을 SQL로 표현 어려움
- 성능 이슈 (복잡한 JOIN)
- 정책 변경 시 전체 영향도 예측 어려움

---

## 🏗️ 5역할 시스템 설계

### 역할 정의
```sql
super_admin:  모든 시스템 권한 (개발자/CTO)
admin:        운영 관리 권한 (CS/마케팅)  
host:         숙소 관리 권한 (호스트)
customer:     예약/결제 권한 (일반 고객)
influencer:   캠페인 관리 권한 (인플루언서)
```

### 데이터 분류 체계

#### 🔴 개인정보 (Strict Access)
```
users.email, users.phone
reservations.guest_*
payments.*
personal_documents.*
```
**접근 규칙**: 본인 + super_admin + (필요시 admin)

#### 🟡 비즈니스 데이터 (Role-based Access)  
```
accommodations.*
reservations.* (guest 정보 제외)
reviews.*
campaigns.*
```
**접근 규칙**: 역할별 차등 + 비즈니스 관계 고려

#### 🟢 공개 데이터 (Public Read)
```
categories.*
notices.*  
hero_slides.*
locations.*
```
**접근 규칙**: 인증된 사용자 모두 읽기 + admin 쓰기

---

## 🚦 RLS 정책 결정 트리

### 새 테이블 생성 시
```
1. 이 테이블 데이터는? 
   🔴개인정보 → Strict Policy
   🟡비즈니스 → Role-based Policy  
   🟢공개     → Public Read Policy

2. 어떤 역할이 이 데이터를 소유하나?
   - 단일 소유: user_id 기반 정책
   - 다중 관계: JOIN 기반 정책
   - 관리 데이터: admin 전용 정책

3. 다른 역할과 데이터 공유가 있나?
   - host ↔ customer (예약 관계)
   - admin → 모든 역할 (관리 목적)
   - influencer ↔ accommodations (캠페인)
```

### 정책 템플릿 선택
```sql
-- Template A: 개인정보 보호
CREATE POLICY "strict_access" ON {table}
FOR ALL USING (
  CASE auth.get_user_role()
    WHEN 'super_admin' THEN true
    WHEN 'admin' THEN true  -- 필요시에만
    ELSE user_id = auth.uid()
  END
);

-- Template B: 역할 기반 비즈니스
CREATE POLICY "role_based" ON {table}  
FOR ALL USING (
  CASE auth.get_user_role()
    WHEN 'super_admin' THEN true
    WHEN 'admin' THEN true
    WHEN 'host' THEN {host_condition}
    WHEN 'customer' THEN {customer_condition}
    WHEN 'influencer' THEN {influencer_condition}
    ELSE false
  END
);

-- Template C: 공개 데이터
CREATE POLICY "public_read" ON {table}
FOR SELECT USING (true);

CREATE POLICY "admin_write" ON {table}  
FOR INSERT, UPDATE, DELETE USING (
  auth.get_user_role() IN ('super_admin', 'admin')
);
```

---

## 🔄 개발 워크플로우 강제 시스템

### Phase 1: 기획 단계
```
✅ 테이블 설계 시 데이터 분류 결정
✅ 역할별 접근 권한 정의  
✅ 다른 테이블과의 관계 파악
✅ RLS 정책 템플릿 선택
```

### Phase 2: 구현 단계
```
✅ 테이블 생성과 동시에 RLS 정책 생성
✅ Client Key 기본 사용 (Service Key 금지)
✅ 각 역할별 테스트 계정으로 검증
✅ API 구현 전 권한 동작 확인
```

### Phase 3: 검증 단계  
```
✅ 5가지 역할로 모든 API 테스트
✅ 의도하지 않은 데이터 접근 차단 확인
✅ 성능 테스트 (복잡한 정책의 경우)
✅ Security Advisor로 취약점 스캔
```

---

## 🛠️ 실무 적용 가이드

### 새 기능 추가 시 체크리스트

#### 1. 테이블 추가
- [ ] 데이터 분류 결정됨 (🔴/🟡/🟢)
- [ ] 역할별 접근 권한 정의됨
- [ ] 적절한 정책 템플릿 선택됨
- [ ] RLS 정책과 함께 테이블 생성됨

#### 2. API 추가
- [ ] Client Key 사용 확인
- [ ] 호출하는 역할 명확함
- [ ] 다른 역할의 접근 차단 확인
- [ ] 에러 처리 (권한 없음) 구현됨

#### 3. 배포 전 검증
- [ ] 5가지 테스트 계정으로 검증
- [ ] Security Advisor 통과
- [ ] 성능 이슈 없음 확인
- [ ] RLS_POLICY_LOG 업데이트

### 금지 사항
```
❌ 개발 편의를 위한 Service Key 사용
❌ RLS 우회 임시 정책 (USING true)
❌ 테이블 생성 후 나중에 RLS 추가
❌ 복잡한 JOIN 없이 단순 user_id 매칭만
```

### 예외 처리
```
⚠️ 불가피하게 Service Key 필요시:
1. 비즈니스 사유 명확히 문서화
2. 임시 기간 명시 (최대 1주)  
3. 대안 RLS 정책 구현 계획 수립
4. 코드 리뷰에서 승인 필수
```

---

## 📝 RLS 정책 로그

### 정책 변경 이력 추적
```
정책 변경시 반드시 기록:
- 변경 일시
- 변경 사유 (비즈니스 요구사항)
- 영향받는 역할
- 테스트 결과
- 롤백 계획
```

### 정기 점검
```
월 1회 RLS 정책 점검:
- Security Advisor 실행
- 사용하지 않는 정책 정리
- 성능 이슈 정책 개선
- 새로운 비즈니스 요구사항 반영
```

---

## 🎯 성공 기준

### 단기 목표 (1개월)
- [ ] 모든 테이블에 적절한 RLS 정책 적용
- [ ] Security Advisor 경고 0개
- [ ] Service Key 사용 코드 0개
- [ ] 5가지 역할 테스트 자동화

### 중기 목표 (3개월)  
- [ ] 새 기능 추가 시 RLS 혼동 0건
- [ ] RLS 관련 버그 0건
- [ ] 개발자 RLS 정책 이해도 100%
- [ ] 정책 변경 없이 기능 확장 가능

### 장기 목표 (6개월)
- [ ] 완전 자동화된 RLS 검증 시스템
- [ ] 복잡한 비즈니스 로직도 안전한 RLS 구현
- [ ] 성능 이슈 없는 정교한 권한 제어
- [ ] 감사 로그 완벽 추적 시스템

---

**🚨 핵심 원칙: RLS는 나중에 추가하는 보안이 아니라, 설계부터 함께 하는 필수 아키텍처입니다.**