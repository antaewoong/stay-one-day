# Stay One Day - 현재 API 목록

## 🏗️ 관리자(Admin) API

### 인증 & 사용자 관리
- `GET/POST /api/admin/admins` - 관리자 계정 관리
- `POST /api/admin/login` - 관리자 로그인
- `POST /api/admin/refresh-token` - 토큰 갱신
- `POST /api/admin/change-user-password` - 사용자 비밀번호 변경
- `GET/POST /api/admin/hosts` - 호스트 관리
- `GET/POST/PUT/DELETE /api/admin/hosts/[id]` - 개별 호스트 관리

### 숙소 관리
- `GET /api/admin/accommodations` - 숙소 목록 조회
- `POST /api/admin/group-kpi` - 관리자 그룹 KPI

### 예약 관리
- `GET /api/admin/reservations` - 예약 목록
- `GET/PUT /api/admin/reservations/[id]` - 개별 예약 관리
- `GET /api/admin/reservations/calendar` - 예약 캘린더

### 콘텐츠 관리
- `GET/POST/PUT/DELETE /api/admin/notices` - 공지사항 관리
- `GET/PUT /api/admin/notices/[id]` - 개별 공지사항
- `GET/POST /api/admin/hero-slides` - 히어로 슬라이드 관리
- `GET/POST /api/admin/hero-texts` - 히어로 텍스트 관리
- `GET/POST /api/admin/sections` - 섹션 관리

### 문의 관리
- `GET /api/admin/inquiries` - 문의사항 관리
- `GET/POST /api/admin/delete-requests` - 회원탈퇴 요청 관리
- `DELETE /api/admin/delete-requests/[id]` - 개별 탈퇴 요청

### 인플루언서 관리
- `GET/POST /api/admin/influencers` - 인플루언서 관리
- `GET/POST /api/admin/collaboration-requests` - 협찬 요청 관리
- `GET/POST /api/admin/influencer-notices` - 인플루언서 공지사항
- `GET/POST /api/admin/influencer-tokens` - 인플루언서 토큰 관리

### 텔레그램 관리
- `POST /api/admin/telegram/register` - 텔레그램 등록

### 데이터 & 스키마 관리
- `POST /api/admin/seed-data` - 시드 데이터 생성
- `POST /api/admin/seed-sections` - 섹션 시드 데이터
- `POST /api/admin/create-real-tables` - 실제 테이블 생성
- `POST /api/admin/setup-marketing` - 마케팅 설정
- `POST /api/admin/fix-schema` - 스키마 수정
- `POST /api/admin/fix-constraints` - 제약조건 수정
- `POST /api/admin/fix-accommodation-types-rls` - 숙소 타입 RLS 수정
- `POST /api/admin/schema/add-types-array` - 타입 배열 추가
- `POST /api/admin/update-hosts` - 호스트 업데이트

---

## 🏠 호스트(Host) API

### 인증
- `POST /api/host/login` - 호스트 로그인

### 대시보드 & 통계
- `GET /api/host/dashboard` - 호스트 대시보드
- `GET /api/host/stats` - 호스트 통계
- `POST /api/host/group-kpi` - 호스트 그룹 KPI

### 숙소 관리
- `GET /api/host/accommodations` - 호스트 숙소 목록

### 예약 관리
- `GET /api/host/reservations` - 호스트 예약 관리

### 문의 관리
- `GET /api/host/inquiries` - 호스트 문의사항

### 인플루언서 관리
- `GET /api/host/collaboration-requests` - 협찬 요청 관리
- `GET/POST /api/host/influencer-reviews` - 인플루언서 리뷰 관리
- `POST /api/host/influencer-reviews/reply` - 인플루언서 리뷰 답글

---

## 👤 인플루언서(Influencer) API

### 인증
- `POST /api/influencer/login` - 인플루언서 로그인

### 협찬 관리
- `POST /api/influencer/collaboration-request` - 협찬 신청
- `GET /api/influencer/current-period` - 현재 협찬 기간

### 토큰 & 검증
- `GET /api/influencer/verify-token/[token]` - 토큰 검증
- `GET /api/influencer/review-info/[token]` - 리뷰 정보 조회

### 리뷰 관리
- `POST /api/influencer/submit-review` - 리뷰 제출

### 공지사항
- `GET /api/influencer/notices` - 인플루언서 공지사항

---

## 🏨 숙소(Accommodations) API

### 기본 CRUD
- `GET/POST /api/accommodations` - 숙소 목록/생성
- `GET/PUT/DELETE /api/accommodations/[id]` - 개별 숙소 관리

### 데이터 업데이트
- `POST /api/accommodations/update-images` - 이미지 업데이트
- `POST /api/accommodations/update-stay-cheongju` - Stay 청주 데이터 업데이트

---

## 📋 예약(Reservations) API

### 기본 CRUD
- `GET/POST /api/reservations` - 예약 목록/생성
- `GET/PUT/DELETE /api/reservations/[id]` - 개별 예약 관리

---

## 📧 문의(Inquiries) API

### 기본 CRUD
- `GET/POST /api/inquiries` - 문의사항 목록/생성
- `GET/PUT/DELETE /api/inquiries/[id]` - 개별 문의 관리
- `GET/POST /api/inquiries/[id]/replies` - 문의 답글 관리

---

## ⭐ 리뷰(Reviews) API

### 기본 CRUD
- `GET/POST /api/reviews` - 리뷰 목록/생성
- `POST /api/reviews/[id]/reply` - 리뷰 답글

---

## 📢 공지사항(Notices) API

### 기본 CRUD
- `GET/POST /api/notices` - 공지사항 목록/생성
- `GET/PUT/DELETE /api/notices/[id]` - 개별 공지사항 관리

---

## 📊 분석(Analytics) API

### 이벤트 추적
- `POST /api/analytics/track-event` - 이벤트 추적
- `POST /api/analytics/track-session` - 세션 추적
- `POST /api/analytics/track-conversion` - 전환 추적

### 분석 데이터
- `GET /api/analytics/sessions` - 세션 분석
- `GET /api/analytics/journey` - 사용자 여정 분석

---

## 🤖 AI API

### 마케팅 분석
- `POST /api/ai/marketing-insights` - 마케팅 인사이트
- `POST /api/ai/marketing-analysis` - 마케팅 분석
- `POST /api/ai/marketing-performance` - 마케팅 성과 분석
- `POST /api/ai/competitive-analysis` - 경쟁사 분석
- `POST /api/ai/naver-place-optimization` - 네이버 플레이스 최적화

### 인플루언서 관련
- `POST /api/ai/influencer-evaluation` - 인플루언서 평가

---

## 📈 마케팅(Marketing) API

- `POST /api/marketing/intelligence` - 마케팅 인텔리전스

---

## 🔐 인증(Auth) API

- `POST /api/auth/change-password` - 비밀번호 변경

---

## 👤 프로필(Profile) API

- `GET/PUT /api/profile` - 사용자 프로필

---

## 💰 결제(Payment) API

- `POST /api/payment/confirm` - 결제 확인

---

## 🎟️ 할인 코드(Discount Codes) API

- `POST /api/discount-codes/validate` - 할인 코드 검증

---

## 💌 연락처(Contact) API

- `POST /api/contact` - 연락처 문의
- `POST /api/partner-inquiry` - 파트너 문의
- `POST /api/partnership` - 파트너십 신청

---

## ❤️ 위시리스트(Wishlists) API

- `GET/POST /api/wishlists` - 위시리스트 관리

---

## 📅 휴일(Holidays) API

- `GET /api/holidays` - 휴일 정보

---

## 🔔 알림(Notifications) API

- `POST /api/notifications/webhook` - 웹훅 알림

---

## 📱 텔레그램(Telegram) API

- `POST /api/telegram/webhook` - 텔레그램 웹훅

---

## 🛠️ 디버그(Debug) API

- `GET /api/debug/user-roles` - 사용자 역할 디버그

---

## 🗃️ 기타 데이터 API

- `POST /api/insert-real-data` - 실제 데이터 삽입

---

## 📋 현재 상태 요약

### ✅ 작동하는 API
- 대부분의 기본 CRUD 작업
- 인증 관련 API
- 관리자 기능
- 호스트 기능
- 마케팅 분석 (일부)

### ⚠️ 문제가 있는 API
- 일부 Analytics API (401 에러)
- 인플루언서 관련 기능 (500 에러)
- Group KPI 관련 기능

### 🏗️ RLS 정책으로 처리되는 항목
- 모든 데이터 접근은 RLS 정책을 통해 권한 제어
- API 라우트는 최소화하고 클라이언트에서 직접 Supabase 사용 권장
- 관리자/호스트/인플루언서별 데이터 접근 권한은 RLS로 관리

### 🔧 개선 방향
- 불필요한 API 라우트 제거
- RLS 정책으로 모든 권한 관리 통일
- 클라이언트에서 직접 Supabase 클라이언트 사용
- API 라우트는 복잡한 비즈니스 로직이나 외부 서비스 연동에만 사용
