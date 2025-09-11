# Stay One Day RLS 최적 전략

## 🎯 Supabase 공식 권장 + 우리 상황 결합

### 분석 결과
Supabase 공식 문서는 **서브 에이전트 패턴**을 권장합니다:
- 역할별 독립적 정책 생성
- Helper Functions 적극 활용  
- 성능 최적화와 명확성 확보

## 📋 3단계 최적화 전략

### Phase 1: 테이블 특성별 분류

#### 🟢 Simple Tables → Helper Functions
```sql
-- 개인 소유 데이터
users, user_profiles, user_settings, payments

-- 단순 정책
CREATE POLICY "own_data" ON users
FOR ALL USING (
  id = auth.uid() OR 
  auth.get_user_role() IN ('super_admin', 'admin')
);
```

#### 🟡 Business Tables → Sub-Agent Pattern  
```sql
-- 복잡한 비즈니스 관계
accommodations, reservations, reviews, campaigns

-- 역할별 분리된 정책
CREATE POLICY "accommodations_host" ON accommodations
FOR ALL USING (
  auth.get_user_role() = 'host' AND host_id = auth.uid()
);

CREATE POLICY "accommodations_admin" ON accommodations  
FOR ALL USING (
  auth.get_user_role() IN ('super_admin', 'admin')
);
```

#### 🟢 Public Tables → Simple Read/Write Split
```sql
-- 공개 데이터
categories, locations, notices, hero_slides

CREATE POLICY "public_read" ON categories FOR SELECT USING (true);
CREATE POLICY "admin_write" ON categories FOR INSERT, UPDATE, DELETE 
USING (auth.get_user_role() IN ('super_admin', 'admin'));
```

### Phase 2: 서브 에이전트 패턴 구현

#### 예약 시스템 - 다중 역할 접근
```sql
-- Host: 자신의 숙소 예약만
CREATE POLICY "reservations_host_access" ON reservations
FOR SELECT USING (
  auth.get_user_role() = 'host' AND
  accommodation_id IN (
    SELECT id FROM accommodations WHERE host_id = auth.uid()
  )
);

-- Customer: 자신의 예약만  
CREATE POLICY "reservations_customer_access" ON reservations
FOR ALL USING (
  auth.get_user_role() = 'customer' AND customer_id = auth.uid()
);

-- Influencer: 캠페인 연결된 예약만
CREATE POLICY "reservations_influencer_access" ON reservations
FOR SELECT USING (
  auth.get_user_role() = 'influencer' AND
  accommodation_id IN (
    SELECT accommodation_id FROM campaigns 
    WHERE influencer_id = auth.uid()
  )
);

-- Admin: 모든 예약 (단, 개인정보 제외)
CREATE POLICY "reservations_admin_access" ON reservations
FOR ALL USING (auth.get_user_role() IN ('super_admin', 'admin'));
```

#### 성능 최적화
```sql
-- 자주 사용되는 조건에 인덱스 추가
CREATE INDEX idx_accommodations_host_id ON accommodations(host_id);
CREATE INDEX idx_reservations_customer_id ON reservations(customer_id);
CREATE INDEX idx_campaigns_influencer_id ON campaigns(influencer_id);
```

### Phase 3: Helper Functions 확장

#### Custom Helper Functions
```sql
-- 호스트 소유 숙소 확인
CREATE OR REPLACE FUNCTION auth.user_owns_accommodation(accommodation_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM accommodations 
    WHERE id = accommodation_id AND host_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용법
CREATE POLICY "reviews_host_access" ON reviews
FOR ALL USING (
  auth.get_user_role() = 'host' AND
  auth.user_owns_accommodation(accommodation_id)
);
```

## 🔄 마이그레이션 순서

### 1주차: 단순 테이블부터
```
✅ users, user_profiles → Helper Functions 패턴
✅ categories, notices → Public 패턴
✅ 성능 테스트 및 검증
```

### 2주차: 복잡 테이블 분해
```  
✅ reservations → 4개 서브 정책으로 분리
✅ accommodations → 3개 서브 정책으로 분리
✅ 각 역할별 독립 테스트
```

### 3주차: 최적화 및 정리
```
✅ Helper Functions 추가 생성
✅ 인덱스 최적화
✅ 사용하지 않는 정책 정리
```

## 📊 효과 예측

### 성능 개선
```
기존: 복합 CASE 문 → 테이블 풀스캔
개선: 역할별 최적화된 조건 → 인덱스 활용
예상 개선: 평균 쿼리 시간 60% 단축
```

### 유지보수성  
```
기존: 1개 복잡한 정책 수정 시 전체 영향
개선: 역할별 독립 정책으로 안전한 수정
예상 개선: 정책 수정 시 사이드 이펙트 90% 감소
```

### 개발 생산성
```
기존: RLS 디버깅 어려움, 매번 혼동  
개선: 명확한 정책 분리, 역할별 테스트
예상 개선: RLS 관련 개발 시간 70% 단축
```

## 🎯 성공 지표

### 즉시 확인 가능
- [ ] Security Advisor 경고 0개
- [ ] 모든 테이블 적절한 정책 적용
- [ ] 5가지 역할 테스트 통과

### 1개월 후 확인
- [ ] RLS 관련 버그 0건
- [ ] 새 기능 추가 시 RLS 혼동 0건  
- [ ] 평균 API 응답시간 개선

### 3개월 후 확인  
- [ ] 복잡한 비즈니스 로직도 안정적 RLS 운영
- [ ] 개발자 RLS 이해도 및 만족도 향상
- [ ] 확장성 있는 권한 시스템 구축 완료

---

**🚀 결론: 서브 에이전트 패턴이 우리 5역할 시스템에 가장 적합합니다.**