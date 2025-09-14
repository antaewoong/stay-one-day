# 📋 API 보안 감사 체크리스트

**생성일**: 2025년 9월 14일
**목적**: 히어로 슬라이드와 같은 데이터 복제 문제 전체 시스템 방지
**상태**: 🔄 대기 중

---

## 🚨 **위험 패턴 식별 기준**

### **High Risk** 🔴
- POST 메서드에서 배열 데이터 처리
- `DELETE 전체 → INSERT 배열` 패턴
- `if (id) update else insert` 분기 로직
- 유니크 제약 없는 컬렉션 저장

### **Medium Risk** 🟡
- 부분 업데이트 시 누락 필드 처리
- 멱등성 보장 없는 PUT 메서드
- 트랜잭션 없는 복합 DB 작업

### **Low Risk** 🟢
- 단순 GET/DELETE 메서드
- 단일 레코드 처리만 하는 API

---

## 📂 **점검 대상 API 목록**

### **🔴 관리자 API (35개)**

#### **컬렉션 관리 (High Priority)**
- [ ] `app/api/admin/hero-slides/route.ts` **← 이번 데이터 복제 문제 핵심**
- [ ] `app/api/admin/accommodations/route.ts`
- [ ] `app/api/admin/sections/route.ts`
- [ ] `app/api/admin/hero-texts/route.ts`
- [ ] `app/api/admin/badges/route.ts`
- [ ] `app/api/admin/accommodation-badges/route.ts`

#### **사용자 데이터 관리**
- [ ] `app/api/admin/hosts/route.ts`
- [ ] `app/api/admin/hosts/[id]/route.ts`
- [ ] `app/api/admin/admins/route.ts`
- [ ] `app/api/admin/influencers/route.ts`

#### **예약/문의 관리**
- [ ] `app/api/admin/reservations/route.ts`
- [ ] `app/api/admin/reservations/[id]/route.ts`
- [ ] `app/api/admin/reservations/calendar/route.ts`
- [ ] `app/api/admin/inquiries/route.ts`
- [ ] `app/api/admin/collaboration-requests/route.ts`

#### **콘텐츠 관리**
- [ ] `app/api/admin/notices/route.ts`
- [ ] `app/api/admin/notices/[id]/route.ts`
- [ ] `app/api/admin/influencer-notices/route.ts`

#### **통계/분석**
- [ ] `app/api/admin/group-kpi/route.ts`

#### **토큰/인증 관리**
- [ ] `app/api/admin/influencer-tokens/route.ts`
- [ ] `app/api/admin/login/route.ts`
- [ ] `app/api/admin/refresh-token/route.ts`
- [ ] `app/api/admin/change-user-password/route.ts`

#### **시스템 관리**
- [ ] `app/api/admin/seed-data/route.ts`
- [ ] `app/api/admin/seed-sections/route.ts`
- [ ] `app/api/admin/create-real-tables/route.ts`
- [ ] `app/api/admin/fix-schema/route.ts`
- [ ] `app/api/admin/fix-constraints/route.ts`
- [ ] `app/api/admin/fix-accommodation-types-rls/route.ts`
- [ ] `app/api/admin/schema/add-types-array/route.ts`
- [ ] `app/api/admin/setup-marketing/route.ts`
- [ ] `app/api/admin/update-hosts/route.ts`

#### **삭제 요청 관리**
- [ ] `app/api/admin/delete-requests/route.ts`
- [ ] `app/api/admin/delete-requests/[id]/route.ts`

#### **텔레그램 연동**
- [ ] `app/api/admin/telegram/register/route.ts`

#### **시스템 체크**
- [ ] `app/api/admin/ping/route.ts`
- [ ] `app/api/admin/emergency-cleanup/route.ts`

### **🟡 호스트 API (12개)**

#### **숙소 관리**
- [ ] `app/api/host/accommodations/route.ts`
- [ ] `app/api/host/photos/route.ts`

#### **예약/리뷰 관리**
- [ ] `app/api/host/reservations/route.ts`
- [ ] `app/api/host/reviews/route.ts`
- [ ] `app/api/host/influencer-reviews/route.ts`
- [ ] `app/api/host/influencer-reviews/reply/route.ts`

#### **협업/문의**
- [ ] `app/api/host/collaboration-requests/route.ts`
- [ ] `app/api/host/inquiries/route.ts`

#### **통계/분석**
- [ ] `app/api/host/dashboard/route.ts`
- [ ] `app/api/host/group-kpi/route.ts`
- [ ] `app/api/host/stats/route.ts`

#### **인증**
- [ ] `app/api/host/login/route.ts`

---

## 🔍 **점검 체크리스트**

### **API 규약 준수 체크 템플릿**

| API 경로 | Phase | HTTP 메서드 규약 | 멱등성 | 배열 POST 금지 | DB 유니크 제약 | 가드/RLS | Service Role | Runtime | 로깅/알림 | 상태 | 담당자 |
|---------|-------|----------------|--------|---------------|---------------|----------|-------------|---------|-----------|------|-------|
| admin/hero-slides | 1 | PUT=전체교체, POST=405 | Yes | Yes | slide_order UNIQUE | withAdminAuth/RLS우회 | Yes | nodejs | 4xx/5xx+증가알림 | 완료 | - |
| admin/sections | 1 | ? | ? | ? | ? | ? | ? | ? | ? | 대기 | - |
| admin/accommodations | 1 | ? | ? | ? | ? | ? | ? | ? | ? | 대기 | - |

### **각 API별 점검 항목**

#### **1. 가드레일 준수 검증 (필수)**
- [ ] **withAdminAuth**만 사용 (다른 가드/미들웨어 제거)
- [ ] 런타임 선언: `export const runtime = 'nodejs'`, `export const dynamic = 'force-dynamic'`
- [ ] **Service Role** 클라이언트만 쓰기 권한 사용
- [ ] **PUT=전량 교체(멱등)**, **배열 POST=405** 응답
- [ ] **필수 필드 검증** (예: image_url) 실패 시 400 + 구체적 메시지

#### **2. 데이터베이스 물리적 안전장치**
- [ ] **정확한 컬럼명+제약명**: `hero_slides.slide_order UNIQUE (완료)` / `sections.page_key+section_order UNIQUE (필요)` 등
- [ ] NOT NULL 제약이 적절히 설정되어 있는가?
- [ ] 트랜잭션 처리가 되어 있는가?

#### **3. 멱등성 테스트 케이스 (공통 템플릿)**
- [ ] **같은 페이로드 2회 저장** → 레코드 수 변화 없음
- [ ] **POST(배열) 요청** → 405 Method Not Allowed
- [ ] **필수 필드 누락** → 400 + 구체적 메시지 확인
- [ ] **부분 실패 시 롤백** (트랜잭션) 보장 여부

#### **4. 권한/가드 정합성 항목**
- [ ] withAdminAuth / withHostAuth 적용 여부
- [ ] **쿠키 세션 vs Authorization 헤더 혼용 금지** (프로젝트 원칙 명시)
- [ ] **Service Role은 서버 라우트+nodejs runtime에서만 사용** (Edge 금지)

#### **5. 로깅/모니터링 체크**
- [ ] **4xx/5xx 발생 시** requestId, 사용자 role, 경로, 메서드, 페이로드 요약 로깅 여부
- [ ] **컬렉션 테이블 레코드 폭증 알림 규칙** (임계값·알림 채널) 명시

---

## ⚡ **우선순위별 점검 순서**

### **Phase 1: Critical APIs** 🔴
**컬렉션 전량 교체/정렬/순서가 있는 라우트 우선**
1. `hero-slides/route.ts` (Admin) **← 완료: 멱등성 + DB 제약 적용**
2. `sections/route.ts` (Admin) - 컬렉션 정렬 관리
3. `accommodation-badges/route.ts` (Admin) - 배지 컬렉션 관리
4. `hero-texts/route.ts` (Admin) - 히어로 텍스트 컬렉션
5. `notices/route.ts` (Admin) - 공지사항 컬렉션형
6. `influencer-notices/route.ts` (Admin) - 인플루언서 공지 컬렉션

### **Phase 2: Important APIs** 🟡
**멱등성 리스크 중간 수준**
1. `accommodations/route.ts` (Admin/Host) - 숙소 데이터 관리
2. `badges/route.ts` (Admin) - 배지 타입 관리
3. `hosts/route.ts` (Admin) - 호스트 데이터 관리
4. `photos/route.ts` (Host) - 이미지 컬렉션 관리

### **Phase 3: Low Risk APIs** 🟢
**멱등성 리스크 낮음 (예약/통계/인증 등)**
1. `reservations/route.ts` (Admin/Host) - 예약 관리
2. `stats/route.ts`, `group-kpi/route.ts` - 통계/분석
3. `login/route.ts`, `refresh-token/route.ts` - 인증
4. `inquiries/route.ts` - 문의 관리

---

## 🧪 **히어로 슬라이드 전용 스모크 테스트**

### **즉시 실행 가능한 테스트 케이스**

```bash
# 1. PUT 동일 payload 2회 → COUNT 동일 (멱등성)
curl -X PUT http://localhost:3000/api/admin/hero-slides \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '[{"image_url":"test.jpg","title":"Test","slide_order":1}]'

# 2. POST 배열 → 405 Method Not Allowed
curl -i -X POST http://localhost:3000/api/admin/hero-slides \
  -H "Content-Type: application/json" \
  -d '[{"image_url":"test.jpg"}]'

# 3. image_url 누락 → 400 "이미지 URL은 필수입니다."
curl -X PUT http://localhost:3000/api/admin/hero-slides \
  -H "Content-Type: application/json" \
  -d '[{"title":"No Image","slide_order":1}]'

# 4. slide_order 중복 → 409 "slide_order unique violation"
curl -X PUT http://localhost:3000/api/admin/hero-slides \
  -H "Content-Type: application/json" \
  -d '[{"image_url":"a.jpg","slide_order":1},{"image_url":"b.jpg","slide_order":1}]'
```

### **체크리스트 확인사항**
- [ ] **Edge 배포 금지**: `runtime='nodejs'` 확인
- [ ] **withAdminAuth 통과** + Service Role 사용 확인
- [ ] **멱등성**: 동일 요청 2회 → 레코드 수 동일
- [ ] **배열 POST 차단**: 405 응답
- [ ] **필수 검증**: image_url 누락 → 400 + 구체적 메시지
- [ ] **DB 제약**: slide_order 중복 → 409/400

---

## 📊 **점검 결과 템플릿**

### **API명**: `app/api/admin/hero-slides/route.ts`
- **위험도**: 🔴 High (해결완료)
- **발견된 문제**:
  - [x] POST 배열 처리 → **405로 차단 완료**
  - [x] ID 분기 로직 → **전량 교체 방식으로 제거 완료**
  - [x] 유니크 제약 없음 → **slide_order UNIQUE 제약 추가 완료**
  - [x] 멱등성 미보장 → **PUT 멱등성 보장 완료**
- **적용된 수정사항**:
  - ✅ POST 메서드 405 차단
  - ✅ PUT 전체 교체 방식 적용
  - ✅ DB 제약 추가: `hero_slides_slide_order_unique`
  - ✅ 검증 로직 강화: image_url 필수
  - ✅ Service Role + withAdminAuth 적용
- **스모크 테스트 결과**: ✅ 모든 테스트 통과
- **수정 우선순위**: **완료**

---

## 🎯 **합격 기준 (각 API 공통)**

### **가드레일 7가지 필수 조건:**
1. ✅ **Admin API는 withAdminAuth만 사용**
2. ✅ **데이터 쓰기는 Service Role로만**
3. ✅ **PUT=배열 전량 교체(멱등), 배열 POST=405**
4. ✅ **프론트 임시 ID 분기 제거, 전량 교체로 단순화**
5. ✅ **image_url 등 필수 검증 없으면 400**
6. ✅ **DB 유니크 제약 추가로 물리적 복제 차단**
7. ✅ **PR에 스모크 테스트 결과/QA시트 첨부**

### **실행 산출물 링크/위치 명시:**
- **스모크 테스트 스크립트**: `/scripts/api-smoke-tests/`
- **테이블 제약 적용 SQL**: `/migrations/constraints/`
- **QA 체크시트**: 본 문서 상단 템플릿 테이블
- **실행 명령**: `npm run api:smoke-test`
- **기대 결과**: 모든 테스트 PASS (멱등성, 405, 400 검증)

---

## 📅 **일정**

- **점검 시작**: 2025년 9월 15일
- **Phase 1 완료 목표**: 2025년 9월 20일
- **Phase 2 완료 목표**: 2025년 9월 25일
- **Phase 3 완료 목표**: 2025년 9월 30일

---

*🤖 Generated with [Claude Code](https://claude.ai/code)*
*Co-Authored-By: Claude <noreply@anthropic.com>*