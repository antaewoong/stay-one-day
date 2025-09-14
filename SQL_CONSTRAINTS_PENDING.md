# 🗃️ 대기 중인 DB 제약 SQL 실행 목록

**생성일**: 2025년 9월 14일
**목적**: Phase 1 Critical APIs의 물리적 안전장치 구축
**상태**: 실행 대기 중

---

## ✅ **완료된 제약**

### **hero_slides 테이블**
```sql
-- 이미 적용 완료 (9월 14일)
ALTER TABLE public.hero_slides
ADD CONSTRAINT hero_slides_slide_order_unique UNIQUE (slide_order);
```
- **상태**: ✅ 완료
- **효과**: 슬라이드 순서 중복 물리적 차단
- **검증**: 4,008개 → 1개 데이터 복제 문제 해결 완료

---

## 🔄 **Phase 1 - Critical APIs 제약 (즉시 실행 필요)**

### **1. sections 테이블**
```sql
-- 섹션 순서 중복 방지
ALTER TABLE public.sections
ADD CONSTRAINT sections_section_order_unique UNIQUE (section_order);

-- 또는 페이지별 섹션 순서 (확장형)
ALTER TABLE public.sections
ADD COLUMN IF NOT EXISTS page_key TEXT DEFAULT 'home',
ADD CONSTRAINT sections_unique_position UNIQUE (page_key, section_order);
```
- **위험도**: 🔴 High
- **이유**: 섹션 정렬 관리에서 복제 가능성

### **2. accommodation_badges 테이블**
```sql
-- 숙소-배지 연결 중복 방지
ALTER TABLE public.accommodation_badges
ADD CONSTRAINT accommodation_badges_unique UNIQUE (accommodation_id, badge_type_id);
```
- **위험도**: 🔴 High
- **이유**: 배지 컬렉션 관리에서 중복 배지 할당 방지

### **3. hero_texts 테이블**
```sql
-- 히어로 텍스트 순서 중복 방지
ALTER TABLE public.hero_texts
ADD CONSTRAINT hero_texts_text_order_unique UNIQUE (text_order);

-- 또는 위치별 텍스트 순서 (확장형)
ALTER TABLE public.hero_texts
ADD COLUMN IF NOT EXISTS position TEXT DEFAULT 'center',
ADD CONSTRAINT hero_texts_unique_position UNIQUE (position, text_order);
```
- **위험도**: 🔴 High
- **이유**: 히어로 텍스트 컬렉션 정렬 관리

### **4. notices 테이블 (컬렉션형인 경우)**
```sql
-- 공지사항 우선순위 중복 방지 (컬렉션 정렬이 있는 경우)
ALTER TABLE public.notices
ADD CONSTRAINT notices_priority_unique UNIQUE (priority)
WHERE priority IS NOT NULL;

-- 또는 카테고리별 우선순위
ALTER TABLE public.notices
ADD CONSTRAINT notices_category_priority_unique UNIQUE (category, priority)
WHERE priority IS NOT NULL;
```
- **위험도**: 🔴 High (컬렉션형인 경우만)
- **조건부**: API에서 정렬/순서 관리하는 경우만 적용

### **5. influencer_notices 테이블**
```sql
-- 인플루언서 공지 우선순위 중복 방지
ALTER TABLE public.influencer_notices
ADD CONSTRAINT influencer_notices_priority_unique UNIQUE (priority)
WHERE priority IS NOT NULL;
```
- **위험도**: 🔴 High (컬렉션형인 경우만)
- **조건부**: API에서 정렬/순서 관리하는 경우만 적용

---

## 🟡 **Phase 2 - Important APIs 제약 (2차 적용)**

### **6. badge_types 테이블**
```sql
-- 배지 타입명 중복 방지
ALTER TABLE public.badge_types
ADD CONSTRAINT badge_types_name_unique UNIQUE (name);
```
- **위험도**: 🟡 Medium
- **이유**: 배지 타입 중복 생성 방지

### **7. accommodation_amenities 테이블**
```sql
-- 숙소-편의시설 중복 방지
ALTER TABLE public.accommodation_amenities
ADD CONSTRAINT accommodation_amenities_unique UNIQUE (accommodation_id, amenity_type);
```
- **위험도**: 🟡 Medium
- **이유**: 동일 편의시설 중복 등록 방지

---

## 📋 **실행 순서 및 검증**

### **즉시 실행 (Phase 1)**
```bash
# 1단계: 기본 제약 적용
psql -h YOUR_SUPABASE_HOST -U postgres -d postgres << EOF
ALTER TABLE public.sections ADD CONSTRAINT sections_section_order_unique UNIQUE (section_order);
ALTER TABLE public.accommodation_badges ADD CONSTRAINT accommodation_badges_unique UNIQUE (accommodation_id, badge_type_id);
ALTER TABLE public.hero_texts ADD CONSTRAINT hero_texts_text_order_unique UNIQUE (text_order);
EOF

# 2단계: 검증
psql -h YOUR_SUPABASE_HOST -U postgres -d postgres -c "
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE '%_unique%';
"
```

### **실행 후 확인사항**
- [ ] 각 제약이 정상 생성되었는지 확인
- [ ] 기존 데이터와 제약 충돌 없는지 확인
- [ ] API 테스트에서 409 에러 정상 반환되는지 확인

---

## ⚠️ **주의사항**

### **실행 전 확인**
1. **기존 데이터 중복 체크**: 제약 적용 전 중복 데이터 정리
2. **API 코드 준비**: 409 에러 처리 로직 구현 완료 확인
3. **백업**: 프로덕션 적용 시 백업 완료 후 실행

### **실행 시 오류 대응**
- **23505 에러** (unique violation): 기존 중복 데이터 정리 필요
- **42P07 에러** (relation already exists): 제약 이미 존재, 무시 가능
- **권한 오류**: 관리자 권한으로 실행 필요

---

## 🎯 **최종 목표**

### **완료 후 효과**
- ✅ **물리적 복제 차단**: 모든 컬렉션 테이블에서 데이터 복제 불가
- ✅ **API 안전성**: 버그가 있어도 DB가 최종 방어선 역할
- ✅ **시스템 신뢰성**: 히어로 슬라이드 같은 대량 복제 사태 원천 차단

### **검증 방법**
각 API에서 중복 데이터 입력 시도 → 409 Conflict 정상 반환 확인

---

*이 SQL들을 실행하면 물리적 레벨에서 데이터 복제가 완전히 차단됩니다.*
*히어로 슬라이드 문제와 같은 사태가 다른 API에서는 절대 발생하지 않습니다.*

---

*🤖 Generated with [Claude Code](https://claude.ai/code)*
*Co-Authored-By: Claude <noreply@anthropic.com>*